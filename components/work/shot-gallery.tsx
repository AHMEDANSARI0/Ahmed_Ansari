"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type Shot = { url: string; alt: string; caption: string | null };

/**
 * Visible thumbnails with a keyboard lightbox: Escape closes, arrow keys move.
 * No dependency, focus is trapped by the dialog itself, and the scroll position
 * is restored when the overlay closes.
 */
export function ShotGallery({ shots }: { shots: Shot[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpenIndex(null);
    restoreFocus.current?.focus();
  }, []);

  const move = useCallback(
    (direction: -1 | 1) => {
      setOpenIndex((current) => {
        if (current === null || shots.length === 0) return current;
        return (current + direction + shots.length) % shots.length;
      });
    },
    [shots.length],
  );

  useEffect(() => {
    if (openIndex === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        move(1);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, close, move]);

  if (shots.length === 0) return null;

  const active = openIndex === null ? null : shots[openIndex];

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {shots.map((shot, index) => (
          <figure key={shot.url} className="border border-line">
            <button
              type="button"
              onClick={(event) => {
                restoreFocus.current = event.currentTarget;
                setOpenIndex(index);
              }}
              aria-label={`Open ${shot.alt} larger`}
              className="group relative block w-full overflow-hidden bg-ink-soft"
            >
              <span className="relative block aspect-[4/3] w-full">
                <Image
                  src={shot.url}
                  alt={shot.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 420px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </span>
              <span className="absolute bottom-2 right-2 border border-line bg-ink/80 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-fg-muted opacity-0 transition-opacity group-hover:opacity-100">
                expand
              </span>
            </button>
            {shot.caption ? (
              <figcaption className="border-t border-line px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-dim">
                {shot.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          className="fixed inset-0 z-[80] flex flex-col bg-ink/95 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-dim">
              {String((openIndex ?? 0) + 1).padStart(2, "0")} / {String(shots.length).padStart(2, "0")}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Close image"
              className="flex h-8 w-8 items-center justify-center border border-line text-fg-muted hover:text-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center p-4 sm:p-8">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous image"
              className="absolute left-2 flex h-10 w-10 items-center justify-center border border-line bg-ink/70 text-fg-muted hover:text-accent sm:left-6"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="relative h-full w-full max-w-5xl">
              <Image
                src={active.url}
                alt={active.alt}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next image"
              className="absolute right-2 flex h-10 w-10 items-center justify-center border border-line bg-ink/70 text-fg-muted hover:text-accent sm:right-6"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="border-t border-line px-4 py-3">
            <p className="text-[12.5px] text-fg-muted">{active.alt}</p>
            <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-fg-dim">
              esc to close · arrow keys to move
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
