import { z } from "zod";
import { Application, Id, Thread } from "@/schemas";
import { ApplicationView } from "@/schemas/views";
import { newId } from "@/lib/ids";
import { computeMatch } from "./matching";
import { ServiceError, parseInput, read, write } from "./core";
import type { Db } from "@/schemas";

const ApplyInput = z.object({ projectId: Id, studentId: Id, proposal: z.string().trim().min(30, "Write at least a couple of sentences.") });

export async function apply(input: z.input<typeof ApplyInput>) {
  const v = parseInput(ApplyInput, input);
  return write(Application, (db) => {
    const p = db.projects.find((x) => x.id === v.projectId);
    if (!p || p.status !== "open") throw new ServiceError("closed", "This project is no longer accepting applications.");
    if (db.applications.some((a) => a.projectId === v.projectId && a.studentId === v.studentId)) throw new ServiceError("duplicate", "You already applied to this project.");
    const s = db.students.find((x) => x.id === v.studentId);
    if (!s) throw new ServiceError("not_found", "Student not found");
    const app: Application = { id: newId("app"), projectId: v.projectId, studentId: v.studentId, proposal: v.proposal, status: "pending", createdAt: new Date().toISOString() };
    return {
      db: {
        ...db, applications: [...db.applications, app],
        notifications: [{ id: newId("ntf"), userId: p.businessId, title: "New applicant", body: `${s.name} applied to ${p.title}.`, href: `/business/projects/${p.id}`, read: false, createdAt: new Date().toISOString() }, ...db.notifications],
      },
      result: app,
    };
  });
}

function toView(db: Db, a: Application) {
  const project = db.projects.find((p) => p.id === a.projectId)!;
  const student = db.students.find((s) => s.id === a.studentId)!;
  return { application: a, student, project, business: db.businesses.find((b) => b.id === project.businessId)!, match: computeMatch(student, project) };
}

export async function listForProject(projectId: string) {
  return read(z.array(ApplicationView), (db) =>
    db.applications.filter((a) => a.projectId === projectId).map((a) => toView(db, a)).sort((a, b) => b.match.percent - a.match.percent),
  );
}

export async function listForStudent(studentId: string) {
  return read(z.array(ApplicationView), (db) => db.applications.filter((a) => a.studentId === studentId).map((a) => toView(db, a)).sort((a, b) => b.application.createdAt.localeCompare(a.application.createdAt)));
}

/** Business accepts or rejects. Accepting starts the project, opens a chat thread and closes other applications. */
export async function decide(applicationId: string, decision: "accepted" | "rejected") {
  return write(Application, (db) => {
    const app = db.applications.find((a) => a.id === applicationId);
    if (!app) throw new ServiceError("not_found", "Application not found");
    const project = db.projects.find((p) => p.id === app.projectId)!;
    if (app.status !== "pending") throw new ServiceError("decided", "This application was already decided.");
    const now = new Date().toISOString();
    const student = db.students.find((s) => s.id === app.studentId)!;
    const biz = db.businesses.find((b) => b.id === project.businessId)!;
    if (decision === "rejected") {
      const next = { ...app, status: "rejected" as const };
      return {
        db: {
          ...db, applications: db.applications.map((a) => (a.id === app.id ? next : a)),
          notifications: [{ id: newId("ntf"), userId: student.id, title: "Application update", body: `${biz.name} chose another student for ${project.title}.`, href: "/projects", read: false, createdAt: now }, ...db.notifications],
        },
        result: next,
      };
    }
    if (project.status !== "open") throw new ServiceError("closed", "This project already has a student.");
    const accepted = { ...app, status: "accepted" as const };
    const thread: Thread = {
      id: newId("thr"), projectId: project.id, studentId: student.id, businessId: biz.id,
      messages: [{ id: newId("msg"), from: "business", at: now, text: `Hi ${student.name.split(" ")[0]}, welcome aboard. We're looking forward to working with you on ${project.title}.` }],
    };
    const others = db.applications.filter((a) => a.projectId === project.id && a.id !== app.id && a.status === "pending");
    return {
      db: {
        ...db,
        applications: db.applications.map((a) => (a.id === app.id ? accepted : others.some((o) => o.id === a.id) ? { ...a, status: "rejected" as const } : a)),
        projects: db.projects.map((p) => (p.id === project.id ? { ...p, status: "in_progress" as const, studentId: student.id, milestones: p.milestones.map((m, i) => (i === 0 ? { ...m, status: "in_progress" as const } : m)) } : p)),
        threads: [...db.threads, thread],
        notifications: [
          { id: newId("ntf"), userId: student.id, title: "Proposal accepted", body: `${biz.name} accepted your proposal for ${project.title}. Your workspace is ready.`, href: `/workspace/${project.id}`, read: false, createdAt: now },
          ...others.map((o) => ({ id: newId("ntf"), userId: o.studentId, title: "Application update", body: `${biz.name} chose another student for ${project.title}.`, href: "/projects", read: false, createdAt: now })),
          ...db.notifications,
        ],
      },
      result: accepted,
    };
  });
}
