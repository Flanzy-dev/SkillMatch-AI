import type { MatchResult } from "../schemas/match";
import type { Profile } from "../schemas/profile";
import { ApiError, type Api, type ApiOptions } from "./client";

export const httpApi: Api = {
  async extractCv(file: File, opts: ApiOptions = {}): Promise<Profile> {
    if (opts.fail === "extract") {
      throw new ApiError("extract_failed");
    }

    if (opts.signal?.aborted) {
      throw new ApiError("aborted");
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/cv/extract", {
        method: "POST",
        body: formData,
        signal: opts.signal,
      });

      if (!res.ok) {
        throw new ApiError("extract_failed");
      }

      const data = await res.json();
      return data as Profile;
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      if (err instanceof Error && (err.name === "AbortError" || opts.signal?.aborted)) {
        throw new ApiError("aborted");
      }
      throw new ApiError("extract_failed");
    }
  },

  async matchJobs(profile: Profile, opts: ApiOptions = {}): Promise<MatchResult[]> {
    if (opts.fail === "match") {
      throw new ApiError("match_failed");
    }

    if (opts.signal?.aborted) {
      throw new ApiError("aborted");
    }

    try {
      const res = await fetch("/api/jobs/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
        signal: opts.signal,
      });

      if (!res.ok) {
        throw new ApiError("match_failed");
      }

      const data = await res.json();
      return data as MatchResult[];
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      if (err instanceof Error && (err.name === "AbortError" || opts.signal?.aborted)) {
        throw new ApiError("aborted");
      }
      throw new ApiError("match_failed");
    }
  },

  async submitFeedback(jobId: string, helpful: boolean): Promise<void> {
    try {
      await fetch("/api/jobs/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId, helpful }),
      });
    } catch (err) {
      console.error("[Feedback Submit Error]:", err);
    }
  },

  async getSkillsCatalog(): Promise<{ canonical: string[]; popular: string[] }> {
    try {
      const res = await fetch("/api/skills");
      if (!res.ok) throw new Error("Failed to fetch skills catalog");
      const data = await res.json();
      return {
        canonical: Array.isArray(data.canonical) ? data.canonical : [],
        popular: Array.isArray(data.popular) ? data.popular : [],
      };
    } catch (err) {
      console.warn("[Skills Catalog Fetch Warn]:", err);
      return { canonical: [], popular: [] };
    }
  },
};
