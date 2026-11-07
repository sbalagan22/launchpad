import { z } from "zod";
import { Badge, CheckResult, Id, Message, Review, Submission, SubmitInput } from "@/schemas";
import { WorkspaceView } from "@/schemas/views";
import { bumpSkill } from "@/lib/trust";
import { newId } from "@/lib/ids";
import { mockCheck } from "./checks";
import { ServiceError, parseInput, read, write } from "./core";
import type { Db } from "@/schemas";

function build(db: Db, projectId: string) {
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) throw new ServiceError("not_found", "That project no longer exists.");
  if (!project.studentId) throw new ServiceError("not_started", "This project has not started yet.");
  return {
    project,
    business: db.businesses.find((b) => b.id === project.businessId)!,
    student: db.students.find((s) => s.id === project.studentId)!,
    thread: db.threads.find((t) => t.projectId === projectId) ?? null,
    submissions: db.submissions.filter((s) => s.projectId === projectId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).map((submission) => ({ submission, check: db.checks.find((c) => c.id === submission.checkId) ?? null })),
    review: db.reviews.find((r) => r.projectId === projectId) ?? null,
    badges: db.badges.filter((b) => b.projectId === projectId),
  };
}

export async function getWorkspace(projectId: string) {
  return read(WorkspaceView, (db) => build(db, projectId));
}

const MessageInput = z.object({ projectId: Id, from: z.enum(["student", "business"]), text: z.string().trim().min(1, "Write a message first.").max(2000) });

export async function sendMessage(input: z.input<typeof MessageInput>) {
  const v = parseInput(MessageInput, input);
  return write(Message, (db) => {
    const p = db.projects.find((x) => x.id === v.projectId);
    if (!p || !p.studentId) throw new ServiceError("not_found", "Project not found");
    const msg = { id: newId("msg"), from: v.from, text: v.text, at: new Date().toISOString() };
    const exists = db.threads.some((t) => t.projectId === p.id);
    const threads = exists
      ? db.threads.map((t) => (t.projectId === p.id ? { ...t, messages: [...t.messages, msg] } : t))
      : [...db.threads, { id: newId("thr"), projectId: p.id, studentId: p.studentId, businessId: p.businessId, messages: [msg] }];
    const to = v.from === "student" ? p.businessId : p.studentId;
    return {
      db: { ...db, threads, notifications: [{ id: newId("ntf"), userId: to, title: "New message", body: v.text.slice(0, 80), href: v.from === "student" ? `/business/projects/${p.id}` : `/workspace/${p.id}`, read: false, createdAt: msg.at }, ...db.notifications] },
      result: msg,
    };
  });
}

const SubmitResult = z.object({ submission: Submission, check: CheckResult.nullable() });

/** Student submits a link and/or files for the current milestone. Files are stored by name only. */
export async function submitWork(input: z.input<typeof SubmitInput>) {
  const v = parseInput(SubmitInput, input);
  // MOCK: the automated check runs inside the write, so the UI can animate while this is pending.
  const res = await write(SubmitResult, (db) => {
    const p = db.projects.find((x) => x.id === v.projectId);
    if (!p || p.studentId !== v.studentId) throw new ServiceError("forbidden", "Only the assigned student can submit work.");
    if (p.status !== "in_progress") throw new ServiceError("invalid_state", "This project is not waiting for a submission.");
    const idx = p.milestones.findIndex((m) => m.status === "in_progress");
    if (idx === -1) throw new ServiceError("invalid_state", "There is no open milestone to submit.");
    const check = v.url ? mockCheck(db, v.url) : null;
    const submission: Submission = {
      id: newId("sub"), projectId: p.id, milestoneId: p.milestones[idx].id, studentId: v.studentId, url: v.url, fileNames: v.fileNames,
      final: v.final || idx === p.milestones.length - 1, checkId: check?.id, status: "pending_review", submittedAt: new Date().toISOString(),
    };
    const covers = (i: number) => i === idx || (submission.final && i > idx);
    const label = v.url ?? v.fileNames.join(", ");
    return {
      db: {
        ...db,
        checks: check ? [...db.checks, check] : db.checks,
        submissions: [...db.submissions, submission],
        projects: db.projects.map((x) => (x.id === p.id ? { ...x, status: "in_review" as const, milestones: x.milestones.map((m, i) => (covers(i) ? { ...m, status: "in_review" as const } : m)) } : x)),
        threads: db.threads.map((t) => (t.projectId === p.id ? { ...t, messages: [...t.messages, { id: newId("msg"), from: "student" as const, at: submission.submittedAt, text: `${submission.final ? "Final delivery" : `Milestone ${idx + 1}`} submitted for review: ${label}` }] } : t)),
        notifications: [{ id: newId("ntf"), userId: p.businessId, title: "Milestone submitted", body: `${db.students.find((s) => s.id === v.studentId)!.name} submitted ${submission.final ? "the final delivery" : `milestone ${idx + 1}`} of ${p.title}.`, href: `/business/projects/${p.id}`, read: false, createdAt: submission.submittedAt }, ...db.notifications],
      },
      result: { submission, check },
    };
  });
  return res;
}

/** Business approves a submission and (visually) releases the milestone payout. */
export async function approveSubmission(submissionId: string) {
  return write(Submission, (db) => {
    const sub = db.submissions.find((s) => s.id === submissionId);
    if (!sub) throw new ServiceError("not_found", "Submission not found");
    if (sub.status !== "pending_review") throw new ServiceError("decided", "This submission was already reviewed.");
    const p = db.projects.find((x) => x.id === sub.projectId)!;
    const idx = p.milestones.findIndex((m) => m.id === sub.milestoneId);
    const now = new Date().toISOString();
    const covered = (i: number) => i === idx || (sub.final && i > idx);
    let milestones = p.milestones.map((m, i) => (covered(i) ? { ...m, status: "approved" as const, approvedAt: now } : m));
    const allDone = milestones.every((m) => m.status === "approved");
    if (!allDone) {
      const next = milestones.findIndex((m) => m.status !== "approved");
      milestones = milestones.map((m, i) => (i === next ? { ...m, status: "in_progress" as const } : m));
    }
    const released = p.milestones.filter((_, i) => covered(i)).reduce((a, m) => a + m.amount, 0);
    const next = { ...sub, status: "approved" as const };
    return {
      db: {
        ...db, submissions: db.submissions.map((s) => (s.id === sub.id ? next : s)),
        projects: db.projects.map((x) => (x.id === p.id ? { ...x, status: allDone ? ("in_review" as const) : ("in_progress" as const), milestones } : x)),
        notifications: [{ id: newId("ntf"), userId: sub.studentId, title: "Milestone approved", body: `${db.businesses.find((b) => b.id === p.businessId)!.name} approved ${sub.final ? "your final delivery" : `milestone ${idx + 1}`} of ${p.title}${released ? ` and released $${released}` : ""}.`, href: `/workspace/${p.id}`, read: false, createdAt: now }, ...db.notifications],
      },
      result: next,
    };
  });
}

export async function requestChanges(submissionId: string, note: string) {
  const text = parseInput(z.string().trim().min(3, "Tell the student what to change."), note);
  return write(Submission, (db) => {
    const sub = db.submissions.find((s) => s.id === submissionId);
    if (!sub || sub.status !== "pending_review") throw new ServiceError("decided", "This submission was already reviewed.");
    const p = db.projects.find((x) => x.id === sub.projectId)!;
    const idx = p.milestones.findIndex((m) => m.id === sub.milestoneId);
    const next = { ...sub, status: "changes_requested" as const, note: text };
    return {
      db: {
        ...db, submissions: db.submissions.map((s) => (s.id === sub.id ? next : s)),
        projects: db.projects.map((x) => (x.id === p.id ? { ...x, status: "in_progress" as const, milestones: x.milestones.map((m, i) => (i === idx ? { ...m, status: "in_progress" as const } : i > idx && m.status === "in_review" ? { ...m, status: "open" as const } : m)) } : x)),
        notifications: [{ id: newId("ntf"), userId: sub.studentId, title: "Changes requested", body: text.slice(0, 90), href: `/workspace/${p.id}`, read: false, createdAt: new Date().toISOString() }, ...db.notifications],
      },
      result: next,
    };
  });
}

const ReviewInput = z.object({ projectId: Id, rating: z.number().int().min(1, "Choose a star rating.").max(5), text: z.string().trim().min(5, "Add a sentence about the work.").max(600) });

/** Final review: completes the project, then issues verified skill badges with evidence. */
export async function submitReview(input: z.input<typeof ReviewInput>) {
  const v = parseInput(ReviewInput, input);
  return write(z.object({ review: Review, badges: z.array(Badge) }), (db) => {
    const p = db.projects.find((x) => x.id === v.projectId);
    if (!p || !p.studentId) throw new ServiceError("not_found", "Project not found");
    if (db.reviews.some((r) => r.projectId === p.id)) throw new ServiceError("duplicate", "This project was already reviewed.");
    if (!p.milestones.every((m) => m.status === "approved")) throw new ServiceError("invalid_state", "Approve every milestone before the final review.");
    const biz = db.businesses.find((b) => b.id === p.businessId)!;
    const student = db.students.find((s) => s.id === p.studentId)!;
    const now = new Date().toISOString();
    const lastSub = [...db.submissions].reverse().find((s) => s.projectId === p.id && s.status === "approved");
    const evidenceBase = { label: `${p.title}, ${biz.name}`, projectId: p.id, ...(lastSub?.url ? { href: lastSub.url } : {}) };
    const review = { id: newId("rev"), projectId: p.id, studentId: student.id, businessId: biz.id, rating: v.rating, text: v.text, by: biz.name, createdAt: now };
    const skills = p.badgeSkills.length ? p.badgeSkills : p.skills.slice(0, 1);
    const badges = skills.map((skill) => ({ id: newId("bdg"), studentId: student.id, skill, projectId: p.id, issuedAt: now, evidence: [evidenceBase], ...(lastSub?.checkId ? { checkId: lastSub.checkId } : {}) }));
    let sk = student.skills;
    for (const b of badges) sk = bumpSkill(sk, b.skill, "checked", b.evidence, "Intermediate");
    return {
      db: {
        ...db, reviews: [...db.reviews, review], badges: [...db.badges, ...badges],
        students: db.students.map((s) => (s.id === student.id ? { ...s, skills: sk } : s)),
        projects: db.projects.map((x) => (x.id === p.id ? { ...x, status: "completed" as const, loggedHours: x.hours } : x)),
        notifications: [
          { id: newId("ntf"), userId: student.id, title: `Verified badge earned: ${badges.map((b) => b.skill).join(", ")}`, body: `${biz.name} rated ${p.title} ${v.rating} of 5. Evidence is on your public profile.`, href: `/u/${student.slug}`, read: false, createdAt: now },
          ...db.notifications,
        ],
      },
      result: { review, badges },
    };
  });
}
