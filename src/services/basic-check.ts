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

/**
 * MOCK: Basic check. Reachability and first-load time only, so a reviewer knows the link opens. It never scores
 * quality. Known URLs return the hand-written results; any other URL gets a deterministic result from a hash of the URL.
 */
export function basicCheckFor(db: Db, rawUrl: string): CheckResult {
  const url = normalizeUrl(rawUrl);
  const stamp = { id: newId("chk"), checkedAt: new Date().toISOString() };
  const known = db.checks.find((c) => normalizeUrl(c.url) === url) ?? MOCK_CHECKS[url];
  if (known) return { ...known, ...stamp };
  const host = new URL(url).hostname;
  if (host.endsWith(".invalid") || host === "localhost" || /(^|[.-])(broken|404|down)([.-]|$)/.test(host)) {
    return { ...stamp, url, reachable: false, httpStatus: 404, loadSeconds: null, status: "unreachable", note: "The link could not be reached, so the reviewer cannot open it. Check the deploy and the link, then resubmit." };
  }
  const h = hashString(url);
  const s = Math.round((0.7 + (h % 45) / 10) * 10) / 10;
  return s < 3
    ? { ...stamp, url, reachable: true, httpStatus: 200, loadSeconds: s, status: "ok", note: `The link opened in ${s.toFixed(1)} seconds.` }
    : { ...stamp, url, reachable: true, httpStatus: 200, loadSeconds: s, status: "slow", note: `The link opened, but the first load took ${s.toFixed(1)} seconds. The reviewer will see the same delay.` };
}
