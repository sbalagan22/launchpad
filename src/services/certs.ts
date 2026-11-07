import type { CertsApi } from "./contract";
import { stubApi } from "./core";

// STUB: replaced by the real implementation shortly. Rejects with ServiceError("not_implemented").
export const certs: CertsApi = stubApi<CertsApi>("certs");
