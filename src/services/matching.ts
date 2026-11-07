import type { MatchingApi } from "./contract";
import { stubApi } from "./core";

// STUB: replaced by the real implementation shortly. Rejects with ServiceError("not_implemented").
export const matching: MatchingApi = stubApi<MatchingApi>("matching");
