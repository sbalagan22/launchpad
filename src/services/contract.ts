/**
 * Service contract shared with the UI. Names and signatures are frozen: add, never rename.
 * Every function is async, goes through simulated latency, and returns Zod-validated data.
 * No React in here: plain async functions (and AsyncIterables for streamed results).
 */
import type { CatalogEntry, CertClaim, CertStatus, CheckResult, Evaluation, Faculty, EmployerType, Notification, PipelineStage, Project, ProjectType, PublishInput, Review, ScopeResult, Student, Business, Reviewer, Sector, Session, Venture, Application } from "@/schemas";
import type {
  ApplicationView, CertDetail, ClaimView, EvidenceView, FinalApproval, ImpactView, InviteView, Match, MilestoneDecision, PaletteResult, Pathway, PipelineView, ProfileView,
  ProjectCard, ProjectDetail, QueueItem, SubmissionDetail, VenturePage, WorkspaceView,
} from "@/schemas/views";
import type { YieldResult } from "@/lib/skill-yield";

export type DemoRole = "student" | "poster" | "reviewer" | "founder";

export type CurrentUser = { session: Session; student: Student | null; business: Business | null; reviewer: Reviewer | null; displayName: string; initials: string };

export type YorkEmailCheck = { valid: boolean; reason?: string };
export type SignUpStudentInput = { name: string; email: string; program: string; faculty: Faculty; year: number; campus: "Keele" | "Glendon"; skills: string[]; hoursPerWeek: number; pref: "paid" | "volunteer" | "both" };

export interface AuthApi {
  loginDemo(role: DemoRole): Promise<CurrentUser>;
  validateYorkEmail(email: string): Promise<YorkEmailCheck>;
  signUpStudent(input: SignUpStudentInput): Promise<CurrentUser>;
  currentUser(): Promise<CurrentUser>;
  logout(): Promise<void>;
  /** Dev menu: switch to any seeded user. */
  switchTo(role: Session["role"], userId: string): Promise<CurrentUser>;
  listDemoUsers(): Promise<{ students: { id: string; name: string; sub: string }[]; businesses: { id: string; name: string; sub: string }[]; reviewers: { id: string; name: string; sub: string }[] }>;
}

export type ProjectFilters = {
  faculty?: Faculty[];
  employerType?: EmployerType[];
  payType?: ("stipend" | "volunteer")[];
  minHours?: number;
  maxHours?: number;
  /** ISO date: only projects due on or before this day */
  deadlineBefore?: string;
  skills?: string[];
  type?: ProjectType[];
  q?: string;
  ventureId?: string;
  status?: Project["status"][];
  /** "match" (default), "newest", "deadline", "yield" */
  sort?: "match" | "newest" | "deadline" | "yield";
};
export type ProjectDraft = PublishInput;
export type ProjectList = { items: ProjectCard[]; total: number };

export interface ProjectsApi {
  list(filters?: ProjectFilters): Promise<ProjectList>;
  get(id: string): Promise<ProjectDetail>;
  /** Creates a draft (not visible in the feed). */
  create(draft: ProjectDraft): Promise<Project>;
  /** Publishes a draft. Rejects with a ServiceError("low_yield") and tips when skill yield is under 60. */
  publish(id: string): Promise<Project>;
  /** Posts that belong to the current business account (all statuses). */
  listMine(): Promise<ProjectCard[]>;
  save(id: string): Promise<void>;
  unsave(id: string): Promise<void>;
  listSaved(): Promise<ProjectCard[]>;
}

export type BriefSection =
  | { section: "thinking"; source: "real" | "mock" }
  | { section: "title"; value: string }
  | { section: "hook"; value: string }
  | { section: "deliverables"; value: string[] }
  | { section: "milestones"; value: { title: string; hours: number; dueInDays: number }[] }
  | { section: "skills"; value: { skills: string[]; tools: string[]; strengthenedBy: string[] } }
  | { section: "hours_pay"; value: { hours: number; payType: "stipend" | "volunteer"; pay: number; payMin: number; payMax: number; sponsorStipend: number } }
  | { section: "rubric"; value: ScopeResult["rubric"] }
  | { section: "fit"; value: { doneLooksLike: string; goodFit: string; notAFit: string; beginnerFriendly: ScopeResult["beginnerFriendly"] } }
  | { section: "yield"; value: YieldResult }
  | { section: "complete"; value: ScopeResult; source: "real" | "mock" };

export type Tip = { id: string; text: string; factor: "learning" | "deliverable" | "reviewer" | "portfolio" | "scope" | "general" };

export interface ScopingApi {
  /** Poster side only. Turns a messy ask into a structured brief. Never produces student work. */
  scopeBrief(rawText: string): AsyncIterable<BriefSection>;
  improveYield(project: ProjectDraft | Project): Promise<{ result: YieldResult; tips: Tip[] }>;
  /** Pure helper for live recomputation while a poster edits a brief. */
  scoreDraft(project: ProjectDraft | Project): Promise<YieldResult>;
}

export interface ApplicationsApi {
  apply(projectId: string, payload: { proposal: string }): Promise<Application>;
  listForStudent(): Promise<ApplicationView[]>;
  listForProject(projectId: string): Promise<ApplicationView[]>;
  decide(applicationId: string, decision: "accepted" | "rejected"): Promise<Application>;
  /** Draft helper for the proposal textarea: templated from the real profile. Poster-neutral, never a deliverable. */
  draftProposal(projectId: string): Promise<{ text: string; source: "real" | "mock" }>;
}

export interface WorkspaceApi {
  getWorkspace(projectId: string): Promise<WorkspaceView>;
  /** Submits links (and optional file names) for the milestone. Runs the Basic check on the first link. */
  submitMilestone(milestoneId: string, links: string[], opts?: { fileNames?: string[]; final?: boolean }): Promise<{ submission: WorkspaceView["submissions"][number]["submission"]; check: CheckResult | null }>;
  /** Reachability only. Labelled "Basic check" in the UI. Not a score of quality. */
  basicCheck(url: string): Promise<CheckResult>;
  sendMessage(projectId: string, text: string): Promise<void>;
  listThreads(): Promise<import("@/schemas/views").ThreadView[]>;
  /** Poster leaves a rating and comment on a completed project. */
  rateStudent(projectId: string, rating: number, text: string): Promise<Review>;
}

export interface ReviewApi {
  queue(): Promise<QueueItem[]>;
  getSubmission(id: string): Promise<SubmissionDetail>;
  /** Saves per-criterion scores (1 to 4) and written feedback. Required before deciding. */
  scoreRubric(submissionId: string, scores: { criterion: string; score: number }[], feedback: string): Promise<Evaluation>;
  decideMilestone(submissionId: string, decision: "approve" | "changes"): Promise<MilestoneDecision>;
  /** After every milestone is approved: completes the project and unlocks verified evidence and badges. */
  finalApprove(projectId: string): Promise<FinalApproval>;
}

export type CertFilters = { category?: CatalogEntry["category"]; q?: string; maxCostUsd?: number };
export type VerifyStepId = "format" | "issuer_supported" | "contact_issuer" | "match" | "dates";
export type VerifyEvent =
  | { kind: "step"; id: VerifyStepId; label: string; status: "running" | "ok" | "failed"; detail?: string }
  | { kind: "done"; tier: "issuer"; claim: CertClaim }
  | { kind: "failed"; code: "bad_format" | "unsupported_issuer" | "not_found" | "name_mismatch" | "expired" | "unconfirmed_method" | "unreachable"; reason: string };

export interface CertsApi {
  catalog(filters?: CertFilters): Promise<CatalogEntry[]>;
  getCert(id: string): Promise<CertDetail>;
  myCerts(): Promise<ClaimView[]>;
  addSelfReported(certId: string, opts?: { customName?: string; status?: CertStatus; fileName?: string }): Promise<CertClaim>;
  /** Streams the five verification steps, then a final done or failed event. A file upload is never verification. */
  verifyWithIssuer(certId: string, input: string): AsyncIterable<VerifyEvent>;
  setRoadmapStatus(certId: string, status: CertStatus): Promise<CertClaim>;
  pathways(): Promise<Pathway[]>;
}

export type VentureFilters = { sector?: Sector[]; stage?: Venture["stage"][]; stack?: string[]; q?: string };
export interface StartupsApi {
  listVentures(filters?: VentureFilters): Promise<(Venture & { business: Business; openProjectCount: number })[]>;
  getVenture(id: string): Promise<VenturePage>;
  ventureProjects(id: string): Promise<ProjectCard[]>;
}

export interface PipelineApi {
  /** Pipeline for a venture (or any poster business id). */
  getPipeline(ventureOrBusinessId: string): Promise<PipelineView>;
  moveCandidate(entryId: string, stage: PipelineStage): Promise<PipelineView["cards"][number]>;
  /** Only after the student's project for this application has been finally approved. */
  inviteToContinue(applicationId: string, message?: string): Promise<InviteView>;
  myInvites(): Promise<InviteView[]>;
}

export interface ProfileApi {
  getProfile(studentId: string): Promise<ProfileView>;
  publicProfile(slug: string): Promise<ProfileView>;
  myEvidence(): Promise<EvidenceView>;
  updateProfile(patch: Partial<Pick<Student, "bio" | "program" | "faculty" | "year" | "campus" | "hoursPerWeek" | "pref" | "portfolioUrl">> & { addSkill?: { name: string; level: "Beginner" | "Intermediate" | "Advanced" }; removeSkill?: string }): Promise<Student>;
}

export interface ImpactApi {
  getImpact(): Promise<ImpactView>;
}

export interface MatchingApi {
  matchFor(studentId: string, projectId: string): Promise<Match>;
}

export interface SearchApi {
  palette(query: string): Promise<PaletteResult>;
}

export interface NotificationsApi {
  list(): Promise<Notification[]>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

export interface AdminApi {
  resetDemoData(): Promise<void>;
}

export type { Match, ProjectCard, ProjectDetail };
