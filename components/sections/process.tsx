import { SectionShell } from "@/components/sections/section-shell";
import type { AnimationConfig, AnimationType } from "@/lib/config/animation";
import type { ProcessStep, SectionRecord } from "@/lib/services/content";

export function Process({
  section,
  steps,
  animation,
  sectionType,
}: {
  section?: SectionRecord;
  steps: ProcessStep[];
  animation: AnimationConfig;
  sectionType?: AnimationType;
}) {
  return (
    <SectionShell
      id="process"
      eyebrow={section?.eyebrow ?? "PROCESS"}
      heading={section?.heading ?? "How the work happens"}
      description={section?.description}
      animation={animation}
      animationType={sectionType}
    >
      <ol className="stagger relative grid gap-px bg-line md:grid-cols-5">
        {steps.map((step, index) => (
          <li key={step.step} className="group relative bg-ink p-5">
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl font-bold tabular-nums text-accent/80">
                {step.step}
              </span>
              {index < steps.length - 1 ? (
                <span aria-hidden className="hidden h-px flex-1 bg-line md:block" />
              ) : null}
            </div>
            <h3 className="mt-5 font-display text-sm font-semibold uppercase tracking-[0.16em] text-fg">
              {step.title}
            </h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-fg-muted">{step.description}</p>
            <span
              aria-hidden
              className="absolute bottom-0 left-0 h-px w-0 bg-accent transition-all duration-500 group-hover:w-full"
            />
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}
