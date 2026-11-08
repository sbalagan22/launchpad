"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { PageContainer } from "@/components/nav";
import { motion } from "@/components/motion";
import { AiNote, Button, Card, EmptyState, Input, Select, Textarea, WhatNext, toast } from "@/components/ui";
import { useSession } from "@/hooks/use-query";
import { projects, scoping, type BriefSection } from "@/services";
import type { Difficulty, LocationMode, ProjectType } from "@/schemas";
import { t } from "@/lib/motion";

type Draft = {
  title: string; hook: string; type: ProjectType; deliverables: string; milestones: { title: string; hours: number; dueInDays: number }[]; skills: string; tools: string;
  hours: number; payType: "stipend" | "volunteer"; pay: number; sponsorStipend: number; acceptance: string; doneLooksLike: string; goodFit: string; notAFit: string;
  difficulty: Difficulty; locationMode: LocationMode; strengthenedBy: string[]; badgeSkills: string[]; summary: string;
};
const EMPTY: Draft = { title: "", hook: "", type: "web", deliverables: "", milestones: [], skills: "", tools: "", hours: 0, payType: "stipend", pay: 0, sponsorStipend: 0, acceptance: "", doneLooksLike: "", goodFit: "", notAFit: "", difficulty: "Intermediate", locationMode: "remote", strengthenedBy: [], badgeSkills: [], summary: "" };
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function NewProject() {
  const router = useRouter();
  const { userId, role, hydrated } = useSession();
  const [raw, setRaw] = useState("");
  const [rawErr, setRawErr] = useState<string | null>(null);
  const [d, setD] = useState<Draft>(EMPTY);
  const [phase, setPhase] = useState<"idle" | "streaming" | "ready">("idle");
  const [source, setSource] = useState<"real" | "mock" | undefined>();
  const [missing, setMissing] = useState<string[] | null>(null);
  const [tips, setTips] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const run = useRef(0);

  if (hydrated && role !== "business") return <PageContainer><EmptyState title="Posting is for founders and posters" body="Switch to the founder account." action={<Button href="/login">Switch demo account</Button>} /></PageContainer>;

  const apply = (s: BriefSection) => {
    setD((x) => {
      switch (s.section) {
        case "title": return { ...x, title: s.value };
        case "hook": return { ...x, hook: s.value };
        case "deliverables": return { ...x, deliverables: s.value.join("\n") };
        case "milestones": return { ...x, milestones: s.value };
        case "skills": return { ...x, skills: s.value.skills.join(", "), tools: s.value.tools.join(", "), strengthenedBy: s.value.strengthenedBy };
        case "hours_pay": return { ...x, hours: s.value.hours, payType: s.value.payType, pay: s.value.pay, sponsorStipend: s.value.sponsorStipend };
        case "acceptance": return { ...x, acceptance: s.value.join("\n") };
        case "fit": return { ...x, doneLooksLike: s.value.doneLooksLike, goodFit: s.value.goodFit, notAFit: s.value.notAFit, difficulty: s.value.difficulty, locationMode: s.value.locationMode };
        case "complete": return { ...x, type: s.value.type, badgeSkills: s.value.badgeSkills, summary: s.value.summary };
        default: return x;
      }
    });
    if (s.section === "thinking" || s.section === "complete") setSource(s.source);
  };

  const generate = async () => {
    if (raw.trim().length < 8) return setRawErr("Describe the work in at least a short sentence.");
    setRawErr(null); setD(EMPTY); setMissing(null); setTips([]); setPhase("streaming");
    const id = ++run.current;
    try {
      for await (const s of scoping.scopeBrief(raw)) { if (run.current !== id) return; apply(s); }
      setPhase("ready");
    } catch (e) {
      setPhase("idle");
      toast.error(e instanceof Error ? e.message : "Could not scope that");
    }
  };

  const toInput = () => ({
    businessId: userId, title: d.title, hook: d.hook, type: d.type, description: d.summary || d.hook, deliverables: lines(d.deliverables), milestones: d.milestones, skills: list(d.skills), tools: list(d.tools),
    hours: d.hours, payType: d.payType, pay: d.pay, sponsorStipend: d.sponsorStipend, acceptance: lines(d.acceptance), difficulty: d.difficulty, locationMode: d.locationMode,
    doneLooksLike: d.doneLooksLike, goodFit: d.goodFit, notAFit: d.notAFit, strengthenedBy: d.strengthenedBy, badgeSkills: d.badgeSkills.length ? d.badgeSkills : list(d.skills).slice(0, 2), beginnerFriendly: d.difficulty === "Beginner",
  });

  const check = async () => { const r = await projects.checkPublish(toInput()); setMissing(r.ok ? [] : r.missing); setTips(await scoping.suggestImprovements(toInput())); return r.ok; };

  const publish = async () => {
    setBusy(true);
    try {
      if (!(await check())) return;
      const draft = await projects.create(toInput());
      const out = await projects.publish(draft.id);
      toast.success("Published. Matching students have been notified.");
      router.push(`/business/projects/${out.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not publish");
    } finally {
      setBusy(false);
    }
  };

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const ready = phase === "ready";
  return (
    <PageContainer>
      <h1 className="h2 mb-1">Post a project</h1>
      <p className="mb-6 max-w-2xl">Describe what you need in your own words. Launchpad structures it into a brief you can edit. It never does the student&apos;s work.</p>
      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          <Card className="p-5 flex flex-col gap-3">
            <Textarea label="What do you need?" rows={4} value={raw} onChange={(e) => { setRaw(e.target.value); setRawErr(null); }} error={rawErr} placeholder="For example: we need to see where people drop off on our waitlist page" data-testid="raw-input" />
            <div className="flex items-center gap-3 flex-wrap"><Button onClick={generate} loading={phase === "streaming"} data-testid="generate"><Sparkles size={16} aria-hidden />Turn into a brief</Button>{source && <AiNote source={source} />}</div>
          </Card>

          {phase !== "idle" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: t.ui }} className="flex flex-col gap-4" data-testid="brief">
              <Card className="p-5 flex flex-col gap-4">
                <Input label="Title" value={d.title} onChange={(e) => set("title", e.target.value)} disabled={!ready} />
                <Input label="One-line hook" value={d.hook} onChange={(e) => set("hook", e.target.value)} disabled={!ready} />
                <Textarea label="Deliverables (one per line)" rows={4} value={d.deliverables} onChange={(e) => set("deliverables", e.target.value)} disabled={!ready} />
                <div>
                  <p className="text-sm font-semibold text-ink mb-2">Milestones</p>
                  <div className="flex flex-col gap-2">
                    {d.milestones.map((m, i) => (
                      <div key={i} className="grid grid-cols-[1fr_90px_90px] gap-2">
                        <Input label={`Milestone ${i + 1}`} hideLabel value={m.title} onChange={(e) => set("milestones", d.milestones.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} disabled={!ready} />
                        <Input label="Hours" hideLabel type="number" value={m.hours} onChange={(e) => set("milestones", d.milestones.map((x, j) => (j === i ? { ...x, hours: Number(e.target.value) } : x)))} disabled={!ready} />
                        <Input label="Due in days" hideLabel type="number" value={m.dueInDays} onChange={(e) => set("milestones", d.milestones.map((x, j) => (j === i ? { ...x, dueInDays: Number(e.target.value) } : x)))} disabled={!ready} />
                      </div>
                    ))}
                    {d.milestones.length === 0 && <p className="text-sm">Milestones appear here.</p>}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Skills (comma separated)" value={d.skills} onChange={(e) => set("skills", e.target.value)} disabled={!ready} />
                  <Input label="Tools (comma separated)" value={d.tools} onChange={(e) => set("tools", e.target.value)} disabled={!ready} />
                </div>
                <div className="grid sm:grid-cols-4 gap-4">
                  <Input label="Total hours (max 25)" type="number" value={d.hours} onChange={(e) => set("hours", Number(e.target.value))} disabled={!ready} />
                  <Select label="Pay type" value={d.payType} onChange={(e) => set("payType", e.target.value as Draft["payType"])} disabled={!ready} options={[{ value: "stipend", label: "Stipend" }, { value: "volunteer", label: "Volunteer" }]} />
                  <Input label="Stipend ($)" type="number" value={d.pay} onChange={(e) => set("pay", Number(e.target.value))} disabled={!ready || d.payType === "volunteer"} />
                  <Select label="Difficulty" value={d.difficulty} onChange={(e) => set("difficulty", e.target.value as Difficulty)} disabled={!ready} options={["Beginner", "Intermediate", "Advanced"].map((v) => ({ value: v, label: v }))} />
                </div>
                <Textarea label="Acceptance criteria (3 to 5, one per line)" hint="Plain statements you can check with a yes or no. You rate each one when you approve." rows={4} value={d.acceptance} onChange={(e) => set("acceptance", e.target.value)} disabled={!ready} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Textarea label="Good fit" rows={2} value={d.goodFit} onChange={(e) => set("goodFit", e.target.value)} disabled={!ready} />
                  <Textarea label="Not a fit" rows={2} value={d.notAFit} onChange={(e) => set("notAFit", e.target.value)} disabled={!ready} />
                </div>
              </Card>
              {ready && (
                <Card className="p-5 flex flex-col gap-3" aria-live="polite">
                  {missing && missing.length > 0 && (<div role="alert" data-testid="gate"><p className="text-sm font-semibold text-ink mb-1">Before publishing:</p><ul className="list-disc pl-5 text-sm">{missing.map((m) => <li key={m}>{m}</li>)}</ul></div>)}
                  {missing && missing.length === 0 && <p className="text-sm text-ok font-semibold">Ready to publish.</p>}
                  {tips.length > 0 && (<div><p className="text-sm font-semibold text-ink mb-1">Suggestions</p><ul className="list-disc pl-5 text-sm">{tips.map((m) => <li key={m}>{m}</li>)}</ul></div>)}
                  <div className="flex gap-2 flex-wrap"><Button variant="secondary" onClick={check}>Check brief</Button><Button onClick={publish} loading={busy} data-testid="publish">Publish project</Button></div>
                </Card>
              )}
            </motion.div>
          )}
        </div>
        <WhatNext steps={["Launchpad structures your ask into deliverables, milestones and acceptance criteria.", "You edit anything, then publish. Pay is always shown and hours are capped at 25.", "Matching students are notified and apply. You choose who to accept."]} />
      </div>
    </PageContainer>
  );
}
