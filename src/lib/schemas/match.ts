import { z } from "zod";

const localizedText = z.object({ id: z.string(), en: z.string() });
export type LocalizedText = z.infer<typeof localizedText>;

export const jobSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  summary: localizedText,
  skills: z.array(z.string()),
});
export type Job = z.infer<typeof jobSchema>;

/** Localized in the UI via Results.reason.<code>; the API never returns prose. */
export type ReasonCode = "strong" | "partial" | "weak";

/** How closely the experience, projects and education text matches the listing. */
export type TextLevel = "high" | "some" | "low" | "empty";

/** Detailed comparison points for experience and projects. */
export const textComparisonSchema = z.object({
  experience: localizedText,
  projects: localizedText,
});
export type TextComparison = z.infer<typeof textComparisonSchema>;

/** The two parts of the score, so the UI can show how it adds up. */
const breakdownSchema = z.object({
  /** Out of 60: share of the listing's skills the profile has. */
  skillPoints: z.number().int().min(0).max(60),
  /** Out of 40: overlap between the profile text and the listing text. */
  textPoints: z.number().int().min(0).max(40),
  textLevel: z.enum(["high", "some", "low", "empty"]),
  textComparison: textComparisonSchema.optional(),
});

export const matchResultSchema = z.object({
  breakdown: breakdownSchema,
  jobId: z.string(),
  title: z.string(),
  company: z.string(),
  summary: localizedText,
  score: z.number().int().min(0).max(100),
  jobSkills: z.array(z.string()),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  reason: z.enum(["strong", "partial", "weak"]),
});
export type MatchResult = z.infer<typeof matchResultSchema>;
