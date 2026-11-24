import { useTranslations } from "next-intl";
import { Check, Flag, Minus } from "lucide-react";
import { Link } from "@/i18n/routing";

const steps = [
  { key: "upload", href: "/upload" },
  { key: "review", href: "/review" },
  { key: "results", href: "/results" },
] as const;

type State = "done" | "skipped" | "current" | "upcoming";

interface Props {
  /** 1-based current step. */
  current: 1 | 2 | 3;
  /** True when the CV upload was skipped (manual or sample profile). */
  skipFirst?: boolean;
}

/**
 * The learning route as navigation. Same grammar as the score meter: a solid line for the way
 * already travelled, a dashed line for the road ahead, and an amber flag as the destination.
 * Travelled and skipped stops link back; a skipped upload is shown as skipped, never as done.
 */
export function Stepper({ current, skipFirst = false }: Props) {
  const t = useTranslations("Stepper");

  const stateOf = (n: number): State => {
    if (skipFirst && n === 1 && current > 1) return "skipped";
    if (n < current) return "done";
    return n === current ? "current" : "upcoming";
  };

  /** The road out of stop n is solid only if n was actually travelled, not skipped. */
  const travelled = (n: number) => n < current && stateOf(n) !== "skipped";

  const nodeClass = (n: number, state: State) =>
    n === steps.length
      ? "bg-accent text-on-accent"
      : state === "done" || state === "current"
        ? "bg-brand text-white"
        : "border border-border-strong bg-canvas text-muted";

  const nodeContent = (n: number, state: State) =>
    n === steps.length ? (
      <Flag aria-hidden className="size-4" />
    ) : state === "done" ? (
      <Check aria-hidden className="size-4" />
    ) : state === "skipped" ? (
      <Minus aria-hidden className="size-4" />
    ) : (
      n
    );

  return (
    <nav aria-label={t("label")} className="mb-8">
      {/* Phone: a small route plus the plain-text position. */}
      <div className="flex items-center gap-3 sm:hidden">
        <div aria-hidden className="flex items-center">
          {steps.map((s, i) => {
            const n = i + 1;
            const state = stateOf(n);
            return (
              <div key={s.key} className="flex items-center">
                <span
                  className={`size-3 rounded-full ${
                    n === steps.length
                      ? "bg-accent"
                      : state === "done" || state === "current"
                        ? "bg-brand"
                        : "border border-border-strong bg-canvas"
                  }`}
                />
                {n < steps.length && (
                  <span
                    className={`w-5 border-t-2 ${
                      travelled(n) ? "border-solid border-brand" : "border-dashed border-border-strong"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-sm font-medium text-muted">
          {t("compact", { current, total: steps.length })}
        </p>
      </div>

      <ol className="hidden items-center sm:flex">
        {steps.map((s, i) => {
          const n = i + 1;
          const state = stateOf(n);
          const active = state === "current";
          const linked = state === "done" || state === "skipped";
          const inner = (
            <>
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${nodeClass(n, state)}`}
              >
                {nodeContent(n, state)}
              </span>
              <span
                className={
                  active ? "font-semibold text-text" : linked ? "text-brand-text" : "text-muted"
                }
              >
                {t(s.key)}
                {state === "skipped" && <span className="sr-only"> ({t("skipped")})</span>}
              </span>
            </>
          );
          return (
            <li key={s.key} className="flex items-center" aria-current={active ? "step" : undefined}>
              {linked ? (
                <Link href={s.href} className="inline-flex min-h-11 items-center gap-2 text-sm">
                  {inner}
                </Link>
              ) : (
                <span className="inline-flex min-h-11 items-center gap-2 text-sm">{inner}</span>
              )}
              {n < steps.length && (
                <span
                  aria-hidden
                  className={`mx-3 w-12 border-t-2 ${
                    travelled(n) ? "border-solid border-brand" : "border-dashed border-border-strong"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
