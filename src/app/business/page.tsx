"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/nav";
import { ApplicantsPanel, ApprovalCard, ReviewCard } from "@/components/business-panels";
import { StatusBadge, milestoneProgress, SectionTitle } from "@/components/feature";
import { Button, EmptyState, ErrorState, PageSkeleton, ProgressBar, Select, Table, TableRow } from "@/components/ui";
import { useQuery, useSession } from "@/hooks/use-query";
import { projects, students, workspace } from "@/services";

const COLS = "2fr 1.2fr 1.2fr 96px";

function Dashboard() {
  const { userId, role, hydrated } = useSession();
  const router = useRouter();
  const published = useSearchParams().get("published");
  const bid = role === "business" && hydrated ? userId : null;
  const biz = useQuery(bid ? `biz:${bid}` : null, () => students.getBusiness(bid!));
  const list = useQuery(bid ? `bprojects:${bid}` : null, () => projects.listBusinessProjects(bid!));
  const attention = useQuery(bid ? `attention:${bid}` : null, () => workspace.listAttention(bid!));
  const [focus, setFocus] = useState<string | null>(null);

  if (role === "student") return <PageContainer><EmptyState title="You are viewing as a student" body="Switch to Business view in the top bar to manage projects." action={<Link href="/projects" className="text-sm font-semibold">Back to projects</Link>} /></PageContainer>;
  if (list.error) return <PageContainer><ErrorState error={list.error} onRetry={list.refetch} /></PageContainer>;
  if (!biz.data || !list.data || !attention.data) return <PageContainer><PageSkeleton rows={6} /></PageContainer>;

  const all = list.data;
  const open = all.filter((p) => p.project.status === "open");
  const defaultFocus = [...open].sort((a, b) => b.applicantCount - a.applicantCount || b.project.createdAt.localeCompare(a.project.createdAt))[0];
  const focusId = focus && open.some((p) => p.project.id === focus) ? focus : defaultFocus?.project.id;
  const pubProject = published ? all.find((p) => p.project.id === published) : null;
  const approvals = attention.data.filter((w) => w.submissions.some((s) => s.submission.status === "pending_review"));
  const toRate = attention.data.filter((w) => w.project.milestones.every((m) => m.status === "approved") && !w.review);

  return (
    <PageContainer>
      <div className="flex justify-between items-end flex-wrap gap-4 mb-6">
        <div><h1 className="h2 mb-1">{biz.data.name}</h1><div className="text-sm">{biz.data.city}, ON · {biz.data.kind === "nonprofit" ? "Nonprofit" : biz.data.category}</div></div>
        <Button href="/business/new">New project</Button>
      </div>
      {pubProject && <div role="status" className="border border-ok-bg rounded-control px-4 py-2 text-sm text-ok font-medium mb-6 bg-ok-bg" data-testid="published-banner">{pubProject.project.title} is published. Matching students have been notified.</div>}

      <div className="flex flex-wrap gap-8 items-start">
        <div className="flex-[3_1_640px] min-w-0 flex flex-col gap-8">
          <section><SectionTitle>Projects</SectionTitle>
            {all.length === 0 ? <EmptyState title="No projects yet" body="Describe what you need and Launchpad scopes it for you." action={<Button href="/business/new">Post a project</Button>} /> : (
              <Table label="Your projects" columns={COLS} heads={["Project", "Student", "Progress", "Status"]} minWidth={560}>
                {all.map(({ project: p, applicantCount }) => (
                  <TableRow key={p.id} columns={COLS} onClick={() => router.push(`/business/projects/${p.id}`)}>
                    <span className="font-semibold text-ink">{p.title}</span>
                    <span>{p.studentId ? <StudentName id={p.studentId} /> : "No student yet"}</span>
                    <div>{p.status === "open" ? <span className="text-xs">{applicantCount} applicant{applicantCount === 1 ? "" : "s"}</span> : <><div className="mb-1"><ProgressBar value={milestoneProgress(p).percent} label={`${p.title} progress`} /></div><span className="text-xs">{milestoneProgress(p).done} of {milestoneProgress(p).total} milestones</span></>}</div>
                    <StatusBadge status={p.status} />
                  </TableRow>
                ))}
              </Table>
            )}
          </section>
          <section aria-labelledby="appr"><h2 id="appr" className="text-base font-semibold text-ink mb-2">Milestone approvals</h2>
            {approvals.length === 0 ? <EmptyState title="Nothing waiting for review" body="Submitted work and its automated check appear here." /> : <div className="flex flex-col gap-4">{approvals.map((w) => <ApprovalCard key={w.project.id} ws={w} />)}</div>}
          </section>
          <section aria-labelledby="rate"><h2 id="rate" className="text-base font-semibold text-ink mb-2">Rate your student</h2>
            {toRate.length === 0 ? <EmptyState title="No finished projects to rate" body="Once every milestone is approved, you can leave a final review and the student earns a verified badge." /> : <div className="flex flex-col gap-4">{toRate.map((w) => <ReviewCard key={w.project.id} ws={w} />)}</div>}
          </section>
        </div>
        <aside className="flex-[1_1_320px] min-w-0 flex flex-col gap-4" aria-label="Applicants">
          <h2 className="text-base font-semibold text-ink">Applicants</h2>
          {open.length === 0 ? <EmptyState title="No open projects" /> : (
            <>
              {open.length > 1 && <Select label="Project" value={focusId} onChange={(e) => setFocus(e.target.value)} options={open.map((p) => ({ value: p.project.id, label: `${p.project.title} (${p.applicantCount})` }))} />}
              {focusId && <ApplicantsPanel key={focusId} projectId={focusId} />}
            </>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}

function StudentName({ id }: { id: string }) {
  const { data } = useQuery(`sname:${id}`, () => students.getStudent(id));
  return <>{data?.name ?? "…"}</>;
}

export default function BusinessDashboard() {
  return <Suspense fallback={<PageContainer><PageSkeleton rows={6} /></PageContainer>}><Dashboard /></Suspense>;
}
