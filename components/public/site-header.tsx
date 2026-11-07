"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = { label: string; href: string };

export function SiteHeader({
  logoText,
  items,
  ctaLabel,
  ctaHref,
}: {
  logoText: string;
  items: NavItem[];
  ctaLabel: string;
  ctaHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = items
      .map((item) => item.href.replace("#", ""))
      .filter((id) => id.length > 0);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );

    for (const id of ids) {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled ? "border-line bg-ink/85 backdrop-blur-md" : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Home">
          <span className="relative flex h-6 w-6 items-center justify-center">
            <span className="absolute inset-0 rotate-45 border border-accent/70 transition-transform duration-500 group-hover:rotate-[135deg]" />
            <span className="h-1.5 w-1.5 bg-accent" />
          </span>
          <span className="font-display text-[13px] font-bold uppercase tracking-[0.34em] text-fg">
            {logoText}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "relative font-mono text-[11px] uppercase tracking-[0.2em] transition-colors",
                active === item.href ? "text-accent" : "text-fg-muted hover:text-fg",
              )}
            >
              {item.label}
              {active === item.href ? (
                <span className="absolute -top-3 left-1/2 h-1 w-1 -translate-x-1/2 rotate-45 bg-accent" />
              ) : null}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={ctaHref}
            className="hidden h-9 items-center border border-line px-4 font-mono text-[10px] uppercase tracking-[0.18em] text-fg transition-colors hover:border-accent/60 hover:text-accent sm:inline-flex"
          >
            {ctaLabel}
          </a>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center border border-line text-fg-muted md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 bg-ink md:hidden">
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <span className="font-display text-[13px] font-bold uppercase tracking-[0.34em]">
              {logoText}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center border border-line text-fg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <nav className="flex flex-col px-4 py-6" aria-label="Mobile">
            {items.map((item, index) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between border-b border-line/60 py-4 font-display text-xl uppercase tracking-wide text-fg"
              >
                {item.label}
                <span className="mono-label text-fg-dim">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </a>
            ))}
            <a
              href={ctaHref}
              onClick={() => setOpen(false)}
              className="mt-6 inline-flex h-12 items-center justify-center angular-clip bg-accent font-mono text-[11px] uppercase tracking-[0.18em] text-ink"
            >
              {ctaLabel}
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
