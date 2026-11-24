import { useId } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  label: string;
  helper?: string;
  error?: string;
  multiline?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement> &
    React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
      ref?: React.Ref<HTMLInputElement & HTMLTextAreaElement>;
    };
}

export const inputClass = (error = false, multiline = false) =>
  `w-full rounded-lg border bg-surface px-3 text-base text-text placeholder:text-muted ${
    error ? "border-danger" : "border-border-strong"
  } ${multiline ? "min-h-24 py-2" : "min-h-11"}`;

/** Labeled input/textarea with helper text and an icon + text error (never color alone). */
export function Field({ label, helper, error, multiline, inputProps = {} }: Props) {
  const id = useId();
  const helperId = `${id}-h`;
  const errorId = `${id}-e`;
  const describedBy = [helper && helperId, error && errorId].filter(Boolean).join(" ") || undefined;
  const cls = inputClass(Boolean(error), multiline);
  const common = { id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy, className: cls };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
      </label>
      {multiline ? (
        <textarea {...common} {...inputProps} />
      ) : (
        <input {...common} {...inputProps} />
      )}
      {helper && (
        <p id={helperId} className="text-sm text-muted">
          {helper}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-sm text-danger">
          <AlertCircle aria-hidden className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
