import type { CatalogEntry, CertClaim, Project, Student } from "@/schemas";
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
};
/** Soft skills everyone can bring: partial credit so a first-timer is not locked out. */
const SOFT = new Set(["Client Communication", "Presenting", "Communicating Findings", "Storytelling", "Outreach", "Technical Writing", "Product Scoping"]);

const SELF_CREDIT = 0.9;
export const CERT_BOOST_MAX = 6;
const BOOST = { issuer: 3, self: 1.5 } as const;

/**
 * Match score from real logic, no randomness: up to 75 points for skills (exact skill = full credit, one or two related
 * skills = 0.85 or 1.0, soft skills = 0.6), up to 25 for availability (hours per week and pay preference), plus a small
 * visible boost for earned certifications the project lists in `strengthenedBy` (issuer verified counts more than self-reported).
 */
export function computeMatch(student: Student, project: Project, claims: CertClaim[], catalog: CatalogEntry[]): Match {
  const byName = new Map(student.skills.map((s) => [s.name.toLowerCase(), s]));
  const matching: string[] = [];
  const related: string[] = [];
  const missing: string[] = [];
  let credit = 0;
  for (const req of project.skills) {
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
  const skillScore = project.skills.length ? credit / project.skills.length : 0;

  const needed = project.hours / weeksUntil(project.deadline);
  let status: Match["breakdown"]["availability"]["status"] = "good";
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

  const items: Match["breakdown"]["certBoost"]["items"] = [];
  for (const id of project.strengthenedBy) {
    const claim = claims.find((c) => c.studentId === student.id && c.certId === id && c.status === "earned");
    if (!claim) continue;
    const entry = catalog.find((c) => c.id === id);
    items.push({ certId: id, name: entry?.name ?? id, tier: claim.tier, points: BOOST[claim.tier] });
  }
  const points = Math.min(CERT_BOOST_MAX, items.reduce((a, i) => a + i.points, 0));

  const skillPts = 75 * skillScore;
  const availPts = 25 * avail;
  const score = Math.max(5, Math.min(99, Math.round(skillPts + availPts + points)));
  return {
    score,
    breakdown: {
      skills: { score: Math.round(skillPts), max: 75, matching, related, missing },
      availability: { score: Math.round(availPts), max: 25, status },
      certBoost: { points, max: CERT_BOOST_MAX, items },
    },
  };
}
