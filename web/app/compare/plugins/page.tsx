"use client";

import { useState } from "react";
import { PluginChainVisual } from "../../components/PluginChainVisual";
import type { VocalChainResponse } from "@/lib/schema/vocalChain";

// Fixed to exactly the two models under active evaluation (see comparisonModels.ts) --
// this is a one-off visual comparison tool for that decision, not a general model picker.
const MODEL_IDS = ["anthropic-sonnet-5", "gpt-5.6-luna"];

interface ComparisonResult {
  modelId: string;
  label: string;
  status: "ok" | "error";
  durationMs: number;
  usage?: { inputTokens: number; outputTokens: number };
  costUsd?: number;
  response?: VocalChainResponse;
  errorMessage?: string;
}

function formatCost(costUsd: number | undefined): string {
  if (costUsd === undefined) return "--";
  return `$${costUsd.toFixed(4)}`;
}

function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

// Internal tool, deliberately not linked from the landing page -- same AD-9 basis as
// app/api/compare/route.ts, which this page calls with a `models` filter so it only pays
// for the two models being visually compared, not every configured comparison model.
export default function ComparePluginsPage() {
  const [artist, setArtist] = useState("Tame Impala");
  const [song, setSong] = useState("The Less I Know The Better");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ComparisonResult[] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!artist.trim() || !song.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artist: artist.trim(), song: song.trim(), models: MODEL_IDS }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const totalCostUsd = results
    ?.filter((r) => r.status === "ok")
    .reduce((sum, r) => sum + (r.costUsd ?? 0), 0);
  const totalDurationMs = results ? Math.max(...results.map((r) => r.durationMs)) : undefined;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-12 text-foreground">
      <h1 className="text-2xl font-semibold">Plugin Chain Comparison (internal tool)</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Runs the real pipeline for exactly two models -- Claude Sonnet 5 (Anthropic) and GPT-5.6
        Luna (via OpenRouter) -- side by side, so the resulting plugin chains can be compared
        visually, not just by summary stats. Each run is real and billed for both models.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wide text-foreground/50" htmlFor="artist">
            Artist
          </label>
          <input
            id="artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="mt-1 border-b-2 border-foreground/30 bg-transparent px-1 py-1 outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-foreground/50" htmlFor="song">
            Song
          </label>
          <input
            id="song"
            value={song}
            onChange={(e) => setSong(e.target.value)}
            className="mt-1 border-b-2 border-foreground/30 bg-transparent px-1 py-1 outline-none focus:border-foreground"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !artist.trim() || !song.trim()}
          className="rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background disabled:opacity-40"
        >
          {loading ? "Running both models..." : "Compare"}
        </button>
      </form>

      {error && <p className="mt-6 text-sm text-red-500">{error}</p>}

      {results && (
        <>
          <div className="mt-10 rounded-xl border border-foreground/[0.1] p-5 text-sm">
            <div className="flex justify-between font-medium">
              <span>Total cost, this trial</span>
              <span>{formatCost(totalCostUsd)}</span>
            </div>
            <div className="mt-1 flex justify-between text-foreground/60">
              <span>Wall-clock time (slower of the two, run in parallel)</span>
              <span>{totalDurationMs !== undefined ? formatSeconds(totalDurationMs) : "--"}</span>
            </div>
          </div>

          {/* Stacked, not side-by-side: these plugin cards are fixed-design-width
              (~1000-1250px) and their internal layout (fixed knob sizes, fixed padding)
              doesn't shrink to fit a narrower box the way the outer card's maxWidth:100%
              does -- a 2-column grid squeezed each card into ~650px and silently clipped
              whichever section landed rightmost, regardless of which plugin it was. Full
              width, one model's chain after the other, is the same rendering context the
              real results page already uses without this problem. */}
          <div className="mt-6 flex flex-col gap-16">
            {results.map((r) => (
              <div key={r.modelId}>
                <div className="rounded-xl border border-foreground/[0.1] p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-medium">{r.label}</h2>
                    <span
                      className={
                        r.status === "ok"
                          ? "rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-600"
                          : "rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-600"
                      }
                    >
                      {r.status === "ok" ? "OK" : "Failed"}
                    </span>
                  </div>

                  {r.status === "ok" ? (
                    <dl className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-foreground/60">Time</dt>
                        <dd>{formatSeconds(r.durationMs)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-foreground/60">Tokens (in / out)</dt>
                        <dd>
                          {r.usage?.inputTokens} / {r.usage?.outputTokens}
                        </dd>
                      </div>
                      <div className="flex justify-between font-medium">
                        <dt>Cost</dt>
                        <dd>{formatCost(r.costUsd)}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="mt-3 text-sm text-red-500">{r.errorMessage}</p>
                  )}
                </div>

                {r.status === "ok" && r.response && (
                  <PluginChainVisual
                    plugins={r.response.chain.plugins}
                    className="mt-6 flex w-full flex-col items-center gap-6"
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
