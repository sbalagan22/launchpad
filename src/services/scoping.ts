
import { ScopeInput, ScopeResult, VOLUNTEER_ELIGIBLE, type Project } from "@/schemas";
import { computeSkillYield } from "@/lib/skill-yield";
import { DEMO_SCRIPTS, templateScope } from "@/mocks/demo-scripts";
import { getDb } from "@/store";
import type { BriefSection, ProjectDraft, ScopingApi, Tip } from "./contract";
import { ServiceError, latency, parseInput } from "./core";
import { me } from "./helpers";

// Poster-side AI only: it turns a messy ask into a structured brief and suggests improvements.
// Nothing here writes, fixes or grades a student's deliverable.

async function tryReal(body: unknown): Promise<ScopeResult | null> {
  try {
    const res = await fetch("/api/ai/scope", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) return null;
    const json: { source?: string; data?: unknown } = await res.json();
    if (json.source !== "real") return null;
    const parsed = ScopeResult.safeParse(json.data);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function resolveBrief(raw: string): Promise<{ brief: ScopeResult; source: "real" | "mock"; reviewerCount: number }> {
  const s = me();
  const input = parseInput(ScopeInput, { brief: raw, businessId: s.role === "business" ? s.userId : "none" });
  const db = getDb();
  const biz = db.businesses.find((b) => b.id === input.businessId);
  if (!biz) throw new ServiceError("forbidden", "Sign in as a poster to scope a brief.");
  const venture = db.ventures.find((v) => v.businessId === biz.id);
  const eligible = VOLUNTEER_ELIGIBLE.includes(biz.employerType);
  const real = await tryReal({ brief: input.brief, businessName: biz.name, employerType: biz.employerType, ventureBacked: Boolean(venture) });
  if (real) return { brief: real.payType === "volunteer" && !eligible ? { ...real, payType: "stipend", pay: Math.max(real.pay, 200) } : real, source: "real", reviewerCount: venture ? 2 : 1 };
  // MOCK: scripted briefs for the two demo listings, keyword-templated scopes for everything else.
  const script = DEMO_SCRIPTS.find((d) => d.trigger.test(input.brief) && (!d.ventureOnly || venture));
  const brief = script ? script.brief : templateScope(input.brief, eligible);
  return { brief: ScopeResult.parse(brief), source: "mock", reviewerCount: venture ? 2 : 1 };
}

const FACTOR_OF: [RegExp, Tip["factor"]][] = [
  [/tools|learn/i, "learning"], [/deliverable/i, "deliverable"], [/reviewer/i, "reviewer"], [/done looks|output|portfolio|show/i, "portfolio"], [/milestone|hours/i, "scope"], [/repetitive/i, "learning"],
];
const toTips = (tips: string[]): Tip[] => tips.map((text, i) => ({ id: `tip_${i}`, text, factor: FACTOR_OF.find(([re]) => re.test(text))?.[1] ?? "general" }));

const draftYield = (p: ProjectDraft | Project) => {
  const reviewerCount = "reviewerIds" in p && p.reviewerIds ? p.reviewerIds.length : 1;
  return computeSkillYield({
    title: p.title, description: p.description, hook: p.hook, type: p.type, deliverables: p.deliverables, skills: p.skills, tools: p.tools, hours: p.hours,
    milestones: p.milestones.map((m) => ({ hours: m.hours })), reviewerCount, rubricCount: p.rubric.length, doneLooksLike: p.doneLooksLike,
  });
};

export const scoping: ScopingApi = {
  async *scopeBrief(rawText): AsyncGenerator<BriefSection> {
    const first = resolveBrief(rawText);
    await latency(500, 800);
    const { brief, source, reviewerCount } = await first;
    yield { section: "thinking", source };
    const wait = () => latency(250, 450);
    await wait(); yield { section: "title", value: brief.title };
    await wait(); yield { section: "hook", value: brief.hook };
    await wait(); yield { section: "deliverables", value: brief.deliverables };
    await wait(); yield { section: "milestones", value: brief.milestones };
    await wait(); yield { section: "skills", value: { skills: brief.skills, tools: brief.tools, strengthenedBy: brief.strengthenedBy } };
    await wait(); yield { section: "hours_pay", value: { hours: brief.hours, payType: brief.payType, pay: brief.pay, payMin: brief.payMin, payMax: brief.payMax, sponsorStipend: brief.sponsorStipend } };
    await wait(); yield { section: "rubric", value: brief.rubric };
    await wait(); yield { section: "fit", value: { doneLooksLike: brief.doneLooksLike, goodFit: brief.goodFit, notAFit: brief.notAFit, beginnerFriendly: brief.beginnerFriendly } };
    await wait();
    yield { section: "yield", value: computeSkillYield({ title: brief.title, description: brief.summary, hook: brief.hook, type: brief.type, deliverables: brief.deliverables, skills: brief.skills, tools: brief.tools, hours: brief.hours, milestones: brief.milestones, reviewerCount, rubricCount: brief.rubric.length, doneLooksLike: brief.doneLooksLike }) };
    yield { section: "complete", value: brief, source };
  },

  async improveYield(project) {
    await latency(300, 600);
    const result = draftYield(project);
    return { result, tips: toTips(result.tips) };
  },

  async scoreDraft(project) {
    await latency(100, 250);
    return draftYield(project);
  },
};

