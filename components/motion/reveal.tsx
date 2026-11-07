import type { CSSProperties, ElementType } from "react";
import type { AnimationConfig, AnimationType } from "@/lib/config/animation";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  type?: AnimationType;
  animation: AnimationConfig;
  as?: ElementType;
  delay?: number;
  className?: string;
  style?: CSSProperties;
};

export function Reveal({
  children,
  type = "fade-up",
  animation,
  as: Tag = "div",
  delay = 0,
  className,
  style,
}: RevealProps) {
  if (!animation.enabled || type === "none") {
    return (
      <Tag className={className} style={style}>
        {children}
      </Tag>
    );
  }

  const duration = Math.round(animation.duration * 1000) * animation.intensity;
  const base = {
    "--reveal-duration": `${Math.max(120, duration)}ms`,
    "--reveal-delay": `${delay * 1000 + animation.delay * 1000}ms`,
    ...style,
  } as CSSProperties;

  const modifiers = [animation.enabled ? "reveal" : "", `reveal-${type}`]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={cn(modifiers, className)} style={base}>
      {children}
    </Tag>
  );
}

export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("stagger", className)}>{children}</div>;
}
