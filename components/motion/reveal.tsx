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

/**
 * Splits text into animated spans. The CSS in globals.css animates `.reveal-word >
 * span` and `.reveal-char > span`, so the markup has to exist for those modes to
 * do anything at all.
 */
function splitWords(text: string) {
  return text.split(/(\s+)/).filter((part) => part.trim().length > 0);
}

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

  // Intensity scales how long the reveal takes. The CSS reads --reveal-duration.
  const duration = Math.max(180, Math.round(animation.duration * 1000 * animation.intensity));
  const base = {
    "--reveal-duration": `${duration}ms`,
    "--reveal-delay": `${delay * 1000 + animation.delay * 1000}ms`,
    ...style,
  } as CSSProperties;

  const modifiers = ["reveal", `reveal-${type}`].filter(Boolean).join(" ");

  // Word and character reveals need one element per fragment. Anything that is not
  // a plain string falls back to the container animation rather than losing content.
  const isTextual = typeof children === "string";
  const splitMode = isTextual && (type === "word-reveal" || type === "char-reveal");

  if (splitMode && type === "word-reveal") {
    return (
      <Tag className={cn(modifiers, className)} style={base}>
        {splitWords(children as string).map((word, index) => (
          <span key={`${word}-${index}`}>
            <span>{word}</span>
            {" "}
          </span>
        ))}
      </Tag>
    );
  }

  if (splitMode && type === "char-reveal") {
    const text = children as string;
    return (
      <Tag className={cn(modifiers, className)} style={base} aria-label={text}>
        {Array.from(text).map((char, index) => (
          <span key={`${char}-${index}`} aria-hidden>
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag className={cn(modifiers, className)} style={base}>
      {children}
    </Tag>
  );
}

export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("stagger", className)}>{children}</div>;
}
