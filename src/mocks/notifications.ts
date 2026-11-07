import type { Notification } from "@/schemas";

// MOCK: 25 hand-written notifications for students, posters and reviewers.
type Row = [userId: string, title: string, body: string, href: string, read: boolean, hoursAgo: number];
const ROWS: Row[] = [
  ["stu_aisha", "Milestone approved", "Keele Robotics Club approved milestone 1 of Hack Night Registration Site.", "/workspace/prj_hack", false, 20],
  ["stu_aisha", "New message", "Keele Robotics Club: Most members sign up from their phones, so test there first.", "/workspace/prj_hack", false, 19],
  ["stu_aisha", "Project matches your profile", "Ship the First Real Version of Reroute is a strong match for React and Git.", "/projects/prj_reroute_mvp", false, 30],
  ["stu_aisha", "Application received", "Keele Robotics Club received your proposal for Robotics Club Website Refresh.", "/projects/prj_robo", true, 24],
  ["stu_aisha", "Reviewer feedback", "Noor Haddad scored Waitlist Page in React 4 of 4 on code clarity.", "/profile", true, 1900],
  ["stu_aisha", "Review posted", "Fieldnote rated Waitlist Page in React 5 of 5.", "/profile", true, 1950],
  ["stu_aisha", "Certification verified", "freeCodeCamp Responsive Web Design is issuer verified on your profile.", "/certifications", true, 4000],
  ["stu_aisha", "Welcome to Launchpad", "Add your first certification to your roadmap and improve your matches.", "/certifications", true, 2800],
  ["stu_aisha", "Project completed", "Club Event Microsite for Keele Robotics Club is complete. 10 hours verified.", "/profile", true, 1200],
  ["biz_corner", "Welcome back", "Describe a new project and Launchpad will draft a brief for you.", "/business/new", true, 70],
  ["biz_corner", "Milestone in review", "Omar Hassan submitted the final milestone of Digital Menu Board.", "/business/projects/prj_menu", false, 12],
  ["biz_corner", "Tip", "Projects with a named reviewer and a clear rubric get filled faster.", "/business/new", true, 900],
  ["biz_corner", "Profile viewed", "Four students viewed Corner Press Coffee this week.", "/business", true, 40],
  ["biz_reroute", "New applicants", "Two students applied to Ship the First Real Version of Reroute.", "/business/projects/prj_reroute_mvp", false, 6],
  ["biz_reroute", "Student finished", "Daniel Okafor finished Transit Stop Search Prototype. Consider inviting him to continue.", "/business", true, 1500],
  ["biz_reroute", "Mentor assigned", "Dana Whitfield is the YSpace mentor reviewer on your open project.", "/business/projects/prj_reroute_mvp", true, 130],
  ["rev_noor", "Submission waiting", "Omar Hassan submitted Digital Menu Board for review.", "/reviewer", false, 12],
  ["rev_noor", "Submission waiting", "Daniel Okafor resubmitted Eval Results Table after a failed Basic check.", "/reviewer", true, 8],
  ["rev_noor", "Thanks for reviewing", "Your feedback on Telemetry Logging Tool was marked helpful by the student.", "/reviewer", true, 1700],
  ["stu_daniel", "Submission needs changes", "Kiln could not open your staging link. Please resubmit.", "/workspace/prj_kilndash", false, 5],
  ["stu_marcus", "Milestone approved", "Lin Visualization Lab approved milestone 1.", "/workspace/prj_survey", true, 48],
  ["stu_omar", "Submission received", "Corner Press Coffee is waiting on the reviewer for your final milestone.", "/workspace/prj_menu", false, 12],
  ["biz_foodbank", "New applicants", "Two students applied to Make the Board Read the Dashboard.", "/business/projects/prj_board", false, 30],
  ["biz_psylab", "Reviewer assigned", "Prof. Amara Osei and Jamal Brooks will review Replace the Emailed CSVs.", "/business/projects/prj_lab", true, 100],
  ["rev_sana", "New project to review", "Make the Board Read the Dashboard lists you as reviewer.", "/reviewer", true, 70],
];

export function seedNotifications(): Notification[] {
  return ROWS.map(([userId, title, body, href, read, h], i) => ({ id: `ntf_${String(i + 1).padStart(2, "0")}`, userId, title, body, href, read, createdAt: new Date(Date.now() - h * 3_600_000).toISOString() }));
}
