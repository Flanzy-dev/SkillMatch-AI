"use client";

import { use, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, ExternalLink, Info, PartyPopper, Route } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { api } from "@/lib/api/mock";
import { learnUrl } from "@/lib/learn";
import { useMatchFlow } from "@/hooks/useMatchFlow";
import { buttonClass, Button } from "@/components/ui/Button";
import { MatchScore } from "@/components/ui/MatchScore";
import { SkillChip } from "@/components/ui/SkillChip";
import { Stepper } from "@/components/ui/Stepper";
import { ScoreBreakdown } from "@/components/ui/ScoreBreakdown";
import { CopyPlanButton } from "@/components/features/CopyPlanButton";

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ locale: string; jobId: string }>;
}) {
  const { jobId } = use(params);
  const t = useTranslations("Detail");
  const m = useTranslations("Match");
  const c = useTranslations("Common");
  const locale = useLocale() as "id" | "en";
  const router = useRouter();
  const { results, ready, source } = useMatchFlow();
  const [sent, setSent] = useState(false);

  const index = results ? results.findIndex((r) => r.jobId === jobId) : -1;
  const result = results && index >= 0 ? results[index] : undefined;

  useEffect(() => {
    if (ready && !result) router.replace(results ? "/results" : "/upload");
  }, [ready, result, results, router]);

  if (!ready || !result || !results) return null;

  async function vote(helpful: boolean) {
    await api.submitFeedback(jobId, helpful);
    setSent(true);
  }

  const missing = result.missingSkills;
  const prev = index > 0 ? results[index - 1] : null;
  const next = index < results.length - 1 ? results[index + 1] : null;

  return (
    <article className="mx-auto max-w-3xl">
      <Stepper current={3} skipFirst={source !== "cv"} />
      <Link href="/results" className={`${buttonClass("ghost")} -ml-3 mb-4`}>
        <ArrowLeft aria-hidden className="size-4" />
        {t("back")}
      </Link>
      <h1 className="font-display text-3xl font-bold tracking-tight">{result.title}</h1>
      <p className="text-muted">{result.company}</p>
      <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        {c("synthetic")}
      </p>
      <p className="mt-3">{result.summary[locale]}</p>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <MatchScore score={result.score} band={result.reason} size="lg" />
        <p className="mt-4 text-sm">
          <span className="font-medium">{t("reasonLabel")}: </span>
          {m(`reason.${result.reason}`, {
            matched: result.matchedSkills.length,
            total: result.jobSkills.length,
          })}
        </p>
        <ScoreBreakdown result={result} />
      </div>

      {missing.length ? (
        <section
          aria-labelledby="next"
          className="mt-6 rounded-xl border border-accent/60 bg-surface p-5"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-on-accent">
              <Route aria-hidden className="size-5" />
            </span>
            <div>
              <h2 id="next" className="font-display text-xl font-bold tracking-tight">
                {t("nextTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted">{t("nextHint", { count: missing.length })}</p>
            </div>
          </div>
          <ul className="mt-3 flex flex-col">
            {missing.map((s) => (
              <li
                key={s}
                className="flex flex-wrap items-center justify-between gap-x-4 border-t border-border first:border-t-0"
              >
                <SkillChip label={s} tone="missing" />
                <a
                  href={learnUrl(s, locale)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("learnAria", { skill: s })}
                  className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand-text underline-offset-4 hover:underline"
                >
                  {t("learn")}
                  <ExternalLink aria-hidden className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
          <CopyPlanButton
            topTitle={result.title}
            skills={missing.map((skill) => ({
              skill,
              jobs: results.filter((r) => r.missingSkills.includes(skill)).length,
            }))}
          />
        </section>
      ) : (
        <section className="mt-6 flex items-start gap-3 rounded-xl border border-match-text/40 bg-match-bg p-5 text-match-text">
          <PartyPopper aria-hidden className="mt-0.5 size-5 shrink-0" />
          <p>{t("allMet")}</p>
        </section>
      )}

      <section className="mt-6" aria-labelledby="have">
        <h2 id="have" className="font-display text-lg font-bold">
          {t("haveTitle")}
        </h2>
        {result.matchedSkills.length ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {result.matchedSkills.map((s) => (
              <li key={s}>
                <SkillChip label={s} tone="matched" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">{t("noneMatched")}</p>
        )}
      </section>

      <p className="mt-6 text-sm text-muted">{t("escoNote")}</p>

      <div
        className="mt-8 border-t border-border pt-5"
        role="group"
        aria-label={t("feedbackQuestion")}
      >
        <p className="font-medium">{t("feedbackQuestion")}</p>
        {sent ? (
          <p role="status" className="mt-2 text-sm text-muted">
            {t("feedbackThanks")}
          </p>
        ) : (
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" onClick={() => vote(true)}>
              {t("yes")}
            </Button>
            <Button variant="secondary" onClick={() => vote(false)}>
              {t("no")}
            </Button>
          </div>
        )}
      </div>

      {(prev || next) && (
        <nav aria-label={t("navLabel")} className="mt-8 grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link
              href={`/results/${prev.jobId}`}
              className="flex min-h-11 flex-col rounded-xl border border-border bg-surface p-4 hover:border-brand"
            >
              <span className="flex items-center gap-1.5 text-sm text-muted">
                <ArrowLeft aria-hidden className="size-4" />
                {t("prev")}
              </span>
              <span className="mt-1 font-medium">{prev.title}</span>
            </Link>
          ) : (
            <span aria-hidden className="hidden sm:block" />
          )}
          {next && (
            <Link
              href={`/results/${next.jobId}`}
              className="flex min-h-11 flex-col items-end rounded-xl border border-border bg-surface p-4 text-right hover:border-brand"
            >
              <span className="flex items-center gap-1.5 text-sm text-muted">
                {t("next")}
                <ArrowRight aria-hidden className="size-4" />
              </span>
              <span className="mt-1 font-medium">{next.title}</span>
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
