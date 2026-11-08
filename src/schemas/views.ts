import { z } from "zod";
import {
  Application, Approval, Badge, Business, CatalogEntry, CertClaim, CertStatus, CheckResult, HiringEntry, Id, Message, Milestone, Notification, PipelineStage, Project,
  Review, Student, Submission, Thread, Venture,
} from "./index";

/* ---------- Matching ---------- */
export const MatchReason = z.object({ key: z.enum(["skills", "program", "availability", "cert", "reviews"]), text: z.string(), tone: z.enum(["good", "ok", "low"]) });
export const MatchSchema = z.object({
  score: z.number().int().min(0).max(100),
  /** 4 to 5 short reasons shown under the ring. */
  reasons: z.array(MatchReason).min(4).max(5),
  certBoost: z.object({ points: z.number(), items: z.array(z.object({ certId: z.string(), name: z.string(), tier: z.enum(["issuer", "self"]), points: z.number() })) }),
  skills: z.object({ matching: z.array(z.string()), related: z.array(z.string()), missing: z.array(z.string()) }),
});
export type Match = z.infer<typeof MatchSchema>;

/* ---------- Projects ---------- */
export const ProjectCard = z.object({
  project: Project,
  business: Business,
  venture: Venture.nullable(),
  applicantCount: z.number().int(),
  match: MatchSchema.nullable(),
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

export const SubmissionView = z.object({ submission: Submission, check: CheckResult.nullable(), approval: Approval.nullable() });
export type SubmissionView = z.infer<typeof SubmissionView>;

export const WorkspaceView = z.object({
  project: Project,
  business: Business,
  venture: Venture.nullable(),
  student: Student,
  thread: Thread.nullable(),
  submissions: z.array(SubmissionView),
  review: Review.nullable(),
  badges: z.array(Badge),
  currentMilestone: Milestone.nullable(),
  awaitingFinalApproval: z.boolean(),
});
export type WorkspaceView = z.infer<typeof WorkspaceView>;

/* ---------- Approvals (poster side) ---------- */
export const PendingApproval = z.object({
  submission: Submission, project: Project, milestone: Milestone, student: Student, business: Business, check: CheckResult.nullable(),
  approval: Approval.nullable(), waitingHours: z.number(), isLastMilestone: z.boolean(),
});
export type PendingApproval = z.infer<typeof PendingApproval>;

export const FinalApproval = z.object({
  project: Project,
  student: Student,
  badges: z.array(Badge),
  review: Review.nullable(),
  evidence: z.array(z.object({ skill: z.string(), label: z.string(), href: z.string().nullable() })),
});
export type FinalApproval = z.infer<typeof FinalApproval>;

export const ApprovalResult = z.object({ submission: Submission, project: Project, approval: Approval, final: FinalApproval.nullable() });
export type ApprovalResult = z.infer<typeof ApprovalResult>;

export const WorkspaceSummary = z.object({ project: Project, business: Business, venture: Venture.nullable(), student: Student, currentMilestone: Milestone.nullable(), unread: z.number().int(), awaiting: z.enum(["you", "poster", "none"]) });
export type WorkspaceSummary = z.infer<typeof WorkspaceSummary>;

export const BusinessStats = z.object({ posted: z.number().int(), active: z.number().int(), completed: z.number().int(), open: z.number().int(), candidates: z.number().int(), studentHours: z.number(), averageReview: z.number(), pendingApprovals: z.number().int() });
export type BusinessStats = z.infer<typeof BusinessStats>;

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
export const CompletedProject = z.object({ project: Project, business: Business, venture: Venture.nullable(), review: Review.nullable(), badges: z.array(Badge), approval: Approval.nullable(), submissionUrl: z.string().nullable() });
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

export const EvidenceView = z.array(z.object({ badge: Badge, project: Project, business: Business, approval: Approval.nullable(), review: Review.nullable() }));
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
  venturesActive: z.number().int(),
  invitesSent: z.number().int(),
  byType: z.array(z.object({ type: z.string(), projects: z.number().int(), hours: z.number() })),
  byEmployer: z.array(z.object({ employerType: z.string(), organizations: z.number().int(), projects: z.number().int() })),
  byFaculty: z.array(z.object({ faculty: z.string(), students: z.number().int(), hours: z.number() })),
  byMonth: z.array(z.object({ month: z.string(), hours: z.number() })),
  skillMix: z.object({ approved: z.number().int(), self: z.number().int() }),
  certMix: z.object({ issuer: z.number().int(), self: z.number().int() }),
});
export type ImpactView = z.infer<typeof ImpactView>;

export const ThreadSummary = z.object({
  thread: Thread, project: Project.nullable(),
  other: z.object({ id: z.string(), name: z.string(), sub: z.string(), kind: z.enum(["student", "business"]) }),
  last: Message, unread: z.number().int(),
});
export type ThreadSummary = z.infer<typeof ThreadSummary>;
export const ThreadDetail = ThreadSummary.extend({ business: Business, student: Student });
export type ThreadDetail = z.infer<typeof ThreadDetail>;

export { Message, Notification, CertStatus, Id };
