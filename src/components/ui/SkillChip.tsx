import { Check, Route, X } from "lucide-react";

type Tone = "neutral" | "matched" | "missing";

const tones: Record<Tone, string> = {
  neutral: "bg-brand-tint text-brand-text",
  matched: "bg-match-bg text-match-text",
  missing: "bg-missing-bg text-missing-text",
};

interface Props {
  label: string;
  tone?: Tone;
  /** Renders a remove button with a 44px hit area. */
  onRemove?: () => void;
  removeLabel?: string;
  /** "lg" for the user's own skills on Review, so they outweigh the suggestions. */
  size?: "md" | "lg";
  /** Not asked for by any listing: dashed outline, plus screen-reader text from unknownLabel. */
  unknown?: boolean;
  unknownLabel?: string;
}

export function SkillChip({ label, tone = "neutral", onRemove, removeLabel, size = "md", unknown = false, unknownLabel }: Props) {
  const sizing = size === "lg" ? "min-h-11 pl-4 text-base font-medium" : "min-h-7 pl-3 text-sm";
  const outline = unknown ? "border border-dashed border-border-strong" : "";
  const end = onRemove ? "pr-0" : size === "lg" ? "pr-4" : "pr-3";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${sizing} ${end} ${unknown ? "bg-surface text-text" : tones[tone]} ${outline}`}>
      {tone === "matched" && <Check aria-hidden className="size-3.5" />}
      {tone === "missing" && <Route aria-hidden className="size-3.5" />}
      {label}
      {unknown && unknownLabel && <span className="sr-only"> ({unknownLabel})</span>}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className={`${size === "lg" ? "" : "-my-2"} inline-flex size-11 items-center justify-center rounded-full`}
        >
          <X aria-hidden className="size-3.5" />
        </button>
      )}
    </span>
  );
}
