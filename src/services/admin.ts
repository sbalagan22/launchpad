import { useApp } from "@/store";
import type { AdminApi } from "./contract";
import { latency } from "./core";

// MOCK: restores the seed dataset with freshly computed relative dates.
export const admin: AdminApi = {
  async resetDemoData() {
    await latency(300, 500);
    useApp.getState().reset();
  },
};
