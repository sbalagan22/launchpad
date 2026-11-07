import { z } from "zod";
import { Application, Badge, Business, CertClaim, Certification, CheckResult, Id, Project, Review, Student, Submission, Thread } from "./index";

export const MatchSchema = z.object({
  percent: z.number().int().min(0).max(100),
  matching: z.array(z.string()),
  related: z.array(z.string()),
  missing: z.array(z.string()),
  availability: z.enum(["good", "tight", "mismatch"]),
});
export type Match = z.infer<typeof MatchSchema>;

export const ProjectView = z.object({
  project: Project,
  business: Business,
  applicantCount: z.number().int(),
  match: MatchSchema.nullable(),
  myApplication: Application.nullable(),
  isNew: z.boolean(),
});
export type ProjectView = z.infer<typeof ProjectView>;

export const ApplicationView = z.object({
  application: Application,
  student: Student,
  match: MatchSchema,
  project: Project,
  business: Business,
});
export type ApplicationView = z.infer<typeof ApplicationView>;

export const SubmissionView = z.object({ submission: Submission, check: CheckResult.nullable() });
export type SubmissionView = z.infer<typeof SubmissionView>;

export const WorkspaceView = z.object({
  project: Project,
  business: Business,
  student: Student,
  thread: Thread.nullable(),
  submissions: z.array(SubmissionView),
  review: Review.nullable(),
  badges: z.array(Badge),
});
export type WorkspaceView = z.infer<typeof WorkspaceView>;

export const ClaimView = z.object({ claim: CertClaim, cert: Certification });
export type ClaimView = z.infer<typeof ClaimView>;

export const CompletedProjectView = z.object({ project: Project, business: Business, review: Review.nullable(), badges: z.array(Badge), submissionUrl: z.string().nullable() });
export type CompletedProjectView = z.infer<typeof CompletedProjectView>;

export const ProfileView = z.object({
  student: Student,
  completed: z.array(CompletedProjectView),
  claims: z.array(ClaimView),
  badges: z.array(Badge),
  verifiedHours: z.number(),
  active: z.number().int(),
  applied: z.number().int(),
  strength: z.number().int(),
  strengthItems: z.array(z.object({ label: z.string(), done: z.boolean() })),
});
export type ProfileView = z.infer<typeof ProfileView>;

export const ThreadView = z.object({ thread: Thread, project: Project, business: Business, student: Student });
export type ThreadView = z.infer<typeof ThreadView>;

export const ImpactView = z.object({
  studentsPlaced: z.number().int(),
  hoursContributed: z.number(),
  businessesServed: z.number().int(),
  averageRating: z.number(),
  skillsVerified: z.number().int(),
  projectsCompleted: z.number().int(),
  projectsInProgress: z.number().int(),
  openProjects: z.number().int(),
  timeToFirstProjectDays: z.number(),
  stipendsPaid: z.number(),
  volunteerHours: z.number(),
  byType: z.array(z.object({ type: z.string(), projects: z.number().int(), hours: z.number() })),
  byCity: z.array(z.object({ city: z.string(), businesses: z.number().int(), projects: z.number().int() })),
  bySchool: z.array(z.object({ school: z.string(), students: z.number().int(), hours: z.number() })),
  byMonth: z.array(z.object({ month: z.string(), hours: z.number() })),
  trustMix: z.object({ issuer: z.number().int(), checked: z.number().int(), self: z.number().int() }),
});
export type ImpactView = z.infer<typeof ImpactView>;

export type IdType = z.infer<typeof Id>;
