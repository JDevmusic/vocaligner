"use client";

import { useState } from "react";

interface ComparisonResult {
  modelId: string;
  label: string;
  status: "ok" | "error";
  durationMs: number;
  usage?: { inputTokens: number; outputTokens: number };
  costUsd?: number;
  chainSummary?: {
    processingIntentCount: number;
    pluginCount: number;
    validationStatus: string;
  };
  errorMessage?: string;
}

function formatCost(costUsd: number | undefined): string {
  if (costUsd === undefined) return "--";
  return `$${costUsd.toFixed(4)}`;
}

// Internal tool, deliberately not linked from the landing page -- see the AD-9 note
// in app/api/compare/route.ts for why this is allowed to call the AI pipeline directly.
export default function ComparePage() {
  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");
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
        body: JSON.stringify({ artist: artist.trim(), song: song.trim() }),
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

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 text-foreground">
      <h1 className="text-2xl font-semibold">Model Comparison (internal tool)</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Runs the same real generation request against every configured model side by side. Each
        run is real and billed -- this makes one paid call per model listed below, every time.
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
            placeholder="e.g. Tame Impala"
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
            placeholder="e.g. The Less I Know The Better"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !artist.trim() || !song.trim()}
          className="rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background disabled:opacity-40"
        >
          {loading ? "Running all models..." : "Compare"}
        </button>
      </form>

      {error && <p className="mt-6 text-sm text-red-500">{error}</p>}

      {results && (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {results.map((r) => (
            <div key={r.modelId} className="rounded-xl border border-foreground/[0.1] p-5">
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

              <p className="mt-1 text-xs text-foreground/50">{(r.durationMs / 1000).toFixed(1)}s</p>

              {r.status === "ok" ? (
                <dl className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-foreground/60">Processing intents</dt>
                    <dd>{r.chainSummary?.processingIntentCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground/60">Plugins</dt>
                    <dd>{r.chainSummary?.pluginCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground/60">Validation</dt>
                    <dd>{r.chainSummary?.validationStatus}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground/60">Tokens (in / out)</dt>
                    <dd>
                      {r.usage?.inputTokens} / {r.usage?.outputTokens}
                    </dd>
                  </div>
                  <div className="flex justify-between font-medium">
                    <dt>Estimated cost</dt>
                    <dd>{formatCost(r.costUsd)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-4 text-sm text-red-500">{r.errorMessage}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
