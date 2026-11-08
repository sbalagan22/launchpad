import { z } from "zod";
import { CatalogEntry, CertClaim, type CertStatus, type Db } from "@/schemas";
import { CertDetail, ClaimView, Pathway } from "@/schemas/views";
import { newId } from "@/lib/ids";
import { daysFromNow } from "@/lib/dates";
import { matchFormat, normalizeCredential } from "@/lib/verify-patterns";
import { PATHWAYS } from "@/mocks/catalog";
import { getDb, useApp } from "@/store";
import type { CertsApi, VerifyEvent } from "./contract";
import { ServiceError, latency, parseInput, read, write } from "./core";
import { requireStudent } from "./helpers";

const viewOf = (db: Db, claim: CertClaim) => ({ claim, entry: db.catalog.find((c) => c.id === claim.certId) ?? null });

async function tryReal(input: string, holder: string, certName: string): Promise<{ outcome: string; reason?: string; issuedAt?: string } | null> {
  try {
    const res = await fetch("/api/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ input, holder, certName }) });
    if (!res.ok) return null;
    const json: { source?: string; result?: { outcome: string; reason?: string; issuedAt?: string } } = await res.json();
    return json.source === "real" ? json.result ?? null : null;
  } catch {
    return null;
  }
}

function upsertClaim(db: Db, studentId: string, patch: Omit<CertClaim, "id" | "studentId" | "createdAt">): { db: Db; claim: CertClaim } {
  const prior = db.certClaims.find((c) => c.studentId === studentId && c.certId === patch.certId && (patch.certId !== "other" || c.customName === patch.customName));
  const claim: CertClaim = CertClaim.parse({ ...patch, id: prior?.id ?? newId("clm"), studentId, createdAt: prior?.createdAt ?? new Date().toISOString() });
  return { db: { ...db, certClaims: prior ? db.certClaims.map((c) => (c.id === prior.id ? claim : c)) : [...db.certClaims, claim] }, claim };
}

export const certs: CertsApi = {
  async catalog(filters = {}) {
    return read(z.array(CatalogEntry), (db) => {
      const needle = (filters.q ?? "").trim().toLowerCase();
      return db.catalog
        .filter((c) => !filters.category || c.category === filters.category)
        .filter((c) => filters.maxCostUsd === undefined || (c.costUsd ?? 0) <= filters.maxCostUsd)
        .filter((c) => !needle || [c.name, c.issuer, c.category, c.unlocksTags.join(" ")].join(" ").toLowerCase().includes(needle));
    });
  },

  async getCert(id) {
    return read(CertDetail, (db) => {
      const entry = db.catalog.find((c) => c.id === id);
      if (!entry) throw new ServiceError("not_found", "Certification not found.");
      const s = useApp.getState().session;
      return {
        entry,
        strengthens: db.projects.filter((p) => p.status === "open" && p.strengthenedBy.includes(id)).map((p) => ({ projectId: p.id, title: p.title, business: db.businesses.find((b) => b.id === p.businessId)!.name })),
        myClaim: s.role === "student" ? db.certClaims.find((c) => c.studentId === s.userId && c.certId === id) ?? null : null,
      };
    });
  },

  async myCerts() {
    return read(z.array(ClaimView), (db) => {
      const s = requireStudent(db);
      return db.certClaims.filter((c) => c.studentId === s.id).map((c) => viewOf(db, c));
    });
  },

  async addSelfReported(certId, opts = {}) {
    const status = opts.status ?? "earned";
    if (certId === "other" && !opts.customName?.trim()) throw new ServiceError("invalid_input", "Enter the certification name.");
    return write(CertClaim, (db) => {
      const s = requireStudent(db);
      if (certId !== "other" && !db.catalog.some((c) => c.id === certId)) throw new ServiceError("not_found", "Certification not found.");
      const prior = db.certClaims.find((c) => c.studentId === s.id && c.certId === certId && (certId !== "other" || c.customName === opts.customName));
      if (prior?.tier === "issuer") throw new ServiceError("duplicate", "That certification is already verified with the issuer.");
      // A self-reported claim stays "Not verified", whether or not a file is attached.
      const { db: next, claim } = upsertClaim(db, s.id, { certId, customName: opts.customName?.trim(), tier: "self", status, fileName: opts.fileName });
      return { db: next, result: claim };
    });
  },

  async *verifyWithIssuer(certId, input): AsyncGenerator<VerifyEvent> {
    const value = parseInput(z.string().trim().min(4, "Enter a credential ID or verification link."), input);
    const db0 = getDb();
    const student = requireStudent(db0);
    const entry = db0.catalog.find((c) => c.id === certId);
    if (!entry) throw new ServiceError("not_found", "Certification not found.");
    const step = (id: Extract<VerifyEvent, { kind: "step" }>["id"], label: string, status: "running" | "ok" | "failed", detail?: string): VerifyEvent => ({ kind: "step", id, label, status, detail });
    const pause = () => latency(300, 650);
    const fail = (code: Extract<VerifyEvent, { kind: "failed" }>["code"], reason: string): VerifyEvent => ({ kind: "failed", code, reason });
    const demo = entry.demoIds.find((d) => normalizeCredential(d.value) === normalizeCredential(value));

    yield step("format", "Checking the link or ID format", "running");
    await pause();
    // For entries whose verification method is not confirmed, the mock accepts only the demo IDs.
    const fmt = matchFormat(entry.issuerKey, value);
    if (!fmt.ok) { yield step("format", "Checking the link or ID format", "failed", fmt.hint); yield fail("bad_format", `That does not look like a ${entry.issuer} credential. ${fmt.hint}`); return; }
    yield step("format", "Checking the link or ID format", "ok", fmt.format);

    yield step("issuer_supported", "Checking the issuer is supported", "running");
    await pause();
    if (!entry.verificationConfirmed && !demo) {
      yield step("issuer_supported", "Checking the issuer is supported", "failed", "Verification method to be confirmed");
      yield fail("unconfirmed_method", `${entry.issuer} verification is not confirmed yet, so only demo IDs work. You can add this certification as self-reported.`);
      return;
    }
    yield step("issuer_supported", "Checking the issuer is supported", "ok", entry.verificationConfirmed ? entry.issuer : `${entry.issuer} (demo IDs only)`);

    yield step("contact_issuer", "Contacting the issuer page", "running");
    const real = await tryReal(value, student.name, entry.name);
    if (real) {
      await pause();
      if (real.outcome === "unparsed") { yield step("contact_issuer", "Contacting the issuer page", "failed", real.reason); yield fail("unreachable", `${real.reason} You can add this certification as self-reported instead.`); return; }
      yield step("contact_issuer", "Contacting the issuer page", "ok");
      yield step("match", "Matching your name and the certification", "running"); await pause();
      if (real.outcome === "mismatch") { yield step("match", "Matching your name and the certification", "failed", real.reason); yield fail("name_mismatch", real.reason ?? "The name does not match."); return; }
      yield step("match", "Matching your name and the certification", "ok");
      yield step("dates", "Reading issue and expiry dates", "running"); await pause(); yield step("dates", "Reading issue and expiry dates", "ok");
      const issuedAt = real.issuedAt ? new Date(real.issuedAt).toISOString() : new Date().toISOString();
      let claim!: CertClaim;
      await write(CertClaim, (db) => { const r = upsertClaim(db, student.id, { certId, tier: "issuer", status: "earned", credentialRef: value, issuedAt, issuerUrl: value.startsWith("http") ? value : undefined }); claim = r.claim; return { db: r.db, result: r.claim }; });
      yield { kind: "done", tier: "issuer", claim };
      return;
    }
    // MOCK: deterministic lookup of demo IDs. Anything formatted correctly but not in the table is "not found" at the issuer.
    await pause();
    if (!demo) { yield step("contact_issuer", "Contacting the issuer page", "failed", "No record found"); yield fail("not_found", `${entry.issuer} has no record for that credential. Check the ID, or add it as self-reported.`); return; }
    yield step("contact_issuer", "Contacting the issuer page", "ok", "Record found");

    yield step("match", "Matching your name and the certification", "running");
    await pause();
    if (demo.outcome === "fail" && demo.code === "not_found") { yield step("match", "Matching your name and the certification", "failed", "No record"); yield fail("not_found", demo.reason ?? "No record found."); return; }
    if (demo.holder && demo.holder.toLowerCase() !== student.name.toLowerCase()) {
      yield step("match", "Matching your name and the certification", "failed", `Issued to ${demo.holder}`);
      yield fail("name_mismatch", demo.reason ?? `That credential was issued to ${demo.holder}, not ${student.name}.`);
      return;
    }
    yield step("match", "Matching your name and the certification", "ok", demo.certName ?? entry.name);

    yield step("dates", "Reading issue and expiry dates", "running");
    await pause();
    const expired = demo.expiresAt ? new Date(demo.expiresAt).getTime() < Date.now() : false;
    if (demo.outcome === "fail" || expired) {
      yield step("dates", "Reading issue and expiry dates", "failed", demo.expiresAt ? `Expired ${demo.expiresAt.slice(0, 10)}` : demo.reason);
      yield fail("expired", demo.reason ?? "That credential has expired.");
      return;
    }
    yield step("dates", "Reading issue and expiry dates", "ok", `Issued ${(demo.issuedAt ?? daysFromNow(0)).slice(0, 10)}${demo.expiresAt ? `, expires ${demo.expiresAt.slice(0, 10)}` : ", no expiry"}`);
    let claim!: CertClaim;
    await write(CertClaim, (db) => {
      const r = upsertClaim(db, student.id, { certId, tier: "issuer", status: "earned", credentialRef: value, issuedAt: demo.issuedAt ?? new Date().toISOString(), expiresAt: demo.expiresAt, issuerUrl: value.startsWith("http") ? value : undefined });
      claim = r.claim;
      return { db: r.db, result: r.claim };
    });
    yield { kind: "done", tier: "issuer", claim };
  },

  async setRoadmapStatus(certId, status: CertStatus) {
    return write(CertClaim, (db) => {
      const s = requireStudent(db);
      if (certId !== "other" && !db.catalog.some((c) => c.id === certId)) throw new ServiceError("not_found", "Certification not found.");
      const prior = db.certClaims.find((c) => c.studentId === s.id && c.certId === certId);
      if (prior?.tier === "issuer" && status !== "earned") throw new ServiceError("invalid_state", "An issuer-verified certification is earned. It cannot move back on your roadmap.");
      if (prior?.tier === "issuer") return { db, result: prior };
      const { db: next, claim } = upsertClaim(db, s.id, { certId, customName: prior?.customName, tier: "self", status, fileName: prior?.fileName });
      return { db: next, result: claim };
    });
  },

  async pathways() {
    return read(z.array(Pathway), (db) => {
      const s = useApp.getState().session;
      return PATHWAYS.map((p) => ({
        id: p.id, name: p.name, description: p.description,
        steps: p.steps.map((id) => ({ entry: db.catalog.find((c) => c.id === id)!, claim: s.role === "student" ? db.certClaims.find((c) => c.studentId === s.userId && c.certId === id) ?? null : null })),
      }));
    });
  },
};
