"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Wordmark } from "../components/Wordmark";
import { pluginRegistry } from "@/lib/registry/pluginRegistry";

const PREVIEW_PLUGIN_IDS = [
  "logic-pro.channel-eq",
  "logic-pro.compressor",
  "logic-pro.chromaverb",
  "logic-pro.pitch-correction",
];

const CATEGORY_LABELS: Record<string, string> = {
  eq: "EQ",
  dynamics: "Dynamics",
  "de-esser": "De-Esser",
  space: "Space",
  pitch: "Pitch",
  character: "Character",
  other: "Other",
};

function formatParameterLabel(parameter: string): string {
  const withSpaces = parameter.replace(/([a-z])([A-Z])/g, "$1 $2");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const artist = searchParams.get("artist");
  const song = searchParams.get("song");

  const previewPlugins = PREVIEW_PLUGIN_IDS.map((id) => pluginRegistry.getById(id)).filter(
    (plugin) => plugin !== undefined
  );

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center px-6 py-24 text-center sm:py-32">
        <Wordmark />

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Your Vocal Chain
        </h1>

        {artist && song ? (
          <p className="mt-4 text-lg text-muted">
            For &ldquo;{song}&rdquo; by {artist}
          </p>
        ) : null}

        <p className="mt-6 max-w-md text-sm text-supporting">
          We&apos;re building the full generation pipeline. Here&apos;s a preview of how your
          chain will be presented.
        </p>

        <div className="mt-12 flex w-full max-w-2xl flex-col gap-4">
          {previewPlugins.map((plugin, index) => (
            <div
              key={plugin.id}
              className="flex flex-col gap-4 rounded-2xl border border-black/5 bg-white p-6 text-left shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 text-sm font-semibold text-foreground">
                  {index + 1}
                </span>
                <div>
                  <p className="text-base font-semibold text-foreground">{plugin.displayName}</p>
                  <p className="text-sm text-muted">{CATEGORY_LABELS[plugin.category] ?? plugin.category}</p>
                </div>
              </div>

              <div className="flex gap-6 pl-12 sm:pl-0">
                {plugin.controls.slice(0, 2).map((control) => (
                  <div key={control.parameter} className="text-left">
                    <p className="text-xs font-medium tracking-wide text-muted uppercase">
                      {formatParameterLabel(control.parameter)}
                    </p>
                    <p className="mt-1 text-sm font-medium text-black/20">—</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
