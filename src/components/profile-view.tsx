"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Briefcase, Code, Copy, Globe, Link2, MapPin } from "lucide-react";
import { PageContainer } from "@/components/nav";
import { CountUp, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Avatar, Badge, Button, Card, ErrorState, PageSkeleton, Stars, TrustBadge, YSpaceBadge, toast } from "@/components/ui";
import { useQuery } from "@/hooks/use-query";
import { profile } from "@/services";
import { fmtDate, fmtMonthYear } from "@/lib/dates";
import { money } from "@/lib/pay";

export function PublicProfile({ slug, own }: { slug: string; own?: boolean }) {
  const { data, error, loading, refetch } = useQuery(`profile:${slug}`, () => profile.publicProfile(slug));
  const [qr, setQr] = useState<string>("");
  const url = typeof window === "undefined" ? `/u/${slug}` : `${window.location.origin}/u/${slug}`;
  useEffect(() => { QRCode.toDataURL(url, { margin: 1, width: 160, color: { dark: "#0a0a0a", light: "#ffffff" } }).then(setQr).catch(() => setQr("")); }, [url]);
  if (error) return <PageContainer><ErrorState error={error} onRetry={refetch} /></PageContainer>;
  if (loading || !data) return <PageContainer><PageSkeleton rows={5} /></PageContainer>;
  const s = data.student;
  const tierOf = (c: (typeof data.claims)[number]) => c.claim.tier;
  const issuer = data.claims.filter((c) => tierOf(c) === "issuer");
  const self = data.claims.filter((c) => tierOf(c) === "self");
  const reviewed = s.skills.filter((k) => k.trust === "reviewed");
  const selfSkills = s.skills.filter((k) => k.trust === "self");
  const copy = async () => { try { await navigator.clipboard.writeText(url); toast.success("Profile link copied"); } catch { toast.error("Could not copy the link"); } };

  return (
    <PageContainer>
      <Reveal>
        <Card className="p-6 md:p-8 mb-8">
          <div className="flex flex-wrap gap-6 items-start justify-between">
            <div className="flex gap-5 items-start min-w-0">
              <Avatar name={s.name} size={80} tone="brand" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap"><h1 className="h1">{s.name}</h1>{s.yorkVerified && <Badge tone="brand">York verified</Badge>}</div>
                <p className="mt-1">{s.program}, {s.faculty}, year {s.year}, {s.campus} campus</p>
                <p className="text-sm mt-1 flex flex-wrap gap-x-4 gap-y-1"><span className="inline-flex items-center gap-1"><MapPin size={14} aria-hidden />{s.city}</span><span className="inline-flex items-center gap-1"><Briefcase size={14} aria-hidden />{s.hoursPerWeek} hours a week, open to {s.pref === "both" ? "paid or volunteer" : s.pref === "paid" ? "paid work" : "volunteer work"}</span></p>
                <p className="text-sm mt-1">Languages: {s.languages.join(", ")}</p>
                <div className="flex gap-3 mt-3 flex-wrap text-sm">
                  {s.portfolioUrl && <a href={s.portfolioUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold"><Globe size={14} aria-hidden />Portfolio</a>}
                  {s.github && <a href={s.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold"><Code size={14} aria-hidden />GitHub</a>}
                  {s.linkedin && <a href={s.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold"><Link2 size={14} aria-hidden />LinkedIn</a>}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 text-center" data-testid="share">
              {qr &&   <img src={qr} alt={`QR code for ${s.name}'s profile`} width={96} height={96} className="rounded-control border border-line" />}
              <Button variant="secondary" size="sm" onClick={copy}><Copy size={14} aria-hidden />Copy link</Button>
              <span className="text-[11px] text-muted break-all max-w-[160px]">/u/{s.slug}</span>
            </div>
          </div>
          <p className="mt-6 max-w-3xl">{s.bio}</p>
          {s.interests.length > 0 && <div className="flex gap-2 flex-wrap mt-3">{s.interests.map((i) => <Badge key={i}>{i}</Badge>)}</div>}
        </Card>
      </Reveal>

      <Stagger className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {([["Completed", data.completed.length, 0], ["Verified hours", data.verifiedHours, 0], ["Average review", data.averageReview, 2], ["Badges", data.badges.length, 0], ["Issuer-verified certs", issuer.length, 0]] as const).map(([l, v, d]) => (
          <StaggerItem key={l}><Card className="p-5"><div className="text-xs mb-1">{l}</div><div className="text-3xl font-semibold tracking-[-0.02em] text-ink"><CountUp value={v} decimals={d} /></div></Card></StaggerItem>
        ))}
      </Stagger>

      <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
        <div className="flex flex-col gap-10 min-w-0">
          <section aria-labelledby="ev-h">
            <h2 id="ev-h" className="h3 mb-1">Evidence</h2>
            <p className="text-sm mb-4">Each item below was approved by the poster who ran the project. Launchpad does not grade the work.</p>
            {data.completed.length === 0 ? <Card className="p-5 text-sm">No finished projects yet. Skills and certifications below are self-reported until a poster approves a project.</Card> : (
              <div className="flex flex-col gap-4">
                {data.completed.map((c) => (
                  <Card key={c.project.id} className="p-5" data-testid="evidence">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0"><p className="text-xs flex items-center gap-2 flex-wrap">{c.venture ? <Link href={`/startups/${c.venture.id}`}>{c.business.name}</Link> : c.business.name}{c.venture && <YSpaceBadge />}</p><h3 className="text-base font-semibold text-ink">{c.project.title}</h3></div>
                      <TrustBadge trust="reviewed" />
                    </div>
                    <p className="text-sm mt-1">{c.project.hours} hours, {c.project.payType === "volunteer" ? "volunteer" : money(c.project.pay)}, finished {fmtDate(c.project.milestones[2]?.approvedAt ?? c.project.deadline, { month: "short", year: "numeric" })}</p>
                    <div className="flex gap-2 flex-wrap mt-2">{c.badges.map((b) => <Badge key={b.id} tone="brand">{b.skill}</Badge>)}</div>
                    {c.review && (
                      <div className="mt-3 bg-surface rounded-control p-3">
                        <div className="flex items-center gap-2"><Stars value={Math.round(c.review.rating)} size={14} /><span className="text-xs">{c.review.rating} of 5 from {c.review.by}</span></div>
                        <p className="text-sm mt-1">&ldquo;{c.review.text}&rdquo;</p>
                        {c.review.ratings.length > 0 && <ul className="list-none p-0 m-0 mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1">{c.review.ratings.map((r) => <li key={r.criterion} className="flex items-center justify-between gap-2 text-xs"><span className="truncate">{r.criterion}</span><Stars value={r.rating} size={11} /></li>)}</ul>}
                      </div>
                    )}
                    {c.submissionUrl && <a href={c.submissionUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold inline-block mt-3">View the work</a>}
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="sk-h">
            <h2 id="sk-h" className="h3 mb-3">Skills</h2>
            <Card className="p-5 flex flex-col gap-4">
              {reviewed.length > 0 && <div><p className="text-xs mb-2">Approved by a poster</p><ul className="list-none p-0 m-0 flex flex-wrap gap-2">{reviewed.map((k) => <li key={k.name} className="border border-brand/30 bg-tint rounded-control px-3 py-1.5 text-sm flex items-center gap-2"><b className="text-ink font-semibold">{k.name}</b><span className="text-xs">{k.level}</span><TrustBadge trust="reviewed" showLabel={false} /></li>)}</ul></div>}
              <div><p className="text-xs mb-2">Self-reported</p><ul className="list-none p-0 m-0 flex flex-wrap gap-2">{selfSkills.map((k) => <li key={k.name} className="border border-line rounded-control px-3 py-1.5 text-sm flex items-center gap-2"><b className="text-ink font-medium">{k.name}</b><span className="text-xs">{k.level}</span></li>)}{selfSkills.length === 0 && <li className="text-sm">None.</li>}</ul></div>
            </Card>
          </section>

          {data.highlyRated.length > 0 && (
            <section aria-labelledby="rv-h">
              <h2 id="rv-h" className="h3 mb-3">What posters say</h2>
              <div className="grid sm:grid-cols-2 gap-4">{data.highlyRated.map((r) => <Card key={r.review.id} className="p-5"><Stars value={Math.round(r.review.rating)} size={14} /><p className="text-sm mt-2">&ldquo;{r.review.text}&rdquo;</p><p className="text-xs mt-2">{r.review.by}, {r.business.name}</p></Card>)}</div>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <Card className="p-5" aria-label="Certifications">
            <h2 className="text-base font-semibold text-ink mb-3">Certifications</h2>
            <div className="flex flex-col gap-4">
              <div><p className="text-xs mb-2">Issuer verified</p>{issuer.length === 0 ? <p className="text-sm">None yet.</p> : <ul className="list-none p-0 m-0 flex flex-col gap-2">{issuer.map((c) => <li key={c.claim.id} data-testid="cert-issuer"><b className="text-sm text-ink font-semibold block">{c.entry?.name ?? c.claim.customName}</b><TrustBadge trust="issuer" /><span className="text-xs ml-2">{c.claim.issuedAt ? `Issued ${fmtMonthYear(c.claim.issuedAt)}` : ""}</span></li>)}</ul>}</div>
              <div><p className="text-xs mb-2">Not verified</p>{self.length === 0 ? <p className="text-sm">None.</p> : <ul className="list-none p-0 m-0 flex flex-col gap-2">{self.map((c) => <li key={c.claim.id} data-testid="cert-self"><b className="text-sm text-ink font-medium block">{c.entry?.name ?? c.claim.customName}</b><TrustBadge trust="self" /><span className="text-xs ml-2">{c.claim.status.replace("_", " ")}</span>{c.claim.note && <span className="block text-xs">{c.claim.note}</span>}</li>)}</ul>}</div>
            </div>
            <p className="text-xs mt-4">Uploading a certificate file never verifies it. Only the issuer can.</p>
          </Card>
          {own && data.invites.length > 0 && (
            <Card className="p-5"><h2 className="text-base font-semibold text-ink mb-3">Invites to continue</h2>{data.invites.map((i) => <div key={i.entry.id} className="text-sm"><b className="text-ink font-semibold">{i.venture?.name ?? i.business.name}</b><p>{i.entry.invite?.role}</p></div>)}</Card>
          )}
          <Card className="p-5 text-sm"><h2 className="text-base font-semibold text-ink mb-2">Member since</h2><p>{fmtMonthYear(s.createdAt)}</p></Card>
        </aside>
      </div>
    </PageContainer>
  );
}
