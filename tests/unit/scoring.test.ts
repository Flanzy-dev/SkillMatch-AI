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

describe("text similarity", () => {
  it("scores Indonesian profile text against the Indonesian summary", () => {
    const job = jobs.find((j) => j.id === "job-02")!;
    const id = scoreJob(
      { ...emptyProfile, skills: ["SQL"], experience: "Membersihkan data, menulis query SQL, dan membuat dasbor." },
      job,
    );
    expect(id.breakdown.textPoints).toBeGreaterThan(20);
  });
});

describe("generateTextComparison", () => {
  const seniorJob = {
    id: "job-senior",
    title: "Senior Backend Engineer",
    company: "Scale Corp",
    summary: {
      id: "Membutuhkan minimal 5 tahun pengalaman membangun layanan REST API terdistribusi.",
      en: "Requires at least 5 years of experience building distributed REST API services.",
    },
    skills: ["Python", "FastAPI", "PostgreSQL", "Docker", "REST API"],
  };

  it("compares candidate experience years against job requirement (e.g. 3 years vs 5 years)", () => {
    const candidate3Years = {
      ...emptyProfile,
      skills: ["Python"],
      experience: "Pengalaman 3 tahun sebagai Software Engineer backend.",
      projects: "",
    };
    const r = scoreJob(candidate3Years, seniorJob);
    expect(r.breakdown.textComparison).toBeDefined();
    expect(r.breakdown.textComparison?.experience.id).toContain("5 tahun");
    expect(r.breakdown.textComparison?.experience.id).toContain("3 tahun");
    expect(r.breakdown.textComparison?.projects.id).toContain("setidaknya dalam 1 proyek");
  });

  it("identifies matching project domains when present", () => {
    const candidateWithProject = {
      ...emptyProfile,
      skills: ["Python"],
      experience: "Pengalaman 5 tahun sebagai Backend Engineer.",
      projects: "Membangun sistem backend dan layanan REST API untuk e-commerce.",
    };
    const r = scoreJob(candidateWithProject, seniorJob);
    expect(r.breakdown.textComparison?.experience.id).toContain("memenuhi syarat");
    expect(r.breakdown.textComparison?.projects.id).toContain("relevan");
  });
});

describe("rankJobs", () => {
  it("lists every job with at least one matching skill, even with a low score", () => {
    const ranked = rankJobs({ ...emptyProfile, skills: ["JS", "Postgres"] }, jobs);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked.every((r) => r.matchedSkills.length >= 1)).toBe(true);
    const matched = ranked.flatMap((r) => r.matchedSkills);
    expect(matched).toContain("JavaScript");
    expect(matched).toContain("PostgreSQL");
  });

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
