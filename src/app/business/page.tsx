"use client";

import Link from "next/link";
import { PageContainer } from "@/components/nav";
import { Stagger, StaggerItem } from "@/components/motion";
import { StatusBadge } from "@/components/feature";
import { Button, Card, EmptyState, ErrorState, PageSkeleton } from "@/components/ui";
import { useSession, useQuery } from "@/hooks/use-query";
import { projects } from "@/services";
import { money } from "@/lib/pay";
import { shortDate } from "@/lib/utils";

export default function BusinessProjects() {
  const { userId, hydrated, role } = useSession();
  const { data, error, loading, refetch } = useQuery(hydrated && role === "business" ? `mine:${userId}` : null, () => projects.listMine());
  if (hydrated && role !== "business") return <PageContainer><EmptyState title="This page is for posters" body="Switch to the founder account." action={<Button href="/login">Switch demo account</Button>} /></PageContainer>;
  if (error) return <PageContainer><ErrorState error={error} onRetry={refetch} /></PageContainer>;
  if (loading || !data) return <PageContainer><PageSkeleton /></PageContainer>;
  return (
    <PageContainer>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6"><h1 className="h2">Your projects</h1><Button href="/business/new">Post a project</Button></div>
      {data.length === 0 ? <EmptyState title="No projects yet" body="Describe what you need and Launchpad turns it into a scoped brief." action={<Button href="/business/new">Post a project</Button>} /> : (
        <Stagger className="flex flex-col gap-3">
          {data.map((c) => (
            <StaggerItem key={c.project.id}>
              <Card lift className="p-5 flex flex-wrap items-center justify-between gap-4" data-testid="my-project">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1"><StatusBadge status={c.project.status} /><span className="text-xs">{c.project.hours} hours &middot; {c.project.payType === "volunteer" ? "Volunteer" : money(c.project.pay)} &middot; due {shortDate(c.project.deadline)}</span></div>
                  <Link href={`/business/projects/${c.project.id}`} className="text-base font-semibold text-ink!">{c.project.title}</Link>
                </div>
                <span className="text-sm">{c.project.status === "open" ? `${c.applicantCount} applicant${c.applicantCount === 1 ? "" : "s"}` : c.project.status === "in_progress" ? "In progress" : c.project.status === "completed" ? "Completed" : "Draft"}</span>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </PageContainer>
  );
}
