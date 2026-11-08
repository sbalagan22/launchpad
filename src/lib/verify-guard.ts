/**
 * SSRF guard for real issuer verification. Only a fixed allowlist of public issuer hosts may ever be fetched,
 * over HTTPS on the default port, with no credentials in the URL and no redirects to any other host.
 * Arbitrary user-supplied URLs are never fetched.
 */
export const ALLOWED_HOSTS = ["www.credly.com", "aws.amazon.com", "learn.microsoft.com", "verify.comptia.org", "www.freecodecamp.org", "freecodecamp.org"] as const;
export const MAX_BYTES = 200_000;
export const TIMEOUT_MS = 5_000;
export const MAX_REDIRECTS = 3;

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/** True for IP literals, localhost-style names, single-label names, and internal suffixes. */
export function isPrivateOrLocalHost(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, "");
  if (!h.includes(".")) return true;
  if (h.startsWith("[") || h.includes(":")) return true; // IPv6 literal
  if (IPV4.test(h)) return true; // any IPv4 literal, public or private
  if (/^\d+$/.test(h.replace(/\./g, ""))) return true; // decimal or hex style IP tricks
  return h === "localhost" || /\.(localhost|local|internal|lan|home|corp|test|invalid)$/.test(h);
}

export function isAllowedHost(host: string): boolean {
  return (ALLOWED_HOSTS as readonly string[]).includes(host.toLowerCase());
}

/** Returns a parsed URL only if it is safe to fetch, otherwise null. */
export function parseSafeUrl(input: string): URL | null {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  if (u.username || u.password) return null;
  if (u.port && u.port !== "443") return null;
  const host = u.hostname.toLowerCase();
  if (!/^[a-z0-9.-]+$/.test(host) || host.includes("xn--")) return null;
  if (isPrivateOrLocalHost(host)) return null;
  if (!isAllowedHost(host)) return null;
  return u;
}

/** A redirect is safe only if both ends are safe and it stays on the same host. */
export function isSafeRedirect(from: string, to: string): boolean {
  const a = parseSafeUrl(from);
  let b: URL | null = null;
  try {
    b = parseSafeUrl(new URL(to, from).toString());
  } catch {
    return false;
  }
  return Boolean(a && b && a.hostname === b.hostname);
}
