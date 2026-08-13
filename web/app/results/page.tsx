"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AnimatedButton } from "../components/AnimatedButton";
import { PluginChainVisual } from "../components/PluginChainVisual";
import { Wordmark } from "../components/Wordmark";
import { buildResearchSummary } from "@/lib/format/researchSummary";
import { vocalChainResponseSchema, type VocalChainResponse } from "@/lib/schema/vocalChain";

// Tags a fetch result with the id it was fetched for, so staleness (an id
// change while a previous id's result is still in state) can be detected by
// comparing `result.id` against the current `id` at render time, instead of
// needing to reset state synchronously inside the effect.
type FetchResult =
  | { id: string; status: "ready"; response: VocalChainResponse }
  | { id: string; status: "error" };

// Shared full-screen shell for the two non-content states below (loading /
// nothing-here). Both need the same gradient background + centered Wordmark;
// only the message and any action button differ.
function ResultsStatusShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="results-gradient flex min-h-screen flex-1 flex-col items-center justify-center px-6 text-center">
      <Wordmark className="text-white/70" />
      {children}
    </div>
  );
}

function NothingHereState() {
  return (
    <ResultsStatusShell>
      <p className="mt-8 text-lg font-medium text-white sm:text-xl">
        We couldn&apos;t find that result.
      </p>
      <AnimatedButton
        title="Back to Home"
        href="/"
        className="mt-6 text-sm font-medium text-white/70 underline underline-offset-4 hover:text-white"
      >
        Back to Home
      </AnimatedButton>
    </ResultsStatusShell>
  );
}

function LoadingState() {
  return (
    <ResultsStatusShell>
      <p className="mt-8 text-lg font-medium text-white sm:text-xl">Loading your results&hellip;</p>
    </ResultsStatusShell>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [result, setResult] = useState<FetchResult | null>(null);

  useEffect(() => {
    if (!id) return;
    const resolvedId = id;
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/generate/${encodeURIComponent(resolvedId)}`);
        if (!response.ok) {
          if (!cancelled) setResult({ id: resolvedId, status: "error" });
          return;
        }

        const body: unknown = await response.json();
        const parsed = vocalChainResponseSchema.safeParse(body);
        if (!parsed.success) {
          if (!cancelled) setResult({ id: resolvedId, status: "error" });
          return;
        }

        if (!cancelled) setResult({ id: resolvedId, status: "ready", response: parsed.data });
      } catch {
        if (!cancelled) setResult({ id: resolvedId, status: "error" });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // `result.id !== id` covers both "no fetch has resolved yet" and "id changed
  // since the last fetch resolved" — both should show the loading state rather
  // than a stale previous result, and this is derived at render time instead of
  // needing a synchronous reset inside the effect above.
  if (!id) return <NothingHereState />;
  if (!result || result.id !== id) return <LoadingState />;
  if (result.status === "error") return <NothingHereState />;

  const { input, chain } = result.response;
  const { leadParagraph, bullets } = buildResearchSummary(result.response);

  return (
    <div className="results-gradient flex min-h-screen flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center px-6 py-24 text-center sm:py-32">
        <Wordmark className="text-white/70" />

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Your Vocal Chain
        </h1>

        <p className="mt-4 text-lg text-white/70">
          For &ldquo;{input.song}&rdquo; by {input.artist}
        </p>

        <section className="mt-10 max-w-2xl text-left">
          <span className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase">What we found</span>
          <p className="mt-3 text-base leading-relaxed text-white/80 sm:text-lg">{leadParagraph}</p>
          {bullets.length > 0 && (
            <ul className="mt-5 flex flex-col gap-3">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3 text-sm leading-relaxed text-white/60 sm:text-base">
                  <span className="mt-2 h-1 w-1 flex-none rounded-full bg-white/30" aria-hidden="true" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <PluginChainVisual plugins={chain.plugins} className="mt-12 flex w-full flex-col items-center gap-8" />

        <AnimatedButton
          title="Try Another Song"
          href="/"
          className="mt-12 rounded-lg border border-black/10 bg-white px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-black/[.03]"
        >
          Try Another Song
        </AnimatedButton>
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
