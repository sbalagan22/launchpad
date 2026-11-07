import type { NotificationsApi } from "./contract";
import { stubApi } from "./core";

// STUB: replaced by the real implementation shortly. Rejects with ServiceError("not_implemented").
export const notifications: NotificationsApi = stubApi<NotificationsApi>("notifications");
