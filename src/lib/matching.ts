import type { CatalogEntry, CertClaim, Project, Review, Student } from "@/schemas";
import type { Match } from "@/schemas/views";
import { weeksUntil } from "./dates";

/** Student skills that earn partial or full credit for a required skill the student does not list exactly. */
const RELATED: Record<string, string[]> = {
  "Responsive Layout": ["HTML", "CSS", "Figma"],
  "Forms and Validation": ["JavaScript", "HTML", "React"],
  Deployment: ["Git", "Node.js"],
  "Web Development": ["HTML", "CSS", "JavaScript"],
  "Web Design": ["Figma", "HTML", "CSS", "Layout Design"],
  APIs: ["JavaScript", "Node.js", "Python", "React"],
  Maps: ["JavaScript", "React"],
  "State Management": ["React", "JavaScript"],
  Shipping: ["Git", "Node.js"],
  React: ["JavaScript"],
  Calendars: ["JavaScript"],
  Accessibility: ["HTML", "Writing"],
  Auditing: ["Accessibility", "Research", "Documentation"],
  "User Testing": ["Research", "Writing"],
  "QA Methodology": ["Testing"],
  "Bug Reporting": ["Testing", "Writing"],
  "Regression Testing": ["Testing"],
  "Full-stack Basics": ["JavaScript", "Node.js", "React", "SQL"],
  "Database Design": ["SQL", "Node.js"],
  Authentication: ["Node.js", "JavaScript"],
  "Data Privacy": ["Research", "Documentation"],
  "Data Modelling": ["SQL", "Python"],
  Charts: ["Data Visualization", "JavaScript"],
  "Product Analytics": ["SQL", "Data Visualization", "Excel"],
  "Experiment Design": ["Research", "Statistics"],
  "Data Cleaning": ["Excel", "Python", "SQL"],
  "Data Visualization": ["Excel", "Python", "Figma"],
  SQL: ["Excel", "Python"],
  Python: ["JavaScript"],
  Automation: ["Python", "JavaScript"],
  "Scheduling APIs": ["APIs", "JavaScript", "Python"],
  "Scientific Communication": ["Writing", "Research"],
  Copywriting: ["Writing", "Editing"],
  "Email Marketing": ["Writing", "Social Media"],
  "Social Media": ["Canva", "Writing"],
  "Audience Research": ["Research"],
  "Presentation Design": ["Figma", "Canva"],
  "Video Editing": ["Storytelling"],
  "Brand Consistency": ["Branding", "Layout Design"],
  "Visual Hierarchy": ["Layout Design", "Figma", "Branding"],
  "Layout Design": ["Figma", "Canva"],
  Branding: ["Illustration", "Layout Design", "Canva"],
  Research: ["Writing", "Documentation"],
  Editing: ["Writing"],
  Documentation: ["Writing"],
  "Process Mapping": ["Documentation", "Excel"],
  Budgeting: ["Excel"],
  "Market Research": ["Research", "Excel"],
  Analytics: ["SQL", "JavaScript", "Excel"],
  "Customer Interviews": ["Interviewing", "Market Research", "Research"],
  "Qualitative Research": ["Interviewing", "Research", "Writing"],
  Interviewing: ["Customer Interviews", "Research"],
  Mapbox: ["JavaScript", "React"],
  GTFS: ["Python", "SQL"],
  Testing: ["JavaScript", "Python"],
  Pricing: ["Excel", "Market Research"],
  "Financial Modelling": ["Excel"],
  Statistics: ["Python", "Excel"],
  "Data Analysis": ["Python", "Excel", "SQL", "Statistics"],
  "Survey Design": ["Research Methods", "Research"],
  "Research Methods": ["Research", "Statistics"],
  "Print Layout": ["Layout Design", "Canva"],
  "Motion Design": ["Illustration", "Figma"],
  "Node.js": ["JavaScript"],
  IndexedDB: ["JavaScript"],
  Translation: ["French", "Writing"],
  "Public Speaking": ["Presentation Design"],
};
/** Soft skills everyone can bring: partial credit so a first-timer is not locked out. */
const SOFT = new Set(["Client Communication", "Presenting", "Communicating Findings", "Storytelling", "Outreach", "Technical Writing", "Product Scoping"]);

const SELF_CREDIT = 0.9;
export const CERT_BOOST_MAX = 6;
const BOOST = { issuer: 3, self: 1.5 } as const;

/**
 * Match score from real logic, no randomness. Up to 55 points for skills overlap (exact = full credit, related = 0.85 or 1,
 * soft = 0.6), 15 for program fit (the project's target faculties), 15 for availability (hours per week and pay preference),
 * 10 for past review quality (poster ratings), plus a small boost for earned certifications the project lists in
 * `strengthenedBy` (issuer verified counts more than self-reported). Returns 4 to 5 short reasons.
 */
export function computeMatch(student: Student, project: Project, claims: CertClaim[], catalog: CatalogEntry[], reviews: Review[] = []): Match {
  const byName = new Map(student.skills.map((s) => [s.name.toLowerCase(), s]));
  const matching: string[] = [];
  const related: string[] = [];
  const missing: string[] = [];
  let credit = 0;
  const required = [...project.skills, ...project.tools.filter((t) => byName.has(t.toLowerCase()))];
  for (const req of required) {
    const exact = byName.get(req.toLowerCase());
    if (exact) {
      matching.push(req);
      credit += exact.trust === "reviewed" ? 1 : SELF_CREDIT;
      continue;
    }
    const near = (RELATED[req] ?? []).filter((r) => byName.has(r.toLowerCase())).length;
    if (near >= 1) {
      related.push(req);
      credit += near >= 2 ? 1 : 0.85;
    } else if (SOFT.has(req)) {
      related.push(req);
      credit += 0.6;
    } else missing.push(req);
  }
  const skillScore = required.length ? Math.min(1, credit / Math.max(1, project.skills.length)) : 0;

  const needed = project.hours / weeksUntil(project.deadline);
  let status: "good" | "tight" | "mismatch" = "good";
  let avail = 1;
  if (student.hoursPerWeek < needed) {
    status = student.hoursPerWeek >= needed * 0.6 ? "tight" : "mismatch";
    avail = status === "tight" ? 0.6 : 0.2;
  }
  const volunteerOnly = project.payType === "volunteer" && project.sponsorStipend === 0;
  if ((volunteerOnly && student.pref === "paid") || (project.payType === "stipend" && student.pref === "volunteer")) {
    status = "mismatch";
    avail *= 0.5;
  }

  const programFit = project.faculties.length === 0 || project.faculties.includes(student.faculty) ? 1 : 0.4;
  const mine = reviews.filter((r) => r.studentId === student.id);
  const avgRating = mine.length ? mine.reduce((a, r) => a + r.rating, 0) / mine.length : null;
  const reviewFit = avgRating === null ? 0.6 : Math.max(0.4, Math.min(1, (avgRating - 2) / 3));

  const items: Match["certBoost"]["items"] = [];
  for (const id of project.strengthenedBy) {
    const claim = claims.find((c) => c.studentId === student.id && c.certId === id && c.status === "earned");
    if (!claim) continue;
    const entry = catalog.find((c) => c.id === id);
    items.push({ certId: id, name: entry?.name ?? id, tier: claim.tier, points: BOOST[claim.tier] });
  }
  const points = Math.min(CERT_BOOST_MAX, items.reduce((a, i) => a + i.points, 0));

  const score = Math.max(5, Math.min(99, Math.round(55 * skillScore + 15 * programFit + 15 * avail + 10 * reviewFit + points)));

  const reasons: Match["reasons"] = [];
  const total = project.skills.length;
  reasons.push({ key: "skills", tone: matching.length >= Math.ceil(total / 2) ? "good" : matching.length + related.length > 0 ? "ok" : "low", text: matching.length ? `${matching.length} of ${total} skills match${matching.length ? `: ${matching.slice(0, 3).join(", ")}` : ""}` : related.length ? `Related skills: ${related.slice(0, 3).join(", ")}` : "Few listed skills overlap yet" });
  reasons.push({ key: "program", tone: programFit === 1 ? "good" : "ok", text: programFit === 1 ? `Fits ${student.faculty} students` : `Aimed at other faculties` });
  reasons.push({ key: "availability", tone: status === "good" ? "good" : status === "tight" ? "ok" : "low", text: status === "good" ? `${student.hoursPerWeek} h/week covers the pace` : status === "tight" ? "Pace is tight for your hours" : "Hours or pay preference do not line up" });
  reasons.push({ key: "reviews", tone: avgRating === null ? "ok" : avgRating >= 4.5 ? "good" : "ok", text: avgRating === null ? "No past reviews yet" : `Past reviews average ${avgRating.toFixed(1)}` });
  if (items.length) reasons.push({ key: "cert", tone: "good", text: `${items[0].tier === "issuer" ? "Issuer verified" : "Self-reported"} ${items[0].name.split(" (")[0]}` });
  return { score, reasons, certBoost: { points, items }, skills: { matching, related, missing } };
}
