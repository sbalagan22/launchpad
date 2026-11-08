import { z } from "zod";
import { Faculty, Session, type Student } from "@/schemas";
import { useApp, getDb, DEMO_OMAR_ID, DEMO_PRIYA_ID, DEMO_STUDENT_ID } from "@/store";
import { slugify } from "@/lib/ids";
import { CONTACT } from "@/mocks/people";
import { daysFromNow } from "@/lib/dates";
import { newId } from "@/lib/ids";
import type { AuthApi, CurrentUser, DemoRole, SignUpStudentInput, YorkEmailCheck } from "./contract";
import { ServiceError, latency, parseInput } from "./core";

// MOCK: approximate York email patterns. The real list of student and staff domains must be
// confirmed with York before launch. Demo accounts bypass this check entirely.
const YORK_EMAIL = /^[a-z0-9._%+-]+@(my\.)?yorku\.ca$/i;

export function checkYorkEmail(email: string): YorkEmailCheck {
  const e = email.trim();
  if (!e) return { valid: false, reason: "Enter your York email address." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return { valid: false, reason: "That does not look like an email address." };
  if (!YORK_EMAIL.test(e)) return { valid: false, reason: "Launchpad is for York students. Use your @yorku.ca or @my.yorku.ca address." };
  return { valid: true };
}

function build(): CurrentUser {
  const { session } = useApp.getState();
  const db = getDb();
  const student = session.role === "student" ? db.students.find((s) => s.id === session.userId) ?? null : null;
  const business = session.role === "business" ? db.businesses.find((b) => b.id === session.userId) ?? null : null;
  const displayName = student?.name ?? (business ? (CONTACT[business.id] ?? business.name) : "Guest");
  const initials = displayName.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  return { session, student, business, displayName, initials };
}

const DEMO: Record<DemoRole, Session> = {
  aisha: { role: "student", userId: DEMO_STUDENT_ID },
  priya: { role: "student", userId: DEMO_PRIYA_ID },
  omar: { role: "business", userId: DEMO_OMAR_ID },
};

export const auth: AuthApi = {
  // MOCK: there is no real authentication. Demo accounts sign in with one click and skip the York email check.
  async loginDemo(role) {
    await latency(300, 600);
    useApp.getState().setSession(Session.parse(DEMO[role]), true);
    return build();
  },
  async validateYorkEmail(email) {
    await latency(150, 300);
    return checkYorkEmail(email);
  },
  async signUpStudent(input: SignUpStudentInput) {
    const v = parseInput(z.object({ name: z.string().trim().min(2, "Enter your name"), email: z.string(), program: z.string().min(1), faculty: Faculty, year: z.number().int().min(1).max(5), campus: z.enum(["Keele", "Glendon"]), skills: z.array(z.string()).min(1, "Pick at least one skill"), hoursPerWeek: z.number().int().min(1).max(40), pref: z.enum(["paid", "volunteer", "both"]) }), input);
    const check = checkYorkEmail(v.email);
    if (!check.valid) throw new ServiceError("not_york", check.reason ?? "Use a York email address.");
    await latency();
    const db = getDb();
    if (db.students.some((s) => s.email.toLowerCase() === v.email.toLowerCase())) throw new ServiceError("duplicate", "An account with that email already exists.");
    let slug = slugify(v.name);
    if (db.students.some((s) => s.slug === slug)) slug = `${slug}-${db.students.length + 1}`;
    const s: Student = {
      id: newId("stu"), slug, name: v.name, email: v.email, yorkVerified: true, program: v.program, faculty: v.faculty, year: v.year, campus: v.campus, bio: "", hoursPerWeek: v.hoursPerWeek, pref: v.pref, city: "Toronto", languages: ["English"], interests: [],
      skills: v.skills.map((name) => ({ name, level: "Beginner" as const, trust: "self" as const, evidence: [] })), createdAt: daysFromNow(0),
    };
    useApp.getState().commit((d) => ({ ...d, students: [...d.students, s] }));
    useApp.getState().setSession({ role: "student", userId: s.id }, true);
    return build();
  },
  async currentUser() {
    await latency(100, 250);
    return build();
  },
  async logout() {
    await latency(100, 200);
    useApp.getState().signOut();
  },
  async switchTo(role, userId) {
    await latency(150, 300);
    const db = getDb();
    const ok = role === "student" ? db.students.some((x) => x.id === userId) : db.businesses.some((x) => x.id === userId);
    if (!ok) throw new ServiceError("not_found", "That demo user does not exist.");
    useApp.getState().setSession({ role, userId });
    return build();
  },
  async listDemoUsers() {
    await latency(150, 300);
    const db = getDb();
    return {
      students: db.students.map((s) => ({ id: s.id, name: s.name, sub: `${s.program}, ${s.faculty}, year ${s.year}` })),
      businesses: db.businesses.map((b) => ({ id: b.id, name: b.name, sub: b.category })),
    };
  },
};
