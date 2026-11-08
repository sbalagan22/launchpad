import type { ScopeResult } from "@/schemas";

// MOCK: the poster-side AI is scripted. These briefs are what streams when the demo runs without USE_REAL_AI.
// "Instrument the Waitlist" (Reroute) and "Fill the Tuesday Night Gap" (cafe) are created live from these
// scripts; neither is seeded as a project. The AI only structures the poster's ask. It never writes student work.

export type DemoScript = { id: string; trigger: RegExp; brief: ScopeResult };

export const DEMO_SCRIPTS: DemoScript[] = [
  {
    id: "instrument-the-waitlist",
    trigger: /waitlist|signup|sign-up|funnel|analytics|instrument/i,
    brief: {
      title: "Instrument the Waitlist",
      hook: "Add tracking to Reroute's waitlist page and tell us where people drop off.",
      type: "data",
      summary: "Reroute has 214 people on its waitlist but cannot tell which visitors leave before signing up. A student adds basic analytics events to the page, pulls the funnel, and writes a short memo on what to change.",
      deliverables: ["An event plan listing the 8 to 10 events to track", "Analytics events added to the waitlist page", "A funnel report from at least two weeks of data", "A memo with 3 recommendations"],
      milestones: [{ title: "Event plan and tracking setup", hours: 4, dueInDays: 7 }, { title: "Funnel analysis", hours: 5, dueInDays: 14 }, { title: "Memo with 3 recommendations", hours: 5, dueInDays: 21 }],
      skills: ["SQL", "Analytics", "JavaScript", "Data Visualization", "Python"], tools: ["Plausible", "PostgreSQL", "Google Sheets"],
      hours: 14, payType: "stipend", pay: 280, payMin: 252, payMax: 350, sponsorStipend: 0,
      acceptance: ["Every event in the plan fires once per action", "Funnel report shows each step with counts and drop-off", "Memo has exactly three recommendations with reasoning", "Setup notes let a founder add a new event"],
      difficulty: "Intermediate", locationMode: "remote",
      doneLooksLike: "A live tracking setup, a funnel report from two weeks of data and a memo the founders can act on.",
      goodFit: "You like turning numbers into a clear recommendation and can write a little JavaScript.", notAFit: "You want a purely visual design task or cannot spare 5 to 6 hours a week.",
      strengthenedBy: ["gda", "gh-foundations"], badgeSkills: ["Analytics", "SQL"], beginnerFriendly: { ok: false, note: "Some SQL and JavaScript are needed, so this suits second year and up." },
    },
  },
  {
    id: "tuesday-night-gap",
    trigger: /tuesday|quiet night|slow night|empty|gap/i,
    brief: {
      title: "Fill the Tuesday Night Gap",
      hook: "Design and run a small campaign that brings students to the cafe on its quietest night.",
      type: "marketing",
      summary: "Corner Press Coffee is two blocks from campus and nearly empty on Tuesday evenings. A student plans a four-week campaign, produces the assets and reports what moved the numbers.",
      deliverables: ["A short audience and offer plan", "A poster and three social posts", "A four-week content calendar", "A results summary with sales on Tuesday nights"],
      milestones: [{ title: "Audience and offer plan", hours: 3, dueInDays: 7 }, { title: "Campaign assets", hours: 6, dueInDays: 14 }, { title: "Run and report", hours: 3, dueInDays: 35 }],
      skills: ["Social Media", "Canva", "Writing", "Market Research"], tools: ["Canva", "Instagram"],
      hours: 12, payType: "stipend", pay: 240, payMin: 216, payMax: 300, sponsorStipend: 0,
      acceptance: ["The plan names one audience and one offer", "Poster and posts follow the cafe's look", "The calendar covers four weeks", "The summary compares Tuesday sales before and after"],
      difficulty: "Beginner", locationMode: "on_campus",
      doneLooksLike: "A running campaign, assets the owner can reuse and a one-page summary of what worked.",
      goodFit: "You enjoy social media and understand what students like.", notAFit: "You want a technical project.",
      strengthenedBy: [], badgeSkills: ["Social Media", "Canva"], beginnerFriendly: { ok: true, note: "Well bounded and friendly for a first project." },
    },
  },
];

/** Keyword-templated scope for anything that is not a scripted demo brief. */
export function templateScope(raw: string, volunteerEligible: boolean): ScopeResult {
  const t = raw.toLowerCase();
  const isWeb = /site|web|app|page|form|dashboard|code/.test(t);
  const isData = /data|spreadsheet|report|csv|chart|numbers|survey/.test(t);
  const isDesign = /logo|poster|brand|design|flyer/.test(t);
  const type: ScopeResult["type"] = isDesign ? "design" : isData ? "data" : isWeb ? "web" : "marketing";
  const title = raw.trim().replace(/\s+/g, " ").slice(0, 60).replace(/^./, (c) => c.toUpperCase()).replace(/[.!?]+$/, "");
  const skills = isDesign ? ["Branding", "Figma", "Layout Design"] : isData ? ["Excel", "Data Visualization", "Documentation"] : isWeb ? ["HTML", "CSS", "JavaScript"] : ["Social Media", "Writing", "Canva"];
  const free = volunteerEligible && /volunteer|unpaid|free/.test(t);
  return {
    title: title || "Small project", hook: "A small, well-defined project with a clear checklist.", type, summary: raw.trim(),
    deliverables: ["A short plan of what will be done", "The main deliverable described in the ask", "A one-page handover note"],
    milestones: [{ title: "Plan and questions", hours: 3, dueInDays: 7 }, { title: "First full version", hours: 6, dueInDays: 14 }, { title: "Revisions and handover", hours: 3, dueInDays: 21 }],
    skills, tools: [], hours: 12, payType: free ? "volunteer" : "stipend", pay: free ? 0 : 240, payMin: free ? 0 : 216, payMax: free ? 0 : 300, sponsorStipend: 0,
    acceptance: ["The plan matches what was asked", "The main deliverable works for its audience", "The handover note explains how to maintain it"],
    difficulty: "Beginner", locationMode: "remote", doneLooksLike: "The deliverable is finished, checked against the criteria and handed over with a short note.",
    goodFit: "You are curious and good at asking clarifying questions.", notAFit: "You need a large, open-ended project.", strengthenedBy: [], badgeSkills: skills.slice(0, 2),
    beginnerFriendly: { ok: true, note: "Well bounded for a first project." },
  };
}
