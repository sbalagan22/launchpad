import type { Business, EmployerType, Reviewer, Venture } from "@/schemas";
import { daysFromNow } from "@/lib/dates";

// MOCK: every poster, reviewer and venture below is fictional demo data. None of them are real
// organizations, and Launchpad is not affiliated with York University or YSpace.
type B = [id: string, name: string, type: EmployerType, category: string, city: string, founded: number, size: string, rating: number, description: string, flags: { alumni?: boolean; near?: boolean }, ago: number];

export function seedBusinesses(): Business[] {
  const rows: B[] = [
    ["biz_corner", "Corner Press Coffee", "local_business", "Cafe", "Toronto", 2016, "7 staff", 4.8, "Independent coffee shop two blocks from campus with a loyal weekday crowd and very quiet Tuesday nights.", { near: true }, 200],
    ["biz_foodbank", "Northgate Community Food Bank", "nonprofit", "Food bank", "Toronto", 2004, "120 volunteers", 4.7, "Community food bank with 120 active volunteers and a board that meets monthly.", { near: true }, 210],
    ["biz_lantern", "Paper Lantern Games", "founder", "Indie game studio", "Toronto", 2023, "4 people", 4.8, "Alumni-run indie studio shipping its first narrative puzzle game.", { alumni: true }, 120],
    ["biz_psylab", "Osei Cognition Lab", "professor", "Research lab", "Toronto", 2018, "9 researchers", 4.9, "Psychology research lab running participant studies on attention and memory.", {}, 190],
    ["biz_roboclub", "Keele Robotics Club", "york_unit", "Student club", "Toronto", 2012, "40 members", 4.7, "Student robotics club that builds competition robots and hosts a monthly hack night.", {}, 220],
    ["biz_bsa", "Business Student Association", "york_unit", "Student association", "Toronto", 2009, "25 volunteers", 4.6, "Student association running case competitions and an annual networking night.", {}, 180],
    ["biz_digmedia", "Digital Media Comms Office", "york_unit", "Department", "Toronto", 2010, "3 staff", 4.5, "Department communications office producing recaps, posters and newsletters.", {}, 170],
    ["biz_a11y", "Campus Web Accessibility Working Group", "york_unit", "Working group", "Toronto", 2019, "8 members", 4.6, "Staff and students reviewing department web pages against accessibility guidelines.", {}, 160],
    ["biz_fieldnote", "Fieldnote", "founder", "Student startup", "Toronto", 2025, "2 founders", 4.7, "Two-person student startup building a note-taking app for field researchers.", {}, 90],
    ["biz_finch", "Finch Family Clinic", "local_business", "Walk-in clinic", "Toronto", 2011, "12 staff", 4.4, "Walk-in clinic that wants fewer missed appointments.", { near: true }, 175],
    ["biz_garden", "Maple Hill Community Garden", "nonprofit", "Community garden", "Toronto", 2012, "60 members", 4.8, "Neighbourhood garden with 85 plots and a rota that lives in a group chat.", { near: true }, 205],
    ["biz_vizlab", "Lin Visualization Lab", "professor", "Research lab", "Toronto", 2017, "7 researchers", 4.8, "Lab studying how people read charts, with a paper due this term.", {}, 165],
    // YSpace startups (fictional)
    ["biz_reroute", "Reroute", "yspace_startup", "Mobility startup", "Toronto", 2025, "3 founders", 4.8, "Rerouting for transit riders when their usual line is delayed.", {}, 110],
    ["biz_sprig", "Sprig", "yspace_startup", "Agri-food startup", "Toronto", 2025, "4 people", 4.7, "Helps small urban farms sell weekly produce boxes directly to neighbours.", {}, 100],
    ["biz_pulse", "Pulsewise", "yspace_startup", "Healthtech startup", "Toronto", 2024, "5 people", 4.6, "Lightweight check-in tool for community clinics.", {}, 130],
    ["biz_ledgerleaf", "LedgerLeaf", "yspace_startup", "Fintech startup", "Toronto", 2024, "4 people", 4.6, "Invoice tracking for freelancers who hate chasing payments.", {}, 125],
    ["biz_kiln", "Kiln", "yspace_startup", "AI tools startup", "Toronto", 2025, "3 founders", 4.7, "Testing harness that helps teams compare prompts and models.", {}, 95],
    ["biz_tidewell", "Tidewell", "yspace_startup", "Climate startup", "Toronto", 2025, "3 people", 4.7, "Carbon estimates for small restaurants, built from their own invoices.", {}, 105],
  ];
  return rows.map(([id, name, employerType, category, city, founded, size, rating, description, f, ago]) => ({
    id, name, employerType, category, city, founded, size, rating, description, alumniOwned: Boolean(f.alumni), nearCampus: Boolean(f.near), createdAt: daysFromNow(-ago),
  }));
}

export function seedVentures(): Venture[] {
  const v = (id: string, businessId: string, name: string, pitch: string, sector: Venture["sector"], stage: Venture["stage"], team: number, stack: string[], founders: [string, string][], tone: Venture["logoTone"], verified = true): Venture => ({
    id, businessId, name, pitch, sector, stage, teamSize: team, stack, founders: founders.map(([n, r]) => ({ name: n, role: r })), yspaceVerified: verified, logoTone: tone,
  });
  return [
    v("ven_reroute", "biz_reroute", "Reroute", "When your line is late, Reroute shows the next best way to get there, with live transit data.", "mobility", "prototype", 3, ["React", "Node.js", "Mapbox", "Postgres"], [["Tariq Aziz", "CEO"], ["Lena Park", "CTO"]], "red"),
    v("ven_sprig", "biz_sprig", "Sprig", "A weekly produce box marketplace for small urban farms.", "agrifood", "idea", 4, ["Next.js", "Stripe", "Airtable"], [["Maya Greene", "Founder"]], "ink"),
    v("ven_pulse", "biz_pulse", "Pulsewise", "A two-minute daily check-in that tells a clinic who needs a call.", "healthtech", "preseed", 5, ["React", "Firebase", "Python"], [["Dr. Owen Hale", "Founder"], ["Sam Ito", "Engineering"]], "tint"),
    v("ven_ledgerleaf", "biz_ledgerleaf", "LedgerLeaf", "Invoice aging, reminders and cash-flow forecasts for freelancers.", "fintech", "preseed", 4, ["TypeScript", "Postgres", "Plaid"], [["Ife Adeyemi", "CEO"], ["Chris Doyle", "CTO"]], "gray"),
    v("ven_kiln", "biz_kiln", "Kiln", "A harness for running the same prompts across models and scoring the output.", "ai_tools", "prototype", 3, ["Python", "FastAPI", "React"], [["Ravi Nair", "CEO"], ["Joanna Wei", "Research"]], "ink"),
    v("ven_tidewell", "biz_tidewell", "Tidewell", "Turns a restaurant's supplier invoices into a carbon estimate.", "climate", "seed", 3, ["Python", "Next.js", "OCR"], [["Alma Reyes", "Founder"]], "red"),
  ];
}

export function seedReviewers(): Reviewer[] {
  const r = (id: string, name: string, title: Reviewer["title"], org: string, expertise: Reviewer["expertise"], bio: string): Reviewer => ({ id, name, title, org, expertise, bio });
  return [
    r("rev_noor", "Noor Haddad", "Senior student", "Computer Science, Lassonde", ["web", "data"], "Fourth-year CS student and course tutor. Reads every pull request twice."),
    r("rev_osei", "Prof. Amara Osei", "Professor", "Psychology", ["data", "web", "writing"], "Runs a cognition lab and has supervised thirty student research projects."),
    r("rev_ta", "Jamal Brooks", "TA", "Electrical Engineering and Computer Science", ["web", "data"], "Teaching assistant for second-year web programming."),
    r("rev_sana", "Sana Qureshi", "Alum", "Data analyst, class of 2022", ["data", "admin"], "York statistics alum who now builds dashboards for a health network."),
    r("rev_mei", "Mei Tanaka", "Senior student", "Design, AMPD", ["design", "marketing", "writing"], "Fourth-year design student who has reviewed brand work for student clubs."),
    r("rev_wei", "Prof. Wei Lin", "Professor", "Visualization and communication", ["data", "design", "writing"], "Teaches information design and chairs a thesis committee."),
    r("rev_eli", "Eli Rowan", "Alum", "Studio lead, Paper Lantern Games", ["web"], "York alum and studio lead who has shipped three indie titles and runs the QA process."),
    r("rev_mentor", "Dana Whitfield", "YSpace mentor", "Entrepreneur in residence", ["web", "admin", "marketing", "data"], "Former product lead who mentors early-stage founders."),
  ];
}
