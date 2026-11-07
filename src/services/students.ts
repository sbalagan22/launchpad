import { z } from "zod";
import { Business, Id, Level, Project, Student, AvailabilityPref, School } from "@/schemas";
import { ProfileView } from "@/schemas/views";
import { newId, slugify } from "@/lib/ids";
import { daysFromNow } from "@/lib/dates";
import { ServiceError, parseInput, read, write } from "./core";

function strengthOf(s: Student, hasVerifiedCert: boolean, certCount: number) {
  const items = [
    { label: "Basic profile", done: Boolean(s.bio && s.field && s.school) },
    { label: "Skills added", done: s.skills.length >= 3 },
    { label: "Verified certification", done: hasVerifiedCert },
    { label: "Second certification", done: certCount >= 2 },
    { label: "Portfolio link", done: Boolean(s.portfolioUrl) },
  ];
  return { items, strength: Math.round((items.filter((i) => i.done).length / items.length) * 100) };
}

export async function listStudents() {
  return read(z.array(Student), (db) => db.students);
}

export async function getStudent(id: string) {
  parseInput(Id, id);
  return read(Student, (db) => {
    const s = db.students.find((x) => x.id === id);
    if (!s) throw new ServiceError("not_found", "Student not found");
    return s;
  });
}

export async function getProfile(key: { id?: string; slug?: string }) {
  return read(ProfileView, (db) => {
    const s = db.students.find((x) => (key.id ? x.id === key.id : x.slug === key.slug));
    if (!s) throw new ServiceError("not_found", "We could not find that profile.");
    const completed = db.projects
      .filter((p) => p.studentId === s.id && p.status === "completed")
      .sort((a, b) => b.deadline.localeCompare(a.deadline))
      .map((p) => ({
        project: p,
        business: db.businesses.find((b) => b.id === p.businessId)!,
        review: db.reviews.find((r) => r.projectId === p.id) ?? null,
        badges: db.badges.filter((b) => b.projectId === p.id && b.studentId === s.id),
        submissionUrl: db.submissions.find((x) => x.projectId === p.id && x.status === "approved" && x.url)?.url ?? null,
      }));
    const claims = db.certClaims.filter((c) => c.studentId === s.id).map((claim) => ({ claim, cert: db.certifications.find((c) => c.id === claim.certId)! }));
    const { items, strength } = strengthOf(s, claims.some((c) => c.claim.tier === "issuer"), claims.length);
    return {
      student: s, completed, claims, badges: db.badges.filter((b) => b.studentId === s.id),
      verifiedHours: completed.reduce((a, c) => a + c.project.hours, 0),
      active: db.projects.filter((p) => p.studentId === s.id && (p.status === "in_progress" || p.status === "in_review")).length,
      applied: db.applications.filter((a) => a.studentId === s.id && a.status === "pending").length,
      strength, strengthItems: items,
    };
  });
}

const UpdateInput = z.object({
  bio: z.string().max(400).optional(),
  field: z.string().min(1).optional(),
  city: z.string().optional(),
  hoursPerWeek: z.number().int().min(1).max(40).optional(),
  pref: AvailabilityPref.optional(),
  portfolioUrl: z.string().url("Enter a full link starting with https://").or(z.literal("")).optional(),
  addSkill: z.object({ name: z.string().trim().min(1), level: Level }).optional(),
  removeSkill: z.string().optional(),
});

export async function updateStudent(id: string, patch: z.input<typeof UpdateInput>) {
  const p = parseInput(UpdateInput, patch);
  return write(Student, (db) => {
    const s = db.students.find((x) => x.id === id);
    if (!s) throw new ServiceError("not_found", "Student not found");
    let skills = s.skills;
    if (p.addSkill && !skills.some((k) => k.name.toLowerCase() === p.addSkill!.name.toLowerCase())) {
      // Rule: anything the student types is self-reported, never verified.
      skills = [...skills, { name: p.addSkill.name, level: p.addSkill.level, trust: "self", evidence: [{ label: "Added by student" }] }];
    }
    if (p.removeSkill) skills = skills.filter((k) => k.name !== p.removeSkill || k.trust !== "self");
    const next: Student = {
      ...s,
      ...(p.bio !== undefined ? { bio: p.bio } : {}), ...(p.field ? { field: p.field } : {}), ...(p.city !== undefined ? { city: p.city } : {}),
      ...(p.hoursPerWeek ? { hoursPerWeek: p.hoursPerWeek } : {}), ...(p.pref ? { pref: p.pref } : {}),
      ...(p.portfolioUrl !== undefined ? { portfolioUrl: p.portfolioUrl || undefined } : {}), skills,
    };
    return { db: { ...db, students: db.students.map((x) => (x.id === id ? next : x)) }, result: next };
  });
}

const CreateStudent = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  school: School,
  field: z.string().min(1),
  skills: z.array(z.string()).min(1, "Pick at least one skill"),
  hoursPerWeek: z.number().int().min(1).max(40),
  pref: AvailabilityPref,
});

export async function createStudent(input: z.input<typeof CreateStudent>) {
  const v = parseInput(CreateStudent, input);
  return write(Student, (db) => {
    let slug = slugify(v.name);
    if (db.students.some((s) => s.slug === slug)) slug = `${slug}-${db.students.length + 1}`;
    const s: Student = {
      id: newId("stu"), slug, name: v.name, school: v.school, year: 1, field: v.field, city: "Toronto", bio: "", hoursPerWeek: v.hoursPerWeek, pref: v.pref,
      skills: v.skills.map((name) => ({ name, level: "Beginner" as const, trust: "self" as const, evidence: [{ label: "Added by student" }] })),
      createdAt: daysFromNow(0),
    };
    return { db: { ...db, students: [...db.students, s] }, result: s };
  });
}

const CreateBusiness = z.object({
  name: z.string().trim().min(2, "Enter the business name"),
  kind: z.enum(["business", "nonprofit"]),
  city: z.enum(["Brampton", "Mississauga", "Toronto"]),
  category: z.string().trim().min(2),
  description: z.string().trim().min(10, "Add a short description"),
});

export async function createBusiness(input: z.input<typeof CreateBusiness>) {
  const v = parseInput(CreateBusiness, input);
  return write(Business, (db) => {
    const b: Business = { id: newId("biz"), ...v, rating: 5, founded: new Date().getFullYear(), size: "Small team", createdAt: daysFromNow(0) };
    return { db: { ...db, businesses: [...db.businesses, b] }, result: b };
  });
}

export async function listBusinesses() {
  return read(z.array(Business), (db) => db.businesses);
}

export async function getBusiness(id: string) {
  return read(Business, (db) => {
    const b = db.businesses.find((x) => x.id === id);
    if (!b) throw new ServiceError("not_found", "Business not found");
    return b;
  });
}

export type { Project };
