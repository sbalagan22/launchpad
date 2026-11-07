import type { Business, ProjectType, ScopeResult } from "@/schemas";
import { splitPay } from "@/lib/pay";

// MOCK: pre-written AI scoping. Four briefs are pre-wired with hand-written scopes; anything
// else gets a templated scope built from keywords in the brief.

type Base = Omit<ScopeResult, "pay" | "payMin" | "payMax" | "payType" | "milestones"> & { milestones: { title: string; dueInDays: number }[]; stipend: number };

const BAKERY: Base = {
  title: "Bakery website", type: "web", stipend: 400, hours: 20,
  summary: "A simple, mobile-friendly website with the menu, opening hours and an online order form that emails the bakery.",
  deliverables: ["Responsive homepage with brand colors and story", "Menu page with categories and prices", "Hours and location page with map", "Online order form that emails the bakery"],
  milestones: [{ title: "Design mockups in Figma", dueInDays: 14 }, { title: "Menu and hours pages built", dueInDays: 21 }, { title: "Order form, testing, launch", dueInDays: 35 }],
  skills: ["HTML", "CSS", "JavaScript", "Figma", "Web Development"], badgeSkills: ["Web Development"],
  beginnerFriendly: { ok: true, note: "Clear deliverables, three reviewable milestones and 20 hours. Suitable for a student in their second year." },
};
const SOCIAL: Base = {
  title: "Social media plan", type: "marketing", stipend: 240, hours: 12,
  summary: "A three-month social media plan with a content calendar and sample posts for the channels your audience already uses.",
  deliverables: ["Audience and channel recommendation", "12-week content calendar", "10 sample posts with captions"],
  milestones: [{ title: "Audience research", dueInDays: 10 }, { title: "Content calendar", dueInDays: 21 }, { title: "Sample posts", dueInDays: 35 }],
  skills: ["Writing", "Canva", "Research", "Social Media"], badgeSkills: ["Social Media"],
  beginnerFriendly: { ok: true, note: "Research and writing based. No special software needed, good for a first project." },
};
const LOGO: Base = {
  title: "Logo and brand mark", type: "design", stipend: 250, hours: 10,
  summary: "A simple logo that works on trucks, uniforms and invoices, delivered with a one-page usage guide.",
  deliverables: ["3 logo concepts", "Final logo in SVG and PNG", "One-page usage guide"],
  milestones: [{ title: "Concepts", dueInDays: 10 }, { title: "Revisions", dueInDays: 17 }, { title: "Final files", dueInDays: 24 }],
  skills: ["Figma", "Illustration", "Branding"], badgeSkills: ["Branding"],
  beginnerFriendly: { ok: true, note: "Small, well-bounded scope with built-in revision round." },
};
const DENTAL: Base = {
  title: "Patient data cleanup", type: "data", stipend: 300, hours: 15,
  summary: "Merge duplicate records and standardize inconsistent fields in an exported patient list, with a change log you can audit.",
  deliverables: ["Duplicate report", "Cleaned spreadsheet", "Short change log"],
  milestones: [{ title: "Audit and duplicate report", dueInDays: 12 }, { title: "Cleaning pass", dueInDays: 24 }, { title: "Review and change log", dueInDays: 34 }],
  skills: ["Excel", "Data Cleaning", "SQL"], badgeSkills: ["Data Cleaning"],
  beginnerFriendly: { ok: false, note: "Involves sensitive records. Share only a de-identified export on your own secure drive, and consider a student with data experience." },
};

type Tpl = { skills: string[]; badge: string[]; dels: (t: string) => string[]; ms: string[]; hours: number; label: string };
const TEMPLATES: Record<ProjectType, Tpl> = {
  web: { skills: ["HTML", "CSS", "JavaScript", "Web Development"], badge: ["Web Development"], hours: 18, label: "web project", ms: ["Design mockups", "Pages built on a staging link", "Testing and launch"], dels: (t) => [`Responsive pages for ${t}`, "Mobile-friendly layout tested on a phone", "A staging link you can review", "Short handover notes"] },
  design: { skills: ["Figma", "Branding", "Illustration"], badge: ["Branding"], hours: 10, label: "design project", ms: ["Initial concepts", "Revisions", "Final files"], dels: (t) => [`3 concepts for ${t}`, "Final files in print and web formats", "One-page usage guide"] },
  data: { skills: ["Excel", "Data Cleaning", "Data Visualization"], badge: ["Data Cleaning"], hours: 14, label: "data project", ms: ["Audit of the data", "Cleaning and analysis", "Summary and recommendations"], dels: (t) => [`Cleaned dataset for ${t}`, "Short written summary of findings", "Log of every change made"] },
  marketing: { skills: ["Social Media", "Canva", "Writing"], badge: ["Social Media"], hours: 10, label: "marketing project", ms: ["Plan and audience", "Drafts for review", "Final content"], dels: (t) => [`Plan for ${t}`, "Sample content you can edit", "A simple posting schedule"] },
  writing: { skills: ["Writing", "SEO", "Research"], badge: ["Writing"], hours: 8, label: "writing project", ms: ["Outline and samples", "Full draft", "Final edits"], dels: (t) => [`Written content for ${t}`, "Titles and short descriptions", "One round of edits"] },
  admin: { skills: ["Excel", "Documentation", "Research"], badge: ["Documentation"], hours: 8, label: "admin project", ms: ["Draft template", "Testing with real examples", "Final documents and guide"], dels: (t) => [`Working template for ${t}`, "Short how-to guide", "One round of changes"] },
};

const TYPE_RULES: [RegExp, ProjectType][] = [
  [/\b(website|web ?site|web page|landing page|webpage|form|app|online store|shopify|wordpress|booking)\b/i, "web"],
  [/\b(logo|flyer|poster|brand|packaging|menu design|graphic|illustration|signage)\b/i, "design"],
  [/\b(data|spreadsheet|excel|csv|report|dashboard|analysis|analy[sz]e|database|inventory)\b/i, "data"],
  [/\b(social|instagram|facebook|tiktok|campaign|newsletter|email|marketing|ads?)\b/i, "marketing"],
  [/\b(blog|copy|write|writing|content|faq|article|description)\b/i, "writing"],
];

const TOOLS: [RegExp, string][] = [[/wordpress/i, "WordPress"], [/shopify/i, "Shopify"], [/canva/i, "Canva"], [/figma/i, "Figma"], [/excel/i, "Excel"], [/\bsql\b/i, "SQL"], [/instagram/i, "Instagram"], [/seo/i, "SEO"]];

function pickType(brief: string): ProjectType {
  for (const [re, t] of TYPE_RULES) if (re.test(brief)) return t;
  return "admin";
}

function titleFrom(brief: string): string {
  const cleaned = brief.replace(/^(hi|hello)[,!. ]*/i, "").replace(/^(we|i)('d| would| need| want| are looking for| am looking for| 'm looking for|'re looking for)?\s*(need|want|looking for|like)?\s*(a|an|some|help with|help)?\s*/i, "").replace(/[.!?].*$/, "").trim();
  const words = (cleaned || brief).split(/\s+/).slice(0, 6).join(" ").replace(/[,;:]+$/, "");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function finish(base: Base, biz: Business): ScopeResult {
  const volunteer = biz.kind === "nonprofit";
  const stipend = base.stipend;
  const amounts = splitPay(stipend, base.milestones.length);
  return {
    title: base.title, type: base.type, summary: base.summary, deliverables: base.deliverables, skills: base.skills, hours: Math.min(25, base.hours), badgeSkills: base.badgeSkills,
    beginnerFriendly: base.beginnerFriendly,
    milestones: base.milestones.map((m, i) => ({ ...m, amount: volunteer ? 0 : amounts[i] })),
    payType: volunteer ? "volunteer" : "stipend", pay: volunteer ? 0 : stipend,
    payMin: volunteer ? 0 : Math.round((stipend * 0.875) / 10) * 10, payMax: volunteer ? 0 : Math.round((stipend * 1.125) / 10) * 10,
  };
}

export function mockScope(brief: string, biz: Business): ScopeResult {
  const b = brief.toLowerCase();
  if (/\blogo|brand mark|branding\b/.test(b)) return finish(LOGO, biz);
  if (/social media|instagram|content calendar|facebook posts/.test(b)) return finish(SOCIAL, biz);
  if (/(patient|duplicate|spreadsheet|data cleanup|clean(ing)? up|records)/.test(b) && /(data|spreadsheet|records|duplicate|clean)/.test(b)) return finish(DENTAL, biz);
  if (/(bakery|menu|online order|order form|website|web ?site)/.test(b) && /(website|web ?site|menu|order)/.test(b)) return finish(BAKERY, biz);

  const type = pickType(brief);
  const tpl = TEMPLATES[type];
  const features = (brief.match(/,| and | plus | with /gi) ?? []).length;
  const hours = Math.max(6, Math.min(25, tpl.hours + features * 2));
  const tools = TOOLS.filter(([re]) => re.test(brief)).map(([, n]) => n);
  const title = titleFrom(brief);
  const topic = title.toLowerCase();
  const stipend = Math.round((hours * 20) / 5) * 5;
  const skills = Array.from(new Set([...tools, ...tpl.skills])).slice(0, 6);
  return finish(
    {
      title, type, hours, stipend, skills, badgeSkills: tpl.badge,
      summary: `A scoped ${tpl.label} based on your description: "${brief.trim().slice(0, 140)}${brief.trim().length > 140 ? "…" : ""}"`,
      deliverables: tpl.dels(topic),
      milestones: tpl.ms.map((t, i) => ({ title: t, dueInDays: 10 + i * 12 })),
      beginnerFriendly: hours <= 20
        ? { ok: true, note: `Scoped to ${hours} hours with reviewable milestones. Suitable for a first or second-year student.` }
        : { ok: false, note: "This is a large scope for a first project. Consider splitting it into two projects." },
    },
    biz,
  );
}
