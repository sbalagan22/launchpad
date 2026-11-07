import type { Project, Review } from "@/schemas";
import { daysFromNow } from "@/lib/dates";

// MOCK: 20 hand-written poster reviews, one per completed project: [projectId, rating, text, reviewer name and role].
const R: [string, number, string, string][] = [
  ["prj_c01", 5, "Aisha delivered a clear, fast event page ahead of schedule and handled our changes the same day.", "Keisha M., Club President"],
  ["prj_c02", 5, "The waitlist page was live in a week and our signups doubled. She explained every choice in the README.", "Ben L., Co-founder"],
  ["prj_c03", 5, "Daniel found the limits of the transit API before we hit them in front of investors. We are keeping him on.", "Tariq A., CEO"],
  ["prj_c04", 4, "Loyalty page works and staff use it daily. A couple of small bugs, fixed fast.", "Ana P., Owner"],
  ["prj_c05", 5, "Priya understood the farmers right away. The one-pager is on every market table.", "Maya G., Founder"],
  ["prj_c06", 5, "A cohesive set of posters and a banner we can reuse every year. Professional and fast.", "Hugo T., Events Lead"],
  ["prj_c07", 5, "Marcus found a pattern we had never noticed and presented it clearly to our board.", "Helen W., Executive Director"],
  ["prj_c08", 4, "Solid analysis and a useful dashboard. We would have liked one more round of questions at the start.", "Dr. Owen H., Founder"],
  ["prj_c09", 5, "Sofia made a hard number feel obvious. The graphics are now on our homepage.", "Alma R., Founder"],
  ["prj_c10", 5, "Gardeners finally find their plots. The signage is lovely and weatherproof.", "Rosa D., Coordinator"],
  ["prj_c11", 5, "Seven posts, zero edits needed, and launch week beat our targets. Jordan's sequencing was smart.", "Ravi N., CEO"],
  ["prj_c12", 4, "Clear emails with good subject lines. Slightly late on the final send.", "Hugo T., Events Lead"],
  ["prj_c13", 5, "Fatima asked the right questions up front. The memo changed our pricing page.", "Ife A., CEO"],
  ["prj_c14", 4, "The new form saves our front desk time. We asked for one extra field and it was added same day.", "Dr. Priya N., Clinic Manager"],
  ["prj_c15", 5, "Liam's tool showed us where half our testers quit. We fixed level four first.", "Eli R., Studio Lead"],
  ["prj_c16", 5, "The script scores a questionnaire in a second and has tests. Our RAs finally trust it.", "Prof. Amara O."],
  ["prj_c17", 5, "Friendly, accurate and easy to skim. Our newest volunteers finish it in ten minutes.", "Rosa D., Coordinator"],
  ["prj_c18", 4, "Plain and useful. A few examples needed adjusting for our department.", "Sam K., Working Group Chair"],
  ["prj_c19", 5, "The heatmap prints cleanly in grayscale, which our last attempt did not. Reproducible script too.", "Prof. Wei L."],
  ["prj_c20", 5, "Our treasurer finally has one place for everything. Emily was patient with our many questions.", "Keisha M., Treasurer"],
];

export function seedReviews(projects: Project[]): Review[] {
  return R.map(([projectId, rating, text, by], i) => {
    const p = projects.find((x) => x.id === projectId)!;
    return { id: `rev_${String(i + 1).padStart(2, "0")}`, projectId, studentId: p.studentId!, businessId: p.businessId, rating, text, by, createdAt: p.milestones[p.milestones.length - 1].approvedAt ?? daysFromNow(-10) };
  });
}
