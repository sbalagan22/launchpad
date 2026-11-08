import { z } from "zod";
import { Approval, type Badge, type Db, type Review } from "@/schemas";
import { ApprovalResult, FinalApproval, PendingApproval } from "@/schemas/views";
import { newId } from "@/lib/ids";
import { bumpSkill } from "@/lib/trust";
import type { ApprovalsApi } from "./contract";
import { ServiceError, parseInput, read, write } from "./core";
import { requireBusinessId } from "./helpers";

const Ratings = z.array(z.object({ criterion: z.string(), rating: z.number().int().min(1, "Rate every criterion.").max(5) })).min(3, "Rate every acceptance criterion.");
const ReviewText = z.string().trim().min(5, "Add a sentence about the work.").max(800);

function pendingOf(db: Db, submissionId: string) {
  const submission = db.submissions.find((s) => s.id === submissionId);
  if (!submission) throw new ServiceError("not_found", "Submission not found.");
  const project = db.projects.find((p) => p.id === submission.projectId)!;
  const milestone = project.milestones.find((m) => m.id === submission.milestoneId)!;
  return {
    submission, project, milestone, student: db.students.find((s) => s.id === submission.studentId)!, business: db.businesses.find((b) => b.id === project.businessId)!,
    check: db.checks.find((c) => c.id === submission.checkId) ?? null, approval: db.approvals.find((a) => a.submissionId === submission.id) ?? null,
    waitingHours: Math.max(0, Math.round((Date.now() - new Date(submission.submittedAt).getTime()) / 3_600_000)),
    isLastMilestone: project.milestones[project.milestones.length - 1].id === milestone.id,
  };
}

function decide(submissionId: string, ratings: { criterion: string; rating: number }[], reviewText: string, decision: "approved" | "changes_requested") {
  const rs = parseInput(Ratings, ratings);
  const text = parseInput(ReviewText, reviewText);
  const bid = requireBusinessId();
  return write(ApprovalResult, (db) => {
    const info = pendingOf(db, submissionId);
    const { submission, project, milestone, student, business } = info;
    if (project.businessId !== bid) throw new ServiceError("forbidden", "Only the poster of this project can approve work.");
    if (submission.status !== "pending_review") throw new ServiceError("decided", "This submission was already decided.");
    const now = new Date().toISOString();
    const approval: Approval = { id: newId("apv"), submissionId, projectId: project.id, businessId: bid, ratings: rs, review: text, decision, at: now };
    const idx = project.milestones.findIndex((m) => m.id === milestone.id);
    const isLast = idx === project.milestones.length - 1;
    const submissions = db.submissions.map((s) => (s.id === submissionId ? { ...s, status: decision === "approved" ? ("approved" as const) : ("changes_requested" as const) } : s));
    const first = student.name.split(" ")[0];

    if (decision === "changes_requested") {
      const next = { ...project, milestones: project.milestones.map((m, i) => (i === idx ? { ...m, status: "in_progress" as const } : m)) };
      return {
        db: { ...db, submissions, approvals: [...db.approvals, approval], projects: db.projects.map((p) => (p.id === project.id ? next : p)), notifications: [{ id: newId("ntf"), userId: student.id, title: "Changes requested", body: `${business.name} asked for changes on ${milestone.title}.`, href: `/workspace/${project.id}`, read: false, createdAt: now }, ...db.notifications] },
        result: { submission: { ...submission, status: "changes_requested" as const }, project: next, approval, final: null },
      };
    }

    const avg = Math.round((rs.reduce((a, r) => a + r.rating, 0) / rs.length) * 2) / 2;
    const milestones = project.milestones.map((m, i) => (i === idx ? { ...m, status: "approved" as const, approvedAt: now } : isLast ? m : i === idx + 1 ? { ...m, status: "in_progress" as const } : m));
    const approved = isLast ? { ...project, status: "completed" as const, milestones, loggedHours: project.hours } : { ...project, milestones, loggedHours: project.loggedHours + milestone.hours };
    let badges: Badge[] = [];
    let review: Review | null = null;
    let students = db.students;
    let reviews = db.reviews;
    if (isLast) {
      badges = project.badgeSkills.map((skill) => ({ id: newId("bdg"), studentId: student.id, skill, projectId: project.id, issuedAt: now, evidence: [{ label: `${project.title}, ${business.name}`, projectId: project.id, ...(submission.url ? { href: submission.url } : {}) }], ...(submission.checkId ? { checkId: submission.checkId } : {}) }));
      students = db.students.map((s) => (s.id === student.id ? { ...s, skills: badges.reduce((skills, b) => bumpSkill(skills, b.skill, "reviewed", b.evidence), s.skills) } : s));
      review = { id: newId("rev"), projectId: project.id, studentId: student.id, businessId: bid, rating: avg, ratings: rs, text, by: business.name, createdAt: now };
      reviews = [...db.reviews, review];
    }
    const final = isLast ? { project: approved, student, badges, review, evidence: badges.map((b) => ({ skill: b.skill, label: b.evidence[0]?.label ?? project.title, href: b.evidence[0]?.href ?? null })) } : null;
    return {
      db: {
        ...db, students, submissions, approvals: [...db.approvals, approval], reviews, badges: [...db.badges, ...badges], projects: db.projects.map((p) => (p.id === project.id ? approved : p)),
        notifications: [
          { id: newId("ntf"), userId: student.id, title: isLast ? "Project complete" : `Milestone ${idx + 1} approved`, body: isLast ? `${business.name} gave final approval. ${badges.length} skill badge${badges.length === 1 ? "" : "s"} unlocked, ${first}.` : `${business.name} approved ${milestone.title}. The next milestone is open.`, href: `/workspace/${project.id}`, read: false, createdAt: now },
          ...db.notifications,
        ],
      },
      result: { submission: { ...submission, status: "approved" as const }, project: approved, approval, final },
    };
  });
}

export const approvals: ApprovalsApi = {
  async pending() {
    const bid = requireBusinessId();
    return read(z.array(PendingApproval), (db) => db.submissions.filter((s) => s.status === "pending_review" && db.projects.find((p) => p.id === s.projectId)?.businessId === bid).map((s) => pendingOf(db, s.id)).sort((a, b) => b.waitingHours - a.waitingHours));
  },
  async getSubmission(id) {
    return read(PendingApproval, (db) => pendingOf(db, id));
  },
  approve: (id, ratings, review) => decide(id, ratings, review, "approved"),
  requestChanges: (id, ratings, review) => decide(id, ratings, review, "changes_requested"),
};

export { FinalApproval };
