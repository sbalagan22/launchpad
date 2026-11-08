"use client";

import { useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/nav";
import { ApprovalPanel } from "@/components/approval-panel";
import { BadgeUnlock, Button, EmptyState, ErrorState, Modal, PageSkeleton } from "@/components/ui";
import { useSession, useQuery } from "@/hooks/use-query";
import { approvals, type FinalApproval } from "@/services";

export default function Approvals() {
  const { userId, hydrated, role } = useSession();
  const { data, error, refetch } = useQuery(hydrated && role === "business" ? `appr:${userId}` : null, () => approvals.pending());
  const [final, setFinal] = useState<FinalApproval | null>(null);
  if (hydrated && role !== "business") return <PageContainer><EmptyState title="This page is for posters" body="Switch to the founder account." action={<Button href="/login">Switch demo account</Button>} /></PageContainer>;
  if (error) return <PageContainer><ErrorState error={error} onRetry={refetch} /></PageContainer>;
  if (!data) return <PageContainer><PageSkeleton /></PageContainer>;
  return (
    <PageContainer>
      <h1 className="h2 mb-1">Approvals</h1>
      <p className="mb-6 max-w-2xl">Check each submission against the acceptance criteria, rate every criterion and write a short review. Approving the last milestone completes the project.</p>
      {data.length === 0 ? <EmptyState title="Nothing waiting" body="When a student submits a milestone, it shows up here." action={<Button href="/founder">Back to dashboard</Button>} /> : (
        <div className="flex flex-col gap-6 max-w-3xl">
          {data.map((p) => (
            <div key={p.submission.id}>
              <p className="text-sm mb-2"><Link href={`/business/projects/${p.project.id}`} className="font-semibold">{p.project.title}</Link></p>
              <ApprovalPanel item={p} onDone={(f) => f && setFinal(f)} />
            </div>
          ))}
        </div>
      )}
      <Modal open={Boolean(final)} onClose={() => setFinal(null)} title="Project complete">
        {final && (
          <div className="flex flex-col items-center text-center gap-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">Project complete</p>
            <BadgeUnlock skill={final.badges.map((b) => b.skill).join(" and ")} />
            <h2 className="h3">{final.student.name.split(" ")[0]} finished {final.project.title}</h2>
            <p className="text-sm">Evidence approved by you is now on {final.student.name.split(" ")[0]}&apos;s profile. You can invite them to continue from your pipeline.</p>
            <div className="flex gap-2"><Button variant="secondary" onClick={() => setFinal(null)}>Close</Button><Button href="/founder">Go to pipeline</Button></div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
