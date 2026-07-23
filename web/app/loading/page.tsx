"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
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

  const artist = searchParams.get("artist") ?? "";
  const phases = useMemo(() => buildPhases(artist), [artist]);

  useEffect(() => {
    const isLastPhase = phaseIndex >= phases.length - 1;

    const timeout = setTimeout(() => {
      if (isLastPhase) {
        const song = searchParams.get("song") ?? "";
        const query = new URLSearchParams({ artist, song }).toString();
        router.push(`/results?${query}`);
        return;
      }

      setPhaseIndex((index) => index + 1);
    }, PHASE_DURATION_MS);

    return () => clearTimeout(timeout);
  }, [phaseIndex, phases.length, router, searchParams, artist]);

  const progress = ((phaseIndex + 1) / phases.length) * 100;

  return (
    <div className="hero-gradient flex min-h-screen flex-1 flex-col items-center justify-center px-6 text-center">
      <Wordmark />

      <p className="mt-8 text-lg font-medium text-foreground sm:text-xl">{phases[phaseIndex]}</p>

      <div className="mt-6 flex w-48 flex-col items-center gap-2">
        <div className="h-1 w-full overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
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
