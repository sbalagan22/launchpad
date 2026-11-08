import type { Application, Approval, Business, CertClaim, CheckResult, Message, Notification, Project, Review, Student, Submission, Thread } from "@/schemas";
import { daysFromNow } from "@/lib/dates";
import { computeMatch } from "@/lib/matching";
import type { CatalogEntry } from "@/schemas";
import { CONTACT } from "./people";
import { ALL_SPECS } from "./projects";

// MOCK: derived demo world (applications, workspaces, approvals, reviews, threads, notifications). Fictional.
const SPEC = new Map(ALL_SPECS.map((s) => [s.id, s]));
const h = (str: string) => { let x = 7; for (const c of str) x = (x * 31 + c.charCodeAt(0)) % 100003; return x; };
const pick = <T,>(arr: T[], seed: string, off = 0): T => arr[(h(seed) + off) % arr.length];
const first = (n: string) => n.replace(/^Prof\. |^Dr\. /, "").split(" ")[0];

/* ---------- Claims ---------- */
export function seedClaims(): CertClaim[] {
  let n = 0;
  const base = (studentId: string, certId: string, status: CertClaim["status"], ago: number, extra: Partial<CertClaim> = {}): CertClaim => ({ id: `clm_${String(++n).padStart(2, "0")}`, studentId, certId, tier: "self", status, createdAt: daysFromNow(-ago), ...extra });
  const issuer = (studentId: string, certId: string, ref: string, issuedAgo: number, years: number | null): CertClaim =>
    base(studentId, certId, "earned", issuedAgo, { tier: "issuer", credentialRef: ref, issuedAt: daysFromNow(-issuedAgo), ...(years ? { expiresAt: daysFromNow(-issuedAgo + Math.round(years * 365)) } : {}), issuerUrl: ref.startsWith("http") ? ref : undefined });
  return [
    issuer("stu_aisha", "fcc-rwd", "https://www.freecodecamp.org/certification/aisha-khan/responsive-web-design", 237, null),
    base("stu_aisha", "gh-foundations", "planned", 20, { targetDate: daysFromNow(75), note: "Target January 2027" }),
    base("stu_aisha", "azure-az900", "in_progress", 30, { note: "Studying, exam booked December 2026", targetDate: daysFromNow(40) }),
    base("stu_aisha", "mongodb-dev", "planned", 10),
    issuer("stu_priya", "gda", "https://www.credly.com/badges/3f2a1b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b", 145, null),
    base("stu_priya", "psm1", "planned", 15),
    base("stu_priya", "pl300", "in_progress", 22, { note: "Working through the practice labs" }),
    issuer("stu_grace", "gda", "https://www.credly.com/badges/7e6d5c4b-3a29-4180-9f7e-6d5c4b3a2918", 130, null),
    issuer("stu_daniel", "gh-foundations", "https://www.credly.com/badges/9d8c7b6a-5e4f-4a3b-8c2d-1e0f9a8b7c6d", 60, 2),
    base("stu_daniel", "mongodb-dev", "in_progress", 20),
    base("stu_liam", "aws-clf", "earned", 150),
    base("stu_liam", "pcap", "planned", 10),
    issuer("stu_ravi", "azure-az900", "https://learn.microsoft.com/en-us/users/ravipatel-5521/credentials/az900-4a5b6c7d8e9f0a1b", 100, null),
    base("stu_arjun", "pl300", "in_progress", 30),
    base("stu_fatima", "psm1", "planned", 15),
    issuer("stu_omid", "pcep", "PCEP-30-02 XJ4829", 90, null),
    base("stu_jordan", "gda", "planned", 25),
    base("stu_theo", "other", "earned", 220, { customName: "Adobe Certified Professional, Illustrator", fileName: "adobe-certificate.pdf" }),
    base("stu_mei", "gda", "in_progress", 18),
    base("stu_kwame", "azure-az900", "planned", 8),
  ];
}

/* ---------- Checks, submissions, approvals ---------- */
const URLS = (id: string, i: number) => [`https://${id.slice(4).replace(/_/g, "-")}-m${i}.netlify.app`, `https://github.com/launchpad-demo/${id.slice(4).replace(/_/g, "-")}`, `https://docs.example.org/${id.slice(4)}/m${i}`];
const FEEDBACK_OK = ["Clear and easy to follow. This is what we hoped for.", "Solid work and well documented. Easy to pick up from here.", "Exactly what we needed, and a day early.", "Good attention to detail. Two small notes in the comments, nothing blocking.", "Very thorough. The explanations saved us a call."];
const FEEDBACK_CH = ["Close. Two things before I approve: the first criterion is only half met, and the link needs viewing access.", "Good start. Please add the missing examples and send again.", "Nearly there. The numbers on page two do not match the source."];

export function seedWork(projects: Project[]): { checks: CheckResult[]; submissions: Submission[]; approvals: Approval[] } {
  const checks: CheckResult[] = [], submissions: Submission[] = [], approvals: Approval[] = [];
  let c = 0;
  const addSub = (p: Project, mi: number, status: Submission["status"], daysAgo: number, extra: Partial<Submission> = {}, link = true) => {
    const m = p.milestones[mi];
    const url = link ? URLS(p.id, mi + 1)[(h(p.id) + mi) % 3] : undefined;
    let checkId: string | undefined;
    if (url) {
      checkId = `chk_${String(++c).padStart(3, "0")}`;
      const slow = (h(p.id + mi) % 9) === 0;
      checks.push({ id: checkId, url, reachable: true, httpStatus: 200, loadSeconds: slow ? 3.8 : Number((0.5 + (h(p.id + mi) % 12) / 10).toFixed(1)), status: slow ? "slow" : "ok", note: slow ? "Reachable but slow to load (over 3 seconds)." : "Reachable and responded normally.", checkedAt: daysFromNow(-daysAgo) });
    }
    const sub: Submission = { id: `sub_${p.id.slice(4)}_${mi + 1}_${submissions.filter((x) => x.milestoneId === m.id).length + 1}`, projectId: p.id, milestoneId: m.id, studentId: p.studentId!, ...(url ? { url } : {}), fileNames: link ? [] : ["notes.pdf"], final: mi === p.milestones.length - 1, ...(checkId ? { checkId } : {}), status, submittedAt: daysFromNow(-daysAgo), ...extra };
    submissions.push(sub);
    return sub;
  };
  const addApproval = (p: Project, sub: Submission, decision: Approval["decision"], daysAgo: number, review?: string) => {
    const base = decision === "approved" ? [5, 4, 5, 4, 5] : [3, 4, 2, 4, 3];
    const spec = SPEC.get(p.id)!;
    const poster = CONTACT[p.businessId];
    approvals.push({
      id: `apv_${sub.id.slice(4)}`, submissionId: sub.id, projectId: p.id, businessId: p.businessId,
      ratings: p.acceptance.map((criterion, i) => ({ criterion, rating: base[(i + h(sub.id)) % base.length] })),
      review: review ?? (decision === "approved" ? pick(FEEDBACK_OK, sub.id) : pick(FEEDBACK_CH, sub.id)), decision, at: daysFromNow(-daysAgo),
    });
    void spec; void poster;
  };
  for (const p of projects) {
    if (!p.studentId) continue;
    p.milestones.forEach((m, i) => {
      const ago = Math.max(1, Math.round((Date.now() - new Date(m.dueAt).getTime()) / 86_400_000));
      if (m.status === "approved") {
        // Every sixth approved milestone went through one revision round first.
        if ((h(m.id) % 6) === 0) { const s0 = addSub(p, i, "changes_requested", ago + 4); addApproval(p, s0, "changes_requested", ago + 3); }
        const s = addSub(p, i, "approved", ago + 1);
        const review = p.id === "prj_reroute_mvp" && i === 0 ? "Great scope doc. The data audit found two feed issues we had missed and your plan for handling them is sensible." : undefined;
        addApproval(p, s, "approved", ago, review);
      } else if (m.status === "in_review") {
        addSub(p, i, "pending_review", p.id === "prj_reroute_mvp" ? 2 : 1);
      }
    });
  }
  return { checks, submissions, approvals };
}

/* ---------- Applications ---------- */
const openers = ["I have been building web projects for a year and this is the kind of problem I want more practice on.", "This matches what I have been studying and I can start this week.", "I like that the checklist is specific. I would plan the work around it.", "I have done something similar for a class and would like to do it for a real user."];
export function proposalText(s: Student, p: Project, biz: Business): string {
  const skills = s.skills.filter((k) => p.skills.some((x) => x.toLowerCase() === k.name.toLowerCase())).map((k) => k.name).slice(0, 3);
  const has = skills.length ? `I have worked with ${skills.join(", ")}. ` : "";
  return `Hi ${first(CONTACT[biz.id] ?? biz.name)}, ${pick(openers, s.id + p.id)} ${has}I can give about ${Math.min(s.hoursPerWeek, 12)} hours a week and would start with "${p.milestones[0]?.title.toLowerCase() ?? "the first step"}". Thanks for considering me.`;
}

export function seedApplications(students: Student[], projects: Project[], businesses: Business[], catalog: CatalogEntry[], claims: CertClaim[]): Application[] {
  const out: Application[] = [];
  let n = 0;
  const biz = (id: string) => businesses.find((b) => b.id === id)!;
  const add = (s: Student, p: Project, status: Application["status"], ago: number, proposal?: string) => {
    if (out.some((a) => a.studentId === s.id && a.projectId === p.id)) return;
    out.push({ id: `app_${String(++n).padStart(3, "0")}`, projectId: p.id, studentId: s.id, proposal: proposal ?? proposalText(s, p, biz(p.businessId)), status, createdAt: daysFromNow(-ago) });
  };
  const st = (id: string) => students.find((s) => s.id === id)!;
  for (const p of projects) {
    if (p.studentId) add(st(p.studentId), p, "accepted", Math.max(3, Math.round((Date.now() - new Date(p.createdAt).getTime()) / 86_400_000) - 2));
  }
  const persona = new Set(["stu_aisha", "stu_priya"]);
  for (const p of projects.filter((x) => x.status === "open")) {
    const ranked = students.filter((s) => !persona.has(s.id) && s.id !== p.studentId).map((s) => ({ s, m: computeMatch(s, p, claims.filter((c) => c.studentId === s.id), catalog).score })).sort((a, b) => b.m - a.m || a.s.id.localeCompare(b.s.id));
    const count = p.id === "prj_demoday" ? 5 : p.ventureId ? 4 : 1;
    ranked.slice(0, count).forEach(({ s }, i) => add(s, p, "pending", 1 + ((h(p.id) + i * 3) % 6)));
  }
  // Persona applications.
  add(st("stu_aisha"), projects.find((p) => p.id === "prj_board")!, "pending", 3, "Hi Hannah, I rebuilt a club website last month and enjoyed making information easier to scan. I have done charts in Python for a lab and can learn Looker Studio quickly. I can give about 8 hours a week and would start by interviewing the board about its three key questions.");
  add(st("stu_priya"), projects.find((p) => p.id === "prj_harvestprice")!, "pending", 2, "Hi Lina, I have run customer interviews for the Schulich Case Club and I am currently doing discovery for another early-stage team. I would plan ten interviews across chefs and farmers and bring back pricing options with reasoning.");
  // A few rejected applications on projects that already have a student.
  projects.filter((p) => p.studentId).slice(0, 5).forEach((p, i) => {
    const other = students.filter((s) => s.id !== p.studentId && !persona.has(s.id))[(i * 3 + 1) % (students.length - 2)];
    add(other, p, "rejected", 20 + i * 2);
  });
  return out;
}

/* ---------- Reviews ---------- */
const REVIEW_TEXT: Record<string, string> = {
  prj_roboclub: "Delivered the site two days early and documented how to update it. Handled feedback well.",
  prj_labcharts: "Clean charts and a clear README. Next time, ask about edge cases earlier.",
  prj_casedeck: "Raised our first sponsor within two weeks of using her deck.",
};
const GENERIC = ["Reliable, communicative and careful with detail. I would work with them again.", "Handled feedback well and delivered something we are still using.", "Asked good questions early. The handover notes were excellent.", "Strong work. A little slow to start, then caught up quickly.", "Went beyond the checklist and flagged problems we had not noticed."];
export function seedReviews(projects: Project[]): Review[] {
  const out: Review[] = [];
  for (const p of projects.filter((x) => x.status === "completed" && x.studentId)) {
    const rating = SPEC.get(p.id)!.rating ?? 4.5;
    const by = p.id === "prj_roboclub" ? "Jordan Lee" : p.id === "prj_labcharts" ? "Prof. Elaine Whitford" : p.id === "prj_casedeck" ? "Marcus Chen" : CONTACT[p.businessId] ?? "The poster";
    const text = p.id === "prj_fixmobile" ? "Found every layout bug we had and a few we had not noticed. Clean pull requests." : p.id === "prj_landingcopy" ? "The winning headline doubled our signup rate. Great test design and clear write-up." : REVIEW_TEXT[p.id] ?? pick(GENERIC, p.id);
    out.push({ id: `rev_${p.id.slice(4)}`, projectId: p.id, studentId: p.studentId!, businessId: p.businessId, rating, ratings: p.acceptance.map((criterion, i) => ({ criterion, rating: Math.max(3, Math.min(5, Math.round(rating) + (i % 3 === 2 ? -1 : 0))) })), text, by, createdAt: p.milestones[2].approvedAt ?? daysFromNow(-10) });
  }
  return out;
}

/* ---------- Threads ---------- */
const T = (h0: number, m = 0) => daysFromNow(-h0 / 24, 9 + Math.floor(m / 60), m % 60);
type Line = ["s" | "b", string, number, string[]?];
const msgs = (id: string, lines: Line[]): Message[] => lines.map(([from, text, hoursAgo, att], i) => ({ id: `${id}_${i + 1}`, from: from === "s" ? "student" : "business", text, at: daysFromNow(-hoursAgo / 24, 9 + (i % 8), (i * 7) % 60), attachments: att ?? [] }));

export function seedThreads(projects: Project[], students: Student[]): Thread[] {
  const th = (id: string, studentId: string, businessId: string, projectId: string | undefined, lines: Line[], unreadStudent = 0, unreadBusiness = 0): Thread => ({ id, studentId, businessId, ...(projectId ? { projectId } : {}), messages: msgs(id, lines), unread: { student: unreadStudent, business: unreadBusiness } });
  const out: Thread[] = [
    th("thr_aisha_omar", "stu_aisha", "biz_reroute", "prj_reroute_mvp", [
      ["b", "Welcome aboard, Aisha. Before you start, which transit data feed should we use for the first version?", 600],
      ["s", "Thanks Fares. I read the docs and the regional agency publishes a public GTFS feed. I would start with that and cache it so the app does not depend on their uptime.", 598],
      ["b", "Yes, use the public GTFS feed. Caching is a good call. Mobile-first please, most riders will open it on the platform.", 595],
      ["s", "Understood. I will design for a 375px phone first. Do you want it deployed on Vercel from the start so you can test on real devices?", 592],
      ["b", "Deploy on Vercel from day one. I will add you to the team project.", 590],
      ["s", "Milestone 1 is up: scope doc and a short data audit. I found two routes where the feed has no real-time updates.", 400, ["scope-and-data-audit.pdf"]],
      ["b", "Great audit. Approved. Pick those three routes for milestone 2, ones with real delays.", 380],
      ["s", "Milestone 2 is submitted. Map view works, shows the delay and one alternative for the three routes. Loads in about 1.8 seconds on my phone.", 50, ["milestone-2-demo.mp4"]],
      ["b", "Milestone 2 looks great. The map view loads fast. I'll review properly tonight.", 24],
    ], 1),
    th("thr_aisha_jordan", "stu_aisha", "biz_roboclub", "prj_roboclub", [
      ["s", "Hi Jordan, the site is live. The update guide is in the repo under docs, with screenshots.", 1500],
      ["b", "Just saw it. The events page is so much clearer. Thank you!", 1490],
      ["s", "Glad it helps. If an executive changes next year, the guide should cover everything.", 1485],
      ["b", "Already forwarded it to the new VP. You wrote the guide for non-developers, which is rare.", 1400],
      ["s", "Thanks! Happy to answer any questions later.", 1395],
      ["b", "The site's been getting compliments. Can we hire you again in January?", 20],
    ], 1),
    th("thr_aisha_whit", "stu_aisha", "biz_psylab", "prj_labcharts", [
      ["b", "Aisha, the charts are very clean. The README helped me rerun everything.", 900],
      ["s", "Thank you, Prof. Whitford. I put the edge cases at the end in a short list.", 898],
      ["b", "One thing for the future: ask about the missing responses early. Otherwise lovely work.", 890],
      ["s", "Noted, I will ask about data gaps in the first week next time.", 888],
      ["b", "Could you present the charts at lab meeting next Thursday? Ten minutes is plenty.", 30],
    ], 1),
    th("thr_aisha_north", "stu_aisha", "biz_foodbank", "prj_board", [
      ["s", "Hi Hannah, I applied for the dashboard project. I rebuilt a club site recently and I am happy to start by interviewing the board.", 72],
      ["b", "Thanks for applying. We will pick someone by Friday.", 60],
      ["s", "Thank you. I have attached two examples of dashboards I made for a lab.", 58, ["lab-dashboard-examples.pdf"]],
      ["b", "Thanks, these are helpful. The board would love something this clear.", 55],
      ["s", "Great. Is there a board meeting date I should plan toward?", 50],
      ["b", "Our next board meeting is December 2. The new report would be used for the first time in January.", 49],
    ], 0),
    th("thr_priya_omar", "stu_priya", "biz_reroute", "prj_reroute_disc", [
      ["s", "Hi Fares, here is my interview plan. Eight interviews across planners, operations leads and a procurement contact.", 160, ["interview-plan-v1.pdf"]],
      ["b", "Great structure. Two thoughts: ask about budget cycles, and ask who signs off on a pilot.", 150],
      ["s", "Added both. Should I also ask about how they handle rider complaints today?", 148],
      ["b", "Yes, that is useful. I can introduce you to two transit contacts. I will send their names.", 140],
      ["b", "Sent. Both are happy to talk for 30 minutes. Mention the pilot but not a price yet.", 100, ["transit-contacts.txt"]],
      ["s", "Thank you. I have booked the first two for next week.", 96],
      ["b", "Shared 2 contacts for your interviews. Let me know how the first call goes.", 18],
    ], 1),
    th("thr_priya_marcus", "stu_priya", "biz_casecomp", "prj_casedeck", [
      ["b", "Priya, we signed our first sponsor using your deck. They loved the section on what sponsors get.", 700],
      ["s", "That is great news, Marcus. Thank you for letting me know.", 698],
      ["b", "Could you walk next year's team through the outreach list in January?", 690],
      ["s", "Of course. I can do a 30 minute session on a weekday evening.", 688],
      ["b", "Perfect. I will send a calendar invite once the new exec is chosen.", 680],
      ["s", "Sounds good. I will update the list with the replies we got this term.", 678],
    ], 0),
    th("thr_priya_lina", "stu_priya", "biz_harvest", "prj_harvestprice", [
      ["b", "Hi Priya, thanks for applying. Your Schulich Case Club work stood out.", 40],
      ["s", "Thank you, Lina. I would love to learn more about how restaurants buy from small farms today.", 38],
      ["b", "Happy to chat. Would a 20 minute intro call this Thursday work?", 30],
      ["s", "Thursday afternoon works. I am free after 2pm.", 28],
      ["b", "Great, 3pm then. I will send a link.", 26],
      ["s", "Perfect. I will prepare three questions about pricing for the call.", 25],
    ], 0),
    th("thr_omar_daniel", "stu_daniel", "biz_reroute", "prj_fixmobile", [
      ["b", "Daniel, the layout fixes are live and the waitlist page looks right on small phones. Thank you.", 1300],
      ["s", "Glad it worked. The regression checklist is in the repo so the next release stays clean.", 1298],
      ["b", "Quick follow-up: tapping the route picker on an iPhone SE still clips the dropdown. Can you take a look?", 300],
      ["s", "Reproduced it. It is a viewport unit issue on small screens. Fix coming today.", 296],
      ["b", "Thanks. Send me the pull request when it is ready.", 290],
      ["s", "Pull request is open, with a screenshot from an SE simulator.", 280, ["se-fix.png"]],
    ], 0),
    th("thr_omar_mei", "stu_mei", "biz_reroute", "prj_landingcopy", [
      ["b", "Mei, I want to offer you something. We would like you to continue with Reroute on a four month part-time content role.", 70],
      ["s", "Thank you, Fares. I would love to hear more about the role and the hours.", 66],
      ["b", "About 8 hours a week, paid, remote with a monthly in-person day in Markham. I sent an Invite to continue with the details.", 60],
      ["s", "Got it. I will read it tonight and reply tomorrow.", 58],
      ["b", "No rush. Take the week if you need it.", 50],
      ["s", "One question: would I work with Sana on messaging, or just you?", 20],
    ], 0, 1),
  ];
  // Generic threads for other active or finished workspaces.
  const opener: Line[][] = [];
  void opener;
  const used = new Set(out.map((t) => t.projectId));
  const targets = projects.filter((p) => p.studentId && !used.has(p.id));
  targets.slice(0, 21).forEach((p, i) => {
    const s = students.find((x) => x.id === p.studentId)!;
    const poster = first(CONTACT[p.businessId] ?? "there");
    const sName = first(s.name);
    const n = 6 + (i % 6) * 2;
    const m = (k: number) => p.milestones[Math.min(k, 2)].title.toLowerCase();
    const pool: Line[] = [
      ["b", `Hi ${sName}, welcome to ${p.title}. Happy to answer questions as you start.`, 900],
      ["s", `Thanks ${poster}. I have read the brief. To confirm, the first step is ${m(0)}, right?`, 896],
      ["b", `Yes. Take a few days and ping me if the scope feels off.`, 890],
      ["s", `Quick question about the acceptance criteria: "${p.acceptance[0]}". Is there an example I can see?`, 800],
      ["b", `Good question. I will send one this afternoon.`, 795, [`example-${i + 1}.pdf`]],
      ["s", `Got it, thanks. That makes the target clear.`, 790],
      ["s", `I have submitted ${m(0)}. The link is in the workspace.`, 600],
      ["b", `Looks good. Approved. Please move on to ${m(1)}.`, 580],
      ["s", `Will do. I expect ${m(1)} to take about a week.`, 570],
      ["b", `Perfect. Reach out if you hit anything blocking.`, 560],
      ["s", `A small update: ${m(1)} is going well. I will send it a day early.`, 300],
      ["b", `Great news, thank you for the heads up.`, 290],
      ["s", `Submitted. Let me know what you think.`, 120],
      ["b", `Thanks, I will review tonight.`, 100],
      ["s", `No rush. I will start on ${m(2)} meanwhile.`, 90],
      ["b", `Sounds good. Thanks again for the careful work.`, 70],
      ["s", `Thanks ${poster}. Glad it is useful.`, 60],
      ["b", `One last thing: can you add a short note on how to maintain this?`, 40],
      ["s", `Yes, I will add a section to the README.`, 30],
      ["b", `Thank you.`, 20],
    ];
    const lines = pool.slice(0, Math.min(n, 20));
    const lastFromBiz = lines[lines.length - 1][0] === "b";
    out.push(th(`thr_${p.id.slice(4)}`, p.studentId!, p.businessId, p.id, lines, lastFromBiz && i % 3 === 0 ? 1 : 0, !lastFromBiz && i % 4 === 0 ? 1 : 0));
  });
  return out.slice(0, 30);
}

/* ---------- Notifications ---------- */
export function seedNotifications(): Notification[] {
  let n = 0;
  const N = (userId: string, title: string, body: string, href: string, ago: number, read = false): Notification => ({ id: `ntf_${String(++n).padStart(3, "0")}`, userId, title, body, href, read, createdAt: daysFromNow(-ago / 24, 8 + (n % 9), (n * 11) % 60) });
  return [
    N("stu_aisha", "Fares viewed your milestone 2 submission", "Reroute opened your submission for Build the First Working Version of the Reroute App.", "/workspace/prj_reroute_mvp", 6),
    N("stu_aisha", "New match: Instrument the Waitlist (88)", "Reroute posted a 14 hour analytics project that fits your skills.", "/projects", 20),
    N("stu_aisha", "Your freeCodeCamp certification is issuer verified", "Responsive Web Design now shows the red check on your profile.", "/certifications", 160, true),
    N("stu_aisha", "Reminder: Reroute milestone 3 opens after approval", "Alerts and deploy unlocks once milestone 2 is approved.", "/workspace/prj_reroute_mvp", 30, true),
    N("stu_aisha", "Jordan Lee sent you a message", "The site's been getting compliments. Can we hire you again in January?", "/messages", 20),
    N("stu_aisha", "Application received", "Northgate Community Food Bank has your application for Redesign the Monthly Food Bank Report.", "/workspace", 72, true),
    N("stu_priya", "Fares shared 2 contacts for your interviews", "Reroute added two transit contacts to your thread.", "/messages", 18),
    N("stu_priya", "Harvest Loop viewed your application", "Your application for Pricing and Customer Interviews was opened.", "/workspace", 26),
    N("stu_priya", "Google Data Analytics added to your profile", "Issuer verified with Credly.", "/certifications", 140, true),
    N("stu_priya", "New match: Demo Day pitch assets (76)", "Reroute is looking for pitch help.", "/projects", 55, true),
    N("biz_reroute", "Aisha submitted milestone 2", "Core flow and map view is ready for your review.", "/business/projects/prj_reroute_mvp", 50),
    N("biz_reroute", "Priya posted her interview plan", "Customer Discovery and Pricing has a new file.", "/messages", 150),
    N("biz_reroute", "3 new applicants for Demo Day assets", "Build a Demo Day Website and Pitch Slides for Reroute has new applications.", "/business/projects/prj_demoday", 22),
    N("biz_reroute", "Mei Lin viewed your invite", "Your Invite to continue was opened.", "/founder", 18),
    N("biz_reroute", "Daniel Osei sent a pull request", "A fix for the route picker is ready.", "/messages", 280, true),
    N("stu_daniel", "Reroute sent you a message", "Quick follow-up about the iPhone SE layout.", "/messages", 300, true),
    N("stu_mei", "You have an Invite to continue", "Reroute invited you to a four month part-time content role.", "/dashboard", 60),
    N("stu_omid", "Invite to continue from Signalbox", "Signalbox would like to keep working with you.", "/dashboard", 150),
    N("stu_fatima", "Invite to continue from Brightpath", "Brightpath invited you to continue after your pricing model.", "/dashboard", 130),
    N("stu_ravi", "Invite to continue from Paper Lantern Games", "Paper Lantern invited you after the accessibility work.", "/dashboard", 70),
    N("stu_grace", "New match: Analyze Why Patients Miss Appointments (91)", "PulseDesk posted a data project.", "/projects", 40),
    N("stu_liam", "Milestone approved", "Northgate approved your inventory counter milestone.", "/workspace", 100, true),
    N("stu_theo", "Poster feedback received", "Signalbox left feedback on your storyboard.", "/workspace", 90, true),
    N("stu_noor", "New message from Whitford Cognition Lab", "A question about the consent form rewrite.", "/messages", 60),
    N("stu_sam", "Milestone due in 3 days", "Competitor Research for Community Garden Tools: findings.", "/workspace", 24),
    N("biz_corner", "Fatima submitted a margin model", "Menu Pricing Review has a new submission.", "/business", 40),
    N("biz_foodbank", "Aisha applied", "New application for Redesign the Monthly Food Bank Report.", "/business", 72),
    N("biz_harvest", "Priya applied", "New application for Pricing and Customer Interviews.", "/business", 48),
    N("biz_psylab", "Aisha's charts were reviewed by 3 lab members", "Your review is visible on her profile.", "/business", 700, true),
    N("biz_signalbox", "Theo submitted a storyboard", "Product Explainer Video is ready for review.", "/business", 70),
    N("stu_chloe", "Application accepted", "Greenfield Language Exchange accepted you.", "/workspace", 160, true),
    N("stu_isabelle", "Milestone approved", "Food bank policy brief: literature scan approved.", "/workspace", 200, true),
    N("stu_amara", "Message from Lin Visualization Lab", "Question about the cleaning script.", "/messages", 28),
    N("stu_jordan", "New match: Student Wellness Newsletter Redesign (82)", "Communications office posted a newsletter project.", "/projects", 44),
    N("stu_hannah", "Review received", "Club handbook review: 4.5 of 5.", "/profile", 900, true),
    N("stu_kwame", "Review received", "Grant budget template review: 4.5 of 5.", "/profile", 1100, true),
    N("stu_tara", "Review received", "Waiting-room handouts review: 5 of 5.", "/profile", 1050, true),
    N("biz_ledgerly", "Ravi submitted milestone 2", "Unit tests for tax and totals are ready.", "/business", 36),
    N("biz_brightpath", "Fatima's pricing model was approved", "Final approval complete.", "/business", 1300, true),
  ];
}
