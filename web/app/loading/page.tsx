"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "motion/react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AnimatedButton } from "../components/AnimatedButton";
import { Wordmark } from "../components/Wordmark";
import { EASE } from "../components/motion-shared";

// A real generation is 3 sequential AI calls and can take anywhere from ~20s to over a
// minute -- there's no reliable way to know how far through it actually is. Rather than a
// fixed, non-looping step sequence that reaches "done" looking within a few seconds and
// then sits frozen for the rest of a much longer real wait (looks broken, not working),
// this cycles continuously through phrases describing plausible current activity for as
// long as the request is in flight, looping back to the start if it runs long. Loosely
// grounded in the pipeline's real stages (research, then reasoning, then generation) but
// deliberately not labelled as a literal, completable step count.
const PHASE_DURATION_MS = 2400;

function buildPhases(artist: string): string[] {
  const artistLabel = artist || "the artist";
  return [
    `Listening to ${artistLabel}'s vocal style`,
    "Studying the tone, dynamics and space",
    "Comparing it against real production techniques",
    "Weighing which plugins fit the sound",
    "Shaping the EQ curve",
    "Balancing the compression",
    "Finding the right amount of space",
    "Softening any harsh edges",
    "Adding warmth and character",
    "Checking settings against Logic Pro's real ranges",
    "Assembling the chain in signal order",
    "Double-checking every parameter",
  ];
}

function LoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [error, setError] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const artist = searchParams.get("artist") ?? "";
  const song = searchParams.get("song") ?? "";
  const phases = useMemo(() => buildPhases(artist), [artist]);

  // Purely visual: cycles through the phase text while the real request is in flight,
  // looping back to the start (modulo, not capped) so a longer-than-usual wait keeps
  // showing active phrases instead of sitting frozen on the last one. Stops once an
  // error state is shown; the phase index becomes irrelevant the moment navigation to
  // /results happens (the other effect below), so there's no "done" state to reach here.
  useEffect(() => {
    if (error) return;

    const interval = setInterval(() => {
      setPhaseIndex((index) => (index + 1) % phases.length);
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
        if (typeof body?.id !== "string" || body.id.length === 0) {
          if (!cancelled) setError(true);
          return;
        }

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
          title="Try again"
          href="/"
          className="mt-6 text-sm font-medium text-muted underline underline-offset-4 hover:text-foreground"
        >
          Try again
        </AnimatedButton>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="hero-gradient flex min-h-screen flex-1 flex-col items-center justify-center px-6 text-center">
        <Wordmark />

        {/* min-h (not a fixed h-) so a long artist name or a narrow viewport that wraps a
            phrase to two lines grows the box instead of overflowing it and colliding with
            the progress bar below -- the old fixed h-8/h-9 had no such guard. */}
        <div className="mt-8 flex min-h-14 items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={phaseIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="text-lg font-medium text-foreground sm:text-xl"
            >
              {phases[phaseIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mt-6 flex w-48 flex-col items-center gap-3">
          {/* Deliberately indeterminate (a calm opacity pulse, not a fill animation) --
              there's no reliable "percent done" for a real generation, and a bar that fills
              to 100% implies a false sense of completion the way the old fixed step count
              did. Opacity keyframes aren't a transform/layout value, so MotionConfig's
              reducedMotion="user" (above) doesn't neutralise them on its own -- explicitly
              swap to a static bar for reduced-motion users instead of pulsing at them for
              the whole (up to 60s+) wait. */}
          <div className="h-1 w-full overflow-hidden rounded-full bg-black/10">
            <motion.div
              className="h-full w-full rounded-full bg-brand-accent"
              animate={prefersReducedMotion ? { opacity: 0.6 } : { opacity: [0.3, 1, 0.3] }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
              }
            />
          </div>
          <span className="text-xs font-medium tracking-wide text-muted uppercase">
            Usually under a minute
          </span>
        </div>
      </div>
    </MotionConfig>
  );
}

export default function LoadingPage() {
  return (
    <Suspense fallback={null}>
      <LoadingContent />
    </Suspense>
  );
}
