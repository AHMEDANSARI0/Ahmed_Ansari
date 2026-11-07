import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-lg border border-line bg-ink-soft/60 p-10 angular-clip">
        <p className="mono-label text-accent">404</p>
        <h1 className="mt-4 text-3xl font-semibold">Signal lost</h1>
        <p className="mt-3 text-sm text-fg-muted">
          The page you requested does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center border border-accent bg-accent px-6 mono-label text-ink"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
