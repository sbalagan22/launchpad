"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { PageContainer } from "@/components/nav";
import { RoleButton } from "@/components/role-link";
import { Badge, Chip, EmptyState, ErrorState, MatchPill, ProgressBar, Segmented, Skeleton, Table, TableRow } from "@/components/ui";
import { Stat, dueLabel, milestoneProgress, payLabel } from "@/components/feature";
import { useQuery, useSession } from "@/hooks/use-query";
import { certs, projects, students } from "@/services";
import { Card } from "@/components/ui";
import { CheckCircle2, Circle } from "lucide-react";

const COLS = "minmax(220px,2.4fr) minmax(140px,1.4fr) 64px 56px 112px 64px";

export default function Feed() {
  const router = useRouter();
  const { userId, role, hydrated } = useSession();
  const [filter, setFilter] = useState<"all" | "paid" | "volunteer">("all");
  const [q, setQ] = useState("");
  const studentId = role === "student" ? userId : null;
  const profile = useQuery(studentId && hydrated ? `profile:${studentId}` : null, () => students.getProfile({ id: studentId! }));
  const feed = useQuery(studentId && hydrated ? `feed:${studentId}:${filter}:${q}` : null, () => projects.listFeed({ studentId: studentId!, filter, q }));
  const mine = useQuery(studentId && hydrated ? `mine:${studentId}` : null, () => projects.listStudentProjects(studentId!));
  const recs = useQuery(studentId && hydrated ? `recs:${studentId}` : null, () => certs.recommendPath(studentId!, ["web", "design", "data", "marketing"]));

  if (role === "business") {
    return (
      <PageContainer>
        <EmptyState title="You are viewing as a business" body="The project feed is for students. Switch to Student view in the top bar, or head to your dashboard." action={<RoleButton role="student" href="/projects">Switch to Student view</RoleButton>} />
      </PageContainer>
    );
  }

  const p = profile.data;
  const active = mine.data?.filter((m) => m.project.status === "in_progress" || m.project.status === "in_review") ?? [];
  const list = feed.data ?? [];

  return (
    <PageContainer className="pt-8">
      <div className="flex justify-between items-end flex-wrap gap-4 mb-6">
        <div>
          <h1 className="h2 mb-1">{p ? `Welcome back, ${p.student.name.split(" ")[0]}` : <Skeleton className="h-8 w-64" />}</h1>
          <div className="text-sm">{p ? `${["1st", "2nd", "3rd", "4th", "5th"][p.student.year - 1]} year ${p.student.field} · ${p.student.school}` : <Skeleton className="h-4 w-48" />}</div>
        </div>
        <div className="flex gap-8 flex-wrap" data-testid="summary">
          {p ? (
            <>
              <Stat label="Active" value={p.active} />
              <Stat label="Applied" value={p.applied} />
              <Stat label="Completed" value={p.completed.length} />
              <Stat label="Verified hours" value={p.verifiedHours} />
            </>
          ) : (
            Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-10 w-16" />)
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-8 items-start">
        <div className="flex-[3_1_640px] min-w-0">
          <div className="flex flex-wrap gap-2 items-center mb-4">
            <Segmented label="Pay type" value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, { value: "paid", label: "Paid" }, { value: "volunteer", label: "Volunteer" }]} />
            <div className="flex-[1_1_200px] relative">
              <Search size={16} className="absolute left-3 top-3 text-muted" aria-hidden />
              <input aria-label="Search projects or skills" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects or skills" className="w-full h-10 border border-line rounded-control pl-10 pr-3 text-sm text-ink outline-none focus:border-brand" />
            </div>
          </div>
          {feed.error ? (
            <ErrorState error={feed.error} onRetry={feed.refetch} />
          ) : feed.loading ? (
            <Card className="p-6 flex flex-col gap-4" aria-busy="true">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}</Card>
          ) : list.length === 0 ? (
            <EmptyState title="No projects match these filters" body="Try clearing the search or switching to All." />
          ) : (
            <Table label="Open projects" columns={COLS} heads={["Project", "Skills", "Match", "Hours", "Pay", "Due"]} minWidth={760}>
              {list.map(({ project: pr, business, match, myApplication, isNew }) => (
                <TableRow key={pr.id} columns={COLS} onClick={() => router.push(`/projects/${pr.id}`)}>
                  <div className="min-w-0">
                    <Link href={`/projects/${pr.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-ink! flex items-center gap-2 flex-wrap">
                      {pr.title}
                      {isNew && <Badge tone="brand">New</Badge>}
                      {myApplication && <Badge tone="neutral">Applied</Badge>}
                    </Link>
                    <div className="text-xs">{business.name} · {business.city}</div>
                  </div>
                  <div className="flex gap-1 flex-wrap">{pr.skills.slice(0, 3).map((s) => <Chip key={s}>{s}</Chip>)}</div>
                  <span>{match && <MatchPill percent={match.percent} />}</span>
                  <span>{pr.hours}</span>
                  <span className="text-ink">{payLabel(pr)}</span>
                  <span>{dueLabel(pr.deadline)}</span>
                </TableRow>
              ))}
            </Table>
          )}
        </div>

        <aside className="flex-[1_1_280px] min-w-0 flex flex-col gap-4" aria-label="Your progress">
          <Card className="p-6">
            <div className="flex justify-between items-baseline mb-2"><b className="text-sm font-semibold text-ink">Profile strength</b><b className="text-sm font-semibold text-ink">{p ? `${p.strength}%` : "—"}</b></div>
            <div className="mb-4"><ProgressBar value={p?.strength ?? 0} label="Profile strength" /></div>
            <ul className="flex flex-col gap-2 text-sm mb-4 list-none p-0">
              {(p?.strengthItems ?? []).map((i) => (
                <li key={i.label} className={`flex gap-2 items-center ${i.done ? "text-ink" : ""}`}>
                  {i.done ? <CheckCircle2 size={16} className="text-brand" aria-hidden /> : <Circle size={16} className="text-muted" aria-hidden />}
                  {i.label}
                  <span className="sr-only">{i.done ? "done" : "not done"}</span>
                </li>
              ))}
            </ul>
            <Link href="/skills" className="text-sm font-semibold">Add a certification</Link>
          </Card>
          <Card className="p-6">
            <b className="text-sm font-semibold text-ink block mb-4">Recommended certifications</b>
            {recs.loading ? <Skeleton className="h-12 w-full" /> : (recs.data ?? []).slice(0, 2).map((r, i) => (
              <Link key={r.cert.id} href="/skills" className={`block py-2 ${i ? "border-t border-line" : ""} text-ink!`}>
                <div className="text-sm font-medium">{r.cert.name}</div>
                <div className="text-xs text-body">{r.cert.provider}{r.cert.issuedVia ? `, ${r.cert.issuedVia}` : ""} · unlocks {r.unlocks.join(", ")}</div>
              </Link>
            ))}
            {!recs.loading && !recs.data?.length && <p className="text-sm">You are all caught up on recommendations.</p>}
          </Card>
          <Card className="p-6">
            <b className="text-sm font-semibold text-ink block mb-4">Active projects</b>
            {mine.loading ? <Skeleton className="h-14 w-full" /> : active.length === 0 ? <p className="text-sm">No active projects yet. Apply to one from the list.</p> : active.map(({ project: pr, business }) => {
              const mp = milestoneProgress(pr);
              const cur = pr.milestones.findIndex((m) => m.status !== "approved");
              return (
                <Link key={pr.id} href={`/workspace/${pr.id}`} className="block mb-2 text-body! last:mb-0">
                  <div className="flex justify-between items-center gap-2 mb-1"><span className="text-sm font-semibold text-ink">{pr.title}</span><Badge tone={pr.status === "in_review" ? "warn" : "brand"}>{pr.status === "in_review" ? "In review" : "In progress"}</Badge></div>
                  <div className="text-xs mb-2">{business.name} · Milestone {Math.min(cur + 1 || pr.milestones.length, pr.milestones.length)} of {pr.milestones.length} · Due {dueLabel(pr.deadline)}</div>
                  <ProgressBar value={mp.percent} label={`${pr.title} progress`} />
                </Link>
              );
            })}
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
