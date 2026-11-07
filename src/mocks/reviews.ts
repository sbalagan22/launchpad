import type { Business, Project, Review } from "@/schemas";
import { daysFromNow } from "@/lib/dates";

// MOCK: 20 hand-written reviews, one per completed project: [projectId, rating, text, reviewer].
const R: [string, number, string, string][] = [
  ["prj_11", 5, "Aisha delivered a clear, readable menu board ahead of schedule and handled our changes quickly.", "Nadia R., Owner"],
  ["prj_12", 5, "On-brand flyer, delivered early. Easy to work with.", "Maria T., Program Lead"],
  ["prj_13", 5, "The registration page is so simple that parents stopped phoning us. Daniel explained every step.", "Gurpreet S., League Registrar"],
  ["prj_14", 4, "Booking page works well and saves us hours of phone calls. A couple of small bugs, fixed fast.", "Tony M., Service Manager"],
  ["prj_15", 5, "Priya understood the look of our packaging right away. The cards are lovely.", "Nadia R., Owner"],
  ["prj_16", 5, "A cohesive system we now use on every poster and post. Very professional.", "Claire D., Studio Owner"],
  ["prj_17", 5, "Marcus found patterns we had never noticed and presented them clearly to our committee.", "Helen W., Garden Coordinator"],
  ["prj_18", 4, "Solid analysis and a useful dashboard. We would have liked one more round of questions at the start.", "Dr. Anil V., Clinic Director"],
  ["prj_19", 5, "Sofia kept the charm of our old logo and made it feel current. Customers noticed.", "Rebecca L., Owner"],
  ["prj_20", 5, "The lookbook looks like it came from an agency. Delivered on time with print files ready.", "Isabelle K., Owner"],
  ["prj_21", 5, "Registrations rose 30 percent. Jordan's coach spotlight idea was a hit.", "Amar B., League President"],
  ["prj_22", 4, "Newsletter is set up and the first two issues were warm and clear. Slightly late on issue two.", "Claire D., Studio Owner"],
  ["prj_23", 5, "The one-pager ended a lot of client questions. Fatima asked the right questions up front.", "Susan P., Partner"],
  ["prj_24", 4, "Quote template saves time and prints well. We asked for one extra column and it was added same day.", "Raj K., Operations Lead"],
  ["prj_25", 5, "Liam found a bug we had been chasing for months. Donations are no longer getting lost.", "Margaret O., Executive Director"],
  ["prj_26", 4, "The script works and merged files cleanly. Instructions could be a bit shorter.", "Tony M., Service Manager"],
  ["prj_27", 5, "Friendly, accurate posts that sound like us. We have already scheduled them.", "Dana F., Owner"],
  ["prj_28", 5, "Plain language, no jargon. Our front desk uses these answers daily.", "Priya N., Clinic Manager"],
  ["prj_29", 4, "Good lookup table and careful notes on the odd cases. A few categories needed adjusting.", "Susan P., Partner"],
  ["prj_30", 5, "Our treasurer finally has one place for everything. Emily was patient with our many questions.", "Amar B., League President"],
];

export function seedReviews(projects: Project[], _businesses: Business[]): Review[] {
  void _businesses;
  return R.map(([projectId, rating, text, by], i) => {
    const p = projects.find((x) => x.id === projectId)!;
    return {
      id: `rev_${String(i + 1).padStart(2, "0")}`, projectId, studentId: p.studentId!, businessId: p.businessId, rating, text, by,
      createdAt: p.milestones[p.milestones.length - 1].approvedAt ?? daysFromNow(-10),
    };
  });
}
