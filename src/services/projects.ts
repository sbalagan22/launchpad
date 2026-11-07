import { z } from "zod";
import { Application, Business, Notification, Project, PublishInput, Student } from "@/schemas";
import { ProjectView } from "@/schemas/views";
import { daysFromNow } from "@/lib/dates";
import { newId } from "@/lib/ids";
import { splitPay } from "@/lib/pay";
import { draftProposalText } from "@/mocks/proposal";
import { computeMatch } from "./matching";
import { ServiceError, parseInput, read, write } from "./core";
import type { Db } from "@/schemas";

function view(db: Db, p: Project, student: Student | null): z.infer<typeof ProjectView> {
  const apps = db.applications.filter((a) => a.projectId === p.id);
  return {
    project: p,
    business: db.businesses.find((b) => b.id === p.businessId)!,
    applicantCount: apps.length,
    match: student ? computeMatch(student, p) : null,
    myApplication: student ? apps.find((a) => a.studentId === student.id) ?? null : null,
    isNew: Date.now() - new Date(p.createdAt).getTime() < 24 * 3_600_000,
  };
}

const FeedQuery = z.object({ studentId: z.string(), filter: z.enum(["all", "paid", "volunteer"]).default("all"), q: z.string().default("") });

/** Open projects ranked for one student: anything posted in the last 24 hours first, then by match %. */
export async function listFeed(query: z.input<typeof FeedQuery>) {
  const { studentId, filter, q } = parseInput(FeedQuery, query);
  return read(z.array(ProjectView), (db) => {
    const student = db.students.find((s) => s.id === studentId) ?? null;
    const needle = q.trim().toLowerCase();
    return db.projects
      .filter((p) => p.status === "open")
      .filter((p) => filter === "all" || (filter === "paid" ? p.payType === "stipend" : p.payType === "volunteer"))
      .map((p) => view(db, p, student))
      .filter((v) => !needle || [v.project.title, v.business.name, v.project.skills.join(" ")].join(" ").toLowerCase().includes(needle))
      .sort((a, b) => Number(b.isNew) - Number(a.isNew) || (b.match?.percent ?? 0) - (a.match?.percent ?? 0) || b.project.createdAt.localeCompare(a.project.createdAt));
  });
}

export async function getProjectView(id: string, studentId?: string) {
  return read(ProjectView, (db) => {
    const p = db.projects.find((x) => x.id === id);
    if (!p) throw new ServiceError("not_found", "That project no longer exists.");
    return view(db, p, db.students.find((s) => s.id === studentId) ?? null);
  });
}

export async function listBusinessProjects(businessId: string) {
  return read(z.array(ProjectView), (db) =>
    db.projects.filter((p) => p.businessId === businessId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((p) => view(db, p, null)),
  );
}

export async function listStudentProjects(studentId: string) {
  return read(z.array(ProjectView), (db) => {
    const s = db.students.find((x) => x.id === studentId) ?? null;
    return db.projects.filter((p) => p.studentId === studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((p) => view(db, p, s));
  });
}

export async function publishProject(input: z.input<typeof PublishInput>) {
  const v = parseInput(PublishInput, input);
  return write(Project, (db) => {
    const biz = db.businesses.find((b) => b.id === v.businessId);
    if (!biz) throw new ServiceError("not_found", "Business not found");
    if (v.payType === "volunteer" && biz.kind !== "nonprofit") throw new ServiceError("invalid_input", "Only nonprofits can post volunteer projects.");
    if (v.payType === "stipend" && v.pay <= 0) throw new ServiceError("invalid_input", "Enter a stipend amount.");
    const id = newId("prj");
    const n = v.milestones.length;
    const total = v.payType === "volunteer" ? 0 : v.pay;
    const amounts = splitPay(total, n);
    const lastDue = Math.max(...v.milestones.map((m) => m.dueInDays));
    const project: Project = {
      id, businessId: v.businessId, title: v.title, type: v.type, status: "open", description: v.description, deliverables: v.deliverables,
      milestones: v.milestones.map((m, i) => ({ id: `${id}_m${i + 1}`, title: m.title, dueAt: daysFromNow(m.dueInDays), amount: amounts[i], status: "open" as const })),
      skills: v.skills, hours: v.hours, payType: v.payType, pay: total, deadline: daysFromNow(lastDue), createdAt: new Date().toISOString(),
      studentId: null, badgeSkills: v.badgeSkills, beginnerFriendly: v.beginnerFriendly, aiScoped: true, loggedHours: 0,
    };

    // MOCK: Launchpad "notifies matching students" and two other students apply a few minutes later.
    const ranked = db.students
      .map((s) => ({ s, m: computeMatch(s, project) }))
      .filter((x) => x.m.availability !== "mismatch" && x.m.percent >= 50)
      .sort((a, b) => b.m.percent - a.m.percent);
    const notifications: Notification[] = ranked.slice(0, 4).map(({ s, m }) => ({
      id: newId("ntf"), userId: s.id, title: "New project matches your profile", body: `${v.title} at ${biz.name}, ${m.percent}% match.`,
      href: `/projects/${id}`, read: false, createdAt: new Date().toISOString(),
    }));
    const simulated: Application[] = ranked.filter((x) => x.s.id !== "stu_aisha").slice(0, 2).map(({ s }, i) => ({
      id: newId("app"), projectId: id, studentId: s.id, status: "pending" as const, proposal: draftProposalText(s, project, biz), createdAt: new Date(Date.now() - (i + 1) * 18 * 60_000).toISOString(),
    }));
    if (simulated.length) notifications.push({ id: newId("ntf"), userId: biz.id, title: "New applicants", body: `${simulated.length} students applied to ${v.title}.`, href: `/business/projects/${id}`, read: false, createdAt: new Date().toISOString() });
    return {
      db: { ...db, projects: [project, ...db.projects], applications: [...db.applications, ...simulated], notifications: [...notifications, ...db.notifications] },
      result: project,
    };
  });
}

export type { Business };
