import { z } from "zod";
import { Evaluation, type Badge, type Db, type Submission } from "@/schemas";
import { FinalApproval, MilestoneDecision, QueueItem, SubmissionDetail } from "@/schemas/views";
import { bumpSkill } from "@/lib/trust";
import { newId } from "@/lib/ids";
import type { ReviewApi } from "./contract";
import { ServiceError, parseInput, read, write } from "./core";
import { requireReviewerId } from "./helpers";

const allApproved = (db: Db, projectId: string) => db.projects.find((p) => p.id === projectId)!.milestones.every((m) => m.status === "approved");

function detail(db: Db, s: Submission, reviewerId?: string) {
  const project = db.projects.find((p) => p.id === s.projectId)!;
  if (reviewerId && !project.reviewerIds.includes(reviewerId)) throw new ServiceError("forbidden", "You are not a reviewer on this project.");
  return {
    submission: s, project, milestone: project.milestones.find((m) => m.id === s.milestoneId)!, student: db.students.find((x) => x.id === s.studentId)!,
    business: db.businesses.find((b) => b.id === project.businessId)!, reviewers: db.reviewers.filter((r) => project.reviewerIds.includes(r.id)),
    check: db.checks.find((c) => c.id === s.checkId) ?? null, evaluation: db.evaluations.find((e) => e.submissionId === s.id) ?? null,
    awaitingFinalApproval: project.status === "in_review" && allApproved(db, project.id),
  };
}

export const review: ReviewApi = {
  async queue() {
    return read(z.array(QueueItem), (db) => {
      const rid = requireReviewerId();
      const items: z.infer<typeof QueueItem>[] = [];
      for (const p of db.projects.filter((x) => x.reviewerIds.includes(rid) && x.status === "in_review")) {
        const awaiting = allApproved(db, p.id);
        const subs = db.submissions.filter((s) => s.projectId === p.id);
        const sub = awaiting ? [...subs].filter((s) => s.status === "approved").sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0] : subs.find((s) => s.status === "pending_review");
        if (!sub) continue;
        const d = detail(db, sub);
        items.push({ submission: sub, project: d.project, milestone: d.milestone, student: d.student, business: d.business, check: d.check, evaluation: d.evaluation, waitingHours: Math.max(0, Math.round((Date.now() - new Date(sub.submittedAt).getTime()) / 3_600_000)), awaitingFinalApproval: awaiting });
      }
      return items.sort((a, b) => b.waitingHours - a.waitingHours);
    });
  },

  async getSubmission(id) {
    return read(SubmissionDetail, (db) => {
      const s = db.submissions.find((x) => x.id === id);
      if (!s) throw new ServiceError("not_found", "Submission not found.");
      return detail(db, s, requireReviewerId());
    });
  },

  async scoreRubric(submissionId, scores, feedback) {
    const fb = parseInput(z.string().trim().min(10, "Write a sentence or two of feedback for the student."), feedback);
    return write(Evaluation, (db) => {
      const rid = requireReviewerId();
      const s = db.submissions.find((x) => x.id === submissionId);
      if (!s) throw new ServiceError("not_found", "Submission not found.");
      const d = detail(db, s, rid);
      if (s.status !== "pending_review") throw new ServiceError("decided", "This submission was already reviewed.");
      const needed = d.project.rubric.map((r) => r.criterion);
      const clean = needed.map((criterion) => {
        const hit = scores.find((x) => x.criterion === criterion);
        const v = z.number().int().min(1).max(4).safeParse(hit?.score);
        if (!v.success) throw new ServiceError("invalid_input", `Score "${criterion}" from 1 to 4.`);
        return { criterion, score: v.data };
      });
      const evaluation: Evaluation = { id: d.evaluation?.id ?? newId("eva"), submissionId, projectId: s.projectId, reviewerId: rid, scores: clean, feedback: fb, decision: clean.some((c) => c.score === 1) ? "changes_requested" : "approved", at: new Date().toISOString() };
      return { db: { ...db, evaluations: [...db.evaluations.filter((e) => e.submissionId !== submissionId), evaluation] }, result: evaluation };
    });
  },

  async decideMilestone(submissionId, decision) {
    return write(MilestoneDecision, (db) => {
      const rid = requireReviewerId();
      const sub = db.submissions.find((x) => x.id === submissionId);
      if (!sub) throw new ServiceError("not_found", "Submission not found.");
      const d = detail(db, sub, rid);
      if (sub.status !== "pending_review") throw new ServiceError("decided", "This submission was already reviewed.");
      const ev = d.evaluation;
      if (!ev) throw new ServiceError("not_scored", "Score the rubric before deciding.");
      const p = d.project;
      const idx = p.milestones.findIndex((m) => m.id === sub.milestoneId);
      const now = new Date().toISOString();
      const covered = (i: number) => i === idx || (sub.final && i > idx);
      if (decision === "changes") {
        const next: Submission = { ...sub, status: "changes_requested", note: ev.feedback };
        const project = { ...p, status: "in_progress" as const, milestones: p.milestones.map((m, i) => (i === idx ? { ...m, status: "in_progress" as const } : i > idx && m.status === "in_review" ? { ...m, status: "open" as const } : m)) };
        return {
          db: {
            ...db, submissions: db.submissions.map((x) => (x.id === sub.id ? next : x)), projects: db.projects.map((x) => (x.id === p.id ? project : x)),
            evaluations: db.evaluations.map((e) => (e.id === ev.id ? { ...e, decision: "changes_requested" as const, at: now } : e)),
            notifications: [{ id: newId("ntf"), userId: sub.studentId, title: "Changes requested", body: ev.feedback.slice(0, 100), href: `/workspace/${p.id}`, read: false, createdAt: now }, ...db.notifications],
          },
          result: { submission: next, project, awaitingFinalApproval: false },
        };
      }
      if (ev.scores.some((c) => c.score === 1)) throw new ServiceError("needs_changes", "A score of 1 means the work needs changes. Request changes or raise the score.");
      let milestones = p.milestones.map((m, i) => (covered(i) ? { ...m, status: "approved" as const, approvedAt: now } : m));
      const done = milestones.every((m) => m.status === "approved");
      if (!done) {
        const nextOpen = milestones.findIndex((m) => m.status !== "approved");
        milestones = milestones.map((m, i) => (i === nextOpen ? { ...m, status: "in_progress" as const } : m));
      }
      const released = p.milestones.filter((_, i) => covered(i)).reduce((a, m) => a + m.amount, 0);
      const next: Submission = { ...sub, status: "approved" };
      const project = { ...p, status: done ? ("in_review" as const) : ("in_progress" as const), milestones };
      // MOCK: payout release is visual only. No payment provider is called and no money moves.
      return {
        db: {
          ...db, submissions: db.submissions.map((x) => (x.id === sub.id ? next : x)), projects: db.projects.map((x) => (x.id === p.id ? project : x)),
          evaluations: db.evaluations.map((e) => (e.id === ev.id ? { ...e, decision: "approved" as const, at: now } : e)),
          notifications: [{ id: newId("ntf"), userId: sub.studentId, title: "Milestone approved", body: `${d.reviewers.find((r) => r.id === rid)?.name ?? "A reviewer"} approved ${sub.final ? "your final delivery" : `milestone ${idx + 1}`} of ${p.title}${released ? `. $${released} marked for release` : ""}.`, href: `/workspace/${p.id}`, read: false, createdAt: now }, ...db.notifications],
        },
        result: { submission: next, project, awaitingFinalApproval: done },
      };
    });
  },

  async finalApprove(projectId) {
    return write(FinalApproval, (db) => {
      const rid = requireReviewerId();
      const p = db.projects.find((x) => x.id === projectId);
      if (!p || !p.studentId) throw new ServiceError("not_found", "Project not found.");
      if (!p.reviewerIds.includes(rid)) throw new ServiceError("forbidden", "You are not a reviewer on this project.");
      if (p.status !== "in_review" || !p.milestones.every((m) => m.status === "approved")) throw new ServiceError("invalid_state", "Approve every milestone before the final approval.");
      const student = db.students.find((s) => s.id === p.studentId)!;
      const biz = db.businesses.find((b) => b.id === p.businessId)!;
      const now = new Date().toISOString();
      const lastSub = [...db.submissions].filter((s) => s.projectId === p.id && s.status === "approved").sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
      const skills = p.badgeSkills.length ? p.badgeSkills : p.skills.slice(0, 1);
      const evidenceBase = { label: `${p.title}, ${biz.name}`, projectId: p.id, ...(lastSub?.url ? { href: lastSub.url } : {}) };
      const badges: Badge[] = skills.filter((sk) => !db.badges.some((b) => b.projectId === p.id && b.skill === sk)).map((skill) => ({ id: newId("bdg"), studentId: student.id, skill, projectId: p.id, issuedAt: now, evidence: [evidenceBase], ...(lastSub?.checkId ? { checkId: lastSub.checkId } : {}) }));
      let sk = student.skills;
      for (const b of badges) sk = bumpSkill(sk, b.skill, "reviewed", b.evidence, "Intermediate");
      const project = { ...p, status: "completed" as const, loggedHours: p.hours };
      return {
        db: {
          ...db, projects: db.projects.map((x) => (x.id === p.id ? project : x)), badges: [...db.badges, ...badges], students: db.students.map((s) => (s.id === student.id ? { ...s, skills: sk } : s)),
          notifications: [
            { id: newId("ntf"), userId: student.id, title: `Verified evidence unlocked: ${skills.join(", ")}`, body: `${p.title} is complete. A reviewer approved the work and it is on your public profile.`, href: `/u/${student.slug}`, read: false, createdAt: now },
            { id: newId("ntf"), userId: biz.id, title: "Project complete", body: `${student.name} finished ${p.title}. Leave a rating and, if it went well, invite them to continue.`, href: `/business/projects/${p.id}`, read: false, createdAt: now },
            ...db.notifications,
          ],
        },
        result: { project, student: { ...student, skills: sk }, badges, evidence: skills.map((skill) => ({ skill, label: evidenceBase.label, href: lastSub?.url ?? null })) },
      };
    });
  },
};
