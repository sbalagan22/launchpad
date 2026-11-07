import type { Application, Business, Project, Student } from "@/schemas";
import { daysFromNow } from "@/lib/dates";
import { draftProposalText } from "./proposal";

// MOCK: 40 applications — one accepted per assigned project (24), 14 pending on open projects, 2 rejected.
export function seedApplications(students: Student[], projects: Project[], businesses: Business[]): Application[] {
  const st = (id: string) => students.find((s) => s.id === id)!;
  const pr = (id: string) => projects.find((p) => p.id === id)!;
  const bz = (id: string) => businesses.find((b) => b.id === id)!;
  const out: Application[] = [];
  let n = 0;
  const add = (projectId: string, studentId: string, status: Application["status"], daysAgo: number) => {
    const p = pr(projectId);
    n += 1;
    out.push({
      id: `app_${String(n).padStart(2, "0")}`, projectId, studentId, status,
      proposal: draftProposalText(st(studentId), p, bz(p.businessId)),
      createdAt: daysFromNow(-daysAgo, 10 + (n % 6)),
    });
  };
  // accepted: every assigned project
  for (const p of projects) if (p.studentId) add(p.id, p.studentId, "accepted", Math.max(1, Math.round(-(new Date(p.createdAt).getTime() - Date.now()) / 86_400_000) - 1));
  // pending on open projects
  add("prj_01", "stu_aisha", "pending", 1); add("prj_01", "stu_liam", "pending", 2); add("prj_01", "stu_daniel", "pending", 1);
  add("prj_02", "stu_hannah", "pending", 3); add("prj_02", "stu_jordan", "pending", 2); add("prj_02", "stu_priya", "pending", 1);
  add("prj_03", "stu_aisha", "pending", 2); add("prj_03", "stu_sofia", "pending", 3); add("prj_03", "stu_priya", "pending", 4);
  add("prj_04", "stu_jordan", "pending", 2); add("prj_04", "stu_hannah", "pending", 1);
  add("prj_05", "stu_marcus", "pending", 4); add("prj_05", "stu_arjun", "pending", 3);
  add("prj_06", "stu_hannah", "pending", 1);
  // rejected on assigned projects
  add("prj_10", "stu_daniel", "rejected", 27); add("prj_07", "stu_priya", "rejected", 13);
  return out;
}
