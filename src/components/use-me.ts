"use client";

import { auth, type CurrentUser } from "@/services";
import { useQuery, useSession } from "@/hooks/use-query";

/** Which side of the product the signed-in demo user sees. */
export type Kind = "student" | "founder";

export function kindOf(u: CurrentUser | undefined): Kind | null {
  if (!u) return null;
  return u.session.role === "student" ? "student" : "founder";
}

export const HOME: Record<Kind, string> = { student: "/dashboard", founder: "/founder" };

/** The signed-in user (or the default demo student when signed out) with a derived kind. */
export function useMe() {
  const { role, userId, hydrated, signedIn } = useSession();
  const q = useQuery<CurrentUser>(hydrated ? `me:${role}:${userId}` : null, () => auth.currentUser());
  return { ...q, user: q.data, kind: kindOf(q.data), signedIn, hydrated };
}
