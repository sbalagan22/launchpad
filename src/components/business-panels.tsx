"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import type { WorkspaceView } from "@/schemas/views";
import { AiNote, Badge, Button, Card, EmptyState, ErrorState, Modal, Skeleton, Stars, Textarea, TrustBadge, toast } from "@/components/ui";
import { applications, workspace, ServiceError } from "@/services";
import { useQuery } from "@/hooks/use-query";
import { money } from "@/lib/pay";
import { relTime } from "@/lib/dates";

export function ApplicantsPanel({ projectId }: { projectId: string }) {
  const { data, error, loading, refetch } = useQuery(`applicants:${projectId}`, () => applications.listForProject(projectId));
  const [pick, setPick] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (loading || !data) return <Skeleton className="h-48 w-full" />;
  if (!data.length) return <EmptyState title="No applicants yet" body="Matching students have been notified. Proposals appear here as they arrive." />;
  const sel = data.find((a) => a.application.id === pick) ?? data[0];
  const s = sel.student;

  const decide = async (id: string, d: "accepted" | "rejected") => {
    setBusy(id + d);
    try { await applications.decide(id, d); toast.success(d === "accepted" ? `${s.name} accepted. A workspace and chat were created.` : "Applicant declined."); }
    catch (e) { toast.error(e instanceof ServiceError ? e.message : "Could not update the application."); }
    finally { setBusy(null); }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden" as="section" aria-label="Applicants">
        {data.map(({ application: a, student, match }) => (
          <button key={a.id} type="button" aria-pressed={sel.application.id === a.id} onClick={() => setPick(a.id)} className={`w-full text-left flex justify-between items-center gap-4 p-4 border-t border-line first:border-t-0 cursor-pointer hover:bg-surface ${sel.application.id === a.id ? "bg-surface" : "bg-white"}`}>
            <span><span className="block text-sm font-semibold text-ink">{student.name}</span><span className="block text-xs">{student.school}{a.status !== "pending" && ` · ${a.status}`}</span></span>
            <b className="text-sm font-semibold text-ink">{match.percent}%</b>
          </button>
        ))}
      </Card>
      <Card className="p-6 animate-rise" as="section" aria-label={`Profile preview for ${s.name}`}>
        <div className="text-xs font-medium mb-2">Profile preview</div>
        <div className="text-xl font-semibold tracking-[-0.02em] text-ink leading-tight">{s.name}</div>
        <div className="text-sm mb-4">{s.school} · {s.field}</div>
        <div className="mb-4">
          {s.skills.filter((k) => sel.match.matching.includes(k.name)).concat(s.skills.filter((k) => !sel.match.matching.includes(k.name)).slice(0, Math.max(0, 3 - sel.match.matching.length))).slice(0, 4).map((k) => (
            <div key={k.name} className="flex justify-between items-center py-2 border-t border-line text-sm"><span className="font-medium text-ink">{k.name}</span><TrustBadge trust={k.trust} /></div>
          ))}
        </div>
        <div className="text-xs font-medium mb-1">Proposal</div>
        <p className="text-sm whitespace-pre-line mb-4 max-h-48 overflow-auto">{sel.application.proposal}</p>
        <p className="text-xs mb-4">{sel.match.percent}% match. Matching skills: {sel.match.matching.join(", ") || "none"}.</p>
        <div className="flex gap-2 flex-wrap items-center">
          {sel.application.status === "pending" ? (
            <>
              <Button onClick={() => decide(sel.application.id, "accepted")} loading={busy === sel.application.id + "accepted"} disabled={sel.project.status !== "open"}><Check size={16} aria-hidden />Accept</Button>
              <Button variant="secondary" onClick={() => decide(sel.application.id, "rejected")} loading={busy === sel.application.id + "rejected"}><X size={16} aria-hidden />Decline</Button>
            </>
          ) : <Badge tone={sel.application.status === "accepted" ? "ok" : "neutral"}>{sel.application.status === "accepted" ? "Accepted" : "Declined"}</Badge>}
          <Link href={`/u/${s.slug}`} className="text-sm font-semibold ml-auto">View full profile</Link>
        </div>
      </Card>
    </div>
  );
}

export function ApprovalCard({ ws }: { ws: WorkspaceView }) {
  const sub = ws.submissions.find((x) => x.submission.status === "pending_review");
  const [busy, setBusy] = useState(false);
  const [changes, setChanges] = useState(false);
  const [note, setNote] = useState("");
  if (!sub) return null;
  const idx = ws.project.milestones.findIndex((m) => m.id === sub.submission.milestoneId);
  const covered = ws.project.milestones.filter((m, i) => i === idx || (sub.submission.final && i > idx && m.status === "in_review"));
  const amount = covered.reduce((a, m) => a + m.amount, 0);
  const c = sub.check;
  const approve = async () => {
    setBusy(true);
    try { await workspace.approveSubmission(sub.submission.id); toast.success(amount ? `Approved. ${money(amount)} released (simulated).` : "Approved."); }
    catch (e) { toast.error(e instanceof ServiceError ? e.message : "Could not approve."); }
    finally { setBusy(false); }
  };
  const requestChanges = async () => {
    try { await workspace.requestChanges(sub.submission.id, note); toast.info("Changes requested."); setChanges(false); }
    catch (e) { toast.error(e instanceof ServiceError ? e.message : "Could not send."); }
  };
  return (
    <Card className="p-6" as="section" aria-label={`Approval for ${ws.project.title}`}>
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <div className="text-sm font-semibold text-ink">{sub.submission.final && covered.length > 1 ? `Final delivery: ${ws.project.title}` : `Milestone ${idx + 1}: ${ws.project.milestones[idx]?.title}`}</div>
          <div className="text-xs">Submitted by {ws.student.name} · {relTime(sub.submission.submittedAt)}{c ? ` · automated check ${c.status === "pass" ? "passed" : c.status === "warn" ? "has warnings" : "failed"}` : ""}{amount ? ` · ${money(amount)}` : ""}</div>
          {sub.submission.url && <a href={sub.submission.url} target="_blank" rel="noreferrer" className="text-xs break-all">{sub.submission.url}</a>}
          {sub.submission.fileNames.length > 0 && <div className="text-xs">Files: {sub.submission.fileNames.join(", ")}</div>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" onClick={() => setChanges(true)}>Request changes</Button>
          <Button onClick={approve} loading={busy}>Approve{amount ? ` and release ${money(amount)}` : ""}</Button>
        </div>
      </div>
      {c && (
        <div className="mt-4 pt-4 border-t border-line text-sm" data-testid="approval-check">
          <div className="flex gap-4 flex-wrap text-xs mb-2">
            <span>Reachable: <b className="text-ink">{c.reachable ? "Yes" : "No"}</b></span><span>Mobile: <b className="text-ink">{c.mobile}</b></span><span>Accessibility: <b className="text-ink">{c.accessibility}</b></span><span>SEO: <b className="text-ink">{c.seo}</b></span>
          </div>
          <p>{c.summary}</p>
          <AiNote className="mt-2" />
        </div>
      )}
      <Modal open={changes} onClose={() => setChanges(false)} title="Request changes">
        <h2 className="h2 mb-4">Request changes</h2>
        <Textarea label="What should change?" rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex justify-end gap-2 mt-4"><Button variant="secondary" onClick={() => setChanges(false)}>Cancel</Button><Button onClick={requestChanges} disabled={note.trim().length < 3}>Send</Button></div>
      </Modal>
    </Card>
  );
}

export function ReviewCard({ ws }: { ws: WorkspaceView }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true); setError(null);
    try { await workspace.submitReview({ projectId: ws.project.id, rating, text }); toast.success(`Review posted. ${ws.student.name.split(" ")[0]} earned a verified badge.`); }
    catch (e) { setError(e instanceof ServiceError ? e.message : "Could not post the review."); }
    finally { setBusy(false); }
  };
  return (
    <Card className="p-6" as="section" aria-label={`Rate ${ws.student.name}`}>
      <div className="text-sm mb-4">{ws.project.title}, completed by {ws.student.name}. Your review and a verified skill badge ({(ws.project.badgeSkills.length ? ws.project.badgeSkills : ws.project.skills.slice(0, 1)).join(", ")}) go on their public profile.</div>
      <Stars value={rating} onChange={setRating} />
      <div className="mt-4"><Textarea label="Review" rows={3} value={text} onChange={(e) => setText(e.target.value)} error={error} placeholder="What did the student do well?" /></div>
      <div className="mt-4"><Button onClick={submit} loading={busy}>Submit review</Button></div>
    </Card>
  );
}
