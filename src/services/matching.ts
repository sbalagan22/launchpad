import type { Project, Student } from "@/schemas";
import type { Match } from "@/schemas/views";
import { weeksUntil } from "@/lib/dates";

/** Skills that earn partial credit when the exact skill is not on the student's profile. */
const RELATED: Record<string, string[]> = {
  Figma: ["UX Design", "Layout Design"],
  "UX Design": ["Figma"],
  Branding: ["Illustration", "Layout Design", "Canva"],
  Illustration: ["Branding", "Layout Design"],
  Canva: ["Branding", "Layout Design"],
  SQL: ["Excel", "Python"],
  Excel: ["SQL", "Data Cleaning"],
  "Data Cleaning": ["Excel", "Python"],
  "Data Visualization": ["Power BI", "Excel"],
  "Web Development": ["HTML", "CSS", "JavaScript"],
  JavaScript: ["Python", "Web Development"],
  Writing: ["Editing", "Documentation"],
  SEO: ["Writing", "Research"],
  "Social Media": ["Canva", "Writing", "Email Marketing"],
  Research: ["Writing", "Documentation"],
  Documentation: ["Writing"],
  Budgeting: ["Excel", "Bookkeeping"],
};

const TRUST_WEIGHT = { issuer: 1, checked: 1, self: 0.85 } as const;

/**
 * Real match logic over the mock data (not random): 75% skills overlap weighted by how each
 * skill was verified, 25% availability (weekly hours needed vs offered, plus pay preference).
 */
export function computeMatch(student: Student, project: Project): Match {
  const byName = new Map(student.skills.map((s) => [s.name.toLowerCase(), s]));
  const matching: string[] = [];
  const related: string[] = [];
  const missing: string[] = [];
  let credit = 0;
  for (const req of project.skills) {
    const exact = byName.get(req.toLowerCase());
    if (exact) {
      matching.push(req);
      credit += TRUST_WEIGHT[exact.trust];
      continue;
    }
    const near = (RELATED[req] ?? []).some((r) => byName.has(r.toLowerCase()));
    if (near) {
      related.push(req);
      credit += 0.4;
    } else missing.push(req);
  }
  const skillScore = project.skills.length ? credit / project.skills.length : 0;

  const neededPerWeek = project.hours / weeksUntil(project.deadline);
  let availability: Match["availability"] = "good";
  let availScore = 1;
  if (student.hoursPerWeek < neededPerWeek) {
    availability = student.hoursPerWeek >= neededPerWeek * 0.6 ? "tight" : "mismatch";
    availScore = availability === "tight" ? 0.6 : 0.2;
  }
  const volunteer = project.payType === "volunteer";
  if ((volunteer && student.pref === "paid") || (!volunteer && student.pref === "volunteer")) {
    availability = "mismatch";
    availScore *= 0.5;
  }

  const percent = Math.max(5, Math.min(99, Math.round(100 * (0.75 * skillScore + 0.25 * availScore))));
  return { percent, matching, related, missing, availability };
}
