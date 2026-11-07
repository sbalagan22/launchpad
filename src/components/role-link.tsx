"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { misc } from "@/services";
import { Button, cx } from "@/components/ui";

/** Switches the demo mode to the given role, then navigates. Used by marketing CTAs. */
export function RoleButton({ role, href, children, variant }: { role: "student" | "business"; href: string; children: ReactNode; variant?: "primary" | "secondary" }) {
  const router = useRouter();
  return <Button variant={variant} onClick={() => { misc.switchDemoMode(role); router.push(href); }}>{children}</Button>;
}

export function RoleTextLink({ role, href, children, className }: { role: "student" | "business"; href: string; children: ReactNode; className?: string }) {
  const router = useRouter();
  return (
    <a href={href} onClick={(e) => { e.preventDefault(); misc.switchDemoMode(role); router.push(href); }} className={cx(className)}>
      {children}
    </a>
  );
}
