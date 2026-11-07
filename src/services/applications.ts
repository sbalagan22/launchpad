import type { ApplicationsApi } from "./contract";
import { stubApi } from "./core";

// STUB: replaced by the real implementation shortly. Rejects with ServiceError("not_implemented").
export const applications: ApplicationsApi = stubApi<ApplicationsApi>("applications");
