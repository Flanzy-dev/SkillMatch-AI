import { MongoClient, type Db, type Collection } from "mongodb";
import type { Job } from "@/lib/schemas/match";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "skillmatch_ai";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function isMongoConfigured(): boolean {
  return Boolean(uri && uri.trim().length > 0);
}

export async function getMongoClient(): Promise<MongoClient | null> {
  if (!isMongoConfigured()) {
    return null;
  }

  try {
    if (process.env.NODE_ENV === "development") {
      if (!globalThis._mongoClientPromise) {
        client = new MongoClient(uri!, {
          serverSelectionTimeoutMS: 5000,
          maxPoolSize: 10,
        });
        globalThis._mongoClientPromise = client.connect();
      }
      return await globalThis._mongoClientPromise;
    } else {
      if (!clientPromise) {
        client = new MongoClient(uri!, {
          serverSelectionTimeoutMS: 5000,
          maxPoolSize: 10,
        });
        clientPromise = client.connect();
      }
      return await clientPromise;
    }
  } catch (err) {
    globalThis._mongoClientPromise = undefined;
    clientPromise = null;
    console.error("[MongoDB Serverless] Failed to connect:", err);
    return null;
  }
}

export async function getDb(): Promise<Db | null> {
  const client = await getMongoClient();
  if (!client) return null;
  return client.db(dbName);
}

export interface FeedbackRecord {
  jobId: string;
  helpful: boolean;
  createdAt: Date;
  ipHash?: string;
}

export async function getJobsCollection(): Promise<Collection<Job> | null> {
  const db = await getDb();
  if (!db) return null;
  return db.collection<Job>("jobs");
}

export async function getFeedbackCollection(): Promise<Collection<FeedbackRecord> | null> {
  const db = await getDb();
  if (!db) return null;
  return db.collection<FeedbackRecord>("feedback");
}
