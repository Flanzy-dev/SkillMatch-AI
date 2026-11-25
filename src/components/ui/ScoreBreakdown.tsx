import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { MatchResult } from "@/lib/schemas/match";
import { WEIGHTS } from "@/lib/scoring";

const SKILL_MAX = 100 * WEIGHTS.skill;
const TEXT_MAX = 100 * WEIGHTS.text;

/**
 * Shows how the score adds up, so the reason never contradicts the number: two jobs with the
 * same "3 of 5 skills" can differ because of the experience and projects part.
 */
export function ScoreBreakdown({ result, compact = false }: { result: MatchResult; compact?: boolean }) {
  const m = useTranslations("Match");
  const locale = useLocale() as "id" | "en";
  const { skillPoints, textPoints, textLevel, textComparison } = result.breakdown;

  if (compact) {
    return (
      <p className="mt-1 text-sm text-muted tabular-nums">
        {m("compact", { skill: skillPoints, text: textPoints })}
      </p>
    );
  }

  const rows = [
    {
      key: "skill",
      label: m("skillPart", { matched: result.matchedSkills.length, total: result.jobSkills.length }),
      points: skillPoints,
      max: SKILL_MAX,
    },
    {
      key: "text",
      label: m("textPart", { level: m(`textLevel.${textLevel}`) }),
      points: textPoints,
      max: TEXT_MAX,
    },
  ];

  return (
    <div className="mt-5 border-t border-border pt-4">
      <h2 className="font-display text-base font-bold tracking-tight">{m("breakdownTitle")}</h2>
      <dl className="mt-2 flex flex-col">
        {rows.map((r) => (
          <div
            key={r.key}
            className="border-b border-border py-2.5 last:border-b-0"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
              <dt className="text-sm font-medium">{r.label}</dt>
              <dd className="text-sm font-semibold tabular-nums">
                {m("points", { points: r.points, max: r.max })}
              </dd>
            </div>
            {r.key === "text" && textComparison && (
              <div className="mt-2.5 rounded-lg border border-border/80 bg-surface-subtle/50 p-3 text-xs leading-relaxed">
                <p className="font-semibold text-foreground mb-1.5">{m("comparisonTitle")}</p>
                <ul className="space-y-1.5 text-muted">
                  <li className="flex items-start gap-1.5">
                    <span className="font-medium text-foreground shrink-0">• {m("experienceComparisonLabel")}:</span>
                    <span>{textComparison.experience[locale]}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-medium text-foreground shrink-0">• {m("projectsComparisonLabel")}:</span>
                    <span>{textComparison.projects[locale]}</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        ))}
      </dl>
      <p className="mt-2 text-sm text-muted">{m("breakdownNote")}</p>
      {textLevel === "empty" && (
        <Link
          href="/review"
          className="mt-1 inline-flex min-h-11 items-center text-sm font-medium text-brand-text underline-offset-4 hover:underline"
        >
          {m("addText")}
        </Link>
      )}
    </div>
  );
}
