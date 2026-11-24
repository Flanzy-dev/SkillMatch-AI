import { jobs, sampleProfiles } from "../mock-data/jobs";
import { rankJobs } from "../scoring";
import { ApiError, type Api, type ApiOptions } from "./client";

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new ApiError("aborted"));
    const id = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        reject(new ApiError("aborted"));
      },
      { once: true },
    );
  });
}

/**
 * True while extractCv returns a built-in sample instead of reading the file. The UI says so
 * on Upload and Review, so a sample profile is never presented as "read from your CV".
 */
export const DEMO_EXTRACTION = true;

export const mockApi: Api = {
  async extractCv(file: File, opts: ApiOptions = {}) {
    await wait(1800, opts.signal);
    if (opts.fail === "extract") throw new ApiError("extract_failed");
    // Deterministic pick so the same file always yields the same sample.
    const index = (file.size + file.name.length) % sampleProfiles.length;
    const p = sampleProfiles[index];
    return { ...p, skills: [...p.skills] };
  },

  async matchJobs(profile, opts: ApiOptions = {}) {
    await wait(1200, opts.signal);
    if (opts.fail === "match") throw new ApiError("match_failed");
    return rankJobs(profile, jobs);
  },

  async submitFeedback() {
    await wait(300);
  },
};

export const api: Api = mockApi;
