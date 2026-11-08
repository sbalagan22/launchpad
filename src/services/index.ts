// The UI imports from here only. Names follow src/services/contract.ts.
export { auth } from "./auth";
export { projects } from "./projects";
export { scoping } from "./scoping";
export { applications } from "./applications";
export { workspace } from "./workspace";
export { approvals } from "./approvals";
export { messages } from "./messages";
export { certs } from "./certs";
export { startups } from "./startups";
export { pipeline } from "./pipeline";
export { profile } from "./profile";
export { impact } from "./impact";
export { matching } from "./matching";
export { notifications } from "./notifications";
export { admin } from "./admin";
export { ServiceError } from "./core";
export type * from "./contract";
export type { ApplicationView, ThreadDetail, ThreadSummary, PendingApproval, FinalApproval, ApprovalResult, WorkspaceSummary, WorkspaceView, BusinessStats, VenturePage, PipelineCard as PipelineCardView, PipelineView, ClaimView, CertDetail, Pathway, ProfileView } from "@/schemas/views";
