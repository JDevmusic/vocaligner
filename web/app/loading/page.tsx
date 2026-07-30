"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AnimatedButton } from "../components/AnimatedButton";
import { Wordmark } from "../components/Wordmark";

const PHASE_DURATION_MS = 900;

function buildPhases(artist: string): string[] {
  const artistLabel = artist || "the artist";
  return [
    `Researching ${artistLabel}'s vocal production`,
    "Reasoning through the mix",
    "Building your Logic Pro chain",
    "Validating plugin settings",
  ];
}

function LoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [error, setError] = useState(false);

  const artist = searchParams.get("artist") ?? "";
  const song = searchParams.get("song") ?? "";
  const phases = useMemo(() => buildPhases(artist), [artist]);

  // Purely visual: advances through the phase text/progress bar while the
  // real request is in flight, capping at the last phase rather than
  // looping. Stops once an error state is shown.
  useEffect(() => {
    if (error) return;

    const interval = setInterval(() => {
      setPhaseIndex((index) => Math.min(index + 1, phases.length - 1));
    }, PHASE_DURATION_MS);

    return () => clearInterval(interval);
  }, [phases.length, error]);

  // The real generation request, fired once on mount. Navigation only
  // happens once the response has actually arrived.
  useEffect(() => {
    let cancelled = false;

    async function generate() {
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artist, song }),
        });

        if (!response.ok) {
          if (!cancelled) setError(true);
          return;
        }

        const body = await response.json();
        if (!cancelled) router.push(`/results?id=${body.id}`);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    generate();

    return () => {
      cancelled = true;
    };
  }, [artist, song, router]);

  if (error) {
    return (
      <div className="hero-gradient flex min-h-screen flex-1 flex-col items-center justify-center px-6 text-center">
        <Wordmark />

        <p className="mt-8 text-lg font-medium text-foreground sm:text-xl">
          Something went wrong generating your vocal chain.
        </p>

        <AnimatedButton
          title="Try Again"
          onClick={() => router.push("/")}
          className="mt-6 text-sm font-medium text-muted underline underline-offset-4 hover:text-foreground"
        >
          Try again
        </AnimatedButton>
      </div>
    );
  }

  const progress = ((phaseIndex + 1) / phases.length) * 100;

  return (
    <div className="hero-gradient flex min-h-screen flex-1 flex-col items-center justify-center px-6 text-center">
      <Wordmark />

      <p className="mt-8 text-lg font-medium text-foreground sm:text-xl">{phases[phaseIndex]}</p>

      <div className="mt-6 flex w-48 flex-col items-center gap-2">
        <div className="h-1 w-full overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-brand-accent transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-medium tracking-wide text-muted uppercase">
          Step {phaseIndex + 1} of {phases.length}
        </span>
      </div>
    </div>
  );
}

export default function LoadingPage() {
  return (
    <Suspense fallback={null}>
      <LoadingContent />
    </Suspense>
  );
}
