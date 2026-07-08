"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const PHASES = [
  "Analysing Vocal Production",
  "Identifying EQ profile",
  "Building Compressor check",
  "Generating Logic settings",
];

const PHASE_DURATION_MS = 900;

function LoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const isLastPhase = phaseIndex >= PHASES.length - 1;

    const timeout = setTimeout(() => {
      if (isLastPhase) {
        const artist = searchParams.get("artist") ?? "";
        const song = searchParams.get("song") ?? "";
        const query = new URLSearchParams({ artist, song }).toString();
        router.push(`/results?${query}`);
        return;
      }

      setPhaseIndex((index) => index + 1);
    }, PHASE_DURATION_MS);

    return () => clearTimeout(timeout);
  }, [phaseIndex, router, searchParams]);

  const progress = ((phaseIndex + 1) / PHASES.length) * 100;

  return (
    <div className="hero-gradient flex min-h-screen flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="text-lg font-medium text-foreground sm:text-xl">
        {PHASES[phaseIndex]}
      </p>
      <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
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
