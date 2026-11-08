import type { Business, EmployerType, Faculty, Level, SkillEntry, Student, Venture } from "@/schemas";
import { daysFromNow } from "@/lib/dates";

// MOCK: every person, poster and venture below is fictional demo data. None are real people or organizations,
// and Launchpad is an independent student project, not affiliated with York University or YSpace.
const sk = (name: string, level: Level): SkillEntry => ({ name, level, trust: "self", evidence: [] });
const L = { s: "Advanced", m: "Intermediate", b: "Beginner" } as const;
const S = (spec: string): SkillEntry[] => spec.split(",").map((x) => { const [n, l] = x.trim().split(":"); return sk(n, L[l as "s" | "m" | "b"]); });

const CITY: Record<string, string> = { stu_aisha: "Brampton", stu_priya: "Toronto", stu_daniel: "North York", stu_mei: "Scarborough", stu_chloe: "Toronto (Glendon)", stu_isabelle: "Toronto (Glendon)" };
const LANGS: Record<string, string[]> = { stu_aisha: ["English", "Urdu", "Punjabi"], stu_priya: ["English", "Hindi", "Malayalam"], stu_mei: ["English", "Mandarin"], stu_chloe: ["French", "English"], stu_isabelle: ["French", "English"], stu_daniel: ["English", "Twi"] };
const INTERESTS: Record<Faculty, string[]> = {
  Lassonde: ["Open source", "Hackathons", "Transit tech"], Schulich: ["Early-stage startups", "Customer research", "Pricing"], "LA&PS": ["Plain language", "Policy", "Community media"], AMPD: ["Brand design", "Motion", "Print"],
  Science: ["Reproducible research", "Data viz", "Field work"], Health: ["Community health", "Program evaluation", "Patient education"], Education: ["Tutoring", "Curriculum design", "Newcomer support"], EUC: ["Climate data", "Urban planning", "GIS"], Glendon: ["Bilingual services", "Translation", "Public policy"],
};

type Row = [id: string, name: string, program: string, faculty: Faculty, year: number, hours: number, pref: Student["pref"], skills: string, bio: string, ago: number, campus?: "Glendon"];

export function seedStudents(): Student[] {
  const rows: Row[] = [
    ["stu_aisha", "Aisha Khan", "BSc Computer Science (Honours)", "Lassonde", 2, 10, "both", "HTML:s,CSS:s,JavaScript:s,React:m,Python:m,Git:m,SQL:b,Node.js:b,Figma:b", "2nd year CS student who likes building things people actually use. Looking for my first real project experience. Comfortable with React and Python, learning backend.", 220],
    ["stu_priya", "Priya Nair", "BBA, Marketing specialization", "Schulich", 3, 8, "both", "Market Research:s,Customer Interviews:s,Excel:s,Presentation Design:s,Pricing:m,Canva:m,SQL:b", "Schulich marketing student who likes figuring out why customers do what they do. Looking for real research and strategy work with early-stage teams.", 300],
    ["stu_daniel", "Daniel Osei", "BEng Software Engineering", "Lassonde", 3, 12, "paid", "JavaScript:s,React:m,CSS:s,Node.js:m,Git:s,SQL:m", "Front-end focused and fussy about spacing. I like projects with a clear checklist and a poster who tests the thing.", 380],
    ["stu_mei", "Mei Lin", "BA Communications", "LA&PS", 4, 10, "both", "Copywriting:s,Editing:s,Social Media:m,SEO:m,User Research:m,Canva:m", "Writer who tests words the way engineers test code. I like landing pages, newsletters and anything with a clear audience.", 420],
    ["stu_arjun", "Arjun Mehta", "BSc Mathematics and Computer Science", "Science", 2, 12, "both", "Python:m,SQL:m,Statistics:m,Data Cleaning:m,Git:b", "Working through Python and SQL. Looking for projects with real, messy data.", 200],
    ["stu_sofia", "Sofia Rossi", "BES Environmental and Urban Change", "EUC", 2, 12, "paid", "Data Visualization:m,GIS:m,Research:s,Figma:b,Writing:m,Illustration:m", "GIS and visual storytelling for climate and city data. I like making dense numbers readable.", 260],
    ["stu_jordan", "Jordan Reyes", "BHS Global Health", "Health", 2, 9, "both", "Social Media:m,Canva:s,Writing:m,Email Marketing:m,Research:b", "Social media and email campaigns for student teams and early startups. Comfortable with Canva and analytics dashboards.", 240],
    ["stu_fatima", "Fatima Noor", "BBA Finance", "Schulich", 3, 8, "paid", "Excel:s,Financial Modelling:m,Documentation:s,Market Research:m,Presentation Design:m", "Operations and finance. I write clear templates and keep numbers tidy.", 330],
    ["stu_liam", "Liam O'Brien", "BSc Computer Science", "Lassonde", 3, 14, "both", "JavaScript:s,Python:s,Testing:m,SQL:m,Git:s,Node.js:m", "Backend leaning and happy to build forms, scripts and test tools for people who do not have a developer.", 360],
    ["stu_hannah", "Hannah Kim", "BA Professional Writing", "LA&PS", 3, 10, "both", "Writing:s,Editing:s,Research:s,SEO:m,Accessibility:b", "Writer and editor. Handbooks, website copy and plain-language guides.", 300],
    ["stu_noor", "Noor Siddiqui", "BA Psychology", "Health", 3, 8, "both", "Research Methods:s,SPSS:m,Survey Design:m,Data Entry:m,Writing:m", "Psychology student who wants more research methods practice outside class. Careful with data and consent forms.", 250],
    ["stu_theo", "Theo Park", "BFA Digital Media", "AMPD", 3, 10, "paid", "Figma:s,Branding:s,Illustration:m,Motion Design:m,Layout Design:s", "Brand and motion designer. I ship the source files and a one-page guide with every project.", 280],
    ["stu_amara", "Amara Okoye", "BSc Biology", "Science", 3, 8, "both", "Lab Protocols:m,Data Analysis:m,R:b,Scientific Writing:m,Excel:m", "Biology student interested in field data and reproducible analysis.", 210],
    ["stu_chloe", "Chloe Tremblay", "BA Linguistics (Glendon)", "Glendon", 2, 8, "both", "French:s,Translation:s,Editing:m,Research:m,Writing:m", "Bilingual student. Translations, plain-language editing and accessibility reviews in English and French.", 230, "Glendon"],
    ["stu_ethan", "Ethan Walker", "BEd Education", "Education", 4, 7, "volunteer", "Lesson Design:s,Public Speaking:m,Writing:m,Canva:m,Research:m", "Future teacher. Curriculum, tutoring materials and workshop design.", 270],
    ["stu_zainab", "Zainab Ahmed", "BSc Kinesiology and Health Science", "Health", 2, 9, "both", "Research:m,Data Entry:m,Excel:m,Writing:m,Survey Design:b", "Interested in community health research and program evaluation.", 190],
    ["stu_ravi", "Ravi Patel", "BEng Computer Engineering", "Lassonde", 4, 14, "paid", "C++:s,Python:m,Embedded Systems:m,Testing:s,Git:s,Linux:m", "Embedded and testing. I like finding the bug before the player or customer does.", 400],
    ["stu_isabelle", "Isabelle Moreau", "BA Political Science (Glendon)", "Glendon", 3, 8, "volunteer", "Policy Research:s,Writing:s,French:s,Interviewing:m,Editing:m", "Policy research and plain-language writing, English and French.", 310, "Glendon"],
    ["stu_kwame", "Kwame Mensah", "BComm Accounting", "Schulich", 2, 8, "paid", "Excel:m,Bookkeeping:m,Documentation:m,Financial Modelling:b", "Accounting student who likes clean spreadsheets and clear handover notes.", 180],
    ["stu_lucia", "Lucia Fernandez", "BFA Design", "AMPD", 4, 10, "both", "Figma:s,Illustration:s,Branding:m,Print Layout:s,Canva:m", "Print and brand designer. Posters, packaging and anything a person will hold in their hands.", 350],
    ["stu_omid", "Omid Rahimi", "BSc Physics", "Science", 3, 10, "both", "Python:s,Data Analysis:s,Statistics:m,LaTeX:m,Git:m", "Physics student who writes analysis scripts and clean notebooks.", 290],
    ["stu_grace", "Grace Liu", "BSc Data Science", "Science", 3, 12, "paid", "SQL:s,Python:m,Data Visualization:s,Tableau:m,Excel:s,Statistics:m", "Turning raw exports into dashboards people actually open. SQL first, charts second.", 310],
    ["stu_sam", "Sam Brooks", "BA Sociology", "LA&PS", 2, 8, "both", "Interviewing:m,Qualitative Research:m,Writing:m,Transcription:s,Research:m", "Interviews and qualitative coding. Careful note-taker.", 170],
    ["stu_tara", "Tara Singh", "BHS Nursing", "Health", 3, 7, "volunteer", "Patient Education:m,Writing:m,Research:m,Canva:b", "Nursing student interested in plain-language health materials.", 200],
  ];
  return rows.map(([id, name, program, faculty, year, hours, pref, skills, bio, ago, campus]) => ({
    id, slug: name.toLowerCase().replace(/[^a-z ]/g, "").replace(/ /g, "-"), name,
    email: `${name.toLowerCase().replace(/[^a-z ]/g, "").replace(/ /g, ".")}@my.yorku.ca`, yorkVerified: true, program, faculty, year, campus: campus ?? "Keele",
    bio, hoursPerWeek: hours, pref, skills: S(skills), createdAt: daysFromNow(-ago),
    city: CITY[id] ?? ["Toronto", "North York", "Vaughan", "Mississauga", "Brampton", "Markham", "Scarborough"][name.length % 7],
    github: id === "stu_aisha" || /^(stu_daniel|stu_liam|stu_ravi|stu_arjun|stu_omid|stu_grace)$/.test(id) ? `https://github.com/${name.toLowerCase().replace(/[^a-z]/g, "")}` : undefined,
    linkedin: `https://www.linkedin.com/in/${name.toLowerCase().replace(/[^a-z ]/g, "").replace(/ /g, "-")}-demo`,
    languages: LANGS[id] ?? ["English"],
    interests: INTERESTS[faculty],
    ...(id === "stu_aisha" ? { portfolioUrl: "https://aisha-khan.dev" } : {}),
  }));
}

type B = [id: string, name: string, type: EmployerType, category: string, city: string, founded: number, size: string, rating: number, description: string, flags: { alumni?: boolean; near?: boolean }, ago: number, contact: string];

export function seedBusinesses(): Business[] {
  const rows: B[] = [
    ["biz_reroute", "Reroute", "yspace_startup", "Mobility startup", "Markham", 2026, "3 people", 4.5, "Real-time rerouting for transit riders. We tell you the faster way before you are stuck on the platform.", { alumni: true }, 270, "Fares Tamraz"],
    ["biz_corner", "Corner Press Coffee", "local_business", "Cafe", "Toronto", 2016, "7 staff", 4.8, "Independent coffee shop two blocks from campus with a loyal weekday crowd and very quiet Tuesday nights.", { near: true }, 400, "Dana Kowalski"],
    ["biz_foodbank", "Northgate Community Food Bank", "nonprofit", "Food bank", "Toronto", 2004, "120 volunteers", 4.7, "Community food bank with 120 active volunteers and a board that meets monthly.", { near: true }, 450, "Hannah Boateng"],
    ["biz_lantern", "Paper Lantern Games", "founder", "Indie game studio", "Toronto", 2023, "4 people", 4.8, "Alumni-run indie studio shipping its first narrative puzzle game.", { alumni: true }, 320, "Theo Park"],
    ["biz_psylab", "Whitford Cognition Lab", "professor", "Research lab", "Toronto", 2018, "9 researchers", 4.9, "Psychology lab running participant studies on attention and memory, led by Prof. Elaine Whitford.", {}, 420, "Prof. Elaine Whitford"],
    ["biz_roboclub", "York Robotics Club", "york_unit", "Student club", "Toronto", 2012, "40 members", 4.7, "Student robotics club that builds competition robots and hosts a monthly hack night.", {}, 440, "Jordan Lee"],
    ["biz_casecomp", "Schulich Case Club", "york_unit", "Student club", "Toronto", 2009, "25 volunteers", 4.8, "Student club running case competitions and an annual networking night.", {}, 430, "Marcus Chen"],
    ["biz_kitchen", "Finch Community Kitchen", "nonprofit", "Community kitchen", "Toronto", 2011, "30 volunteers", 4.6, "Neighbourhood kitchen serving weekly meals, run mostly by volunteers.", { near: true }, 390, "Rosa Delgado"],
    ["biz_comms", "Department Communications Office", "york_unit", "Department", "Toronto", 2010, "3 staff", 4.5, "Department communications office producing recaps, posters and newsletters.", {}, 410, "Priscilla Adeyemi"],
    ["biz_a11y", "Campus Web Accessibility Working Group", "york_unit", "Working group", "Toronto", 2019, "8 members", 4.6, "Staff and students reviewing department web pages against accessibility guidelines.", {}, 360, "Colin Marsh"],
    ["biz_fieldnote", "Fieldnote", "founder", "Student startup", "Toronto", 2025, "2 founders", 4.7, "Two-person student startup building a note-taking app for field researchers.", {}, 190, "Yusuf Demir"],
    ["biz_clinic", "Finch Family Clinic", "local_business", "Walk-in clinic", "Toronto", 2011, "12 staff", 4.4, "Walk-in clinic that wants fewer missed appointments.", { near: true }, 370, "Dr. Ananya Rao"],
    ["biz_garden", "Maple Hill Community Garden", "nonprofit", "Community garden", "Toronto", 2012, "60 members", 4.8, "Neighbourhood garden with 85 plots and a rota that lives in a group chat.", { near: true }, 405, "Greta Lindqvist"],
    ["biz_vizlab", "Lin Visualization Lab", "professor", "Research lab", "Toronto", 2017, "7 researchers", 4.8, "Lab studying how people read charts, with a paper due this term.", {}, 350, "Prof. David Lin"],
    ["biz_exchange", "Greenfield Language Exchange", "nonprofit", "Language nonprofit", "Toronto", 2015, "40 volunteers", 4.6, "Free conversation circles for newcomers learning English and French.", { near: true }, 380, "Maya Dubois"],
    // Ventures
    ["biz_harvest", "Harvest Loop", "yspace_startup", "Agri-food startup", "Markham", 2026, "4 people", 4.7, "Dynamic pricing and ordering for restaurants that buy from small farms.", {}, 200, "Lina Okafor"],
    ["biz_pulsedesk", "PulseDesk", "yspace_startup", "Healthtech startup", "Markham", 2025, "5 people", 4.6, "Appointment reminders that small clinics can set up in an afternoon.", {}, 300, "Kareem Haddad"],
    ["biz_ledgerly", "Ledgerly", "yspace_startup", "Fintech startup", "Markham", 2025, "4 people", 4.6, "Invoicing and payment chasing for freelancers.", {}, 310, "Mina Choi"],
    ["biz_tidewell", "Tidewell", "yspace_startup", "Climate startup", "Markham", 2026, "3 people", 4.7, "Home water-use insights that show where the litres go.", {}, 180, "Isaac Boateng"],
    ["biz_fernwood", "Fernwood Labs", "yspace_startup", "AI tools startup", "Markham", 2025, "3 people", 4.7, "Document summaries for teams that drown in PDFs.", {}, 250, "Nadia Petrova"],
    ["biz_plantlane", "Plantlane", "yspace_startup", "Agri-food startup", "Markham", 2026, "3 people", 4.5, "Community garden planning with plot maps and planting calendars.", {}, 150, "Felix Andersson"],
    ["biz_signalbox", "Signalbox", "yspace_startup", "Mobility startup", "Markham", 2025, "4 people", 4.6, "Maintenance tracking for e-bike fleets.", {}, 280, "Aaliyah Brown"],
    ["biz_brightpath", "Brightpath", "yspace_startup", "Edtech startup", "Markham", 2026, "3 people", 4.6, "Tutoring marketplace for newcomer students.", {}, 160, "Sunita Rao"],
    ["biz_northbeam", "Northbeam", "yspace_startup", "Energy startup", "Markham", 2026, "3 people", 4.4, "Small-business energy audits from utility bills.", {}, 140, "Gabriel Costa"],
  ];
  return rows.map(([id, name, employerType, category, city, founded, size, rating, description, f, ago]) => ({
    id, name, employerType, category, city, founded, size, rating, description, alumniOwned: Boolean(f.alumni), nearCampus: Boolean(f.near), createdAt: daysFromNow(-ago),
  }));
}

/** Contact person shown as the poster's name in messages and reviews. */
export const CONTACT: Record<string, string> = {
  biz_reroute: "Fares Tamraz", biz_corner: "Dana Kowalski", biz_foodbank: "Hannah Boateng", biz_lantern: "Theo Park", biz_psylab: "Prof. Elaine Whitford", biz_roboclub: "Jordan Lee", biz_casecomp: "Marcus Chen",
  biz_kitchen: "Rosa Delgado", biz_comms: "Priscilla Adeyemi", biz_a11y: "Colin Marsh", biz_fieldnote: "Yusuf Demir", biz_clinic: "Dr. Ananya Rao", biz_garden: "Greta Lindqvist", biz_vizlab: "Prof. David Lin",
  biz_harvest: "Lina Okafor", biz_pulsedesk: "Kareem Haddad", biz_ledgerly: "Mina Choi", biz_tidewell: "Isaac Boateng", biz_fernwood: "Nadia Petrova", biz_plantlane: "Felix Andersson", biz_signalbox: "Aaliyah Brown",
  biz_brightpath: "Sunita Rao", biz_northbeam: "Gabriel Costa", biz_exchange: "Maya Dubois",
};

type V = [id: string, biz: string, name: string, pitch: string, sector: Venture["sector"], stage: Venture["stage"], team: number, stack: string[], founders: [string, string, string][], tone: Venture["logoTone"], founded: number, waitlist?: number];

export function seedVentures(): Venture[] {
  const rows: V[] = [
    ["ven_reroute", "biz_reroute", "Reroute", "Real-time rerouting for transit riders. We tell you the faster way before you are stuck on the platform.", "mobility", "prototype", 3, ["React", "TypeScript", "Node.js", "PostgreSQL", "Mapbox", "GTFS"], [["Fares Tamraz", "CEO", "York alumnus (BSc Computer Science, 2023). Rides transit daily and got tired of finding out about delays too late."], ["Sana Iqbal", "CTO", "York alumna who started as an intern and now runs the backend and data feeds."]], "red", 275, 214],
    ["ven_harvest", "biz_harvest", "Harvest Loop", "Dynamic pricing and ordering for restaurants that buy produce from small farms.", "agrifood", "prototype", 4, ["Next.js", "Python", "PostgreSQL"], [["Lina Okafor", "CEO", "Grew up around her family's market stall and watched prices change by the hour."], ["Peter Sloan", "CTO", "Backend engineer and weekend farmer."]], "ink", 200],
    ["ven_pulsedesk", "biz_pulsedesk", "PulseDesk", "Appointment reminders that small clinics can set up in an afternoon.", "healthtech", "preseed", 5, ["React", "Node.js", "Twilio"], [["Kareem Haddad", "CEO", "Worked front desk at a family clinic and counted the no-shows."], ["Joy Mbeki", "Head of product", "Designs for the front desk, not the dashboard."]], "tint", 330],
    ["ven_ledgerly", "biz_ledgerly", "Ledgerly", "Invoicing and payment chasing for freelancers.", "fintech", "prototype", 4, ["Vue", "Node.js", "Stripe"], [["Mina Choi", "CEO", "Freelance illustrator turned founder after one too many late invoices."], ["Andre Silva", "CTO", "Payments engineer."]], "gray", 320],
    ["ven_tidewell", "biz_tidewell", "Tidewell", "Home water-use insights that show where the litres go.", "climate", "idea", 3, ["React Native", "Python", "InfluxDB"], [["Isaac Boateng", "CEO", "Environmental science grad who tracks his own water bill like a hobby."]], "ink", 190],
    ["ven_fernwood", "biz_fernwood", "Fernwood Labs", "Document summaries for teams that drown in PDFs.", "ai_tools", "prototype", 3, ["Python", "FastAPI", "React"], [["Nadia Petrova", "CEO", "Former paralegal who read too many contracts."], ["Ben Ito", "CTO", "ML engineer."]], "red", 260],
    ["ven_plantlane", "biz_plantlane", "Plantlane", "Community garden planning with plot maps and planting calendars.", "agrifood", "idea", 3, ["Next.js", "Supabase"], [["Felix Andersson", "CEO", "Runs the rota for his neighbourhood garden in a spreadsheet and wants out."]], "tint", 150],
    ["ven_signalbox", "biz_signalbox", "Signalbox", "Maintenance tracking for e-bike fleets.", "mobility", "preseed", 4, ["React", "Go", "PostgreSQL"], [["Aaliyah Brown", "CEO", "Ran a bike share pilot on campus."], ["Chen Wei", "CTO", "Embedded and backend."]], "gray", 290],
    ["ven_brightpath", "biz_brightpath", "Brightpath", "Tutoring marketplace for newcomer students.", "edtech", "prototype", 3, ["Next.js", "Stripe", "PostgreSQL"], [["Sunita Rao", "CEO", "Former tutor who arrived in Canada at 14."]], "ink", 170],
    ["ven_northbeam", "biz_northbeam", "Northbeam", "Small-business energy audits from utility bills.", "climate", "idea", 3, ["Python", "React"], [["Gabriel Costa", "CEO", "Engineer who audited his parents' bakery."]], "tint", 140],
  ];
  return rows.map(([id, businessId, name, pitch, sector, stage, teamSize, stack, founders, logoTone, ago, waitlist]) => ({
    id, businessId, name, pitch, sector, stage, teamSize, stack, founders: founders.map(([n, r, bio]) => ({ name: n, role: r, bio })), yspaceVerified: true, logoTone,
    location: "Markham", foundedAt: daysFromNow(-ago), ...(waitlist ? { waitlist } : {}),
  }));
}
