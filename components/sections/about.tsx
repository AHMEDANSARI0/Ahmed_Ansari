import Image from "next/image";
import { Check } from "lucide-react";
import { SectionShell } from "@/components/sections/section-shell";
import { Reveal } from "@/components/motion/reveal";
import type { AnimationConfig, AnimationType } from "@/lib/config/animation";
import type { AboutContent } from "@/lib/config/sections";
import type { SectionRecord } from "@/lib/services/content";
import type { SiteSettingsValue } from "@/lib/config/site";

export function About({
  section,
  content,
  animation,
  sectionType,
  settings,
}: {
  section?: SectionRecord;
  content: AboutContent;
  animation: AnimationConfig;
  sectionType?: AnimationType;
  settings: SiteSettingsValue;
}) {
  const socials = settings.socialLinks.filter((link) => link.visible);

  return (
    <SectionShell
      id="about"
      eyebrow={section?.eyebrow ?? "SECTION 02"}
      heading={section?.heading ?? "Engineering that removes the busywork"}
      description={section?.description}
      animation={animation}
      animationType={sectionType}
    >
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal animation={animation} type="clip-path">
          <div className="relative">
            <div className="relative aspect-[5/6] w-full overflow-hidden border border-line bg-ink-soft">
              <Image
                src="/images/portrait-placeholder.jpg"
                alt="Ahmed Ansari"
                fill
                sizes="(max-width: 1024px) 90vw, 480px"
                className="object-cover object-top grayscale-[35%] contrast-[1.05]"
              />
              <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,5,5,0.85),transparent_60%)]" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                <div>
                  <p className="mono-label text-accent">PROFILE</p>
                  <p className="mt-1 font-display text-lg font-semibold uppercase tracking-wide">
                    {settings.siteName}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-dim">
                    {settings.role}
                  </p>
                </div>
                <span className="h-8 w-8 rotate-45 border border-accent/50" />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {socials.map((link) => (
                <a
                  key={link.platform}
                  href={link.url}
                  target={link.url.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center border border-line px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted transition-colors hover:border-accent/60 hover:text-accent"
                >
                  {link.label}
                </a>
              ))}
              {settings.cv.enabled && settings.cv.fileUrl ? (
                <a
                  href={settings.cv.fileUrl}
                  className="inline-flex h-8 items-center border border-accent/50 px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-accent"
                >
                  {settings.cv.label}
                </a>
              ) : null}
            </div>
          </div>
        </Reveal>

        <div className="flex flex-col justify-center">
          <Reveal animation={animation} type="word-reveal">
            <p className="font-display text-[clamp(1.15rem,2vw,1.5rem)] leading-relaxed text-fg">
              {content.philosophy}
            </p>
          </Reveal>

          <ul className="mt-8 space-y-3">
            {content.highlights.map((line, index) => (
              <Reveal key={line} animation={animation} type="fade-up" delay={0.08 * index}>
                <li className="flex items-start gap-3 border-l border-line pl-4">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  <span className="text-[13.5px] leading-relaxed text-fg-muted">{line}</span>
                </li>
              </Reveal>
            ))}
          </ul>

          <div className="mt-10 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3">
            {[
              { label: "Based in", value: settings.location },
              { label: "Focus", value: "AI + automation" },
              { label: "Availability", value: settings.availability.state },
            ].map((item) => (
              <div key={item.label} className="bg-ink px-4 py-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-fg-dim">
                  {item.label}
                </p>
                <p className="mt-1 text-[12.5px] capitalize text-fg">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
