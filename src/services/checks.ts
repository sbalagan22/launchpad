import type { CheckResult, Db } from "@/schemas";
import { hashString, newId } from "@/lib/ids";
import { MOCK_CHECKS } from "@/mocks/checks";
import { ServiceError } from "./core";

export function normalizeUrl(raw: string): string {
  const t = raw.trim();
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  let u: URL;
  try {
    u = new URL(withProto);
  } catch {
    throw new ServiceError("invalid_url", "Enter a full link such as https://staging.example.com");
  }
  if (!u.hostname.includes(".")) throw new ServiceError("invalid_url", "Enter a full link such as https://staging.example.com");
  return `${u.protocol}//${u.hostname.toLowerCase()}${u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "")}`;
}

const ISSUE_POOL = [
  "Two images are missing alt text",
  "Some body text has low contrast",
  "The page has no meta description",
  "A form field is missing a visible label",
  "The main image is larger than it needs to be",
  "The heading order skips a level",
];

/**
 * MOCK: deterministic automated check. Known URLs return the hand-written result set; any
 * other URL gets scores derived from a hash of the URL, so the same link always scores the same.
 */
export function mockCheck(db: Db, rawUrl: string): CheckResult {
  const url = normalizeUrl(rawUrl);
  const known = db.checks.find((c) => normalizeUrl(c.url) === url) ?? undefined;
  if (known) return { ...known, id: newId("chk"), checkedAt: new Date().toISOString() };
  const fixed = MOCK_CHECKS[url];
  if (fixed) return { ...fixed, id: newId("chk"), checkedAt: new Date().toISOString() };

  const host = new URL(url).hostname;
  if (host.endsWith(".invalid") || host === "localhost" || /(^|[.-])(broken|404|down)([.-]|$)/.test(host)) {
    return {
      id: newId("chk"), url, reachable: false, httpStatus: 404, loadSeconds: null, mobile: 0, accessibility: 0, seo: 0, status: "fail", checkedAt: new Date().toISOString(),
      issues: ["The link could not be reached", "No page content could be checked"],
      summary: "The link could not be reached, so nothing was checked. Confirm the site is deployed and public, then resubmit.",
    };
  }
  const h = hashString(url);
  const mobile = 70 + (h % 26);
  const accessibility = 68 + ((h >> 3) % 29);
  const seo = 62 + ((h >> 6) % 33);
  const loadSeconds = Math.round((0.8 + ((h >> 9) % 25) / 10) * 10) / 10;
  const min = Math.min(mobile, accessibility, seo);
  const status: CheckResult["status"] = min >= 80 && loadSeconds < 2.5 ? "pass" : "warn";
  const issues = [0, 1, 2].map((i) => ISSUE_POOL[(h >> (i * 4 + 2)) % ISSUE_POOL.length]).filter((x, i, a) => a.indexOf(x) === i).slice(0, status === "pass" ? 1 : 3);
  const weakest = min === accessibility ? "accessibility" : min === seo ? "search metadata" : "mobile performance";
  return {
    id: newId("chk"), url, reachable: true, httpStatus: 200, loadSeconds, mobile, accessibility, seo, status, issues, checkedAt: new Date().toISOString(),
    summary: `The site loads in ${loadSeconds.toFixed(1)} seconds and is reachable on mobile. The weakest area is ${weakest}. ${issues[0] ? `${issues[0]}. ` : ""}Fixing the listed issues would improve the overall score.`,
  };
}
