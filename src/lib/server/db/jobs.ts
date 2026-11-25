import type { Job } from "@/lib/schemas/match";
import { jobs as fallbackJobs } from "@/lib/mock-data/jobs";
import { getJobsCollection, getFeedbackCollection, isMongoConfigured } from "./mongodb";

let hasAttemptedSeed = false;
let cachedJobs: Job[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60_000; // Cache for 60 seconds

export function clearJobsCache(): void {
  cachedJobs = null;
  lastFetchTime = 0;
}

/**
 * Ensures MongoDB contains the initial synthetic job listings.
 */
export async function seedJobsIfEmpty(): Promise<void> {
  if (hasAttemptedSeed || !isMongoConfigured()) return;
  hasAttemptedSeed = true;

  try {
    const col = await getJobsCollection();
    if (!col) return;

    const count = await col.countDocuments();
    if (count === 0) {
      console.log(`[MongoDB Serverless] Seeding ${fallbackJobs.length} jobs to collection...`);
      await col.insertMany(fallbackJobs);
      // Create index on id
      await col.createIndex({ id: 1 }, { unique: true });
      console.log("[MongoDB Serverless] Seeding complete.");
    }
  } catch (err) {
    console.error("[MongoDB Serverless] Seeding error:", err);
  }
}

/**
 * Retrieves all job listings from MongoDB Serverless (or fallback static data if DB is not configured).
 */
export async function getAllJobs(): Promise<Job[]> {
  const now = Date.now();
  if (cachedJobs && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedJobs;
  }

  try {
    if (isMongoConfigured()) {
      await seedJobsIfEmpty();
      const col = await getJobsCollection();
      if (col) {
        const dbJobs = await col.find({}, { projection: { _id: 0 } }).toArray();
        if (dbJobs && dbJobs.length > 0) {
          cachedJobs = dbJobs;
          lastFetchTime = now;
          return dbJobs;
        }
      }
    }
  } catch (err) {
    console.error("[MongoDB Serverless] Error fetching jobs, using fallback:", err);
  }

  return fallbackJobs;
}

/**
 * Saves relevance feedback to MongoDB.
 */
export async function saveFeedback(jobId: string, helpful: boolean, ipHash?: string): Promise<boolean> {
  try {
    const col = await getFeedbackCollection();
    if (col) {
      await col.insertOne({
        jobId,
        helpful,
        createdAt: new Date(),
        ipHash,
      });
      return true;
    }
  } catch (err) {
    console.error("[MongoDB Serverless] Error saving feedback:", err);
  }

  // Graceful fallback for local dev without MongoDB
  console.log(`[Feedback Logged (Memory)]: Job ${jobId} was marked as ${helpful ? "Helpful" : "Not Helpful"}`);
  return true;
}
