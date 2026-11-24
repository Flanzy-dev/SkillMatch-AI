import { describe, expect, it } from "vitest";
import { learnUrl } from "@/lib/learn";

describe("learnUrl", () => {
  it("builds a localized, encoded search query", () => {
    expect(learnUrl("CI/CD", "id")).toBe("https://www.google.com/search?q=belajar%20CI%2FCD");
    expect(learnUrl("Power BI", "en")).toBe("https://www.google.com/search?q=learn%20Power%20BI");
  });

  it("encodes characters that could break out of the query", () => {
    const url = learnUrl("a&b=c#d", "en");
    expect(url).not.toMatch(/[&=#]d|&b=/);
    expect(new URL(url).searchParams.get("q")).toBe("learn a&b=c#d");
  });
});
