import type { Evidence, Level, SkillEntry, Trust } from "@/schemas";

const RANK: Record<Trust, number> = { self: 0, checked: 1, issuer: 2 };

/** Add a skill or raise its trust level. Trust is never lowered by this helper. */
export function bumpSkill(skills: SkillEntry[], name: string, trust: Trust, evidence: Evidence[], level: Level = "Intermediate"): SkillEntry[] {
  const idx = skills.findIndex((s) => s.name.toLowerCase() === name.toLowerCase());
  if (idx === -1) return [...skills, { name, level, trust, evidence }];
  const cur = skills[idx];
  const keepSelfNote = cur.trust === "self" ? [] : cur.evidence;
  const next: SkillEntry = {
    ...cur,
    trust: RANK[trust] > RANK[cur.trust] ? trust : cur.trust,
    evidence: dedupe([...keepSelfNote, ...evidence]),
  };
  return skills.map((s, i) => (i === idx ? next : s));
}

function dedupe(ev: Evidence[]): Evidence[] {
  const seen = new Set<string>();
  return ev.filter((e) => (seen.has(e.label) ? false : (seen.add(e.label), true)));
}

export function trustRank(t: Trust): number {
  return RANK[t];
}
