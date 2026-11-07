import { z } from "zod";
import { CertClaim, Certification, Id, ProjectType } from "@/schemas";
import { ClaimView } from "@/schemas/views";
import { DEMO_CREDENTIAL_IDS } from "@/mocks/certifications";
import { bumpSkill } from "@/lib/trust";
import { newId } from "@/lib/ids";
import { ServiceError, latency, parseInput, read, write } from "./core";
import { getDb } from "@/store";

export async function listCertifications() {
  return read(z.array(Certification), (db) => db.certifications);
}

export async function listClaims(studentId: string) {
  return read(z.array(ClaimView), (db) =>
    db.certClaims.filter((c) => c.studentId === studentId).map((claim) => ({ claim, cert: db.certifications.find((c) => c.id === claim.certId)! })),
  );
}

const LookupResult = z.object({ ok: z.literal(true), certId: Id, certName: z.string(), provider: z.string(), issuedTo: z.string(), issued: z.string(), credentialId: z.string() });

/** MOCK: simulated issuer lookup. Only a fixed set of demo credential IDs (or matching URLs) is accepted. */
export async function lookupCredential(studentId: string, raw: string) {
  const input = parseInput(z.string().trim().min(4, "Enter a credential ID or verification URL."), raw);
  await latency(900, 1500);
  const db = getDb();
  const id = Object.keys(DEMO_CREDENTIAL_IDS).find((k) => input.toUpperCase().includes(k));
  if (!id) throw new ServiceError("not_found", "The issuer could not confirm that credential. Check the ID, or add it as self-reported instead.");
  const hit = DEMO_CREDENTIAL_IDS[id];
  const student = db.students.find((s) => s.id === studentId);
  if (!student) throw new ServiceError("not_found", "Student not found");
  if (hit.issuedTo !== student.name) throw new ServiceError("name_mismatch", `That credential was issued to a different person. The name on file does not match ${student.name}.`);
  if (db.certClaims.some((c) => c.studentId === studentId && c.certId === hit.certId && c.verified)) throw new ServiceError("duplicate", "That certification is already verified on your profile.");
  const cert = db.certifications.find((c) => c.id === hit.certId)!;
  return LookupResult.parse({ ok: true, certId: cert.id, certName: cert.name, provider: cert.issuedVia ? `${cert.provider} through ${cert.issuedVia}` : cert.provider, issuedTo: hit.issuedTo, issued: hit.issued, credentialId: id });
}

function withClaim(studentId: string, certId: string, tier: CertClaim["tier"], extra: Partial<CertClaim>) {
  return write(CertClaim, (db) => {
    const cert = db.certifications.find((c) => c.id === certId);
    if (!cert) throw new ServiceError("not_found", "Certification not found");
    const prior = db.certClaims.find((c) => c.studentId === studentId && c.certId === certId);
    if (prior && prior.verified) throw new ServiceError("duplicate", "That certification is already verified on your profile.");
    const claim: CertClaim = { id: newId("clm"), studentId, certId, tier, verified: tier !== "self", issuedAt: new Date().toISOString(), ...extra };
    const claims = [...db.certClaims.filter((c) => c.id !== prior?.id), claim];
    const students = db.students.map((s) => {
      if (s.id !== studentId || tier === "self") return s; // a self-reported claim never changes skill trust
      let skills = s.skills;
      const ev = [{ label: tier === "issuer" ? `${cert.name} Certificate` : `${cert.name} skills quiz` }];
      for (const name of cert.skills) if (tier === "issuer" || skills.some((k) => k.name === name)) skills = bumpSkill(skills, name, tier, ev);
      return { ...s, skills };
    });
    return { db: { ...db, certClaims: claims, students }, result: claim };
  });
}

export async function confirmIssuerClaim(studentId: string, credentialId: string) {
  const hit = DEMO_CREDENTIAL_IDS[credentialId];
  if (!hit) throw new ServiceError("not_found", "Unknown credential.");
  return withClaim(studentId, hit.certId, "issuer", { credentialId });
}

export async function addSelfReported(studentId: string, certId: string, fileName?: string) {
  // A plain upload is only an attachment. It is stored by name and never marks the claim verified.
  return withClaim(studentId, certId, "self", fileName ? { fileName } : {});
}

/* ---------------- Skill-check quiz ---------------- */
export const QuizQuestion = z.object({ q: z.string(), options: z.array(z.string()).length(3), answer: z.number().int().min(0).max(2) });
export type QuizQuestion = z.infer<typeof QuizQuestion>;

// MOCK: short hand-written quizzes per field. Pass mark is 2 of 3.
const QUIZZES: Record<string, QuizQuestion[]> = {
  Design: [
    { q: "A user cannot find the checkout button. Which change most directly helps?", options: ["Make it larger and higher contrast", "Add an animation", "Rename it to a clever phrase"], answer: 0 },
    { q: "What is a wireframe for?", options: ["Final brand colours", "Testing layout and flow before visual design", "Writing production code"], answer: 1 },
    { q: "Why test a design with five real users?", options: ["To find most major usability problems early", "To prove the design is finished", "To replace analytics"], answer: 0 },
  ],
  "Web development": [
    { q: "Which element is best for the main navigation links?", options: ["<div>", "<nav>", "<span>"], answer: 1 },
    { q: "What does a mobile-first stylesheet do?", options: ["Starts with small-screen styles and adds rules for larger screens", "Hides content on phones", "Uses only fixed widths"], answer: 0 },
    { q: "An image conveys meaning. What should its alt text do?", options: ["Be left empty", "Describe what the image communicates", "Repeat the file name"], answer: 1 },
  ],
  Data: [
    { q: "Two rows are identical except for a trailing space in the name. What is this?", options: ["A duplicate caused by inconsistent formatting", "Valid distinct records", "A formula error"], answer: 0 },
    { q: "Which chart best shows change over time?", options: ["Line chart", "Pie chart", "Word cloud"], answer: 0 },
    { q: "Why keep a change log when cleaning data?", options: ["So every change can be reviewed or reversed", "To make files larger", "It is not needed"], answer: 0 },
  ],
  Marketing: [
    { q: "What should a social media plan define first?", options: ["The audience and goal", "The hashtag list", "The posting time"], answer: 0 },
    { q: "Which metric best shows an email subject line worked?", options: ["Open rate", "Number of images", "Word count"], answer: 0 },
    { q: "A post performs far better than others. What next?", options: ["Ignore it", "Learn why and test similar content", "Delete older posts"], answer: 1 },
  ],
  Business: [
    { q: "A milestone slips by a week. What helps most?", options: ["Tell the client early with a revised plan", "Stay quiet and catch up", "Drop the milestone"], answer: 0 },
    { q: "What does a scope statement prevent?", options: ["Unplanned extra work", "All deadlines", "Client feedback"], answer: 0 },
    { q: "Which is a deliverable?", options: ["A finished one-page client handout", "A weekly meeting", "A risk"], answer: 0 },
  ],
  "IT and cloud": [
    { q: "Which practice most reduces account takeover risk?", options: ["Multi-factor authentication", "Longer file names", "Weekly restarts"], answer: 0 },
    { q: "What does cloud 'pay as you go' mean?", options: ["You pay for what you use", "You prepay for a year", "Software is free"], answer: 0 },
    { q: "Why keep backups in a separate location?", options: ["A failure in one place will not destroy all copies", "To save disk space", "It makes files faster"], answer: 0 },
  ],
};

export async function getQuiz(certId: string) {
  return read(z.array(QuizQuestion), (db) => {
    const cert = db.certifications.find((c) => c.id === certId);
    if (!cert) throw new ServiceError("not_found", "Certification not found");
    return QUIZZES[cert.field] ?? QUIZZES["Business"];
  });
}

export async function submitQuiz(studentId: string, certId: string, answers: number[]) {
  const quiz = QUIZZES[getDb().certifications.find((c) => c.id === certId)?.field ?? ""] ?? QUIZZES["Business"];
  const score = quiz.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);
  if (score < 2) {
    await latency();
    return { passed: false as const, score, total: quiz.length };
  }
  const claim = await withClaim(studentId, certId, "checked", {});
  return { passed: true as const, score, total: quiz.length, claim };
}

/* ---------------- Cert path recommender ---------------- */
export const Recommendation = z.object({ cert: Certification, unlocks: z.array(ProjectType), reason: z.string(), openProjects: z.number().int() });
export type Recommendation = z.infer<typeof Recommendation>;

export async function recommendPath(studentId: string, targets: z.input<typeof ProjectType>[]) {
  const types = parseInput(z.array(ProjectType).min(1, "Pick at least one project type."), targets);
  return read(z.array(Recommendation), (db) => {
    const held = new Set(db.certClaims.filter((c) => c.studentId === studentId && c.verified).map((c) => c.certId));
    const student = db.students.find((s) => s.id === studentId);
    const have = new Set((student?.skills ?? []).filter((k) => k.trust !== "self").map((k) => k.name));
    return db.certifications
      .filter((c) => !held.has(c.id))
      .map((cert) => {
        const unlocks = cert.unlocks.filter((t) => types.includes(t));
        const newSkills = cert.skills.filter((s) => !have.has(s));
        const openProjects = db.projects.filter((p) => p.status === "open" && unlocks.includes(p.type)).length;
        return { cert, unlocks, newSkills, openProjects };
      })
      .filter((r) => r.unlocks.length > 0 && r.newSkills.length > 0)
      .sort((a, b) => b.unlocks.length - a.unlocks.length || b.openProjects - a.openProjects || a.cert.hours - b.cert.hours)
      .slice(0, 6)
      .map((r) => ({ cert: r.cert, unlocks: r.unlocks, openProjects: r.openProjects, reason: `Verifies ${r.newSkills.slice(0, 3).join(", ")}. About ${r.cert.hours} hours. ${r.openProjects} open ${r.openProjects === 1 ? "project needs" : "projects need"} this kind of work.` }));
  });
}
