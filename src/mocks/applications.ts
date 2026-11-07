import type { Application, Business, Project, Student } from "@/schemas";
import { daysFromNow } from "@/lib/dates";
import { draftProposalText } from "./proposal";

// MOCK: 40 applications: one accepted per assigned project (25), 13 pending on open projects, 2 rejected.
export function seedApplications(students: Student[], projects: Project[], businesses: Business[]): Application[] {
  const st = (id: string) => students.find((s) => s.id === id)!;
  const pr = (id: string) => projects.find((p) => p.id === id)!;
  const bz = (id: string) => businesses.find((b) => b.id === id)!;
  const out: Application[] = [];
  let n = 0;
  const add = (projectId: string, studentId: string, status: Application["status"], daysAgo: number) => {
    const p = pr(projectId);
    n += 1;
    out.push({ id: `app_${String(n).padStart(2, "0")}`, projectId, studentId, status, proposal: draftProposalText(st(studentId), p, bz(p.businessId)), createdAt: daysFromNow(-daysAgo, 10 + (n % 6)) });
  };
  for (const p of projects) if (p.studentId) add(p.id, p.studentId, "accepted", Math.max(1, Math.round((Date.now() - new Date(p.createdAt).getTime()) / 86_400_000) - 1));
  const pending: [string, string, number][] = [
    ["prj_robo", "stu_aisha", 1], ["prj_pulse", "stu_aisha", 2], ["prj_board", "stu_marcus", 2], ["prj_board", "stu_arjun", 1], ["prj_game", "stu_liam", 1], ["prj_game", "stu_daniel", 2],
    ["prj_lab", "stu_liam", 3], ["prj_reroute_mvp", "stu_daniel", 1], ["prj_reroute_mvp", "stu_omar", 1], ["prj_sprig_demo", "stu_priya", 2], ["prj_sprig_demo", "stu_sofia", 1],
    ["prj_ledgerleaf", "stu_fatima", 3], ["prj_video", "stu_priya", 4],
  ];
  for (const [p, s, d] of pending) add(p, s, "pending", d);
  add("prj_menu", "stu_daniel", "rejected", 21);
  add("prj_hack", "stu_omar", "rejected", 13);
  return out;
}
