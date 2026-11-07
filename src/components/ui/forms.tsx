import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cx } from "./primitives";

const FIELD = "w-full border border-line rounded-control bg-white text-sm text-ink outline-none transition-colors focus:border-brand placeholder:text-muted disabled:bg-surface";

type FieldProps = { label: string; hint?: string; error?: string | null; hideLabel?: boolean; children: (p: { id: string; describedBy?: string; invalid: boolean }) => ReactNode };

export function Field({ label, hint, error, hideLabel, children }: FieldProps) {
  const id = useId();
  const msgId = `${id}-msg`;
  const describedBy = error || hint ? msgId : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={cx("text-xs font-medium text-body", hideLabel && "sr-only")}>
        {label}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {(error || hint) && (
        <p id={msgId} role={error ? "alert" : undefined} className={cx("text-xs", error ? "text-bad" : "text-body")}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string | null; hideLabel?: boolean };
export function Input({ label, hint, error, hideLabel, className, ...rest }: InputProps) {
  return (
    <Field label={label} hint={hint} error={error} hideLabel={hideLabel}>
      {({ id, describedBy, invalid }) => <input id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} className={cx(FIELD, "h-10 px-3", invalid && "border-bad", className)} {...rest} />}
    </Field>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string | null; hideLabel?: boolean };
export function Textarea({ label, hint, error, hideLabel, className, ...rest }: TextareaProps) {
  return (
    <Field label={label} hint={hint} error={error} hideLabel={hideLabel}>
      {({ id, describedBy, invalid }) => <textarea id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} className={cx(FIELD, "p-4 leading-relaxed resize-y", invalid && "border-bad", className)} {...rest} />}
    </Field>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; hideLabel?: boolean; options: { value: string; label: string }[] };
export function Select({ label, hideLabel, options, className, ...rest }: SelectProps) {
  return (
    <Field label={label} hideLabel={hideLabel}>
      {({ id }) => (
        <select id={id} className={cx(FIELD, "h-10 px-3", className)} {...rest}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
