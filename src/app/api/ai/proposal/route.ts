import { NextResponse } from "next/server";
import { z } from "zod";
import { plainText, realAiEnabled } from "@/lib/ai-server";

const Body = z.object({
  studentName: z.string(), school: z.string(), year: z.number(), field: z.string(), skills: z.array(z.string()), hoursPerWeek: z.number(),
  projectTitle: z.string(), projectDescription: z.string(), deliverables: z.array(z.string()), businessName: z.string(), deadline: z.string(),
});
const Out = z.string().min(60).max(1800);

export async function POST(req: Request) {
  try {
    if (!realAiEnabled()) return NextResponse.json({ source: "mock" });
    const b = Body.parse(await req.json());
    const text = await plainText(
      "You draft short, honest project proposals for students applying to small-business projects. 120 to 180 words, first person, plain language, no emojis, no invented credentials: only mention skills listed. End with the student's first name.",
      `Student: ${b.studentName}, year ${b.year} ${b.field} at ${b.school}. Skills: ${b.skills.join(", ")}. Available ${b.hoursPerWeek} h/week.\nProject: ${b.projectTitle} for ${b.businessName}, due ${b.deadline}.\n${b.projectDescription}\nDeliverables: ${b.deliverables.join("; ")}.\nDraft the proposal.`,
    );
    return NextResponse.json({ source: "real", data: Out.parse(text.trim()) });
  } catch {
    return NextResponse.json({ source: "mock" });
  }
}
