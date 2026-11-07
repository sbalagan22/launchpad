import type { ProjectsApi } from "./contract";
import { stubApi } from "./core";

// STUB: replaced by the real implementation shortly. Rejects with ServiceError("not_implemented").
export const projects: ProjectsApi = stubApi<ProjectsApi>("projects");
