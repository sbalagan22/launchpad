"use client";

import { useEffect, type ReactNode } from "react";
import { useApp } from "@/store";
import { Toaster } from "@/components/ui";
import { Shell } from "@/components/nav";
import { DevMenu } from "@/components/dev-menu";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Restore the persisted demo state after first paint to avoid hydration mismatches.
    Promise.resolve(useApp.persist.rehydrate()).finally(() => useApp.getState().markHydrated());
  }, []);
  return (
    <>
      <Shell>{children}</Shell>
      <DevMenu />
      <Toaster />
    </>
  );
}
