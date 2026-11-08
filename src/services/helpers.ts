import type { Db, Project, Student } from "@/schemas";
import type { ProjectCard } from "@/schemas/views";
import { computeMatch } from "@/lib/matching";
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
export const matchOf = (db: Db, student: Student, p: Project) => computeMatch(student, p, db.certClaims.filter((c) => c.studentId === student.id), db.catalog, db.reviews);

export function card(db: Db, p: Project, student: Student | null): ProjectCard {
  const apps = db.applications.filter((a) => a.projectId === p.id);
  return {
    project: p,
    business: db.businesses.find((b) => b.id === p.businessId)!,
    venture: db.ventures.find((v) => v.id === p.ventureId) ?? null,
    applicantCount: apps.length,
    match: student ? matchOf(db, student, p) : null,
    saved: student ? db.saved.some((s) => s.studentId === student.id && s.projectId === p.id) : false,
    myApplication: student ? apps.find((a) => a.studentId === student.id) ?? null : null,
    isNew: Date.now() - new Date(p.createdAt).getTime() < 24 * 3_600_000,
  };
}

export function currentStudent(db: Db): Student | null {
  const s = me();
  return s.role === "student" ? db.students.find((x) => x.id === s.userId) ?? null : null;
}
