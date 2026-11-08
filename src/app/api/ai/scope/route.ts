import { NextResponse } from "next/server";
import { z } from "zod";
import { ScopeResult } from "@/schemas";
import { realAiEnabled, structured } from "@/lib/ai-server";

const Body = z.object({ brief: z.string().min(8).max(2000), businessName: z.string(), employerType: z.string(), isVolunteerEligible: z.boolean() });

const SYSTEM = `You help a poster at York University (Toronto) scope a small project for a York student. You only help the poster describe and structure the work. You never produce the deliverable itself.
Rules: hours must be 25 or fewer; use 2 to 4 milestones with hours that sum to the total and realistic dueInDays (3 or more); volunteer pay only when the poster is a nonprofit or York unit (then pay is 0 and payType "volunteer"), otherwise a fair stipend of about $15 to $25 per hour; no equity pay; deliverables concrete and checkable; 3 to 5 rubric criteria a human reviewer will score from 1 to 4; skills are short names like HTML, Figma, Excel; tools are named software; strengthenedBy lists catalog ids of certifications that would help (for example fcc-rwd, google-da); goodFit and notAFit are one sentence each; beginnerFriendly.ok is true only for a well-bounded first project. Be plain and specific. Never use emojis or em dashes.`;

export async function POST(req: Request) {
  // Anything other than a clean validated real response tells the client to use the pre-written mock.
  try {
    if (!realAiEnabled()) return NextResponse.json({ source: "mock" });
    const b = Body.parse(await req.json());
    const data = await structured(ScopeResult, SYSTEM, `Poster: ${b.businessName} (${b.employerType}). Volunteer allowed: ${b.isVolunteerEligible}.\nTheir description:\n"""${b.brief}"""\nScope this project.`);
    const fixed = { ...data, hours: Math.min(25, data.hours), ...(!b.isVolunteerEligible && data.payType === "volunteer" ? { payType: "stipend" as const } : {}) };
    return NextResponse.json({ source: "real", data: ScopeResult.parse(fixed) });
  } catch {
    return NextResponse.json({ source: "mock" });
  }
}
