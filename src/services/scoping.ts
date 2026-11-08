import { ScopeInput, ScopeResult, VOLUNTEER_ELIGIBLE, type Project } from "@/schemas";
import { DEMO_SCRIPTS, templateScope } from "@/mocks/demo-scripts";
import { getDb } from "@/store";
import type { BriefSection, ProjectDraft, ScopingApi } from "./contract";
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

async function resolveBrief(raw: string): Promise<{ brief: ScopeResult; source: "real" | "mock" }> {
  const s = me();
  const input = parseInput(ScopeInput, { brief: raw, businessId: s.role === "business" ? s.userId : "none" });
  const biz = getDb().businesses.find((b) => b.id === input.businessId);
  if (!biz) throw new ServiceError("forbidden", "Sign in as a poster to scope a brief.");
  const eligible = VOLUNTEER_ELIGIBLE.includes(biz.employerType);
  const real = await tryReal({ brief: input.brief, businessName: biz.name, employerType: biz.employerType, isVolunteerEligible: eligible });
  if (real) return { brief: real.payType === "volunteer" && !eligible ? { ...real, payType: "stipend", pay: Math.max(real.pay, 200) } : real, source: "real" };
  // MOCK: scripted briefs for the two demo listings, keyword-templated scopes for everything else.
  const script = DEMO_SCRIPTS.find((d) => d.trigger.test(input.brief));
  return { brief: ScopeResult.parse(script ? script.brief : templateScope(input.brief, eligible)), source: "mock" };
}

export function improvementsFor(p: ProjectDraft | Project): string[] {
  const out: string[] = [];
  if (p.deliverables.length < 2) out.push("List at least two concrete deliverables so the student knows what finished means.");
  if (p.milestones.length < 3) out.push("Three milestones make progress easier to check than two.");
  if ((p.acceptance ?? []).length < 3) out.push("Add acceptance criteria you can check with a yes or no.");
  if (!p.tools || p.tools.length === 0) out.push("Name the tools the student will use so applicants can judge fit.");
  if (!("goodFit" in p) || !p.goodFit) out.push("Say who the project is a good fit for, and who it is not.");
  if (p.hours > 20) out.push("Projects over 20 hours get fewer applicants. Consider splitting the work.");
  if (p.payType === "stipend" && p.hours > 0 && p.pay / p.hours < 18) out.push("Pay under about $18 an hour is below what most similar listings offer.");
  return out.slice(0, 4);
}

export const scoping: ScopingApi = {
  async *scopeBrief(rawText): AsyncGenerator<BriefSection> {
    const first = resolveBrief(rawText);
    await latency(500, 800);
    const { brief, source } = await first;
    yield { section: "thinking", source };
    const wait = () => latency(250, 450);
    await wait(); yield { section: "title", value: brief.title };
    await wait(); yield { section: "hook", value: brief.hook };
    await wait(); yield { section: "deliverables", value: brief.deliverables };
    await wait(); yield { section: "milestones", value: brief.milestones };
    await wait(); yield { section: "skills", value: { skills: brief.skills, tools: brief.tools, strengthenedBy: brief.strengthenedBy } };
    await wait(); yield { section: "hours_pay", value: { hours: brief.hours, payType: brief.payType, pay: brief.pay, payMin: brief.payMin, payMax: brief.payMax, sponsorStipend: brief.sponsorStipend } };
    await wait(); yield { section: "acceptance", value: brief.acceptance };
    await wait(); yield { section: "fit", value: { doneLooksLike: brief.doneLooksLike, goodFit: brief.goodFit, notAFit: brief.notAFit, difficulty: brief.difficulty, locationMode: brief.locationMode } };
    await wait();
    yield { section: "complete", value: brief, source };
  },

  async suggestImprovements(project) {
    await latency(300, 600);
    return improvementsFor(project);
  },
};
