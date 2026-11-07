import { cn } from "@/lib/utils";

const tones = {
  neutral: "border-line bg-white/[0.03] text-fg-muted",
  accent: "border-accent/40 bg-accent/10 text-accent",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  danger: "border-red-500/40 bg-red-500/10 text-red-300",
  muted: "border-line bg-transparent text-fg-dim",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusDot({ tone = "success" }: { tone?: "success" | "warning" | "danger" }) {
  const color =
    tone === "success" ? "bg-emerald-400" : tone === "warning" ? "bg-amber-400" : "bg-red-400";
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className={cn("absolute inset-0 animate-ping opacity-60", color)} />
      <span className={cn("relative h-1.5 w-1.5", color)} />
    </span>
  );
}
