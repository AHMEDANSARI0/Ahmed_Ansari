import Image from "next/image";
import { ParticlePortrait } from "@/components/portrait/particle-portrait";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { MagneticLink } from "@/components/motion/magnetic-link";
import { HeroTimeline } from "@/components/motion/hero-timeline";
import { TechnicalFrame } from "@/components/ui/technical-frame";
import { StatusDot } from "@/components/ui/badge";
import { AVAILABILITY_LABELS, type SiteSettingsValue } from "@/lib/config/site";
import type { AnimationConfig } from "@/lib/config/animation";
import type { HeroContent } from "@/lib/config/sections";
import type { PortraitConfig } from "@/lib/config/portrait";

function HighlightedHeading({ heading, highlights }: { heading: string; highlights: string[] }) {
  const lines = heading.split("\n");

  return (
    <>
      {lines.map((line, index) => (
        <span key={index} className="block">
          {line.split(" ").map((word, wordIndex) => {
            const clean = word.replace(/[.,]/g, "").toLowerCase();
            const isHighlighted = highlights.some((entry) => entry.toLowerCase().includes(clean));
            return (
              <span
                key={`${word}-${wordIndex}`}
                className={isHighlighted ? "text-accent" : undefined}
              >
                {word}
                {wordIndex < line.split(" ").length - 1 ? " " : ""}
              </span>
            );
          })}
        </span>
      ))}
    </>
  );
}

export function Hero({
  content,
  settings,
  animation,
  portrait,
  sectionType,
}: {
  content: HeroContent;
  settings: SiteSettingsValue;
  animation: AnimationConfig;
  portrait: PortraitConfig;
  sectionType?: import("@/lib/config/animation").AnimationType;
}) {
  const imageUrl = portrait.imageUrl ?? "/images/portrait-placeholder.jpg";
  const useParticles = portrait.visible && portrait.mode === "particles";

  return (
    <HeroTimeline enabled={animation.enabled} duration={animation.duration}>
    <section
      id="home"
      className="relative flex min-h-[calc(100svh-4rem)] flex-col justify-center px-4 pb-6 pt-10 sm:px-6 lg:px-10"
    >
      <TechnicalFrame className="relative flex min-h-[calc(100svh-8rem)] flex-col justify-between bg-ink/40 p-5 sm:p-8 lg:p-10 hero-scanline">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 amber-bloom opacity-70"
        />

        <div className="relative grid flex-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)] lg:gap-6">
          <div className="max-w-2xl">
            <div
              data-hero-line
              className={`inline-flex ${sectionType ? `reveal reveal-${sectionType}` : ""}`}
            >
              <span className="inline-flex items-center gap-2 border border-line/80 bg-ink/70 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rotate-45 bg-accent" />
                <span className="mono-label text-fg-muted">{content.eyebrow}</span>
              </span>
            </div>

            <h1
              data-hero-line
              className="mt-6 display-heading text-[clamp(2.35rem,6.6vw,calc(6rem*var(--hero-scale,1)))] uppercase leading-[0.92]"
            >
              <HighlightedHeading heading={content.heading} highlights={content.highlightWords} />
            </h1>

            <p
              data-hero-line
              className="mt-6 max-w-xl text-[15px] leading-relaxed text-fg-muted sm:text-base"
            >
              {content.description}
            </p>

            <div data-hero-line className="mt-8 flex flex-wrap items-center gap-3">
                <MagneticLink
                  href={content.primaryCta.href}
                  className="group inline-flex h-12 items-center gap-2 angular-clip bg-accent px-7 font-mono text-[11px] uppercase tracking-[0.18em] text-ink hover:bg-accent/90"
                >
                  {content.primaryCta.label}
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </MagneticLink>
                <MagneticLink
                  href={content.secondaryCta.href}
                  className="inline-flex h-12 items-center gap-2 border border-line px-7 font-mono text-[11px] uppercase tracking-[0.18em] text-fg transition-colors hover:border-accent/60 hover:text-accent"
                >
                  {content.secondaryCta.label}
                </MagneticLink>
            </div>
          </div>

          <div
            data-hero-line
            className="relative order-first flex items-end justify-center lg:order-none lg:justify-end"
          >
            <div className="relative w-full max-w-[460px]">
              <div
                aria-hidden
                className="absolute -inset-6 bg-[radial-gradient(50%_50%_at_60%_45%,rgba(255,148,24,0.16),transparent_72%)] blur-xl"
              />
              <div className="relative aspect-[4/5] w-full overflow-hidden border border-line/70 bg-ink-soft">
                {useParticles ? (
                  <>
                    {/* The sampled photograph stays underneath so the particle layer
                        never renders as a floating shape on an empty card. */}
                    <Image
                      src={imageUrl}
                      alt=""
                      aria-hidden
                      fill
                      priority
                      sizes="(max-width: 1024px) 90vw, 460px"
                      className="object-cover object-top opacity-[0.07]"
                    />
                    <ParticlePortrait
                      src={imageUrl}
                      preset={portrait.desktop}
                      mobilePreset={portrait.mobile}
                      trigger={portrait.trigger}
                      className="absolute inset-0"
                      label={`Portrait of Ahmed Ansari, ${portrait.desktop.density}% sampled`}
                    />
                  </>
                ) : (
                  <Image
                    src={imageUrl}
                    alt="Portrait of Ahmed Ansari"
                    fill
                    priority
                    sizes="(max-width: 1024px) 90vw, 460px"
                    className="object-cover object-top [mask-image:linear-gradient(to_bottom,black_62%,transparent_100%)]"
                  />
                )}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,5,5,0.9),transparent_55%)]"
                />
                <div aria-hidden className="absolute inset-0 hairline-grid opacity-25 mix-blend-overlay" />
                <span aria-hidden className="frame-tick frame-tick-tl" />
                <span aria-hidden className="frame-tick frame-tick-tr" />
                <span
                  aria-hidden
                  data-hero-scan
                  className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-accent/60"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-line/70 bg-ink/70 px-3 py-2 backdrop-blur-sm">
                  <span className="mono-label text-fg-dim">
                    {useParticles ? "PARTICLE LAYER / LIVE" : "PORTRAIT / STATIC"}
                  </span>
                  <span className="mono-label text-accent">REPLACE IN ADMIN</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-10 flex flex-col gap-4 border-t border-line/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {settings.availability.showIndicator ? (
              <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-fg">
                <StatusDot tone={settings.availability.state === "available" ? "success" : "warning"} />
                {AVAILABILITY_LABELS[settings.availability.state]}
              </span>
            ) : null}
            {content.hudLabels.map((item) => (
              <span
                key={item.label}
                className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-dim lg:inline-flex"
              >
                <span className="text-fg/40">{item.label}</span>
                <span className="h-px w-6 bg-line" />
                <span className="text-fg-muted">{item.value}</span>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden h-px w-24 bg-gradient-to-r from-transparent to-line sm:block" />
            <a
              href="#about"
              className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted transition-colors hover:text-accent"
            >
              {content.scrollLabel}
              <ArrowDownRight className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" />
            </a>
          </div>
        </div>
      </TechnicalFrame>
    </section>
    </HeroTimeline>
  );
}
