import type { Milestone, MilestoneStatus, Project, ProjectStatus, ProjectType } from "@/schemas";
import { daysFromNow } from "@/lib/dates";

type Def = {
  id: string; biz: string; title: string; type: ProjectType; status: ProjectStatus;
  hours: number; pay: number; skills: string[]; badge?: string[]; student?: string;
  /** days relative to today when the project was posted / started (negative = past) */
  start: number;
  /** deadline, days relative to today */
  end: number;
  /** how many milestones are already approved */
  done?: number;
  desc: string; dels: string[]; ms: string[]; beginner?: boolean;
};

const WEIGHTS: Record<number, number[]> = { 2: [0.4, 0.6], 3: [0.25, 0.375, 0.375], 4: [0.2, 0.2, 0.3, 0.3] };

function build(d: Def): Project {
  const n = d.ms.length;
  const amounts = WEIGHTS[n].map((w) => Math.round((d.pay * w) / 5) * 5);
  amounts[n - 1] += d.pay - amounts.reduce((a, b) => a + b, 0);
  const done = d.status === "completed" ? n : d.status === "open" ? 0 : (d.done ?? 0);
  const milestones: Milestone[] = d.ms.map((title, i) => {
    const dueDay = Math.round(d.start + ((d.end - d.start) * (i + 1)) / n);
    let status: MilestoneStatus = "open";
    if (i < done) status = "approved";
    else if (i === done && d.status === "in_progress") status = "in_progress";
    else if (i === done && d.status === "in_review") status = "in_review";
    return {
      id: `${d.id}_m${i + 1}`, title, dueAt: daysFromNow(dueDay), amount: d.pay === 0 ? 0 : amounts[i], status,
      ...(status === "approved" ? { approvedAt: daysFromNow(Math.min(dueDay, -1) - (d.status === "completed" && i === n - 1 ? 0 : 1)) } : {}),
    };
  });
  const logged = d.status === "open" ? 0 : Math.round((d.hours * (done + (d.status === "completed" ? 0 : 0.5))) / n);
  return {
    id: d.id, businessId: d.biz, title: d.title, type: d.type, status: d.status, description: d.desc,
    deliverables: d.dels, milestones, skills: d.skills, hours: d.hours,
    payType: d.pay === 0 ? "volunteer" : "stipend", pay: d.pay,
    deadline: daysFromNow(d.end), createdAt: daysFromNow(d.start - (d.status === "open" ? 0 : 3)),
    studentId: d.student ?? null, badgeSkills: d.badge ?? [], beginnerFriendly: d.beginner ?? d.hours <= 14, aiScoped: true,
    loggedHours: d.status === "completed" ? d.hours : logged,
  };
}

// MOCK: 30 hand-written projects in mixed states. Dates are relative to the day the seed is built.
export function seedProjects(): Project[] {
  const defs: Def[] = [
    // ---- Open (6) ----
    { id: "prj_01", biz: "biz_halton", title: "Volunteer signup form", type: "web", status: "open", hours: 14, pay: 0, skills: ["HTML", "JavaScript", "CSS"], badge: ["JavaScript"], start: -2, end: 38,
      desc: "Halton Food Bank collects volunteer shifts by email. They need a signup form with shift selection and a confirmation email.",
      dels: ["Form with shift picker", "Confirmation email template", "Admin export to CSV"], ms: ["Form design", "Working form", "Email and export"] },
    { id: "prj_02", biz: "biz_peelhub", title: "Social media plan", type: "marketing", status: "open", hours: 12, pay: 0, skills: ["Writing", "Canva", "Research", "Social Media"], badge: ["Social Media"], start: -4, end: 43,
      desc: "A nonprofit supporting local teens needs a three-month social media plan with a content calendar and sample posts.",
      dels: ["Audience and channel recommendation", "12-week content calendar", "10 sample posts with captions"], ms: ["Audience research", "Content calendar", "Sample posts"] },
    { id: "prj_03", biz: "biz_greenedge", title: "Logo and brand mark", type: "design", status: "open", hours: 10, pay: 250, skills: ["Figma", "Illustration", "Branding"], badge: ["Branding"], start: -5, end: 28,
      desc: "GreenEdge needs a simple logo that works on trucks, uniforms, and invoices.",
      dels: ["3 logo concepts", "Final logo in SVG and PNG", "One-page usage guide"], ms: ["Concepts", "Revisions", "Final files"] },
    { id: "prj_04", biz: "biz_maplelane", title: "Instagram post templates", type: "marketing", status: "open", hours: 8, pay: 200, skills: ["Canva", "Branding"], badge: ["Canva"], start: -3, end: 31,
      desc: "Maple Lane wants six reusable Instagram templates for appointments, before and after photos, and promotions.",
      dels: ["6 Canva templates", "Short how-to guide for staff"], ms: ["Template drafts", "Final templates"] },
    { id: "prj_05", biz: "biz_brightsmile", title: "Patient data cleanup", type: "data", status: "open", hours: 15, pay: 300, skills: ["Excel", "Data Cleaning", "SQL"], badge: ["Data Cleaning"], start: -6, end: 41,
      desc: "Bright Smile needs duplicate records merged and inconsistent fields standardized in an exported patient list. No patient records leave the clinic's secure drive.",
      dels: ["Duplicate report", "Cleaned spreadsheet", "Short change log"], ms: ["Audit and duplicate report", "Cleaning pass", "Review and change log"] },
    { id: "prj_06", biz: "biz_kensington", title: "Product page copy for 24 items", type: "writing", status: "open", hours: 10, pay: 220, skills: ["Writing", "SEO", "Research"], badge: ["Writing"], start: -1, end: 33,
      desc: "Kensington Threads is moving its catalogue online and needs consistent, search-friendly descriptions for the first 24 products.",
      dels: ["Tone and style sheet", "24 product descriptions", "Title and meta description for each item"], ms: ["Style sheet and 4 samples", "All 24 descriptions"] },
    // ---- In progress (3) ----
    { id: "prj_07", biz: "biz_peelhub", title: "Newsletter email template", type: "web", status: "in_progress", hours: 12, pay: 0, skills: ["HTML", "CSS", "Figma"], badge: ["HTML", "CSS"], student: "stu_aisha", start: -14, end: 30, done: 1,
      desc: "Peel Youth Hub sends a monthly newsletter from a plain email. They need a branded, mobile-friendly HTML template their staff can reuse.",
      dels: ["Email layout in Figma", "Responsive HTML email template", "Short guide for swapping content"], ms: ["Layout in Figma", "Coded HTML template", "Testing and handover"] },
    { id: "prj_08", biz: "biz_ledger", title: "Client intake form and tracker", type: "web", status: "in_progress", hours: 18, pay: 360, skills: ["HTML", "JavaScript", "CSS"], badge: ["JavaScript"], student: "stu_daniel", start: -16, end: 20, done: 0,
      desc: "Ledger & Co. wants new clients to fill in one online form instead of three emailed PDFs, with a simple tracker the bookkeepers can filter.",
      dels: ["Intake form with validation", "Tracker page with filters", "Setup notes for staff"], ms: ["Form prototype", "Tracker build", "Testing and handover"] },
    { id: "prj_09", biz: "biz_cedarvale", title: "Missed-appointment analysis", type: "data", status: "in_progress", hours: 16, pay: 320, skills: ["Excel", "SQL", "Data Visualization"], badge: ["Data Visualization"], student: "stu_marcus", start: -12, end: 24, done: 1,
      desc: "Cedarvale wants to understand why about one in eight appointments are missed, using twelve months of anonymized booking data.",
      dels: ["Cleaned booking dataset", "Three-chart summary of patterns", "One-page recommendations"], ms: ["Data cleaning", "Analysis and charts", "Recommendations"] },
    // ---- In review (1) ----
    { id: "prj_10", biz: "biz_spice", title: "Catering menu site refresh", type: "web", status: "in_review", hours: 20, pay: 400, skills: ["HTML", "CSS", "JavaScript", "Figma"], badge: ["HTML"], student: "stu_omar", start: -26, end: 6, done: 1,
      desc: "Spice Route's menu site is slow and hard to read on phones. Refresh the layout, speed it up, and add a package comparison table.",
      dels: ["Responsive menu pages", "Package comparison table", "Inquiry form that emails the team", "Short handover doc"], ms: ["Mockups", "Pages built", "Inquiry form and launch"] },
    // ---- Completed (20) ----
    { id: "prj_11", biz: "biz_sunrise", title: "Menu board redesign", type: "web", status: "completed", hours: 10, pay: 200, skills: ["HTML", "CSS", "Figma"], badge: ["HTML", "CSS"], student: "stu_aisha", start: -50, end: -10,
      desc: "Sunrise Bakery's in-store menu screen was hard to read from the counter. Redesign it as a clean digital menu board that staff can update.",
      dels: ["Menu board layout in Figma", "HTML and CSS menu page for the in-store screen", "Update guide for staff"], ms: ["Layout in Figma", "Built menu page", "Testing on the in-store screen"] },
    { id: "prj_12", biz: "biz_peelhub", title: "Event flyer", type: "design", status: "completed", hours: 8, pay: 0, skills: ["Figma", "Canva"], badge: ["Figma"], student: "stu_aisha", start: -75, end: -50,
      desc: "Design a flyer for Peel Youth Hub's autumn open house, printable and shareable on social media.",
      dels: ["Print-ready flyer", "Square version for Instagram"], ms: ["Draft", "Final files"] },
    { id: "prj_13", biz: "biz_bysl", title: "Team registration page", type: "web", status: "completed", hours: 16, pay: 0, skills: ["HTML", "CSS", "JavaScript"], badge: ["HTML", "CSS"], student: "stu_daniel", start: -80, end: -45,
      desc: "BYSL registered 18 teams by spreadsheet. Build a one-page registration form that parents can use from a phone.",
      dels: ["Registration form", "Confirmation page", "Coach-facing CSV export"], ms: ["Form design", "Working form", "Export and launch"] },
    { id: "prj_14", biz: "biz_northgate", title: "Service booking page", type: "web", status: "completed", hours: 18, pay: 360, skills: ["HTML", "CSS", "JavaScript"], badge: ["JavaScript"], student: "stu_daniel", start: -60, end: -28,
      desc: "Northgate takes tire-change bookings by phone. Build a simple booking page with time slots that emails the shop.",
      dels: ["Booking page with time slots", "Email notification to the shop", "Short staff guide"], ms: ["Prototype", "Working booking flow", "Testing and handover"] },
    { id: "prj_15", biz: "biz_sunrise", title: "Loyalty card design", type: "design", status: "completed", hours: 8, pay: 180, skills: ["Figma", "Branding"], badge: ["Branding"], student: "stu_priya", start: -45, end: -20,
      desc: "Design a stamp-based loyalty card that matches the bakery's packaging.",
      dels: ["Front and back card design", "Print-ready PDF"], ms: ["Concepts", "Final print files"] },
    { id: "prj_16", biz: "biz_lakeshore", title: "Class schedule branding", type: "design", status: "completed", hours: 12, pay: 240, skills: ["Figma", "Branding", "Illustration"], badge: ["Figma"], student: "stu_priya", start: -95, end: -62,
      desc: "Create a consistent look for the weekly class schedule across print, website, and social posts.",
      dels: ["Schedule layout system", "Social post template", "Printable studio poster"], ms: ["Concepts", "Layouts", "Final files"] },
    { id: "prj_17", biz: "biz_riverside", title: "Plot waitlist analysis", type: "data", status: "completed", hours: 14, pay: 0, skills: ["SQL", "Excel", "Data Visualization"], badge: ["SQL", "Data Visualization"], student: "stu_marcus", start: -105, end: -70,
      desc: "Riverside has 85 plots and a waitlist of 140. Analyze the waitlist to suggest a fairer allocation approach.",
      dels: ["Cleaned waitlist", "Charts of wait times by neighbourhood", "Two-page recommendation"], ms: ["Cleaning", "Analysis", "Recommendation"] },
    { id: "prj_18", biz: "biz_brightsmile", title: "No-show report", type: "data", status: "completed", hours: 12, pay: 240, skills: ["Excel", "Data Visualization"], badge: ["Excel"], student: "stu_marcus", start: -65, end: -35,
      desc: "Summarize eighteen months of missed appointments by weekday, hour and reminder type.",
      dels: ["Summary workbook", "Dashboard page", "Findings memo"], ms: ["Summary workbook", "Dashboard and memo"] },
    { id: "prj_19", biz: "biz_bloom", title: "Logo refresh", type: "design", status: "completed", hours: 12, pay: 260, skills: ["Illustration", "Branding", "Figma"], badge: ["Illustration", "Branding"], student: "stu_sofia", start: -110, end: -75,
      desc: "Refresh a twelve-year-old logo while keeping the hand-drawn feel regulars recognise.",
      dels: ["3 concepts", "Final logo in SVG, PNG", "Colour and usage sheet"], ms: ["Concepts", "Revisions", "Final files"] },
    { id: "prj_20", biz: "biz_kensington", title: "Seasonal lookbook layout", type: "design", status: "completed", hours: 15, pay: 300, skills: ["Layout Design", "Illustration"], badge: ["Layout Design"], student: "stu_sofia", start: -70, end: -38,
      desc: "Lay out a 16-page seasonal lookbook for print and email.",
      dels: ["16-page layout", "Print PDF", "Email-friendly export"], ms: ["Layout draft", "Final pages", "Print files"] },
    { id: "prj_21", biz: "biz_bysl", title: "Season launch social campaign", type: "marketing", status: "completed", hours: 12, pay: 0, skills: ["Social Media", "Canva", "Writing"], badge: ["Social Media", "Canva"], student: "stu_jordan", start: -120, end: -85,
      desc: "Plan and draft four weeks of posts to drive registration for the spring season.",
      dels: ["4-week calendar", "12 designed posts", "Posting guide for coaches"], ms: ["Calendar", "Posts", "Guide"] },
    { id: "prj_22", biz: "biz_lakeshore", title: "Newsletter setup", type: "marketing", status: "completed", hours: 10, pay: 200, skills: ["Email Marketing", "Writing", "Canva"], badge: ["Email Marketing"], student: "stu_jordan", start: -55, end: -25,
      desc: "Set up a monthly email newsletter and write the first two issues.",
      dels: ["Email account and template", "Two written issues", "Subscriber signup block"], ms: ["Setup", "Issues"] },
    { id: "prj_23", biz: "biz_ledger", title: "Pricing sheet and one-pager", type: "admin", status: "completed", hours: 10, pay: 200, skills: ["Excel", "Documentation"], badge: ["Documentation"], student: "stu_fatima", start: -100, end: -68,
      desc: "Turn the firm's pricing notes into a clear one-page client handout and an internal pricing sheet.",
      dels: ["Client one-pager", "Internal pricing workbook"], ms: ["Draft", "Final documents"] },
    { id: "prj_24", biz: "biz_spice", title: "Catering quote template", type: "admin", status: "completed", hours: 8, pay: 160, skills: ["Excel", "Documentation"], badge: ["Excel"], student: "stu_fatima", start: -48, end: -22,
      desc: "Build a quote template that totals menu items, staffing and delivery and prints cleanly.",
      dels: ["Quote workbook", "How-to page"], ms: ["Template", "Testing and guide"] },
    { id: "prj_25", biz: "biz_halton", title: "Donor form fix", type: "web", status: "completed", hours: 12, pay: 0, skills: ["JavaScript", "HTML"], badge: ["JavaScript"], student: "stu_liam", start: -90, end: -58,
      desc: "The donation form silently drops entries on some phones. Find and fix the bugs and add basic validation.",
      dels: ["Bug list with fixes", "Validated form", "Regression checklist"], ms: ["Diagnosis", "Fix and test"] },
    { id: "prj_26", biz: "biz_northgate", title: "Parts inventory script", type: "data", status: "completed", hours: 15, pay: 300, skills: ["Python", "Excel"], badge: ["Python"], student: "stu_liam", start: -72, end: -40,
      desc: "Replace a hand-maintained parts list with a script that merges supplier price files into one sheet.",
      dels: ["Merge script", "Combined parts sheet", "Run instructions"], ms: ["Script prototype", "Final script", "Handover"] },
    { id: "prj_27", biz: "biz_maplelane", title: "Grooming care blog posts", type: "writing", status: "completed", hours: 10, pay: 200, skills: ["Writing", "SEO"], badge: ["Writing"], student: "stu_hannah", start: -88, end: -52,
      desc: "Write four helpful blog posts about coat care and grooming schedules for the shop's website.",
      dels: ["4 blog posts", "Titles and meta descriptions"], ms: ["Outline and post 1", "Posts 2 to 4"] },
    { id: "prj_28", biz: "biz_cedarvale", title: "Patient FAQ copy", type: "writing", status: "completed", hours: 8, pay: 160, skills: ["Writing", "Research"], badge: ["Research"], student: "stu_hannah", start: -58, end: -30,
      desc: "Write plain-language answers to the 20 questions front-desk staff hear most.",
      dels: ["20 FAQ answers", "Printable one-page summary"], ms: ["Draft answers", "Final copy"] },
    { id: "prj_29", biz: "biz_ledger", title: "Expense categorization", type: "data", status: "completed", hours: 12, pay: 240, skills: ["Excel", "Data Cleaning"], badge: ["Data Cleaning"], student: "stu_arjun", start: -62, end: -33,
      desc: "Categorize a year of client expense exports into consistent buckets with a reusable lookup table.",
      dels: ["Categorized workbook", "Lookup table", "Notes on edge cases"], ms: ["Lookup table", "Categorized data"] },
    { id: "prj_30", biz: "biz_bysl", title: "Season budget tracker", type: "admin", status: "completed", hours: 10, pay: 0, skills: ["Excel", "Budgeting"], badge: ["Budgeting"], student: "stu_emily", start: -84, end: -48,
      desc: "Build a simple budget tracker for field rentals, equipment and referee fees.",
      dels: ["Budget workbook", "One-page how-to"], ms: ["Draft", "Final tracker"] },
  ];
  return defs.map(build);
}
