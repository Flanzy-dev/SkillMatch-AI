import { useTranslations } from "next-intl";
import { Check, CircleAlert } from "lucide-react";
import { Link } from "@/i18n/routing";
import type { MatchResult } from "@/lib/schemas/match";

/** Compact row for ranks 2 and up: enough to compare jobs at a glance; chips live on the detail page. */
export function JobRow({ result, rank }: { result: MatchResult; rank: number }) {
  const t = useTranslations("Results");
  const m = useTranslations("Match");
  const band = m(`band.${result.reason}`);

  return (
    <li>
      <article className="relative flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-5 py-4 shadow-e1 transition duration-150 focus-within:border-brand hover:border-brand hover:shadow-e2">
        <div className="min-w-0">
          <p className="text-sm text-muted">{t("rank", { rank })}</p>
          <h3 className="font-display text-lg font-bold tracking-tight">
            <Link
              href={`/results/${result.jobId}`}
              className="rounded-sm after:absolute after:inset-0 hover:text-brand-text"
            >
              {result.title}
              <span className="sr-only">
                {". "}
                {m("srScore", { score: result.score, band })}
              </span>
            </Link>
          </h3>
          <p className="text-sm text-muted">{result.company}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Check aria-hidden className="size-4 text-match-text" />
              {t("matchedCount", { count: result.matchedSkills.length })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CircleAlert aria-hidden className="size-4 text-missing-text" />
              {t("missingCount", { count: result.missingSkills.length })}
            </span>
          </p>
        </div>
        <div aria-hidden className="shrink-0 text-right">
          <p className="font-display text-3xl font-extrabold leading-none tabular-nums">
            {result.score}
            <span className="ml-0.5 text-sm font-normal text-muted">{m("outOf")}</span>
          </p>
          <p className="mt-1 text-sm font-semibold">{band}</p>
        </div>
      </article>
    </li>
  );
}
