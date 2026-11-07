/* Referential-integrity check for the mock dataset. Run with: npm run validate:mocks */
import { Db } from "../src/schemas";
import { buildSeed } from "../src/mocks/seed";
import { DEMO_CREDENTIAL_IDS } from "../src/mocks/certifications";

const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);
const seed = buildSeed();

const parsed = Db.safeParse(seed);
if (!parsed.success) for (const i of parsed.error.issues) fail(`schema: ${i.path.join(".")}: ${i.message}`);

const uniq = (name: string, ids: string[]) => {
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) fail(`${name}: duplicate ids ${dup.join(", ")}`);
};
for (const [k, v] of Object.entries(seed)) uniq(k, (v as { id: string }[]).map((x) => x.id));

const ids = (rows: { id: string }[]) => new Set(rows.map((r) => r.id));
const S = ids(seed.students), B = ids(seed.businesses), P = ids(seed.projects), C = ids(seed.certifications), K = ids(seed.checks);
const must = (set: Set<string>, id: string | undefined | null, what: string) => { if (id && !set.has(id)) fail(`dangling ${what}: ${id}`); };

// counts promised in the brief
const counts: [string, number, number][] = [
  ["students", seed.students.length, 12], ["businesses", seed.businesses.length, 15], ["projects", seed.projects.length, 30],
  ["applications", seed.applications.length, 40], ["threads", seed.threads.length, 15], ["reviews", seed.reviews.length, 20],
  ["notifications", seed.notifications.length, 25], ["certifications", seed.certifications.length, 20], ["submissions", seed.submissions.length, 10],
];
for (const [n, got, want] of counts) if (got !== want) fail(`${n}: expected ${want}, got ${got}`);

for (const p of seed.projects) {
  must(B, p.businessId, `${p.id}.businessId`); must(S, p.studentId, `${p.id}.studentId`);
  const biz = seed.businesses.find((b) => b.id === p.businessId);
  if (p.payType === "volunteer" && biz?.kind !== "nonprofit") fail(`${p.id}: volunteer project at a for-profit business`);
  if (p.payType === "volunteer" && p.pay !== 0) fail(`${p.id}: volunteer project has pay`);
  if (p.hours > 25) fail(`${p.id}: hours > 25`);
  if (p.milestones.length < 2 || p.milestones.length > 4) fail(`${p.id}: milestones not 2-4`);
  const sum = p.milestones.reduce((a, m) => a + m.amount, 0);
  if (sum !== p.pay) fail(`${p.id}: milestone amounts ${sum} != pay ${p.pay}`);
  if (p.status === "open" && p.studentId) fail(`${p.id}: open project has a student`);
  if (p.status !== "open" && !p.studentId) fail(`${p.id}: ${p.status} project has no student`);
  if (p.status === "completed" && !p.milestones.every((m) => m.status === "approved")) fail(`${p.id}: completed with unapproved milestones`);
  if (p.status === "completed" && !seed.reviews.some((r) => r.projectId === p.id)) fail(`${p.id}: completed without a review`);
  if (p.status !== "open") {
    const acc = seed.applications.filter((a) => a.projectId === p.id && a.status === "accepted");
    if (acc.length !== 1 || acc[0].studentId !== p.studentId) fail(`${p.id}: needs exactly one accepted application from its student`);
  } else if (seed.applications.some((a) => a.projectId === p.id && a.status === "accepted")) fail(`${p.id}: open project with accepted application`);
}
for (const a of seed.applications) { must(P, a.projectId, `${a.id}.projectId`); must(S, a.studentId, `${a.id}.studentId`); }
const dupApps = seed.applications.filter((a, i) => seed.applications.findIndex((b) => b.projectId === a.projectId && b.studentId === a.studentId) !== i);
if (dupApps.length) fail(`duplicate applications: ${dupApps.map((a) => a.id).join(", ")}`);

for (const t of seed.threads) {
  must(P, t.projectId, `${t.id}.projectId`); must(S, t.studentId, `${t.id}.studentId`); must(B, t.businessId, `${t.id}.businessId`);
  if (t.messages.length < 5 || t.messages.length > 12) fail(`${t.id}: ${t.messages.length} messages`);
  const p = seed.projects.find((x) => x.id === t.projectId);
  if (p && (p.studentId !== t.studentId || p.businessId !== t.businessId)) fail(`${t.id}: parties do not match project`);
  for (let i = 1; i < t.messages.length; i++) if (t.messages[i].at < t.messages[i - 1].at) fail(`${t.id}: messages out of order at ${i}`);
}
for (const r of seed.reviews) {
  must(P, r.projectId, `${r.id}.projectId`); must(S, r.studentId, `${r.id}.studentId`); must(B, r.businessId, `${r.id}.businessId`);
  const p = seed.projects.find((x) => x.id === r.projectId);
  if (p && p.studentId !== r.studentId) fail(`${r.id}: reviewed student is not the project's student`);
}
for (const n of seed.notifications) if (!S.has(n.userId) && !B.has(n.userId)) fail(`${n.id}: unknown user ${n.userId}`);
for (const c of seed.certClaims) { must(S, c.studentId, `${c.id}.studentId`); must(C, c.certId, `${c.id}.certId`); if (c.tier === "self" && c.verified) fail(`${c.id}: self-reported claim marked verified`); }
for (const s of seed.submissions) {
  must(P, s.projectId, `${s.id}.projectId`); must(S, s.studentId, `${s.id}.studentId`); must(K, s.checkId, `${s.id}.checkId`);
  const p = seed.projects.find((x) => x.id === s.projectId);
  if (p && !p.milestones.some((m) => m.id === s.milestoneId)) fail(`${s.id}: milestone not in project`);
}
for (const b of seed.badges) {
  must(S, b.studentId, `${b.id}.studentId`); must(P, b.projectId, `${b.id}.projectId`); must(K, b.checkId, `${b.id}.checkId`);
  const sk = seed.students.find((s) => s.id === b.studentId)?.skills.find((k) => k.name === b.skill);
  if (!sk || sk.trust === "self") fail(`${b.id}: badge skill ${b.skill} not verified on student`);
}
for (const s of seed.students) for (const k of s.skills) if (k.trust === "checked" && !seed.badges.some((b) => b.studentId === s.id && b.skill === k.name) && !seed.certClaims.some((c) => c.studentId === s.id && c.tier === "checked" && seed.certifications.find((x) => x.id === c.certId)?.skills.includes(k.name))) fail(`${s.id}: ${k.name} is "checked" without evidence`);
const perStudent = new Map<string, number>();
for (const p of seed.projects) if (p.status === "completed" && p.studentId) perStudent.set(p.studentId, (perStudent.get(p.studentId) ?? 0) + 1);
for (const [s, n] of perStudent) if (n > 3) fail(`${s}: ${n} completed projects (max 3)`);
for (const c of seed.certClaims.filter((x) => x.tier !== "self")) if (!c.credentialId && c.tier === "issuer") fail(`${c.id}: issuer claim without credential id`);
for (const [id, v] of Object.entries(DEMO_CREDENTIAL_IDS)) must(C, v.certId, `demo credential ${id}`);
for (const s of seed.students) if (seed.certClaims.filter((c) => c.studentId === s.id).length > 4) fail(`${s.id}: more than 4 certs`);
for (const b of seed.businesses) if (!["Brampton", "Mississauga", "Toronto"].includes(b.city)) fail(`${b.id}: city ${b.city}`);
const aisha = seed.students.find((s) => s.id === "stu_aisha");
if (!aisha) fail("featured student Aisha Khan missing");

if (errors.length) {
  console.error(`Mock integrity check FAILED (${errors.length} problems):`);
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}
console.log(`Mock integrity check passed: ${Object.entries(seed).map(([k, v]) => `${v.length} ${k}`).join(", ")}.`);
