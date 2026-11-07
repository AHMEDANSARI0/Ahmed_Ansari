import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="mono-label text-accent">{eyebrow}</p> : null}
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-fg">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-fg-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("border border-line bg-card/40", className)}>
      {title ? (
        <header className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
          <div>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted">
              {title}
            </h2>
            {description ? <p className="mt-1 text-[12px] text-fg-dim">{description}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "accent" | "muted";
}) {
  return (
    <div className="border border-line bg-card/40 px-4 py-3.5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-dim">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-2xl font-semibold tabular-nums",
          tone === "accent" ? "text-accent" : tone === "muted" ? "text-fg-dim" : "text-fg",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-fg-dim">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-line px-6 py-14 text-center">
      <p className="text-sm font-medium text-fg">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-[12px] text-fg-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
