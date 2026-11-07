/**
 * Skill yield score (0-100), computed from project fields. Five factors worth 0-20 each:
 * learning (new skills and tools named), deliverable (concrete, checkable), reviewer (human review + rubric),
 * portfolio (output a student can show), scope (milestones and hours consistent).
 * Repetitive admin-only work is capped by design so it can never reach the publishing bar.
 */
export const PUBLISH_MIN_YIELD = 60;

export type YieldInput = {
  title: string;
  description?: string;
  hook?: string;
  type?: string;
  deliverables: string[];
  skills: string[];
  tools: string[];
  hours: number;
  milestones: { hours: number }[];
  reviewerCount: number;
  rubricCount: number;
  doneLooksLike?: string;
};

export type YieldFactor = { key: "learning" | "deliverable" | "reviewer" | "portfolio" | "scope"; label: string; score: number; max: 20; hint: string };
export type YieldResult = { total: number; factors: YieldFactor[]; tips: string[]; repetitive: boolean };

const REPETITIVE = /\b(data entry|copy[- ]and[- ]paste|copy[- ]paste|transcrib\w*|stuff(?:ing)? envelopes|filing|photocopy\w*|cold[- ]call\w*|retyp\w*|spreadsheet entry|manual entry)\b/i;
const CONCRETE = /\b(site|app|dashboard|dataset|report|deck|form|script|test plan|bug reports?|export|readme|prototype|build|deployed?|data dictionary|walkthrough|memo|template|calendar|designs?|poster|video|pages?|widget|logo|audit|tool|figure|schema|analytics|emails?)\b/i;
const SHAREABLE = /\b(deployed|live|site|dashboard|repo|github|portfolio|deck|prototype|bug reports?|data dictionary|report|walkthrough|link|published|memo|figure|video|poster|audit|demo)\b/i;

const clamp = (n: number) => Math.max(0, Math.min(20, Math.round(n)));
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export function computeSkillYield(p: YieldInput): YieldResult {
  const text = `${p.title} ${p.description ?? ""} ${p.deliverables.join(" ")}`;
  const repetitive = REPETITIVE.test(text) || (p.type === "admin" && p.tools.length === 0);

  let learning = clamp(p.skills.length * 2 + p.tools.length * 3);
  if (repetitive) learning = Math.min(learning, 6);

  const ds = p.deliverables.filter((d) => d.trim());
  let deliverable = 0;
  if (ds.length) {
    const avg = ds.reduce((a, d) => a + 10 + (words(d) >= 6 ? 4 : 0) + (CONCRETE.test(d) ? 6 : 0), 0) / ds.length;
    deliverable = clamp(avg - (ds.length === 1 ? 2 : 0));
  }

  const reviewer = p.reviewerCount === 0 ? 0 : clamp(12 + (p.reviewerCount > 1 ? 4 : 0) + (p.rubricCount >= 3 ? 4 : 0));

  const done = (p.doneLooksLike ?? "").trim();
  let portfolio = 0;
  if (done) portfolio = clamp(8 + (SHAREABLE.test(`${done} ${ds.join(" ")}`) ? 6 : 0) + (done.length >= 60 ? 6 : 3));
  if (repetitive) portfolio = Math.min(portfolio, 6);

  const msHours = p.milestones.reduce((a, m) => a + m.hours, 0);
  const scope = clamp(
    (p.milestones.length >= 2 && p.milestones.length <= 4 ? 8 : 0) +
      (p.milestones.length && Math.abs(msHours - p.hours) <= 1 ? 6 : 0) +
      (p.hours >= 4 && p.hours <= 25 ? 3 : 0) +
      (`${p.hook ?? ""} ${p.description ?? ""}`.trim().length >= 40 ? 3 : 0),
  );

  const factors: YieldFactor[] = [
    { key: "learning", label: "New skills and tools", score: learning, max: 20, hint: "Skills and tools the student will pick up" },
    { key: "deliverable", label: "Concrete deliverable", score: deliverable, max: 20, hint: "Deliverables you can point at and check" },
    { key: "reviewer", label: "Human reviewer", score: reviewer, max: 20, hint: "Reviewer assigned and a rubric to score against" },
    { key: "portfolio", label: "Portfolio-ready output", score: portfolio, max: 20, hint: "A result the student can show an employer" },
    { key: "scope", label: "Scope clarity", score: scope, max: 20, hint: "Milestones and hours that add up" },
  ];
  let total = factors.reduce((a, f) => a + f.score, 0);
  if (repetitive) total = Math.min(total, 45);

  const tips: string[] = [];
  if (repetitive) tips.push("Repetitive admin work cannot teach a new skill. Reframe it around a tool or method the student will learn.");
  if (p.skills.length + p.tools.length < 5) tips.push("Name the tools the student will learn.");
  if (!ds.length || deliverable < 14) tips.push("Describe the deliverable in one sentence.");
  if (p.reviewerCount === 0) tips.push("Add a reviewer.");
  else if (p.reviewerCount === 1 && reviewer < 20) tips.push("Add a second reviewer, such as a mentor or senior student.");
  if (!done) tips.push("Say what done looks like so the student and reviewer agree.");
  if (!p.milestones.length || Math.abs(msHours - p.hours) > 1) tips.push("Make the milestone hours add up to the project hours.");
  if (done && portfolio < 14) tips.push("Describe an output the student can show, such as a live link, dashboard, or report.");
  return { total, factors, tips, repetitive };
}

export const yieldLabel = (n: number) => (n >= 85 ? "Excellent" : n >= 70 ? "Strong" : n >= PUBLISH_MIN_YIELD ? "Good" : "Needs work");
