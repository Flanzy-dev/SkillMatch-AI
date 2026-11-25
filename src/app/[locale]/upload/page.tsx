"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Info, Loader2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { api, DEMO_EXTRACTION, ApiError } from "@/lib/api";
import { useMatchFlow } from "@/hooks/useMatchFlow";
import { Button, buttonClass } from "@/components/ui/Button";
import { Dropzone } from "@/components/ui/Dropzone";
import { Stepper } from "@/components/ui/Stepper";

type Phase = "idle" | "extracting" | "error";

export default function UploadPage() {
  const t = useTranslations("Upload");
  const router = useRouter();
  const { setProfile, setResults } = useMatchFlow();
  const [phase, setPhase] = useState<Phase>("idle");
  const fileRef = useRef<File | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function run(file: File) {
    fileRef.current = file;
    setPhase("extracting");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const fail = new URLSearchParams(window.location.search).get("fail");
    try {
      const profile = await api.extractCv(file, {
        signal: ctrl.signal,
        fail: fail === "extract" ? "extract" : undefined,
      });
      setResults(null);
      setProfile(profile, "cv");
      router.push("/review");
    } catch (e) {
      if (e instanceof ApiError && e.code === "aborted") return setPhase("idle");
      setPhase("error");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Stepper current={1} />
      <h1 className="font-display text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("subtitle")}</p>
      {DEMO_EXTRACTION && (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-brand-tint p-3 text-sm text-text">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-text" />
          <span>
            {t("demo")}{" "}
            <Link href="/review" className="font-medium text-brand-text underline underline-offset-4">
              {t("manualLink")}
            </Link>
          </span>
        </p>
      )}

      <div className="mt-6">
        {phase === "extracting" ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <Loader2 aria-hidden className="mx-auto size-8 animate-spin text-brand-text" />
            <p role="status" aria-live="polite" className="mt-3 font-medium">
              {t("extracting")}
            </p>
            <p className="mt-1 text-sm text-muted">{t("extractingHint")}</p>
            <Button variant="ghost" className="mt-4" onClick={() => abortRef.current?.abort()}>
              {t("cancel")}
            </Button>
          </div>
        ) : (
          <Dropzone
            onFile={run}
            externalError={phase === "error"}
            onRetry={() => fileRef.current && run(fileRef.current)}
          />
        )}
      </div>

      <p className="mt-6 text-sm text-muted">
        {t("manualPrompt")}{" "}
        <Link href="/review" className={`${buttonClass("ghost")} px-2`}>
          {t("manualLink")}
        </Link>
      </p>
    </div>
  );
}
