import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchIssuerPage, parseIssuerPage, realVerifyEnabled } from "@/lib/verify-real";
import { parseSafeUrl } from "@/lib/verify-guard";

const Body = z.object({ input: z.string().min(4).max(500), holder: z.string(), certName: z.string() });

// Server route for USE_REAL_VERIFY=true. When disabled it answers { source: "mock" } and the client runs the deterministic mock.
// Only allowlisted issuer URLs are ever fetched; anything else is reported as unparsed so the student can add it as self-reported.
export async function POST(req: Request) {
  if (!realVerifyEnabled()) return NextResponse.json({ source: "mock" });
  try {
    const b = Body.parse(await req.json());
    if (!parseSafeUrl(b.input)) return NextResponse.json({ source: "real", result: { outcome: "unparsed", reason: "That link is not on the supported issuer list, so it was not fetched." } });
    const html = await fetchIssuerPage(b.input);
    return NextResponse.json({ source: "real", result: parseIssuerPage(html, b.holder, b.certName) });
  } catch {
    return NextResponse.json({ source: "real", result: { outcome: "unparsed", reason: "The issuer page could not be read. You can add this as self-reported instead." } });
  }
}
