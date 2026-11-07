import { z, type ZodType } from "zod";
import { useApp, getDb } from "@/store";
import type { Db } from "@/schemas";

export class ServiceError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "ServiceError";
  }
}

let quietUntil = 0;
/** Reads issued right after a write skip the delay so the UI updates as soon as the write lands. */
export function markFresh(): void {
  quietUntil = Date.now() + 400;
}

// MOCK: simulated network latency (300 to 900 ms) for every service call.
export function latency(min = 300, max = 900): Promise<void> {
  const ms = typeof window === "undefined" || Date.now() < quietUntil ? 0 : min + Math.random() * (max - min);
  return new Promise((r) => setTimeout(r, ms));
}

export function parseInput<S extends ZodType>(schema: S, value: unknown): z.infer<S> {
  const r = schema.safeParse(value);
  if (!r.success) throw new ServiceError("invalid_input", r.error.issues[0]?.message ?? "Invalid input");
  return r.data;
}

/** Read from the db with simulated latency, validating the output against a schema. */
export async function read<S extends ZodType>(schema: S, fn: (db: Db) => unknown): Promise<z.infer<S>> {
  await latency();
  const out = schema.safeParse(fn(getDb()));
  if (!out.success) throw new ServiceError("invalid_output", `Service returned unexpected data: ${out.error.issues[0]?.message}`);
  return out.data;
}

/** Write to the db with simulated latency. The updater returns the next db and a result. */
export async function write<S extends ZodType>(schema: S, fn: (db: Db) => { db: Db; result: unknown }): Promise<z.infer<S>> {
  await latency();
  const { db, result } = fn(getDb());
  const out = schema.safeParse(result);
  if (!out.success) throw new ServiceError("invalid_output", `Service returned unexpected data: ${out.error.issues[0]?.message}`);
  useApp.getState().commit(() => db);
  markFresh();
  return out.data;
}
