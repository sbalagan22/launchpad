import { describe, it, expect } from "vitest";
import { computeSkillYield, PUBLISH_MIN_YIELD } from "@/lib/skill-yield";
import { computeMatch } from "@/lib/matching";
import { parseSafeUrl, isSafeRedirect, isAllowedHost } from "@/lib/verify-guard";
import { buildSeed } from "@/mocks/seed";
import { canMoveTo } from "@/services/pipeline";

const db = buildSeed();

describe("skill yield", () => {
  it("keeps repetitive admin-only work under the publish bar", () => {
    const r = computeSkillYield({ title: "Enter data into a spreadsheet", description: "Repetitive data entry and filing for the office", deliverables: ["Completed spreadsheet"], skills: ["Excel"], tools: [], hours: 20, milestones: [{ hours: 20 }, { hours: 0 }], reviewerCount: 1, rubricCount: 3 });
    expect(r.total).toBeLessThan(PUBLISH_MIN_YIELD);
  });
  it("scores a rich flagship project above the bar", () => {
    const p = db.projects.find((x) => x.id === "prj_board")!;
    const r = computeSkillYield({ ...p, milestones: p.milestones, reviewerCount: p.reviewerIds.length, rubricCount: p.rubric.length });
    expect(r.total).toBeGreaterThanOrEqual(80);
  });
});

describe("matching cert boost", () => {
  const student = db.students.find((s) => s.id === "stu_aisha")!;
  const project = db.projects.find((p) => p.strengthenedBy.length > 0 && p.status === "open")!;
  const cert = project.strengthenedBy[0];
  const base = { id: "c", studentId: student.id, certId: cert, status: "earned" as const, createdAt: new Date().toISOString() };
  const issuer = { ...base, tier: "issuer" as const, credentialRef: "x", issuedAt: new Date().toISOString() };
  const self = { ...base, tier: "self" as const };
  it("issuer boost beats self boost", () => {
    const a = computeMatch(student, project, [issuer], db.catalog).breakdown.certBoost.points;
    const b = computeMatch(student, project, [self], db.catalog).breakdown.certBoost.points;
    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(0);
  });
  it("gives no boost for certs the project does not list, or unearned ones", () => {
    expect(computeMatch(student, project, [{ ...issuer, certId: "not-listed" }], db.catalog).breakdown.certBoost.points).toBe(0);
    expect(computeMatch(student, project, [{ ...self, status: "planned" as const }], db.catalog).breakdown.certBoost.points).toBe(0);
  });
});

describe("SSRF guard", () => {
  it("accepts allowlisted https hosts", () => {
    expect(parseSafeUrl("https://www.credly.com/badges/abc")).not.toBeNull();
    expect(isAllowedHost("learn.microsoft.com")).toBe(true);
  });
  it.each([
    "http://www.credly.com/badges/abc", "https://127.0.0.1/x", "https://localhost/x", "https://169.254.169.254/latest", "https://user:pw@www.credly.com/x",
    "https://www.credly.com:8443/x", "https://[::1]/x", "https://2130706433/x", "https://internal/x", "not a url",
  ])("rejects %s", (u) => {
    expect(parseSafeUrl(u)).toBeNull();
  });
  it("does not allow arbitrary hosts or cross-host redirects", () => {
    expect(isAllowedHost("evil.example.com")).toBe(false);
    expect(isSafeRedirect("https://www.credly.com/a", "https://evil.example.com/b")).toBe(false);
  });
});

describe("pipeline transitions", () => {
  it("allows offer only after a finally approved project with the poster", () => {
    const e = db.pipeline.find((h) => h.stage !== "offer" && !db.projects.some((p) => p.businessId === h.businessId && p.studentId === h.studentId && p.status === "completed"));
    if (e) expect(canMoveTo(db, e, "offer").ok).toBe(false);
    const done = db.projects.find((p) => p.status === "completed" && p.studentId)!;
    const entry = { id: "h", businessId: done.businessId, studentId: done.studentId!, projectId: done.id, stage: "trial" as const, updatedAt: new Date().toISOString() };
    expect(canMoveTo(db, entry, "offer").ok).toBe(true);
    expect(canMoveTo(db, entry, "interviewing").ok).toBe(true);
  });
});
