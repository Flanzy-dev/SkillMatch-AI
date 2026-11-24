import { z } from "zod";

export const MAX_CV_BYTES = 5 * 1024 * 1024;

export const profileSchema = z.object({
  // Optional: the name is never used for matching, so it is not required (PRODUCT.md principle 3).
  name: z.string().trim(),
  education: z.string().trim(),
  experience: z.string().trim(),
  projects: z.string().trim(),
  skills: z.array(z.string().trim().min(1)).max(50),
});

export type Profile = z.infer<typeof profileSchema>;

export const emptyProfile: Profile = {
  name: "",
  education: "",
  experience: "",
  projects: "",
  skills: [],
};
