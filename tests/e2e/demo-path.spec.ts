import { expect, test, type Page } from "@playwright/test";

// The demo script from demo_personas.md, run once with normal motion and once with reduced motion.
const GH_PASS = "https://www.credly.com/badges/3f9a1c2e-5b7d-4e8a-9c01-2d6f8b4a7e10";
const AZ_FAIL = "https://learn.microsoft.com/en-us/users/marcuschen-9911/credentials/az900-1f2e3d4c5b6a7988";

async function login(page: Page, who: "aisha" | "priya" | "omar", home: RegExp) {
  await page.goto("/login");
  await page.getByTestId(`role-${who}`).click();
  await expect(page).toHaveURL(home);
}

async function approveFirst(page: Page, review: string) {
  await page.goto("/business/approvals");
  const panel = page.getByTestId("approval-panel").first();
  await expect(panel).toBeVisible();
  for (const group of await panel.getByRole("radiogroup").all()) await group.getByRole("radio", { name: "5 stars" }).click();
  await panel.getByLabel("Your review").fill(review);
  await panel.getByTestId("approve-btn").click();
  await expect(page.getByText(/Milestone approved\.|Final approval given/)).toBeVisible();
}

for (const reduced of [false, true]) {
  test.describe(reduced ? "reduced motion" : "normal motion", () => {
    test.use({ reducedMotion: reduced ? "reduce" : "no-preference" });

    test("demo script end to end", async ({ page }) => {
      // 1. Fares posts "Instrument the Waitlist" from a streamed brief.
      await login(page, "omar", /\/founder/);
      await page.goto("/business/new");
      await page.getByTestId("raw-input").fill("we want to see where people drop off on our waitlist page");
      await page.getByTestId("generate").click();
      await expect(page.getByTestId("brief")).toBeVisible();
      await expect(page.getByLabel("Title")).toHaveValue("Instrument the Waitlist", { timeout: 30_000 });
      await expect(page.getByTestId("ai-note")).toBeVisible();
      await page.getByTestId("publish").click();
      await expect(page).toHaveURL(/\/business\/projects\/prj_/);
      const projectUrl = page.url();

      // 2. Aisha sees the new match and applies.
      await login(page, "aisha", /\/dashboard/);
      await page.goto("/projects");
      await page.getByLabel("Search projects").fill("Instrument");
      const card = page.getByTestId("project-card").filter({ hasText: "Instrument the Waitlist" });
      await expect(card).toBeVisible();
      expect(Number(await card.getByTestId("match-ring").getAttribute("data-score"))).toBeGreaterThanOrEqual(80);
      await card.getByRole("link", { name: "Instrument the Waitlist" }).click();
      await page.getByTestId("apply-open").click();
      await page.getByLabel("Your proposal").fill("I have used SQL and JavaScript for a lab project and would start by listing the events to track. I can give about 10 hours a week.");
      await page.getByTestId("apply-submit").click();
      await expect(page.getByText("You applied")).toBeVisible();

      // 3. Fares accepts her, then approves her pending Reroute MVP milestone 2.
      await login(page, "omar", /\/founder/);
      await page.goto(projectUrl);
      await page.getByTestId("applicant").filter({ hasText: "Aisha Khan" }).getByTestId("accept-btn").click();
      await expect(page.getByTestId("ws-detail")).toBeVisible();
      await approveFirst(page, "Milestone 2 is great. The map view loads fast and the README is clear.");

      // 4. Aisha: notification, finishes milestone 3, final approval, badge and evidence.
      await login(page, "aisha", /\/dashboard/);
      await page.goto("/notifications");
      await expect(page.getByText("Milestone 2 approved")).toBeVisible();
      await page.goto("/workspace/prj_reroute_mvp");
      await page.getByLabel("Link to your work").fill("https://reroute-first-version.vercel.app");
      await page.getByTestId("submit-milestone").click();
      await expect(page.getByText("Submitted. The poster has been notified.")).toBeVisible();
      await login(page, "omar", /\/founder/);
      await approveFirst(page, "Shipped, documented and fast. Thank you.");
      await expect(page.getByText("Project complete").first()).toBeVisible();
      await login(page, "aisha", /\/dashboard/);
      await page.goto("/workspace/prj_reroute_mvp");
      await expect(page.getByText("Project complete").first()).toBeVisible();
      await page.goto("/profile");
      await expect(page.getByTestId("evidence").filter({ hasText: "Build the First Working Version of the Reroute App" })).toBeVisible();
      await expect(page.getByText("approved by the poster", { exact: false }).first()).toBeVisible();

      // Certifications: passing demo ID verifies, failing ID falls back to self-reported.
      await page.goto("/certifications");
      await page.getByTestId("add-cert").click();
      await page.getByLabel("Certification", { exact: true }).selectOption("gh-foundations");
      await page.getByRole("button", { name: "Continue" }).click();
      await page.getByLabel("Credential ID or verification link").fill(GH_PASS);
      await page.getByTestId("verify-btn").click();
      await expect(page.getByTestId("verify-ok")).toBeVisible({ timeout: 30_000 });
      await page.getByRole("button", { name: "Done" }).click();
      await page.getByTestId("add-cert").click();
      await page.getByLabel("Certification", { exact: true }).selectOption("azure-az900");
      await page.getByRole("button", { name: "Continue" }).click();
      await page.getByLabel("Credential ID or verification link").fill(AZ_FAIL);
      await page.getByTestId("verify-btn").click();
      await expect(page.getByTestId("verify-fail")).toBeVisible({ timeout: 30_000 });
      await page.getByRole("button", { name: "Add as self-reported" }).click();
      await page.goto("/profile");
      await expect(page.getByTestId("cert-issuer").filter({ hasText: "GitHub Foundations" })).toBeVisible();
      await expect(page.getByTestId("cert-self").filter({ hasText: "Azure" })).toBeVisible();

      // 5. Fares moves Aisha to Trial and sends Invite to continue.
      await login(page, "omar", /\/founder/);
      const cand = page.getByTestId("candidate").filter({ hasText: "Aisha Khan" }).first();
      await cand.getByLabel("Move to stage").selectOption("trial");
      await expect(page.getByTestId("col-trial").getByTestId("candidate").filter({ hasText: "Aisha Khan" })).toBeVisible();
      await page.getByTestId("col-trial").getByTestId("candidate").filter({ hasText: "Aisha Khan" }).getByTestId("invite-btn").click();
      await expect(page.getByText("Invite sent, pending")).toBeVisible();

      // 6. Priya: workspace, thread with Fares, certification roadmap.
      await login(page, "priya", /\/dashboard/);
      await page.goto("/workspace");
      await expect(page.getByTestId("ws-detail")).toContainText("Customer Discovery and Pricing");
      await page.goto("/messages");
      await page.getByTestId("thread-row").filter({ hasText: "Fares Tamraz" }).click();
      await expect(page.getByTestId("context-card")).toBeVisible();
      await page.goto("/certifications");
      await expect(page.getByTestId("road-earned")).toContainText("Google Data Analytics");

      // 7. End on the impact page.
      await page.goto("/impact");
      await expect(page.getByRole("heading", { name: "Impact" })).toBeVisible();
    });
  });
}
