import { z } from "zod";
import {
  Application, Badge, Business, CatalogEntry, CertClaim, CertStatus, CheckResult, Evaluation, HiringEntry, Id, Message, Milestone, Notification, PipelineStage, Project,
  Review, Reviewer, Student, Submission, Thread, Venture,
} from "./index";

/* ---------- Matching and skill yield ---------- */
export const MatchSchema = z.object({
  score: z.number().int().min(0).max(100),
  breakdown: z.object({
    skills: z.object({ score: z.number(), max: z.number(), matching: z.array(z.string()), related: z.array(z.string()), missing: z.array(z.string()) }),
    availability: z.object({ score: z.number(), max: z.number(), status: z.enum(["good", "tight", "mismatch"]) }),
    certBoost: z.object({ points: z.number(), max: z.number(), items: z.array(z.object({ certId: z.string(), name: z.string(), tier: z.enum(["issuer", "self"]), points: z.number() })) }),
  }),
});
export type Match = z.infer<typeof MatchSchema>;

export const YieldSchema = z.object({
  total: z.number().int(),
  factors: z.array(z.object({ key: z.enum(["learning", "deliverable", "reviewer", "portfolio", "scope"]), label: z.string(), score: z.number(), max: z.literal(20), hint: z.string() })),
  tips: z.array(z.string()),
  repetitive: z.boolean(),
});

/* ---------- Projects ---------- */
export const ProjectCard = z.object({
  project: Project,
  business: Business,
  venture: Venture.nullable(),
  reviewers: z.array(Reviewer),
  applicantCount: z.number().int(),
  match: MatchSchema.nullable(),
  yield: YieldSchema,
  saved: z.boolean(),
  myApplication: Application.nullable(),
  isNew: z.boolean(),
});
export type ProjectCard = z.infer<typeof ProjectCard>;

export const ProjectDetail = ProjectCard.extend({
  strengtheningCerts: z.array(CatalogEntry),
});
export type ProjectDetail = z.infer<typeof ProjectDetail>;

export const ApplicationView = z.object({ application: Application, student: Student, project: Project, business: Business, match: MatchSchema });
export type ApplicationView = z.infer<typeof ApplicationView>;

export const EvaluationView = Evaluation.nullable();
export const SubmissionView = z.object({ submission: Submission, check: CheckResult.nullable(), evaluation: Evaluation.nullable() });
export type SubmissionView = z.infer<typeof SubmissionView>;

export const WorkspaceView = z.object({
  project: Project,
  business: Business,
  venture: Venture.nullable(),
  student: Student,
  reviewers: z.array(Reviewer),
  thread: Thread.nullable(),
  submissions: z.array(SubmissionView),
  review: Review.nullable(),
  badges: z.array(Badge),
  currentMilestone: Milestone.nullable(),
  awaitingFinalApproval: z.boolean(),
});
export type WorkspaceView = z.infer<typeof WorkspaceView>;

/* ---------- Review ---------- */
export const QueueItem = z.object({
  submission: Submission,
  project: Project,
  milestone: Milestone,
  student: Student,
  business: Business,
  check: CheckResult.nullable(),
  evaluation: Evaluation.nullable(),
  waitingHours: z.number(),
  awaitingFinalApproval: z.boolean(),
});
export type QueueItem = z.infer<typeof QueueItem>;

export const SubmissionDetail = z.object({
  submission: Submission,
  project: Project,
  milestone: Milestone,
  student: Student,
  business: Business,
  reviewers: z.array(Reviewer),
  check: CheckResult.nullable(),
  evaluation: Evaluation.nullable(),
  awaitingFinalApproval: z.boolean(),
});
export type SubmissionDetail = z.infer<typeof SubmissionDetail>;

export const FinalApproval = z.object({
  project: Project,
  student: Student,
  badges: z.array(Badge),
  evidence: z.array(z.object({ skill: z.string(), label: z.string(), href: z.string().nullable() })),
});
export type FinalApproval = z.infer<typeof FinalApproval>;

export const MilestoneDecision = z.object({ submission: Submission, project: Project, awaitingFinalApproval: z.boolean() });
export type MilestoneDecision = z.infer<typeof MilestoneDecision>;

/* ---------- Certifications ---------- */
export const ClaimView = z.object({ claim: CertClaim, entry: CatalogEntry.nullable() });
export type ClaimView = z.infer<typeof ClaimView>;

export const CertDetail = z.object({
  entry: CatalogEntry,
  strengthens: z.array(z.object({ projectId: z.string(), title: z.string(), business: z.string() })),
  myClaim: CertClaim.nullable(),
});
export type CertDetail = z.infer<typeof CertDetail>;

export const Pathway = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  steps: z.array(z.object({ entry: CatalogEntry, claim: CertClaim.nullable() })),
});
export type Pathway = z.infer<typeof Pathway>;

/* ---------- Startups and pipeline ---------- */
export const VenturePage = z.object({
  venture: Venture,
  business: Business,
  openProjects: z.array(ProjectCard),
  past: z.array(z.object({ project: Project, review: Review.nullable(), student: Student })),
  founderVerified: z.boolean(),
});
export type VenturePage = z.infer<typeof VenturePage>;

export const PipelineCard = z.object({
  entry: HiringEntry,
  student: Student,
  project: Project,
  application: Application.nullable(),
  match: MatchSchema,
  canInvite: z.boolean(),
});
export type PipelineCard = z.infer<typeof PipelineCard>;
export const PipelineView = z.object({ stages: z.array(PipelineStage), cards: z.array(PipelineCard) });
export type PipelineView = z.infer<typeof PipelineView>;

export const InviteView = z.object({ entry: HiringEntry, business: Business, venture: Venture.nullable(), project: Project });
export type InviteView = z.infer<typeof InviteView>;

/* ---------- Profile ---------- */
export const CompletedProject = z.object({ project: Project, business: Business, venture: Venture.nullable(), review: Review.nullable(), badges: z.array(Badge), evaluation: Evaluation.nullable(), submissionUrl: z.string().nullable() });
export type CompletedProject = z.infer<typeof CompletedProject>;

export const ProfileView = z.object({
  student: Student,
  completed: z.array(CompletedProject),
  claims: z.array(ClaimView),
  roadmap: z.object({ earned: z.array(ClaimView), in_progress: z.array(ClaimView), planned: z.array(ClaimView) }),
  badges: z.array(Badge),
  verifiedHours: z.number(),
  active: z.number().int(),
  applied: z.number().int(),
  strength: z.number().int(),
  strengthItems: z.array(z.object({ label: z.string(), done: z.boolean() })),
  highlyRated: z.array(z.object({ review: Review, business: Business, venture: Venture.nullable() })),
  invites: z.array(InviteView),
  pipeline: z.array(InviteView),
});
export type ProfileView = z.infer<typeof ProfileView>;

export const EvidenceView = z.array(z.object({ badge: Badge, project: Project, business: Business, evaluation: Evaluation.nullable(), review: Review.nullable() }));
export type EvidenceView = z.infer<typeof EvidenceView>;

/* ---------- Impact, search, notifications ---------- */
export const ImpactView = z.object({
  studentsPlaced: z.number().int(),
  hoursContributed: z.number(),
  organizationsServed: z.number().int(),
  averageRating: z.number(),
  skillsVerified: z.number().int(),
  projectsCompleted: z.number().int(),
  projectsInProgress: z.number().int(),
  openProjects: z.number().int(),
  timeToFirstProjectDays: z.number(),
  stipendsPaid: z.number(),
  volunteerHours: z.number(),
  averageSkillYield: z.number(),
  venturesActive: z.number().int(),
  invitesSent: z.number().int(),
  byType: z.array(z.object({ type: z.string(), projects: z.number().int(), hours: z.number() })),
  byEmployer: z.array(z.object({ employerType: z.string(), organizations: z.number().int(), projects: z.number().int() })),
  byFaculty: z.array(z.object({ faculty: z.string(), students: z.number().int(), hours: z.number() })),
  byMonth: z.array(z.object({ month: z.string(), hours: z.number() })),
  skillMix: z.object({ reviewed: z.number().int(), self: z.number().int() }),
  certMix: z.object({ issuer: z.number().int(), self: z.number().int() }),
});
export type ImpactView = z.infer<typeof ImpactView>;

export const PaletteResult = z.object({
  pages: z.array(z.object({ label: z.string(), href: z.string() })),
  projects: z.array(z.object({ id: z.string(), title: z.string(), business: z.string(), href: z.string() })),
  certs: z.array(z.object({ id: z.string(), name: z.string(), issuer: z.string(), href: z.string() })),
});
export type PaletteResult = z.infer<typeof PaletteResult>;

export const ThreadView = z.object({ thread: Thread, project: Project, business: Business, student: Student });
export type ThreadView = z.infer<typeof ThreadView>;

export { Message, Notification, CertStatus, Id };
