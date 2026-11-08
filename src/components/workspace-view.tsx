"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Lock, MessageSquare } from "lucide-react";
import { PageContainer } from "@/components/nav";
import { ApprovalPanel } from "@/components/approval-panel";
import { AnimatedBar, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Avatar, Badge, BadgeUnlock, Button, Card, EmptyState, ErrorState, Input, PageSkeleton, Skeleton, Stars, Textarea, WhatNext, toast, cx } from "@/components/ui";
import { StatusBadge } from "@/components/feature";
import { useQuery, useSession } from "@/hooks/use-query";
import { approvals, workspace, type WorkspaceSummary, type WorkspaceView } from "@/services";
import { relTime } from "@/lib/dates";
import { shortDate } from "@/lib/utils";
import { money } from "@/lib/pay";

export function WorkspaceShell({ selectedId }: { selectedId?: string }) {
  const { userId, hydrated } = useSession();
  const list = useQuery(hydrated ? `ws:list:${userId}` : null, () => workspace.listMine());
  if (list.error) return <PageContainer><ErrorState error={list.error} onRetry={list.refetch} /></PageContainer>;
  if (list.loading || !list.data) return <PageContainer><PageSkeleton rows={4} /></PageContainer>;
  const items = list.data;
  if (items.length === 0) return <PageContainer><EmptyState title="No workspaces yet" body="When a poster accepts your proposal, the project workspace appears here." action={<Button href="/projects">Browse projects</Button>} /></PageContainer>;
  const current = selectedId ?? items.find((i) => i.project.status !== "completed")?.project.id ?? items[0].project.id;
  return (
    <PageContainer>
      <h1 className="h2 mb-6">Workspace</h1>
      <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
        <nav aria-label="Your projects" className="flex flex-col gap-2 lg:sticky lg:top-24">
          <Stagger className="flex flex-col gap-2">
            {items.map((i) => <StaggerItem key={i.project.id}><ListRow s={i} active={i.project.id === current} /></StaggerItem>)}
          </Stagger>
        </nav>
        <WorkspaceDetail projectId={current} />
      </div>
    </PageContainer>
  );
}

function ListRow({ s, active }: { s: WorkspaceSummary; active: boolean }) {
  return (
    <Link href={`/workspace/${s.project.id}`} aria-current={active ? "page" : undefined} className={cx("block rounded-card border p-4 text-body! hover:text-body! transition-colors", active ? "border-brand bg-tint" : "border-line bg-white hover:bg-surface")} data-testid="ws-row">
      <div className="flex items-center justify-between gap-2 mb-1"><span className="text-xs truncate">{s.business.name}</span><StatusBadge status={s.project.status} /></div>
      <p className="text-sm font-semibold text-ink leading-snug">{s.project.title}</p>
      <p className="text-xs mt-1">{s.currentMilestone ? `${s.currentMilestone.title}, due ${shortDate(s.currentMilestone.dueAt)}` : s.project.status === "completed" ? "Completed" : "Waiting"}</p>
      <div className="flex items-center gap-2 mt-2 text-xs">
        {s.awaiting === "poster" && <Badge tone="warn">Waiting on poster</Badge>}
        {s.awaiting === "you" && <Badge tone="brand">Your turn</Badge>}
        {s.unread > 0 && <span className="inline-flex items-center gap-1 text-brand font-semibold"><MessageSquare size={12} aria-hidden />{s.unread} new</span>}
      </div>
    </Link>
  );
}

export function WorkspaceDetail({ projectId, poster = false }: { projectId: string; poster?: boolean }) {
  const { data, error, loading, refetch } = useQuery(`ws:${projectId}`, () => workspace.getWorkspace(projectId));
  const pending = useQuery(poster ? `ws:pending:${projectId}` : null, () => approvals.pending());
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (loading || !data) return <div className="flex flex-col gap-4"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>;
  return <Detail w={data} poster={poster} pending={pending.data?.filter((p) => p.project.id === projectId) ?? []} />;
}

function Detail({ w, poster, pending }: { w: WorkspaceView; poster: boolean; pending: Awaited<ReturnType<typeof approvals.pending>> }) {
  const p = w.project;
  const done = p.milestones.filter((m) => m.status === "approved").length;
  const [unlock, setUnlock] = useState(() => {
    if (poster || p.status !== "completed" || !w.badges.length) return false;
    try {
      const key = `lp-badge-seen:${p.id}`;
      if (localStorage.getItem(key)) return false;
      localStorage.setItem(key, "1");
      return true;
    } catch { return false; }
  });

  return (
    <div className="flex flex-col gap-6 min-w-0" data-testid="ws-detail">
      {unlock && w.badges[0] && <div className="flex justify-center"><BadgeUnlock skill={w.badges.map((b) => b.skill).join(" and ")} onDone={() => setUnlock(false)} /></div>}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs">{w.business.name}{poster ? ` with ${w.student.name}` : ""}</p>
            <h2 className="h3">{p.title}</h2>
            <p className="text-sm mt-1">{p.hours} hours &middot; {p.payType === "volunteer" ? "Volunteer" : money(p.pay)} &middot; due {shortDate(p.deadline)}</p>
          </div>
          <div className="w-44"><AnimatedBar value={done} max={p.milestones.length} label="Milestones approved" /><p className="text-xs mt-1">{done} of {p.milestones.length} milestones approved</p></div>
        </div>
        {w.thread && <Link href={`/messages?t=${w.thread.id}`} className="inline-flex items-center gap-1 text-sm font-semibold mt-3"><MessageSquare size={14} aria-hidden />Open conversation</Link>}
      </Card>

      <section aria-labelledby="ms-h">
        <h3 id="ms-h" className="text-base font-semibold text-ink mb-3">Milestones</h3>
        <ol className="list-none p-0 m-0 flex flex-col gap-3">
          {p.milestones.map((m, i) => {
            const subs = w.submissions.filter((s) => s.submission.milestoneId === m.id);
            const waiting = pending.find((x) => x.milestone.id === m.id);
            return (
              <li key={m.id}>
                <Card className="p-5" data-testid="milestone" data-status={m.status}>
                  <div className="flex items-start gap-3">
                    <span className={cx("w-7 h-7 rounded-full grid place-items-center text-xs font-semibold flex-none", m.status === "approved" ? "bg-brand text-white" : m.status === "open" ? "bg-surface text-muted border border-line" : "bg-white text-brand border-2 border-brand")}>
                      {m.status === "approved" ? <Check size={14} strokeWidth={3} aria-hidden /> : m.status === "open" ? <Lock size={12} aria-hidden /> : i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <b className="text-ink font-semibold">{m.title}</b>
                        <span className="text-xs">{m.hours}h &middot; {money(m.amount)} &middot; due {shortDate(m.dueAt)}</span>
                      </div>
                      <p className="text-xs mt-0.5">{m.status === "approved" ? `Approved ${m.approvedAt ? relTime(m.approvedAt) : ""}` : m.status === "in_review" ? "Submitted, waiting for the poster" : m.status === "in_progress" ? "In progress" : "Opens after the previous milestone is approved"}</p>
                      {subs.length > 0 && (
                        <ul className="list-none p-0 m-0 mt-3 flex flex-col gap-3">
                          {subs.map((s) => (
                            <li key={s.submission.id} className="text-sm border-l-2 border-line pl-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs">{relTime(s.submission.submittedAt)}</span>
                                {s.submission.url && <a href={s.submission.url} target="_blank" rel="noreferrer" className="font-semibold break-all">{s.submission.url.replace(/^https?:\/\//, "")}</a>}
                                {s.check && <Badge tone={s.check.status === "ok" ? "ok" : s.check.status === "slow" ? "warn" : "bad"}>Basic check: {s.check.status === "unreachable" ? "not reachable" : s.check.status === "slow" ? "slow" : "reachable"}</Badge>}
                                <Badge tone={s.submission.status === "approved" ? "ok" : s.submission.status === "changes_requested" ? "warn" : "neutral"}>{s.submission.status === "approved" ? "Approved" : s.submission.status === "changes_requested" ? "Changes requested" : "Waiting"}</Badge>
                              </div>
                              {s.approval && (
                                <div className="mt-2 bg-surface rounded-control p-3">
                                  <p className="text-xs mb-2">Feedback from {w.business.name}</p>
                                  <p className="text-sm text-ink">{s.approval.review}</p>
                                  <ul className="list-none p-0 m-0 mt-2 flex flex-col gap-1">
                                    {s.approval.ratings.map((r) => <li key={r.criterion} className="flex items-center justify-between gap-3 text-xs"><span>{r.criterion}</span><Stars size={12} value={r.rating} /></li>)}
                                  </ul>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      {!poster && m.status === "in_progress" && <SubmitBox milestoneId={m.id} />}
                      {poster && waiting && <div className="mt-4"><ApprovalPanel item={waiting} onDone={() => undefined} /></div>}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      </section>

      <Card className="p-5">
        <h3 className="text-base font-semibold text-ink mb-2">Acceptance criteria</h3>
        <ul className="list-none p-0 m-0 flex flex-col gap-2 text-sm">{p.acceptance.map((a) => <li key={a} className="flex gap-2"><Check size={16} className="text-brand flex-none mt-0.5" aria-hidden />{a}</li>)}</ul>
      </Card>

      {p.status === "completed" && (
        <Reveal>
          <Card className="p-5 border-brand">
            <h3 className="text-base font-semibold text-ink mb-1">Project complete</h3>
            {w.review && <div className="flex items-center gap-3 mb-2"><Stars value={Math.round(w.review.rating)} size={18} /><span className="text-sm">{w.review.rating} of 5 from {w.review.by}</span></div>}
            {w.review && <p className="text-sm">&ldquo;{w.review.text}&rdquo;</p>}
            {w.badges.length > 0 && <p className="text-sm mt-3">Evidence added to the profile (approved by the poster): {w.badges.map((b) => b.skill).join(", ")}.</p>}
          </Card>
        </Reveal>
      )}
      {!poster && p.status !== "completed" && <WhatNext steps={["Submit a link for the open milestone.", "The poster rates each acceptance criterion and writes a short review.", "After the last milestone is approved, the project completes and the badge unlocks."]} />}
    </div>
  );
}

function SubmitBox({ milestoneId }: { milestoneId: string }) {
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!url.trim()) return setErr("Add a link to your work.");
    setBusy(true);
    try {
      const r = await workspace.submitMilestone(milestoneId, [url], { note: note.trim() || undefined });
      toast.success(r.check?.status === "unreachable" ? "Submitted, but the link could not be reached." : "Submitted. The poster has been notified.");
      setUrl(""); setNote("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not submit");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4" data-testid="submit-box">
      <Input label="Link to your work" placeholder="https://" value={url} onChange={(e) => { setUrl(e.target.value); setErr(null); }} error={err} hint="A Basic check confirms the link opens. It does not judge quality." />
      <Textarea label="Note for the poster (optional)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      <div><Button onClick={submit} loading={busy} data-testid="submit-milestone">Submit milestone</Button></div>
    </div>
  );
}

export { Avatar };
