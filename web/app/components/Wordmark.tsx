import Link from "next/link";

export function Wordmark({ className = "text-muted" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`text-sm font-semibold tracking-[0.2em] uppercase transition-opacity hover:opacity-70 ${className}`}
    >
      VocAligner
    </Link>
  );
}
