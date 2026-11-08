"use client";

import { useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import { Badge, Button, Card, Stars, Textarea, toast } from "@/components/ui";
import { approvals, type FinalApproval, type PendingApproval } from "@/services";
import { ServiceError } from "@/services";
import { relTime } from "@/lib/dates";

/** Poster approves a milestone: rate each acceptance criterion (1 to 5), write a short review, then approve or request changes. */
export function ApprovalPanel({ item, onDone }: { item: PendingApproval; onDone?: (final: FinalApproval | null) => void }) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [review, setReview] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<"approve" | "changes" | null>(null);
  const crit = item.project.acceptance;

  const submit = async (kind: "approve" | "changes") => {
    const rs = crit.map((criterion) => ({ criterion, rating: ratings[criterion] ?? 0 }));
    if (rs.some((r) => r.rating === 0)) return setErr("Rate every acceptance criterion from 1 to 5 stars.");
    if (review.trim().length < 5) return setErr("Add a short review of the work.");
    setBusy(kind);
    try {
      const res = await (kind === "approve" ? approvals.approve : approvals.requestChanges)(item.submission.id, rs, review.trim());
      toast.success(kind === "approve" ? (res.final ? "Final approval given. Badge unlocked." : "Milestone approved.") : "Changes requested.");
      onDone?.(res.final);
    } catch (e) {
      setErr(e instanceof ServiceError || e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-5 flex flex-col gap-4" data-testid="approval-panel">
      <div>
        <p className="text-xs">{item.student.name} submitted {relTime(item.submission.submittedAt)}</p>
        <h3 className="text-base font-semibold text-ink">{item.milestone.title}</h3>
        {item.isLastMilestone && <p className="text-xs mt-1">This is the last milestone. Approving it completes the project and unlocks the student&apos;s badge.</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {item.submission.url && <a href={item.submission.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold">{item.submission.url.replace(/^https?:\/\//, "")}<ExternalLink size={14} aria-hidden /></a>}
        {item.submission.fileNames.map((f) => <Badge key={f}>{f}</Badge>)}
        {item.check && <Badge tone={item.check.status === "ok" ? "ok" : item.check.status === "slow" ? "warn" : "bad"}>Basic check: {item.check.status === "unreachable" ? "link not reachable" : item.check.status === "slow" ? "reachable, slow" : "link reachable"}</Badge>}
      </div>
      {item.submission.note && <p className="text-sm">&ldquo;{item.submission.note}&rdquo;</p>}
      <p className="text-xs">The Basic check only confirms the link opens. It says nothing about quality.</p>
      <fieldset className="flex flex-col gap-3 border-0 p-0 m-0">
        <legend className="text-sm font-semibold text-ink mb-1">Acceptance criteria</legend>
        {crit.map((c) => (
          <div key={c} className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm flex-1 min-w-[200px]">{c}</span>
            <Stars size={22} value={ratings[c] ?? 0} onChange={(n) => { setRatings((r) => ({ ...r, [c]: n })); setErr(null); }} />
          </div>
        ))}
      </fieldset>
      <Textarea label="Your review" rows={3} value={review} onChange={(e) => { setReview(e.target.value); setErr(null); }} hint="Shown to the student and, once the project is complete, on their profile." />
      {err && <p role="alert" className="text-sm text-bad">{err}</p>}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => submit("approve")} loading={busy === "approve"} disabled={busy !== null} data-testid="approve-btn"><Check size={16} aria-hidden />{item.isLastMilestone ? "Give final approval" : "Approve milestone"}</Button>
        <Button variant="secondary" onClick={() => submit("changes")} loading={busy === "changes"} disabled={busy !== null}>Request changes</Button>
      </div>
    </Card>
  );
}
