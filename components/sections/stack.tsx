import { SectionShell } from "@/components/sections/section-shell";
import { cn } from "@/lib/utils";
import type { AnimationConfig, AnimationType } from "@/lib/config/animation";
import type { SectionRecord } from "@/lib/services/content";

export type StackItem = {
  id: string;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  isFeatured: boolean;
  category: string;
};

export function Stack({
  section,
  items,
  animation,
  sectionType,
}: {
  section?: SectionRecord;
  items: StackItem[];
  animation: AnimationConfig;
  sectionType?: AnimationType;
}) {
  const groups = Array.from(new Set(items.map((item) => item.category)));

  return (
    <SectionShell
      id="stack"
      eyebrow={section?.eyebrow ?? "STACK"}
      heading={section?.heading ?? "Technology ecosystem"}
      description={section?.description}
      animation={animation}
      animationType={sectionType}
    >
      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group} className="grid gap-4 border-t border-line pt-5 lg:grid-cols-[220px_1fr]">
            <h3 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-fg-muted">
              {group}
            </h3>
            <ul className="stagger grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-4">
              {items
                .filter((item) => item.category === group)
                .map((item) => {
                  const body = (
                    <>
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rotate-45 border",
                          item.isFeatured
                            ? "border-accent bg-accent/60"
                            : "border-fg-dim bg-transparent",
                        )}
                      />
                      <span className="font-display text-[13px] uppercase tracking-wide text-fg">
                        {item.name}
                      </span>
                      {item.description ? (
                        <span className="mt-1 block text-[11px] leading-snug text-fg-dim">
                          {item.description}
                        </span>
                      ) : null}
                    </>
                  );

                  return (
                    <li key={item.id} className="bg-ink">
                      {item.websiteUrl ? (
                        <a
                          href={item.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-full flex-col justify-start p-3.5 transition-colors hover:bg-card/60"
                        >
                          {body}
                        </a>
                      ) : (
                        <div className="flex h-full flex-col justify-start p-3.5">{body}</div>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
