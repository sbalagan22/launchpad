"use client";

import { auth, type CurrentUser, type DemoRole } from "@/services";
import { useQuery, useSession } from "@/hooks/use-query";

export function roleOf(u: CurrentUser | undefined): DemoRole | null {
  if (!u) return null;
  if (u.session.role === "student") return "student";
  if (u.session.role === "reviewer") return "reviewer";
  return u.business?.employerType === "yspace_startup" ? "founder" : "poster";
}

export const HOME: Record<DemoRole, string> = { student: "/dashboard", poster: "/business", founder: "/founder", reviewer: "/review" };

/** The signed-in user (or the default demo student when signed out) with a derived demo role. */
export function useMe() {
  const { role, userId, hydrated, signedIn } = useSession();
  const q = useQuery<CurrentUser>(hydrated ? `me:${role}:${userId}` : null, () => auth.currentUser());
  return { ...q, user: q.data, demoRole: roleOf(q.data), signedIn, hydrated };
}
