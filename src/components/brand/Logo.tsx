import { useTranslations } from "next-intl";

/**
 * The SkillMatch AI mark: the "S" drawn as a learning route. Solid for the way
 * travelled, dotted for the road ahead, an amber stop for the destination.
 * Colors come from tokens, so it follows the light and dark themes.
 */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden focusable="false" className={className}>
      <path
        d="M9 26 H18 A5 5 0 0 0 18 16 H16"
        fill="none"
        className="stroke-brand-text"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 16 H14 A5 5 0 0 1 14 6 H20"
        fill="none"
        className="stroke-border-strong"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="0.1 4.4"
      />
      <circle cx={9} cy={26} r={3} className="fill-brand-text" />
      <circle cx={24} cy={6} r={3.6} className="fill-accent" />
    </svg>
  );
}

/** Mark plus wordmark. The name is live text from `Common.brand`, so a rename is one string. */
export function Logo({
  markClassName = "size-8",
  wordmarkClassName = "text-xl",
}: {
  markClassName?: string;
  /** Size, and on the narrowest phones sr-only, so the header never scrolls sideways. */
  wordmarkClassName?: string;
}) {
  const c = useTranslations("Common");
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark className={markClassName} />
      <span className={`whitespace-nowrap font-display font-extrabold tracking-[-0.02em] text-text ${wordmarkClassName}`}>
        {c("brand")}
      </span>
    </span>
  );
}
