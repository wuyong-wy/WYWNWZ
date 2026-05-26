import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-2 text-6xl font-bold text-[var(--color-primary)]">404</h1>
      <p className="mb-6 text-lg text-[var(--color-muted)]">Page not found</p>
      <Link
        href="/"
        className="rounded-md bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
      >
        Back to Home
      </Link>
    </div>
  );
}
