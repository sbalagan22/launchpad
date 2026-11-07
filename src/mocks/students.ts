import type { Level, SkillEntry, Student, Trust } from "@/schemas";
import { daysFromNow } from "@/lib/dates";

// MOCK: hand-written seed students. Trust levels here are the starting state;
// badges earned through completed projects are reconciled in seed.ts.
const sk = (name: string, level: Level, trust: Trust, evidence: string[] = []): SkillEntry => ({
  name,
  level,
  trust,
  evidence: evidence.map((label) => ({ label })),
});

export function seedStudents(): Student[] {
  return [
    {
      id: "stu_aisha", slug: "aisha-khan", name: "Aisha Khan", school: "York University", year: 2, field: "Computer Science", city: "Mississauga",
      bio: "Front-end development and UX. Based in Mississauga, ON.", hoursPerWeek: 10, pref: "both", portfolioUrl: "https://aisha-khan.dev",
      skills: [
        sk("UX Design", "Intermediate", "issuer", ["Google UX Design Certificate"]),
        sk("HTML", "Intermediate", "checked"), sk("CSS", "Intermediate", "checked"), sk("Figma", "Intermediate", "checked"),
        sk("JavaScript", "Beginner", "self", ["Added by student"]),
        sk("Web Development", "Intermediate", "self", ["Added by student"]),
      ],
      createdAt: daysFromNow(-120),
    },
    {
      id: "stu_daniel", slug: "daniel-okafor", name: "Daniel Okafor", school: "Humber College", year: 2, field: "Web Development", city: "Brampton",
      bio: "Building small business sites with HTML, CSS and a little WordPress. I like projects with a clear checklist.", hoursPerWeek: 12, pref: "paid",
      skills: [sk("HTML", "Intermediate", "checked"), sk("CSS", "Intermediate", "checked"), sk("JavaScript", "Intermediate", "self"), sk("WordPress", "Beginner", "self"), sk("Web Development", "Intermediate", "self")],
      createdAt: daysFromNow(-150),
    },
    {
      id: "stu_priya", slug: "priya-shah", name: "Priya Shah", school: "Toronto Metropolitan University", year: 3, field: "Graphic Communications", city: "Toronto",
      bio: "Brand and print designer who also sketches. Portfolio link available on request.", hoursPerWeek: 8, pref: "both", portfolioUrl: "https://priya-shah.design",
      skills: [sk("Figma", "Advanced", "checked"), sk("Branding", "Advanced", "checked"), sk("Illustration", "Intermediate", "self"), sk("CSS", "Beginner", "self"), sk("Canva", "Advanced", "self")],
      createdAt: daysFromNow(-140),
    },
    {
      id: "stu_marcus", slug: "marcus-chen", name: "Marcus Chen", school: "University of Toronto", year: 4, field: "Statistics", city: "Toronto",
      bio: "Statistics major who enjoys turning messy spreadsheets into something a front desk can use.", hoursPerWeek: 10, pref: "paid",
      skills: [sk("SQL", "Advanced", "issuer", ["Google Data Analytics Certificate"]), sk("Excel", "Advanced", "checked"), sk("Data Cleaning", "Advanced", "checked"), sk("Python", "Intermediate", "self"), sk("Data Visualization", "Intermediate", "checked")],
      createdAt: daysFromNow(-160),
    },
    {
      id: "stu_sofia", slug: "sofia-rossi", name: "Sofia Rossi", school: "Sheridan College", year: 2, field: "Visual and Creative Arts", city: "Oakville",
      bio: "Illustration-led designer. Logos, packaging and layouts for small shops.", hoursPerWeek: 12, pref: "paid",
      skills: [sk("Illustration", "Advanced", "checked"), sk("Branding", "Intermediate", "checked"), sk("Figma", "Intermediate", "self"), sk("Layout Design", "Advanced", "checked"), sk("Canva", "Intermediate", "self")],
      createdAt: daysFromNow(-130),
    },
    {
      id: "stu_jordan", slug: "jordan-lee", name: "Jordan Lee", school: "Seneca College", year: 2, field: "Marketing", city: "Brampton",
      bio: "Social media and email campaigns for local teams. Comfortable with Canva and Mailchimp.", hoursPerWeek: 9, pref: "both",
      skills: [sk("Social Media", "Intermediate", "issuer", ["Meta Social Media Marketing Certificate"]), sk("Canva", "Advanced", "checked"), sk("Writing", "Intermediate", "self"), sk("Email Marketing", "Intermediate", "checked"), sk("Research", "Beginner", "self")],
      createdAt: daysFromNow(-110),
    },
    {
      id: "stu_fatima", slug: "fatima-noor", name: "Fatima Noor", school: "York University", year: 3, field: "Business Administration", city: "Mississauga",
      bio: "Operations and finance. I write clear templates and keep numbers tidy.", hoursPerWeek: 8, pref: "paid",
      skills: [sk("Excel", "Advanced", "checked"), sk("Bookkeeping", "Intermediate", "self"), sk("Documentation", "Advanced", "checked"), sk("Research", "Intermediate", "checked"), sk("Presentation Design", "Intermediate", "self")],
      createdAt: daysFromNow(-125),
    },
    {
      id: "stu_liam", slug: "liam-obrien", name: "Liam O'Brien", school: "University of Toronto", year: 3, field: "Computer Science", city: "Toronto",
      bio: "Backend leaning, happy to build forms, scripts and small tools for people who do not have a developer.", hoursPerWeek: 14, pref: "both",
      skills: [sk("JavaScript", "Advanced", "checked"), sk("HTML", "Advanced", "checked"), sk("Python", "Advanced", "checked"), sk("SQL", "Intermediate", "self"), sk("CSS", "Intermediate", "self"), sk("Web Development", "Advanced", "self")],
      createdAt: daysFromNow(-170),
    },
    {
      id: "stu_hannah", slug: "hannah-kim", name: "Hannah Kim", school: "Toronto Metropolitan University", year: 3, field: "Professional Communication", city: "Toronto",
      bio: "Writer and editor. Blog posts, FAQs, website copy and plain-language guides.", hoursPerWeek: 10, pref: "both",
      skills: [sk("Writing", "Advanced", "checked"), sk("SEO", "Intermediate", "issuer", ["Google Analytics Certification"]), sk("Research", "Advanced", "checked"), sk("Social Media", "Intermediate", "self"), sk("Editing", "Advanced", "self")],
      createdAt: daysFromNow(-100),
    },
    {
      id: "stu_arjun", slug: "arjun-mehta", name: "Arjun Mehta", school: "Seneca College", year: 2, field: "Data Analytics", city: "Brampton",
      bio: "Analytics student working through Power BI and SQL. Looking for projects with real messy data.", hoursPerWeek: 12, pref: "both",
      skills: [sk("Excel", "Intermediate", "checked"), sk("SQL", "Intermediate", "self"), sk("Power BI", "Beginner", "self"), sk("Data Cleaning", "Intermediate", "checked"), sk("Data Visualization", "Beginner", "self")],
      createdAt: daysFromNow(-90),
    },
    {
      id: "stu_emily", slug: "emily-tremblay", name: "Emily Tremblay", school: "Humber College", year: 3, field: "Accounting", city: "Mississauga",
      bio: "Accounting diploma student. Budgets, reconciliations and clear spreadsheets.", hoursPerWeek: 7, pref: "paid",
      skills: [sk("Excel", "Advanced", "checked"), sk("Bookkeeping", "Advanced", "self"), sk("Budgeting", "Advanced", "checked"), sk("Documentation", "Intermediate", "self")],
      createdAt: daysFromNow(-95),
    },
    {
      id: "stu_omar", slug: "omar-hassan", name: "Omar Hassan", school: "Sheridan College", year: 1, field: "Interactive Media Design", city: "Mississauga",
      bio: "First-year interactive media student. Eager to ship my first client site.", hoursPerWeek: 15, pref: "both",
      skills: [sk("HTML", "Intermediate", "self"), sk("CSS", "Intermediate", "self"), sk("JavaScript", "Beginner", "self"), sk("Figma", "Beginner", "self"), sk("Web Development", "Beginner", "self")],
      createdAt: daysFromNow(-40),
    },
  ];
}
