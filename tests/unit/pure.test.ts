import { describe, it, expect } from "vitest";
import { computeMatch } from "@/lib/matching";
import { parseSafeUrl, isSafeRedirect, isAllowedHost } from "@/lib/verify-guard";
import { buildSeed } from "@/mocks/seed";
import { canMoveTo } from "@/services/pipeline";
import { missingFor } from "@/services/projects";
import { improvementsFor } from "@/services/scoping";

const db = buildSeed();

describe("match score", () => {
  const student = db.students.find((s) => s.id === "stu_aisha")!;
  const project = db.projects.find((p) => p.strengthenedBy.length > 0 && p.status === "open")!;
  const cert = project.strengthenedBy[0];
  const base = { id: "c", studentId: student.id, certId: cert, status: "earned" as const, createdAt: new Date().toISOString() };
  const issuer = { ...base, tier: "issuer" as const, credentialRef: "x", issuedAt: new Date().toISOString() };
  const self = { ...base, tier: "self" as const };
  it("returns 0 to 100 with 4 to 5 reasons", () => {
    const m = computeMatch(student, project, [], db.catalog, db.reviews);
    expect(m.score).toBeGreaterThanOrEqual(0);
    expect(m.score).toBeLessThanOrEqual(100);
    expect(m.reasons.length).toBeGreaterThanOrEqual(4);
    expect(m.reasons.length).toBeLessThanOrEqual(5);
  });
  it("issuer boost beats self boost", () => {
    const a = computeMatch(student, project, [issuer], db.catalog).certBoost.points;
    const b = computeMatch(student, project, [self], db.catalog).certBoost.points;
    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(0);
  });
  it("gives no boost for certs the project does not list, or unearned ones", () => {
    expect(computeMatch(student, project, [{ ...issuer, certId: "not-listed" }], db.catalog).certBoost.points).toBe(0);
    expect(computeMatch(student, project, [{ ...self, status: "planned" as const }], db.catalog).certBoost.points).toBe(0);
  });
  it("hits the persona match scores closely", () => {
    const score = (sid: string, pid: string) => computeMatch(db.students.find((s) => s.id === sid)!, db.projects.find((p) => p.id === pid)!, db.certClaims.filter((c) => c.studentId === sid), db.catalog, db.reviews).score;
    expect(score("stu_aisha", "prj_reroute_mvp")).toBeGreaterThanOrEqual(90);
    expect(score("stu_aisha", "prj_reroute_disc")).toBeLessThan(40);
    expect(score("stu_priya", "prj_reroute_disc")).toBeGreaterThanOrEqual(88);
    expect(score("stu_priya", "prj_reroute_mvp")).toBeLessThan(40);
  });
});

describe("publish gate", () => {
  const ok = { deliverables: ["A site"], milestones: [{}, {}], hours: 12, acceptance: ["a", "b", "c"], payType: "stipend", pay: 240, sponsorStipend: 0 };
  it("passes a complete brief", () => expect(missingFor(ok)).toEqual([]));
  it("lists missing items in plain words", () => {
    const m = missingFor({ ...ok, deliverables: [], milestones: [{}], acceptance: ["a"], pay: 0 });
    expect(m.join(" ")).toMatch(/deliverable/);
    expect(m.join(" ")).toMatch(/2 milestones/);
    expect(m.join(" ")).toMatch(/acceptance/);
    expect(m.join(" ")).toMatch(/pay line/);
  });
  it("rejects hours over 25", () => expect(missingFor({ ...ok, hours: 30 }).join(" ")).toMatch(/hours/));
  it("suggestions contain no numeric scores", () => {
    const text = improvementsFor({ ...db.projects[0], deliverables: [], acceptance: [] }).join(" ");
    expect(text).not.toMatch(/\b\d+\/100|score/i);
  });
});

describe("SSRF guard", () => {
  it("accepts allowlisted https hosts", () => {
    expect(parseSafeUrl("https://www.credly.com/badges/abc")).not.toBeNull();
    expect(isAllowedHost("learn.microsoft.com")).toBe(true);
  });
  it.each(["http://www.credly.com/badges/abc", "https://127.0.0.1/x", "https://localhost/x", "https://169.254.169.254/latest", "https://user:pw@www.credly.com/x", "https://www.credly.com:8443/x", "https://[::1]/x", "https://2130706433/x", "https://internal/x", "not a url"])("rejects %s", (u) => {
    expect(parseSafeUrl(u)).toBeNull();
  });
  it("does not allow arbitrary hosts or cross-host redirects", () => {
    expect(isAllowedHost("evil.example.com")).toBe(false);
    expect(isSafeRedirect("https://www.credly.com/a", "https://evil.example.com/b")).toBe(false);
  });
});

describe("pipeline transitions", () => {
  it("allows offer only after a finally approved project with the poster", () => {
    const e = db.pipeline.find((h) => !db.projects.some((p) => p.businessId === h.businessId && p.studentId === h.studentId && p.status === "completed"))!;
    expect(canMoveTo(db, e, "offer").ok).toBe(false);
    const done = db.projects.find((p) => p.status === "completed" && p.studentId)!;
    const entry = { id: "h", businessId: done.businessId, studentId: done.studentId!, projectId: done.id, stage: "trial" as const, updatedAt: new Date().toISOString() };
    expect(canMoveTo(db, entry, "offer").ok).toBe(true);
    expect(canMoveTo(db, entry, "interviewing").ok).toBe(true);
  });
});
