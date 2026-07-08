"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResultsContent() {
  const searchParams = useSearchParams();
  const artist = searchParams.get("artist");
  const song = searchParams.get("song");

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center px-6 py-24 text-center sm:py-32">
        <span className="text-sm font-semibold tracking-[0.2em] text-muted uppercase">
          VocAligner
        </span>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Your Vocal Chain
        </h1>

        {artist && song ? (
          <p className="mt-4 text-lg text-muted">
            For &ldquo;{song}&rdquo; by {artist}
          </p>
        ) : null}

        <div className="mt-12 w-full max-w-xl rounded-2xl border border-black/5 bg-white p-10 shadow-sm">
          <p className="text-base text-supporting">
            We&apos;re building the full Logic Pro stock plugin breakdown for
            this pairing — EQ, compression and effects, matched to the vocal.
          </p>
        </div>

        <Link
          href="/"
          className="mt-10 rounded-lg border border-black/10 bg-white px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-black/[.03]"
        >
          Try Another Song
        </Link>
      </main>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={null}>
      <ResultsContent />
    </Suspense>
  );
}
