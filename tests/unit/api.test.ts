import { describe, expect, it, vi } from "vitest";
import { GET as getSkills } from "@/app/api/skills/route";
import { POST as matchJobs } from "@/app/api/jobs/match/route";
import { POST as submitFeedback } from "@/app/api/jobs/feedback/route";
import { POST as extractCv } from "@/app/api/cv/extract/route";
import * as geminiService from "@/lib/server/services/gemini";
import { NextRequest } from "next/server";

describe("API Route Handlers", () => {
  it("POST /api/cv/extract rejects requests without file", async () => {
    const formData = new FormData();
    const req = new NextRequest("http://localhost:3000/api/cv/extract", {
      method: "POST",
      body: formData,
    });

    const res = await extractCv(req);
    expect(res.status).toBe(400);
  });

  it("POST /api/cv/extract rejects non-PDF file", async () => {
    const formData = new FormData();
    const file = new File(["dummy text content"], "test.txt", { type: "text/plain" });
    formData.append("file", file);
    const req = new NextRequest("http://localhost:3000/api/cv/extract", {
      method: "POST",
      body: formData,
    });

    const res = await extractCv(req);
    expect(res.status).toBe(400);
  });

  it("POST /api/cv/extract extracts profile from valid PDF", async () => {
    const minimalPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 44 >> stream
BT
/F1 24 Tf
100 700 Td
(Hello World) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000340 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
434
%%EOF`;
    const formData = new FormData();
    const file = new File([Buffer.from(minimalPdf)], "test.pdf", { type: "application/pdf" });
    formData.append("file", file);
    const req = new NextRequest("http://localhost:3000/api/cv/extract", {
      method: "POST",
      body: formData,
    });

    const res = await extractCv(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("skills");
    expect(Array.isArray(data.skills)).toBe(true);
  });

  it("POST /api/cv/extract succeeds with Gemini extraction when API key is set", async () => {
    const origKey = process.env.GEMINI_API_KEY;
    const shouldMock = !origKey;
    if (shouldMock) {
      process.env.GEMINI_API_KEY = "test-dummy-gemini-key";
    }
    const spy = shouldMock
      ? vi.spyOn(geminiService, "extractProfileWithGemini").mockResolvedValueOnce({
          name: "John Doe",
          education: "",
          experience: "Software Engineer",
          projects: "",
          skills: ["Python", "React"],
        })
      : null;

    const minimalPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 70 >> stream
BT
/F1 14 Tf
50 700 Td
(John Doe - Software Engineer with Python and React skills) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000340 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
460
%%EOF`;
    try {
      const formData = new FormData();
      const file = new File([Buffer.from(minimalPdf)], "test_cv.pdf", { type: "application/pdf" });
      formData.append("file", file);
      const req = new NextRequest("http://localhost:3000/api/cv/extract", {
        method: "POST",
        body: formData,
      });

      const res = await extractCv(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("skills");
      expect(Array.isArray(data.skills)).toBe(true);
      expect(data.skills.length).toBeGreaterThan(0);
    } finally {
      spy?.mockRestore();
      if (origKey !== undefined) {
        process.env.GEMINI_API_KEY = origKey;
      } else {
        delete process.env.GEMINI_API_KEY;
      }
    }
  }, 60_000);

  it("GET /api/skills returns canonical and popular skill lists", async () => {
    const res = await getSkills();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.canonical)).toBe(true);
    expect(data.canonical.length).toBeGreaterThan(0);
    expect(data.canonical).toContain("Python");
    expect(Array.isArray(data.popular)).toBe(true);
    expect(data.popular.length).toBeGreaterThan(0);
  });

  it("POST /api/jobs/match ranks matching jobs based on profile", async () => {
    const req = new NextRequest("http://localhost:3000/api/jobs/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        education: "S1 Teknik Informatika",
        experience: "Python and SQL developer",
        projects: "REST API project",
        skills: ["Python", "SQL", "REST API"],
      }),
    });

    const res = await matchJobs(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data.length).toBeLessThanOrEqual(10);
    expect(data[0].jobId).toBe("job-01");
    expect(data[0].score).toBeGreaterThanOrEqual(40);
    expect(data[0].matchedSkills).toContain("Python");
    expect(data[0].matchedSkills).toContain("SQL");
  });

  it("POST /api/jobs/match rejects invalid profile with 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/jobs/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: 123, // invalid type
      }),
    });

    const res = await matchJobs(req);
    expect(res.status).toBe(400);
  });

  it("POST /api/jobs/feedback records feedback successfully", async () => {
    const req = new NextRequest("http://localhost:3000/api/jobs/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job-01",
        helpful: true,
      }),
    });

    const res = await submitFeedback(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("POST /api/jobs/feedback rejects invalid payload with 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/jobs/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job-01",
        // missing helpful
      }),
    });

    const res = await submitFeedback(req);
    expect(res.status).toBe(400);
  });
});
