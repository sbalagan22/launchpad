"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/nav";
import { RoleButton } from "@/components/role-link";
import { AiNote, Badge, Button, Card, Chip, EmptyState, Input, Skeleton, Spinner, cx, toast } from "@/components/ui";
import { useQuery, useSession } from "@/hooks/use-query";
import { ai, projects, students, ServiceError } from "@/services";
import { splitPay, money } from "@/lib/pay";
import { streamText } from "@/lib/stream";
import type { ProjectType, ScopeResult } from "@/schemas";

const STEPS = ["Reading your request", "Defining deliverables", "Estimating hours and pay", "Matching required skills"];
const EXAMPLES: [string, string][] = [
  ["Bakery website", "I need a simple website with our menu, hours, and an online order form."],
  ["Social media plan", "We need a social media plan for our youth programs, with a content calendar and sample posts."],
  ["Landscaping logo", "We need a logo for our landscaping company that works on trucks and uniforms."],
  ["Dental data cleanup", "Our patient list has duplicate records and inconsistent fields. We need the spreadsheet cleaned up."],
];

type Draft = { title: string; type: ProjectType; summary: string; deliverables: string[]; milestones: { title: string; dueInDays: number }[]; skills: string[]; hours: number; payType: "stipend" | "volunteer"; pay: number; payMin: number; payMax: number; beginner: ScopeResult["beginnerFriendly"]; badgeSkills: string[] };

export default function NewProject() {
  const router = useRouter();
  const { role, userId, hydrated } = useSession();
  const bid = role === "business" && hydrated ? userId : null;
  const biz = useQuery(bid ? `biz:${bid}` : null, () => students.getBusiness(bid!));
  const [brief, setBrief] = useState(EXAMPLES[0][1]);
  const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle");
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [source, setSource] = useState<"real" | "mock">("mock");
  const [summaryText, setSummaryText] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  if (role === "student") return <PageContainer><EmptyState title="Posting projects is a business feature" body="Switch to Business view in the top bar." action={<RoleButton role="business" href="/business/new">Switch to Business view</RoleButton>} /></PageContainer>;
  const b = biz.data;
  const volunteerOk = b?.kind === "nonprofit";

  const scope = async () => {
    if (!b) return;
    setError(null); setPhase("loading"); setStep(0);
    timers.current.forEach(clearTimeout);
    timers.current = [600, 1200, 1800].map((t, i) => setTimeout(() => setStep(i + 1), t));
    const minWait = new Promise((r) => timers.current.push(setTimeout(r, 2400)));
    try {
      const [r] = await Promise.all([ai.scopeProject({ brief, businessId: b.id }), minWait]);
      const s = r.result;
      setSource(r.source);
      setDraft({ title: s.title, type: s.type, summary: s.summary, deliverables: s.deliverables, milestones: s.milestones.map((m) => ({ title: m.title, dueInDays: m.dueInDays })), skills: s.skills, hours: s.hours, payType: s.payType, pay: s.pay, payMin: s.payMin, payMax: s.payMax, beginner: s.beginnerFriendly, badgeSkills: s.badgeSkills });
      setPhase("done");
      setSummaryText("");
      void streamText(s.summary, setSummaryText, { wordsPerTick: 2, tickMs: 30 });
    } catch (e) {
      setPhase("idle");
      setError(e instanceof ServiceError ? e.message : "Scoping failed. Try again.");
    }
  };

  const publish = async () => {
    if (!draft || !b) return;
    setError(null);
    if (draft.hours > 25) return setError("Projects are capped at 25 hours. Reduce the estimate or split the project.");
    setPublishing(true);
    try {
      const p = await projects.publishProject({
        businessId: b.id, title: draft.title, type: draft.type, description: draft.summary, deliverables: draft.deliverables.filter((d) => d.trim()),
        milestones: draft.milestones.map((m) => ({ ...m, amount: 0 })), skills: draft.skills, hours: draft.hours, payType: draft.payType, pay: draft.payType === "volunteer" ? 0 : draft.pay, badgeSkills: draft.badgeSkills, beginnerFriendly: draft.beginner.ok,
      });
      toast.success(`${p.title} is published.`);
      router.push(`/business?published=${p.id}`);
    } catch (e) {
      setError(e instanceof ServiceError ? e.message : "Could not publish.");
      setPublishing(false);
    }
  };

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  return (
    <PageContainer className="pt-16">
      {phase === "idle" && (
        <div className="max-w-[720px]">
          <div className="text-sm font-semibold text-brand mb-2">New project</div>
          <h1 className="text-[32px] sm:text-[40px] leading-[1.1] tracking-[-0.02em] font-semibold mb-4 text-ink">Describe what you need.</h1>
          <p className="mb-8">Write it the way you would tell a colleague. Launchpad turns it into a scoped project you can edit before publishing.</p>
          <div className="border border-line rounded-card overflow-hidden focus-within:border-brand">
            <label htmlFor="brief" className="sr-only">Describe what you need</label>
            <textarea id="brief" value={brief} onChange={(e) => setBrief(e.target.value)} className="w-full h-44 p-6 text-xl leading-relaxed resize-none outline-none text-ink block" />
            <div className="flex justify-between items-center gap-4 flex-wrap px-6 py-4 border-t border-line bg-surface"><span className="text-sm">{b ? `Posting as ${b.name}, ${b.city}` : <Skeleton className="h-4 w-48" />}</span><Button onClick={scope} disabled={!b || brief.trim().length < 8}>Scope project</Button></div>
          </div>
          {error && <p role="alert" className="text-sm text-bad mt-2">{error}</p>}
          <div className="mt-6"><div className="text-xs font-medium mb-2">Try an example</div><div className="flex gap-2 flex-wrap">{EXAMPLES.map(([l, t]) => <Chip key={l} onClick={() => setBrief(t)} active={brief === t}>{l}</Chip>)}</div></div>
        </div>
      )}

      {phase === "loading" && (
        <div className="max-w-[720px]">
          <h1 className="h2 mb-6">Scoping your project</h1>
          <Card className="p-6"><ol className="flex flex-col gap-4 list-none p-0 m-0" aria-live="polite">{STEPS.map((t, i) => (
            <li key={t} className={cx("flex gap-4 items-center text-sm transition-opacity", step >= i ? "text-ink opacity-100" : "opacity-50")}><span className="w-4 h-4 grid place-items-center">{step > i ? <Check size={16} className="text-ok" aria-hidden /> : step === i ? <Spinner size={14} /> : null}</span>{t}{step > i && <span className="sr-only">done</span>}</li>
          ))}</ol></Card>
        </div>
      )}

      {phase === "done" && draft && (
        <div className="max-w-[880px] animate-rise" data-testid="scope-result">
          <AiNote source={source} className="mb-2" />
          <h1 className="h2 mb-2">Review your project</h1>
          <p className="text-sm mb-8 min-h-[1.5em]" aria-live="polite">{summaryText}</p>
          <Row label="Title"><Input label="Title" hideLabel value={draft.title} onChange={(e) => set("title", e.target.value)} className="font-semibold text-base" /></Row>
          <Row label="Deliverables">
            <div className="flex flex-col gap-2">
              {draft.deliverables.map((d, i) => (
                <div key={i} className="flex gap-2"><div className="flex-1"><Input label={`Deliverable ${i + 1}`} hideLabel value={d} onChange={(e) => set("deliverables", draft.deliverables.map((x, j) => (j === i ? e.target.value : x)))} /></div><button type="button" aria-label={`Remove deliverable ${i + 1}`} onClick={() => set("deliverables", draft.deliverables.filter((_, j) => j !== i))} disabled={draft.deliverables.length <= 2} className="text-body hover:text-bad disabled:opacity-30 cursor-pointer"><Trash2 size={16} aria-hidden /></button></div>
              ))}
              {draft.deliverables.length < 6 && <button type="button" onClick={() => set("deliverables", [...draft.deliverables, ""])} className="text-sm font-semibold text-brand flex gap-1 items-center w-fit cursor-pointer"><Plus size={16} aria-hidden />Add deliverable</button>}
            </div>
          </Row>
          <Row label="Milestones">
            <div className="flex flex-col gap-2">
              {draft.milestones.map((m, i) => {
                const amounts = splitPay(draft.payType === "volunteer" ? 0 : draft.pay, draft.milestones.length);
                return (
                  <div key={i} className="flex gap-2 items-center"><span className="w-4 text-sm font-semibold text-ink">{i + 1}</span><div className="flex-1"><Input label={`Milestone ${i + 1}`} hideLabel value={m.title} onChange={(e) => set("milestones", draft.milestones.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} /></div><span className="text-sm w-16 text-right">{draft.payType === "volunteer" ? "Unpaid" : money(amounts[i])}</span></div>
                );
              })}
            </div>
          </Row>
          <Row label="Skills">
            <div className="flex gap-2 flex-wrap mb-2">{draft.skills.map((s) => <Chip key={s} onRemove={() => set("skills", draft.skills.filter((x) => x !== s))}>{s}</Chip>)}</div>
            <Input label="Add a skill" hideLabel value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (newSkill.trim() && !draft.skills.includes(newSkill.trim())) set("skills", [...draft.skills, newSkill.trim()]); setNewSkill(""); } }} placeholder="Add a skill and press Enter" />
          </Row>
          <Row label="Hours and pay">
            <div className="flex gap-4 flex-wrap items-end mb-4">
              <div className="w-28"><Input label="Estimated hours" type="number" min={1} max={25} value={draft.hours} onChange={(e) => set("hours", Number(e.target.value))} hint="Max 25" /></div>
              <div role="group" aria-label="Pay type" className="flex border border-line rounded-control p-0.5 text-sm font-medium h-10">
                <button type="button" aria-pressed={draft.payType === "stipend"} onClick={() => set("payType", "stipend")} className={cx("px-4 rounded-md cursor-pointer", draft.payType === "stipend" ? "bg-surface text-ink" : "text-body")}>Stipend</button>
                <button type="button" aria-pressed={draft.payType === "volunteer"} disabled={!volunteerOk} title={volunteerOk ? undefined : "Only nonprofits can post volunteer projects"} onClick={() => set("payType", "volunteer")} className={cx("px-4 rounded-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed", draft.payType === "volunteer" ? "bg-surface text-ink" : "text-body")}>Volunteer</button>
              </div>
            </div>
            {draft.payType === "stipend" ? (
              <div className="flex items-end gap-4 flex-wrap"><div className="w-28"><Input label="Stipend ($)" type="number" min={0} value={draft.pay} onChange={(e) => set("pay", Number(e.target.value))} /></div><span className="text-sm pb-2">Suggested range: {money(draft.payMin)} to {money(draft.payMax)} for {draft.hours} hours</span></div>
            ) : <p className="text-sm">Unpaid. The student earns a verified reference and a review on their profile.</p>}
            {!volunteerOk && <p className="text-xs mt-2">Volunteer projects are available to registered nonprofits only.</p>}
          </Row>
          <Row label="Beginner check">
            <div className="flex gap-2 items-start"><Badge tone={draft.beginner.ok ? "ok" : "warn"}>{draft.beginner.ok ? "Beginner friendly" : "Needs experience"}</Badge><p className="text-sm">{draft.beginner.note}</p></div>
          </Row>
          {error && <p role="alert" className="text-sm text-bad mb-4">{error}</p>}
          <div className="flex gap-2 pt-6 border-t border-line"><Button onClick={publish} loading={publishing}>Publish project</Button><Button variant="secondary" onClick={() => { setPhase("idle"); setDraft(null); }}>Start over</Button></div>
        </div>
      )}
    </PageContainer>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-4 py-6 border-t border-line"><div className="flex-[0_0_200px]"><b className="text-sm font-semibold text-ink">{label}</b></div><div className="flex-[1_1_320px] min-w-0">{children}</div></div>;
}
