import type { ImpactApi } from "./contract";
import { stubApi } from "./core";

// STUB: replaced by the real implementation shortly. Rejects with ServiceError("not_implemented").
export const impact: ImpactApi = stubApi<ImpactApi>("impact");
