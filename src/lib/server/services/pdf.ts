import { PDFParse } from "pdf-parse";
import { createRequire } from "module";
import { pathToFileURL } from "url";
import path from "path";

let isWorkerConfigured = false;

function ensureWorkerConfigured() {
  if (isWorkerConfigured) return;
  try {
    const req = createRequire(import.meta.url);
    const workerPath = req.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
    PDFParse.setWorker(pathToFileURL(workerPath).href);
    isWorkerConfigured = true;
    return;
  } catch {
    // Fall back to disk resolution relative to cwd
  }

  const possiblePaths = [
    path.resolve(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"),
    path.resolve(process.cwd(), "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs"),
    path.resolve(process.cwd(), "node_modules/pdf-parse/dist/worker/pdf.worker.mjs"),
  ];

  for (const p of possiblePaths) {
    try {
      PDFParse.setWorker(pathToFileURL(p).href);
      isWorkerConfigured = true;
      return;
    } catch {
      // Try next
    }
  }
}

/**
 * Extracts raw text content from an in-memory PDF buffer.
 * Complies with Product Principle 3: File is processed ephemerally and never written to disk.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  if (!buffer || buffer.length === 0) {
    throw new Error("Empty PDF buffer provided");
  }

  // Quick signature check (%PDF- within the first 1024 bytes per PDF standard)
  const header = buffer.subarray(0, 1024).toString("ascii");
  if (!header.includes("%PDF-")) {
    throw new Error("Invalid PDF header signature");
  }

  ensureWorkerConfigured();

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result?.text ? result.text.trim() : "";
    if (text.length === 0) {
      throw new Error("PDF contains no selectable text (scanned image or empty)");
    }
    // Limit to reasonable character count to prevent prompt injection or token exhaustion
    return text.slice(0, 50000);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`PDF parsing failed: ${message}`);
  } finally {
    try {
      await parser.destroy();
    } catch {
      // Ignore cleanup error
    }
  }
}
