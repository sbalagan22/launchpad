import type { Badge, Db, HiringEntry } from "@/schemas";
import { bumpSkill } from "@/lib/trust";
import { daysFromNow } from "@/lib/dates";
import { seedApplications } from "./applications";
import { seedBusinesses, seedReviewers, seedVentures } from "./businesses";
import { seedCatalog } from "./catalog";
import { seedChecks, seedEvaluations, seedSubmissions } from "./checks";
import { seedClaims } from "./claims";
import { seedNotifications } from "./notifications";
import { seedProjects } from "./projects";
import { seedReviews } from "./reviews";
import { seedStudents } from "./students";
import { seedThreads } from "./threads";

/** Employer types that run a hiring pipeline. */
export const PIPELINE_EMPLOYERS = ["yspace_startup", "founder", "local_business"] as const;

/**
 * MOCK: builds the full, internally consistent demo dataset. Dates are computed relative to the moment this
 * runs. Badges are derived from completed projects, and a skill is "reviewed" only when a reviewer-approved
 * project backs it. The two demo listings (Tuesday Night Gap, Instrument the Waitlist) are created live.
 */
export function buildSeed(): Db {
  const businesses = seedBusinesses();
  const reviewers = seedReviewers();
  const ventures = seedVentures();
  const projects = seedProjects();
  const catalog = seedCatalog();
  const certClaims = seedClaims();
  const checks = seedChecks();
  const submissions = seedSubmissions(projects, checks);
  const evaluations = seedEvaluations(projects, submissions);
  const reviews = seedReviews(projects);
  const students0 = seedStudents();
  const applications = seedApplications(students0, projects, businesses);
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
  const students = students0.map((s) => {
    let skills = s.skills;
    for (const b of badges.filter((x) => x.studentId === s.id)) skills = bumpSkill(skills, b.skill, "reviewed", b.evidence);
    return { ...s, skills };
  });

  // Hiring pipeline for employers that run one: derived from applications, plus one finished project with an invite.
  const pipeline: HiringEntry[] = [];
  for (const a of applications) {
    const p = projects.find((x) => x.id === a.projectId)!;
    const biz = businesses.find((b) => b.id === p.businessId)!;
    if (!(PIPELINE_EMPLOYERS as readonly string[]).includes(biz.employerType) || a.status === "rejected") continue;
    const stage: HiringEntry["stage"] = a.status === "pending" ? "applied" : p.status === "completed" ? "trial" : "interviewing";
    const entry: HiringEntry = { id: `pl_${a.id}`, businessId: p.businessId, studentId: a.studentId, projectId: p.id, applicationId: a.id, stage, updatedAt: a.createdAt };
    if (p.id === "prj_c03") {
      entry.stage = "offer";
      entry.invite = { sentAt: daysFromNow(-60), role: "Part-time front-end developer", message: "Your stop search prototype is in our investor demo. We would like you to keep building with us, about 8 hours a week, paid." };
    }
    pipeline.push(entry);
  }

  const saved = [{ studentId: "stu_aisha", projectId: "prj_board" }, { studentId: "stu_aisha", projectId: "prj_reroute_mvp" }, { studentId: "stu_aisha", projectId: "prj_lab" }];

  return { students, businesses, reviewers, ventures, projects, applications, threads, reviews, notifications, catalog, certClaims, submissions, evaluations, checks, badges, pipeline, saved };
}
