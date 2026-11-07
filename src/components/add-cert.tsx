"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { Certification } from "@/schemas";
import { Badge, Button, Card, Input, Modal, Segmented, Select, Spinner, TrustBadge, toast } from "@/components/ui";
import { certs, ServiceError } from "@/services";
import { useQuery } from "@/hooks/use-query";

type Tier = "issuer" | "checked" | "self";
type Lookup = Awaited<ReturnType<typeof certs.lookupCredential>>;

export function AddCertCard({ studentId, library }: { studentId: string; library: Certification[] }) {
  const [tier, setTier] = useState<Tier>("issuer");
  const [input, setInput] = useState("AI900-90317");
  const [checking, setChecking] = useState(false);
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [certId, setCertId] = useState("");
  const [file, setFile] = useState<string>("");
  const [quizOpen, setQuizOpen] = useState(false);
  const options = [{ value: "", label: "Choose a certification" }, ...library.map((c) => ({ value: c.id, label: `${c.name} (${c.provider})` }))];

  const verify = async () => {
    setError(null); setLookup(null); setChecking(true);
    try { setLookup(await certs.lookupCredential(studentId, input)); }
    catch (e) { setError(e instanceof ServiceError ? e.message : "Verification failed."); }
    finally { setChecking(false); }
  };
  const addIssuer = async () => {
    if (!lookup) return;
    setAdding(true);
    try { await certs.confirmIssuerClaim(studentId, lookup.credentialId); toast.success(`${lookup.certName} added as issuer verified.`); setLookup(null); setInput(""); }
    catch (e) { toast.error(e instanceof ServiceError ? e.message : "Could not add."); }
    finally { setAdding(false); }
  };
  const addSelf = async () => {
    if (!certId) return setError("Choose a certification.");
    setAdding(true); setError(null);
    try { await certs.addSelfReported(studentId, certId, file || undefined); toast.info("Added as self-reported. It stays unverified until confirmed."); setCertId(""); setFile(""); }
    catch (e) { setError(e instanceof ServiceError ? e.message : "Could not add."); }
    finally { setAdding(false); }
  };

  return (
    <Card as="section" aria-label="Add a certification" className="p-6">
      <div className="text-base font-semibold text-ink mb-1">Add a certification</div>
      <p className="text-sm mb-4">Pick how it should be confirmed. The trust level shows on your public profile.</p>
      <div className="mb-4"><Segmented label="Trust level" value={tier} onChange={(t) => { setTier(t); setError(null); }} options={[{ value: "issuer", label: "Issuer" }, { value: "checked", label: "Quiz" }, { value: "self", label: "Self" }]} /></div>

      {tier === "issuer" && (
        <div>
          <Input label="Credential ID or verification URL" value={input} onChange={(e) => { setInput(e.target.value); setLookup(null); setError(null); }} error={error} hint="Demo IDs: GUX-48213-AK, AI900-90317" />
          <Button full className="mt-2" onClick={verify} disabled={checking}>Verify</Button>
          {checking && <div role="status" className="flex gap-2 items-center mt-4 text-sm"><Spinner />Checking with the issuer</div>}
          {lookup && (
            <div className="mt-6 border-t border-line pt-4 animate-rise" data-testid="lookup-result">
              <div className="mb-2"><TrustBadge trust="issuer" /></div>
              <div className="text-base font-semibold text-ink">{lookup.certName}</div>
              <div className="text-sm mb-4">Issued to {lookup.issuedTo} by {lookup.provider}, {lookup.issued}.</div>
              <Button variant="secondary" onClick={addIssuer} loading={adding}>Add to profile</Button>
            </div>
          )}
        </div>
      )}

      {tier === "checked" && (
        <div className="flex flex-col gap-3">
          <Select label="Certification" value={certId} onChange={(e) => setCertId(e.target.value)} options={options} />
          <p className="text-sm">Answer three short questions. Two correct answers earn the <b className="text-ink">Skill checked</b> level. It is weaker than an issuer-confirmed credential.</p>
          <Button variant="secondary" disabled={!certId} onClick={() => setQuizOpen(true)}>Start skill check</Button>
          {quizOpen && certId && <QuizModal studentId={studentId} certId={certId} certName={library.find((c) => c.id === certId)?.name ?? ""} onClose={() => setQuizOpen(false)} />}
        </div>
      )}

      {tier === "self" && (
        <div className="flex flex-col gap-3">
          <Select label="Certification" value={certId} onChange={(e) => setCertId(e.target.value)} options={options} />
          <label className="text-xs font-medium text-body flex flex-col gap-1">Certificate file (optional)
            <input type="file" onChange={(e) => setFile(e.target.files?.[0]?.name ?? "")} className="text-sm font-normal" />
          </label>
          <p className="text-sm flex items-start gap-2"><Badge tone="neutral">Unverified</Badge><span>A file is stored by name only. Uploading a certificate never marks it verified.</span></p>
          {error && <p role="alert" className="text-xs text-bad">{error}</p>}
          <Button variant="secondary" onClick={addSelf} loading={adding}>Add as self-reported</Button>
        </div>
      )}
    </Card>
  );
}

function QuizModal({ studentId, certId, certName, onClose }: { studentId: string; certId: string; certName: string; onClose: () => void }) {
  const { data: quiz, loading } = useQuery(`quiz:${certId}`, () => certs.getQuiz(certId));
  const [answers, setAnswers] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ passed: boolean; score: number; total: number } | null>(null);
  const submit = async () => {
    setBusy(true);
    try { const r = await certs.submitQuiz(studentId, certId, answers); setResult(r); if (r.passed) toast.success(`${certName} is now Skill checked.`); }
    catch (e) { toast.error(e instanceof ServiceError ? e.message : "Could not submit the quiz."); }
    finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={`Skill check: ${certName}`}>
      <h2 className="h2 mb-1">Skill check</h2>
      <p className="text-sm mb-6">{certName}. Pass mark: 2 of 3.</p>
      {result ? (
        <div role="status">
          <p className="text-base text-ink mb-2">{result.passed ? `Passed with ${result.score} of ${result.total}. This skill is now Skill checked on your profile.` : `You scored ${result.score} of ${result.total}. Nothing was added. Review the material and try again.`}</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      ) : loading || !quiz ? <Spinner /> : (
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="flex flex-col gap-6">
          {quiz.map((q, qi) => (
            <fieldset key={q.q} className="border-0 p-0 m-0">
              <legend className="text-sm font-semibold text-ink mb-2">{qi + 1}. {q.q}</legend>
              {q.options.map((o, oi) => (
                <label key={o} className="flex gap-2 items-start text-sm py-1 cursor-pointer"><input type="radio" name={`q${qi}`} checked={answers[qi] === oi} onChange={() => setAnswers((a) => { const n = [...a]; n[qi] = oi; return n; })} className="mt-1 accent-brand" />{o}</label>
              ))}
            </fieldset>
          ))}
          <div className="flex justify-end gap-2"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy} disabled={answers.filter((a) => a !== undefined).length < quiz.length}>Submit answers</Button></div>
        </form>
      )}
    </Modal>
  );
}

export function CertRow({ cert, status }: { cert: Certification; status?: "issuer" | "checked" | "self" }) {
  return (
    <a href={cert.url} target="_blank" rel="noreferrer" className="flex justify-between items-center gap-4 px-6 py-4 border-t border-line first:border-t-0 text-ink! hover:bg-surface transition-colors">
      <div>
        <div className="text-sm font-semibold flex gap-2 items-center flex-wrap">{cert.name}{status && <TrustBadge trust={status} />}</div>
        <div className="text-xs text-body">{cert.provider}{cert.issuedVia ? `, ${cert.issuedVia}` : ""} · {cert.length} · about {cert.hours} hours</div>
      </div>
      <span className="flex gap-1 items-center text-sm font-semibold text-brand whitespace-nowrap">Open course<ExternalLink size={16} aria-hidden /></span>
    </a>
  );
}
