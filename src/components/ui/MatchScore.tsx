import { useTranslations } from "next-intl";
import type { ReasonCode } from "@/lib/schemas/match";

const fill: Record<ReasonCode, string> = {
  strong: "bg-match-text",
  partial: "bg-brand",
  // Low scores use amber (direction, not failure), never red or brown.
  weak: "bg-accent-strong",
};

/**
 * Score as the hero: large numeral, a plain word for the band, and the learning route.
 * The route is the product's motif: a dashed road ahead, a solid line to "you are here",
 * and an amber stop at 100.
 */
export function MatchScore({
  score,
  band,
  size = "md",
}: {
  score: number;
  band: ReasonCode;
  size?: "md" | "lg";
}) {
  const t = useTranslations("Match");
  return (
    <div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={`font-display font-extrabold leading-none tracking-tight tabular-nums ${
            size === "lg" ? "text-6xl" : "text-5xl"
          }`}
        >
          {score}
        </span>
        <span className="text-sm text-muted">{t("outOf")}</span>
        <span className="ml-auto text-base font-semibold">{t(`band.${band}`)}</span>
      </div>
      <div
        role="meter"
        aria-label={t("scoreLabel")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-valuetext={t("srScore", { score, band: t(`band.${band}`) })}
        className="relative mt-4 h-5 px-2.5"
      >
        {/* the road ahead */}
        <div
          aria-hidden
          className="absolute inset-x-2.5 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-border-strong"
        />
        {/* the destination */}
        <span
          aria-hidden
          className="absolute right-0 top-1/2 size-5 -translate-y-1/2 rounded-full bg-accent ring-4 ring-surface"
        />
        {/* the way travelled, ending at "you are here" */}
        <div aria-hidden className="absolute inset-x-2.5 top-1/2 -translate-y-1/2">
          <div
            className={`h-[3px] rounded-full ${fill[band]} transition-[width] duration-300`}
            style={{ width: `${score}%` }}
          />
          <span
            className={`absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-surface transition-[left] duration-300 ${fill[band]}`}
            style={{ left: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}
