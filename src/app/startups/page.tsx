"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { PageContainer } from "@/components/nav";
import { Stagger, StaggerItem } from "@/components/motion";
import { Badge, Card, CardSkeletons, Chip, EmptyState, ErrorState, Input, YSpaceBadge } from "@/components/ui";
import { useQuery } from "@/hooks/use-query";
import { startups, type VentureFilters } from "@/services";

const SECTORS: Record<string, string> = { mobility: "Mobility", healthtech: "Healthtech", agrifood: "Agri-food", fintech: "Fintech", ai_tools: "AI tools", climate: "Climate", edtech: "Edtech" };
const STAGES: Record<string, string> = { idea: "Idea", prototype: "Prototype", preseed: "Pre-seed", seed: "Seed" };
const STACKS = ["React", "Node.js", "Python", "PostgreSQL", "Next.js"];
const toggle = <T,>(l: T[] | undefined, v: T): T[] => (l?.includes(v) ? l.filter((x) => x !== v) : [...(l ?? []), v]);

export default function Startups() {
  const [f, setF] = useState<VentureFilters>({});
  const [q, setQ] = useState("");
  const filters = useMemo(() => ({ ...f, q: q.trim() || undefined }), [f, q]);
  const { data, error, loading, refetch } = useQuery(`ventures:${JSON.stringify(filters)}`, () => startups.listVentures(filters));
  const groups: { label: string; items: [string, string][]; key: "sector" | "stage" | "stack" }[] = [
    { label: "Sector", key: "sector", items: Object.entries(SECTORS) },
    { label: "Stage", key: "stage", items: Object.entries(STAGES) },
    { label: "Stack", key: "stack", items: STACKS.map((s) => [s, s]) },
  ];
  return (
    <PageContainer>
      <h1 className="h2 mb-1">Startups</h1>
      <p className="mb-6 max-w-2xl">Early ventures from York&apos;s startup community that post small, scoped projects and invite the students who do well to keep going.</p>
      <div className="flex flex-col gap-3 mb-6">
        <div className="max-w-sm"><Input label="Search startups" hideLabel placeholder="Search by name, pitch or stack" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {groups.map((g) => (
          <div key={g.key} className="flex items-center gap-2 flex-wrap" role="group" aria-label={g.label}>
            <span className="text-xs w-14">{g.label}</span>
            {g.items.map(([v, label]) => (
              <Chip key={v} active={(f[g.key] as string[] | undefined)?.includes(v)} onClick={() => setF((s) => ({ ...s, [g.key]: toggle(s[g.key] as string[] | undefined, v) }) as VentureFilters)}>{label}</Chip>
            ))}
          </div>
        ))}
      </div>
      {error ? <ErrorState error={error} onRetry={refetch} /> : loading || !data ? <CardSkeletons n={4} /> : data.length === 0 ? <EmptyState title="No startups match those filters" body="Remove a filter to see more." /> : (
        <Stagger className="grid md:grid-cols-2 gap-4">
          {data.map((v) => (
            <StaggerItem key={v.id}>
              <Card as="article" lift className="p-6 relative h-full" data-testid="venture-card">
                <div className="flex items-start gap-4">
                  <span aria-hidden className="w-12 h-12 rounded-card bg-brand text-white grid place-items-center text-lg font-bold flex-none">{v.name[0]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap"><h2 className="text-lg font-semibold text-ink"><Link href={`/startups/${v.id}`} className="text-ink! hover:text-brand! after:absolute after:inset-0 after:content-['']">{v.name}</Link></h2>{v.yspaceVerified && <YSpaceBadge />}</div>
                    <p className="text-sm mt-1">{v.pitch}</p>
                    <div className="flex gap-2 flex-wrap mt-3"><Badge>{SECTORS[v.sector]}</Badge><Badge>{STAGES[v.stage]}</Badge><span className="text-xs inline-flex items-center gap-1"><Users size={12} aria-hidden />{v.teamSize} people</span><span className="text-xs">{v.location}</span></div>
                    <p className="text-xs mt-3">{v.stack.join(", ")}</p>
                    <p className="text-sm mt-3 font-semibold text-ink">{v.openProjectCount} open project{v.openProjectCount === 1 ? "" : "s"}</p>
                  </div>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </PageContainer>
  );
}
