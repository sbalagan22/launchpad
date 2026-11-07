import type { Db, Project, Student } from "@/schemas";
import type { ProjectCard } from "@/schemas/views";
import { computeMatch } from "@/lib/matching";
import { computeSkillYield, type YieldInput } from "@/lib/skill-yield";
import { useApp } from "@/store";
import { ServiceError } from "./core";

export const me = () => useApp.getState().session;

export function requireStudent(db: Db): Student {
  const s = me();
  const st = s.role === "student" ? db.students.find((x) => x.id === s.userId) : undefined;
  if (!st) throw new ServiceError("forbidden", "Sign in as a student to do that.");
  return st;
}
export function requireBusinessId(): string {
  const s = me();
  if (s.role !== "business") throw new ServiceError("forbidden", "Sign in as a poster to do that.");
  return s.userId;
}
export function requireReviewerId(): string {
  const s = me();
  if (s.role !== "reviewer") throw new ServiceError("forbidden", "Sign in as a reviewer to do that.");
  return s.userId;
}

export function yieldInput(p: Pick<Project, "title" | "description" | "hook" | "type" | "deliverables" | "skills" | "tools" | "hours" | "milestones" | "rubric" | "doneLooksLike"> & { reviewerIds?: string[] }, ventureBacked = false): YieldInput {
  return {
    title: p.title, description: p.description, hook: p.hook, type: p.type, deliverables: p.deliverables, skills: p.skills, tools: p.tools, hours: p.hours,
    milestones: p.milestones.map((m) => ({ hours: m.hours })), reviewerCount: p.reviewerIds?.length ?? (ventureBacked ? 2 : 1), rubricCount: p.rubric.length, doneLooksLike: p.doneLooksLike,
  };
}
export const yieldOf = (p: Project) => computeSkillYield(yieldInput(p));

export function card(db: Db, p: Project, student: Student | null): ProjectCard {
  const apps = db.applications.filter((a) => a.projectId === p.id);
  return {
    project: p,
    business: db.businesses.find((b) => b.id === p.businessId)!,
    venture: db.ventures.find((v) => v.id === p.ventureId) ?? null,
    reviewers: db.reviewers.filter((r) => p.reviewerIds.includes(r.id)),
    applicantCount: apps.length,
    match: student ? computeMatch(student, p, db.certClaims.filter((c) => c.studentId === student.id), db.catalog) : null,
    yield: yieldOf(p),
    saved: student ? db.saved.some((s) => s.studentId === student.id && s.projectId === p.id) : false,
    myApplication: student ? apps.find((a) => a.studentId === student.id) ?? null : null,
    isNew: Date.now() - new Date(p.createdAt).getTime() < 24 * 3_600_000,
  };
}

export function currentStudent(db: Db): Student | null {
  const s = me();
  return s.role === "student" ? db.students.find((x) => x.id === s.userId) ?? null : null;
}
