import { z } from "zod";
import { AvailabilityPref, Campus, Faculty, Level, Student, type Db } from "@/schemas";
import { EvidenceView, ProfileView } from "@/schemas/views";
import type { ProfileApi } from "./contract";
import { ServiceError, parseInput, read, write } from "./core";
import { requireStudent } from "./helpers";

const inviteView = (db: Db, e: Db["pipeline"][number]) => ({ entry: e, business: db.businesses.find((b) => b.id === e.businessId)!, venture: db.ventures.find((v) => v.businessId === e.businessId) ?? null, project: db.projects.find((p) => p.id === e.projectId)! });

function profileOf(db: Db, s: Student) {
  const completed = db.projects.filter((p) => p.studentId === s.id && p.status === "completed").sort((a, b) => b.deadline.localeCompare(a.deadline)).map((p) => ({
    project: p, business: db.businesses.find((b) => b.id === p.businessId)!, venture: db.ventures.find((v) => v.id === p.ventureId) ?? null, review: db.reviews.find((r) => r.projectId === p.id) ?? null,
    badges: db.badges.filter((b) => b.projectId === p.id && b.studentId === s.id),
    evaluation: db.evaluations.filter((e) => e.projectId === p.id && e.decision === "approved").sort((a, b) => b.at.localeCompare(a.at))[0] ?? null,
    submissionUrl: db.submissions.find((x) => x.projectId === p.id && x.status === "approved" && x.url)?.url ?? null,
  }));
  const claims = db.certClaims.filter((c) => c.studentId === s.id).map((claim) => ({ claim, entry: db.catalog.find((c) => c.id === claim.certId) ?? null }));
  const items = [
    { label: "Basic profile", done: Boolean(s.bio && s.program) },
    { label: "Skills added", done: s.skills.length >= 3 },
    { label: "Issuer-verified certification", done: claims.some((c) => c.claim.tier === "issuer") },
    { label: "Certification roadmap started", done: claims.length >= 2 },
    { label: "Portfolio link", done: Boolean(s.portfolioUrl) },
  ];
  const invites = db.pipeline.filter((e) => e.studentId === s.id);
  return {
    student: s, completed, claims,
    roadmap: { earned: claims.filter((c) => c.claim.status === "earned"), in_progress: claims.filter((c) => c.claim.status === "in_progress"), planned: claims.filter((c) => c.claim.status === "planned") },
    badges: db.badges.filter((b) => b.studentId === s.id),
    verifiedHours: completed.reduce((a, c) => a + c.project.hours, 0),
    active: db.projects.filter((p) => p.studentId === s.id && (p.status === "in_progress" || p.status === "in_review")).length,
    applied: db.applications.filter((a) => a.studentId === s.id && a.status === "pending").length,
    strength: Math.round((items.filter((i) => i.done).length / items.length) * 100), strengthItems: items,
    highlyRated: db.reviews.filter((r) => r.studentId === s.id && r.rating >= 4).map((review) => ({ review, business: db.businesses.find((b) => b.id === review.businessId)!, venture: db.ventures.find((v) => v.businessId === review.businessId) ?? null })).filter((x) => x.business.employerType === "yspace_startup" || x.business.employerType === "founder"),
    invites: invites.filter((e) => e.invite).map((e) => inviteView(db, e)),
    pipeline: invites.map((e) => inviteView(db, e)),
  };
}

export const profile: ProfileApi = {
  async getProfile(studentId) {
    return read(ProfileView, (db) => {
      const s = db.students.find((x) => x.id === studentId);
      if (!s) throw new ServiceError("not_found", "We could not find that profile.");
      return profileOf(db, s);
    });
  },
  async publicProfile(slug) {
    return read(ProfileView, (db) => {
      const s = db.students.find((x) => x.slug === slug);
      if (!s) throw new ServiceError("not_found", "We could not find that profile.");
      return profileOf(db, s);
    });
  },
  async myEvidence() {
    return read(EvidenceView, (db) => {
      const s = requireStudent(db);
      return db.badges.filter((b) => b.studentId === s.id).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)).map((badge) => {
        const project = db.projects.find((p) => p.id === badge.projectId)!;
        return { badge, project, business: db.businesses.find((x) => x.id === project.businessId)!, evaluation: db.evaluations.filter((e) => e.projectId === project.id && e.decision === "approved")[0] ?? null, review: db.reviews.find((r) => r.projectId === project.id) ?? null };
      });
    });
  },
  async updateProfile(patch) {
    const p = parseInput(z.object({
      bio: z.string().max(400).optional(), program: z.string().min(1).optional(), faculty: Faculty.optional(), year: z.number().int().min(1).max(5).optional(), campus: Campus.optional(),
      hoursPerWeek: z.number().int().min(1).max(40).optional(), pref: AvailabilityPref.optional(), portfolioUrl: z.string().url("Enter a full link starting with https://").or(z.literal("")).optional(),
      addSkill: z.object({ name: z.string().trim().min(1), level: Level }).optional(), removeSkill: z.string().optional(),
    }), patch);
    return write(Student, (db) => {
      const s = requireStudent(db);
      let skills = s.skills;
      // Anything the student types is self-reported. Only a reviewer-approved project can make a skill reviewed.
      if (p.addSkill && !skills.some((k) => k.name.toLowerCase() === p.addSkill!.name.toLowerCase())) skills = [...skills, { name: p.addSkill.name, level: p.addSkill.level, trust: "self", evidence: [] }];
      if (p.removeSkill) skills = skills.filter((k) => k.name !== p.removeSkill || k.trust !== "self");
      const { addSkill: _a, removeSkill: _r, portfolioUrl, ...rest } = p;
      void _a; void _r;
      const next: Student = { ...s, ...rest, ...(portfolioUrl !== undefined ? { portfolioUrl: portfolioUrl || undefined } : {}), skills };
      return { db: { ...db, students: db.students.map((x) => (x.id === s.id ? next : x)) }, result: next };
    });
  },
};
