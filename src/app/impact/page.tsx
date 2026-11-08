"use client";

import { PageContainer } from "@/components/nav";
import { AnimatedBar, CountUp, Reveal, Stagger } from "@/components/motion";
import { Card, ErrorState, PageSkeleton } from "@/components/ui";
import { useQuery, useSession } from "@/hooks/use-query";
import { impact } from "@/services";
import { PROJECT_TYPE_LABEL, EMPLOYER_LABEL, type EmployerType, type ProjectType } from "@/schemas";

function Bars({ rows, unit, label }: { rows: { name: string; value: number }[]; unit: string; label: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul aria-label={label} className="list-none p-0 m-0 flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.name} className="text-sm">
          <div className="flex justify-between mb-1"><span className="text-ink">{r.name}</span><span>{r.value} {unit}</span></div>
          <AnimatedBar value={r.value} max={max} label={`${r.name}: ${r.value} ${unit}`} />
        </li>
      ))}
    </ul>
  );
}

export default function Impact() {
  const { hydrated } = useSession();
  const { data: d, error, loading, refetch } = useQuery(hydrated ? "impact" : null, () => impact.getImpact());
  if (error) return <PageContainer><ErrorState error={error} onRetry={refetch} /></PageContainer>;
  if (loading || !d) return <PageContainer><PageSkeleton rows={6} /></PageContainer>;
  const stats: { label: string; value: number; prefix?: string; suffix?: string; decimals?: number; note: string }[] = [
    { label: "Students placed", value: d.studentsPlaced, note: "On at least one project" },
    { label: "Hours contributed", value: d.hoursContributed, note: "Logged on approved milestones" },
    { label: "Organizations served", value: d.organizationsServed, note: "Posters with a completed project" },
    { label: "Average rating", value: d.averageRating, decimals: 1, suffix: " / 5", note: "From poster reviews" },
    { label: "Skills reviewer approved", value: d.skillsVerified, note: "Backed by a reviewed project" },
    { label: "Stipends paid", value: d.stipendsPaid, prefix: "$", note: "Simulated in this demo" },
    { label: "YSpace ventures active", value: d.venturesActive, note: "Hiring through Launchpad" },
    { label: "Invites to continue", value: d.invitesSent, note: "Sent by founders after a project" },
  ];
  return (
    <PageContainer>
      <h1 className="h1 mb-2">Impact</h1>
      <p className="mb-8 max-w-2xl">What York students and local posters have done together. These numbers come from simulated data in this demo.</p>
      <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="text-xs mb-1">{s.label}</div>
            <div className="text-3xl font-semibold tracking-[-0.02em] text-ink" data-testid={`impact-${s.label.toLowerCase().replace(/\s+/g, "-")}`}><CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} /></div>
            <div className="text-xs mt-1">{s.note}</div>
          </Card>
        ))}
      </Stagger>
      <div className="grid md:grid-cols-2 gap-8">
        <Reveal><Card className="p-6"><h2 className="h3 mb-4">Hours by project type</h2><Bars label="Hours by project type" unit="hours" rows={d.byType.map((t) => ({ name: PROJECT_TYPE_LABEL[t.type as ProjectType] ?? t.type, value: Math.round(t.hours) }))} /></Card></Reveal>
        <Reveal delay={0.05}><Card className="p-6"><h2 className="h3 mb-4">Projects by poster type</h2><Bars label="Projects by poster type" unit="projects" rows={d.byEmployer.map((t) => ({ name: EMPLOYER_LABEL[t.employerType as EmployerType] ?? t.employerType, value: t.projects }))} /></Card></Reveal>
        <Reveal><Card className="p-6"><h2 className="h3 mb-4">Hours by faculty</h2><Bars label="Hours by faculty" unit="hours" rows={d.byFaculty.map((t) => ({ name: t.faculty, value: Math.round(t.hours) }))} /></Card></Reveal>
        <Reveal delay={0.05}><Card className="p-6"><h2 className="h3 mb-4">Hours by month</h2><Bars label="Hours by month" unit="hours" rows={d.byMonth.map((t) => ({ name: t.month, value: Math.round(t.hours) }))} /></Card></Reveal>
      </div>
    </PageContainer>
  );
}
