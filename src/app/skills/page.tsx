"use client";

import { useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/nav";
import { AddCertCard, CertRow } from "@/components/add-cert";
import { Badge, Chip, EmptyState, ErrorState, Card, PageSkeleton, Segmented, TrustBadge, Skeleton } from "@/components/ui";
import { useQuery, useSession } from "@/hooks/use-query";
import { certs, students } from "@/services";
import { PROJECT_TYPE_LABEL, ProjectType } from "@/schemas";

export default function Skills() {
  const { userId, role, hydrated } = useSession();
  const sid = role === "student" && hydrated ? userId : null;
  const profile = useQuery(sid ? `profile:${sid}` : null, () => students.getProfile({ id: sid! }));
  const lib = useQuery(sid ? "certs:lib" : null, () => certs.listCertifications());
  const [field, setField] = useState("All");
  const [targets, setTargets] = useState<ProjectType[]>(["web"]);
  const recs = useQuery(sid ? `recs:${sid}:${targets.join(",")}` : null, () => certs.recommendPath(sid!, targets));

  if (role === "business") return <PageContainer><EmptyState title="Skills are a student feature" body="Switch to Student view to manage verified skills." /></PageContainer>;
  if (profile.error) return <PageContainer><ErrorState error={profile.error} onRetry={profile.refetch} /></PageContainer>;
  if (!profile.data || !lib.data) return <PageContainer><PageSkeleton /></PageContainer>;
  const { student, claims } = profile.data;
  const fields = ["All", ...Array.from(new Set(lib.data.map((c) => c.field)))];
  const shown = lib.data.filter((c) => field === "All" || c.field === field);
  const claimFor = (id: string) => claims.find((c) => c.cert.id === id)?.claim;
  const order = { issuer: 0, checked: 1, self: 2 } as const;
  const skills = [...student.skills].sort((a, b) => order[a.trust] - order[b.trust]);
  const toggle = (t: ProjectType) => setTargets((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  return (
    <PageContainer>
      <h1 className="h2 mb-1">Verified skills</h1>
      <p className="text-sm mb-8">Employers see a trust level next to every skill and certification on your public profile.</p>
      <div className="flex flex-wrap gap-8 items-start">
        <div className="flex-[2_1_560px] min-w-0">
          <div className="border border-line rounded-card overflow-x-auto mb-12">
            <div className="min-w-[520px]" role="table" aria-label="Your skills">
              <div className="grid grid-cols-[1fr_168px_1.2fr] gap-4 px-6 py-2 bg-surface border-b border-line text-xs font-medium" role="row"><span>Skill</span><span>Trust level</span><span>Evidence</span></div>
              {skills.map((s) => (
                <div key={s.name} role="row" className="grid grid-cols-[1fr_168px_1.2fr] gap-4 px-6 py-4 border-t border-line first:border-t-0 text-sm items-center"><span className="font-semibold text-ink">{s.name}</span><TrustBadge trust={s.trust} /><span>{s.evidence.map((e) => e.label).join(", ") || "None yet"}</span></div>
              ))}
            </div>
          </div>

          <section aria-labelledby="rec" className="mb-12">
            <h2 id="rec" className="h3 mb-1">Cert path recommender</h2>
            <p className="text-sm mb-4">Pick the kinds of projects you want to qualify for. Launchpad ranks certifications that unlock them and are not already on your profile.</p>
            <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Target project types">{ProjectType.options.map((t) => <Chip key={t} active={targets.includes(t)} onClick={() => toggle(t)}>{PROJECT_TYPE_LABEL[t]}</Chip>)}</div>
            {recs.loading ? <Skeleton className="h-24 w-full" /> : !targets.length ? <EmptyState title="Pick at least one project type" /> : !recs.data?.length ? <EmptyState title="Nothing left to recommend" body="You already hold the certifications that unlock these project types." /> : (
              <Card as="div"><ol className="list-none p-0 m-0">{recs.data.map((r, i) => (
                <li key={r.cert.id} className="flex gap-4 px-6 py-4 border-t border-line first:border-t-0 text-sm">
                  <span className="text-ink font-semibold w-5">{i + 1}</span>
                  <div className="flex-1"><a href={r.cert.url} target="_blank" rel="noreferrer" className="font-semibold">{r.cert.name}</a><div className="text-xs mb-1">{r.cert.provider} · {r.cert.length}</div><p>{r.reason}</p><div className="flex gap-1 mt-2 flex-wrap">{r.unlocks.map((u) => <Badge key={u} tone="brand">Unlocks {PROJECT_TYPE_LABEL[u].toLowerCase()}</Badge>)}</div></div>
                </li>
              ))}</ol></Card>
            )}
          </section>

          <h2 className="h3 mb-1">Certification library</h2>
          <p className="text-sm mb-4">Courses open on the provider&apos;s site. Come back here to verify the credential.</p>
          <div className="mb-4"><Segmented label="Filter by field" value={field} onChange={setField} options={fields.map((f) => ({ value: f, label: f }))} /></div>
          {shown.length === 0 ? <EmptyState title="No certifications in this field" /> : (
            <div className="border border-line rounded-card overflow-hidden">{shown.map((c) => <CertRow key={c.id} cert={c} status={claimFor(c.id)?.tier} />)}</div>
          )}
          <p className="text-xs mt-4">Estimated hours are approximate. <Link href="/profile">See how these appear on your profile.</Link></p>
        </div>
        <div className="flex-[1_1_320px] min-w-0 lg:sticky lg:top-24"><AddCertCard studentId={student.id} library={lib.data} /></div>
      </div>
    </PageContainer>
  );
}
