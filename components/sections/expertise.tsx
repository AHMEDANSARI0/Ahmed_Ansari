import {
  Brain,
  Database,
  GitBranch,
  LayoutDashboard,
  Server,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { SectionShell } from "@/components/sections/section-shell";
import { TechnicalFrame } from "@/components/ui/technical-frame";
import type { AnimationConfig, AnimationType } from "@/lib/config/animation";
import type { SectionRecord } from "@/lib/services/content";

const icons: Record<string, LucideIcon> = {
  brain: Brain,
  workflow: Workflow,
  server: Server,
  layout: LayoutDashboard,
  database: Database,
  "git-branch": GitBranch,
};

export type ExpertiseCategory = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  icon: string | null;
  items: string[];
};

export function Expertise({
  section,
  categories,
  animation,
  sectionType,
}: {
  section?: SectionRecord;
  categories: ExpertiseCategory[];
  animation: AnimationConfig;
  sectionType?: AnimationType;
}) {
  return (
    <SectionShell
      id="expertise"
      eyebrow={section?.eyebrow ?? "CAPABILITIES"}
      heading={section?.heading ?? "Capability map"}
      description={section?.description}
      animation={animation}
      animationType={sectionType}
    >
      <div className="stagger grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, index) => {
          const Icon = icons[category.icon ?? ""] ?? Brain;
          return (
            <TechnicalFrame
              key={category.id}
              className="group relative bg-ink p-5 transition-colors duration-300 hover:bg-card/60"
            >
              <div className="flex items-start justify-between">
                <Icon className="h-5 w-5 text-accent" />
                <span className="font-mono text-[10px] tabular-nums text-fg-dim">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-5 font-display text-base font-semibold uppercase tracking-wide text-fg">
                {category.title}
              </h3>
              {category.description ? (
                <p className="mt-2 text-[12.5px] leading-relaxed text-fg-dim">
                  {category.description}
                </p>
              ) : null}
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {category.items.map((item) => (
                  <li
                    key={item}
                    className="border border-line/80 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-muted transition-colors group-hover:border-line"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </TechnicalFrame>
          );
        })}
      </div>
    </SectionShell>
  );
}
