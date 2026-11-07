import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";
import type { AnimationConfig, AnimationType } from "@/lib/config/animation";

export function SectionShell({
  id,
  eyebrow,
  heading,
  description,
  children,
  animation,
  animationType = "fade-up",
  className,
  aside,
}: {
  id: string;
  eyebrow?: string | null;
  heading?: string | null;
  description?: string | null;
  children: React.ReactNode;
  animation: AnimationConfig;
  animationType?: AnimationType;
  className?: string;
  aside?: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("relative px-4 section-gap sm:px-6 lg:px-10", className)}>
      <div className="mx-auto w-full max-w-[var(--container-width,1400px)]">
        {(eyebrow || heading || description) && (
          <div className="mb-8 flex flex-col gap-6 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              {eyebrow ? (
                <Reveal animation={animation} type={animationType ?? "fade-up"}>
                  <div className="flex items-center gap-3">
                    <span className="h-px w-8 bg-accent/70" />
                    <span className="mono-label text-accent">{eyebrow}</span>
                  </div>
                </Reveal>
              ) : null}
              {heading ? (
                <Reveal animation={animation} type={animationType ?? "mask-reveal"} delay={0.05}>
                  <h2 className="mt-4 display-heading text-[clamp(1.75rem,3.6vw,2.9rem)] uppercase leading-tight">
                    {heading}
                  </h2>
                </Reveal>
              ) : null}
              {description ? (
                <Reveal animation={animation} type="fade-up" delay={0.1}>
                  <p className="mt-4 text-[14.5px] leading-relaxed text-fg-muted">{description}</p>
                </Reveal>
              ) : null}
            </div>
            {aside}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export function sectionAnimation(animation: AnimationConfig, key: string): AnimationType {
  const value = animation.sections[key];
  const allowed: AnimationType[] = [
    "fade-up",
    "mask-reveal",
    "word-reveal",
    "char-reveal",
    "stagger-grid",
    "clip-path",
    "none",
  ];
  return allowed.includes(value as AnimationType) ? (value as AnimationType) : "fade-up";
}
