"use client";

import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, Route } from "lucide-react";
import type { GapSummary } from "@/lib/gaps";
import { learnUrl } from "@/lib/learn";
import { SkillChip } from "@/components/ui/SkillChip";
import { CopyPlanButton } from "./CopyPlanButton";

/**
 * The collective story of the results, as actions: each skill to learn, how many of these jobs
 * ask for it, where to start, and a plan the user can take away.
 */
export function GapSummaryPanel({ summary }: { summary: GapSummary }) {
  const t = useTranslations("Results");
  const d = useTranslations("Detail");
  const locale = useLocale() as "id" | "en";
  return (
    <section
      aria-labelledby="gap-title"
      className="mt-6 rounded-xl border border-accent/60 bg-surface p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-on-accent">
          <Route aria-hidden className="size-5" />
        </span>
        <div>
          <h2 id="gap-title" className="font-display text-xl font-bold tracking-tight">
            {t("gapTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {summary.kind === "shared"
              ? t("gapHintShared")
              : t("gapHintTop", { title: summary.topTitle })}
          </p>
        </div>
      </div>
      <ol className="mt-3 flex flex-col">
        {summary.skills.map(({ skill, jobs }) => (
          <li
            key={skill}
            className="flex flex-wrap items-center justify-between gap-x-4 border-t border-border first:border-t-0"
          >
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <SkillChip label={skill} tone="missing" />
              {jobs > 1 && <span className="text-sm text-muted">{t("neededIn", { count: jobs })}</span>}
            </span>
            <a
              href={learnUrl(skill, locale)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={d("learnAria", { skill })}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand-text underline-offset-4 hover:underline"
            >
              {d("learn")}
              <ExternalLink aria-hidden className="size-3.5" />
            </a>
          </li>
        ))}
      </ol>
      <CopyPlanButton skills={summary.skills} topTitle={summary.topTitle} />
    </section>
  );
}
