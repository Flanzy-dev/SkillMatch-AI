import { describe, expect, it } from "vitest";
import { jobs } from "@/lib/mock-data/jobs";
import { rankJobs, reasonFor, scoreJob, TOP_N } from "@/lib/scoring";
import { emptyProfile, profileSchema } from "@/lib/schemas/profile";

const backend = {
  ...emptyProfile,
  name: "Rina",
  experience: "Backend developer building REST API and database services with Python",
  skills: ["python", " SQL ", "REST API", "Git"],
};

describe("scoreJob", () => {
  it("normalizes skill case and whitespace when matching", () => {
    const r = scoreJob(backend, jobs.find((j) => j.id === "job-01")!);
    expect(r.matchedSkills).toEqual(["Python", "SQL", "REST API"]);
    expect(r.missingSkills).toEqual(["FastAPI", "PostgreSQL"]);
  });

  it("keeps the score within 0..100", () => {
    for (const j of jobs) {
      const { score } = scoreJob(backend, j);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it("scores a profile with no skills at 0 skill overlap", () => {
    const r = scoreJob({ ...emptyProfile, name: "x" }, jobs[0]);
    expect(r.matchedSkills).toEqual([]);
    expect(r.score).toBe(0);
  });
});

describe("skill aliases", () => {
  it("counts common spellings as the canonical skill", () => {
    const r = scoreJob(
      { ...emptyProfile, skills: ["JS", "ts", "ReactJS", "css", "html"] },
      jobs.find((j) => j.id === "job-03")!,
    );
    expect(r.missingSkills).toEqual([]);
    const pg = scoreJob({ ...emptyProfile, skills: ["Postgres"] }, jobs.find((j) => j.id === "job-01")!);
    expect(pg.matchedSkills).toEqual(["PostgreSQL"]);
  });
});

describe("score breakdown", () => {
  it("adds up to the score, within the 60 and 40 caps", () => {
    for (const j of jobs) {
      const { score, breakdown } = scoreJob(backend, j);
      expect(breakdown.skillPoints + breakdown.textPoints).toBe(score);
      expect(breakdown.skillPoints).toBeLessThanOrEqual(60);
      expect(breakdown.textPoints).toBeLessThanOrEqual(40);
    }
  });

  it("reports empty text when experience, projects and education are blank", () => {
    const r = scoreJob({ ...emptyProfile, skills: ["Python"] }, jobs[0]);
    expect(r.breakdown.textLevel).toBe("empty");
    expect(r.breakdown.textPoints).toBe(0);
  });
});

describe("rankJobs", () => {
  it("returns at most TOP_N results sorted by descending score", () => {
    const ranked = rankJobs(backend, jobs);
    expect(ranked.length).toBeLessThanOrEqual(TOP_N);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
    }
  });

  it("ranks the backend job first for a backend profile", () => {
    expect(rankJobs(backend, jobs)[0].jobId).toBe("job-01");
  });
});

describe("reasonFor", () => {
  it("maps score bands", () => {
    expect(reasonFor(82)).toBe("strong");
    expect(reasonFor(55)).toBe("partial");
    expect(reasonFor(10)).toBe("weak");
  });
});

describe("profileSchema", () => {
  it("accepts an empty name, since the name is never used for matching", () => {
    expect(profileSchema.safeParse({ ...emptyProfile }).success).toBe(true);
  });
  it("accepts a valid profile", () => {
    expect(profileSchema.safeParse(backend).success).toBe(true);
  });
});
