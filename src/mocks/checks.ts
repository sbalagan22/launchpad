import type { CheckResult, Project, Submission } from "@/schemas";
import { daysFromNow } from "@/lib/dates";

type Row = Omit<CheckResult, "id" | "checkedAt">;

// MOCK: deliverable check results keyed by URL (11 entries: 10 tied to seeded submissions
// plus the default demo URL). Includes warning and failing cases so the check feels real.
export const MOCK_CHECKS: Record<string, Row> = {
  "https://sunrise-bakery-demo.netlify.app": { url: "https://sunrise-bakery-demo.netlify.app", reachable: true, httpStatus: 200, loadSeconds: 1.2, mobile: 94, accessibility: 92, seo: 90, status: "pass", issues: ["Two images are missing alt text", "The order button has low contrast against the background"], summary: "The staging site loads in 1.2 seconds and adapts to mobile widths. Two images are missing alt text and the order button has low contrast. Fixing both would raise the accessibility score above 95." },
  "https://sunrise-menuboard.netlify.app": { url: "https://sunrise-menuboard.netlify.app", reachable: true, httpStatus: 200, loadSeconds: 0.9, mobile: 96, accessibility: 95, seo: 88, status: "pass", issues: [], summary: "The menu board loads in under a second and text stays readable at large sizes. No accessibility errors were found." },
  "https://peel-newsletter-preview.netlify.app": { url: "https://peel-newsletter-preview.netlify.app", reachable: true, httpStatus: 200, loadSeconds: 1.1, mobile: 90, accessibility: 88, seo: 70, status: "pass", issues: ["Heading order skips a level"], summary: "The email template renders cleanly at phone width. One heading skips a level, which screen readers may announce oddly." },
  "https://ledger-intake-staging.vercel.app": { url: "https://ledger-intake-staging.vercel.app", reachable: false, httpStatus: 404, loadSeconds: null, mobile: 0, accessibility: 0, seo: 0, status: "fail", issues: ["The link returned a 404 error", "No page content could be checked"], summary: "The submitted link could not be reached (404). Nothing could be checked. Confirm the staging site is deployed and the link is public, then resubmit." },
  "https://spice-route-refresh.netlify.app": { url: "https://spice-route-refresh.netlify.app", reachable: true, httpStatus: 200, loadSeconds: 3.4, mobile: 58, accessibility: 74, seo: 81, status: "warn", issues: ["Page takes 3.4 seconds to load on a mobile connection", "Hero image is 2.8 MB", "Comparison table overflows on screens narrower than 380 px", "Three form fields are missing labels"], summary: "The site works, but it loads slowly on mobile because of an oversized hero image, and the comparison table is cut off on small phones. Compressing the image and labelling the form fields would fix most of the score." },
  "https://bysl-register.netlify.app": { url: "https://bysl-register.netlify.app", reachable: true, httpStatus: 200, loadSeconds: 0.8, mobile: 97, accessibility: 96, seo: 92, status: "pass", issues: [], summary: "A fast, accessible registration page. Fields are labelled and keyboard navigation works end to end." },
  "https://northgate-booking.netlify.app": { url: "https://northgate-booking.netlify.app", reachable: true, httpStatus: 200, loadSeconds: 1.5, mobile: 88, accessibility: 85, seo: 79, status: "pass", issues: ["Date picker has no visible focus outline"], summary: "The booking page is quick and works on mobile. Keyboard users cannot see which date is focused, which is the main thing to fix." },
  "https://halton-donate-fix.netlify.app": { url: "https://halton-donate-fix.netlify.app", reachable: true, httpStatus: 200, loadSeconds: 1.0, mobile: 93, accessibility: 91, seo: 85, status: "pass", issues: ["One decorative image has redundant alt text"], summary: "The donation form works on current and older mobile browsers and shows clear error messages." },
  "https://riverside-waitlist-report.netlify.app": { url: "https://riverside-waitlist-report.netlify.app", reachable: true, httpStatus: 200, loadSeconds: 2.1, mobile: 76, accessibility: 82, seo: 60, status: "warn", issues: ["Charts have no text alternative", "Page title is generic"], summary: "The report loads and reads well, but the charts have no text description for screen readers and the page title is generic." },
  "https://brightsmile-noshow.netlify.app": { url: "https://brightsmile-noshow.netlify.app", reachable: true, httpStatus: 200, loadSeconds: 1.8, mobile: 84, accessibility: 78, seo: 66, status: "warn", issues: ["Low-contrast grey labels on two charts", "No meta description"], summary: "The dashboard is clear and responsive. Two chart labels are too light to read comfortably, and search metadata is missing." },
  "https://ledger-expenses-report.netlify.app": { url: "https://ledger-expenses-report.netlify.app", reachable: true, httpStatus: 200, loadSeconds: 1.3, mobile: 91, accessibility: 90, seo: 77, status: "pass", issues: [], summary: "A tidy, fast report page. No blocking accessibility issues were found." },
};

const SUBMISSION_URLS: Record<string, string> = {
  prj_07: "https://peel-newsletter-preview.netlify.app",
  prj_08: "https://ledger-intake-staging.vercel.app",
  prj_10: "https://spice-route-refresh.netlify.app",
  prj_11: "https://sunrise-menuboard.netlify.app",
  prj_13: "https://bysl-register.netlify.app",
  prj_14: "https://northgate-booking.netlify.app",
  prj_17: "https://riverside-waitlist-report.netlify.app",
  prj_18: "https://brightsmile-noshow.netlify.app",
  prj_25: "https://halton-donate-fix.netlify.app",
  prj_29: "https://ledger-expenses-report.netlify.app",
};

export function seedChecks(): CheckResult[] {
  return Object.values(MOCK_CHECKS).map((r, i) => ({ ...r, id: `chk_${String(i + 1).padStart(2, "0")}`, checkedAt: daysFromNow(-(i + 1) * 4) }));
}

/** MOCK: 10 seeded submissions, each tied to a mock check result. */
export function seedSubmissions(projects: Project[], checks: CheckResult[]): Submission[] {
  return Object.entries(SUBMISSION_URLS).map(([projectId, url], i) => {
    const p = projects.find((x) => x.id === projectId)!;
    const check = checks.find((c) => c.url === url)!;
    const current = p.milestones.find((m) => m.status === "in_review" || m.status === "in_progress");
    const lastApproved = [...p.milestones].reverse().find((m) => m.status === "approved");
    let m = lastApproved ?? p.milestones[0];
    let status: Submission["status"] = "approved";
    if (p.status === "in_review" && current) { m = current; status = "pending_review"; }
    else if (p.status === "in_progress" && check.status === "fail" && current) { m = current; status = "changes_requested"; }
    return {
      id: `sub_${String(i + 1).padStart(2, "0")}`, projectId, milestoneId: m.id, studentId: p.studentId!, url, fileNames: [], final: m.id === p.milestones[p.milestones.length - 1].id,
      checkId: check.id, status, submittedAt: status === "approved" ? (m.approvedAt ?? daysFromNow(-20)) : daysFromNow(-1 - (i % 2)),
      ...(status === "changes_requested" ? { note: "The staging link returned a 404. Please redeploy and resubmit." } : {}),
    };
  });
}
