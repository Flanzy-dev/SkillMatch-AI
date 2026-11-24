"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, FileUp, Lock } from "lucide-react";
import { Button } from "./Button";
import { MAX_CV_BYTES } from "@/lib/schemas/profile";

type Problem = "type" | "size" | null;

interface Props {
  onFile: (file: File) => void;
  /** Error from the extraction step, shown with a retry action. */
  externalError?: boolean;
  onRetry?: () => void;
}

export function Dropzone({ onFile, externalError, onRetry }: Props) {
  const t = useTranslations("Upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);

  function accept(file: File | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return setProblem("type");
    }
    if (file.size > MAX_CV_BYTES) return setProblem("size");
    setProblem(null);
    onFile(file);
  }

  const message = problem ? t(`error.${problem}`) : externalError ? t("error.extract") : null;

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          accept(e.dataTransfer.files[0]);
        }}
        className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-150 ${
          message ? "border-danger bg-danger-tint" : over ? "border-brand bg-brand-tint" : "border-border-strong bg-surface"
        }`}
      >
        <FileUp aria-hidden className="size-8 text-brand-text" />
        <p className="font-medium">{t("dropTitle")}</p>
        <p className="text-sm text-muted">{t("dropHint")}</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          aria-label={t("chooseFile")}
          onChange={(e) => {
            accept(e.target.files?.[0]);
            e.target.value = "";
          }}
          tabIndex={-1}
        />
        <Button variant="secondary" onClick={() => inputRef.current?.click()}>
          {t("chooseFile")}
        </Button>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Lock aria-hidden className="size-4 shrink-0" />
          {t("privacy")}
        </p>
      </div>
      {message && (
        <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 text-sm text-danger">
          <AlertCircle aria-hidden className="size-4 shrink-0" />
          <span>{message}</span>
          {externalError && onRetry && (
            <Button variant="ghost" onClick={onRetry}>
              {t("retry")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
