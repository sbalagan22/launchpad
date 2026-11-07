"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/store";

type State<T> = { key: string | null; data?: T; error?: Error };

/**
 * Runs an async service call, keeps the previous data while refetching, and refetches
 * whenever the store is written to. Pass key=null to skip (e.g. until an id is known).
 */
export function useQuery<T>(key: string | null, fn: () => Promise<T>) {
  const rev = useApp((s) => s.rev);
  const hydrated = useApp((s) => s.hydrated);
  const fnRef = useRef(fn);
  const [state, setState] = useState<State<T>>({ key: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    if (!hydrated || key === null) return;
    let live = true;
    fnRef.current().then(
      (data) => live && setState({ key, data }),
      (error: unknown) => live && setState((s) => ({ key, data: s.key === key ? s.data : undefined, error: error instanceof Error ? error : new Error(String(error)) })),
    );
    return () => {
      live = false;
    };
  }, [key, rev, hydrated, nonce]);

  const current = state.key === key;
  const refetch = useCallback(() => {
    setState({ key: null });
    setNonce((n) => n + 1);
  }, []);
  return {
    data: current ? state.data : undefined,
    error: current ? state.error : undefined,
    loading: key !== null && (!current || (state.data === undefined && !state.error)),
    refetch,
  };
}

export function useSession() {
  const session = useApp((s) => s.session);
  const hydrated = useApp((s) => s.hydrated);
  const signedIn = useApp((s) => s.signedIn);
  return { ...session, hydrated, signedIn };
}
