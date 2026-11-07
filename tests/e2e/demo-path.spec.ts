import { expect, test } from "@playwright/test";

// The 2-minute demo path: business scopes and publishes the bakery request, Aisha applies,
// the business accepts, Aisha submits her site, the check runs, the business approves and
// rates, and a verified Web Development badge lands on her public profile.
test("demo path: bakery request to verified badge", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "I'm a business" }).first().click();
  await expect(page).toHaveURL(/\/business\/new/);

  // 1. AI scopes the bakery request
  await expect(page.getByLabel("Describe what you need")).toHaveValue(/online order form/);
  await page.getByRole("button", { name: "Scope project" }).click();
  await expect(page.getByTestId("scope-result")).toBeVisible();
  await expect(page.getByTestId("ai-note")).toContainText("AI-generated, please review");
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("Bakery website");
  await page.getByRole("button", { name: "Publish project" }).click();
  await expect(page.getByTestId("published-banner")).toContainText("Bakery website is published");

  // 2. Aisha sees it at the top of her feed with a high match
  await page.getByRole("button", { name: "Student view" }).click();
  await expect(page).toHaveURL(/\/projects$/);
  const firstRow = page.getByRole("row").nth(1);
  await expect(firstRow).toContainText("Bakery website");
  await expect(firstRow).toContainText("New");
  const pct = Number((await firstRow.textContent())?.match(/(\d+)%/)?.[1]);
  expect(pct).toBeGreaterThanOrEqual(85);

  // 3. She applies with the drafted proposal
  await firstRow.getByRole("link", { name: /Bakery website/ }).click();
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  const proposal = page.getByRole("dialog").getByRole("textbox");
  await expect(page.getByRole("button", { name: "Send proposal" })).toBeEnabled({ timeout: 20_000 });
  await expect(proposal).toHaveValue(/Aisha/);
  await page.getByRole("button", { name: "Send proposal" }).click();
  await expect(page.getByRole("heading", { name: "Proposal sent" })).toBeVisible();

  // 4. The business accepts her
  await page.getByRole("button", { name: /Continue as Sunrise Bakery/ }).click();
  await expect(page).toHaveURL(/\/business\/projects\//);
  await page.getByRole("button", { name: /Aisha Khan/ }).click();
  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByText("In progress", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Student", { exact: true })).toBeVisible();

  // 5. Aisha submits her site and the automated check runs
  await page.getByRole("button", { name: "Student view" }).click();
  await page.getByRole("link", { name: "Workspace", exact: true }).click();
  await page.getByRole("link", { name: "Bakery website" }).first().click();
  await expect(page.getByRole("heading", { name: "Bakery website" })).toBeVisible();
  await expect(page.getByLabel("Link to your work")).toHaveValue(/sunrise-bakery-demo/);
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByTestId("check-progress")).toBeVisible();
  await expect(page.getByTestId("check-result")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("check-result")).toContainText("Accessibility");

  // 6. The business approves, then leaves the final review
  await page.getByRole("button", { name: "Business view" }).click();
  await page.getByRole("button", { name: /Approve and release/ }).click();
  await expect(page.getByRole("radio", { name: "5 stars" })).toBeVisible();
  await page.getByRole("radio", { name: "5 stars" }).click();
  await page.getByLabel("Review", { exact: true }).fill("Aisha delivered a clear, fast site and handled every change quickly.");
  await page.getByRole("button", { name: "Submit review" }).click();
  await expect(page.getByText("No finished projects to rate")).toBeVisible();

  // 7. The verified badge with evidence is on her public profile
  await page.goto("/u/aisha-khan");
  const skill = page.locator('[data-skill="Web Development"]');
  await expect(skill).toHaveAttribute("data-trust", "checked");
  await expect(skill).toContainText("Evidence: Bakery website, Sunrise Bakery");
  await expect(page.getByTestId("completed-project").first()).toContainText("Bakery website");

  // 8. End on the impact dashboard
  await page.getByRole("link", { name: "Impact", exact: true }).click();
  await expect(page.getByTestId("impact-stats")).toContainText("Students placed");
});

test("smoke: key pages render and reset restores the seed", async ({ page }) => {
  for (const path of ["/", "/login", "/projects", "/skills", "/profile", "/messages", "/notifications", "/impact", "/u/aisha-khan"]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBeLessThan(400);
  }
  await page.goto("/impact");
  await expect(page.getByTestId("impact-stats")).toContainText("Hours contributed");
  await page.keyboard.press("Control+Shift+D");
  await expect(page.getByRole("dialog", { name: "Developer menu" })).toBeVisible();
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await expect(page).toHaveURL(/\/$/);
});
