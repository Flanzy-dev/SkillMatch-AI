import type { Job, MatchResult, ReasonCode, TextLevel } from "./schemas/match";
import type { Profile } from "./schemas/profile";

/**
 * PLACEHOLDER scoring. Real weighting is an open PRD question (13.3).
 * score = 100 * (0.6 * skillOverlap + 0.4 * textSimilarity)
 */
export const WEIGHTS = { skill: 0.6, text: 0.4 } as const;
export const MATCH_THRESHOLD = 20;
export const TOP_N = 10;

/**
 * Common spellings mapped to the canonical (ESCO-style) label used in the listings, so
 * "JS" and "JavaScript" count as the same skill. Keys and values are lowercase.
 */
const ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  postgres: "postgresql",
  psql: "postgresql",
  reactjs: "react",
  "react.js": "react",
  node: "node.js",
  nodejs: "node.js",
  ml: "machine learning",
  sklearn: "scikit-learn",
  "scikit learn": "scikit-learn",
  "ci-cd": "ci/cd",
  cicd: "ci/cd",
  rest: "rest api",
  "restful api": "rest api",
  springboot: "spring boot",
  "ms excel": "excel",
  "microsoft excel": "excel",
  powerbi: "power bi",
  "data viz": "data visualization",
};

export const normalizeSkill = (s: string) => {
  const key = s.trim().toLowerCase().replace(/\s+/g, " ");
  return ALIASES[key] ?? key;
};

const tokens = (text: string) =>
  new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9+#.]+/)
      .filter((t) => t.length > 2),
  );

function textSimilarity(profile: Profile, job: Job): number {
  const source = tokens(`${profile.experience} ${profile.projects} ${profile.education}`);
  const target = tokens(`${job.title} ${job.summary.en}`);
  if (target.size === 0) return 0;
  let hit = 0;
  for (const t of target) if (source.has(t)) hit++;
  return Math.min(1, hit / target.size);
}

export function reasonFor(score: number): ReasonCode {
  if (score >= 70) return "strong";
  if (score >= 40) return "partial";
  return "weak";
}

/** How the experience and projects text compares with the listing; a code, worded in the UI. */
function textLevelFor(points: number, hasText: boolean): TextLevel {
  if (!hasText) return "empty";
  const share = points / (100 * WEIGHTS.text);
  if (share >= 0.5) return "high";
  if (share >= 0.2) return "some";
  return "low";
}

export function scoreJob(profile: Profile, job: Job): MatchResult {
  const have = new Set(profile.skills.map(normalizeSkill));
  const matchedSkills = job.skills.filter((s) => have.has(normalizeSkill(s)));
  const missingSkills = job.skills.filter((s) => !have.has(normalizeSkill(s)));
  const overlap = job.skills.length ? matchedSkills.length / job.skills.length : 0;
  // The two parts are rounded separately so the UI can show them adding up to the score.
  const skillPoints = Math.round(100 * WEIGHTS.skill * overlap);
  const textPoints = Math.round(100 * WEIGHTS.text * textSimilarity(profile, job));
  const score = skillPoints + textPoints;
  const hasText = Boolean(`${profile.experience}${profile.projects}${profile.education}`.trim());
  return {
    breakdown: {
      skillPoints,
      textPoints,
      textLevel: textLevelFor(textPoints, hasText),
    },
    jobId: job.id,
    title: job.title,
    company: job.company,
    summary: job.summary,
    score,
    jobSkills: job.skills,
    matchedSkills,
    missingSkills,
    reason: reasonFor(score),
  };
}

export function rankJobs(profile: Profile, jobs: Job[]): MatchResult[] {
  return jobs
    .map((j) => scoreJob(profile, j))
    .filter((r) => r.score >= MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, TOP_N);
}
