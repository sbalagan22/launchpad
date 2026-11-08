import { z } from "zod";
import { Application, type Db, type HiringEntry, type Thread } from "@/schemas";
import { ApplicationView } from "@/schemas/views";
import { newId } from "@/lib/ids";
import { proposalText as draftProposalText } from "@/mocks/world";
import { PIPELINE_EMPLOYERS } from "@/mocks/seed";
import { getDb } from "@/store";
import type { ApplicationsApi } from "./contract";
import { ServiceError, latency, parseInput, read, write } from "./core";
import { matchOf, me, requireStudent } from "./helpers";

function view(db: Db, a: Application) {
  const project = db.projects.find((p) => p.id === a.projectId)!;
  const student = db.students.find((s) => s.id === a.studentId)!;
  return { application: a, student, project, business: db.businesses.find((b) => b.id === project.businessId)!, match: matchOf(db, student, project) };
}
const runsPipeline = (db: Db, businessId: string) => (PIPELINE_EMPLOYERS as readonly string[]).includes(db.businesses.find((b) => b.id === businessId)?.employerType ?? "");

export const applications: ApplicationsApi = {
  async apply(projectId, payload) {
    const proposal = parseInput(z.string().trim().min(30, "Write at least a couple of sentences."), payload.proposal);
    return write(Application, (db) => {
      const s = requireStudent(db);
      const p = db.projects.find((x) => x.id === projectId);
      if (!p || p.status !== "open") throw new ServiceError("closed", "This project is no longer accepting applications.");
      if (db.applications.some((a) => a.projectId === projectId && a.studentId === s.id)) throw new ServiceError("duplicate", "You already applied to this project.");
      const now = new Date().toISOString();
      const app: Application = { id: newId("app"), projectId, studentId: s.id, proposal, status: "pending", createdAt: now };
      const entry: HiringEntry[] = runsPipeline(db, p.businessId) ? [{ id: `pl_${app.id}`, businessId: p.businessId, studentId: s.id, projectId, applicationId: app.id, stage: "applied", updatedAt: now }] : [];
      return {
        db: { ...db, applications: [...db.applications, app], pipeline: [...db.pipeline, ...entry], notifications: [{ id: newId("ntf"), userId: p.businessId, title: "New applicant", body: `${s.name} applied to ${p.title}.`, href: `/business/projects/${p.id}`, read: false, createdAt: now }, ...db.notifications] },
        result: app,
      };
    });
  },

  async listForStudent() {
    return read(z.array(ApplicationView), (db) => {
      const s = requireStudent(db);
      return db.applications.filter((a) => a.studentId === s.id).map((a) => view(db, a)).sort((a, b) => b.application.createdAt.localeCompare(a.application.createdAt));
    });
  },

  async listForProject(projectId) {
    return read(z.array(ApplicationView), (db) => db.applications.filter((a) => a.projectId === projectId).map((a) => view(db, a)).sort((a, b) => b.match.score - a.match.score));
  },

  async decide(applicationId, decision) {
    return write(Application, (db) => {
      const app = db.applications.find((a) => a.id === applicationId);
      if (!app) throw new ServiceError("not_found", "Application not found");
      const session = me();
      const project = db.projects.find((p) => p.id === app.projectId)!;
      if (session.role !== "business" || project.businessId !== session.userId) throw new ServiceError("forbidden", "Only the poster can decide on applications.");
      if (app.status !== "pending") throw new ServiceError("decided", "This application was already decided.");
      const now = new Date().toISOString();
      const student = db.students.find((s) => s.id === app.studentId)!;
      const biz = db.businesses.find((b) => b.id === project.businessId)!;
      if (decision === "rejected") {
        const next = { ...app, status: "rejected" as const };
        return {
          db: { ...db, applications: db.applications.map((a) => (a.id === app.id ? next : a)), pipeline: db.pipeline.filter((e) => e.applicationId !== app.id), notifications: [{ id: newId("ntf"), userId: student.id, title: "Application update", body: `${biz.name} chose another student for ${project.title}.`, href: "/projects", read: false, createdAt: now }, ...db.notifications] },
          result: next,
        };
      }
      if (project.status !== "open") throw new ServiceError("closed", "This project already has a student.");
      const accepted = { ...app, status: "accepted" as const };
      const thread: Thread = { id: newId("thr"), projectId: project.id, studentId: student.id, businessId: biz.id, unread: { student: 1, business: 0 }, messages: [{ id: newId("msg"), from: "business", attachments: [], at: now, text: `Hi ${student.name.split(" ")[0]}, welcome aboard. We are looking forward to working with you on ${project.title}.` }] };
      const others = db.applications.filter((a) => a.projectId === project.id && a.id !== app.id && a.status === "pending");
      return {
        db: {
          ...db,
          applications: db.applications.map((a) => (a.id === app.id ? accepted : others.some((o) => o.id === a.id) ? { ...a, status: "rejected" as const } : a)),
          projects: db.projects.map((p) => (p.id === project.id ? { ...p, status: "in_progress" as const, studentId: student.id, milestones: p.milestones.map((m, i) => (i === 0 ? { ...m, status: "in_progress" as const } : m)) } : p)),
          threads: [...db.threads, thread],
          pipeline: db.pipeline.filter((e) => !others.some((o) => o.id === e.applicationId)).map((e) => (e.applicationId === app.id ? { ...e, stage: "interviewing" as const, updatedAt: now } : e)),
          notifications: [
            { id: newId("ntf"), userId: student.id, title: "Proposal accepted", body: `${biz.name} accepted your proposal for ${project.title}. Your workspace is ready.`, href: `/workspace/${project.id}`, read: false, createdAt: now },
            ...others.map((o) => ({ id: newId("ntf"), userId: o.studentId, title: "Application update", body: `${biz.name} chose another student for ${project.title}.`, href: "/projects", read: false, createdAt: now })),
            ...db.notifications,
          ],
        },
        result: accepted,
      };
    });
  },

  async draftProposal(projectId) {
    await latency(400, 800);
    const db = getDb();
    const s = requireStudent(db);
    const p = db.projects.find((x) => x.id === projectId);
    if (!p) throw new ServiceError("not_found", "Project not found");
    // MOCK: templated from the real profile and project facts. Organizes what the student already knows. Never a deliverable.
    return { text: draftProposalText(s, p, db.businesses.find((b) => b.id === p.businessId)!), source: "mock" as const };
  },
};
