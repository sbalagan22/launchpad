/* Referential-integrity and rule checks over the seed data. Run: npm run validate */
import { Db, VOLUNTEER_ELIGIBLE, PipelineStage } from "../src/schemas";
import { buildSeed } from "../src/mocks/seed";
import { CERT_BOOST_MAX } from "../src/lib/matching";

const errors: string[] = [];
const bad = (m: string) => errors.push(m);
const parsed = Db.safeParse(buildSeed());
if (!parsed.success) {
  console.error(parsed.error.issues.slice(0, 10));
  process.exit(1);
}
const db = parsed.data;
const ids = <T extends { id: string }>(xs: T[]) => new Set(xs.map((x) => x.id));
const S = ids(db.students), B = ids(db.businesses), V = ids(db.ventures), P = ids(db.projects), C = ids(db.catalog), SUB = ids(db.submissions), CK = ids(db.checks), A = ids(db.applications);
void CERT_BOOST_MAX;

for (const [name, list] of Object.entries({ students: db.students, businesses: db.businesses, projects: db.projects, applications: db.applications, reviews: db.reviews, notifications: db.notifications, catalog: db.catalog })) {
  if (ids(list as { id: string }[]).size !== list.length) bad(`duplicate ids in ${name}`);
}

for (const p of db.projects) {
  const biz = db.businesses.find((b) => b.id === p.businessId);
  if (!biz) { bad(`${p.id}: unknown business`); continue; }
  if (p.acceptance.length < 3 || p.acceptance.length > 5) bad(`${p.id}: acceptance criteria must be 3 to 5`);
  if (p.hours > 25) bad(`${p.id}: hours > 25`);
  if (p.ventureId && !V.has(p.ventureId)) bad(`${p.id}: unknown venture`);
  if (p.studentId && !S.has(p.studentId)) bad(`${p.id}: unknown student`);
  for (const c of p.strengthenedBy) if (!C.has(c)) bad(`${p.id}: strengthenedBy ${c} not in catalog`);
  if ((p.payType as string) === "equity") bad(`${p.id}: equity`);
  if (p.payType === "volunteer" && !(VOLUNTEER_ELIGIBLE as readonly string[]).includes(biz.employerType)) bad(`${p.id}: volunteer for ${biz.employerType}`);
  if (p.payType === "volunteer" && p.pay !== 0) bad(`${p.id}: volunteer with pay`);
  const hrs = p.milestones.reduce((s, m) => s + m.hours, 0);
  if (Math.abs(hrs - p.hours) > 0.5) bad(`${p.id}: milestone hours ${hrs} != ${p.hours}`);
  if (p.payType === "stipend") {
    const amt = p.milestones.reduce((s, m) => s + m.amount, 0);
    if (Math.abs(amt - p.pay) > 1) bad(`${p.id}: milestone amounts ${amt} != pay ${p.pay}`);
  }
  if (p.status === "completed") {
    if (!db.reviews.some((r) => r.projectId === p.id)) bad(`${p.id}: completed without review`);
    if (!db.applications.some((a) => a.projectId === p.id && a.studentId === p.studentId && a.status === "accepted")) bad(`${p.id}: completed without accepted application`);
  }
  for (const d of [p.deadline, ...p.milestones.map((m) => m.dueAt)]) {
    const dt = new Date(d); const m = dt.getUTCMonth() + 1, day = dt.getUTCDate();
    if ((m === 12 && day >= 5 && day <= 22) || (m === 4 && day >= 10 && day <= 30)) if (p.status === "open") bad(`${p.id}: open deadline ${d} in exam window`);
  }
}
for (const b of db.businesses) if (b.employerType === "yspace_startup" && !db.ventures.some((v) => v.businessId === b.id)) bad(`${b.id}: yspace startup without venture`);
for (const v of db.ventures) {
  if (!B.has(v.businessId)) bad(`${v.id}: unknown business`);
  if (v.yspaceVerified && !v.founders.length) bad(`${v.id}: verified without founders`);
}
for (const a of db.applications) { if (!P.has(a.projectId) || !S.has(a.studentId)) bad(`${a.id}: dangling application`); }
for (const c of db.certClaims) {
  if (!S.has(c.studentId)) bad(`${c.id}: unknown student`);
  if (c.certId !== "other" && !C.has(c.certId)) bad(`${c.id}: unknown cert ${c.certId}`);
  if (!["issuer", "self"].includes(c.tier)) bad(`${c.id}: bad tier`);
}
for (const s of db.submissions) {
  if (!P.has(s.projectId)) bad(`${s.id}: unknown project`);
  if (s.checkId && !CK.has(s.checkId)) bad(`${s.id}: unknown check`);
  if (s.status === "approved" && !db.approvals.some((e) => e.submissionId === s.id)) bad(`${s.id}: approved without a poster approval`);
}
for (const e of db.approvals) if (!SUB.has(e.submissionId) || !B.has(e.businessId)) bad(`${e.id}: dangling approval`);
for (const h of db.pipeline) {
  if (!PipelineStage.safeParse(h.stage).success) bad(`${h.id}: bad stage`);
  if (!B.has(h.businessId) || !S.has(h.studentId) || !P.has(h.projectId)) bad(`${h.id}: dangling pipeline`);
  if (h.applicationId && !A.has(h.applicationId)) bad(`${h.id}: unknown application`);
  if (h.stage === "offer" && !db.projects.some((p) => p.businessId === h.businessId && p.studentId === h.studentId && p.status === "completed")) bad(`${h.id}: offer without completed project`);
}
for (const b of db.badges) if (!S.has(b.studentId) || !P.has(b.projectId)) bad(`${b.id}: dangling badge`);

const count = (n: string, got: number, want: number) => { if (Math.abs(got - want) > Math.max(3, want * 0.25)) bad(`${n}: ${got}, expected about ${want}`); };
count("students", db.students.length, 24);
count("posters", db.businesses.filter((b) => b.employerType !== "yspace_startup").length, 14);
count("ventures", db.ventures.length, 10);
count("projects", db.projects.length, 60);
count("applications", db.applications.length, 90);
count("threads", db.threads.length, 30);
count("notifications", db.notifications.length, 40);
if (db.catalog.length !== 16) bad(`catalog: ${db.catalog.length}, expected 16`);

if (errors.length) { console.error(`Validation failed (${errors.length}):`); for (const e of errors) console.error(" - " + e); process.exit(1); }
console.log(`Validation passed: ${db.projects.length} projects, ${db.applications.length} applications, ${db.threads.length} threads, ${db.reviews.length} reviews, ${db.notifications.length} notifications, ${db.catalog.length} catalog entries.`);
