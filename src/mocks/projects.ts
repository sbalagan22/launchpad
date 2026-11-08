import type { Milestone, Project } from "@/schemas";
import { daysFromNow, termSafe } from "@/lib/dates";
import { splitPay } from "@/lib/pay";
import { CONTACT, seedBusinesses } from "./people";
import { CS_SPECS } from "./specs-cs";
import { OTHER_SPECS } from "./specs-other";
import { FACULTIES, type Spec } from "./spec";

export const ALL_SPECS: Spec[] = [...CS_SPECS, ...OTHER_SPECS];

const MH: Record<string, [number, number, number]> = { prj_reroute_mvp: [4, 12, 9], prj_reroute_disc: [8, 6, 4] };
const LEARN: Record<Spec["area"], string> = {
  cs: "You will practise working in small, reviewable steps and explaining technical choices to someone who did not make them.",
  biz: "You will practise turning messy conversations into a clear recommendation a decision maker can act on.",
  psy: "You will practise careful, ethical handling of information and writing for people who are not specialists.",
  des: "You will practise making design decisions you can defend and handing over files others can edit.",
  hum: "You will practise writing and editing for a real audience with a real deadline.",
  sci: "You will practise documenting your method so another person can repeat your work exactly.",
};
const FIT: Record<Spec["area"], string> = {
  cs: "You are comfortable with the listed skills and like clear checklists.", biz: "You are curious about people and comfortable asking questions.", psy: "You are careful with detail and sensitive information.",
  des: "You like making things that look good and work well.", hum: "You write clearly and enjoy editing.", sci: "You like tidy data and clear methods.",
};
const NOTFIT: Record<Spec["area"], string> = {
  cs: "You are looking for an open-ended research role.", biz: "You want detailed step-by-step direction.", psy: "You are not comfortable handling sensitive material.",
  des: "You need heavy art direction on each page.", hum: "You prefer purely technical work.", sci: "You want a fast, loosely documented task.",
};

export function describe(s: Spec, poster: string, org = "The poster", category = "organization"): string {
  const weeks = Math.max(2, Math.round(s.hours / 5));
  const where = s.loc === "remote" ? "entirely remote" : s.loc === "hybrid" ? "mostly remote with one or two in-person visits" : "mainly on campus or nearby";
  return [
    s.ctx ?? `${org} is a ${category.toLowerCase()} with a specific job that has been waiting for someone with time to do it properly. ${s.hook} The next step for the team cannot move forward until it is done, and nobody has had room to take it on alongside everything else.`,
    s.ask ?? `We are looking for a student who can deliver ${s.deliv[0].toLowerCase()}${s.deliv[1] ? ` and ${s.deliv[1].toLowerCase()}` : ""}, checking in with us at the end of each milestone so nothing surprising lands at the end.`,
    `The work runs in three steps: ${s.ms[0].toLowerCase()}, then ${s.ms[1].toLowerCase()}, then ${s.ms[2].toLowerCase()}. At the end, the work is checked against ${s.acc.length} plain criteria, starting with "${s.acc[0].toLowerCase()}".`,
    `${s.learn ?? LEARN[s.area]} Expect about ${s.hours} hours over ${weeks} weeks, ${where}. ${poster} replies within two working days and approves each milestone before the next one opens.`,
  ].join("\n\n");
}

export function seedProjects(): Project[] {
  const bizs = seedBusinesses();
  return ALL_SPECS.map((s) => {
    const poster = CONTACT[s.biz] ?? "The poster";
    const hrs = MH[s.id] ?? (() => { const a = Math.max(2, Math.round(s.hours * 0.25)); const b = Math.round(s.hours * 0.45); return [a, b, s.hours - a - b] as [number, number, number]; })();
    const sponsor = Number(/\$(\d+) sponsor stipend/.exec(s.fine ?? "")?.[1] ?? 0);
    const total = (s.pay || sponsor);
    const amounts = splitPay(total, 3);
    const completed = s.status === "completed";
    const base = s.status === "open" ? 0 : s.status === "in_progress" ? -s.ago : -s.ago - Math.round(s.hours * 1.6);
    const span = completed ? s.hours * 1.6 : s.status === "in_progress" ? s.hours * 2 : s.due ?? 40;
    const offs = [0.33, 0.66, 1].map((f) => Math.round(f * span));
    const prog = s.prog ?? (completed ? "aaa" : "ooo");
    const milestones: Milestone[] = s.ms.map((title, i) => {
      const code = prog[i];
      const status: Milestone["status"] = code === "a" ? "approved" : code === "r" ? "in_review" : code === "p" ? "in_progress" : "open";
      const dueAt = s.status === "open" ? termSafe(daysFromNow(offs[i])) : termSafe(daysFromNow(base + offs[i]));
      return { id: `${s.id}_m${i + 1}`, title, hours: hrs[i], dueAt, amount: amounts[i], status, ...(status === "approved" ? { approvedAt: daysFromNow(base + offs[i] - 1) } : {}) };
    });
    const deadline = milestones[2].dueAt;
    const logged = completed ? s.hours : s.status === "in_progress" ? milestones.filter((m) => m.status === "approved").reduce((a, m) => a + m.hours, 0) + (prog.includes("r") ? hrs[prog.indexOf("r")] : 0) : 0;
    return {
      id: s.id, businessId: s.biz, ventureId: s.venture, title: s.title, hook: s.hook, type: s.type, status: s.status, description: describe(s, poster, bizs.find((b) => b.id === s.biz)?.name, bizs.find((b) => b.id === s.biz)?.category), deliverables: s.deliv, milestones,
      skills: s.skills, tools: s.tools ?? [], hours: s.hours, payType: s.pay > 0 ? "stipend" : "volunteer", pay: s.pay, sponsorStipend: s.pay > 0 ? 0 : sponsor, deadline,
      createdAt: daysFromNow(s.status === "open" ? -s.ago : base - 7), studentId: s.stu ?? null, acceptance: s.acc, difficulty: s.diff, locationMode: s.loc,
      doneLooksLike: `${s.deliv[0]}, with ${s.acc[0].toLowerCase()}.`, goodFit: s.fit ?? FIT[s.area], notAFit: s.notFit ?? NOTFIT[s.area], strengthenedBy: s.certs ?? [], faculties: FACULTIES[s.area],
      ...(s.fine ? { fineprint: s.fine } : {}), badgeSkills: s.skills.slice(0, 2), beginnerFriendly: s.diff === "Beginner", aiScoped: s.id === "prj_reroute_mvp" || s.id === "prj_board", loggedHours: logged,
    } satisfies Project;
  });
}
