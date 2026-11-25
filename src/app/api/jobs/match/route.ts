import { NextResponse, type NextRequest } from "next/server";
import { profileSchema } from "@/lib/schemas/profile";
import { rankJobs } from "@/lib/scoring";
import { getAllJobs } from "@/lib/server/db/jobs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const parseResult = profileSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid profile data",
          details: parseResult.error.format(),
        },
        { status: 400 },
      );
    }

    const profile = parseResult.data;

    // Fetch listings from MongoDB Serverless (or fallback)
    const jobs = await getAllJobs();

    // Rank jobs using scoring logic (60 pts skills + 40 pts bilingual text similarity)
    const results = rankJobs(profile, jobs);

    return NextResponse.json(results, { status: 200 });
  } catch (err: unknown) {
    console.error("[Jobs Match Route Handler Error]:", err);
    return NextResponse.json(
      { error: "match_failed", message: "Failed to rank matching jobs" },
      { status: 500 },
    );
  }
}
