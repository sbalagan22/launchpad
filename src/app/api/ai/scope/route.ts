import { NextResponse } from "next/server";
import { z } from "zod";
import { ScopeResult } from "@/schemas";
import { realAiEnabled, structured } from "@/lib/ai-server";

const Body = z.object({ brief: z.string().min(8).max(2000), businessName: z.string(), businessKind: z.enum(["business", "nonprofit"]), city: z.string() });

const SYSTEM = `You scope small projects for students completing real work for local small businesses and nonprofits in Brampton, Mississauga and Toronto.
Rules: hours must be 25 or fewer; use 2 to 4 milestones with realistic dueInDays; volunteer pay only when the poster is a nonprofit (then pay, payMin and payMax are 0, payType "volunteer"), otherwise a fair student stipend of about $15 to $25 per hour; deliverables must be concrete and checkable; skills are short names like HTML, Figma, Excel; badgeSkills are the 1 to 2 skills a student earns verification in; beginnerFriendly.ok is true only for a well-bounded first project. Be plain and specific. Never use emojis.`;

export async function POST(req: Request) {
  // Anything other than a clean validated real response tells the client to use the pre-written mock.
  try {
    if (!realAiEnabled()) return NextResponse.json({ source: "mock" });
    const b = Body.parse(await req.json());
    const data = await structured(ScopeResult, SYSTEM, `Poster: ${b.businessName} (${b.businessKind}, ${b.city}).\nTheir description:\n"""${b.brief}"""\nScope this project.`);
    const fixed = { ...data, hours: Math.min(25, data.hours), ...(b.businessKind === "business" && data.payType === "volunteer" ? { payType: "stipend" as const } : {}) };
    return NextResponse.json({ source: "real", data: ScopeResult.parse(fixed) });
  } catch {
    return NextResponse.json({ source: "mock" });
  }
}
