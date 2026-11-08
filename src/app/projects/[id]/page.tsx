"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Bookmark, Check, X } from "lucide-react";
import { PageContainer } from "@/components/nav";
import { Reveal } from "@/components/motion";
import { Badge, Button, Card, ErrorState, MatchRing, Modal, PageSkeleton, Textarea, WhatNext, YSpaceBadge, toast } from "@/components/ui";
import { payText } from "@/components/project-card";
import { useMe } from "@/components/use-me";
import { useQuery } from "@/hooks/use-query";
import { applications, projects, type ProjectDetail } from "@/services";
import { EMPLOYER_LABEL, LOCATION_LABEL } from "@/schemas";
import { money, shortDate } from "@/lib/utils";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error, loading, refetch } = useQuery(`project:${id}`, () => projects.get(id));
  const { kind } = useMe();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  if (error) return <PageContainer><ErrorState error={error} onRetry={refetch} /></PageContainer>;
  if (loading || !data) return <PageContainer><PageSkeleton /></PageContainer>;
  const c = data;
  const p = c.project;
  const applied = Boolean(c.myApplication);
  const canApply = kind === "student" && p.status === "open" && !applied;

  return (
    <PageContainer className="pb-32">
      <nav aria-label="Breadcrumb" className="text-sm mb-4"><Link href="/projects">Projects</Link> / {p.title}</nav>
      <div className="flex flex-wrap gap-8 items-start justify-between mb-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap text-sm mb-2">
            {c.venture ? <Link href={`/startups/${c.venture.id}`}>{c.business.name}</Link> : <span>{c.business.name}</span>}
            <span aria-hidden>&middot;</span>
            <span>{EMPLOYER_LABEL[c.business.employerType]}</span>
            {c.venture?.yspaceVerified && <YSpaceBadge />}
            {c.business.alumniOwned && <Badge>Alumni owned</Badge>}
          </div>
          <h1 className="h1 mb-3">{p.title}</h1>
          <p className="text-lg">{p.hook}</p>
        </div>
        <div className="flex gap-6">
          {c.match && (
            <div className="flex flex-col items-center gap-1 text-xs"><MatchRing score={c.match.score} size={64} />Match score</div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-8">
        <div className="flex flex-col gap-8 min-w-0">
          <Section title="About this project"><p>{p.description}</p></Section>

          <Section title="Deliverables">
            <ul className="list-disc pl-5 flex flex-col gap-1">{p.deliverables.map((d) => <li key={d}>{d}</li>)}</ul>
          </Section>

          <Section title="Milestones">
            <Card className="divide-y divide-line">
              {p.milestones.map((m, i) => (
                <div key={m.id} className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <span className="text-ink">{i + 1}. {m.title}</span>
                  <span className="text-right">{m.hours}h &middot; due {shortDate(m.dueAt)}{m.amount ? ` · ${money(m.amount)}` : ""}</span>
                </div>
              ))}
            </Card>
          </Section>

          <Section title="What done looks like"><p>{p.doneLooksLike}</p></Section>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="p-4"><h3 className="text-sm font-semibold text-ink mb-2 flex items-center gap-2"><Check size={16} className="text-ok" aria-hidden />Good fit</h3><p className="text-sm">{p.goodFit}</p></Card>
            <Card className="p-4"><h3 className="text-sm font-semibold text-ink mb-2 flex items-center gap-2"><X size={16} className="text-bad" aria-hidden />Not a fit</h3><p className="text-sm">{p.notAFit}</p></Card>
          </div>

          <Section title="Acceptance criteria">
            <p className="text-sm mb-3">{c.business.name} checks each of these and rates them when approving a milestone.</p>
            <Card className="divide-y divide-line">
              {p.acceptance.map((r) => (
                <div key={r} className="px-4 py-3 text-sm flex gap-2"><Check size={16} className="text-brand flex-none mt-0.5" aria-hidden />{r}</div>
              ))}
            </Card>
          </Section>

          {c.strengtheningCerts.length > 0 && (
            <Section title="Certifications that strengthen your application">
              <div className="flex gap-2 flex-wrap">
                {c.strengtheningCerts.map((e) => <Link key={e.id} href="/certifications"><Badge tone="brand">{e.name}</Badge></Link>)}
              </div>
            </Section>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <Card className="p-5 flex flex-col gap-3 text-sm">
            <Row k="Time" v={`${p.hours} hours`} />
            <Row k={p.payType === "stipend" ? "Stipend" : "Pay"} v={payText(p)} />
            <Row k="Deadline" v={shortDate(p.deadline)} />
            <Row k="Applicants" v={String(c.applicantCount)} />
            <Row k="Tools" v={p.tools.join(", ") || "Your choice"} />
            {p.fineprint && <p className="text-xs border-t border-line pt-2">{p.fineprint}</p>}
          </Card>
          {c.match && (
            <Card className="p-5 text-sm">
              <h2 className="text-base font-semibold text-ink mb-3">Why you match</h2>
              <ul className="list-none p-0 m-0 flex flex-col gap-2">
                {c.match.reasons.map((r) => (
                  <li key={r.key} className="flex gap-2"><span aria-hidden className={`mt-1.5 w-2 h-2 rounded-full flex-none ${r.tone === "good" ? "bg-brand" : r.tone === "ok" ? "bg-muted" : "bg-line-strong"}`} />{r.text}</li>
                ))}
              </ul>
            </Card>
          )}
          <Card className="p-5 text-sm">
            <h2 className="text-base font-semibold text-ink mb-2">Difficulty and location</h2>
            <p>{p.difficulty}. {LOCATION_LABEL[p.locationMode]}.</p>
          </Card>
        </aside>
      </div>

      <Reveal>
        <div className="fixed bottom-0 inset-x-0 z-20 bg-white border-t border-line">
          <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-3 flex items-center justify-between gap-4 flex-wrap">
            <div className="text-sm min-w-0"><b className="text-ink font-semibold">{p.title}</b><br />{p.hours} hours &middot; {payText(p)}</div>
            {kind === "student" ? (
              <div className="flex items-center gap-2">
                <Button variant="secondary" aria-pressed={c.saved} loading={saving} onClick={async () => { setSaving(true); try { await (c.saved ? projects.unsave(p.id) : projects.save(p.id)); toast.success(c.saved ? "Removed from saved" : "Saved"); } finally { setSaving(false); } }}><Bookmark size={16} fill={c.saved ? "currentColor" : "none"} aria-hidden />{c.saved ? "Saved" : "Save"}</Button>
                {applied ? <Badge tone="ok">You applied. Status: {c.myApplication!.status}</Badge> : <Button onClick={() => setOpen(true)} disabled={!canApply} data-testid="apply-open">Apply to this project</Button>}
              </div>
            ) : (
              <span className="text-sm">Sign in as a student to apply.</span>
            )}
          </div>
        </div>
      </Reveal>

      <ApplyModal open={open} onClose={() => setOpen(false)} detail={c} />
    </PageContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="h3 mb-3">{title}</h2>
      {children}
    </section>
  );
}
const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between gap-4"><span>{k}</span><b className="text-ink font-semibold text-right">{v}</b></div>
);

function ApplyModal({ open, onClose, detail }: { open: boolean; onClose: () => void; detail: ProjectDetail }) {
  const p = detail.project;
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (text.trim().length < 40) return setErr("Write at least a couple of sentences about why you fit and how you would start.");
    setBusy(true);
    try {
      await applications.apply(p.id, { proposal: text.trim() });
      toast.success("Application sent");
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not send your application");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Apply to ${p.title}`} wide>
      <h2 className="h3 mb-1">Apply to {p.title}</h2>
      <p className="text-sm mb-4">Tell {detail.business.name} why you fit and how you would start.</p>
      <div className="grid md:grid-cols-[1fr_260px] gap-6">
        <div className="flex flex-col gap-3">
          <Textarea label="Your proposal" rows={9} value={text} onChange={(e) => { setText(e.target.value); setErr(null); }} error={err} hint="At least a couple of sentences. Mention one similar thing you have made." />
        </div>
        <div className="flex flex-col gap-4">
          <Card className="p-4 text-sm bg-surface" aria-label="Poster preview">
            <p className="text-xs mb-1">What {detail.business.name} sees</p>
            <p className="text-ink font-semibold">Your name, program and faculty</p>
            <p>Match score {detail.match?.score ?? "n/a"}, your skills with trust labels, and this proposal.</p>
          </Card>
          <WhatNext steps={["The poster reviews your proposal and profile.", "If accepted, a workspace and chat open for this project.", "You submit a link for each milestone."]} />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} loading={busy} data-testid="apply-submit">Send application</Button>
      </div>
    </Modal>
  );
}
