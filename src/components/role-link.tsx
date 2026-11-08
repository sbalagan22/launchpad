"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { auth, type DemoRole } from "@/services";

/** Switches the demo role, then navigates. Replaces the old student/business switch. */
export function RoleButton({ role, href, children, variant = "primary" }: { role: DemoRole | "business"; href: string; children: ReactNode; variant?: "primary" | "secondary" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant={variant}
      loading={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await auth.loginDemo(role === "business" ? "poster" : role);
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
