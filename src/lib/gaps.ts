import type { MatchResult } from "./schemas/match";

export interface GapSummary {
  /** "shared": skills missing from 2+ jobs; "top": the closest job's own gaps. */
  kind: "shared" | "top";
  skills: { skill: string; jobs: number }[];
  /** Title of the closest job, used by the "top" wording. */
  topTitle: string;
}

const MAX_SKILLS = 4;

/** Summarizes what to learn across the ranked results. Returns null when nothing is missing. */
export function summarizeGaps(results: MatchResult[]): GapSummary | null {
  if (results.length === 0) return null;
  const counts = new Map<string, number>();
  for (const r of results) {
    for (const s of r.missingSkills) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  const shared = [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_SKILLS)
    .map(([skill, jobs]) => ({ skill, jobs }));
  const top = results[0];
  if (shared.length) return { kind: "shared", skills: shared, topTitle: top.title };

  const own = top.missingSkills
    .slice(0, MAX_SKILLS)
    .map((skill) => ({ skill, jobs: counts.get(skill) ?? 1 }));
  return own.length ? { kind: "top", skills: own, topTitle: top.title } : null;
}
