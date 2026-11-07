"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageContainer } from "@/components/nav";
import { ApplicantsPanel, ApprovalCard, ReviewCard } from "@/components/business-panels";
import { CheckPanel } from "@/components/check-panel";
import { ChatPanel } from "@/components/chat-panel";
import { StatusBadge, dueLabel, payLabel } from "@/components/feature";
import { Badge, Card, EmptyState, ErrorState, PageSkeleton } from "@/components/ui";
import { useQuery, useSession } from "@/hooks/use-query";
import { projects, workspace } from "@/services";
import { money } from "@/lib/pay";

export default function BusinessProject() {
  const { id } = useParams<{ id: string }>();
  const { role, hydrated } = useSession();
  const pv = useQuery(hydrated ? `bp:${id}` : null, () => projects.getProjectView(id));
  const started = pv.data?.project.studentId;
  const ws = useQuery(hydrated && started ? `bws:${id}` : null, () => workspace.getWorkspace(id));
  if (role === "student") return <PageContainer><EmptyState title="This page is for the business that posted the project" action={<Link href={`/projects/${id}`} className="text-sm font-semibold">View project</Link>} /></PageContainer>;
  if (pv.error) return <PageContainer><ErrorState error={pv.error} onRetry={pv.refetch} /></PageContainer>;
  if (!pv.data || (started && !ws.data)) return <PageContainer><PageSkeleton rows={5} /></PageContainer>;
  const { project: p, business } = pv.data;
  const w = ws.data;
  const allApproved = p.milestones.every((m) => m.status === "approved");
  const latest = w?.submissions[0];

  return (
    <PageContainer>
      <nav aria-label="Breadcrumb" className="text-sm mb-6"><Link href="/business">Dashboard</Link><span className="mx-2">/</span><span>{p.title}</span></nav>
      <div className="flex justify-between items-start flex-wrap gap-4 mb-8">
        <div><div className="flex gap-2 items-center mb-2"><StatusBadge status={p.status} />{p.beginnerFriendly && <Badge>Beginner friendly</Badge>}</div><h1 className="h2">{p.title}</h1><p className="text-sm mt-1 max-w-[640px]">{p.description}</p></div>
        <div className="flex gap-8 text-sm"><div><div className="text-xs">Pay</div><b className="text-ink">{payLabel(p)}</b></div><div><div className="text-xs">Hours</div><b className="text-ink">{p.hours}</b></div><div><div className="text-xs">Deadline</div><b className="text-ink">{dueLabel(p.deadline)}</b></div></div>
      </div>
      <div className="flex flex-wrap gap-8 items-start">
        <div className="flex-[2_1_520px] min-w-0 flex flex-col gap-8">
          {w && p.status === "in_review" && !allApproved && <ApprovalCard ws={w} />}
          {w && allApproved && !w.review && <section><h2 className="text-base font-semibold text-ink mb-2">Final review</h2><ReviewCard ws={w} /></section>}
          {w?.review && <Card className="p-6 bg-ok-bg border-ok-bg" role="status"><b className="text-ok">Review posted.</b><p className="text-sm text-ink mt-1">{w.student.name} earned: {w.badges.map((b) => b.skill).join(", ") || "no badge"}. <Link href={`/u/${w.student.slug}`} className="font-semibold">View public profile</Link></p></Card>}
          <section>
            <h2 className="text-base font-semibold text-ink mb-2">Milestones</h2>
            <Card className="overflow-hidden">
              {p.milestones.map((m, i) => (
                <div key={m.id} className="grid grid-cols-[32px_1fr_90px_80px_100px] gap-4 px-6 py-4 border-t border-line first:border-t-0 text-sm items-center"><span>{i + 1}</span><span className="text-ink font-medium">{m.title}</span><span>{dueLabel(m.dueAt)}</span><span className="text-ink font-semibold">{p.payType === "volunteer" ? "Unpaid" : money(m.amount)}</span><Badge tone={m.status === "approved" ? "ok" : m.status === "open" ? "neutral" : m.status === "in_review" ? "warn" : "brand"}>{m.status === "approved" ? "Approved" : m.status === "in_review" ? "In review" : m.status === "in_progress" ? "In progress" : "Open"}</Badge></div>
              ))}
            </Card>
          </section>
          <section><h2 className="text-base font-semibold text-ink mb-2">Deliverables</h2><ol className="list-none p-0">{p.deliverables.map((d, i) => <li key={d} className="flex gap-4 py-2 border-t border-line text-sm"><span className="w-6 text-ink font-semibold">{i + 1}</span>{d}</li>)}</ol></section>
          {w && <ChatPanel projectId={p.id} thread={w.thread} me="business" myName={business.name} otherName={w.student.name} />}
        </div>
        <aside className="flex-[1_1_320px] min-w-0 flex flex-col gap-6">
          {p.status === "open" ? <><h2 className="text-base font-semibold text-ink -mb-2">Applicants</h2><ApplicantsPanel projectId={p.id} /></> : (
            <>
              {w && <Card className="p-6"><div className="text-xs font-medium mb-2">Student</div><div className="text-xl font-semibold text-ink">{w.student.name}</div><div className="text-sm mb-2">{w.student.school}</div><Link href={`/u/${w.student.slug}`} className="text-sm font-semibold">View full profile</Link></Card>}
              {latest?.check && <CheckPanel running={false} onAnimationDone={() => {}} check={latest.check} submittedUrl={latest.submission.url} />}
            </>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}
