import { describe, it, expect, beforeEach } from "vitest";
import { useApp } from "@/store";
import { projects, certs, auth, approvals, workspace, ServiceError } from "@/services";
import type { VerifyEvent } from "@/services";
import { PublishInput } from "@/schemas";

beforeEach(() => {
  useApp.getState().reset();
});

const draft = (over: Partial<PublishInput> = {}): PublishInput => PublishInput.parse({
  businessId: "biz_reroute", title: "Weekly deal tracker", hook: "Track deals", type: "data", description: "x", deliverables: ["A tracker"],
  milestones: [{ title: "Setup", hours: 4, dueInDays: 7 }, { title: "Finish", hours: 4, dueInDays: 14 }], skills: ["Excel"], tools: [], hours: 8,
  payType: "stipend", pay: 160, acceptance: ["Works on a phone", "Totals match the source", "README explains setup"],
  badgeSkills: ["Excel"], beginnerFriendly: true, ...over,
});

async function run(certId: string, input: string): Promise<VerifyEvent[]> {
  const out: VerifyEvent[] = [];
  for await (const e of certs.verifyWithIssuer(certId, input)) out.push(e);
  return out;
}

describe("publish gate", () => {
  it("rejects a draft with missing items and lists them", async () => {
    await auth.loginDemo("omar");
    const p = await projects.create(draft({ businessId: "biz_reroute", deliverables: [], acceptance: [] }));
    const err = await projects.publish(p.id).catch((e) => e);
    expect(err).toBeInstanceOf(ServiceError);
    expect(err.code).toBe("not_ready");
    expect((err.details as { missing: string[] }).missing.length).toBeGreaterThan(0);
  });
  it("publishes a complete draft", async () => {
    await auth.loginDemo("omar");
    const p = await projects.create(draft({ businessId: "biz_reroute" }));
    const out = await projects.publish(p.id);
    expect(out.status).toBe("open");
  });
});

describe("approvals", () => {
  it("approving the last milestone completes the project and unlocks a badge", async () => {
    await auth.loginDemo("omar");
    const sub = await approvals.pending();
    const first = sub.find((s) => s.project.id === "prj_reroute_mvp")!;
    const rs = first.project.acceptance.map((criterion) => ({ criterion, rating: 5 }));
    const r1 = await approvals.approve(first.submission.id, rs, "Looks great, thank you.");
    expect(r1.final).toBeNull();
    await auth.loginDemo("aisha");
    const ws = await workspace.getWorkspace("prj_reroute_mvp");
    const m3 = ws.project.milestones[2];
    expect(m3.status).toBe("in_progress");
    const { submission } = await workspace.submitMilestone(m3.id, ["https://reroute-demo.vercel.app"]);
    await auth.loginDemo("omar");
    const r2 = await approvals.approve(submission.id, rs, "Shipped and documented.");
    expect(r2.final?.badges.length).toBeGreaterThan(0);
    expect(r2.project.status).toBe("completed");
  });
});

describe("pay rules", () => {
  it("blocks volunteer roles for for-profit posters", async () => {
    await auth.loginDemo("omar");
    await expect(projects.create(draft({ payType: "volunteer", pay: 0 }))).rejects.toBeInstanceOf(ServiceError);
  });
});

describe("issuer verification", () => {
  it("verifies a passing demo credential as issuer tier", async () => {
    await auth.loginDemo("aisha");
    const ev = await run("aws-clf", "K7M2P9Q4X8D1");
    const last = ev[ev.length - 1];
    expect(last.kind).toBe("done");
    if (last.kind === "done") expect(last.claim.tier).toBe("issuer");
  });
  it("fails a failing demo credential and never grants issuer tier", async () => {
    await auth.loginDemo("aisha");
    const ev = await run("aws-clf", "ZZZZ00000000");
    const last = ev[ev.length - 1];
    expect(last.kind).toBe("failed");
    const mine = await certs.myCerts();
    expect(mine.some((c) => c.claim.certId === "aws-clf" && c.claim.tier === "issuer")).toBe(false);
  });
  it("rejects a badly formatted credential", async () => {
    await auth.loginDemo("aisha");
    const last = (await run("aws-clf", "nope")).pop()!;
    expect(last.kind).toBe("failed");
  });
});
