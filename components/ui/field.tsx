import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

const baseControl =
  "w-full bg-ink px-3.5 text-sm text-fg placeholder:text-fg-dim border border-line transition-colors duration-150 focus:border-accent/70 focus:outline-none disabled:opacity-50";

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
};

export function Field({ label, hint, error, required, children, htmlFor, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted"
      >
        {label}
        {required ? <span className="text-accent">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] text-red-400">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-fg-dim">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(baseControl, "h-10", className)} {...props} />;
});

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(baseControl, "resize-y py-2.5", className)}
      {...props}
    />
  );
});

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[];
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, options, ...props },
  ref,
) {
  return (
    <select ref={ref} className={cn(baseControl, "h-10 pr-8", className)} {...props}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});

export function Switch({
  checked,
  onChange,
  label,
  description,
  id,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  id?: string;
}) {
  const generated = useId();
  const switchId = id ?? generated;
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="space-y-0.5">
        <label htmlFor={switchId} className="text-sm text-fg">
          {label}
        </label>
        {description ? <p className="text-[11px] text-fg-dim">{description}</p> : null}
      </div>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 border transition-colors",
          checked ? "border-accent/60 bg-accent/25" : "border-line bg-ink",
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 h-3 w-3 -translate-y-1/2 transition-all",
            checked ? "left-[calc(100%-16px)] bg-accent" : "left-1.5 bg-fg-dim",
          )}
        />
      </button>
    </div>
  );
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  suffix?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-2 py-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm text-fg">
          {label}
        </label>
        <span className="font-mono text-[11px] text-accent">
          {value}
          {suffix}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1 w-full cursor-pointer appearance-none bg-line accent-accent"
      />
    </div>
  );
}
