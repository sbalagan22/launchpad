import type { Project, Thread } from "@/schemas";
import { daysFromNow } from "@/lib/dates";

type Line = ["B" | "S", string];

// MOCK: 15 hand-written per-project chat threads (5 to 7 messages each). Fictional people and organizations.
const SCRIPTS: Record<string, Line[]> = {
  prj_hack: [
    ["B", "Hi Aisha, welcome aboard. The current sign-up sheet is linked in the brief."],
    ["S", "Thanks! I'll have a layout for the form ready to review by Thursday."],
    ["B", "Layout looks good. Can the form stop taking sign-ups at 30 seats?"],
    ["S", "Yes, I'll add a capacity counter and a waitlist message once it is full."],
    ["B", "Milestone one is approved. Most members sign up from their phones, so test there first."],
    ["S", "Will do. I'll send a staging link with the form working before the next review."],
  ],
  prj_kilndash: [
    ["B", "Daniel, thanks for the prototype. The table is much easier to scan than our spreadsheet."],
    ["S", "Glad it helps. I kept the columns in the same order as the export."],
    ["B", "Can we filter by prompt as well as by model?"],
    ["S", "Yes, that is the next milestone. I'll add filters and a URL for sharing a filtered view."],
    ["B", "The staging link returned an error this morning. Can you check?"],
    ["S", "Sorry, the host paused the project. I've redeployed and will resubmit today."],
  ],
  prj_survey: [
    ["B", "Hi Marcus. The raw export is on the lab drive. Names are already removed."],
    ["S", "Got it. I'll log every cleaning rule in a change log as I go."],
    ["S", "First pass done: seven spellings of 'prefer not to say' now map to one value."],
    ["B", "Great. Please flag anything where you are guessing instead of fixing."],
    ["S", "I'll mark those rows in a separate sheet for you to decide."],
    ["B", "Milestone one approved. Thank you for the careful notes."],
  ],
  prj_menu: [
    ["B", "Hi Omar, the menu photos and prices are in the shared folder."],
    ["S", "Thanks. I'll start with the counter screen size since that is where it will live."],
    ["B", "Layout looks fresh. Can the specials sit at the top?"],
    ["S", "Yes, I'll put specials in a top band that the owner can switch off."],
    ["S", "The page is live on a staging link. I'm submitting the final milestone now."],
    ["B", "Thanks, the reviewer will look today."],
  ],
  prj_poster: [
    ["B", "Hi Sofia, the open house is on the 24th. Here is the department logo pack."],
    ["S", "Thanks. I'll send two directions on Friday."],
    ["B", "We prefer the second one. Can the date be larger?"],
    ["S", "Done. Updated files attached in three sizes."],
    ["S", "Print-ready PDFs with bleed are uploaded for review."],
  ],
  prj_c01: [
    ["B", "Hi Aisha, the spring showcase is in three weeks. Here is the schedule."],
    ["S", "Thanks. I'll draft the layout and share a link by Friday."],
    ["B", "Love it. Can the map open in a new tab on phones?"],
    ["S", "Yes, done. I'll add an update guide so execs can change the schedule."],
    ["B", "The page worked perfectly on the day. Thanks, Aisha."],
  ],
  prj_c02: [
    ["B", "Aisha, we need a page that shows a live signup count."],
    ["S", "I can do that in React with a small API call. I'll start with the form."],
    ["B", "Can duplicate emails show a friendly message instead of an error?"],
    ["S", "Yes, I've added that and a test for it."],
    ["B", "Deployed and working. The waitlist grew 40 people in a day."],
    ["S", "Great to hear. The README explains how to change the copy."],
  ],
  prj_c03: [
    ["B", "Hi Daniel, we want riders to find the nearest running stop."],
    ["S", "The transit API only updates every minute, so I'll show the last updated time."],
    ["B", "Good call. Please note the API limits in the write-up."],
    ["S", "Prototype is live with the map. Limits are documented."],
    ["B", "This is exactly what we needed to show investors. Thank you."],
    ["B", "We would like to talk about continuing. I'll send an invite."],
  ],
  prj_c04: [
    ["B", "Daniel, regulars forget their punch cards. Can they scan a code instead?"],
    ["S", "Yes. I'll build a page that stamps once per visit."],
    ["B", "Can it stop the same person stamping twice in a day?"],
    ["S", "Added a daily limit. I'll deploy and send the admin view."],
    ["B", "Works well. Staff love the admin view."],
  ],
  prj_c05: [
    ["B", "Hi Priya, we need one page a farmer can hand over at the market."],
    ["S", "I'll send three concepts on Monday using the existing colours."],
    ["B", "Concept two. Can the sign-up link be a QR code?"],
    ["S", "Done. Final files and the editable Figma file are attached."],
    ["B", "Printed twenty copies. They look wonderful."],
  ],
  prj_c07: [
    ["B", "Hi Marcus, the donor export is attached. Some entries are duplicated."],
    ["S", "I'll clean those first and share a summary of what changed."],
    ["S", "Eleven hundred rows reduced to nine hundred and ten unique donors."],
    ["B", "That matches what we expected. Please group by first gift month next."],
    ["S", "Charts attached. Donors who give at the winter drive return twice as often."],
    ["B", "This will really help our board discussion. Thank you."],
  ],
  prj_c08: [
    ["B", "Marcus, we have a hunch Mondays are the problem."],
    ["S", "I'll check wait times by hour and day once the data is clean."],
    ["S", "Mondays between 9 and 11 have the longest waits by a wide margin."],
    ["B", "That confirms the hunch. Can you put it on one page?"],
    ["S", "Memo and dashboard link attached."],
  ],
  prj_c11: [
    ["B", "Hi Jordan, we launch on Monday. Can we have a week of posts?"],
    ["S", "I'll draft the sequence and send it for review on Wednesday."],
    ["B", "Post three is too technical. Can it lead with the benefit?"],
    ["S", "Reworded. All seven posts are scheduled with captions."],
    ["B", "Launch week went better than we hoped. Thanks!"],
  ],
  prj_c15: [
    ["B", "Liam, we want to know where playtesters quit."],
    ["S", "I'll log session events to a sheet and summarise the drop-off points."],
    ["B", "Can it not slow the game down?"],
    ["S", "It logs asynchronously, so no frame drops in my tests."],
    ["S", "The summary sheet shows three levels where half the testers stop."],
    ["B", "That is gold. We are fixing level four first."],
  ],
  prj_c17: [
    ["B", "Hi Hannah, we want a handbook new volunteers will actually read."],
    ["S", "I'll send an outline first so you can check the order."],
    ["B", "Love the outline. Add a short section about the tool shed."],
    ["S", "Added. The draft is in the shared folder."],
    ["S", "Final edit with the quick-start sheet is attached."],
    ["B", "Handed to our newest volunteers. They finished it in ten minutes."],
  ],
};

export function seedThreads(projects: Project[]): Thread[] {
  return Object.entries(SCRIPTS).map(([projectId, lines]) => {
    const p = projects.find((x) => x.id === projectId)!;
    const start = Math.round((Date.now() - new Date(p.createdAt).getTime()) / 86_400_000);
    const end = p.status === "completed" ? Math.round((Date.now() - new Date(p.deadline).getTime()) / 86_400_000) : 0;
    return {
      id: `thr_${projectId.slice(4)}`, projectId, studentId: p.studentId!, businessId: p.businessId,
      messages: lines.map(([who, text], i) => ({
        id: `msg_${projectId.slice(4)}_${i + 1}`, from: who === "B" ? "business" : "student", text,
        at: daysFromNow(-(start - 2) + Math.round(((start - 2 - end) * i) / Math.max(1, lines.length - 1)), 9 + i),
      })),
    };
  });
}
