import type { Business, Project, ProjectType, Student } from "@/schemas";
import { fmtDate } from "@/lib/dates";

// MOCK: pre-written proposal drafting. Tailored by project type with the student's real
// profile data, so every draft reads as specific without calling a model.
const APPROACH: Record<ProjectType, string> = {
  web: "I would start with a short plan and a mockup for your approval, then build and test in stages so you can review each milestone on a staging link before anything goes live.",
  design: "I would start with a few rough directions so you can react early, then refine the one you like and hand over print-ready and web-ready files with a one-page usage guide.",
  data: "I would begin by profiling the data and writing down every assumption, then clean and analyse in small steps so you can check the logic. Nothing leaves the files you share with me.",
  marketing: "I would start by confirming who you want to reach and what success looks like, then draft a plan and sample content you can edit before anything is posted.",
  writing: "I would agree a tone with you using a few short samples, then write in batches so you can give feedback early instead of at the end.",
  admin: "I would begin with a short call to understand how your team actually works, then build the template in stages and test it with a real example from your business.",
};

export function draftProposalText(student: Student, project: Project, business: Business): string {
  const have = project.skills.filter((s) => student.skills.some((k) => k.name === s));
  const verified = student.skills.filter((k) => have.includes(k.name) && k.trust !== "self").map((k) => k.name);
  const first = student.name.split(" ")[0];
  const yearWord = ["1st", "2nd", "3rd", "4th", "5th"][student.year - 1];
  const skillLine = have.length
    ? `I work with ${have.slice(0, 3).join(", ")}${verified.length ? `, and ${verified[0]} is verified on my Launchpad profile` : ""}.`
    : `I am building skills in ${project.skills.slice(0, 2).join(" and ")} and would use this project to prove them.`;
  const perWeek = Math.min(student.hoursPerWeek, Math.max(4, Math.ceil(project.hours / 3)));
  return `Hi ${business.name} team,

I'm ${first}, a ${yearWord} year ${student.field} student at ${student.school}. ${skillLine}

For "${project.title}" ${APPROACH[project.type].charAt(0).toLowerCase()}${APPROACH[project.type].slice(1)}

I can commit about ${perWeek} hours a week and finish before ${fmtDate(project.deadline)}.

Thank you for considering me.
${first}`;
}
