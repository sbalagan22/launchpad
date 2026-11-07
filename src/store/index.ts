"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Db, Session } from "@/schemas";
import { buildSeed } from "@/mocks/seed";

export const DEMO_STUDENT_ID = "stu_aisha";
export const DEMO_BUSINESS_ID = "biz_sunrise";
const STORAGE_KEY = "launchpad-demo-v1";

type AppState = {
  db: Db;
  session: Session;
  signedIn: boolean;
  /** bumps on every write so subscribed queries can refetch */
  rev: number;
  hydrated: boolean;
  commit: (updater: (db: Db) => Db) => void;
  setSession: (s: Session, signedIn?: boolean) => void;
  signOut: () => void;
  reset: () => void;
  markHydrated: () => void;
};

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      db: buildSeed(),
      session: { role: "student", userId: DEMO_STUDENT_ID },
      signedIn: false,
      rev: 0,
      hydrated: false,
      commit: (updater) => set((s) => ({ db: updater(s.db), rev: s.rev + 1 })),
      setSession: (session, signedIn) => set((s) => ({ session, signedIn: signedIn ?? s.signedIn, rev: s.rev + 1 })),
      signOut: () => set({ signedIn: false, session: { role: "student", userId: DEMO_STUDENT_ID } }),
      // MOCK: restores the seed with freshly computed relative dates.
      reset: () => set((s) => ({ db: buildSeed(), session: { role: "student", userId: DEMO_STUDENT_ID }, signedIn: false, rev: s.rev + 1 })),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ db: s.db, session: s.session, signedIn: s.signedIn }),
      // Ignore anything in localStorage that no longer matches the schema.
      merge: (persisted, current) => {
        const p = persisted as Partial<Pick<AppState, "db" | "session" | "signedIn">> | undefined;
        const db = Db.safeParse(p?.db);
        const session = Session.safeParse(p?.session);
        if (!db.success || !session.success) return current;
        return { ...current, db: db.data, session: session.data, signedIn: Boolean(p?.signedIn) };
      },
    },
  ),
);

export function getDb(): Db {
  return useApp.getState().db;
}
