import type { MatchResult } from "../schemas/match";
import type { Profile } from "../schemas/profile";

export type ApiErrorCode = "extract_failed" | "match_failed" | "aborted";

export class ApiError extends Error {
  constructor(public code: ApiErrorCode) {
    super(code);
    this.name = "ApiError";
  }
}

export interface ApiOptions {
  signal?: AbortSignal;
  /** Test hook: force a failure path. */
  fail?: "extract" | "match";
}

export interface SkillsCatalog {
  canonical: string[];
  popular: string[];
}

/** Contract the UI depends on. Swap mock.ts for an HTTP client without touching pages. */
export interface Api {
  extractCv(file: File, opts?: ApiOptions): Promise<Profile>;
  matchJobs(profile: Profile, opts?: ApiOptions): Promise<MatchResult[]>;
  submitFeedback(jobId: string, helpful: boolean): Promise<void>;
  getSkillsCatalog(): Promise<SkillsCatalog>;
}
