import type { Difficulty, Faculty, LocationMode, ProjectType } from "@/schemas";

export type Area = "cs" | "biz" | "psy" | "des" | "hum" | "sci";
/** Compact hand-written project spec. Expanded into a full Project by projects.ts. */
export type Spec = {
  id: string; biz: string; title: string; hook: string; area: Area; type: ProjectType;
  skills: string[]; tools?: string[]; hours: number; pay: number; diff: Difficulty; loc: LocationMode;
  ms: [string, string, string]; deliv: string[]; acc: string[]; certs?: string[];
  ctx?: string; ask?: string; learn?: string; fit?: string; notFit?: string; fine?: string;
  status: "open" | "in_progress" | "completed";
  /** student id when in progress or completed */
  stu?: string;
  /** milestone progress for in_progress: a approved, r in review, p in progress, o not started */
  prog?: string;
  /** days ago it was posted (open) or finished (completed) */
  ago: number;
  /** open projects: days until deadline */
  due?: number;
  /** completed: rating given */
  rating?: number;
  venture?: string;
};

export const FACULTIES: Record<Area, Faculty[]> = {
  cs: ["Lassonde", "Science", "AMPD"],
  biz: ["Schulich", "LA&PS", "Glendon"],
  psy: ["Health", "Science", "LA&PS"],
  des: ["AMPD", "EUC", "LA&PS"],
  hum: ["LA&PS", "Glendon", "Education"],
  sci: ["Science", "Health", "EUC"],
};
