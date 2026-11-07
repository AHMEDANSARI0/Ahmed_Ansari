import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionShell } from "@/components/sections/section-shell";
import type { AnimationConfig, AnimationType } from "@/lib/config/animation";
import type { SectionRecord } from "@/lib/services/content";

export type ServiceCard = {
  id: string;
  title: string;
  summary: string;
  deliverables: string[];
  ctaLabel: string | null;
  ctaHref: string | null;
  priceLabel: string | null;
};

export function Services({
  section,
  services,
  animation,
  sectionType,
}: {
  section?: SectionRecord;
  services: ServiceCard[];
  animation: AnimationConfig;
  sectionType?: AnimationType;
}) {
  return (
    <SectionShell
      id="services"
      eyebrow={section?.eyebrow ?? "SECTION 05"}
      heading={section?.heading ?? "What I build"}
      description={section?.description}
      animation={animation}
      animationType={sectionType}
    >
      <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service, index) => (
          <article
            key={service.id}
            className="reveal reveal-fade-up group flex flex-col justify-between bg-ink p-5 transition-colors duration-300 hover:bg-card/50"
          >
            <div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] tabular-nums text-fg-dim">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {service.priceLabel ? (
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                    {service.priceLabel}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-4 font-display text-[15px] font-semibold uppercase leading-snug tracking-wide text-fg">
                {service.title}
              </h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-fg-muted">{service.summary}</p>
              {service.deliverables.length > 0 ? (
                <ul className="mt-4 space-y-1">
                  {service.deliverables.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-dim"
                    >
                      <span className="h-px w-3 bg-accent/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <Link
              href={service.ctaHref ?? "#contact"}
              className="mt-6 inline-flex items-center gap-1.5 border-t border-line/70 pt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted transition-colors group-hover:text-accent"
            >
              {service.ctaLabel ?? "Discuss this"}
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
