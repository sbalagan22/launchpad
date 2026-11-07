import type { Business, Project, ProjectType, Student } from "@/schemas";
import { fmtDate } from "@/lib/dates";

// MOCK: pre-written proposal drafting for the student to edit. It only organizes the student's own profile
// and the project facts. It never writes or fixes a deliverable.
const APPROACH: Record<ProjectType, string> = {
  web: "I would start with a short plan and a rough layout for your approval, then build in stages and share a working link at each milestone so your reviewer can check it early.",
  design: "I would start with a few rough directions so you can react early, then refine the one you pick and hand over final files with a one-page usage guide.",
  data: "I would begin by profiling the data and writing down every assumption, then clean and analyse in small steps so the logic can be checked. Nothing leaves the files you share.",
  marketing: "I would start by confirming who you want to reach and what success looks like, then draft a plan and sample content you can edit before anything is published.",
  writing: "I would agree a tone with you using a few short samples, then write in batches so you can give feedback early instead of at the end.",
  admin: "I would begin with a short call to see how your team actually works, then build in stages and test the result with a real example from your work.",
};

export function draftProposalText(student: Student, project: Project, business: Business): string {
  const have = [...project.skills, ...project.tools].filter((s) => student.skills.some((k) => k.name.toLowerCase() === s.toLowerCase()));
  const reviewed = student.skills.filter((k) => have.includes(k.name) && k.trust === "reviewed").map((k) => k.name);
  const first = student.name.split(" ")[0];
  const yearWord = ["1st", "2nd", "3rd", "4th", "5th"][student.year - 1];
  const skillLine = have.length
    ? `I work with ${have.slice(0, 3).join(", ")}${reviewed.length ? `, and ${reviewed[0]} is backed by a reviewed project on my Launchpad profile` : ""}.`
    : `I am newer to ${project.skills.slice(0, 2).join(" and ")} and would use this project to learn them with a reviewer's feedback.`;
  const perWeek = Math.min(student.hoursPerWeek, Math.max(4, Math.ceil(project.hours / 3)));
  return `Hi ${business.name} team,

I'm ${first}, a ${yearWord} year ${student.program} student in ${student.faculty} at York University. ${skillLine}

For "${project.title}" ${APPROACH[project.type].charAt(0).toLowerCase()}${APPROACH[project.type].slice(1)}

I can commit about ${perWeek} hours a week and finish before ${fmtDate(project.deadline)}.

Thank you for considering me.
${first}`;
}
