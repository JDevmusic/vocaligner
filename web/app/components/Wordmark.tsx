import Link from "next/link";

export function Wordmark() {
  return (
    <Link
      href="/"
      className="text-sm font-semibold tracking-[0.2em] text-muted uppercase transition-opacity hover:opacity-70"
    >
      VocAligner
    </Link>
  );
}
