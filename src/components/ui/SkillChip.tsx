import { Check, CircleAlert, X } from "lucide-react";

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
}

export function SkillChip({ label, tone = "neutral", onRemove, removeLabel, size = "md" }: Props) {
  const sizing = size === "lg" ? "min-h-11 pl-4 text-base font-medium" : "min-h-7 pl-3 text-sm";
  const end = onRemove ? "pr-0" : size === "lg" ? "pr-4" : "pr-3";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${sizing} ${end} ${tones[tone]}`}>
      {tone === "matched" && <Check aria-hidden className="size-3.5" />}
      {tone === "missing" && <CircleAlert aria-hidden className="size-3.5" />}
      {label}
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
