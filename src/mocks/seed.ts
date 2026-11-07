import type { Badge, Db } from "@/schemas";
import { bumpSkill } from "@/lib/trust";
import { seedApplications } from "./applications";
import { seedBusinesses } from "./businesses";
import { seedCertifications } from "./certifications";
import { seedChecks, seedSubmissions } from "./checks";
import { seedClaims } from "./claims";
import { seedNotifications } from "./notifications";
import { seedProjects } from "./projects";
import { seedReviews } from "./reviews";
import { seedStudents } from "./students";
import { seedThreads } from "./threads";

/**
 * MOCK: builds the full, internally consistent demo dataset. Dates are computed relative to
 * the moment this runs. Badges are derived from completed projects, and skill trust levels are
 * reconciled so that "Skill checked" always has a badge or quiz claim behind it.
 */
export function buildSeed(): Db {
  const businesses = seedBusinesses();
  const projects = seedProjects();
  let students = seedStudents();
  const certifications = seedCertifications();
  const certClaims = seedClaims();
  const checks = seedChecks();
  const submissions = seedSubmissions(projects, checks);
  const reviews = seedReviews(projects, businesses);
  const applications = seedApplications(students, projects, businesses);
  const threads = seedThreads(projects);
  const notifications = seedNotifications();

  const bizName = (id: string) => businesses.find((b) => b.id === id)!.name;
  const badges: Badge[] = [];
  for (const p of projects) {
    if (p.status !== "completed" || !p.studentId) continue;
    const sub = submissions.find((s) => s.projectId === p.id && s.status === "approved");
    for (const skill of p.badgeSkills) {
      badges.push({
        id: `bdg_${p.id.slice(4)}_${skill.toLowerCase().replace(/[^a-z]/g, "")}`, studentId: p.studentId, skill, projectId: p.id,
        issuedAt: p.milestones[p.milestones.length - 1].approvedAt ?? p.deadline,
        evidence: [{ label: `${p.title}, ${bizName(p.businessId)}`, projectId: p.id, ...(sub?.url ? { href: sub.url } : {}) }],
        ...(sub?.checkId ? { checkId: sub.checkId } : {}),
      });
    }
  }

  students = students.map((s) => {
    let skills = s.skills;
    // issuer-verified certifications raise matching self-reported skills
    for (const c of certClaims.filter((x) => x.studentId === s.id && x.tier === "issuer")) {
      const cert = certifications.find((x) => x.id === c.certId)!;
      for (const name of cert.skills) if (skills.some((k) => k.name === name && k.trust === "self")) skills = bumpSkill(skills, name, "issuer", [{ label: `${cert.name} Certificate` }]);
    }
    for (const b of badges.filter((x) => x.studentId === s.id)) skills = bumpSkill(skills, b.skill, "checked", b.evidence);
    const quizSkills = new Set(certClaims.filter((c) => c.studentId === s.id && c.tier === "checked").flatMap((c) => certifications.find((x) => x.id === c.certId)!.skills));
    // "checked" must be backed by a badge or a passed quiz; otherwise it is only self-reported
    skills = skills.map((k) => (k.trust === "checked" && !badges.some((b) => b.studentId === s.id && b.skill === k.name) && !quizSkills.has(k.name) ? { ...k, trust: "self" as const } : k));
    return { ...s, skills };
  });

  return { students, businesses, projects, applications, threads, reviews, notifications, certifications, certClaims, submissions, checks, badges };
}
