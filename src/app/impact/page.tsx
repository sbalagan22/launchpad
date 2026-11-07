"use client";

import { PageContainer } from "@/components/nav";
import { Card, ErrorState, PageSkeleton } from "@/components/ui";
import { useQuery, useSession } from "@/hooks/use-query";
import { misc } from "@/services";
import { money } from "@/lib/pay";
import { PROJECT_TYPE_LABEL, type ProjectType } from "@/schemas";

function Bars({ rows, unit, label }: { rows: { name: string; value: number }[]; unit: string; label: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul aria-label={label} className="list-none p-0 m-0 flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.name} className="text-sm">
          <div className="flex justify-between mb-1"><span className="text-ink">{r.name}</span><span>{r.value} {unit}</span></div>
          <div className="h-2 bg-line rounded-sm" aria-hidden><div className="h-full bg-brand rounded-sm" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

export default function Impact() {
  const { hydrated } = useSession();
  const { data: d, error, loading, refetch } = useQuery(hydrated ? "impact" : null, () => misc.getImpact());
  if (error) return <PageContainer><ErrorState error={error} onRetry={refetch} /></PageContainer>;
  if (loading || !d) return <PageContainer><PageSkeleton rows={6} /></PageContainer>;
  const stats: [string, string, string][] = [
    ["Students placed", String(d.studentsPlaced), "Students on at least one project"],
    ["Hours contributed", String(d.hoursContributed), `${d.volunteerHours} of them volunteered`],
    ["Businesses served", String(d.businessesServed), "Small businesses and nonprofits"],
    ["Average rating", `${d.averageRating.toFixed(1)} / 5`, "From business reviews"],
    ["Skills verified", String(d.skillsVerified), "Issuer verified or skill checked"],
    ["Time to first project", `${d.timeToFirstProjectDays} days`, "From sign-up to first accepted proposal"],
  ];
  const total = d.trustMix.issuer + d.trustMix.checked + d.trustMix.self;
  return (
    <PageContainer>
      <div className="mb-8 max-w-[640px]">
        <div className="text-sm font-semibold text-brand mb-2">Impact</div>
        <h1 className="text-[32px] sm:text-[40px] leading-[1.1] tracking-[-0.02em] font-semibold text-ink mb-4">Real work, verified.</h1>
        <p>Every number on this page is computed live from the platform&apos;s projects, applications, reviews and profiles. Complete a project and watch it change.</p>
      </div>
      <section aria-label="Headline numbers" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-12" data-testid="impact-stats">
        {stats.map(([l, v, sub]) => (
          <Card key={l} className="p-6"><div className="text-xs font-medium mb-2">{l}</div><div className="text-[40px] leading-none font-semibold tracking-[-0.02em] text-ink mb-2">{v}</div><div className="text-sm">{sub}</div></Card>
        ))}
      </section>
      <div className="grid gap-8 lg:grid-cols-2 mb-12">
        <Card className="p-6"><h2 className="h3 mb-4">Projects</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm mb-6">
            {[["Completed", d.projectsCompleted], ["In progress or review", d.projectsInProgress], ["Open now", d.openProjects], ["Stipends released", money(d.stipendsPaid)]].map(([l, v]) => <div key={l as string}><dt className="text-xs">{l}</dt><dd className="m-0 text-xl font-semibold text-ink">{v}</dd></div>)}
          </dl>
          <h3 className="text-sm font-semibold text-ink mb-3">Hours by project type</h3>
          <Bars label="Hours by project type" unit="h" rows={d.byType.map((t) => ({ name: PROJECT_TYPE_LABEL[t.type as ProjectType] ?? t.type, value: t.hours }))} />
        </Card>
        <Card className="p-6"><h2 className="h3 mb-4">Where the work happens</h2>
          <h3 className="text-sm font-semibold text-ink mb-3">Projects by city</h3>
          <Bars label="Projects by city" unit="projects" rows={d.byCity.map((c) => ({ name: `${c.city} (${c.businesses} organizations)`, value: c.projects }))} />
          <h3 className="text-sm font-semibold text-ink mt-6 mb-3">Hours by school</h3>
          <Bars label="Hours by school" unit="h" rows={d.bySchool.map((s) => ({ name: `${s.school} (${s.students} students)`, value: s.hours }))} />
        </Card>
        <Card className="p-6"><h2 className="h3 mb-4">Hours verified by month</h2>{d.byMonth.length ? <Bars label="Hours by month" unit="h" rows={d.byMonth.map((m) => ({ name: m.month, value: m.hours }))} /> : <p className="text-sm">No completed projects yet.</p>}</Card>
        <Card className="p-6"><h2 className="h3 mb-4">How skills were proven</h2>
          <Bars label="Skills by trust level" unit="skills" rows={[{ name: "Issuer verified", value: d.trustMix.issuer }, { name: "Skill checked", value: d.trustMix.checked }, { name: "Self-reported", value: d.trustMix.self }]} />
          <p className="text-sm mt-4">{total ? Math.round(((d.trustMix.issuer + d.trustMix.checked) / total) * 100) : 0}% of listed skills are backed by an issuer or a reviewed project.</p>
        </Card>
      </div>
      <p className="text-xs">Demo data: computed from simulated entities in the mock service layer, not real placements.</p>
    </PageContainer>
  );
}
