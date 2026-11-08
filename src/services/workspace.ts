import { z } from "zod";
import { CheckResult, Submission, type Db } from "@/schemas";
import { WorkspaceSummary, WorkspaceView } from "@/schemas/views";
import { newId } from "@/lib/ids";
import { getDb } from "@/store";
import type { WorkspaceApi } from "./contract";
import { basicCheckFor } from "./basic-check";
import { ServiceError, latency, parseInput, read, write } from "./core";
import { me } from "./helpers";

export function buildWorkspace(db: Db, projectId: string) {
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) throw new ServiceError("not_found", "That project no longer exists.");
  if (!project.studentId) throw new ServiceError("not_started", "This project has not started yet.");
  const submissions = db.submissions.filter((s) => s.projectId === projectId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).map((submission) => ({
    submission, check: db.checks.find((c) => c.id === submission.checkId) ?? null, approval: db.approvals.find((e) => e.submissionId === submission.id) ?? null,
  }));
  return {
    project,
    business: db.businesses.find((b) => b.id === project.businessId)!,
    venture: db.ventures.find((v) => v.id === project.ventureId) ?? null,
    student: db.students.find((s) => s.id === project.studentId)!,
    thread: db.threads.find((t) => t.projectId === projectId && t.studentId === project.studentId) ?? null,
    submissions,
    review: db.reviews.find((r) => r.projectId === projectId) ?? null,
    badges: db.badges.filter((b) => b.projectId === projectId),
    currentMilestone: project.milestones.find((m) => m.status === "in_progress" || m.status === "in_review") ?? null,
    awaitingFinalApproval: false,
  };
}

export const workspace: WorkspaceApi = {
  async listMine() {
    return read(z.array(WorkspaceSummary), (db) => {
      const s = me();
      const mine = db.projects.filter((p) => p.studentId && (s.role === "student" ? p.studentId === s.userId : p.businessId === s.userId) && p.status !== "open" && p.status !== "draft");
      return mine.map((project) => {
        const current = project.milestones.find((m) => m.status === "in_progress" || m.status === "in_review") ?? null;
        const thread = db.threads.find((t) => t.projectId === project.id && t.studentId === project.studentId);
        return {
          project, business: db.businesses.find((b) => b.id === project.businessId)!, venture: db.ventures.find((v) => v.id === project.ventureId) ?? null,
          student: db.students.find((x) => x.id === project.studentId)!, currentMilestone: current,
          unread: thread ? (s.role === "student" ? thread.unread.student : thread.unread.business) : 0,
          awaiting: project.status === "completed" ? "none" as const : current?.status === "in_review" ? "poster" as const : "you" as const,
        };
      }).sort((a, b) => Number(a.project.status === "completed") - Number(b.project.status === "completed") || b.project.createdAt.localeCompare(a.project.createdAt));
    });
  },

  async getWorkspace(projectId) {
    return read(WorkspaceView, (db) => buildWorkspace(db, projectId));
  },

  async submitMilestone(milestoneId, links, opts = {}) {
    const urls = links.map((l) => l.trim()).filter(Boolean);
    const fileNames = opts.fileNames ?? [];
    if (!urls.length && !fileNames.length) throw new ServiceError("invalid_input", "Add a link or at least one file.");
    return write(z.object({ submission: Submission, check: CheckResult.nullable() }), (db) => {
      const s = me();
      const p = db.projects.find((x) => x.milestones.some((m) => m.id === milestoneId));
      if (!p) throw new ServiceError("not_found", "Milestone not found.");
      if (s.role !== "student" || p.studentId !== s.userId) throw new ServiceError("forbidden", "Only the assigned student can submit work.");
      const idx = p.milestones.findIndex((m) => m.id === milestoneId);
      if (p.status !== "in_progress" || p.milestones[idx].status !== "in_progress") throw new ServiceError("invalid_state", "This milestone is not open for submission.");
      // MOCK: the Basic check runs here, on the first link. It only checks that the link is reachable.
      const check = urls[0] ? basicCheckFor(db, urls[0]) : null;
      const submission: Submission = { id: newId("sub"), projectId: p.id, milestoneId, studentId: s.userId, url: urls[0], fileNames, final: idx === p.milestones.length - 1, checkId: check?.id, status: "pending_review", ...(opts.note ? { note: opts.note } : {}), submittedAt: new Date().toISOString() };
      const student = db.students.find((x) => x.id === s.userId)!;
      const label = urls[0] ?? fileNames.join(", ");
      const now = submission.submittedAt;
      return {
        db: {
          ...db, checks: check ? [...db.checks, check] : db.checks, submissions: [...db.submissions, submission],
          projects: db.projects.map((x) => (x.id === p.id ? { ...x, milestones: x.milestones.map((m, i) => (i === idx ? { ...m, status: "in_review" as const } : m)) } : x)),
          threads: db.threads.map((t) => (t.projectId === p.id && t.studentId === s.userId ? { ...t, unread: { ...t.unread, business: t.unread.business + 1 }, messages: [...t.messages, { id: newId("msg"), from: "student" as const, at: now, attachments: [], text: `Milestone ${idx + 1} is submitted: ${label}` }] } : t)),
          notifications: [{ id: newId("ntf"), userId: p.businessId, title: `${student.name.split(" ")[0]} submitted milestone ${idx + 1}`, body: `${p.milestones[idx].title} is ready for your review.`, href: `/business/projects/${p.id}`, read: false, createdAt: now }, ...db.notifications],
        },
        result: { submission, check },
      };
    });
  },

  async basicCheck(url) {
    await latency(500, 900);
    return CheckResult.parse(basicCheckFor(getDb(), parseInput(z.string().trim().min(3, "Enter a link."), url)));
  },
};
