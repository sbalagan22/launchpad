"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageContainer } from "@/components/nav";
import { ProjectCardView } from "@/components/project-card";
import { AnimatedBar, CountUp, Stagger } from "@/components/motion";
import { Badge, Button, Card, CardSkeletons, EmptyState, ErrorState, PageSkeleton, YSpaceBadge } from "@/components/ui";
import { useMe } from "@/components/use-me";
import { useQuery } from "@/hooks/use-query";
import { applications, profile, projects } from "@/services";
import { shortDate } from "@/lib/utils";

const STAGE_LABEL = { applied: "Applied", interviewing: "Interviewing", trial: "Trial", offer: "Offer" } as const;

export default function Dashboard() {
  const { user, demoRole, hydrated } = useMe();
  const sid = user?.student?.id ?? null;
  const prof = useQuery(sid ? `dash:profile:${sid}` : null, () => profile.getProfile(sid!));
  const recs = useQuery(sid ? `dash:recs:${sid}` : null, () => projects.list({ status: ["open"], sort: "match" }));
  const apps = useQuery(sid ? `dash:apps:${sid}` : null, () => applications.listForStudent());

  if (hydrated && user && demoRole !== "student") {
    return <PageContainer><EmptyState title="The dashboard is for students" body="Use the account menu to switch to the student role." action={<Button href="/login">Switch demo role</Button>} /></PageContainer>;
  }
  if (prof.error) return <PageContainer><ErrorState error={prof.error} onRetry={prof.refetch} /></PageContainer>;
  if (prof.loading || !prof.data) return <PageContainer><PageSkeleton rows={4} /></PageContainer>;
  const d = prof.data;
  const firstName = d.student.name.split(" ")[0];
  const active = apps.data?.find((a) => a.application.status === "accepted" && a.project.status !== "completed");
  const nextMs = active?.project.milestones.find((m) => m.status !== "approved");
  const stats: [string, number, string][] = [
    ["Active projects", d.active, ""],
    ["Applications", d.applied, ""],
    ["Verified hours", d.verifiedHours, ""],
    ["Profile strength", d.strength, "%"],
  ];

  return (
    <PageContainer>
      <h1 className="h1 mb-1">Hi {firstName}.</h1>
      <p className="mb-8">{d.student.program}, {d.student.faculty}. Here is where things stand.</p>

      <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(([label, value, suffix]) => (
          <Card key={label} className="p-5">
            <div className="text-xs mb-1">{label}</div>
            <div className="text-3xl font-semibold tracking-[-0.02em] text-ink"><CountUp value={value} suffix={suffix} /></div>
          </Card>
        ))}
      </Stagger>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div className="flex flex-col gap-8 min-w-0">
          <section aria-labelledby="next-h">
            <h2 id="next-h" className="h3 mb-3">Next milestone</h2>
            {active && nextMs ? (
              <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs">{active.project.title} &middot; {active.business.name}</p>
                  <p className="text-ink font-semibold">{nextMs.title}</p>
                  <p className="text-sm">Due {shortDate(nextMs.dueAt)} &middot; {nextMs.hours} hours</p>
                </div>
                <Button href={`/workspace/${active.project.id}`}>Open workspace <ArrowRight size={16} aria-hidden /></Button>
              </Card>
            ) : (
              <EmptyState title="No active project" body="Apply to a project below and your milestones will show up here." action={<Button href="/projects">Browse projects</Button>} />
            )}
          </section>

          <section aria-labelledby="rec-h">
            <div className="flex items-end justify-between mb-3"><h2 id="rec-h" className="h3">Recommended for you</h2><Link href="/projects" className="text-sm font-semibold">See all</Link></div>
            {recs.loading || !recs.data ? <CardSkeletons n={2} /> : recs.data.items.length === 0 ? <EmptyState title="No open projects right now" body="New projects are posted most weeks." /> : (
              <div className="flex flex-col gap-4">{recs.data.items.slice(0, 3).map((c) => <ProjectCardView key={c.project.id} card={c} />)}</div>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          {d.invites.length > 0 && (
            <Card className="p-5" aria-label="Invites">
              <h2 className="text-base font-semibold text-ink mb-3">Invites to continue</h2>
              <ul className="list-none p-0 m-0 flex flex-col gap-3">
                {d.invites.map((i) => (
                  <li key={i.entry.id} className="text-sm" data-testid="invite">
                    <div className="flex items-center gap-2 flex-wrap"><b className="text-ink font-semibold">{i.venture?.name ?? i.business.name}</b>{i.venture && <YSpaceBadge />}</div>
                    <p>{i.entry.invite?.role}</p>
                    <p className="text-xs mt-1">{i.entry.invite?.message}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-5">
            <div className="flex justify-between items-center mb-3"><h2 className="text-base font-semibold text-ink">Certification roadmap</h2><Link href="/certifications" className="text-sm font-semibold">Open</Link></div>
            <div className="flex flex-col gap-3 text-sm">
              {(["earned", "in_progress", "planned"] as const).map((k) => (
                <div key={k} className="flex justify-between"><span>{k === "earned" ? "Earned" : k === "in_progress" ? "In progress" : "Planned"}</span><b className="text-ink font-semibold">{d.roadmap[k].length}</b></div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink mb-3">Startup pipeline</h2>
            {d.pipeline.length === 0 ? <p className="text-sm">Finish a project with a YSpace startup and you can be invited into its hiring pipeline.</p> : (
              <ul className="list-none p-0 m-0 flex flex-col gap-3 text-sm">
                {d.pipeline.map((p) => <li key={p.entry.id} className="flex justify-between gap-2"><span className="text-ink">{p.venture?.name ?? p.business.name}</span><Badge tone="brand">{STAGE_LABEL[p.entry.stage]}</Badge></li>)}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink mb-3">Profile strength</h2>
            <AnimatedBar value={d.strength} label="Profile strength" />
            <ul className="list-none p-0 m-0 mt-3 flex flex-col gap-1 text-sm">
              {d.strengthItems.map((s) => <li key={s.label} className={s.done ? "text-ink" : ""}>{s.done ? "Done: " : "To do: "}{s.label}</li>)}
            </ul>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
