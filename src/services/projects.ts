import { Project, PublishInput, VOLUNTEER_ELIGIBLE, industryOf, type Application, type Notification } from "@/schemas";
import { BusinessStats, ProjectCard, ProjectDetail } from "@/schemas/views";
import { z } from "zod";
import { daysFromNow } from "@/lib/dates";
import { newId } from "@/lib/ids";
import { splitPay } from "@/lib/pay";
import { proposalText as draftProposalText } from "@/mocks/world";
import { PIPELINE_EMPLOYERS } from "@/mocks/seed";
import type { ProjectFilters, ProjectsApi } from "./contract";
import { ServiceError, parseInput, read, write } from "./core";
import { card, currentStudent, requireBusinessId, requireStudent } from "./helpers";
import { matchOf } from "./helpers";
import { FACULTIES } from "@/mocks/spec";

const has = (hay: string[], needles: string[]) => needles.some((n) => hay.some((h) => h.toLowerCase() === n.toLowerCase()));

/** Plain-language list of what is still missing before a project can be published. No scores. */
export function missingFor(p: { deliverables: string[]; milestones: unknown[]; hours: number; acceptance: string[]; payType: string; pay: number; sponsorStipend: number }): string[] {
  const out: string[] = [];
  if (p.deliverables.length < 1) out.push("add at least one deliverable");
  if (p.milestones.length < 2) out.push("add at least 2 milestones");
  if (p.hours < 1 || p.hours > 25) out.push("set hours between 1 and 25");
  if (p.acceptance.length < 3) out.push("add 3 to 5 acceptance criteria");
  if (p.payType === "stipend" ? p.pay + p.sponsorStipend <= 0 : false) out.push("add a pay line");
  return out;
}

export const projects: ProjectsApi = {
  async checkPublish(draft) {
    const d = parseInput(PublishInput.pick({ deliverables: true, milestones: true, hours: true, acceptance: true, payType: true, pay: true, sponsorStipend: true }), { sponsorStipend: 0, pay: 0, ...(draft as object) });
    const missing = missingFor(d);
    return { ok: missing.length === 0, missing };
  },

  async businessStats() {
    const bid = requireBusinessId();
    return read(BusinessStats, (db) => {
      const mine = db.projects.filter((p) => p.businessId === bid && p.status !== "draft");
      const reviews = db.reviews.filter((r) => r.businessId === bid);
      return {
        posted: mine.length, active: mine.filter((p) => p.status === "in_progress").length, completed: mine.filter((p) => p.status === "completed").length, open: mine.filter((p) => p.status === "open").length,
        candidates: new Set(db.pipeline.filter((e) => e.businessId === bid).map((e) => e.studentId)).size,
        studentHours: Math.round(mine.reduce((a, p) => a + p.loggedHours, 0)),
        averageReview: reviews.length ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10 : 0,
        pendingApprovals: db.submissions.filter((s) => s.status === "pending_review" && mine.some((p) => p.id === s.projectId)).length,
      };
    });
  },

  async list(filters: ProjectFilters = {}) {
    const f = filters;
    const out = await read(z.object({ items: z.array(ProjectCard), total: z.number().int() }), (db) => {
      const student = currentStudent(db);
      const needle = (f.q ?? "").trim().toLowerCase();
      const status = f.status ?? ["open"];
      const items = db.projects
        .filter((p) => status.includes(p.status))
        .filter((p) => !f.faculty?.length || p.faculties.some((x) => f.faculty!.includes(x)))
        .filter((p) => !f.employerType?.length || f.employerType.includes(db.businesses.find((b) => b.id === p.businessId)!.employerType))
        .filter((p) => !f.payType?.length || f.payType.includes(p.payType))
        .filter((p) => (f.minHours === undefined || p.hours >= f.minHours) && (f.maxHours === undefined || p.hours <= f.maxHours))
        .filter((p) => !f.deadlineBefore || p.deadline <= f.deadlineBefore)
        .filter((p) => !f.skills?.length || has([...p.skills, ...p.tools], f.skills))
        .filter((p) => !f.type?.length || f.type.includes(p.type))
        .filter((p) => !f.strengthenedBy?.length || f.strengthenedBy.some((c) => p.strengthenedBy.includes(c)))
        .filter((p) => !f.difficulty?.length || f.difficulty.includes(p.difficulty))
        .filter((p) => !f.locationMode?.length || f.locationMode.includes(p.locationMode))
        .filter((p) => !f.industry?.length || f.industry.includes(industryOf(db.businesses.find((b) => b.id === p.businessId)!.category)))
        .filter((p) => !f.ventureId || p.ventureId === f.ventureId)
        .map((p) => card(db, p, student))
        .filter((c) => !needle || [c.project.title, c.project.hook, c.business.name, c.project.skills.join(" "), c.project.tools.join(" ")].join(" ").toLowerCase().includes(needle));
      const sort = f.sort ?? "match";
      items.sort((a, b) => {
        if (sort === "newest") return b.project.createdAt.localeCompare(a.project.createdAt);
        if (sort === "deadline") return a.project.deadline.localeCompare(b.project.deadline);
        if (sort === "pay") return b.project.pay + b.project.sponsorStipend - (a.project.pay + a.project.sponsorStipend);
        return Number(b.isNew) - Number(a.isNew) || (b.match?.score ?? 0) - (a.match?.score ?? 0) || b.project.createdAt.localeCompare(a.project.createdAt);
      });
      return { items, total: items.length };
    });
    return out;
  },

  async get(id) {
    return read(ProjectDetail, (db) => {
      const p = db.projects.find((x) => x.id === id);
      if (!p) throw new ServiceError("not_found", "That project no longer exists.");
      return { ...card(db, p, currentStudent(db)), strengtheningCerts: db.catalog.filter((c) => p.strengthenedBy.includes(c.id)) };
    });
  },

  async create(draft) {
    const v = parseInput(PublishInput, draft);
    const bid = requireBusinessId();
    return write(Project, (db) => {
      const biz = db.businesses.find((b) => b.id === bid);
      if (!biz || v.businessId !== bid) throw new ServiceError("forbidden", "You can only draft projects for your own account.");
      if (v.payType === "volunteer" && !VOLUNTEER_ELIGIBLE.includes(biz.employerType)) throw new ServiceError("invalid_pay", "Only nonprofits and York units can post unpaid projects.");
      if (v.payType === "stipend" && v.pay <= 0 && v.sponsorStipend <= 0) throw new ServiceError("invalid_pay", "Enter a stipend amount. Pay is always shown and equity-only work is not allowed.");
      if (v.payType === "volunteer" && v.pay !== 0) throw new ServiceError("invalid_pay", "A volunteer project cannot also carry a stipend. Use a sponsor stipend instead.");
      const venture = db.ventures.find((x) => x.businessId === bid);
      const id = newId("prj");
      const n = Math.max(1, v.milestones.length);
      const amounts = splitPay(v.pay + v.sponsorStipend, n);
      const project: Project = {
        id, businessId: bid, ventureId: v.ventureId ?? venture?.id, title: v.title, hook: v.hook, type: v.type, status: "draft", description: v.description,
        deliverables: v.deliverables, milestones: v.milestones.map((m, i) => ({ id: `${id}_m${i + 1}`, title: m.title, hours: m.hours, dueAt: daysFromNow(m.dueInDays), amount: amounts[i], status: "open" as const })),
        skills: v.skills, tools: v.tools, hours: v.hours, payType: v.payType, pay: v.pay, sponsorStipend: v.sponsorStipend,
        deadline: daysFromNow(Math.max(0, ...v.milestones.map((m) => m.dueInDays))), createdAt: new Date().toISOString(), studentId: null, acceptance: v.acceptance, difficulty: v.difficulty, locationMode: v.locationMode,
        doneLooksLike: v.doneLooksLike, goodFit: v.goodFit, notAFit: v.notAFit, strengthenedBy: v.strengthenedBy, faculties: [], badgeSkills: v.badgeSkills,
        beginnerFriendly: v.beginnerFriendly, aiScoped: true, loggedHours: 0,
      };
      return { db: { ...db, projects: [project, ...db.projects] }, result: project };
    });
  },

  async publish(id) {
    const bid = requireBusinessId();
    return write(Project, (db) => {
      const p = db.projects.find((x) => x.id === id);
      if (!p || p.businessId !== bid) throw new ServiceError("not_found", "Draft not found.");
      if (p.status !== "draft") throw new ServiceError("invalid_state", "This project is already published.");
      const gate = missingFor(p);
      if (gate.length) throw new ServiceError("not_ready", `Before publishing: ${gate.join("; ")}.`, { missing: gate });
      const biz = db.businesses.find((b) => b.id === bid)!;
      // Audience: faculties that fit the project type (approximate; used for the faculty filter).
      const faculties = ({ web: FACULTIES.cs, design: FACULTIES.des, data: [...FACULTIES.sci, "Schulich"], marketing: FACULTIES.biz, writing: FACULTIES.hum, admin: FACULTIES.biz } as const)[p.type];
      const open: Project = { ...p, status: "open", faculties: [...faculties], createdAt: new Date().toISOString(), deadline: p.milestones[p.milestones.length - 1].dueAt };
      // MOCK: Launchpad "notifies matching students" and two other students apply a few minutes later.
      const ranked = db.students.map((s) => ({ s, m: matchOf(db, s, open) })).filter((x) => x.m.score >= 50).sort((a, b) => b.m.score - a.m.score);
      const now = new Date().toISOString();
      const notifications: Notification[] = ranked.slice(0, 4).map(({ s, m }) => ({ id: newId("ntf"), userId: s.id, title: "New project matches your profile", body: `${open.title} at ${biz.name}, ${m.score} match.`, href: `/projects/${open.id}`, read: false, createdAt: now }));
      const simulated: Application[] = ranked.filter((x) => x.s.id !== "stu_aisha").slice(0, 2).map(({ s }, i) => ({ id: newId("app"), projectId: open.id, studentId: s.id, status: "pending" as const, proposal: draftProposalText(s, open, biz), createdAt: new Date(Date.now() - (i + 1) * 18 * 60_000).toISOString() }));
      if (simulated.length) notifications.push({ id: newId("ntf"), userId: biz.id, title: "New applicants", body: `${simulated.length} students applied to ${open.title}.`, href: `/business/projects/${open.id}`, read: false, createdAt: now });
      const pipeline = (PIPELINE_EMPLOYERS as readonly string[]).includes(biz.employerType)
        ? simulated.map((a) => ({ id: `pl_${a.id}`, businessId: biz.id, studentId: a.studentId, projectId: open.id, applicationId: a.id, stage: "applied" as const, updatedAt: now }))
        : [];
      return { db: { ...db, projects: db.projects.map((x) => (x.id === id ? open : x)), applications: [...db.applications, ...simulated], notifications: [...notifications, ...db.notifications], pipeline: [...db.pipeline, ...pipeline] }, result: open };
    });
  },

  async listMine() {
    const bid = requireBusinessId();
    return read(z.array(ProjectCard), (db) => db.projects.filter((p) => p.businessId === bid).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((p) => card(db, p, null)));
  },

  async save(id) {
    await write(z.literal(true), (db) => {
      const s = requireStudent(db);
      if (!db.projects.some((p) => p.id === id)) throw new ServiceError("not_found", "Project not found.");
      if (db.saved.some((x) => x.studentId === s.id && x.projectId === id)) return { db, result: true as const };
      return { db: { ...db, saved: [...db.saved, { studentId: s.id, projectId: id }] }, result: true as const };
    });
  },
  async unsave(id) {
    await write(z.literal(true), (db) => {
      const s = requireStudent(db);
      return { db: { ...db, saved: db.saved.filter((x) => !(x.studentId === s.id && x.projectId === id)) }, result: true as const };
    });
  },
  async listSaved() {
    return read(z.array(ProjectCard), (db) => {
      const s = requireStudent(db);
      return db.saved.filter((x) => x.studentId === s.id).map((x) => db.projects.find((p) => p.id === x.projectId)).filter((p): p is Project => Boolean(p)).map((p) => card(db, p, s));
    });
  },
};

