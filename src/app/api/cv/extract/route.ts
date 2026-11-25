import { NextResponse, type NextRequest } from "next/server";
import { MAX_CV_BYTES } from "@/lib/schemas/profile";
import { extractTextFromPdf } from "@/lib/server/services/pdf";
import { extractProfileWithGemini, isGeminiConfigured } from "@/lib/server/services/gemini";
import { sampleProfiles } from "@/lib/mock-data/jobs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided in form-data ('file' field required)" },
        { status: 400 },
      );
    }

    // Validate mime-type
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 },
      );
    }

    // Validate size limit (5 MB)
    if (file.size > MAX_CV_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds 5 MB limit" },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text from PDF in memory
    let pdfText = "";
    try {
      pdfText = await extractTextFromPdf(buffer);
    } catch (parseErr: unknown) {
      const errMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      console.error("[CV Extract] PDF parse failed:", errMsg);
      return NextResponse.json(
        { error: "extract_failed", message: "Failed to parse PDF text" },
        { status: 422 },
      );
    }

    // If Gemini API is configured, use it for structured AI extraction
    if (isGeminiConfigured()) {
      try {
        const profile = await extractProfileWithGemini(pdfText);
        return NextResponse.json(profile, { status: 200 });
      } catch (geminiErr) {
        console.error("[CV Extract] Gemini extraction failed:", geminiErr);
        return NextResponse.json(
          { error: "extract_failed", message: "AI extraction failed" },
          { status: 422 },
        );
      }
    } else {
      // Fallback for development if GEMINI_API_KEY is not yet set
      console.warn("[CV Extract] GEMINI_API_KEY not set. Using deterministic demo extraction.");
      const index = (file.size + file.name.length) % sampleProfiles.length;
      const sample = sampleProfiles[index];
      return NextResponse.json(
        {
          name: sample.name,
          education: sample.education,
          experience: sample.experience,
          projects: sample.projects,
          skills: [...sample.skills],
        },
        { status: 200 },
      );
    }
  } catch (err: unknown) {
    console.error("[CV Extract Route Handler Unexpected Error]:", err);
    return NextResponse.json(
      { error: "extract_failed", message: "Internal server error during extraction" },
      { status: 500 },
    );
  }
}
