import { z } from "zod";
import { Notification, Session } from "@/schemas";
import { ImpactView, ThreadView } from "@/schemas/views";
import { useApp, DEMO_BUSINESS_ID, DEMO_STUDENT_ID } from "@/store";
import { daysBetween } from "@/lib/dates";
import { latency, read, write, ServiceError } from "./core";

/* ---------- Notifications ---------- */
export async function listNotifications(userId: string) {
  return read(z.array(Notification), (db) => db.notifications.filter((n) => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}
export async function markRead(id: string) {
  return write(z.literal(true), (db) => ({ db: { ...db, notifications: db.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }, result: true as const }));
}
export async function markAllRead(userId: string) {
  return write(z.literal(true), (db) => ({ db: { ...db, notifications: db.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)) }, result: true as const }));
}

/* ---------- Messages ---------- */
export async function listThreads(role: "student" | "business", userId: string) {
  return read(z.array(ThreadView), (db) =>
    db.threads
      .filter((t) => (role === "student" ? t.studentId === userId : t.businessId === userId))
      .map((thread) => ({ thread, project: db.projects.find((p) => p.id === thread.projectId)!, business: db.businesses.find((b) => b.id === thread.businessId)!, student: db.students.find((s) => s.id === thread.studentId)! }))
      .sort((a, b) => b.thread.messages[b.thread.messages.length - 1].at.localeCompare(a.thread.messages[a.thread.messages.length - 1].at)),
  );
}

/* ---------- Auth (fake) ---------- */
export const DemoUsers = z.object({
  students: z.array(z.object({ id: z.string(), name: z.string(), sub: z.string() })),
  businesses: z.array(z.object({ id: z.string(), name: z.string(), sub: z.string() })),
});
export async function listDemoUsers() {
  return read(DemoUsers, (db) => ({
    students: db.students.map((s) => ({ id: s.id, name: s.name, sub: `${s.school}, ${s.field}` })),
    businesses: db.businesses.map((b) => ({ id: b.id, name: b.name, sub: `${b.category}, ${b.city}` })),
  }));
}

// MOCK: there is no real authentication. Any credentials sign in as the chosen seeded user.
export async function signIn(session: z.input<typeof Session>) {
  const s = Session.parse(session);
  await latency(400, 800);
  const db = useApp.getState().db;
  const exists = s.role === "student" ? db.students.some((x) => x.id === s.userId) : db.businesses.some((x) => x.id === s.userId);
  if (!exists) throw new ServiceError("not_found", "That demo user does not exist.");
  useApp.getState().setSession(s, true);
  return s;
}

/** Instant, no-login switch used by the demo-mode switcher in the nav. */
export function switchDemoMode(role: "student" | "business") {
  useApp.getState().setSession(role === "student" ? { role, userId: DEMO_STUDENT_ID } : { role, userId: DEMO_BUSINESS_ID });
}
export function switchToUser(role: "student" | "business", userId: string) {
  useApp.getState().setSession({ role, userId });
}

/* ---------- Dev ---------- */
// MOCK: restores the seed dataset.
export async function resetDemoData() {
  await latency(300, 500);
  useApp.getState().reset();
  return true;
}

/* ---------- Impact (computed from the mock entities, never hardcoded) ---------- */
export async function getImpact() {
  return read(ImpactView, (db) => {
    const started = db.projects.filter((p) => p.studentId);
    const completed = db.projects.filter((p) => p.status === "completed");
    const placed = new Set(started.map((p) => p.studentId));
    const hours = db.projects.reduce((a, p) => a + (p.status === "completed" ? p.hours : p.loggedHours), 0);
    const reviews = db.reviews;
    const firstAccepted = (sid: string) => db.applications.filter((a) => a.studentId === sid && a.status === "accepted").map((a) => a.createdAt).sort()[0];
    const gaps = [...placed].flatMap((sid) => {
      const s = db.students.find((x) => x.id === sid);
      const first = firstAccepted(sid!);
      return s && first ? [Math.max(0, daysBetween(s.createdAt, first))] : [];
    });
    const monthKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { month: "short", year: "2-digit" });
    const monthTotals = new Map<string, { hours: number; t: number }>();
    for (const p of completed) {
      const t = new Date(p.milestones[p.milestones.length - 1].approvedAt ?? p.deadline).getTime();
      const k = monthKey(new Date(t).toISOString());
      const cur = monthTotals.get(k) ?? { hours: 0, t: new Date(new Date(t).getFullYear(), new Date(t).getMonth(), 1).getTime() };
      monthTotals.set(k, { hours: cur.hours + p.hours, t: cur.t });
    }
    const types = [...new Set(db.projects.map((p) => p.type))];
    const cities = ["Brampton", "Mississauga", "Toronto"] as const;
    const schools = [...new Set(db.students.map((s) => s.school))];
    const allSkills = db.students.flatMap((s) => s.skills);
    return {
      studentsPlaced: placed.size,
      hoursContributed: hours,
      businessesServed: new Set(started.map((p) => p.businessId)).size,
      averageRating: reviews.length ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10 : 0,
      skillsVerified: allSkills.filter((k) => k.trust !== "self").length,
      projectsCompleted: completed.length,
      projectsInProgress: db.projects.filter((p) => p.status === "in_progress" || p.status === "in_review").length,
      openProjects: db.projects.filter((p) => p.status === "open").length,
      timeToFirstProjectDays: gaps.length ? Math.round((gaps.reduce((a, b) => a + b, 0) / gaps.length) * 10) / 10 : 0,
      stipendsPaid: db.projects.filter((p) => p.payType === "stipend").reduce((a, p) => a + p.milestones.filter((m) => m.status === "approved").reduce((x, m) => x + m.amount, 0), 0),
      volunteerHours: completed.filter((p) => p.payType === "volunteer").reduce((a, p) => a + p.hours, 0),
      byType: types.map((type) => ({ type, projects: db.projects.filter((p) => p.type === type && p.studentId).length, hours: db.projects.filter((p) => p.type === type).reduce((a, p) => a + (p.status === "completed" ? p.hours : p.loggedHours), 0) })).sort((a, b) => b.hours - a.hours),
      byCity: cities.map((city) => ({ city, businesses: new Set(started.filter((p) => db.businesses.find((b) => b.id === p.businessId)?.city === city).map((p) => p.businessId)).size, projects: started.filter((p) => db.businesses.find((b) => b.id === p.businessId)?.city === city).length })),
      bySchool: schools.map((school) => ({ school, students: new Set(started.filter((p) => db.students.find((s) => s.id === p.studentId)?.school === school).map((p) => p.studentId)).size, hours: started.filter((p) => db.students.find((s) => s.id === p.studentId)?.school === school).reduce((a, p) => a + (p.status === "completed" ? p.hours : p.loggedHours), 0) })).sort((a, b) => b.hours - a.hours),
      byMonth: [...monthTotals.entries()].sort((a, b) => a[1].t - b[1].t).map(([month, v]) => ({ month, hours: v.hours })),
      trustMix: { issuer: allSkills.filter((k) => k.trust === "issuer").length, checked: allSkills.filter((k) => k.trust === "checked").length, self: allSkills.filter((k) => k.trust === "self").length },
    };
  });
}
