import { ImpactView } from "@/schemas/views";
import { daysBetween } from "@/lib/dates";
import type { ImpactApi } from "./contract";
import { read } from "./core";

// Every number is computed from the entities. Nothing is hardcoded.
export const impact: ImpactApi = {
  async getImpact() {
    return read(ImpactView, (db) => {
      const started = db.projects.filter((p) => p.studentId);
      const completed = db.projects.filter((p) => p.status === "completed");
      const placed = new Set(started.map((p) => p.studentId));
      const hrs = (p: (typeof db.projects)[number]) => (p.status === "completed" ? p.hours : p.loggedHours);
      const firstAccepted = (sid: string) => db.applications.filter((a) => a.studentId === sid && a.status === "accepted").map((a) => a.createdAt).sort()[0];
      const gaps = [...placed].flatMap((sid) => {
        const s = db.students.find((x) => x.id === sid);
        const first = firstAccepted(sid!);
        return s && first ? [Math.max(0, daysBetween(s.createdAt, first))] : [];
      });
      const monthKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { month: "short", year: "2-digit" });
      const months = new Map<string, { hours: number; t: number }>();
      for (const p of completed) {
        const d = new Date(p.milestones[p.milestones.length - 1].approvedAt ?? p.deadline);
        const k = monthKey(d.toISOString());
        const cur = months.get(k) ?? { hours: 0, t: new Date(d.getFullYear(), d.getMonth(), 1).getTime() };
        months.set(k, { hours: cur.hours + p.hours, t: cur.t });
      }
      const reviewsAvg = db.reviews.length ? db.reviews.reduce((a, r) => a + r.rating, 0) / db.reviews.length : 0;
      const allSkills = db.students.flatMap((s) => s.skills);
      const faculties = [...new Set(db.students.map((s) => s.faculty))];
      return {
        studentsPlaced: placed.size,
        hoursContributed: db.projects.reduce((a, p) => a + hrs(p), 0),
        organizationsServed: new Set(started.map((p) => p.businessId)).size,
        averageRating: Math.round(reviewsAvg * 10) / 10,
        skillsVerified: allSkills.filter((k) => k.trust === "reviewed").length,
        projectsCompleted: completed.length,
        projectsInProgress: db.projects.filter((p) => p.status === "in_progress").length,
        openProjects: db.projects.filter((p) => p.status === "open").length,
        timeToFirstProjectDays: gaps.length ? Math.round((gaps.reduce((a, b) => a + b, 0) / gaps.length) * 10) / 10 : 0,
        stipendsPaid: db.projects.reduce((a, p) => a + p.milestones.filter((m) => m.status === "approved").reduce((x, m) => x + m.amount, 0), 0),
        volunteerHours: completed.filter((p) => p.payType === "volunteer").reduce((a, p) => a + p.hours, 0),
        venturesActive: new Set(db.projects.filter((p) => p.ventureId && p.status !== "draft").map((p) => p.ventureId)).size,
        invitesSent: db.pipeline.filter((e) => e.invite).length,
        byType: [...new Set(db.projects.map((p) => p.type))].map((type) => ({ type, projects: db.projects.filter((p) => p.type === type && p.studentId).length, hours: db.projects.filter((p) => p.type === type).reduce((a, p) => a + hrs(p), 0) })).sort((a, b) => b.hours - a.hours),
        byEmployer: [...new Set(db.businesses.map((b) => b.employerType))].map((employerType) => ({ employerType, organizations: new Set(started.filter((p) => db.businesses.find((b) => b.id === p.businessId)?.employerType === employerType).map((p) => p.businessId)).size, projects: started.filter((p) => db.businesses.find((b) => b.id === p.businessId)?.employerType === employerType).length })),
        byFaculty: faculties.map((faculty) => ({ faculty, students: new Set(started.filter((p) => db.students.find((s) => s.id === p.studentId)?.faculty === faculty).map((p) => p.studentId)).size, hours: started.filter((p) => db.students.find((s) => s.id === p.studentId)?.faculty === faculty).reduce((a, p) => a + hrs(p), 0) })).sort((a, b) => b.hours - a.hours),
        byMonth: [...months.entries()].sort((a, b) => a[1].t - b[1].t).map(([month, v]) => ({ month, hours: v.hours })),
        skillMix: { approved: allSkills.filter((k) => k.trust === "reviewed").length, self: allSkills.filter((k) => k.trust === "self").length },
        certMix: { issuer: db.certClaims.filter((c) => c.tier === "issuer").length, self: db.certClaims.filter((c) => c.tier === "self").length },
      };
    });
  },
};
