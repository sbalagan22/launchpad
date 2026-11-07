"use client";

import Link from "next/link";
import { PageContainer } from "@/components/nav";
import { StatusBadge, dueLabel, milestoneProgress, payLabel } from "@/components/feature";
import { Badge, Card, EmptyState, ErrorState, ProgressBar, Skeleton } from "@/components/ui";
import { useQuery, useSession } from "@/hooks/use-query";
import { applications, projects } from "@/services";

export default function WorkspaceIndex() {
  const { userId, role, hydrated } = useSession();
  const sid = role === "student" && hydrated ? userId : null;
  const mine = useQuery(sid ? `ws-list:${sid}` : null, () => projects.listStudentProjects(sid!));
  const apps = useQuery(sid ? `ws-apps:${sid}` : null, () => applications.listForStudent(sid!));
  if (role === "business") return <PageContainer><EmptyState title="Workspaces are for students" body="Open a project from your dashboard to manage it." action={<Link href="/business" className="text-sm font-semibold">Business dashboard</Link>} /></PageContainer>;
  if (mine.error) return <PageContainer><ErrorState error={mine.error} onRetry={mine.refetch} /></PageContainer>;
  const active = mine.data?.filter((m) => m.project.status === "in_progress" || m.project.status === "in_review") ?? [];
  const done = mine.data?.filter((m) => m.project.status === "completed") ?? [];
  const pending = apps.data?.filter((a) => a.application.status === "pending") ?? [];
  const rejected = apps.data?.filter((a) => a.application.status === "rejected") ?? [];
  return (
    <PageContainer>
      <h1 className="h2 mb-1">Your workspace</h1>
      <p className="text-sm mb-8">Active projects, applications waiting for a reply, and finished work.</p>
      <h2 className="text-base font-semibold text-ink mb-2">Active projects</h2>
      {mine.loading ? <Skeleton className="h-24 w-full mb-8" /> : active.length === 0 ? <div className="mb-8"><EmptyState title="No active projects" body="Apply to a project and, once a business accepts, it shows up here." action={<Link href="/projects" className="text-sm font-semibold">Browse projects</Link>} /></div> : (
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {active.map(({ project: p, business }) => (
            <Card key={p.id} className="p-6">
              <div className="flex justify-between gap-2 mb-1"><Link href={`/workspace/${p.id}`} className="text-base font-semibold text-ink!">{p.title}</Link><StatusBadge status={p.status} /></div>
              <div className="text-xs mb-4">{business.name} · Due {dueLabel(p.deadline)} · {payLabel(p)}</div>
              <ProgressBar value={milestoneProgress(p).percent} label={`${p.title} progress`} />
            </Card>
          ))}
        </div>
      )}
      <h2 className="text-base font-semibold text-ink mb-2">Applications</h2>
      {apps.loading ? <Skeleton className="h-20 w-full mb-8" /> : pending.length + rejected.length === 0 ? <div className="mb-8"><EmptyState title="No applications yet" /></div> : (
        <Card className="mb-8">
          {[...pending, ...rejected].map(({ application: a, project: p, business }) => (
            <div key={a.id} className="flex justify-between items-center gap-4 px-6 py-4 border-t border-line first:border-t-0 text-sm">
              <div><Link href={`/projects/${p.id}`} className="font-semibold text-ink!">{p.title}</Link><div className="text-xs">{business.name}</div></div>
              <Badge tone={a.status === "pending" ? "neutral" : "bad"}>{a.status === "pending" ? "Waiting for reply" : "Not selected"}</Badge>
            </div>
          ))}
        </Card>
      )}
      <h2 className="text-base font-semibold text-ink mb-2">Completed</h2>
      {mine.loading ? <Skeleton className="h-16 w-full" /> : done.length === 0 ? <EmptyState title="Nothing completed yet" /> : (
        <Card>{done.map(({ project: p, business }) => <Link key={p.id} href={`/workspace/${p.id}`} className="flex justify-between gap-4 px-6 py-4 border-t border-line first:border-t-0 text-sm text-ink!"><span className="font-semibold">{p.title}<span className="block text-xs font-normal text-body">{business.name}</span></span><span>{p.hours} hours</span></Link>)}</Card>
      )}
    </PageContainer>
  );
}
