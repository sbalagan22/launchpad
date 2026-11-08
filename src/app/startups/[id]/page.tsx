"use client";

import { use } from "react";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { PageContainer } from "@/components/nav";
import { ProjectCardView } from "@/components/project-card";
import { Avatar, Badge, Card, ErrorState, PageSkeleton, Stars, YSpaceBadge } from "@/components/ui";
import { Reveal } from "@/components/motion";
import { useQuery } from "@/hooks/use-query";
import { startups } from "@/services";
import { fmtMonthYear } from "@/lib/dates";

export default function Venture({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error, loading, refetch } = useQuery(`venture:${id}`, () => startups.getVenture(id));
  if (error) return <PageContainer><ErrorState error={error} onRetry={refetch} /></PageContainer>;
  if (loading || !data) return <PageContainer><PageSkeleton /></PageContainer>;
  const v = data.venture;
  return (
    <PageContainer>
      <nav aria-label="Breadcrumb" className="text-sm mb-4"><Link href="/projects">Projects</Link> / {v.name}</nav>
      <Reveal>
        <div className="flex items-start gap-5 mb-8 flex-wrap">
          <span aria-hidden className="w-16 h-16 rounded-card bg-brand text-white grid place-items-center text-2xl font-bold">{v.name[0]}</span>
          <div className="flex-1 min-w-[260px]">
            <div className="flex items-center gap-2 flex-wrap"><h1 className="h1">{v.name}</h1><YSpaceBadge />{data.founderVerified && <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-press" data-testid="founder-verified"><BadgeCheck size={14} aria-hidden />Founder verified</span>}</div>
            <p className="text-lg mt-2 max-w-2xl">{v.pitch}</p>
          </div>
        </div>
      </Reveal>
      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="flex flex-col gap-8 min-w-0">
          <section aria-labelledby="open-h">
            <h2 id="open-h" className="h3 mb-3">Open projects</h2>
            {data.openProjects.length === 0 ? <p className="text-sm">No open projects right now.</p> : <div className="flex flex-col gap-4">{data.openProjects.map((c) => <ProjectCardView key={c.project.id} card={c} />)}</div>}
          </section>
          <section aria-labelledby="past-h">
            <h2 id="past-h" className="h3 mb-3">Past projects</h2>
            {data.past.length === 0 ? <p className="text-sm">No finished projects yet.</p> : (
              <div className="flex flex-col gap-3">
                {data.past.map((x) => (
                  <Card key={x.project.id} className="p-5">
                    <div className="flex justify-between gap-3 flex-wrap"><b className="text-ink font-semibold">{x.project.title}</b><span className="text-xs">with {x.student.name}</span></div>
                    {x.review && <div className="mt-2"><div className="flex items-center gap-2"><Stars value={Math.round(x.review.rating)} size={14} /><span className="text-xs">{x.review.rating} of 5</span></div><p className="text-sm mt-1">&ldquo;{x.review.text}&rdquo;</p></div>}
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
        <aside className="flex flex-col gap-4">
          <Card className="p-5 text-sm flex flex-col gap-2">
            <h2 className="text-base font-semibold text-ink">About</h2>
            <Row k="Stage" v={v.stage === "preseed" ? "Pre-seed" : v.stage[0].toUpperCase() + v.stage.slice(1)} />
            <Row k="Team" v={`${v.teamSize} people`} />
            <Row k="Location" v={v.location} />
            <Row k="Founded" v={fmtMonthYear(v.foundedAt)} />
            {v.waitlist ? <Row k="Waitlist" v={`${v.waitlist} people`} /> : null}
            <div className="pt-2 border-t border-line"><p className="text-xs mb-1">Stack</p><div className="flex gap-1 flex-wrap">{v.stack.map((s) => <Badge key={s}>{s}</Badge>)}</div></div>
          </Card>
          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink mb-3">Founders</h2>
            <ul className="list-none p-0 m-0 flex flex-col gap-4">
              {v.founders.map((f) => <li key={f.name} className="flex gap-3"><Avatar name={f.name} size={40} /><div><b className="text-ink font-semibold text-sm">{f.name}</b><span className="text-xs block">{f.role}</span>{f.bio && <p className="text-sm mt-1">{f.bio}</p>}</div></li>)}
            </ul>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
const Row = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between gap-3"><span>{k}</span><b className="text-ink font-semibold">{v}</b></div>;
