import { describe, expect, it } from "vitest";
import { closestSkill, isKnownSkill } from "@/lib/skills";

describe("isKnownSkill", () => {
  it("knows listing skills and their aliases", () => {
    expect(isKnownSkill("PostgreSQL")).toBe(true);
    expect(isKnownSkill("postgres")).toBe(true);
    expect(isKnownSkill("JS")).toBe(true);
  });

  it("does not know skills no listing asks for", () => {
    expect(isKnownSkill("Canva")).toBe(false);
  });
});

describe("closestSkill", () => {
  it("suggests the listing name for a partial or misspelled skill", () => {
    expect(closestSkill("Postgre")).toBe("PostgreSQL");
    expect(closestSkill("Pyhton")).toBe("Python");
  });

  it("returns null for known skills and for nothing close", () => {
    expect(closestSkill("Python")).toBeNull();
    expect(closestSkill("Canva")).toBeNull();
  });
});
