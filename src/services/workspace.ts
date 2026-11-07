import { z } from "zod";
import { CheckResult, Message, Review, Submission, type Db } from "@/schemas";
import { ThreadView, WorkspaceView } from "@/schemas/views";
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
    submission, check: db.checks.find((c) => c.id === submission.checkId) ?? null, evaluation: db.evaluations.find((e) => e.submissionId === submission.id) ?? null,
  }));
  const allApproved = project.milestones.every((m) => m.status === "approved");
  return {
    project,
    business: db.businesses.find((b) => b.id === project.businessId)!,
    venture: db.ventures.find((v) => v.id === project.ventureId) ?? null,
    student: db.students.find((s) => s.id === project.studentId)!,
    reviewers: db.reviewers.filter((r) => project.reviewerIds.includes(r.id)),
    thread: db.threads.find((t) => t.projectId === projectId) ?? null,
    submissions,
    review: db.reviews.find((r) => r.projectId === projectId) ?? null,
    badges: db.badges.filter((b) => b.projectId === projectId),
    currentMilestone: project.milestones.find((m) => m.status === "in_progress") ?? null,
    awaitingFinalApproval: project.status === "in_review" && allApproved,
  };
}

export const workspace: WorkspaceApi = {
  async getWorkspace(projectId) {
    return read(WorkspaceView, (db) => buildWorkspace(db, projectId));
  },

  async submitMilestone(milestoneId, links, opts = {}) {
    const urls = links.map((l) => l.trim()).filter(Boolean);
    const fileNames = opts.fileNames ?? [];
    if (!urls.length && !fileNames.length) throw new ServiceError("invalid_input", "Add a link or at least one file.");
    const res = await write(z.object({ submission: Submission, check: CheckResult.nullable() }), (db) => {
      const s = me();
      const p = db.projects.find((x) => x.milestones.some((m) => m.id === milestoneId));
      if (!p) throw new ServiceError("not_found", "Milestone not found.");
      if (s.role !== "student" || p.studentId !== s.userId) throw new ServiceError("forbidden", "Only the assigned student can submit work.");
      if (p.status !== "in_progress") throw new ServiceError("invalid_state", "This project is not waiting for a submission.");
      const idx = p.milestones.findIndex((m) => m.id === milestoneId);
      if (p.milestones[idx].status !== "in_progress") throw new ServiceError("invalid_state", "This milestone is not open for submission.");
      // MOCK: the Basic check runs here, on the first link, so the UI can animate while this call is pending.
      const check = urls[0] ? basicCheckFor(db, urls[0]) : null;
      const final = Boolean(opts.final) || idx === p.milestones.length - 1;
      const submission: Submission = { id: newId("sub"), projectId: p.id, milestoneId, studentId: s.userId, url: urls[0], fileNames, final, checkId: check?.id, status: "pending_review", submittedAt: new Date().toISOString(), note: urls.length > 1 ? `More links: ${urls.slice(1).join(", ")}` : undefined };
      const covers = (i: number) => i === idx || (final && i > idx);
      const label = urls[0] ?? fileNames.join(", ");
      const student = db.students.find((x) => x.id === s.userId)!;
      return {
        db: {
          ...db, checks: check ? [...db.checks, check] : db.checks, submissions: [...db.submissions, submission],
          projects: db.projects.map((x) => (x.id === p.id ? { ...x, status: "in_review" as const, milestones: x.milestones.map((m, i) => (covers(i) ? { ...m, status: "in_review" as const } : m)) } : x)),
          threads: db.threads.map((t) => (t.projectId === p.id ? { ...t, messages: [...t.messages, { id: newId("msg"), from: "student" as const, at: submission.submittedAt, text: `${final ? "Final delivery" : `Milestone ${idx + 1}`} submitted for review: ${label}` }] } : t)),
          notifications: [
            ...p.reviewerIds.map((rid) => ({ id: newId("ntf"), userId: rid, title: "Submission waiting", body: `${student.name} submitted ${p.title}.`, href: `/reviewer/${submission.id}`, read: false, createdAt: submission.submittedAt })),
            { id: newId("ntf"), userId: p.businessId, title: "Milestone in review", body: `${student.name} submitted ${final ? "the final delivery" : `milestone ${idx + 1}`} of ${p.title}. A reviewer will score it.`, href: `/business/projects/${p.id}`, read: false, createdAt: submission.submittedAt },
            ...db.notifications,
          ],
        },
        result: { submission, check },
      };
    });
    return res;
  },

  async basicCheck(url) {
    await latency(500, 900);
    return CheckResult.parse(basicCheckFor(getDb(), parseInput(z.string().trim().min(3, "Enter a link."), url)));
  },

  async sendMessage(projectId, text) {
    const t = parseInput(z.string().trim().min(1, "Write a message first.").max(2000), text);
    await write(Message, (db) => {
      const s = me();
      const p = db.projects.find((x) => x.id === projectId);
      if (!p || !p.studentId) throw new ServiceError("not_found", "Project not found");
      const from = s.role === "student" ? "student" : s.role === "business" ? "business" : null;
      if (!from) throw new ServiceError("forbidden", "Reviewers leave feedback through the rubric, not chat.");
      if ((from === "student" && p.studentId !== s.userId) || (from === "business" && p.businessId !== s.userId)) throw new ServiceError("forbidden", "You are not on this project.");
      const msg = { id: newId("msg"), from, text: t, at: new Date().toISOString() } as const;
      const exists = db.threads.some((x) => x.projectId === p.id);
      const threads = exists ? db.threads.map((x) => (x.projectId === p.id ? { ...x, messages: [...x.messages, msg] } : x)) : [...db.threads, { id: newId("thr"), projectId: p.id, studentId: p.studentId, businessId: p.businessId, messages: [msg] }];
      const to = from === "student" ? p.businessId : p.studentId;
      return { db: { ...db, threads, notifications: [{ id: newId("ntf"), userId: to, title: "New message", body: t.slice(0, 80), href: from === "student" ? `/business/projects/${p.id}` : `/workspace/${p.id}`, read: false, createdAt: msg.at }, ...db.notifications] }, result: msg };
    });
  },

  async listThreads() {
    return read(z.array(ThreadView), (db) => {
      const s = me();
      return db.threads
        .filter((t) => (s.role === "student" ? t.studentId === s.userId : s.role === "business" ? t.businessId === s.userId : false))
        .map((thread) => ({ thread, project: db.projects.find((p) => p.id === thread.projectId)!, business: db.businesses.find((b) => b.id === thread.businessId)!, student: db.students.find((x) => x.id === thread.studentId)! }))
        .sort((a, b) => b.thread.messages[b.thread.messages.length - 1].at.localeCompare(a.thread.messages[a.thread.messages.length - 1].at));
    });
  },

  async rateStudent(projectId, rating, text) {
    const v = parseInput(z.object({ rating: z.number().int().min(1, "Choose a star rating.").max(5), text: z.string().trim().min(5, "Add a sentence about the work.").max(600) }), { rating, text });
    return write(Review, (db) => {
      const s = me();
      const p = db.projects.find((x) => x.id === projectId);
      if (!p || !p.studentId || s.role !== "business" || p.businessId !== s.userId) throw new ServiceError("forbidden", "Only the poster can rate the student.");
      if (p.status !== "completed") throw new ServiceError("invalid_state", "You can rate the student once the reviewer has given final approval.");
      if (db.reviews.some((r) => r.projectId === p.id)) throw new ServiceError("duplicate", "This project already has a review.");
      const biz = db.businesses.find((b) => b.id === p.businessId)!;
      const review = { id: newId("rev"), projectId: p.id, studentId: p.studentId, businessId: biz.id, rating: v.rating, text: v.text, by: biz.name, createdAt: new Date().toISOString() };
      return { db: { ...db, reviews: [...db.reviews, review], notifications: [{ id: newId("ntf"), userId: p.studentId, title: "New review", body: `${biz.name} rated ${p.title} ${v.rating} of 5.`, href: "/profile", read: false, createdAt: review.createdAt }, ...db.notifications] }, result: review };
    });
  },
};
