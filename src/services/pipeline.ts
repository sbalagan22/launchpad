import { z } from "zod";
import { HiringEntry, PipelineStage, type Db } from "@/schemas";
import { InviteView, PipelineCard, PipelineView } from "@/schemas/views";
import { newId } from "@/lib/ids";
import { computeMatch } from "@/lib/matching";
import type { PipelineApi } from "./contract";
import { ServiceError, parseInput, read, write } from "./core";
import { me, requireStudent } from "./helpers";

const STAGES = PipelineStage.options;

/** Moving a candidate to "offer" requires a finished, approved project with this poster. */
export function canMoveTo(db: Db, entry: HiringEntry, stage: HiringEntry["stage"]): { ok: boolean; reason?: string } {
  if (stage === "offer") {
    const done = db.projects.some((p) => p.businessId === entry.businessId && p.studentId === entry.studentId && p.status === "completed");
    if (!done) return { ok: false, reason: "A candidate can reach Offer only after a project with you has been finally approved." };
  }
  return { ok: true };
}

function cardOf(db: Db, e: HiringEntry) {
  const project = db.projects.find((p) => p.id === e.projectId)!;
  const student = db.students.find((s) => s.id === e.studentId)!;
  return {
    entry: e, student, project, application: db.applications.find((a) => a.id === e.applicationId) ?? null,
    match: computeMatch(student, project, db.certClaims.filter((c) => c.studentId === student.id), db.catalog),
    canInvite: project.status === "completed" && !e.invite,
  };
}
const inviteView = (db: Db, e: HiringEntry) => ({ entry: e, business: db.businesses.find((b) => b.id === e.businessId)!, venture: db.ventures.find((v) => v.businessId === e.businessId) ?? null, project: db.projects.find((p) => p.id === e.projectId)! });

export const pipeline: PipelineApi = {
  async getPipeline(ventureOrBusinessId) {
    return read(PipelineView, (db) => {
      const businessId = db.ventures.find((v) => v.id === ventureOrBusinessId)?.businessId ?? ventureOrBusinessId;
      return { stages: [...STAGES], cards: db.pipeline.filter((e) => e.businessId === businessId).map((e) => cardOf(db, e)) };
    });
  },

  async moveCandidate(entryId, stage) {
    const st = parseInput(PipelineStage, stage);
    return write(PipelineCard, (db) => {
      const s = me();
      const e = db.pipeline.find((x) => x.id === entryId);
      if (!e) throw new ServiceError("not_found", "Candidate not found.");
      if (s.role !== "business" || e.businessId !== s.userId) throw new ServiceError("forbidden", "Only the poster can move candidates.");
      const ok = canMoveTo(db, e, st);
      if (!ok.ok) throw new ServiceError("not_ready", ok.reason ?? "Not ready for that stage.");
      const next = { ...e, stage: st, updatedAt: new Date().toISOString() };
      return { db: { ...db, pipeline: db.pipeline.map((x) => (x.id === e.id ? next : x)) }, result: cardOf(db, next) };
    });
  },

  async inviteToContinue(applicationId, message) {
    const msg = parseInput(z.string().trim().max(500).optional(), message);
    return write(InviteView, (db) => {
      const s = me();
      const app = db.applications.find((a) => a.id === applicationId);
      if (!app) throw new ServiceError("not_found", "Application not found.");
      const project = db.projects.find((p) => p.id === app.projectId)!;
      if (s.role !== "business" || project.businessId !== s.userId) throw new ServiceError("forbidden", "Only the poster can send an invite.");
      if (app.status !== "accepted" || project.status !== "completed") throw new ServiceError("not_ready", "You can invite a student to continue after their project has been finally approved.");
      const biz = db.businesses.find((b) => b.id === project.businessId)!;
      const student = db.students.find((x) => x.id === app.studentId)!;
      const now = new Date().toISOString();
      const invite = { sentAt: now, role: "Part-time role", message: msg || `Thanks for finishing ${project.title}. We would like you to keep working with us.` };
      const prior = db.pipeline.find((e) => e.applicationId === applicationId);
      const entry: HiringEntry = prior ? { ...prior, stage: "offer", invite, updatedAt: now } : { id: newId("pl"), businessId: biz.id, studentId: student.id, projectId: project.id, applicationId, stage: "offer", invite, updatedAt: now };
      return {
        db: { ...db, pipeline: prior ? db.pipeline.map((e) => (e.id === prior.id ? entry : e)) : [...db.pipeline, entry], notifications: [{ id: newId("ntf"), userId: student.id, title: `${biz.name} invited you to continue`, body: "Open your profile to read the invite.", href: "/profile", read: false, createdAt: now }, ...db.notifications] },
        result: inviteView(db, entry),
      };
    });
  },

  async myInvites() {
    return read(z.array(InviteView), (db) => {
      const s = requireStudent(db);
      return db.pipeline.filter((e) => e.studentId === s.id && e.invite).map((e) => inviteView(db, e));
    });
  },
};
