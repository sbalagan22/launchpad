import { describe, it, expect, beforeEach } from "vitest";
import { useApp } from "@/store";
import { projects, certs, auth, ServiceError } from "@/services";
import type { VerifyEvent } from "@/services";
import { PublishInput } from "@/schemas";

beforeEach(() => {
  useApp.getState().reset();
});

const draft = (over: Partial<PublishInput> = {}): PublishInput => PublishInput.parse({
  businessId: "biz_corner", title: "Weekly deal tracker", hook: "Track deals", type: "data", description: "x", deliverables: ["A tracker"],
  milestones: [{ title: "Setup", hours: 4, dueInDays: 7 }, { title: "Finish", hours: 4, dueInDays: 14 }], skills: ["Excel"], tools: [], hours: 8,
  payType: "stipend", pay: 160, rubric: [{ criterion: "a", description: "a" }, { criterion: "b", description: "b" }, { criterion: "c", description: "c" }],
  badgeSkills: ["Excel"], beginnerFriendly: true, ...over,
});

async function run(certId: string, input: string): Promise<VerifyEvent[]> {
  const out: VerifyEvent[] = [];
  for await (const e of certs.verifyWithIssuer(certId, input)) out.push(e);
  return out;
}

describe("publish gate", () => {
  it("rejects a low skill yield project", async () => {
    await auth.loginDemo("poster");
    const p = await projects.create(draft({ title: "Data entry", description: "Repetitive data entry", deliverables: ["Spreadsheet"] }));
    const err = await projects.publish(p.id).catch((e) => e);
    expect(err).toBeInstanceOf(ServiceError);
    expect(err.code).toBe("low_yield");
  });
});

describe("pay rules", () => {
  it("blocks volunteer roles for for-profit posters", async () => {
    await auth.loginDemo("poster");
    await expect(projects.create(draft({ payType: "volunteer", pay: 0 }))).rejects.toBeInstanceOf(ServiceError);
  });
});

describe("issuer verification", () => {
  it("verifies a passing demo credential as issuer tier", async () => {
    await auth.loginDemo("student");
    const ev = await run("aws-clf", "K7M2P9Q4X8D1");
    const last = ev[ev.length - 1];
    expect(last.kind).toBe("done");
    if (last.kind === "done") expect(last.claim.tier).toBe("issuer");
  });
  it("fails a failing demo credential and never grants issuer tier", async () => {
    await auth.loginDemo("student");
    const ev = await run("aws-clf", "ZZZZ00000000");
    const last = ev[ev.length - 1];
    expect(last.kind).toBe("failed");
    const mine = await certs.myCerts();
    expect(mine.some((c) => c.claim.certId === "aws-clf" && c.claim.tier === "issuer")).toBe(false);
  });
  it("rejects a badly formatted credential", async () => {
    await auth.loginDemo("student");
    const last = (await run("aws-clf", "nope")).pop()!;
    expect(last.kind).toBe("failed");
  });
});
