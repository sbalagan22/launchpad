import type { Faculty, Milestone, MilestoneStatus, Project, ProjectStatus, ProjectType, RubricCriterion } from "@/schemas";
import { daysFromNow, deadlineIn, termSafe } from "@/lib/dates";
import { splitPay } from "@/lib/pay";

// MOCK: hand-written projects in mixed states. All posters are fictional. Dates are relative to the day the
// seed is built, and deadlines avoid approximate exam periods (see termSafe in lib/dates.ts).
//
// Two listings are deliberately NOT seeded because the demo creates them live from the scripted briefs in
// mocks/demo-scripts.ts: "Fill the Tuesday Night Gap" (Corner Press Coffee) and "Instrument the Waitlist" (Reroute).

export type Def = {
  id: string; biz: string; venture?: string; title: string; hook: string; type: ProjectType; status: ProjectStatus;
  hours: number; pay: number; sponsor?: number; skills: string[]; tools: string[]; dels: string[]; ms: [string, number][];
  start: number; end: number; done?: number; student?: string; badge?: string[];
  desc?: string; doneLooks?: string; fit?: string; notFit?: string; rubric?: RubricCriterion[]; reviewers?: string[];
  strengthened?: string[]; faculties?: Faculty[]; fine?: string; beginner?: boolean;
};

export const RUBRIC: Record<ProjectType, RubricCriterion[]> = {
  web: [
    { criterion: "Layout and responsiveness", description: "Works on a phone and a laptop with no sideways scrolling or broken sections." },
    { criterion: "Code clarity", description: "Readable structure, sensible names, and a README another developer can follow." },
    { criterion: "Fit for the poster", description: "Does what was asked and the poster can update it without help." },
    { criterion: "Communication", description: "Questions asked early, updates on time, and decisions written down." },
  ],
  design: [
    { criterion: "Visual hierarchy", description: "The eye lands on the right thing first, and type and spacing are consistent." },
    { criterion: "Brand fit", description: "Matches the poster's tone and existing materials." },
    { criterion: "File quality", description: "Final files are in the formats the poster needs and open without fixing." },
    { criterion: "Communication", description: "Drafts shared early and feedback acted on." },
  ],
  data: [
    { criterion: "Accuracy", description: "Numbers reconcile with the source and every change is logged." },
    { criterion: "Clarity of output", description: "A non-specialist can read the result and act on it." },
    { criterion: "Documentation", description: "A data dictionary or notes explain fields, assumptions and limits." },
    { criterion: "Communication", description: "Questions asked early and findings explained in plain language." },
  ],
  marketing: [
    { criterion: "Audience fit", description: "Content speaks to the people the poster actually wants to reach." },
    { criterion: "Quality of execution", description: "Copy and visuals are polished and ready to publish." },
    { criterion: "Plan and rationale", description: "The student can explain why each choice was made." },
    { criterion: "Communication", description: "Drafts shared early and feedback acted on." },
  ],
  writing: [
    { criterion: "Clarity", description: "Plain language, short sentences, and no jargon the reader will not know." },
    { criterion: "Accuracy", description: "Facts are right and sources are noted." },
    { criterion: "Tone fit", description: "Sounds like the poster, consistently." },
    { criterion: "Communication", description: "Samples shared early and edits turned around quickly." },
  ],
  admin: [
    { criterion: "Usability", description: "The team can use the result tomorrow without a walkthrough." },
    { criterion: "Accuracy", description: "Formulas and figures check out against a real example." },
    { criterion: "Documentation", description: "A one-page guide covers the common cases." },
    { criterion: "Communication", description: "Questions asked early and updates on time." },
  ],
};
export const DONE: Record<ProjectType, string> = {
  web: "A deployed site or app the poster can open on a phone, with code in a repository and a short README the reviewer can follow.",
  design: "Final files in the formats the poster needs, plus a one-page usage guide, shared as a prototype link or PDF.",
  data: "A cleaned dataset or dashboard with a one-page data dictionary and notes on every change, ready to show in a report.",
  marketing: "A plan and finished sample content the poster can publish, with a short report explaining the choices.",
  writing: "Edited, ready-to-publish copy delivered as a shared document with notes on tone and sources.",
  admin: "A working template and a one-page guide the team can use tomorrow, tested with a real example and shared as a link.",
};
export const FIT: Record<ProjectType, [string, string]> = {
  web: ["You can build a small page or app and want a real client and a code review.", "You want a polished design from scratch with no development involved."],
  design: ["You have a portfolio piece or two and want to practice working to a brief.", "You want to do illustration only, with no layout or file prep."],
  data: ["You are comfortable in a spreadsheet or SQL and want messy, real data.", "You want a modelling or machine learning project."],
  marketing: ["You like planning content and writing for a specific audience.", "You want paid advertising experience with a budget."],
  writing: ["You write clearly and can take editing feedback.", "You want creative writing with no brief."],
  admin: ["You like making processes simpler and learning a new tool.", "You want repetitive data entry. This is not that."],
};
export const REVIEWER: Record<ProjectType, string[]> = { web: ["rev_noor"], data: ["rev_sana"], design: ["rev_mei"], marketing: ["rev_mei"], writing: ["rev_mei"], admin: ["rev_sana"] };
const FACULTIES: Record<ProjectType, Faculty[]> = {
  web: ["Lassonde", "Science", "AMPD"], design: ["AMPD", "EUC", "LA&PS"], data: ["Science", "Lassonde", "Schulich", "Health"],
  marketing: ["Schulich", "LA&PS", "Health", "AMPD"], writing: ["LA&PS", "Glendon", "Education"], admin: ["Schulich", "Glendon", "LA&PS"],
};

function build(d: Def): Project {
  const n = d.ms.length;
  const total = d.pay + (d.sponsor ?? 0);
  const amounts = splitPay(total, n);
  const done = d.status === "completed" ? n : d.status === "open" || d.status === "draft" ? 0 : (d.done ?? 0);
  const milestones: Milestone[] = d.ms.map(([title, hours], i) => {
    const dueDay = Math.round(d.start + ((d.end - d.start) * (i + 1)) / n);
    let status: MilestoneStatus = "open";
    if (i < done) status = "approved";
    else if (i === done && d.status === "in_progress") status = "in_progress";
    else if (i === done && d.status === "in_review") status = "in_review";
    const due = d.status === "open" ? deadlineIn(dueDay) : termSafe(daysFromNow(dueDay));
    return { id: `${d.id}_m${i + 1}`, title, hours, dueAt: due, amount: amounts[i], status, ...(status === "approved" ? { approvedAt: daysFromNow(Math.min(dueDay, -1) - (d.status === "completed" && i === n - 1 ? 0 : 1)) } : {}) };
  });
  const [fit, notFit] = FIT[d.type];
  const venture = d.venture !== undefined;
  return {
    id: d.id, businessId: d.biz, ventureId: d.venture, title: d.title, hook: d.hook, type: d.type, status: d.status,
    description: d.desc ?? `${d.hook} ${d.dels[0]}, and ${d.dels[d.dels.length - 1].charAt(0).toLowerCase()}${d.dels[d.dels.length - 1].slice(1)}.`,
    deliverables: d.dels, milestones, skills: d.skills, tools: d.tools, hours: d.hours,
    payType: d.pay === 0 ? "volunteer" : "stipend", pay: d.pay, sponsorStipend: d.sponsor ?? 0,
    deadline: d.status === "open" ? deadlineIn(d.end) : termSafe(daysFromNow(d.end)), createdAt: daysFromNow(d.start - (d.status === "open" ? 0 : 3)),
    studentId: d.student ?? null, reviewerIds: d.reviewers ?? (venture ? ["rev_mentor", ...REVIEWER[d.type]] : REVIEWER[d.type]),
    rubric: d.rubric ?? RUBRIC[d.type], doneLooksLike: d.doneLooks ?? DONE[d.type], goodFit: d.fit ?? fit, notAFit: d.notFit ?? notFit,
    strengthenedBy: d.strengthened ?? [], faculties: d.faculties ?? FACULTIES[d.type], fineprint: d.fine, badgeSkills: d.badge ?? d.skills.slice(0, 1),
    beginnerFriendly: d.beginner ?? d.hours <= 14, aiScoped: true, loggedHours: d.status === "completed" ? d.hours : d.status === "open" ? 0 : Math.round((d.hours * (done + 0.5)) / n),
  };
}

export function seedProjects(): Project[] {
  const defs: Def[] = [
    // ---------------- Open: flagships ----------------
    { id: "prj_board", biz: "biz_foodbank", title: "Make the Board Read the Dashboard", hook: "Three years of donation spreadsheets and one board meeting in four weeks.", type: "data", status: "open", hours: 18, pay: 0, sponsor: 270, start: -3, end: 30,
      skills: ["Data Cleaning", "SQL", "Data Visualization", "Presenting"], tools: ["Metabase"], badge: ["Data Cleaning", "Data Visualization"],
      dels: ["Cleaned donation dataset with a documented schema", "Interactive dashboard the board can filter on its own", "One page data dictionary written for non-technical readers", "Live board walkthrough with a recorded copy"],
      ms: [["Audit and questions", 4], ["Cleaning and schema", 6], ["Dashboard and walkthrough", 8]], reviewers: ["rev_sana", "rev_wei"], strengthened: ["gda", "pl300", "pcep"],
      doneLooks: "The board opens a live dashboard, filters by year and program, and understands the three numbers that matter without you in the room.", fit: "You like turning messy spreadsheets into something people can use and can explain it to a non-technical audience.", notFit: "You want a modelling project or a purely visual design task.", fine: "Volunteer role with a $270 stipend funded by a community sponsor." },
    { id: "prj_game", biz: "biz_lantern", title: "Break Our Game Before Players Do", hook: "We ship in 9 days. Find what we missed.", type: "web", status: "open", hours: 12, pay: 240, start: -2, end: 12,
      skills: ["QA Methodology", "Bug Reporting", "Regression Testing"], tools: ["GitHub Issues"], badge: ["Testing", "Bug Reporting"],
      dels: ["Test plan covering core flows, edge cases and devices", "Forty or more reproducible bug reports with severity and steps", "Retest report after the fixes ship", "Short postmortem with the five most useful lessons"],
      ms: [["Test plan", 3], ["Bug hunt", 6], ["Retest and postmortem", 3]], reviewers: ["rev_eli", "rev_noor"], strengthened: ["gh-foundations"], beginner: false,
      rubric: [{ criterion: "Reproducibility", description: "Every bug has steps another tester can follow to see it again." }, { criterion: "Coverage and severity", description: "Core flows and edge cases are covered and severity is rated sensibly." }, { criterion: "Communication", description: "Reports are clear, on time and free of blame." }],
      doneLooks: "A bug list and a short postmortem.", fit: "You are methodical, enjoy finding edge cases, and write clear steps someone else can follow.", notFit: "You want to design levels or write game code.", fine: "A signed NDA is required before you get a build." },
    { id: "prj_lab", biz: "biz_psylab", title: "Replace the Emailed CSVs", hook: "Participants fill out forms, we copy answers into Excel by hand. Please stop us.", type: "web", status: "open", hours: 25, pay: 500, start: -4, end: 35,
      skills: ["Full-stack Basics", "Database Design", "Authentication", "Data Privacy"], tools: ["Node.js", "MongoDB"], badge: ["Database Design", "Authentication"],
      dels: ["Participant intake web form with consent and validation", "Secure storage with access limited to lab staff", "Admin export to a clean CSV", "README a new research assistant can follow"],
      ms: [["Requirements and schema", 5], ["Build", 14], ["Export and handoff", 6]], reviewers: ["rev_osei", "rev_ta"], strengthened: ["mongodb-dev", "pcap", "gh-foundations"], beginner: false,
      doneLooks: "A deployed form, a clean CSV export and a README.", fit: "You have built a small app before and want to learn authentication and data privacy on a real brief.", notFit: "You want to handle real participant data. This project uses test data only.", fine: "Test data only. The professor is responsible for ethics approval. Pay is subject to York hiring rules." },
    { id: "prj_reroute_mvp", biz: "biz_reroute", venture: "ven_reroute", title: "Ship the First Real Version of Reroute", hook: "From a mapped flow to a deployed build with real transit data, in one term.", type: "web", status: "open", hours: 25, pay: 500, start: -2, end: 40,
      skills: ["APIs", "Maps", "State Management", "Shipping"], tools: ["React", "Mapbox", "GitHub"], badge: ["APIs", "Shipping"],
      dels: ["Mapped user flow from delay alert to a new route", "Deployed MVP using real transit data", "Core flow and map view that works on a phone", "Delay alert the user can turn on", "Two minute demo video for the founders"],
      ms: [["Scope and data audit", 4], ["Core flow and map view", 12], ["Alerts and deploy", 9]], reviewers: ["rev_mentor", "rev_noor"], strengthened: ["fcc-rwd", "gh-foundations", "mongodb-dev"], beginner: false,
      doneLooks: "A live prototype at a public link that reroutes a real delayed trip, code in a GitHub repo, and a short demo video the founders can send to riders.", fit: "You want to ship something real with founders and care about product choices as much as code.", notFit: "You want a tightly specified task with no open decisions." },
    { id: "prj_sprig_demo", biz: "biz_sprig", venture: "ven_sprig", title: "Founder Demo Day Site and Pitch Assets", hook: "One page, one deck, one sixty second story, before demo day.", type: "design", status: "open", hours: 16, pay: 320, start: -3, end: 26,
      skills: ["Web Design", "Storytelling", "Visual Hierarchy"], tools: ["Figma", "Webflow"], badge: ["Web Design", "Storytelling"],
      dels: ["One page site", "Pitch deck template", "Sixty second demo script"],
      rubric: [{ criterion: "Visual hierarchy", description: "The eye lands on the pitch first and the signup second." }, { criterion: "Story clarity", description: "A stranger understands the problem and the product in sixty seconds." }, { criterion: "Brand fit", description: "Type, colour and tone match the Sprig brand." }],
      ms: [["Brand pull and page structure", 4], ["One page site", 8], ["Deck template and script", 4]], reviewers: ["rev_mentor", "rev_mei"], strengthened: ["fcc-rwd"], beginner: true,
      doneLooks: "A published site, an editable deck and a script.", fit: "You can lay out a page and a deck and enjoy making a story easy to follow.", notFit: "You want to write the founder's pitch for them. You will structure it, they will say it." },
    { id: "prj_pulse", biz: "biz_pulse", venture: "ven_pulse", title: "Prototype the Daily Check-in Flow", hook: "A two minute check-in that a front desk can read at a glance.", type: "web", status: "open", hours: 20, pay: 400, start: -5, end: 33,
      skills: ["React", "Forms and Validation", "Accessibility", "User Testing"], tools: ["React", "Firebase", "Figma"], badge: ["React", "Accessibility"],
      dels: ["Clickable check-in flow built in React", "Form validation and error states tested with five people", "Accessibility notes with fixes applied", "Short test findings memo"],
      ms: [["Flow and wireframes", 5], ["Build and validation", 10], ["Testing and findings", 5]], strengthened: ["fcc-rwd", "gh-foundations"], beginner: false,
      doneLooks: "A deployed prototype five people have tried, a findings memo with three changes, and the code in a repository with a README.", fine: "No real health information. Use invented data only." },
    { id: "prj_ledgerleaf", biz: "biz_ledgerleaf", venture: "ven_ledgerleaf", title: "Invoice Aging Dashboard Prototype", hook: "Show a freelancer which invoices to chase first.", type: "data", status: "open", hours: 18, pay: 360, start: -4, end: 36,
      skills: ["SQL", "Data Visualization", "Product Analytics"], tools: ["Postgres", "Metabase", "Python"], badge: ["SQL", "Product Analytics"],
      dels: ["Aging report query set with documented logic", "Interactive dashboard sorted by risk", "One page note on edge cases found in the sample data", "Two minute walkthrough recording"],
      ms: [["Data model and queries", 6], ["Dashboard", 8], ["Edge cases and walkthrough", 4]], strengthened: ["gda", "pcep"],
      doneLooks: "A dashboard on sample invoices that surfaces the five worst accounts, with queries in a repository and a recorded walkthrough." },
    { id: "prj_kiln", biz: "biz_kiln", venture: "ven_kiln", title: "Build a Prompt Comparison Dashboard", hook: "Same prompts, three models, one table you can trust.", type: "web", status: "open", hours: 22, pay: 440, start: -3, end: 38,
      skills: ["Python", "APIs", "Data Visualization", "Testing"], tools: ["FastAPI", "React", "Pandas"], badge: ["APIs", "Python"],
      dels: ["API that stores model responses for a fixed prompt set", "Results table with filters and side by side view", "Tests covering the storage and filtering logic", "README explaining how to add a model"],
      ms: [["Data model and API", 8], ["Results table", 9], ["Tests and handoff", 5]], strengthened: ["pcap", "gh-foundations"], beginner: false,
      doneLooks: "A running app and repository where Kiln can load responses, compare them side by side and add a new model by following the README." },
    { id: "prj_tidewell", biz: "biz_tidewell", venture: "ven_tidewell", title: "Carbon Estimator Widget for Restaurants", hook: "Turn a month of supplier invoices into one honest number.", type: "web", status: "open", hours: 16, pay: 320, start: -2, end: 29,
      skills: ["JavaScript", "Data Modelling", "Charts"], tools: ["Next.js", "Chart.js", "Git"], badge: ["JavaScript", "Data Modelling"],
      dels: ["Embeddable estimator widget that takes invoice totals by category", "Chart showing the biggest sources", "Documented emissions factors with sources", "Embed instructions for a restaurant website"],
      ms: [["Factors and model", 5], ["Widget build", 8], ["Charts and docs", 3]], strengthened: ["fcc-rwd", "gh-foundations"],
      doneLooks: "A widget embedded on a test page that produces a defensible estimate, with every emissions factor sourced in a short document." },
    // ---------------- Open: simpler listings ----------------
    { id: "prj_video", biz: "biz_digmedia", title: "Department Recap Video", hook: "A ninety second year-in-review the department can post everywhere.", type: "marketing", status: "open", hours: 10, pay: 200, start: -6, end: 27,
      skills: ["Video Editing", "Storytelling", "Brand Consistency"], tools: ["DaVinci Resolve", "Canva"], badge: ["Video Editing"],
      dels: ["Ninety second recap video exported for web and social", "Square cutdown for Instagram", "Short plan explaining the story structure"], ms: [["Story plan and shot list", 3], ["Edit", 5], ["Exports and cutdowns", 2]], faculties: ["AMPD", "LA&PS"], beginner: true },
    { id: "prj_sponsor", biz: "biz_bsa", title: "Sponsorship Deck and Outreach Plan", hook: "The networking night needs three sponsors by January.", type: "marketing", status: "open", hours: 12, pay: 0, start: -4, end: 31,
      skills: ["Research", "Writing", "Presentation Design", "Outreach"], tools: ["Google Slides", "Airtable"], badge: ["Presentation Design"],
      dels: ["Sponsorship deck with tiers and benefits", "Target list of twenty companies with reasons", "Three outreach email templates", "Tracking sheet in Airtable"], ms: [["Research and target list", 4], ["Deck", 5], ["Emails and tracker", 3]], faculties: ["Schulich", "LA&PS", "Health"], beginner: true },
    { id: "prj_robo", biz: "biz_roboclub", title: "Robotics Club Website Refresh", hook: "Our site still lists last year's team.", type: "web", status: "open", hours: 18, pay: 0, start: -5, end: 32,
      skills: ["HTML", "CSS", "JavaScript", "Responsive Layout"], tools: ["Git", "Netlify", "Figma"], badge: ["Responsive Layout"],
      dels: ["Refreshed responsive site with team, projects and sponsors pages", "Content file the club can edit without code", "Deployed site on Netlify", "Short handover guide"], ms: [["Wireframes", 4], ["Build", 10], ["Deploy and handover", 4]], strengthened: ["fcc-rwd", "gh-foundations"], beginner: true },
    { id: "prj_fieldnote", biz: "biz_fieldnote", title: "Landing Page and Onboarding Emails", hook: "Two founders, one waitlist, and a page that does not say what we do.", type: "web", status: "open", hours: 14, pay: 280, start: -3, end: 24,
      skills: ["HTML", "CSS", "Copywriting", "Email Marketing"], tools: ["Next.js", "Mailchimp", "Figma"], badge: ["Copywriting"],
      dels: ["Landing page with a clear value statement and signup form", "Three onboarding emails in the product's voice", "Analytics set up to count signups", "Short note on what to test next"], ms: [["Message and wireframe", 3], ["Page build", 7], ["Emails and analytics", 4]], strengthened: ["fcc-rwd"], beginner: true },
    { id: "prj_clinic", biz: "biz_finch", title: "Appointment Reminder Script", hook: "One in eight patients miss their slot. A text the day before might help.", type: "data", status: "open", hours: 10, pay: 220, start: -4, end: 28,
      skills: ["Python", "Automation", "Scheduling APIs"], tools: ["Python", "Twilio Sandbox", "Google Sheets"], badge: ["Automation"],
      dels: ["Script that reads a sheet of test appointments and sends reminders in a sandbox", "Configurable message template", "Log of what was sent and what failed", "Run instructions for the front desk"], ms: [["Design and test sheet", 3], ["Script", 5], ["Logging and instructions", 2]], strengthened: ["pcep", "pcap"], fine: "Sandbox and invented patient data only. No real patient information.", beginner: true },
    { id: "prj_scheduler", biz: "biz_garden", title: "Volunteer Shift Scheduler", hook: "The rota lives in a group chat and three people hold all of it.", type: "web", status: "open", hours: 16, pay: 0, start: -5, end: 34,
      skills: ["JavaScript", "Forms and Validation", "Calendars"], tools: ["Node.js", "SQLite", "Git"], badge: ["Forms and Validation"],
      dels: ["Shift signup form with capacity limits", "Weekly calendar view the coordinator can print", "Reminder email the night before", "Setup guide for the coordinator"], ms: [["Requirements and data", 4], ["Signup and calendar", 8], ["Reminders and guide", 4]], strengthened: ["fcc-rwd", "gh-foundations", "mongodb-dev"] },
    { id: "prj_figure", biz: "biz_vizlab", title: "Visualization for a Paper Figure", hook: "One figure has to explain a year of experiments to a reviewer.", type: "data", status: "open", hours: 12, pay: 240, start: -3, end: 25,
      skills: ["Data Visualization", "Python", "Scientific Communication"], tools: ["Python", "Matplotlib", "Figma"], badge: ["Data Visualization"],
      dels: ["Publication-ready figure in vector format", "Script that reproduces the figure from the raw data", "Two alternative designs with a note on trade-offs"], ms: [["Data review and sketches", 3], ["Figure draft", 6], ["Final and script", 3]], reviewers: ["rev_wei"], strengthened: ["pcep", "gda"], faculties: ["Science", "EUC", "Health"], fine: "Pay is subject to York hiring rules." },
    { id: "prj_audit", biz: "biz_a11y", title: "Accessibility Audit of a Department Page", hook: "Find what a screen reader trips on and say how to fix it.", type: "web", status: "open", hours: 10, pay: 200, start: -2, end: 26,
      skills: ["Accessibility", "Auditing", "Technical Writing"], tools: ["axe DevTools", "NVDA", "WAVE"], badge: ["Accessibility"],
      dels: ["Audit report ranking issues by severity with screenshots", "Fix recommendations written for a web editor", "Retest after the department applies the top fixes"], ms: [["Plan and tooling", 2], ["Audit", 5], ["Report and retest", 3]], faculties: ["Lassonde", "LA&PS", "Education"], beginner: true },
    // ---------------- In progress ----------------
    { id: "prj_hack", biz: "biz_roboclub", title: "Hack Night Registration Site", hook: "Sign-ups by spreadsheet are costing us a seat a week.", type: "web", status: "in_progress", hours: 12, pay: 0, start: -14, end: 24, done: 1, student: "stu_aisha",
      skills: ["HTML", "CSS", "JavaScript", "Forms and Validation"], tools: ["Git", "Netlify"], badge: ["JavaScript"], dels: ["Registration form with capacity limits", "Confirmation page and email", "Deployed site with a short README"], ms: [["Layout", 3], ["Working form", 6], ["Testing and handover", 3]] },
    { id: "prj_kilndash", biz: "biz_kiln", venture: "ven_kiln", title: "Eval Results Table", hook: "A table of model responses the founders can sort and filter.", type: "web", status: "in_progress", hours: 16, pay: 320, start: -16, end: 18, done: 0, student: "stu_daniel",
      skills: ["React", "APIs", "Testing"], tools: ["React", "FastAPI", "Vitest"], badge: ["React"], dels: ["Sortable results table", "Filter by model and prompt", "Tests for the filtering logic"], ms: [["Table prototype", 5], ["Filters", 7], ["Tests and handoff", 4]], reviewers: ["rev_mentor", "rev_noor"] },
    { id: "prj_survey", biz: "biz_vizlab", title: "Survey Data Cleaning Pipeline", hook: "Eight hundred responses with seven spellings of the same answer.", type: "data", status: "in_progress", hours: 14, pay: 280, start: -12, end: 20, done: 1, student: "stu_marcus",
      skills: ["Data Cleaning", "Python", "Documentation"], tools: ["Python", "Pandas"], badge: ["Python"], dels: ["Cleaning script that is safe to rerun", "Cleaned dataset with a change log", "Short data dictionary"], ms: [["Audit", 4], ["Script", 6], ["Dictionary and handoff", 4]], reviewers: ["rev_wei"] },
    // ---------------- In review ----------------
    { id: "prj_menu", biz: "biz_corner", title: "Digital Menu Board", hook: "The chalkboard cannot show the oat milk price change.", type: "web", status: "in_review", hours: 12, pay: 240, start: -22, end: 5, done: 1, student: "stu_omar",
      skills: ["HTML", "CSS", "JavaScript", "Responsive Layout"], tools: ["Git", "Netlify"], badge: ["Responsive Layout"], dels: ["Menu board page for the counter screen", "Simple price file the owner can edit", "Deployed link and README"], ms: [["Layout", 4], ["Build", 5], ["Deploy and handover", 3]] },
    { id: "prj_poster", biz: "biz_digmedia", title: "Open House Poster Set", hook: "Three sizes, one look, and a print deadline.", type: "design", status: "in_review", hours: 8, pay: 160, start: -18, end: 4, done: 1, student: "stu_sofia",
      skills: ["Layout Design", "Illustration", "Figma"], tools: ["Figma", "Illustrator"], badge: ["Layout Design"], dels: ["Poster in A3, A4 and square sizes", "Print-ready PDFs with bleed", "One-page usage guide"], ms: [["Concepts", 3], ["Final files", 5]] },
    // ---------------- Completed ----------------
    { id: "prj_c01", biz: "biz_roboclub", title: "Club Event Microsite", hook: "A single page for the spring showcase.", type: "web", status: "completed", hours: 10, pay: 0, start: -60, end: -30, student: "stu_aisha",
      skills: ["HTML", "CSS", "Responsive Layout"], tools: ["Git", "Netlify"], badge: ["HTML", "CSS"], dels: ["Responsive event page with schedule and map", "Deployed site", "Update guide for club execs"], ms: [["Layout", 3], ["Build", 5], ["Deploy", 2]] },
    { id: "prj_c02", biz: "biz_fieldnote", title: "Waitlist Page in React", hook: "A signup page that counts and thanks.", type: "web", status: "completed", hours: 12, pay: 240, start: -80, end: -45, student: "stu_aisha",
      skills: ["React", "Forms and Validation", "Git"], tools: ["React", "Vercel", "GitHub"], badge: ["React", "Git"], dels: ["Waitlist page built in React", "Form validation and duplicate email handling", "Deployed on Vercel with a README"], ms: [["Component plan", 3], ["Build", 6], ["Deploy", 3]], reviewers: ["rev_noor"] },
    { id: "prj_c03", biz: "biz_reroute", venture: "ven_reroute", title: "Transit Stop Search Prototype", hook: "Find the nearest stop that is actually running.", type: "web", status: "completed", hours: 14, pay: 280, start: -110, end: -70, student: "stu_daniel",
      skills: ["JavaScript", "APIs", "Maps"], tools: ["React", "Mapbox", "Node.js"], badge: ["JavaScript", "APIs"], dels: ["Stop search with live arrival times", "Map view with the nearest stops", "Short write-up of API limits found"], ms: [["Data audit", 3], ["Search and map", 8], ["Write-up", 3]] },
    { id: "prj_c04", biz: "biz_corner", title: "Loyalty QR Page", hook: "Scan, stamp, repeat.", type: "web", status: "completed", hours: 8, pay: 160, start: -75, end: -48, student: "stu_daniel",
      skills: ["Node.js", "JavaScript", "Forms and Validation"], tools: ["Node.js", "SQLite"], badge: ["Node.js"], dels: ["Loyalty stamp page opened by QR code", "Stamp counter stored in a simple database", "Owner admin view"], ms: [["Prototype", 3], ["Build and deploy", 5]] },
    { id: "prj_c05", biz: "biz_sprig", venture: "ven_sprig", title: "Brand One-Pager", hook: "A page a farmer can hand to a neighbour.", type: "design", status: "completed", hours: 8, pay: 160, start: -70, end: -40, student: "stu_priya",
      skills: ["Branding", "Layout Design", "Figma"], tools: ["Figma", "Illustrator"], badge: ["Branding"], dels: ["Brand one-pager in print and screen versions", "Colour and type guide", "Editable Figma file"], ms: [["Concepts", 3], ["Final", 5]] },
    { id: "prj_c06", biz: "biz_bsa", title: "Networking Night Poster Pack", hook: "Posters, a banner and a social tile.", type: "design", status: "completed", hours: 10, pay: 0, start: -95, end: -62, student: "stu_priya",
      skills: ["Layout Design", "Figma", "Canva"], tools: ["Figma", "Canva"], badge: ["Layout Design"], dels: ["Poster, banner and social tile in one system", "Print-ready PDFs", "Editable Canva templates"], ms: [["Concepts", 3], ["Layouts", 4], ["Files", 3]] },
    { id: "prj_c07", biz: "biz_foodbank", title: "Donor Retention Analysis", hook: "Why do first-time donors not come back?", type: "data", status: "completed", hours: 14, pay: 0, start: -105, end: -70, student: "stu_marcus",
      skills: ["SQL", "Data Visualization", "Data Cleaning"], tools: ["SQL", "Metabase", "Python"], badge: ["SQL", "Data Visualization"], dels: ["Cleaned donor table", "Retention charts by cohort", "Two page recommendations memo"], ms: [["Cleaning", 5], ["Analysis", 6], ["Memo", 3]], reviewers: ["rev_sana"] },
    { id: "prj_c08", biz: "biz_pulse", venture: "ven_pulse", title: "Clinic Wait-Time Analysis", hook: "Where do patients wait, and for how long?", type: "data", status: "completed", hours: 12, pay: 240, start: -65, end: -38, student: "stu_marcus",
      skills: ["Data Cleaning", "Data Visualization", "Python"], tools: ["Python", "Pandas", "Metabase"], badge: ["Data Cleaning"], dels: ["Cleaned wait-time dataset", "Dashboard of waits by hour and day", "One page findings memo"], ms: [["Cleaning", 4], ["Dashboard", 5], ["Memo", 3]] },
    { id: "prj_c09", biz: "biz_tidewell", venture: "ven_tidewell", title: "Emissions Explainer Graphics", hook: "Three graphics that make a number feel real.", type: "design", status: "completed", hours: 10, pay: 200, start: -90, end: -58, student: "stu_sofia",
      skills: ["Data Visualization", "Illustration", "Storytelling"], tools: ["Figma", "Illustrator"], badge: ["Data Visualization"], dels: ["Three explainer graphics", "Editable source files", "Alt text for each graphic"], ms: [["Sketches", 3], ["Graphics", 5], ["Files and alt text", 2]] },
    { id: "prj_c10", biz: "biz_garden", title: "Plot Map and Signage", hook: "Eighty-five plots and nobody can find theirs.", type: "design", status: "completed", hours: 8, pay: 0, start: -100, end: -75, student: "stu_sofia",
      skills: ["Illustration", "Layout Design"], tools: ["Illustrator", "Figma"], badge: ["Illustration"], dels: ["Illustrated plot map", "Signage set for the entrances", "Print-ready files"], ms: [["Map sketch", 3], ["Final signage", 5]] },
    { id: "prj_c11", biz: "biz_kiln", venture: "ven_kiln", title: "Launch Week Social Posts", hook: "Seven days, seven posts, one clear message.", type: "marketing", status: "completed", hours: 10, pay: 200, start: -55, end: -28, student: "stu_jordan",
      skills: ["Social Media", "Canva", "Writing"], tools: ["Canva", "Buffer"], badge: ["Social Media"], dels: ["Seven scheduled posts with captions", "Short plan explaining the sequence", "Analytics summary after launch week"], ms: [["Plan", 3], ["Posts", 4], ["Summary", 3]] },
    { id: "prj_c12", biz: "biz_bsa", title: "Sponsor Email Sequence", hook: "Four emails that do not sound like a form letter.", type: "marketing", status: "completed", hours: 8, pay: 0, start: -85, end: -55, student: "stu_jordan",
      skills: ["Email Marketing", "Writing"], tools: ["Mailchimp", "Google Sheets"], badge: ["Email Marketing"], dels: ["Four-email sponsor sequence", "Subject line variants", "Mailchimp setup and test send"], ms: [["Drafts", 4], ["Setup and send", 4]] },
    { id: "prj_c13", biz: "biz_ledgerleaf", venture: "ven_ledgerleaf", title: "Freelancer Pricing Research Memo", hook: "What do freelancers pay to get paid faster?", type: "admin", status: "completed", hours: 10, pay: 200, start: -62, end: -34, student: "stu_fatima",
      skills: ["Market Research", "Excel", "Documentation"], tools: ["Excel", "Airtable"], badge: ["Market Research"], dels: ["Competitor pricing table", "Five interview summaries", "Three page recommendation memo"], ms: [["Research plan", 3], ["Interviews", 4], ["Memo", 3]], reviewers: ["rev_mentor", "rev_sana"] },
    { id: "prj_c14", biz: "biz_finch", title: "Intake Form Redesign", hook: "Four pages of paper, two minutes of patience.", type: "admin", status: "completed", hours: 8, pay: 160, start: -78, end: -50, student: "stu_fatima",
      skills: ["Documentation", "Excel", "Process Mapping"], tools: ["Google Forms", "Notion"], badge: ["Documentation"], dels: ["Redesigned intake form in Google Forms", "Process map of the front desk flow", "One page staff guide"], ms: [["Process map", 3], ["Form and guide", 5]] },
    { id: "prj_c15", biz: "biz_lantern", title: "Telemetry Logging Tool", hook: "Know where players quit.", type: "web", status: "completed", hours: 12, pay: 240, start: -92, end: -60, student: "stu_liam",
      skills: ["Testing", "JavaScript", "Python"], tools: ["Python", "Google Sheets"], badge: ["Testing"], dels: ["Logging script for playtest sessions", "Summary sheet of drop-off points", "Short usage guide"], ms: [["Design", 3], ["Script and sheet", 6], ["Guide", 3]], reviewers: ["rev_eli", "rev_noor"] },
    { id: "prj_c16", biz: "biz_psylab", title: "Survey Scoring Script", hook: "Stop scoring questionnaires by hand.", type: "data", status: "completed", hours: 10, pay: 200, start: -88, end: -56, student: "stu_liam",
      skills: ["Python", "Data Cleaning"], tools: ["Python", "Pandas"], badge: ["Python"], dels: ["Scoring script with unit tests", "Example input and output files", "README for lab staff"], ms: [["Spec", 3], ["Script and tests", 5], ["README", 2]], reviewers: ["rev_osei", "rev_ta"] },
    { id: "prj_c17", biz: "biz_garden", title: "Volunteer Handbook", hook: "Everything the new volunteer asks in week one.", type: "writing", status: "completed", hours: 10, pay: 0, start: -96, end: -64, student: "stu_hannah",
      skills: ["Writing", "Editing", "Research"], tools: ["Google Docs", "Canva"], badge: ["Writing"], dels: ["Twelve page volunteer handbook", "One page quick-start sheet", "Editable source document"], ms: [["Outline", 3], ["Draft", 4], ["Final edit", 3]] },
    { id: "prj_c18", biz: "biz_a11y", title: "Plain-Language Guidelines", hook: "Write for the person who has two minutes.", type: "writing", status: "completed", hours: 8, pay: 160, start: -64, end: -36, student: "stu_hannah",
      skills: ["Editing", "Accessibility", "Writing"], tools: ["Google Docs", "Hemingway Editor"], badge: ["Editing"], dels: ["Plain-language guide for web editors", "Before and after examples", "One page checklist"], ms: [["Draft", 4], ["Final", 4]] },
    { id: "prj_c19", biz: "biz_vizlab", title: "Heatmap Figure", hook: "A heatmap that survives a grayscale printer.", type: "data", status: "completed", hours: 12, pay: 240, start: -70, end: -42, student: "stu_arjun",
      skills: ["Data Visualization", "Python"], tools: ["Python", "Matplotlib"], badge: ["Data Visualization"], dels: ["Heatmap figure in vector format", "Reproducible script", "Colourblind-safe palette note"], ms: [["Sketch", 4], ["Figure", 5], ["Script and notes", 3]], reviewers: ["rev_wei"] },
    { id: "prj_c20", biz: "biz_foodbank", title: "Budget Tracker", hook: "One sheet the treasurer can trust.", type: "admin", status: "completed", hours: 8, pay: 0, start: -86, end: -52, student: "stu_emily",
      skills: ["Budgeting", "Excel", "Documentation"], tools: ["Excel", "Google Sheets"], badge: ["Budgeting"], dels: ["Budget tracker workbook with monthly roll-up", "Worked example using last year's numbers", "One page how-to"], ms: [["Draft", 3], ["Final", 5]] },
  ];
  return defs.map(build);
}
