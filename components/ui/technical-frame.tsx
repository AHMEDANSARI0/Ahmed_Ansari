import { cn } from "@/lib/utils";

type Tone = "line" | "line-soft" | "accent";

const toneClass: Record<Tone, string> = {
  line: "border-line",
  "line-soft": "border-line/60",
  accent: "border-accent/40",
};

export function TechnicalFrame({
  children,
  className,
  tone = "line",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: Tone;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative border",
        toneClass[tone],
        glow && "shadow-[0_0_0_1px_rgba(255,148,24,0.06),0_40px_120px_-60px_rgba(255,148,24,0.35)]",
        className,
      )}
    >
      <FrameTicks />
      {children}
    </div>
  );
}

export function FrameTicks() {
  return (
    <>
      <span aria-hidden className="frame-tick frame-tick-tl" />
      <span aria-hidden className="frame-tick frame-tick-tr" />
      <span aria-hidden className="frame-tick frame-tick-bl" />
      <span aria-hidden className="frame-tick frame-tick-br" />
    </>
  );
}

export function HairlineRule({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("h-px w-full bg-gradient-to-r from-line via-line/40 to-transparent", className)}
    />
  );
}

export function NotchDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      {label ? (
        <>
          <span className="h-1.5 w-1.5 rotate-45 border border-accent/60" />
          <span className="mono-label text-fg-dim">{label}</span>
          <span className="h-1.5 w-1.5 rotate-45 border border-accent/60" />
        </>
      ) : (
        <span className="h-1.5 w-1.5 rotate-45 border border-accent/60" />
      )}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
