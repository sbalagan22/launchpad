"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { DrawCheck } from "@/components/motion";
import { Button, Input, Modal, Select, Stepper, WhatNext, toast, type StepState } from "@/components/ui";
import { certs, type VerifyEvent } from "@/services";
import type { CatalogEntry, CertStatus } from "@/schemas";

const STEPS = [
  { id: "format", label: "Checking the link or ID format" },
  { id: "issuer_supported", label: "Checking the issuer is supported" },
  { id: "contact_issuer", label: "Contacting the issuer page" },
  { id: "match", label: "Matching your name and the certification" },
  { id: "dates", label: "Reading issue and expiry dates" },
] as const;

/** 3-step add flow: choose, choose method (issuer check or self-reported), result. */
export function AddCertFlow({ open, onClose, catalog, initialCertId }: { open: boolean; onClose: () => void; catalog: CatalogEntry[]; initialCertId?: string }) {
  const [step, setStep] = useState<1 | 2 | 3>(initialCertId ? 2 : 1);
  const [certId, setCertId] = useState(initialCertId ?? "");
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<"issuer" | "self">("issuer");
  const [ref, setRef] = useState("");
  const [status, setStatus] = useState<CertStatus>("earned");
  const [err, setErr] = useState<string | null>(null);
  const [states, setStates] = useState<Record<string, { state: StepState; detail?: string }>>({});
  const [outcome, setOutcome] = useState<null | { ok: true } | { ok: false; reason: string }>(null);
  const [busy, setBusy] = useState(false);

  const entry = catalog.find((c) => c.id === certId);

  const next = () => {
    if (!certId) return setErr("Choose a certification.");
    if (certId === "other" && !custom.trim()) return setErr("Enter the certification name.");
    setErr(null); setStep(2);
  };

  const addSelf = async () => {
    setBusy(true);
    try { await certs.addSelfReported(certId, { customName: certId === "other" ? custom : undefined, status }); toast.success("Added as self-reported. It shows as Not verified."); onClose(); } catch (e) { setErr(e instanceof Error ? e.message : "Could not add"); } finally { setBusy(false); }
  };

  const verify = async () => {
    if (ref.trim().length < 4) return setErr("Enter your credential ID or verification link.");
    setErr(null); setStep(3); setOutcome(null);
    setStates(Object.fromEntries(STEPS.map((s) => [s.id, { state: "pending" as StepState }])));
    setBusy(true);
    try {
      for await (const ev of certs.verifyWithIssuer(certId, ref) as AsyncIterable<VerifyEvent>) {
        if (ev.kind === "step") setStates((m) => ({ ...m, [ev.id]: { state: ev.status === "running" ? "running" : ev.status, detail: ev.detail } }));
        else if (ev.kind === "done") setOutcome({ ok: true });
        else setOutcome({ ok: false, reason: ev.reason });
      }
    } catch (e) {
      setOutcome({ ok: false, reason: e instanceof Error ? e.message : "Verification failed" });
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add a certification" wide>
      <h2 className="h3 mb-1">Add a certification</h2>
      <p className="text-xs mb-4" aria-live="polite">Step {step} of 3</p>
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <Select label="Certification" value={certId} onChange={(e) => { setCertId(e.target.value); setErr(null); }} options={[{ value: "", label: "Choose one" }, ...catalog.map((c) => ({ value: c.id, label: c.name })), { value: "other", label: "Other (not in the catalog)" }]} />
          {certId === "other" && <Input label="Certification name" value={custom} onChange={(e) => setCustom(e.target.value)} />}
          {err && <p role="alert" className="text-sm text-bad">{err}</p>}
          <div className="flex justify-end"><Button onClick={next}>Continue</Button></div>
        </div>
      )}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm"><b className="text-ink font-semibold">{entry?.name ?? custom}</b></p>
          <div role="radiogroup" aria-label="How do you want to add it" className="grid sm:grid-cols-2 gap-3">
            {([["issuer", "Verify with the issuer", "Paste your credential ID or link. Launchpad checks it against the issuer."], ["self", "Add as self-reported", "Shows as Not verified. Uploading a certificate file does not verify it."]] as const).map(([v, t, b]) => (
              <button key={v} type="button" role="radio" aria-checked={method === v} disabled={v === "issuer" && certId === "other"} onClick={() => { setMethod(v); setErr(null); }} className={`text-left rounded-card border p-4 cursor-pointer disabled:opacity-50 ${method === v ? "border-brand bg-tint" : "border-line bg-white hover:bg-surface"}`}>
                <b className="text-ink font-semibold text-sm">{t}</b><p className="text-xs mt-1">{b}</p>
              </button>
            ))}
          </div>
          {method === "issuer" ? (
            <>
              <Input label="Credential ID or verification link" value={ref} onChange={(e) => { setRef(e.target.value); setErr(null); }} error={err} hint={entry ? entry.verification : undefined} />
              {entry && !entry.verificationConfirmed && <p className="text-xs text-warn bg-warn-bg rounded-control p-3">The issuer&apos;s verification method for this certification is not confirmed yet. Only demo IDs work for now. You can add it as self-reported instead.</p>}
              {entry && entry.demoIds.length > 0 && <p className="text-xs">Demo mode: try <code className="font-mono bg-surface px-1 rounded">{entry.demoIds.find((d) => d.outcome === "pass")?.value}</code> (passes) or <code className="font-mono bg-surface px-1 rounded">{entry.demoIds.find((d) => d.outcome === "fail")?.value}</code> (fails).</p>}
            </>
          ) : (
            <>
              <Select label="Where is it on your roadmap?" value={status} onChange={(e) => setStatus(e.target.value as CertStatus)} options={[{ value: "earned", label: "Earned" }, { value: "in_progress", label: "In progress" }, { value: "planned", label: "Planned" }]} />
              {err && <p role="alert" className="text-sm text-bad">{err}</p>}
            </>
          )}
          <div className="flex justify-between gap-2"><Button variant="secondary" onClick={() => setStep(1)}>Back</Button>{method === "issuer" ? <Button onClick={verify} data-testid="verify-btn">Verify with issuer</Button> : <Button onClick={addSelf} loading={busy}>Add as self-reported</Button>}</div>
        </div>
      )}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <Stepper label="Verification steps" steps={STEPS.map((s) => ({ id: s.id, label: s.label, state: states[s.id]?.state ?? "pending", detail: states[s.id]?.detail }))} />
          {outcome?.ok === true && (
            <div className="flex items-center gap-3 bg-ok-bg rounded-card p-4" role="status" data-testid="verify-ok"><DrawCheck size={32} className="text-ok" /><div><b className="text-ink font-semibold">Issuer verified</b><p className="text-sm">{entry?.name} now shows the red check on your profile.</p></div></div>
          )}
          {outcome?.ok === false && (
            <div role="alert" className="bg-bad-bg rounded-card p-4" data-testid="verify-fail">
              <b className="text-ink font-semibold">We could not verify that</b><p className="text-sm mt-1">{outcome.reason}</p>
              <div className="flex gap-2 mt-3 flex-wrap"><Button variant="secondary" size="sm" onClick={() => setStep(2)}>Try again</Button><Button size="sm" onClick={addSelf} loading={busy}>Add as self-reported</Button></div>
            </div>
          )}
          {outcome?.ok === true && <div className="flex justify-end"><Button onClick={onClose}>Done</Button></div>}
          {!outcome && <WhatNext steps={["Launchpad contacts the issuer page.", "If the credential matches your name, it is marked Issuer verified.", "If not, you can retry or add it as self-reported."]} />}
        </div>
      )}
    </Modal>
  );
}
export { CheckCircle2 };
