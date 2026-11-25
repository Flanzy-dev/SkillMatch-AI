import { NextResponse, type NextRequest } from "next/server";
import { saveFeedback } from "@/lib/server/db/jobs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, helpful } = body;

    if (!jobId || typeof jobId !== "string" || typeof helpful !== "boolean") {
      return NextResponse.json(
        { error: "Invalid payload: 'jobId' (string) and 'helpful' (boolean) are required." },
        { status: 400 },
      );
    }

    // IP hash for basic deduplication / rate-limiting compliance without storing IP
    const clientIp = request.headers.get("x-forwarded-for") || "unknown";
    const ipHash = Buffer.from(clientIp).toString("base64").slice(0, 16);

    await saveFeedback(jobId, helpful, ipHash);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error("[Feedback Route Handler Error]:", err);
    return NextResponse.json(
      { error: "Failed to record feedback" },
      { status: 500 },
    );
  }
}
