"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { MatchResult } from "@/lib/schemas/match";
import type { Profile } from "@/lib/schemas/profile";

/** Where the profile came from: an extracted CV, the built-in sample, or typed in by hand. */
export type ProfileSource = "cv" | "sample" | "manual";

interface FlowState {
  profile: Profile | null;
  results: MatchResult[] | null;
  source: ProfileSource | null;
}

interface FlowContext extends FlowState {
  ready: boolean;
  setProfile: (p: Profile | null, source?: ProfileSource) => void;
  setResults: (r: MatchResult[] | null) => void;
  reset: () => void;
}

const KEY = "skillmatch.flow.v2";
const EMPTY: FlowState = { profile: null, results: null, source: null };
const Ctx = createContext<FlowContext | null>(null);

function load(): FlowState {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as Partial<FlowState>) };
  } catch {
    /* ignore: private mode or corrupt data */
  }
  return EMPTY;
}

/** Holds the profile and results across steps. Session-scoped, never sent to logs (PRD 12). */
export function FlowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FlowState>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* state stays in memory only */
    }
  }, [state, ready]);

  const setProfile = useCallback(
    (profile: Profile | null, source?: ProfileSource) =>
      setState((s) => ({ ...s, profile, source: source ?? s.source })),
    [],
  );
  const setResults = useCallback(
    (results: MatchResult[] | null) => setState((s) => ({ ...s, results })),
    [],
  );
  const reset = useCallback(() => setState(EMPTY), []);

  const value = useMemo(
    () => ({ ...state, ready, setProfile, setResults, reset }),
    [state, ready, setProfile, setResults, reset],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMatchFlow(): FlowContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMatchFlow must be used inside FlowProvider");
  return ctx;
}
