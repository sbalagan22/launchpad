"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { PageContainer } from "@/components/nav";
import { AddCertFlow } from "@/components/cert-flow";
import { Stagger, StaggerItem } from "@/components/motion";
import { Badge, Button, Card, CardSkeletons, Drawer, EmptyState, ErrorState, Input, Segmented, Select, TrustBadge, toast } from "@/components/ui";
import { useQuery, useSession } from "@/hooks/use-query";
import { certs, type ClaimView } from "@/services";
import type { CatalogEntry, CertStatus } from "@/schemas";
import { fmtDate } from "@/lib/dates";

const CATS = ["All", "Cloud", "Cybersecurity", "Software and Web", "DevOps", "Data and AI", "Agile and Product"] as const;

export default function Certifications() {
  const { role, userId, hydrated } = useSession();
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState<{ certId?: string } | null>(null);
  const student = role === "student";
  const catalog = useQuery(`catalog:${cat}:${q}`, () => certs.catalog({ category: cat === "All" ? undefined : cat, q: q.trim() || undefined }));
  const all = useQuery("catalog:all", () => certs.catalog());
  const mine = useQuery(hydrated && student ? `mycerts:${userId}` : null, () => certs.myCerts());
  const paths = useQuery(hydrated ? `paths:${userId}` : null, () => certs.pathways());

  if (catalog.error) return <PageContainer><ErrorState error={catalog.error} onRetry={catalog.refetch} /></PageContainer>;
  const claims = mine.data ?? [];
  const groups: { key: string; title: string; items: ClaimView[] }[] = [
    { key: "earned", title: "Earned", items: claims.filter((c) => c.claim.status === "earned") },
    { key: "in_progress", title: "In progress", items: claims.filter((c) => c.claim.status === "in_progress") },
    { key: "planned", title: "Planned", items: claims.filter((c) => c.claim.status === "planned") },
  ];
  return (
    <PageContainer>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-2"><h1 className="h1">Certifications</h1>{student && <Button onClick={() => setAdding({})} data-testid="add-cert"><Plus size={16} aria-hidden />Add a certification</Button>}</div>
      <p className="mb-2 max-w-2xl">Certifications strengthen your match for the projects that list them. Launchpad does not issue, grade or test any of them. Only the issuer can verify a credential.</p>
      <p className="text-xs mb-8">Prices checked November 2026. Confirm current prices with each issuer. Free for students: freeCodeCamp, and GitHub Foundations for verified GitHub Education students.</p>

      {student && (
        <section aria-labelledby="road-h" className="mb-12">
          <h2 id="road-h" className="h3 mb-3">Your roadmap</h2>
          {mine.loading && !mine.data ? <CardSkeletons n={2} /> : claims.length === 0 ? <EmptyState title="Your roadmap is empty" body="Add a certification you have, are studying for, or plan to take." action={<Button onClick={() => setAdding({})}>Add a certification</Button>} /> : (
            <div className="grid md:grid-cols-3 gap-4">
              {groups.map((g) => (
                <div key={g.key} className="bg-surface rounded-card p-3" data-testid={`road-${g.key}`}>
                  <h3 className="text-sm font-semibold text-ink px-1 mb-3 flex justify-between"><span>{g.title}</span><span className="text-body font-medium">{g.items.length}</span></h3>
                  <ul className="list-none p-0 m-0 flex flex-col gap-3">
                    {g.items.length === 0 && <li className="text-sm px-1">Nothing here yet.</li>}
                    {g.items.map((c) => <li key={c.claim.id}><ClaimCard c={c} onOpen={() => c.entry && setOpen(c.entry.id)} /></li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {paths.data && (
        <section aria-labelledby="path-h" className="mb-12">
          <h2 id="path-h" className="h3 mb-3">Starter pathways</h2>
          <Stagger className="grid md:grid-cols-3 gap-4">
            {paths.data.map((p) => {
              const done = p.steps.filter((s) => s.claim?.status === "earned").length;
              return (
                <StaggerItem key={p.id}>
                  <Card className="p-5 h-full flex flex-col gap-3" data-testid="pathway">
                    <div><h3 className="text-base font-semibold text-ink">{p.name}</h3><p className="text-sm">{p.description}</p></div>
                    <ol className="list-none p-0 m-0 flex flex-col gap-2 text-sm flex-1">
                      {p.steps.map((s, i) => <li key={s.entry.id} className="flex gap-2 items-start"><span className="w-5 h-5 rounded-full border border-line text-xs grid place-items-center flex-none mt-0.5">{i + 1}</span><button type="button" onClick={() => setOpen(s.entry.id)} className="text-left cursor-pointer bg-transparent border-0 p-0 text-body hover:text-ink">{s.entry.name}{s.claim && <span className="text-xs"> ({s.claim.status === "earned" ? "earned" : s.claim.status === "in_progress" ? "in progress" : "planned"})</span>}</button></li>)}
                    </ol>
                    {student && <p className="text-xs">{done} of {p.steps.length} earned</p>}
                  </Card>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>
      )}

      <section aria-labelledby="cat-h">
        <h2 id="cat-h" className="h3 mb-3">Catalog</h2>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Segmented id="cert-cat" label="Category" size="sm" value={cat} onChange={setCat} options={CATS.map((c) => ({ value: c, label: c }))} />
          <div className="w-60"><Input label="Search certifications" hideLabel placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </div>
        {catalog.loading || !catalog.data ? <CardSkeletons n={4} /> : catalog.data.length === 0 ? <EmptyState title="No certifications match" body="Try another category or search." /> : (
          <div className="grid md:grid-cols-2 gap-4">
            {catalog.data.map((e) => (
              <Card key={e.id} lift className="p-5 relative" data-testid="cert-card">
                <p className="text-xs">{e.issuer} &middot; {e.category}</p>
                <h3 className="text-base font-semibold text-ink"><button type="button" onClick={() => setOpen(e.id)} className="text-left cursor-pointer bg-transparent border-0 p-0 text-ink hover:text-brand after:absolute after:inset-0 after:content-['']">{e.name}</button></h3>
                <p className="text-sm mt-1 line-clamp-2">{e.whatItProves}</p>
                <div className="flex gap-2 flex-wrap mt-3 text-xs"><Badge>{e.level}</Badge><Badge>{e.costUsd === null ? "Free" : `US$${e.costUsd}`}</Badge><Badge>{e.studyHours} study hours</Badge>{!e.verificationConfirmed && <Badge tone="warn">Verification method unconfirmed</Badge>}</div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <CertDrawer id={open} onClose={() => setOpen(null)} student={student} onVerify={(certId) => { setOpen(null); setAdding({ certId }); }} />
      {adding && <AddCertFlow key={adding.certId ?? "new"} open onClose={() => setAdding(null)} catalog={all.data ?? []} initialCertId={adding.certId} />}
    </PageContainer>
  );
}

function ClaimCard({ c, onOpen }: { c: ClaimView; onOpen: () => void }) {
  const name = c.entry?.name ?? c.claim.customName ?? "Certification";
  return (
    <Card className="p-3" data-testid="claim" data-tier={c.claim.tier}>
      <button type="button" onClick={onOpen} className="text-left w-full cursor-pointer bg-transparent border-0 p-0"><b className="text-sm font-semibold text-ink block">{name}</b><span className="text-xs">{c.entry?.issuer ?? "Other"}</span></button>
      <div className="mt-2 flex items-center justify-between gap-2 flex-wrap"><TrustBadge trust={c.claim.tier} />{c.claim.issuedAt && <span className="text-xs">Issued {fmtDate(c.claim.issuedAt, { month: "short", year: "numeric" })}</span>}</div>
      {c.claim.note && <p className="text-xs mt-1">{c.claim.note}</p>}
    </Card>
  );
}

function CertDrawer({ id, onClose, student, onVerify }: { id: string | null; onClose: () => void; student: boolean; onVerify: (id: string) => void }) {
  const { data } = useQuery(id ? `cert:${id}` : null, () => certs.getCert(id!));
  const [busy, setBusy] = useState(false);
  const set = async (status: CertStatus) => { setBusy(true); try { await certs.setRoadmapStatus(id!, status); toast.success("Roadmap updated"); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not update"); } finally { setBusy(false); } };
  const e: CatalogEntry | undefined = data?.entry;
  return (
    <Drawer open={Boolean(id)} onClose={onClose} title={e?.name ?? "Certification"}>
      {!e ? <p>Loading</p> : (
        <div className="flex flex-col gap-4 text-sm">
          <div><p className="text-xs">{e.issuer} &middot; {e.category} &middot; {e.level}</p><h2 className="h3">{e.name}</h2></div>
          <p>{e.whatItProves}</p>
          <dl className="grid grid-cols-2 gap-3 m-0">
            {[["Cost", e.costUsd === null ? "Free" : `US$${e.costUsd}`], ["Cost note", e.costNote], ["Valid for", e.validity], ["Study time", `${e.studyHours} hours`]].map(([k, v]) => <div key={k}><dt className="text-xs">{k}</dt><dd className="m-0 text-ink font-medium">{v}</dd></div>)}
          </dl>
          <div><p className="text-xs">How it is verified</p><p>{e.verification}</p>{!e.verificationConfirmed && <p className="text-warn text-xs mt-1">This method is not confirmed yet. Check with the issuer.</p>}</div>
          <div className="flex gap-3 flex-wrap"><a href={e.freePrepUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold">{e.freePrep}<ExternalLink size={13} aria-hidden /></a><a href={e.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold">Issuer page<ExternalLink size={13} aria-hidden /></a></div>
          <div>
            <p className="text-xs mb-1">Strengthens {data!.strengthens.length} open project{data!.strengthens.length === 1 ? "" : "s"}</p>
            {data!.strengthens.length > 0 && <Link href={`/projects?cert=${e.id}`} className="font-semibold">See those projects</Link>}
          </div>
          {student && (
            <div className="flex flex-col gap-2 border-t border-line pt-4">
              {data!.myClaim && <div className="flex items-center gap-2"><TrustBadge trust={data!.myClaim.tier} /><span className="text-xs">{data!.myClaim.status.replace("_", " ")}</span></div>}
              {data!.myClaim?.tier !== "issuer" && (
                <>
                  <Select label="Roadmap status" value={data!.myClaim?.status ?? ""} disabled={busy} onChange={(ev) => set(ev.target.value as CertStatus)} options={[{ value: "", label: "Not on my roadmap" }, { value: "planned", label: "Planned" }, { value: "in_progress", label: "In progress" }, { value: "earned", label: "Earned (self-reported)" }].filter((o) => o.value !== "" || !data!.myClaim)} />
                  <Button onClick={() => onVerify(e.id)} data-testid="drawer-verify">Verify with issuer</Button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
