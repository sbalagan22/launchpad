import type { Badge, Db, HiringEntry } from "@/schemas";
import { bumpSkill } from "@/lib/trust";
import { daysFromNow } from "@/lib/dates";
import { seedCatalog } from "./catalog";
import { seedBusinesses, seedStudents, seedVentures } from "./people";
import { seedProjects } from "./projects";
import { seedApplications, seedClaims, seedNotifications, seedReviews, seedThreads, seedWork } from "./world";

/** Employer types that run a hiring pipeline. */
export const PIPELINE_EMPLOYERS = ["yspace_startup", "founder"] as const;

/**
 * MOCK: builds the full, internally consistent demo dataset from demo_personas.md and the spec files.
 * Dates are relative to the moment this runs. Badges come from completed projects, and a skill is
 * "Approved by poster" only when a poster-approved project backs it. "Instrument the Waitlist" and
 * "Fill the Tuesday Night Gap" are NOT seeded: the demo creates them live from scripted briefs.
 */
export function buildSeed(): Db {
  const businesses = seedBusinesses();
  const ventures = seedVentures();
  const catalog = seedCatalog();
  const certClaims = seedClaims();
  const students0 = seedStudents();
  const projects = seedProjects();
  const { checks, submissions, approvals } = seedWork(projects);
  const applications = seedApplications(students0, projects, businesses, catalog, certClaims);
  const reviews = seedReviews(projects);
  const threads = seedThreads(projects, students0);
  const notifications = seedNotifications();

  const bizName = (id: string) => businesses.find((b) => b.id === id)!.name;
  const badges: Badge[] = [];
  for (const p of projects) {
    if (p.status !== "completed" || !p.studentId) continue;
    const sub = submissions.filter((s) => s.projectId === p.id && s.status === "approved").pop();
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

  // Hiring pipeline for ventures and founder-run studios.
  const pipeline: HiringEntry[] = [];
  const INVITES: Record<string, { role: string; message: string; ago: number }> = {
    prj_landingcopy: { role: "Part-time content lead, 4 months", message: "Your headline test doubled our signups. We would like you to keep going: about 8 hours a week, paid, remote with a monthly day in Markham.", ago: 3 },
    prj_embedhw: { role: "Part-time data engineer", message: "The battery health score is now in our customer demo. We would like you to keep building the data side with us.", ago: 6 },
    prj_brightprice: { role: "Pricing and operations analyst", message: "Families asked for your subsidy scenario by name. We would like you to help run the first pilot.", ago: 5 },
    prj_gamejam: { role: "Accessibility and QA contractor", message: "Players with colour blindness finished level four for the first time. We would like to keep you on through launch.", ago: 2 },
  };
  const pipelineBiz = new Set(businesses.filter((b) => (PIPELINE_EMPLOYERS as readonly string[]).includes(b.employerType)).map((b) => b.id));
  const demoDayApps = applications.filter((a) => a.projectId === "prj_demoday" && a.status === "pending");
  for (const a of applications) {
    const p = projects.find((x) => x.id === a.projectId)!;
    if (!pipelineBiz.has(p.businessId) || a.status === "rejected") continue;
    let stage: HiringEntry["stage"] = a.status === "pending" ? "applied" : p.status === "completed" ? (INVITES[p.id] ? "offer" : "trial") : "trial";
    if (a.projectId === "prj_demoday" && demoDayApps.indexOf(a) >= 3) stage = "interviewing";
    if (a.studentId === "stu_aisha" && p.id === "prj_reroute_mvp") stage = "interviewing";
    if (a.studentId === "stu_priya" && p.id === "prj_reroute_disc") stage = "interviewing";
    const entry: HiringEntry = { id: `pl_${a.id}`, businessId: p.businessId, studentId: a.studentId, projectId: p.id, applicationId: a.id, stage, updatedAt: a.createdAt };
    const inv = INVITES[p.id];
    if (inv && p.status === "completed") entry.invite = { sentAt: daysFromNow(-inv.ago), role: inv.role, message: inv.message, status: "pending" };
    pipeline.push(entry);
  }

  const saved = [
    ...["prj_game", "prj_csv", "prj_demoday", "prj_fernwood", "prj_shiny"].map((projectId) => ({ studentId: "stu_aisha", projectId })),
    ...["prj_northbeam", "prj_ledgerint", "prj_demoday", "prj_wellness"].map((projectId) => ({ studentId: "stu_priya", projectId })),
  ];

  return { students, businesses, ventures, projects, applications, threads, reviews, notifications, catalog, certClaims, submissions, approvals, checks, badges, pipeline, saved };
}
