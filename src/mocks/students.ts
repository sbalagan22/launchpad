import type { Faculty, Level, SkillEntry, Student } from "@/schemas";
import { daysFromNow } from "@/lib/dates";

// MOCK: hand-written York students (fictional). Skill trust here is the starting state; skills backed by
// reviewer-approved projects are upgraded to "reviewed" in seed.ts.
const sk = (name: string, level: Level, evidence: string[] = []): SkillEntry => ({ name, level, trust: "self", evidence: evidence.map((label) => ({ label })) });

type Row = { id: string; slug: string; name: string; program: string; faculty: Faculty; year: number; campus?: "Keele" | "Glendon"; bio: string; hours: number; pref: Student["pref"]; portfolio?: string; skills: SkillEntry[]; ago: number };

export function seedStudents(): Student[] {
  const rows: Row[] = [
    { id: "stu_aisha", slug: "aisha-khan", name: "Aisha Khan", program: "Computer Science", faculty: "Lassonde", year: 2, bio: "Front-end development and UX. I like shipping small things people can use and getting a real person to review them.", hours: 10, pref: "both", portfolio: "https://aisha-khan.dev",
      skills: [sk("HTML", "Intermediate"), sk("CSS", "Intermediate"), sk("JavaScript", "Intermediate"), sk("React", "Beginner"), sk("Git", "Intermediate")], ago: 120 },
    { id: "stu_daniel", slug: "daniel-okafor", name: "Daniel Okafor", program: "Software Engineering", faculty: "Lassonde", year: 3, bio: "Full-stack basics with a bias for tidy code. I like projects with a clear checklist and a reviewer who reads the diff.", hours: 12, pref: "paid",
      skills: [sk("JavaScript", "Advanced"), sk("React", "Intermediate"), sk("Node.js", "Intermediate"), sk("Git", "Advanced"), sk("SQL", "Intermediate")], ago: 150 },
    { id: "stu_priya", slug: "priya-shah", name: "Priya Shah", program: "Design", faculty: "AMPD", year: 3, bio: "Brand and print designer who also sketches. I ship print-ready files and a one-page guide with every project.", hours: 8, pref: "both", portfolio: "https://priya-shah.design",
      skills: [sk("Figma", "Advanced"), sk("Branding", "Advanced"), sk("Illustration", "Intermediate"), sk("Layout Design", "Advanced"), sk("Canva", "Advanced")], ago: 140 },
    { id: "stu_marcus", slug: "marcus-chen", name: "Marcus Chen", program: "Statistics", faculty: "Science", year: 4, bio: "Statistics major who enjoys turning messy spreadsheets into something a front desk or a board can use.", hours: 10, pref: "paid",
      skills: [sk("SQL", "Advanced"), sk("Python", "Intermediate"), sk("Data Cleaning", "Advanced"), sk("Data Visualization", "Intermediate"), sk("Excel", "Advanced")], ago: 160 },
    { id: "stu_sofia", slug: "sofia-rossi", name: "Sofia Rossi", program: "Environmental and Urban Change", faculty: "EUC", year: 2, bio: "GIS and visual storytelling for climate and city data. I like making dense numbers readable.", hours: 12, pref: "paid",
      skills: [sk("Data Visualization", "Intermediate"), sk("Illustration", "Intermediate"), sk("Research", "Advanced"), sk("Figma", "Beginner"), sk("Writing", "Intermediate")], ago: 130 },
    { id: "stu_jordan", slug: "jordan-lee", name: "Jordan Lee", program: "Global Health", faculty: "Health", year: 2, bio: "Social media and email campaigns for student teams and early startups. Comfortable with Canva and analytics dashboards.", hours: 9, pref: "both",
      skills: [sk("Social Media", "Intermediate"), sk("Canva", "Advanced"), sk("Writing", "Intermediate"), sk("Email Marketing", "Intermediate"), sk("Research", "Beginner")], ago: 110 },
    { id: "stu_fatima", slug: "fatima-noor", name: "Fatima Noor", program: "Business Administration", faculty: "Schulich", year: 3, bio: "Operations and finance. I write clear templates and keep numbers tidy.", hours: 8, pref: "paid",
      skills: [sk("Excel", "Advanced"), sk("Documentation", "Advanced"), sk("Market Research", "Intermediate"), sk("Presentation Design", "Intermediate"), sk("Financial Modelling", "Beginner")], ago: 125 },
    { id: "stu_liam", slug: "liam-obrien", name: "Liam O'Brien", program: "Computer Science", faculty: "Lassonde", year: 3, bio: "Backend leaning and happy to build forms, scripts and test tools for people who do not have a developer.", hours: 14, pref: "both",
      skills: [sk("JavaScript", "Advanced"), sk("Python", "Advanced"), sk("Testing", "Intermediate"), sk("SQL", "Intermediate"), sk("Git", "Advanced")], ago: 170 },
    { id: "stu_hannah", slug: "hannah-kim", name: "Hannah Kim", program: "Professional Writing", faculty: "LA&PS", year: 3, bio: "Writer and editor. Handbooks, website copy and plain-language guides.", hours: 10, pref: "both",
      skills: [sk("Writing", "Advanced"), sk("Editing", "Advanced"), sk("Research", "Advanced"), sk("SEO", "Intermediate"), sk("Accessibility", "Beginner")], ago: 100 },
    { id: "stu_arjun", slug: "arjun-mehta", name: "Arjun Mehta", program: "Mathematics and Computer Science", faculty: "Science", year: 2, bio: "Working through Python and SQL. Looking for projects with real, messy data.", hours: 12, pref: "both",
      skills: [sk("Python", "Intermediate"), sk("SQL", "Intermediate"), sk("Data Cleaning", "Intermediate"), sk("Data Visualization", "Beginner"), sk("Excel", "Intermediate")], ago: 90 },
    { id: "stu_emily", slug: "emily-tremblay", name: "Emily Tremblay", program: "Economics", faculty: "Glendon", year: 3, campus: "Glendon", bio: "Bilingual economics student. Budgets, reconciliations and clear spreadsheets, in English or French.", hours: 7, pref: "paid",
      skills: [sk("Excel", "Advanced"), sk("Budgeting", "Advanced"), sk("Documentation", "Intermediate"), sk("Research", "Intermediate")], ago: 95 },
    { id: "stu_omar", slug: "omar-hassan", name: "Omar Hassan", program: "Computer Engineering", faculty: "Lassonde", year: 1, bio: "First-year engineer eager to ship my first client site.", hours: 15, pref: "both",
      skills: [sk("HTML", "Intermediate"), sk("CSS", "Intermediate"), sk("JavaScript", "Beginner"), sk("Git", "Beginner")], ago: 40 },
  ];
  return rows.map((r) => ({
    id: r.id, slug: r.slug, name: r.name, email: `${r.slug.replace("-", ".")}@my.yorku.ca`, yorkVerified: true, program: r.program, faculty: r.faculty, year: r.year,
    campus: r.campus ?? "Keele", bio: r.bio, hoursPerWeek: r.hours, pref: r.pref, portfolioUrl: r.portfolio, skills: r.skills, createdAt: daysFromNow(-r.ago),
  }));
}
