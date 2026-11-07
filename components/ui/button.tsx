import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.18em] transition-[transform,background-color,border-color,color] duration-200 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        solid: "bg-accent text-ink hover:bg-accent/90",
        outline: "border border-line text-fg hover:border-accent/60 hover:text-accent",
        ghost: "text-fg-muted hover:bg-white/5 hover:text-fg",
        dark: "border border-line bg-card text-fg hover:border-accent/50",
        danger: "border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-6",
        lg: "h-12 px-8",
        icon: "h-9 w-9",
      },
      shape: {
        angular: "angular-clip",
        square: "",
        pill: "rounded-full",
      },
    },
    defaultVariants: { variant: "solid", size: "md", shape: "angular" },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, shape, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size, shape }), className)}
      {...props}
    />
  );
});
