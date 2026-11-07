"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error.message);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-lg border border-line bg-ink-soft/60 p-10 angular-clip">
        <p className="mono-label text-accent">SYSTEM FAULT</p>
        <h1 className="mt-4 text-3xl font-semibold">Something broke on this request</h1>
        <p className="mt-3 text-sm text-fg-muted">
          The error was logged. You can retry, or return to the homepage.
        </p>
        <button
          onClick={reset}
          className="mt-8 inline-flex h-11 items-center border border-accent bg-accent px-6 mono-label text-ink"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
