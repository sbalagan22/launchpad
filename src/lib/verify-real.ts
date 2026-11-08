import { MAX_BYTES, MAX_REDIRECTS, TIMEOUT_MS, isSafeRedirect, parseSafeUrl } from "./verify-guard";

/** Server-only. Real issuer verification, enabled with USE_REAL_VERIFY=true. */
export const realVerifyEnabled = () => process.env.USE_REAL_VERIFY === "true";

export type RealResult =
  | { outcome: "verified"; holder: string; certName: string; issuedAt?: string }
  | { outcome: "mismatch"; reason: string }
  | { outcome: "unparsed"; reason: string };

/** Fetches an allowlisted issuer page: HTTPS only, timeout, size cap, manual same-host redirects, never an arbitrary URL. */
export async function fetchIssuerPage(input: string): Promise<string> {
  let current = parseSafeUrl(input);
  if (!current) throw new Error("not_allowlisted");
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(current.toString(), { redirect: "manual", signal: AbortSignal.timeout(TIMEOUT_MS), headers: { accept: "text/html", "user-agent": "LaunchpadVerifier/1.0 (student project demo)" } });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc || !isSafeRedirect(current.toString(), loc)) throw new Error("unsafe_redirect");
      current = parseSafeUrl(new URL(loc, current).toString());
      if (!current) throw new Error("unsafe_redirect");
      continue;
    }
    if (!res.ok || !res.body) throw new Error(`status_${res.status}`);
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new Error("too_large");
      }
      chunks.push(value);
    }
    return new TextDecoder().decode(Buffer.concat(chunks));
  }
  throw new Error("too_many_redirects");
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/** Conservative parse: both the holder name and the certification name must appear. If they do not, we do not guess. */
export function parseIssuerPage(html: string, holder: string, certName: string): RealResult {
  const text = norm(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " "));
  if (text.length < 40) return { outcome: "unparsed", reason: "The issuer page had no readable content." };
  const certWords = norm(certName).split(" ").filter((w) => w.length > 3);
  const certHit = certWords.length > 0 && certWords.filter((w) => text.includes(w)).length / certWords.length >= 0.6;
  const holderHit = text.includes(norm(holder));
  if (!certHit) return { outcome: "unparsed", reason: "We could not find the certification name on the issuer page." };
  if (!holderHit) return { outcome: "mismatch", reason: "The name on the issuer page does not match your profile name." };
  const m = html.match(/(?:issued|earned)[^<]{0,40}?((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.? \d{1,2},? \d{4}|\d{4}-\d{2}-\d{2})/i);
  return { outcome: "verified", holder, certName, issuedAt: m ? m[1] : undefined };
}
