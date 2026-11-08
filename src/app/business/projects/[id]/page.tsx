"use client";

import { use, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/nav";
import { WorkspaceDetail } from "@/components/workspace-view";
import { Avatar, Badge, Button, Card, EmptyState, ErrorState, MatchRing, PageSkeleton, WhatNext, toast } from "@/components/ui";
import { useQuery } from "@/hooks/use-query";
import { applications, projects, type ApplicationView } from "@/services";
import { relTime } from "@/lib/dates";

export default function BusinessProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const proj = useQuery(`bproj:${id}`, () => projects.get(id));
  const apps = useQuery(`bapps:${id}`, () => applications.listForProject(id));
  if (proj.error) return <PageContainer><ErrorState error={proj.error} onRetry={proj.refetch} /></PageContainer>;
  if (!proj.data) return <PageContainer><PageSkeleton /></PageContainer>;
  const p = proj.data.project;
  return (
    <PageContainer>
      <nav aria-label="Breadcrumb" className="text-sm mb-4"><Link href="/business">Projects</Link> / {p.title}</nav>
      <h1 className="h2 mb-6">{p.title}</h1>
      {p.status === "open" ? (
        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          <section aria-labelledby="app-h">
            <h2 id="app-h" className="h3 mb-3">Applicants ({apps.data?.length ?? 0})</h2>
            {!apps.data ? <PageSkeleton rows={2} /> : apps.data.length === 0 ? <EmptyState title="No applicants yet" body="Matching students are notified when you publish. Applicants appear here." /> : (
              <div className="flex flex-col gap-4">{apps.data.map((a) => <Applicant key={a.application.id} a={a} />)}</div>
            )}
          </section>
          <WhatNext steps={["Review each proposal and the match reasons.", "Accept one student. The workspace and a chat open for you both.", "Approve each milestone against your acceptance criteria."]} />
        </div>
      ) : p.status === "draft" ? <EmptyState title="This is a draft" body="Finish the brief and publish it from the new project page." action={<Button href="/business/new">Open the editor</Button>} /> : <WorkspaceDetail projectId={p.id} poster />}
    </PageContainer>
  );
}

function Applicant({ a }: { a: ApplicationView }) {
  const [busy, setBusy] = useState<"accepted" | "rejected" | null>(null);
  const decide = async (d: "accepted" | "rejected") => {
    setBusy(d);
    try { await applications.decide(a.application.id, d); toast.success(d === "accepted" ? `${a.student.name} accepted. Their workspace is ready.` : "Application declined."); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save"); } finally { setBusy(null); }
  };
  return (
    <Card className="p-5" data-testid="applicant" data-name={a.student.name}>
      <div className="flex gap-4 items-start">
        <Avatar name={a.student.name} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap"><Link href={`/u/${a.student.slug}`} className="font-semibold text-ink!">{a.student.name}</Link><Badge tone={a.application.status === "pending" ? "neutral" : a.application.status === "accepted" ? "ok" : "bad"}>{a.application.status}</Badge></div>
          <p className="text-xs">{a.student.program}, {a.student.faculty}, year {a.student.year} &middot; applied {relTime(a.application.createdAt)}</p>
          <p className="text-sm mt-2">{a.application.proposal}</p>
          <ul className="list-none p-0 m-0 mt-3 flex flex-col gap-1 text-xs">{a.match.reasons.map((r) => <li key={r.key}>{r.text}</li>)}</ul>
        </div>
        <MatchRing score={a.match.score} size={52} />
      </div>
      {a.application.status === "pending" && (
        <div className="flex gap-2 mt-4 justify-end">
          <Button variant="secondary" onClick={() => decide("rejected")} loading={busy === "rejected"} disabled={busy !== null}>Decline</Button>
          <Button onClick={() => decide("accepted")} loading={busy === "accepted"} disabled={busy !== null} data-testid="accept-btn">Accept</Button>
        </div>
      )}
    </Card>
  );
}
