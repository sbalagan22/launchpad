import type { Notification } from "@/schemas";

// MOCK: 25 hand-written notifications across students and businesses.
type Row = [userId: string, title: string, body: string, href: string, read: boolean, hoursAgo: number];
const ROWS: Row[] = [
  ["stu_aisha", "Milestone approved", "Peel Youth Hub approved milestone 1 of Newsletter email template.", "/workspace/prj_07", false, 20],
  ["stu_aisha", "New message", "Peel Youth Hub: Most of our readers open email on their phones.", "/workspace/prj_07", false, 19],
  ["stu_aisha", "New project matches your profile", "Logo and brand mark at GreenEdge Landscaping, 82% match.", "/projects/prj_03", false, 30],
  ["stu_aisha", "Application received", "Halton Food Bank received your proposal for Volunteer signup form.", "/projects/prj_01", true, 24],
  ["stu_aisha", "Skill checked", "CSS is now Skill checked on your profile after Menu board redesign.", "/skills", true, 240],
  ["stu_aisha", "Review posted", "Sunrise Bakery rated Menu board redesign 5 of 5.", "/profile", true, 250],
  ["stu_aisha", "Certification verified", "Google UX Design is issuer verified on your profile.", "/skills", true, 900],
  ["stu_aisha", "Welcome to Launchpad", "Complete your profile to improve your project matches.", "/profile", true, 2800],
  ["stu_aisha", "Project completed", "Event flyer for Peel Youth Hub is complete. 8 hours verified.", "/profile", true, 1200],
  ["biz_sunrise", "Review posted", "Your review of Aisha Khan is now on her public profile.", "/business", true, 250],
  ["biz_sunrise", "Welcome back", "Describe a new project and Launchpad will scope it for you.", "/business/new", true, 70],
  ["biz_sunrise", "Loyalty card project complete", "Priya Shah finished Loyalty card design. Rate her work.", "/business", true, 500],
  ["biz_sunrise", "Tip", "Projects with 3 milestones get filled faster.", "/business/new", true, 900],
  ["biz_sunrise", "Profile viewed", "Four students viewed Sunrise Bakery this week.", "/business", true, 40],
  ["stu_daniel", "Submission needs changes", "Ledger & Co. could not open your staging link. Please resubmit.", "/workspace/prj_08", false, 5],
  ["stu_daniel", "Application received", "Halton Food Bank received your proposal.", "/projects/prj_01", true, 26],
  ["stu_marcus", "Milestone approved", "Cedarvale Physiotherapy approved milestone 1.", "/workspace/prj_09", true, 48],
  ["stu_omar", "Submission received", "Spice Route Catering is reviewing your final milestone.", "/workspace/prj_10", false, 12],
  ["stu_omar", "Automated check finished", "Your site check finished with warnings. Review the notes.", "/workspace/prj_10", false, 12],
  ["biz_peelhub", "Milestone submitted", "Aisha Khan submitted the HTML template for review.", "/business", true, 90],
  ["biz_peelhub", "New applicants", "Three students applied to Social media plan.", "/business", false, 6],
  ["biz_ledger", "Check needs attention", "The staging link from Daniel Okafor returned a 404.", "/business", false, 5],
  ["biz_cedarvale", "Milestone submitted", "Marcus Chen submitted data cleaning for review.", "/business", true, 52],
  ["biz_spice", "Final milestone submitted", "Omar Hassan submitted the refreshed menu site.", "/business", false, 12],
  ["biz_brightsmile", "New applicants", "Two students applied to Patient data cleanup.", "/business", false, 30],
];

export function seedNotifications(): Notification[] {
  return ROWS.map(([userId, title, body, href, read, h], i) => ({
    id: `ntf_${String(i + 1).padStart(2, "0")}`, userId, title, body, href, read,
    createdAt: new Date(Date.now() - h * 3_600_000).toISOString(),
  }));
}
