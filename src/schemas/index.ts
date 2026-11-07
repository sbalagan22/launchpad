import { z } from "zod";

/** One schema per entity, shared by mocks, services, store and UI. */

export const Id = z.string().min(1);
export const IsoDate = z.string().min(10);

/* ---------- Trust ---------- */
// Skills: backed by a reviewer-approved project, or typed in by the student.
export const SkillTrust = z.enum(["reviewed", "self"]);
export type SkillTrust = z.infer<typeof SkillTrust>;
export const SKILL_TRUST_LABEL: Record<SkillTrust, string> = { reviewed: "Reviewer approved", self: "Self-reported" };

// Certifications: exactly two tiers. Launchpad never issues, grades or tests them.
export const CertTier = z.enum(["issuer", "self"]);
export type CertTier = z.infer<typeof CertTier>;
export const CERT_TIER_LABEL: Record<CertTier, string> = { issuer: "Issuer verified", self: "Not verified" };
export const CertStatus = z.enum(["earned", "in_progress", "planned"]);
export type CertStatus = z.infer<typeof CertStatus>;
export const CERT_STATUS_LABEL: Record<CertStatus, string> = { earned: "Earned", in_progress: "In progress", planned: "Planned" };

export const Level = z.enum(["Beginner", "Intermediate", "Advanced"]);
export type Level = z.infer<typeof Level>;

export const ProjectType = z.enum(["web", "design", "data", "marketing", "writing", "admin"]);
export type ProjectType = z.infer<typeof ProjectType>;
export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  web: "Web and software",
  design: "Design and brand",
  data: "Data and analytics",
  marketing: "Marketing and social",
  writing: "Writing and content",
  admin: "Business and operations",
};

export const ProjectStatus = z.enum(["draft", "open", "in_progress", "in_review", "completed"]);
export type ProjectStatus = z.infer<typeof ProjectStatus>;
export const MilestoneStatus = z.enum(["open", "in_progress", "in_review", "approved"]);
export type MilestoneStatus = z.infer<typeof MilestoneStatus>;

export const Faculty = z.enum(["Lassonde", "Schulich", "LA&PS", "AMPD", "Science", "Health", "Education", "EUC", "Glendon"]);
export type Faculty = z.infer<typeof Faculty>;
export const Campus = z.enum(["Keele", "Glendon"]);

export const EmployerType = z.enum(["york_unit", "professor", "founder", "local_business", "nonprofit", "yspace_startup"]);
export type EmployerType = z.infer<typeof EmployerType>;
export const EMPLOYER_LABEL: Record<EmployerType, string> = {
  york_unit: "York unit or club",
  professor: "Professor or lab",
  founder: "Student or alumni founder",
  local_business: "Local business",
  nonprofit: "Nonprofit",
  yspace_startup: "YSpace startup",
};
/** Only nonprofits and York units may post unpaid (volunteer) projects. */
export const VOLUNTEER_ELIGIBLE: EmployerType[] = ["nonprofit", "york_unit"];

export const Evidence = z.object({ label: z.string(), href: z.string().optional(), projectId: Id.optional() });
export type Evidence = z.infer<typeof Evidence>;

export const SkillEntry = z.object({ name: z.string(), level: Level, trust: SkillTrust, evidence: z.array(Evidence).default([]) });
export type SkillEntry = z.infer<typeof SkillEntry>;

export const AvailabilityPref = z.enum(["paid", "volunteer", "both"]);
export type AvailabilityPref = z.infer<typeof AvailabilityPref>;

export const Student = z.object({
  id: Id,
  slug: z.string(),
  name: z.string(),
  email: z.string(),
  yorkVerified: z.boolean(),
  program: z.string(),
  faculty: Faculty,
  year: z.number().int().min(1).max(5),
  campus: Campus,
  bio: z.string(),
  hoursPerWeek: z.number().int().min(1).max(40),
  pref: AvailabilityPref,
  portfolioUrl: z.string().optional(),
  skills: z.array(SkillEntry),
  createdAt: IsoDate,
});
export type Student = z.infer<typeof Student>;

export const Business = z.object({
  id: Id,
  name: z.string(),
  employerType: EmployerType,
  category: z.string(),
  city: z.string(),
  description: z.string(),
  rating: z.number().min(1).max(5),
  founded: z.number().int(),
  size: z.string(),
  alumniOwned: z.boolean(),
  nearCampus: z.boolean(),
  createdAt: IsoDate,
});
export type Business = z.infer<typeof Business>;

export const ReviewerTitle = z.enum(["Professor", "TA", "Alum", "Senior student", "YSpace mentor"]);
export const Reviewer = z.object({ id: Id, name: z.string(), title: ReviewerTitle, org: z.string(), expertise: z.array(ProjectType), bio: z.string() });
export type Reviewer = z.infer<typeof Reviewer>;

export const Sector = z.enum(["mobility", "healthtech", "agrifood", "fintech", "ai_tools", "climate"]);
export type Sector = z.infer<typeof Sector>;
export const VentureStage = z.enum(["idea", "prototype", "preseed", "seed"]);
export const Venture = z.object({
  id: Id,
  businessId: Id,
  name: z.string(),
  pitch: z.string(),
  sector: Sector,
  stage: VentureStage,
  teamSize: z.number().int().min(1),
  stack: z.array(z.string()),
  founders: z.array(z.object({ name: z.string(), role: z.string() })),
  yspaceVerified: z.boolean(),
  logoTone: z.enum(["red", "ink", "gray", "tint"]),
});
export type Venture = z.infer<typeof Venture>;

export const RubricCriterion = z.object({ criterion: z.string().min(1), description: z.string().min(1) });
export type RubricCriterion = z.infer<typeof RubricCriterion>;

export const Milestone = z.object({
  id: Id,
  title: z.string().min(1),
  hours: z.number().min(0),
  dueAt: IsoDate,
  amount: z.number().min(0),
  status: MilestoneStatus,
  approvedAt: IsoDate.optional(),
});
export type Milestone = z.infer<typeof Milestone>;

export const Project = z.object({
  id: Id,
  businessId: Id,
  ventureId: Id.optional(),
  title: z.string().min(1),
  hook: z.string(),
  type: ProjectType,
  status: ProjectStatus,
  description: z.string(),
  deliverables: z.array(z.string()).min(1),
  milestones: z.array(Milestone).min(2).max(4),
  skills: z.array(z.string()).min(1),
  tools: z.array(z.string()),
  hours: z.number().int().min(1).max(25),
  /** Equity-only work is not allowed: there is no "equity" pay type. */
  payType: z.enum(["stipend", "volunteer"]),
  pay: z.number().min(0),
  /** Volunteer roles may carry a stipend funded by a sponsor. */
  sponsorStipend: z.number().min(0).default(0),
  deadline: IsoDate,
  createdAt: IsoDate,
  studentId: Id.nullable(),
  reviewerIds: z.array(Id).min(1),
  rubric: z.array(RubricCriterion).min(3).max(5),
  doneLooksLike: z.string(),
  goodFit: z.string(),
  notAFit: z.string(),
  strengthenedBy: z.array(z.string()),
  faculties: z.array(Faculty),
  fineprint: z.string().optional(),
  badgeSkills: z.array(z.string()),
  beginnerFriendly: z.boolean(),
  aiScoped: z.boolean(),
  loggedHours: z.number().min(0).default(0),
});
export type Project = z.infer<typeof Project>;

export const Application = z.object({
  id: Id,
  projectId: Id,
  studentId: Id,
  proposal: z.string().min(1),
  status: z.enum(["pending", "accepted", "rejected"]),
  createdAt: IsoDate,
});
export type Application = z.infer<typeof Application>;

export const Message = z.object({ id: Id, from: z.enum(["student", "business"]), text: z.string().min(1), at: IsoDate });
export type Message = z.infer<typeof Message>;

export const Thread = z.object({ id: Id, projectId: Id, studentId: Id, businessId: Id, messages: z.array(Message).min(1) });
export type Thread = z.infer<typeof Thread>;

export const Review = z.object({
  id: Id,
  projectId: Id,
  studentId: Id,
  businessId: Id,
  rating: z.number().int().min(1).max(5),
  text: z.string(),
  by: z.string(),
  createdAt: IsoDate,
});
export type Review = z.infer<typeof Review>;

export const Notification = z.object({ id: Id, userId: Id, title: z.string(), body: z.string(), href: z.string(), read: z.boolean(), createdAt: IsoDate });
export type Notification = z.infer<typeof Notification>;

/* ---------- Certification catalog ---------- */
export const CertCategory = z.enum(["Cloud", "Cybersecurity", "Software and Web", "DevOps", "Data and AI", "Agile and Product"]);
export type CertCategory = z.infer<typeof CertCategory>;
export const DemoCredential = z.object({
  value: z.string(),
  outcome: z.enum(["pass", "fail"]),
  holder: z.string().optional(),
  certName: z.string().optional(),
  issuedAt: IsoDate.optional(),
  expiresAt: IsoDate.optional(),
  reason: z.string().optional(),
});
export type DemoCredential = z.infer<typeof DemoCredential>;

export const CatalogEntry = z.object({
  id: Id,
  name: z.string(),
  issuer: z.string(),
  issuerKey: z.string(),
  category: CertCategory,
  level: z.string(),
  costUsd: z.number().nullable(),
  costNote: z.string(),
  validity: z.string(),
  freePrep: z.string(),
  freePrepUrl: z.string(),
  verification: z.string(),
  verificationConfirmed: z.boolean(),
  studyHours: z.number(),
  whatItProves: z.string(),
  unlocksTags: z.array(z.string()),
  url: z.string(),
  demoIds: z.array(DemoCredential),
});
export type CatalogEntry = z.infer<typeof CatalogEntry>;

export const CertClaim = z
  .object({
    id: Id,
    studentId: Id,
    certId: z.string().min(1),
    customName: z.string().optional(),
    tier: CertTier,
    status: CertStatus,
    credentialRef: z.string().optional(),
    issuedAt: IsoDate.optional(),
    expiresAt: IsoDate.optional(),
    issuerUrl: z.string().optional(),
    fileName: z.string().optional(),
    createdAt: IsoDate,
  })
  // Issuer verification only ever produces an earned claim with dates. A file upload never changes the tier.
  .refine((c) => c.tier !== "issuer" || (c.status === "earned" && Boolean(c.credentialRef) && Boolean(c.issuedAt)), { message: "issuer tier requires an earned claim with a credential and issue date" })
  .refine((c) => c.certId !== "other" || Boolean(c.customName), { message: "custom certifications need a name" });
export type CertClaim = z.infer<typeof CertClaim>;

/* ---------- Submissions, evaluations, badges ---------- */
export const CheckResult = z.object({
  id: Id,
  url: z.string(),
  reachable: z.boolean(),
  httpStatus: z.number().int(),
  loadSeconds: z.number().nullable(),
  status: z.enum(["ok", "slow", "unreachable"]),
  note: z.string(),
  checkedAt: IsoDate,
});
export type CheckResult = z.infer<typeof CheckResult>;

export const Submission = z.object({
  id: Id,
  projectId: Id,
  milestoneId: Id,
  studentId: Id,
  url: z.string().optional(),
  fileNames: z.array(z.string()),
  final: z.boolean(),
  checkId: Id.optional(),
  status: z.enum(["pending_review", "approved", "changes_requested"]),
  note: z.string().optional(),
  submittedAt: IsoDate,
});
export type Submission = z.infer<typeof Submission>;

export const Evaluation = z.object({
  id: Id,
  submissionId: Id,
  projectId: Id,
  reviewerId: Id,
  scores: z.array(z.object({ criterion: z.string(), score: z.number().int().min(1).max(4) })).min(3),
  feedback: z.string().min(1),
  decision: z.enum(["approved", "changes_requested"]),
  at: IsoDate,
});
export type Evaluation = z.infer<typeof Evaluation>;

export const Badge = z.object({
  id: Id,
  studentId: Id,
  skill: z.string(),
  projectId: Id,
  issuedAt: IsoDate,
  evidence: z.array(Evidence),
  checkId: Id.optional(),
});
export type Badge = z.infer<typeof Badge>;

export const PipelineStage = z.enum(["applied", "interviewing", "trial", "offer"]);
export type PipelineStage = z.infer<typeof PipelineStage>;
export const HiringEntry = z.object({
  id: Id,
  businessId: Id,
  studentId: Id,
  projectId: Id,
  applicationId: Id.optional(),
  stage: PipelineStage,
  invite: z.object({ sentAt: IsoDate, role: z.string(), message: z.string() }).optional(),
  updatedAt: IsoDate,
});
export type HiringEntry = z.infer<typeof HiringEntry>;

export const SavedProject = z.object({ studentId: Id, projectId: Id });

export const Db = z.object({
  students: z.array(Student),
  businesses: z.array(Business),
  reviewers: z.array(Reviewer),
  ventures: z.array(Venture),
  projects: z.array(Project),
  applications: z.array(Application),
  threads: z.array(Thread),
  reviews: z.array(Review),
  notifications: z.array(Notification),
  catalog: z.array(CatalogEntry),
  certClaims: z.array(CertClaim),
  submissions: z.array(Submission),
  evaluations: z.array(Evaluation),
  checks: z.array(CheckResult),
  badges: z.array(Badge),
  pipeline: z.array(HiringEntry),
  saved: z.array(SavedProject),
});
export type Db = z.infer<typeof Db>;

/* ---------- Service-level schemas ---------- */
export const ScopeInput = z.object({
  brief: z.string().trim().min(8, "Describe the work in at least a short sentence."),
  businessId: Id,
});
export type ScopeInput = z.infer<typeof ScopeInput>;

export const ScopeResult = z.object({
  title: z.string().min(1),
  hook: z.string(),
  type: ProjectType,
  summary: z.string(),
  deliverables: z.array(z.string()).min(1).max(6),
  milestones: z.array(z.object({ title: z.string(), hours: z.number().min(1), dueInDays: z.number().int().min(3) })).min(2).max(4),
  skills: z.array(z.string()).min(1).max(8),
  tools: z.array(z.string()).max(8),
  hours: z.number().int().min(1).max(25),
  payType: z.enum(["stipend", "volunteer"]),
  payMin: z.number().min(0),
  payMax: z.number().min(0),
  pay: z.number().min(0),
  rubric: z.array(RubricCriterion).min(3).max(5),
  doneLooksLike: z.string(),
  goodFit: z.string(),
  notAFit: z.string(),
  strengthenedBy: z.array(z.string()),
  badgeSkills: z.array(z.string()),
  beginnerFriendly: z.object({ ok: z.boolean(), note: z.string() }),
  sponsorStipend: z.number().min(0).default(0),
});
export type ScopeResult = z.infer<typeof ScopeResult>;

export const PublishInput = z.object({
  businessId: Id,
  title: z.string().trim().min(3),
  hook: z.string().default(""),
  type: ProjectType,
  description: z.string(),
  deliverables: z.array(z.string().trim().min(1)).min(1),
  milestones: z.array(z.object({ title: z.string().trim().min(1), hours: z.number().min(0), dueInDays: z.number().int().min(1) })).min(2).max(4),
  skills: z.array(z.string()).min(1),
  tools: z.array(z.string()).default([]),
  hours: z.number().int().min(1).max(25),
  payType: z.enum(["stipend", "volunteer"]),
  pay: z.number().min(0),
  sponsorStipend: z.number().min(0).default(0),
  rubric: z.array(RubricCriterion).min(3).max(5),
  doneLooksLike: z.string().default(""),
  goodFit: z.string().default(""),
  notAFit: z.string().default(""),
  strengthenedBy: z.array(z.string()).default([]),
  badgeSkills: z.array(z.string()),
  beginnerFriendly: z.boolean(),
  ventureId: Id.optional(),
  reviewerIds: z.array(Id).optional(),
});
export type PublishInput = z.infer<typeof PublishInput>;

export const SubmitInput = z
  .object({
    projectId: Id,
    studentId: Id,
    url: z.string().trim().optional(),
    fileNames: z.array(z.string()).default([]),
    final: z.boolean().default(false),
  })
  .refine((v) => (v.url && v.url.length > 0) || v.fileNames.length > 0, { message: "Add a link or at least one file." });
export type SubmitInput = z.infer<typeof SubmitInput>;

export const Role = z.enum(["student", "business", "reviewer"]);
export type Role = z.infer<typeof Role>;
export const Session = z.object({ role: Role, userId: Id });
export type Session = z.infer<typeof Session>;
