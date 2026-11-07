import type { Project, Thread } from "@/schemas";
import { daysFromNow } from "@/lib/dates";

type Line = ["B" | "S", string];

// MOCK: 15 hand-written per-project chat threads (5 to 8 messages each).
const SCRIPTS: Record<string, Line[]> = {
  prj_07: [
    ["B", "Hi Aisha, welcome aboard. Our brand colours and logo are in the shared folder."],
    ["S", "Thanks! I'll have the Figma layout ready to review by Thursday."],
    ["B", "The layout looks great. Can the header be a little shorter on phones?"],
    ["S", "Yes, I'll shrink the logo block and move the date line under the headline."],
    ["B", "Approved milestone one. Most of our readers open email on their phones, so please test there first."],
    ["S", "Understood. I'll test in Gmail and Apple Mail and send screenshots with the build."],
  ],
  prj_08: [
    ["B", "Daniel, thanks for the prototype. The intake form is much clearer than our PDFs."],
    ["S", "Glad it works. I added inline validation so clients can't skip the tax-year field."],
    ["B", "Our bookkeepers also need to filter the tracker by status. Is that doable?"],
    ["S", "Yes, I'll add status and due-date filters in the tracker build."],
    ["B", "The staging link returned an error this morning. Can you check?"],
    ["S", "Sorry about that, the host paused the project. I've redeployed and will resubmit today."],
  ],
  prj_09: [
    ["B", "Hi Marcus. The export is on the secure drive. Names are already removed."],
    ["S", "Got it. I'll document every cleaning step in a change log."],
    ["S", "First pass done: 214 duplicate bookings found and merged."],
    ["B", "That's higher than we expected. Can you split them by clinician?"],
    ["S", "Yes. I'll include that split in the analysis milestone."],
    ["B", "Perfect, thanks. Milestone one approved."],
  ],
  prj_10: [
    ["B", "Hi Omar, the old site is at the link in the brief. The menu PDFs are attached."],
    ["S", "Thanks. I'll start with mobile layouts since most inquiries come from phones."],
    ["B", "Mockups look fresh. Can the comparison table show per-person pricing?"],
    ["S", "Yes, I'll add a toggle between per-person and per-event."],
    ["S", "Pages are live on staging. I'm submitting the final milestone for review now."],
    ["B", "Thanks, we'll look today."],
  ],
  prj_11: [
    ["B", "Hi Aisha, welcome aboard. The menu photos are in the shared folder."],
    ["S", "Thanks. I'll have the layout in Figma by Thursday."],
    ["B", "We'd like the board to be readable from the back of the shop."],
    ["S", "I'll use large type and test on the actual screen before final delivery."],
    ["B", "The in-store test looks great, the prices are very readable."],
    ["S", "Wonderful. I'll send the update guide so staff can change items themselves."],
    ["B", "Brilliant, thank you. Approving the last milestone now."],
  ],
  prj_12: [
    ["B", "Hi Aisha, the open house is on the 24th. Here is the logo pack."],
    ["S", "Thanks. I'll send two layout directions on Friday."],
    ["B", "We prefer the second one. Can we make the date bigger?"],
    ["S", "Done, updated files attached in both print and square sizes."],
    ["B", "Perfect. Sending these to the printer today."],
  ],
  prj_13: [
    ["B", "Hi Daniel, we need parents to register teams from a phone. Is that possible?"],
    ["S", "Definitely. I'll design it mobile first and keep it to one page."],
    ["B", "Can coaches get a spreadsheet of registrations?"],
    ["S", "I'll add a CSV export behind a simple coach link."],
    ["S", "The form is live on staging. Please try registering a test team."],
    ["B", "Worked first time. Parents are going to love this."],
    ["B", "Approved. Thank you, Daniel."],
  ],
  prj_14: [
    ["B", "Daniel, customers call to book tire changes. We want them to pick a slot online."],
    ["S", "I'll build a slot picker that emails the shop on every booking."],
    ["B", "Can it block out slots that are already taken?"],
    ["S", "Yes, I'll store bookings in a sheet the shop can see and block taken slots."],
    ["S", "Booking flow is ready for testing."],
    ["B", "Booked ourselves three times without trouble. Approved."],
  ],
  prj_15: [
    ["B", "Hi Priya, here are our packaging photos for colour reference."],
    ["S", "Thanks, I'll send three concepts by Monday."],
    ["B", "Love the second one with the wheat stamp. Can the back include our address?"],
    ["S", "Absolutely. Final print-ready PDF attached."],
    ["B", "Printed twenty test cards, they look wonderful."],
  ],
  prj_17: [
    ["B", "Hi Marcus, the waitlist export is attached. Some entries are duplicates."],
    ["S", "I'll clean those first and share a summary of what I changed."],
    ["S", "140 entries reduced to 126 unique households."],
    ["B", "That matches what we expected. Please group by neighbourhood next."],
    ["S", "Charts attached. Median wait is 19 months in the east end versus 8 in the west."],
    ["B", "This will really help our committee discussion. Thank you."],
  ],
  prj_19: [
    ["B", "Hi Sofia, we love our old logo but it looks dated."],
    ["S", "I'll keep the hand-drawn feel and modernize the type. Concepts on Friday."],
    ["B", "Concept two is the one. Can the leaves be a bit thinner?"],
    ["S", "Updated. I've also prepared a one-colour version for stamps."],
    ["B", "It's beautiful. Final files received, thank you."],
  ],
  prj_21: [
    ["B", "Hi Jordan, registration opens on the 1st and we need parents to notice."],
    ["S", "I'll draft a four-week calendar and sample posts for you to review."],
    ["B", "The calendar looks good. Could we feature a coach each week?"],
    ["S", "Great idea, I'll add a coach spotlight format."],
    ["S", "All twelve posts are in the shared folder with captions."],
    ["B", "Registrations are up 30 percent over last season. Thank you!"],
  ],
  prj_23: [
    ["B", "Fatima, our pricing lives in three different notes. Can you merge them?"],
    ["S", "Yes. I'll draft the one-pager first, then the internal sheet."],
    ["B", "The one-pager is clear. Clients keep asking what is included in 'bookkeeping'."],
    ["S", "I'll add a short included versus extra table."],
    ["B", "Perfect. Approving."],
  ],
  prj_25: [
    ["B", "Liam, donors are saying the form sometimes just resets."],
    ["S", "I can reproduce it on older Android browsers. Looks like a date field issue."],
    ["B", "That would explain it, a lot of our donors use older phones."],
    ["S", "Fixed and added validation messages. Please test on your phone."],
    ["B", "It works. We got three donations this morning that would have been lost."],
    ["B", "Thank you, approving."],
  ],
  prj_27: [
    ["B", "Hi Hannah, we'd like four posts about coat care. Keep it friendly."],
    ["S", "I'll send an outline and the first post in a few days."],
    ["B", "Love the tone. Can we mention seasonal shedding in post two?"],
    ["S", "Yes, I'll weave it in."],
    ["S", "Posts two to four are attached with titles and meta descriptions."],
    ["B", "These read really well. Approved, thank you!"],
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
        at: daysFromNow(-(start - 2) + Math.round(((start - 2 - end) * i) / Math.max(1, lines.length - 1)) * 1, 9 + i),
      })),
    };
  });
}
