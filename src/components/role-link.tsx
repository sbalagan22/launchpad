"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { auth, type DemoRole } from "@/services";

/** Signs in as a demo account, then navigates. Used by marketing CTAs. */
export function RoleButton({ role, href, children, variant = "primary" }: { role: DemoRole; href: string; children: ReactNode; variant?: "primary" | "secondary" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant={variant}
      loading={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await auth.loginDemo(role);
          router.push(href);
        } finally {
          setBusy(false);
        }
      }}
    >
      {children}
    </Button>
  );
}
