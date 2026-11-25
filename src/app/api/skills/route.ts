import { NextResponse } from "next/server";
import { getAllJobs } from "@/lib/server/db/jobs";

export async function GET() {
  try {
    const jobs = await getAllJobs();

    // Unique alphabetical skills
    const canonical = [...new Set(jobs.flatMap((j) => j.skills))].sort((a, b) => a.localeCompare(b));

    // Popular skills by frequency
    const count = new Map<string, number>();
    for (const j of jobs) {
      for (const s of j.skills) {
        count.set(s, (count.get(s) ?? 0) + 1);
      }
    }

    const popular = [...count.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 12)
      .map(([s]) => s);

    return NextResponse.json(
      { canonical, popular },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (err: unknown) {
    console.error("[Skills Route Handler Error]:", err);
    return NextResponse.json(
      { error: "Failed to retrieve skills catalog" },
      { status: 500 },
    );
  }
}
