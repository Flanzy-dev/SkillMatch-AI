import { describe, expect, it } from "vitest";
import { summarizeGaps } from "@/lib/gaps";
import type { MatchResult } from "@/lib/schemas/match";

const r = (jobId: string, title: string, missing: string[]): MatchResult => ({
  breakdown: { skillPoints: 30, textPoints: 20, textLevel: "some" },
  jobId,
  title,
  company: "X",
  summary: { id: "", en: "" },
  score: 50,
  jobSkills: missing,
  matchedSkills: [],
  missingSkills: missing,
  reason: "partial",
});

describe("summarizeGaps", () => {
  it("returns null for no results", () => {
    expect(summarizeGaps([])).toBeNull();
  });

  it("returns null when the closest job misses nothing and nothing repeats", () => {
    expect(summarizeGaps([r("a", "A", [])])).toBeNull();
  });

  it("prefers skills missing from two or more jobs, most frequent first", () => {
    const s = summarizeGaps([
      r("a", "A", ["Docker", "Go"]),
      r("b", "B", ["Docker", "Rust"]),
      r("c", "C", ["Docker", "Go"]),
    ])!;
    expect(s.kind).toBe("shared");
    expect(s.skills).toEqual([
      { skill: "Docker", jobs: 3 },
      { skill: "Go", jobs: 2 },
    ]);
  });

  it("falls back to the closest job's own gaps when nothing repeats", () => {
    const s = summarizeGaps([r("a", "Alpha", ["X", "Y"]), r("b", "B", ["Z"])])!;
    expect(s.kind).toBe("top");
    expect(s.topTitle).toBe("Alpha");
    expect(s.skills.map((x) => x.skill)).toEqual(["X", "Y"]);
  });

  it("caps the list at four skills", () => {
    const s = summarizeGaps([r("a", "A", ["1", "2", "3", "4", "5", "6"])])!;
    expect(s.skills).toHaveLength(4);
  });
});
