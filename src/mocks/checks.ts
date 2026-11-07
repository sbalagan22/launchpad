import type { CheckResult, Evaluation, Project, Submission } from "@/schemas";
import { daysFromNow } from "@/lib/dates";

type Row = Omit<CheckResult, "id" | "checkedAt">;

// MOCK: Basic check results keyed by URL. This is a reachability and first-load convenience only. It does not
// score quality and the platform never grades work with it. Includes a slow site and an unreachable link.
const ok = (url: string, s: number): Row => ({ url, reachable: true, httpStatus: 200, loadSeconds: s, status: "ok", note: `The link opened in ${s.toFixed(1)} seconds.` });
export const MOCK_CHECKS: Record<string, Row> = {
  "https://corner-press-tuesdays.netlify.app": ok("https://corner-press-tuesdays.netlify.app", 1.1),
  "https://reroute-waitlist-analytics.netlify.app": ok("https://reroute-waitlist-analytics.netlify.app", 1.4),
  "https://keele-robotics-events.netlify.app": ok("https://keele-robotics-events.netlify.app", 0.9),
  "https://fieldnote-waitlist.vercel.app": ok("https://fieldnote-waitlist.vercel.app", 1.2),
  "https://reroute-stop-search.netlify.app": ok("https://reroute-stop-search.netlify.app", 1.6),
  "https://corner-press-stamps.netlify.app": ok("https://corner-press-stamps.netlify.app", 1.0),
  "https://sprig-onepager.netlify.app": ok("https://sprig-onepager.netlify.app", 0.8),
  "https://northgate-donor-report.netlify.app": ok("https://northgate-donor-report.netlify.app", 1.9),
  "https://paper-lantern-telemetry.netlify.app": ok("https://paper-lantern-telemetry.netlify.app", 1.3),
  "https://hack-night-signup.netlify.app": ok("https://hack-night-signup.netlify.app", 1.0),
  "https://corner-press-menu-board.netlify.app": { url: "https://corner-press-menu-board.netlify.app", reachable: true, httpStatus: 200, loadSeconds: 4.6, status: "slow", note: "The link opened, but the first load took 4.6 seconds. The reviewer will see the same delay." },
  "https://kiln-evals-staging.vercel.app": { url: "https://kiln-evals-staging.vercel.app", reachable: false, httpStatus: 404, loadSeconds: null, status: "unreachable", note: "The link returned a 404, so the reviewer cannot open it. Check the deploy and the link, then resubmit." },
};

export function seedChecks(): CheckResult[] {
  return Object.values(MOCK_CHECKS).map((r, i) => ({ ...r, id: `chk_${String(i + 1).padStart(2, "0")}`, checkedAt: daysFromNow(-(i + 1) * 4) }));
}

const SUBMISSION_URLS: Record<string, string> = {
  prj_c01: "https://keele-robotics-events.netlify.app",
  prj_c02: "https://fieldnote-waitlist.vercel.app",
  prj_c03: "https://reroute-stop-search.netlify.app",
  prj_c04: "https://corner-press-stamps.netlify.app",
  prj_c05: "https://sprig-onepager.netlify.app",
  prj_c07: "https://northgate-donor-report.netlify.app",
  prj_c15: "https://paper-lantern-telemetry.netlify.app",
  prj_hack: "https://hack-night-signup.netlify.app",
  prj_menu: "https://corner-press-menu-board.netlify.app",
  prj_kilndash: "https://kiln-evals-staging.vercel.app",
};

/** MOCK: 10 seeded submissions, each tied to a Basic check result. */
export function seedSubmissions(projects: Project[], checks: CheckResult[]): Submission[] {
  return Object.entries(SUBMISSION_URLS).map(([projectId, url], i) => {
    const p = projects.find((x) => x.id === projectId)!;
    const check = checks.find((c) => c.url === url)!;
    const current = p.milestones.find((m) => m.status === "in_review" || m.status === "in_progress");
    const lastApproved = [...p.milestones].reverse().find((m) => m.status === "approved");
    let m = lastApproved ?? p.milestones[0];
    let status: Submission["status"] = "approved";
    if (p.status === "in_review" && current) { m = current; status = "pending_review"; }
    else if (p.status === "in_progress" && check.status === "unreachable" && current) { m = current; status = "changes_requested"; }
    return {
      id: `sub_${String(i + 1).padStart(2, "0")}`, projectId, milestoneId: m.id, studentId: p.studentId!, url, fileNames: [], final: m.id === p.milestones[p.milestones.length - 1].id,
      checkId: check.id, status, submittedAt: status === "approved" ? (m.approvedAt ?? daysFromNow(-20)) : daysFromNow(-1 - (i % 2)),
      ...(status === "changes_requested" ? { note: "The staging link returned a 404. Please redeploy and resubmit." } : {}),
    };
  });
}

const FEEDBACK: Record<string, string> = {
  web: "Clean structure and it works on a phone. The README made it easy to run. Next time, name the components by what they do.",
  design: "Strong hierarchy and consistent spacing. Files opened without fixing. Share early directions sooner to save a revision.",
  data: "Every change is logged and the numbers reconcile. The dictionary reads clearly. Say what you assumed when you were unsure.",
  marketing: "The plan explains its choices and the content is ready to publish. Tighten the first line of each post.",
  writing: "Clear and in the right voice. Sources are noted. Trim the second section by a third.",
  admin: "The template works on a real example and the guide covers the common cases. Add one more worked case.",
};

/** MOCK: evaluations for every approved submission. Scores are deterministic (3s and 4s). */
export function seedEvaluations(projects: Project[], submissions: Submission[]): Evaluation[] {
  return submissions.filter((s) => s.status === "approved").map((s, i) => {
    const p = projects.find((x) => x.id === s.projectId)!;
    return {
      id: `eva_${String(i + 1).padStart(2, "0")}`, submissionId: s.id, projectId: p.id, reviewerId: p.reviewerIds[p.reviewerIds.length > 1 ? 1 : 0],
      scores: p.rubric.map((r, j) => ({ criterion: r.criterion, score: 3 + ((i + j) % 2) })), feedback: FEEDBACK[p.type], decision: "approved" as const, at: s.submittedAt,
    };
  });
}
