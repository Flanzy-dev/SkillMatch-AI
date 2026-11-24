import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import type { MatchResult } from "@/lib/schemas/match";
import { MatchScore } from "./MatchScore";
import { SkillChip } from "./SkillChip";
import { ScoreBreakdown } from "./ScoreBreakdown";

interface Props {
  result: MatchResult;
  rank?: number;
  /** Static sample on the landing page: no link, labeled "Sample". */
  preview?: boolean;
  /** The closest job: larger score and a stronger border so rank 1 reads as the lead. */
  featured?: boolean;
}

export function JobCard({ result, rank, preview = false, featured = false }: Props) {
  const t = useTranslations("Results");
  const m = useTranslations("Match");
  const band = m(`band.${result.reason}`);

  return (
    <li>
      <article
        className={`relative rounded-xl border bg-surface p-5 transition duration-150 ${
          featured ? "border-brand/60 shadow-e2" : "border-border shadow-e1"
        } ${preview ? "" : "focus-within:border-brand hover:border-brand hover:shadow-e2"}`}
      >
        <p className="text-sm font-medium text-muted">
          {preview ? m("sample") : featured ? t("closest") : t("rank", { rank: rank ?? 0 })}
        </p>
        <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
          {preview ? (
            result.title
          ) : (
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
          )}
        </h2>
        <p className="text-sm text-muted">{result.company}</p>

        <div className="mt-4">
          <MatchScore score={result.score} band={result.reason} size={featured ? "lg" : "md"} />
        </div>
        <p className="mt-3 text-sm">
          {m(`reason.${result.reason}`, {
            matched: result.matchedSkills.length,
            total: result.jobSkills.length,
            missing: result.missingSkills.length,
          })}
        </p>
        <ScoreBreakdown result={result} compact />

        <div className="mt-4 flex flex-wrap gap-2">
          {result.matchedSkills.map((s) => (
            <SkillChip key={s} label={s} tone="matched" />
          ))}
          {result.missingSkills.map((s) => (
            <SkillChip key={s} label={s} tone="missing" />
          ))}
        </div>
        {featured && !preview && (
          // Visual affordance only: the whole card is already the link (stretched title link).
          <p aria-hidden className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-brand-text">
            {t("openSteps")}
            <ArrowRight className="size-4" />
          </p>
        )}
      </article>
    </li>
  );
}
