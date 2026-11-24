"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { useMatchFlow } from "@/hooks/useMatchFlow";
import { buttonClass } from "@/components/ui/Button";
import { JobCard } from "@/components/ui/JobCard";
import { JobRow } from "@/components/ui/JobRow";
import { Stepper } from "@/components/ui/Stepper";
import { GapSummaryPanel } from "@/components/features/GapSummaryPanel";
import { summarizeGaps } from "@/lib/gaps";
import { TOP_N } from "@/lib/scoring";

export default function ResultsPage() {
  const t = useTranslations("Results");
  const router = useRouter();
  const c = useTranslations("Common");
  const { results, ready, source } = useMatchFlow();

  useEffect(() => {
    if (ready && !results) router.replace("/upload");
  }, [ready, results, router]);

  if (!ready || !results) return null;
  const summary = summarizeGaps(results);
  const [top, ...rest] = results;

  return (
    <div className="mx-auto max-w-3xl">
      <Stepper current={3} skipFirst={source !== "cv"} />
      <h1 className="font-display text-3xl font-bold tracking-tight">{t("title")}</h1>
      {results.length > 0 && (
        <p className="mt-2 text-muted">
          {results.length < TOP_N
            ? t("few", { count: results.length })
            : t("subtitle", { count: results.length })}
        </p>
      )}
      <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        {c("synthetic")}
      </p>

      {results.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-surface p-8 text-center">
          <p className="font-medium">{t("emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted">{t("emptyHint")}</p>
          <Link href="/review" className={`${buttonClass("primary")} mt-4`}>
            {t("editProfile")}
          </Link>
        </div>
      ) : (
        <>
          <ol className="mt-6">
            <JobCard result={top} rank={1} featured />
          </ol>
          {summary && <GapSummaryPanel summary={summary} />}
          {rest.length > 0 && (
            <section aria-labelledby="others" className="mt-8">
              <h2 id="others" className="text-sm font-semibold text-muted">
                {t("others")}
              </h2>
              <ol className="mt-3 flex flex-col gap-3">
                {rest.map((r, i) => (
                  <JobRow key={r.jobId} result={r} rank={i + 2} />
                ))}
              </ol>
            </section>
          )}
          <Link href="/review" className={`${buttonClass("secondary")} mt-6`}>
            {t("editProfile")}
          </Link>
        </>
      )}
    </div>
  );
}
