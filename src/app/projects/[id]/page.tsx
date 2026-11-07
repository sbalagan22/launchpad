"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Minus } from "lucide-react";
import { PageContainer } from "@/components/nav";
import { StatusBadge, dueLabel } from "@/components/feature";
import { ProposalModal } from "@/components/proposal-modal";
import { Badge, Button, Card, ErrorState, Monogram, PageSkeleton } from "@/components/ui";
import { useQuery, useSession } from "@/hooks/use-query";
import { projects } from "@/services";
import { money } from "@/lib/pay";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { userId, role, hydrated } = useSession();
  const student = role === "student" ? userId : undefined;
  const { data, error, loading, refetch } = useQuery(hydrated ? `project:${id}:${student}` : null, () => projects.getProjectView(id, student));
  const [open, setOpen] = useState(false);

  if (error) return <PageContainer><ErrorState error={error} onRetry={refetch} /></PageContainer>;
  if (loading || !data) return <PageContainer><PageSkeleton rows={4} /></PageContainer>;
  const { project: p, business: b, match, myApplication, applicantCount } = data;
  const have = new Set(match?.matching ?? []);
  const near = new Set(match?.related ?? []);

  return (
    <PageContainer>
      <nav aria-label="Breadcrumb" className="text-sm mb-6"><Link href={role === "business" ? "/business" : "/projects"}>Projects</Link><span className="mx-2">/</span><span>{b.name}</span></nav>
      <div className="flex flex-wrap gap-16 items-start">
        <article className="flex-[2_1_520px] min-w-0">
          <div className="flex gap-2 mb-4 items-center flex-wrap">
            <StatusBadge status={p.status} />
            {p.beginnerFriendly && <Badge tone="neutral">Beginner friendly</Badge>}
            {match && <span className="text-xs font-medium text-ink" data-testid="match">{match.percent}% match with your profile</span>}
          </div>
          <h1 className="text-[32px] sm:text-[40px] leading-[1.1] tracking-[-0.02em] font-semibold mb-4 text-ink">{p.title}</h1>
          <p className="mb-12 max-w-[640px]">{p.description}</p>
          <h2 className="h3 mb-4">Deliverables</h2>
          <ol className="mb-12 list-none p-0">{p.deliverables.map((d, i) => <li key={d} className="flex gap-4 py-2 border-t border-line"><span className="w-6 text-ink font-semibold">{i + 1}</span><span>{d}</span></li>)}</ol>
          <h2 className="h3 mb-4">Milestones</h2>
          <div className="border border-line rounded-card overflow-hidden mb-12">
            <div className="grid grid-cols-[32px_1fr_80px_80px] gap-4 px-6 py-2 bg-surface text-xs font-medium"><span>#</span><span>Milestone</span><span>Due</span><span>Payout</span></div>
            {p.milestones.map((m, i) => (
              <div key={m.id} className="grid grid-cols-[32px_1fr_80px_80px] gap-4 px-6 py-4 border-t border-line text-sm"><span>{i + 1}</span><span className="text-ink font-medium">{m.title}</span><span>{dueLabel(m.dueAt)}</span><span className="text-ink font-semibold">{p.payType === "volunteer" ? "Unpaid" : money(m.amount)}</span></div>
            ))}
          </div>
          <h2 className="h3 mb-4">Required skills</h2>
          <ul className="list-none p-0">
            {p.skills.map((s) => {
              const state = have.has(s) ? "have" : near.has(s) ? "near" : "missing";
              return (
                <li key={s} className="flex justify-between py-2 border-t border-line text-sm">
                  <span className="text-ink font-medium">{s}</span>
                  <span className={`flex gap-2 items-center text-xs font-medium ${state === "missing" ? "text-body" : "text-brand"}`}>
                    {state === "have" ? <Check size={16} aria-hidden /> : state === "near" ? <Minus size={16} aria-hidden /> : null}
                    {match ? (state === "have" ? "You have this" : state === "near" ? "Related skill on your profile" : "Not on your profile") : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </article>

        <aside className="flex-[1_1_300px] min-w-0 lg:sticky lg:top-24" aria-label="Project summary">
          <Card className="p-6 mb-4">
            <div className="text-[28px] font-semibold tracking-[-0.02em] text-ink leading-tight mb-6">{p.payType === "volunteer" ? "Volunteer" : `${money(p.pay)} stipend`}</div>
            <dl className="flex flex-col gap-2 text-sm mb-6">
              {[["Estimated hours", p.hours], ["Deadline", dueLabel(p.deadline)], ["Milestones", p.milestones.length], ["Applicants", applicantCount]].map(([l, v]) => <div key={l as string} className="flex justify-between"><dt>{l}</dt><dd className="m-0 text-ink font-semibold">{v}</dd></div>)}
            </dl>
            {role === "student" && p.status === "open" && (
              myApplication ? (
                <div className="text-sm text-ok font-medium bg-ok-bg rounded-control px-4 py-2 text-center" role="status">Application {myApplication.status}. We&apos;ll notify you.</div>
              ) : (
                <>
                  <Button full onClick={() => setOpen(true)}>Apply</Button>
                  <p className="text-xs mt-2">Launchpad drafts your proposal. You edit it before sending.</p>
                </>
              )
            )}
            {role === "student" && p.status !== "open" && p.studentId === userId && <Button full href={`/workspace/${p.id}`}>Open workspace</Button>}
            {role === "student" && p.status !== "open" && p.studentId !== userId && <p className="text-sm">This project is no longer open.</p>}
            {role === "business" && <Button full variant="secondary" href={`/business/projects/${p.id}`}>Manage project</Button>}
          </Card>
          {match && (
            <Card className="p-6 mb-4">
              <div className="text-xs font-medium mb-2">Why this match</div>
              <p className="text-sm mb-2">Skills: {match.matching.length ? <b className="text-ink font-semibold">{match.matching.join(", ")}</b> : "none matched exactly"}.</p>
              <p className="text-sm">Availability: {match.availability === "good" ? "your weekly hours cover this project" : match.availability === "tight" ? "tight against your weekly hours" : "does not fit your hours or pay preference"}.</p>
            </Card>
          )}
          <Card className="p-6">
            <div className="text-xs font-medium mb-2">About the business</div>
            <div className="flex gap-3 items-center mb-2"><Monogram name={b.name} /><div><b className="text-base font-semibold text-ink block">{b.name}</b><span className="text-xs">{b.kind === "nonprofit" ? "Nonprofit" : b.category} · Rating {b.rating.toFixed(1)}</span></div></div>
            <div className="text-sm mb-2">{b.city}, ON</div>
            <div className="text-sm">{b.description}</div>
          </Card>
        </aside>
      </div>
      {student && <ProposalModal open={open} onClose={() => setOpen(false)} projectId={p.id} studentId={student} businessId={b.id} businessName={b.name} />}
    </PageContainer>
  );
}
