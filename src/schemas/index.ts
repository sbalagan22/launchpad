import { z } from "zod";

/** One schema per entity, shared by mocks, services, store and UI. */

export const Id = z.string().min(1);
export const IsoDate = z.string().min(10);

export const Trust = z.enum(["issuer", "checked", "self"]);
export type Trust = z.infer<typeof Trust>;
export const TRUST_LABEL: Record<Trust, string> = {
  issuer: "Issuer verified",
  checked: "Skill checked",
  self: "Self-reported",
};

export const Level = z.enum(["Beginner", "Intermediate", "Advanced"]);
export type Level = z.infer<typeof Level>;

export const ProjectType = z.enum(["web", "design", "data", "marketing", "writing", "admin"]);
export type ProjectType = z.infer<typeof ProjectType>;
export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  web: "Web development",
  design: "Design and branding",
  data: "Data and analytics",
  marketing: "Marketing and social",
  writing: "Writing and content",
  admin: "Business and admin",
};

export const ProjectStatus = z.enum(["open", "in_progress", "in_review", "completed"]);
export type ProjectStatus = z.infer<typeof ProjectStatus>;
export const MilestoneStatus = z.enum(["open", "in_progress", "in_review", "approved"]);
export type MilestoneStatus = z.infer<typeof MilestoneStatus>;

export const Evidence = z.object({
  label: z.string(),
  href: z.string().optional(),
  projectId: Id.optional(),
});
export type Evidence = z.infer<typeof Evidence>;

export const SkillEntry = z.object({
  name: z.string(),
  level: Level,
  trust: Trust,
  evidence: z.array(Evidence).default([]),
});
export type SkillEntry = z.infer<typeof SkillEntry>;

export const AvailabilityPref = z.enum(["paid", "volunteer", "both"]);
export type AvailabilityPref = z.infer<typeof AvailabilityPref>;

export const School = z.enum(["York University", "University of Toronto", "Toronto Metropolitan University", "Sheridan College", "Humber College", "Seneca College"]);

export const Student = z.object({
  id: Id,
  slug: z.string(),
  name: z.string(),
  school: School,
  year: z.number().int().min(1).max(5),
  field: z.string(),
  city: z.string(),
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
  kind: z.enum(["business", "nonprofit"]),
  category: z.string(),
  city: z.enum(["Brampton", "Mississauga", "Toronto"]),
  description: z.string(),
  rating: z.number().min(1).max(5),
  founded: z.number().int(),
  size: z.string(),
  createdAt: IsoDate,
});
export type Business = z.infer<typeof Business>;

export const Milestone = z.object({
  id: Id,
  title: z.string().min(1),
  dueAt: IsoDate,
  amount: z.number().min(0),
  status: MilestoneStatus,
  approvedAt: IsoDate.optional(),
});
export type Milestone = z.infer<typeof Milestone>;

export const Project = z.object({
  id: Id,
  businessId: Id,
  title: z.string().min(1),
  type: ProjectType,
  status: ProjectStatus,
  description: z.string(),
  deliverables: z.array(z.string()).min(1),
  milestones: z.array(Milestone).min(2).max(4),
  skills: z.array(z.string()).min(1),
  hours: z.number().int().min(1).max(25),
  payType: z.enum(["stipend", "volunteer"]),
  pay: z.number().min(0),
  deadline: IsoDate,
  createdAt: IsoDate,
  studentId: Id.nullable(),
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

export const Message = z.object({
  id: Id,
  from: z.enum(["student", "business"]),
  text: z.string().min(1),
  at: IsoDate,
});
export type Message = z.infer<typeof Message>;

export const Thread = z.object({
  id: Id,
  projectId: Id,
  studentId: Id,
  businessId: Id,
  messages: z.array(Message).min(1),
});
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

export const Notification = z.object({
  id: Id,
  userId: Id,
  title: z.string(),
  body: z.string(),
  href: z.string(),
  read: z.boolean(),
  createdAt: IsoDate,
});
export type Notification = z.infer<typeof Notification>;

export const Certification = z.object({
  id: Id,
  name: z.string(),
  provider: z.string(),
  issuedVia: z.string().optional(),
  field: z.string(),
  url: z.string().url(),
  hours: z.number(),
  length: z.string(),
  unlocks: z.array(ProjectType),
  skills: z.array(z.string()),
});
export type Certification = z.infer<typeof Certification>;

export const CertClaim = z
  .object({
    id: Id,
    studentId: Id,
    certId: Id,
    tier: Trust,
    verified: z.boolean(),
    credentialId: z.string().optional(),
    fileName: z.string().optional(),
    issuedAt: IsoDate,
  })
  // A self-reported claim, with or without an uploaded file, is never verified.
  .refine((c) => (c.tier === "self" ? !c.verified : c.verified), { message: "verified must match trust tier" });
export type CertClaim = z.infer<typeof CertClaim>;

export const CheckResult = z.object({
  id: Id,
  url: z.string(),
  reachable: z.boolean(),
  httpStatus: z.number().int(),
  loadSeconds: z.number().nullable(),
  mobile: z.number().int().min(0).max(100),
  accessibility: z.number().int().min(0).max(100),
  seo: z.number().int().min(0).max(100),
  status: z.enum(["pass", "warn", "fail"]),
  issues: z.array(z.string()),
  summary: z.string(),
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

export const Db = z.object({
  students: z.array(Student),
  businesses: z.array(Business),
  projects: z.array(Project),
  applications: z.array(Application),
  threads: z.array(Thread),
  reviews: z.array(Review),
  notifications: z.array(Notification),
  certifications: z.array(Certification),
  certClaims: z.array(CertClaim),
  submissions: z.array(Submission),
  checks: z.array(CheckResult),
  badges: z.array(Badge),
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
  type: ProjectType,
  summary: z.string(),
  deliverables: z.array(z.string()).min(2).max(6),
  milestones: z
    .array(z.object({ title: z.string(), dueInDays: z.number().int().min(3), amount: z.number().min(0) }))
    .min(2)
    .max(4),
  skills: z.array(z.string()).min(1).max(8),
  hours: z.number().int().min(1).max(25),
  payType: z.enum(["stipend", "volunteer"]),
  payMin: z.number().min(0),
  payMax: z.number().min(0),
  pay: z.number().min(0),
  beginnerFriendly: z.object({ ok: z.boolean(), note: z.string() }),
  badgeSkills: z.array(z.string()),
});
export type ScopeResult = z.infer<typeof ScopeResult>;

export const PublishInput = z.object({
  businessId: Id,
  title: z.string().trim().min(3),
  type: ProjectType,
  description: z.string(),
  deliverables: z.array(z.string().trim().min(1)).min(1),
  milestones: z.array(z.object({ title: z.string().trim().min(1), dueInDays: z.number().int().min(1), amount: z.number().min(0) })).min(2).max(4),
  skills: z.array(z.string()).min(1),
  hours: z.number().int().min(1).max(25),
  payType: z.enum(["stipend", "volunteer"]),
  pay: z.number().min(0),
  badgeSkills: z.array(z.string()),
  beginnerFriendly: z.boolean(),
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

export const Session = z.object({
  role: z.enum(["student", "business"]),
  userId: Id,
});
export type Session = z.infer<typeof Session>;

export type MatchResult = {
  percent: number;
  matching: string[];
  missing: string[];
  availability: "good" | "tight" | "mismatch";
};
