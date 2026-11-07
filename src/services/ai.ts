import { z } from "zod";
import { ScopeInput, ScopeResult } from "@/schemas";
import { draftProposalText } from "@/mocks/proposal";
import { mockScope } from "@/mocks/scopes";
import { getDb } from "@/store";
import { ServiceError, latency, parseInput } from "./core";

export type AiSource = "real" | "mock";

async function tryReal<S extends z.ZodType>(path: string, body: unknown, schema: S): Promise<z.infer<S> | null> {
  try {
    const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) return null;
    const json: { source?: string; data?: unknown } = await res.json();
    if (json.source !== "real") return null;
    const parsed = schema.safeParse(json.data);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Scopes a plain-language request into a project. USE_REAL_AI=true calls the model, validated with Zod, with the mock as fallback. */
export async function scopeProject(input: z.input<typeof ScopeInput>): Promise<{ result: ScopeResult; source: AiSource }> {
  const v = parseInput(ScopeInput, input);
  const biz = getDb().businesses.find((b) => b.id === v.businessId);
  if (!biz) throw new ServiceError("not_found", "Business not found");
  const real = await tryReal("/api/ai/scope", { brief: v.brief, businessName: biz.name, businessKind: biz.kind, city: biz.city }, ScopeResult);
  if (real) return { result: real, source: "real" };
  // MOCK: pre-written scopes for four known briefs, keyword-templated for everything else.
  await latency(500, 900);
  return { result: ScopeResult.parse(mockScope(v.brief, biz)), source: "mock" };
}

const DraftInput = z.object({ projectId: z.string(), studentId: z.string() });

/** Drafts a proposal for the student to edit. The UI streams the returned text for the typing effect. */
export async function draftProposal(input: z.input<typeof DraftInput>): Promise<{ text: string; source: AiSource }> {
  const v = parseInput(DraftInput, input);
  const db = getDb();
  const project = db.projects.find((p) => p.id === v.projectId);
  const student = db.students.find((s) => s.id === v.studentId);
  if (!project || !student) throw new ServiceError("not_found", "Project or student not found");
  const biz = db.businesses.find((b) => b.id === project.businessId)!;
  const real = await tryReal(
    "/api/ai/proposal",
    { studentName: student.name, school: student.school, year: student.year, field: student.field, skills: student.skills.map((s) => s.name), hoursPerWeek: student.hoursPerWeek, projectTitle: project.title, projectDescription: project.description, deliverables: project.deliverables, businessName: biz.name, deadline: project.deadline.slice(0, 10) },
    z.string().min(60),
  );
  if (real) return { text: real, source: "real" };
  // MOCK: templated proposal built from the real profile and project data.
  await latency(400, 800);
  return { text: draftProposalText(student, project, biz), source: "mock" };
}
