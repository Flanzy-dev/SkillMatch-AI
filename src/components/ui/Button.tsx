import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white hover:brightness-110 disabled:bg-border disabled:text-muted",
  secondary:
    "border border-border-strong bg-surface text-text hover:bg-brand-tint disabled:border-border disabled:text-muted",
  ghost: "text-brand-text hover:bg-brand-tint disabled:text-muted",
};

export const buttonClass = (variant: ButtonVariant = "primary") =>
  `${base} ${variants[variant]}`;

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  loadingLabel?: string;
}

export function Button({
  variant = "primary",
  loading = false,
  loadingLabel,
  disabled,
  children,
  className = "",
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${buttonClass(variant)} ${className}`}
      {...rest}
    >
      {loading && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}
