"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Upload } from "lucide-react";
import { PageContainer } from "@/components/nav";
import { CheckPanel } from "@/components/check-panel";
import { ChatPanel } from "@/components/chat-panel";
import { dueLabel } from "@/components/feature";
import { Badge, Button, Card, EmptyState, ErrorState, Input, PageSkeleton, toast } from "@/components/ui";
import { useQuery, useSession } from "@/hooks/use-query";
import { workspace, ServiceError } from "@/services";
import { money } from "@/lib/pay";
import type { CheckResult } from "@/schemas";

const MS_LABEL = { approved: "Done", in_progress: "In progress", in_review: "In review", open: "Open" } as const;

export default function Workspace() {
  const { id } = useParams<{ id: string }>();
  const { userId, role, hydrated } = useSession();
  const { data, error, loading, refetch } = useQuery(hydrated ? `ws:${id}` : null, () => workspace.getWorkspace(id));
  const [url, setUrl] = useState("https://sunrise-bakery-demo.netlify.app");
  const [files, setFiles] = useState<string[]>([]);
  const [final, setFinal] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [fresh, setFresh] = useState<CheckResult | null>(null);
  const ready = useRef(false);
  const animated = useRef(false);

  if (error) return <PageContainer><ErrorState error={error} onRetry={refetch} /></PageContainer>;
  if (loading || !data) return <PageContainer><PageSkeleton rows={4} /></PageContainer>;
  const { project: p, business: b, student, thread, submissions, review, badges } = data;
  if (role === "business") return <PageContainer><EmptyState title="This is the student workspace" action={<Button href={`/business/projects/${p.id}`}>Open business view</Button>} /></PageContainer>;
  if (student.id !== userId) return <PageContainer><EmptyState title="This workspace belongs to another student" action={<Button href="/workspace">Back to my projects</Button>} /></PageContainer>;

  const latest = submissions[0];
  const waiting = latest?.submission.status === "pending_review";
  const canSubmit = p.status === "in_progress" && p.milestones.some((m) => m.status === "in_progress");
  const current = p.milestones.findIndex((m) => m.status === "in_progress");
  const finishAnim = () => { animated.current = true; if (ready.current) setRunning(false); };

  const submit = async () => {
    setFormError(null);
    if (!url.trim() && !files.length) return setFormError("Add a link or at least one file.");
    ready.current = false; animated.current = false; setFresh(null); setRunning(true);
    try {
      const r = await workspace.submitWork({ projectId: p.id, studentId: student.id, url: url.trim() || undefined, fileNames: files, final });
      setFresh(r.check);
      ready.current = true;
      if (animated.current || !r.check) setRunning(false);
      toast.success("Submitted. The business has been notified.");
    } catch (e) {
      setRunning(false);
      const msg = e instanceof ServiceError ? e.message : "Could not submit.";
      setFormError(msg);
      toast.error(msg);
    }
  };

  const shownCheck = fresh ?? latest?.check ?? null;
  const loggedLabel = `${p.status === "completed" ? p.hours : p.loggedHours} of ${p.hours} hours logged`;

  return (
    <PageContainer>
      <div className="flex justify-between items-end flex-wrap gap-4 mb-8">
        <div><div className="text-sm">{b.name} · {b.city}</div><h1 className="h2">{p.title}</h1></div>
        <div className="text-sm">{loggedLabel} · Due {dueLabel(p.deadline)}</div>
      </div>

      {p.status === "completed" && (
        <Card className="p-6 mb-8 bg-ok-bg border-ok-bg" role="status">
          <b className="text-ok text-base">Project complete.</b>
          <p className="text-sm text-ink mt-1">{review ? `${b.name} rated this ${review.rating} of 5. ` : ""}{badges.length ? `Verified badge${badges.length > 1 ? "s" : ""} earned: ${badges.map((x) => x.skill).join(", ")}. ` : ""}<Link href={`/u/${student.slug}`} className="font-semibold">View on your public profile</Link></p>
        </Card>
      )}
      {p.status === "in_review" && p.milestones.every((m) => m.status === "approved") && (
        <Card className="p-6 mb-8 bg-tint border-tint" role="status"><b className="text-brand">All milestones approved.</b><p className="text-sm text-ink mt-1">Waiting for {b.name} to leave the final review. Your verified badge is issued as soon as they do.</p></Card>
      )}

      <ol aria-label="Milestones" className="flex flex-wrap gap-4 mb-8 list-none p-0">
        {p.milestones.map((m, i) => {
          const bar = m.status === "approved" ? "border-ok" : m.status === "open" ? "border-line" : "border-brand";
          const tone = m.status === "approved" ? "ok" : m.status === "open" ? "neutral" : m.status === "in_review" ? "warn" : "brand";
          return (
            <li key={m.id} className={`flex-[1_1_240px] border-t-2 pt-4 ${bar}`}>
              <div className="flex justify-between items-center gap-2 mb-1"><b className="text-sm font-semibold text-ink">{i + 1}. {m.title}</b><Badge tone={tone}>{MS_LABEL[m.status]}</Badge></div>
              <div className="text-xs">{p.payType === "volunteer" ? "Unpaid" : money(m.amount)} · {m.status === "approved" && m.approvedAt ? `approved ${dueLabel(m.approvedAt)}` : `due ${dueLabel(m.dueAt)}`}</div>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-8 items-start">
        <div className="flex-[2_1_520px] min-w-0 flex flex-col gap-8">
          <ChatPanel projectId={p.id} thread={thread} me="student" myName={student.name} otherName={b.name} />
          <Card as="section" aria-label="Submit work" className="p-6">
            <div className="text-base font-semibold text-ink mb-1">{canSubmit ? `Submit milestone ${current + 1}` : "Submit work"}</div>
            {latest?.submission.status === "changes_requested" && p.status === "in_progress" && <p role="alert" className="text-sm text-bad mb-2">Changes requested: {latest.submission.note}</p>}
            {canSubmit ? (
              <>
                <div className="text-sm mb-4">{p.milestones[current].title}. Share a staging link and/or files.</div>
                <label className="border border-dashed border-line-strong rounded-control p-6 flex gap-2 items-center justify-center text-sm mb-4 cursor-pointer hover:bg-surface focus-within:outline-2">
                  <Upload size={16} aria-hidden />
                  <span>Drop files or <span className="text-brand font-semibold">browse</span></span>
                  <input type="file" multiple className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files ?? []).map((f) => f.name))} />
                </label>
                {files.length > 0 && <p className="text-xs mb-4" data-testid="files">Attached (stored by name only): {files.join(", ")}</p>}
                <Input label="Link to your work" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://staging.example.com" error={formError} />
                <label className="flex gap-2 items-start text-sm mt-4"><input type="checkbox" checked={final} onChange={(e) => setFinal(e.target.checked)} className="mt-1 accent-brand" /><span>This is my final delivery. It covers all remaining milestones.</span></label>
                <div className="flex justify-end mt-4"><Button onClick={submit} loading={running}>Submit for review</Button></div>
              </>
            ) : waiting ? (
              <p className="text-sm" role="status">Submitted {dueLabel(latest.submission.submittedAt)}. Waiting for {b.name} to review.</p>
            ) : (
              <p className="text-sm">{p.status === "completed" ? "Everything has been delivered and approved." : "Nothing to submit right now."}</p>
            )}
          </Card>
        </div>
        <div className="flex-[1_1_320px] min-w-0">
          <CheckPanel running={running} onAnimationDone={finishAnim} check={shownCheck} submittedUrl={latest?.submission.url} />
        </div>
      </div>
    </PageContainer>
  );
}
