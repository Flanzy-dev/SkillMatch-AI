import { GoogleGenAI } from "@google/genai";
import type { Profile } from "@/lib/schemas/profile";

export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

export function isGeminiConfigured(): boolean {
  const key = getGeminiApiKey();
  return Boolean(key && key.trim().length > 0);
}

const DEFAULT_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

const SYSTEM_INSTRUCTION = `
You are an expert AI career parser specialized in extracting structured candidate profile information from CVs and resumes (in Indonesian or English).
Analyze the extracted resume text and produce a clean, structured JSON object with the following fields:
- "name": Full name of the candidate (string). If not clearly stated, return empty string "".
- "education": Summary of educational background (e.g. university, major, graduation year/expected) (string).
- "experience": Summary of work experience, internships, or organizational roles (string).
- "projects": Summary of portfolio projects, applications built, or academic assignments (string).
- "skills": An array of technical skills, tools, frameworks, programming languages, and hard skills found (array of strings, max 50 items). Standardize spellings (e.g. "Python", "SQL", "React", "TypeScript", "FastAPI", "Git", "Figma", "Docker"). Exclude generic buzzwords.

Ensure all string fields are concise yet informative. Retain the original language (Indonesian or English) for descriptions.
Return ONLY the raw JSON object. Do not wrap in markdown or backticks.
`;

export async function extractProfileWithGemini(cvText: string): Promise<Profile> {
  const apiKey = getGeminiApiKey();
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const candidateModels = [
    process.env.GEMINI_MODEL,
    ...DEFAULT_MODELS,
  ].filter((m): m is string => Boolean(m && m.trim().length > 0));
  const uniqueModels = Array.from(new Set(candidateModels));

  let lastError: unknown = null;

  for (const model of uniqueModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              { text: SYSTEM_INSTRUCTION },
              { text: `Resume text:\n\n${cvText}` },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const outputText = response.text?.trim() || "";
      if (!outputText) {
        throw new Error("Empty response received from Gemini");
      }

      // Robust JSON parsing: strip potential markdown code fences and locate JSON substring
      let jsonString = outputText;
      const firstBrace = outputText.indexOf("{");
      const lastBrace = outputText.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonString = outputText.slice(firstBrace, lastBrace + 1);
      } else if (jsonString.startsWith("```")) {
        jsonString = jsonString.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      }

      const parsed = JSON.parse(jsonString);

      // Validate and clean up profile object
      const skillsArray = Array.isArray(parsed.skills)
        ? parsed.skills
            .filter((s: unknown): s is string => typeof s === "string" && s.trim().length > 0)
            .map((s: string) => s.trim())
            .slice(0, 50)
        : [];

      return {
        name: typeof parsed.name === "string" ? parsed.name.trim() : "",
        education: typeof parsed.education === "string" ? parsed.education.trim() : "",
        experience: typeof parsed.experience === "string" ? parsed.experience.trim() : "",
        projects: typeof parsed.projects === "string" ? parsed.projects.trim() : "",
        skills: skillsArray,
      };
    } catch (err: unknown) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini CV Extraction] Model ${model} failed: ${message}. Trying next candidate...`);
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  console.error("[Gemini CV Extraction Error]: All candidate models failed.", message);
  throw new Error(`LLM extraction failed: ${message}`);
}
