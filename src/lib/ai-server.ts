import { z } from "zod";

/** Server-only helper: calls the Anthropic Messages API and returns tool-use input, or null on any problem. */
export function realAiEnabled(): boolean {
  return process.env.USE_REAL_AI === "true" && Boolean(process.env.ANTHROPIC_API_KEY);
}

const MODEL = () => process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

async function call(body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY ?? "", "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL(), max_tokens: 2000, ...body }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  return res.json();
}

const Reply = z.object({ content: z.array(z.object({ type: z.string(), text: z.string().optional(), input: z.unknown().optional() })) });

/** Structured output: forces a single tool call whose input schema is derived from the Zod schema. */
export async function structured<S extends z.ZodType>(schema: S, system: string, prompt: string): Promise<z.infer<S>> {
  const raw = await call({
    system,
    messages: [{ role: "user", content: prompt }],
    tools: [{ name: "return_result", description: "Return the structured result.", input_schema: z.toJSONSchema(schema) }],
    tool_choice: { type: "tool", name: "return_result" },
  });
  const block = Reply.parse(raw).content.find((c) => c.type === "tool_use");
  if (!block) throw new Error("No structured output");
  return schema.parse(block.input);
}
