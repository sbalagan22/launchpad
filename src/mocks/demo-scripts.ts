import type { ProjectType, ScopeResult } from "@/schemas";
import { RUBRIC, DONE, FIT } from "./projects";

// MOCK: pre-written AI scoping. Poster side only: it turns a messy ask into a structured brief and never
// produces any student work.
//
// 1. DEMO_SCRIPTS: the two listings the live demo creates ("Fill the Tuesday Night Gap" and "Instrument the
//    Waitlist"), selected by trigger text. They are not seeded as projects.
// 2. templateScope: a keyword-templated scope for any other input.

export type DemoScript = { id: string; trigger: RegExp; ventureOnly?: boolean; brief: ScopeResult };

export const DEMO_SCRIPTS: DemoScript[] = [
  {
    id: "tuesday-night-gap",
    trigger: /\b(tuesday|empty seats|events? (page|night|signup)|cafe|café|coffee shop|corner press)\b/i,
    brief: {
      title: "Fill the Tuesday Night Gap",
      hook: "Forty empty seats on Tuesday nights. We need a page that sells them.",
      type: "web",
      summary: "A responsive site for a neighbourhood cafe with its menu, hours and events, plus an event signup with capacity limits the owner can manage without a developer.",
      deliverables: ["Responsive site with menu, hours and events pages", "Event signup with capacity limits", "Deployed site the owner can update without a developer"],
      milestones: [{ title: "Brief and wireframes", hours: 3, dueInDays: 10 }, { title: "Core pages", hours: 10, dueInDays: 24 }, { title: "Event signup and launch", hours: 7, dueInDays: 38 }],
      skills: ["Responsive Layout", "Forms and Validation", "Deployment", "Client Communication"],
      tools: ["HTML and CSS", "Netlify"],
      hours: 20, payType: "stipend", pay: 400, payMin: 350, payMax: 450, sponsorStipend: 0,
      rubric: RUBRIC.web,
      doneLooksLike: "The site works on a phone, scores 90 or more on a free accessibility check you run yourself, and the owner can change the hours without you.",
      goodFit: "You can build a small responsive site and want to practice working with a real owner on a real deadline.",
      notAFit: "You want a custom brand identity or a full online store.",
      strengthenedBy: ["fcc-rwd", "gh-foundations"],
      badgeSkills: ["Web Development", "Responsive Layout"],
      beginnerFriendly: { ok: true, note: "Clear deliverables, three reviewable milestones and 20 hours. Suitable for a second-year student." },
    },
  },
  {
    id: "instrument-the-waitlist",
    trigger: /\b(waitlist|funnel|analytics|instrument|signup flow|drop[- ]?off|conversion)\b/i,
    ventureOnly: true,
    brief: {
      title: "Instrument the Waitlist",
      hook: "We have signups but no idea where visitors leave. Show us the funnel.",
      type: "data",
      summary: "Add analytics events to an early product's waitlist flow, build a funnel dashboard, and write a one page memo with three recommendations the founders can act on.",
      deliverables: ["Tracking events added to the signup flow", "Funnel dashboard showing where visitors drop off", "One page findings memo with three recommendations"],
      milestones: [{ title: "Event plan", hours: 3, dueInDays: 8 }, { title: "Instrumentation and dashboard", hours: 7, dueInDays: 22 }, { title: "Findings memo", hours: 4, dueInDays: 32 }],
      skills: ["Product Analytics", "SQL", "Experiment Design", "Communicating Findings"],
      tools: ["PostHog", "Metabase"],
      hours: 14, payType: "stipend", pay: 280, payMin: 250, payMax: 320, sponsorStipend: 0,
      rubric: RUBRIC.data,
      doneLooksLike: "A live funnel dashboard on real signups and a one page memo the founders can act on.",
      goodFit: "You like asking why people behave the way they do and can explain a chart in plain words.",
      notAFit: "You want to build the product features themselves.",
      strengthenedBy: ["gda", "pcep"],
      badgeSkills: ["Product Analytics", "SQL"],
      beginnerFriendly: { ok: true, note: "Well bounded at 14 hours with a clear output. A good first analytics project." },
    },
  },
];

type Tpl = { skills: string[]; tools: string[]; badge: string[]; hours: number; label: string; ms: [string, number][]; dels: (t: string) => string[] };
const TEMPLATES: Record<ProjectType, Tpl> = {
  web: { skills: ["Responsive Layout", "Forms and Validation", "Deployment"], tools: ["HTML", "CSS", "Netlify"], badge: ["Web Development"], hours: 18, label: "web project", ms: [["Plan and wireframes", 4], ["Build", 9], ["Testing and launch", 5]], dels: (t) => [`Responsive pages for ${t}`, "Deployed site the poster can update", "Short README and handover notes"] },
  design: { skills: ["Visual Hierarchy", "Branding", "Layout Design"], tools: ["Figma", "Illustrator"], badge: ["Branding"], hours: 10, label: "design project", ms: [["Initial concepts", 3], ["Revisions", 4], ["Final files", 3]], dels: (t) => [`Three concepts for ${t}`, "Final files in print and web formats", "One page usage guide"] },
  data: { skills: ["Data Cleaning", "Data Visualization", "SQL"], tools: ["Python", "Metabase"], badge: ["Data Cleaning"], hours: 14, label: "data project", ms: [["Audit of the data", 4], ["Cleaning and analysis", 6], ["Summary and walkthrough", 4]], dels: (t) => [`Cleaned dataset for ${t}`, "Dashboard the team can filter", "One page data dictionary and change log"] },
  marketing: { skills: ["Social Media", "Audience Research", "Writing"], tools: ["Canva", "Buffer"], badge: ["Social Media"], hours: 10, label: "marketing project", ms: [["Plan and audience", 3], ["Drafts for review", 4], ["Final content", 3]], dels: (t) => [`Content plan for ${t}`, "Finished sample posts ready to publish", "Short report explaining the choices"] },
  writing: { skills: ["Writing", "Editing", "Research"], tools: ["Google Docs", "Hemingway Editor"], badge: ["Writing"], hours: 8, label: "writing project", ms: [["Outline and samples", 3], ["Full draft", 3], ["Final edits", 2]], dels: (t) => [`Written content for ${t}`, "Notes on tone and sources", "One round of edits"] },
  admin: { skills: ["Process Mapping", "Documentation", "Excel"], tools: ["Excel", "Airtable", "Notion"], badge: ["Documentation"], hours: 8, label: "operations project", ms: [["Process map", 3], ["Template build", 3], ["Testing and guide", 2]], dels: (t) => [`Working template for ${t}`, "One page guide tested on a real example", "One round of changes"] },
};
const TYPE_RULES: [RegExp, ProjectType][] = [
  [/\b(website|web ?site|web page|landing page|webpage|form|app|portal|booking|dashboard app|script)\b/i, "web"],
  [/\b(logo|flyer|poster|brand|packaging|graphic|illustration|signage|video)\b/i, "design"],
  [/\b(data|spreadsheet|csv|report|analysis|analy[sz]e|database|inventory|visuali[sz]ation)\b/i, "data"],
  [/\b(social|instagram|campaign|newsletter|email|marketing|outreach)\b/i, "marketing"],
  [/\b(blog|copy|write|writing|content|faq|article|handbook)\b/i, "writing"],
];
const TOOL_WORDS: [RegExp, string][] = [[/wordpress/i, "WordPress"], [/shopify/i, "Shopify"], [/canva/i, "Canva"], [/figma/i, "Figma"], [/excel/i, "Excel"], [/\bsql\b/i, "SQL"], [/react/i, "React"], [/python/i, "Python"], [/airtable/i, "Airtable"]];

function titleFrom(brief: string): string {
  const cleaned = brief.replace(/^(hi|hello)[,!. ]*/i, "").replace(/^(we|i)('d| would| need| want| are looking for| am looking for|'m looking for|'re looking for)?\s*(need|want|looking for|like)?\s*(a|an|some|help with|help)?\s*/i, "").replace(/[.!?].*$/, "").trim();
  const words = (cleaned || brief).split(/\s+/).slice(0, 6).join(" ").replace(/[,;:]+$/, "");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Keyword-templated scope for any brief that does not match a scripted one. */
export function templateScope(brief: string, volunteerEligible: boolean): ScopeResult {
  let type: ProjectType = "admin";
  for (const [re, t] of TYPE_RULES) if (re.test(brief)) { type = t; break; }
  const tpl = TEMPLATES[type];
  const features = (brief.match(/,| and | plus | with /gi) ?? []).length;
  const hours = Math.max(6, Math.min(25, tpl.hours + features));
  const msHours = tpl.ms.map(([, h]) => h);
  const diff = hours - msHours.reduce((a, b) => a + b, 0);
  msHours[1] += diff;
  const title = titleFrom(brief);
  const tools = Array.from(new Set([...TOOL_WORDS.filter(([re]) => re.test(brief)).map(([, n]) => n), ...tpl.tools])).slice(0, 5);
  const pay = volunteerEligible ? 0 : Math.round((hours * 20) / 5) * 5;
  return {
    title, hook: `A scoped ${tpl.label} from a short description.`, type,
    summary: `A scoped ${tpl.label} based on your description: "${brief.trim().slice(0, 140)}${brief.trim().length > 140 ? "..." : ""}"`,
    deliverables: tpl.dels(title.toLowerCase()),
    milestones: tpl.ms.map(([t], i) => ({ title: t, hours: msHours[i], dueInDays: 10 + i * 12 })),
    skills: tpl.skills, tools, hours, payType: volunteerEligible ? "volunteer" : "stipend", pay,
    payMin: volunteerEligible ? 0 : Math.round((pay * 0.875) / 10) * 10, payMax: volunteerEligible ? 0 : Math.round((pay * 1.125) / 10) * 10, sponsorStipend: 0,
    rubric: RUBRIC[type], doneLooksLike: DONE[type], goodFit: FIT[type][0], notAFit: FIT[type][1], strengthenedBy: [], badgeSkills: tpl.badge,
    beginnerFriendly: hours <= 20 ? { ok: true, note: `Scoped to ${hours} hours with reviewable milestones. Suitable for a first or second-year student.` } : { ok: false, note: "This is a large scope for a first project. Consider splitting it in two." },
  };
}
