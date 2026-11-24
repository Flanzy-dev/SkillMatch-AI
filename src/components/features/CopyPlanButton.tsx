"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  skills: { skill: string; jobs: number }[];
  /** The closest job, named at the top of the plan. */
  topTitle: string;
}

/**
 * Something to take away without storing anything: the learning plan goes to the clipboard as
 * plain text, so the "CV is not stored" promise holds.
 */
export function CopyPlanButton({ skills, topTitle }: Props) {
  const t = useTranslations("Results");
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    const text = [
      t("planHeading"),
      t("planFor", { title: topTitle }),
      "",
      ...skills.map((s, i) => `${i + 1}. ${s.jobs > 1 ? t("planLine", { skill: s.skill, count: s.jobs }) : s.skill}`),
      "",
      t("planNote"),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Button variant="secondary" onClick={copy}>
          {state === "copied" ? (
            <Check aria-hidden className="size-4" />
          ) : (
            <ClipboardCopy aria-hidden className="size-4" />
          )}
          {t("copyPlan")}
        </Button>
        <span className="text-sm text-muted">{t("copyHint")}</span>
      </div>
      <p role="status" className="text-sm">
        {state === "copied" ? t("copied") : state === "failed" ? t("copyFailed") : ""}
      </p>
    </div>
  );
}
