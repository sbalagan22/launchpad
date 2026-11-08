/**
 * Service contract shared with the UI. Names and signatures are frozen: add, never rename.
 * Every function is async, goes through simulated latency, and returns Zod-validated data.
 * No React in here: plain async functions (and AsyncIterables for streamed results).
 */
import type { Application, Approval, Business, CatalogEntry, CertClaim, CertStatus, CheckResult, EmployerType, Faculty, Notification, PipelineStage, Project, ProjectType, PublishInput, Review, ScopeResult, Sector, Session, Student, Venture, Difficulty, LocationMode } from "@/schemas";
import type {
  ApplicationView, ApprovalResult, BusinessStats, CertDetail, ClaimView, EvidenceView, ImpactView, InviteView, Match, PendingApproval, Pathway, PipelineView, ProfileView,
  ProjectCard, ProjectDetail, ThreadDetail, ThreadSummary, VenturePage, WorkspaceSummary, WorkspaceView,
} from "@/schemas/views";

/** The three demo accounts. */
export type DemoRole = "aisha" | "priya" | "omar";

export type CurrentUser = { session: Session; student: Student | null; business: Business | null; displayName: string; initials: string };

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
  listDemoUsers(): Promise<{ students: { id: string; name: string; sub: string }[]; businesses: { id: string; name: string; sub: string }[] }>;
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
  difficulty?: Difficulty[];
  locationMode?: LocationMode[];
  /** "match" (default), "newest", "deadline", "pay" */
  sort?: "match" | "newest" | "deadline" | "pay";
};
export type ProjectDraft = PublishInput;
export type ProjectList = { items: ProjectCard[]; total: number };

export interface ProjectsApi {
  list(filters?: ProjectFilters): Promise<ProjectList>;
  get(id: string): Promise<ProjectDetail>;
  /** Creates a draft (not visible in the feed). */
  create(draft: ProjectDraft): Promise<Project>;
  /** Lists missing items (in plain words) before a draft can be published. No scores. */
  checkPublish(draft: ProjectDraft | Project): Promise<{ ok: boolean; missing: string[] }>;
  /** Publishes a draft. Rejects with ServiceError("not_ready", ..., { missing }) when items are missing. */
  publish(id: string): Promise<Project>;
  /** Posts that belong to the current business account (all statuses). */
  listMine(): Promise<ProjectCard[]>;
  businessStats(): Promise<BusinessStats>;
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
  | { section: "acceptance"; value: string[] }
  | { section: "fit"; value: { doneLooksLike: string; goodFit: string; notAFit: string; difficulty: Difficulty; locationMode: LocationMode } }
  | { section: "complete"; value: ScopeResult; source: "real" | "mock" };

export interface ScopingApi {
  /** Poster side only. Turns a messy ask into a structured brief. Never produces student work. */
  scopeBrief(rawText: string): AsyncIterable<BriefSection>;
  /** Plain-language suggestions for improving a brief. No scores. */
  suggestImprovements(project: ProjectDraft | Project): Promise<string[]>;
}

export interface ApplicationsApi {
  apply(projectId: string, payload: { proposal: string }): Promise<Application>;
  listForStudent(): Promise<ApplicationView[]>;
  listForProject(projectId: string): Promise<ApplicationView[]>;
  decide(applicationId: string, decision: "accepted" | "rejected"): Promise<Application>;
}

export interface WorkspaceApi {
  listMine(): Promise<WorkspaceSummary[]>;
  getWorkspace(projectId: string): Promise<WorkspaceView>;
  /** Submits links (and optional file names) for the milestone. Runs the Basic check on the first link. */
  submitMilestone(milestoneId: string, links: string[], opts?: { fileNames?: string[]; note?: string }): Promise<{ submission: WorkspaceView["submissions"][number]["submission"]; check: CheckResult | null }>;
  /** Reachability only. Labelled "Basic check" in the UI. Not a score of quality. */
  basicCheck(url: string): Promise<CheckResult>;
}

export interface ApprovalsApi {
  /** Submissions waiting on the signed-in poster. */
  pending(): Promise<PendingApproval[]>;
  getSubmission(submissionId: string): Promise<PendingApproval>;
  /** Poster approves with a rating per acceptance criterion and a short review. Approving the last milestone completes the project, issues badges and unlocks evidence. */
  approve(submissionId: string, ratings: { criterion: string; rating: number }[], review: string): Promise<ApprovalResult>;
  requestChanges(submissionId: string, ratings: { criterion: string; rating: number }[], review: string): Promise<ApprovalResult>;
}

export interface MessagesApi {
  threads(): Promise<ThreadSummary[]>;
  /** Opening a thread marks it read for the signed-in user. */
  thread(threadId: string): Promise<ThreadDetail>;
  send(threadId: string, text: string, attachments?: string[]): Promise<ThreadDetail>;
  /** Finds or creates a thread with the other party (optionally about a project). */
  start(otherId: string, projectId?: string): Promise<ThreadDetail>;
  unreadCount(): Promise<number>;
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
  respondToInvite(entryId: string, response: "accepted" | "declined"): Promise<InviteView>;
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

export interface NotificationsApi {
  list(): Promise<Notification[]>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

export interface AdminApi {
  resetDemoData(): Promise<void>;
}

export type { Match, ProjectCard, ProjectDetail };
