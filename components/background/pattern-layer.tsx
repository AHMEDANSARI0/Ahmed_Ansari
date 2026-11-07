import { TriangleGrid } from "@/components/background/triangle-grid";
import type { PatternConfig } from "@/lib/config/background";

export function PatternLayer({
  config,
  className = "",
}: {
  config: PatternConfig;
  className?: string;
}) {
  if (!config.enabled || config.type === "none") return null;

  const visibility = config.showOnDesktop && config.showOnMobile
    ? "block"
    : config.showOnDesktop
      ? "hidden md:block"
      : config.showOnMobile
        ? "block md:hidden"
        : "hidden";

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${visibility} ${className}`}
      style={{ backgroundColor: config.backgroundColor }}
    >
      <div
        className="absolute inset-0"
        style={{
          maskImage: "radial-gradient(ellipse 120% 90% at 50% 30%, black 45%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 120% 90% at 50% 30%, black 45%, transparent 100%)",
        }}
      >
        <TriangleGrid config={config} />
      </div>
    </div>
  );
}
