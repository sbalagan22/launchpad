import type { Evidence, Level, SkillEntry, SkillTrust } from "@/schemas";

const RANK: Record<SkillTrust, number> = { self: 0, reviewed: 1 };

/** Add a skill or raise its trust (self to reviewed). Trust is never lowered by this helper. */
export function bumpSkill(skills: SkillEntry[], name: string, trust: SkillTrust, evidence: Evidence[], level: Level = "Intermediate"): SkillEntry[] {
  const idx = skills.findIndex((s) => s.name.toLowerCase() === name.toLowerCase());
  if (idx === -1) return [...skills, { name, level, trust, evidence }];
  const cur = skills[idx];
  const kept = cur.trust === "self" ? [] : cur.evidence;
  const seen = new Set<string>();
  const merged = [...kept, ...evidence].filter((e) => (seen.has(e.label) ? false : (seen.add(e.label), true)));
  return skills.map((s, i) => (i === idx ? { ...cur, trust: RANK[trust] > RANK[cur.trust] ? trust : cur.trust, evidence: merged } : s));
}
