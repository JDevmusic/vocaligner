import Link from "next/link";
import type { Metadata } from "next";
import { Wordmark } from "../components/Wordmark";
import { CHAIN_PREVIEW, HOW_IT_WORKS } from "../landing-copy";

// Throwaway design-exploration page. Delete after a direction is picked.

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DesignPreviewPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <style>{"html { scroll-behavior: smooth; }"}</style>
      <PreviewSwitcher />
      <DesignA />
      <DesignB />
      <DesignC />
    </div>
  );
}

function PreviewSwitcher() {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-6 border-b border-black/10 bg-white/90 py-2.5 text-xs font-medium text-zinc-500 backdrop-blur">
      <span className="text-zinc-400">Design preview — jump to:</span>
      <Link href="#design-a" className="hover:text-black">A · Sunset Editorial</Link>
      <Link href="#design-b" className="hover:text-black">B · Studio Console</Link>
      <Link href="#design-c" className="hover:text-black">C · Minimal Focus</Link>
    </div>
  );
}

function SectionLabel({ letter, name }: { letter: string; name: string }) {
  return (
    <div className="sticky top-10 z-10 px-4 pt-4 sm:px-6 sm:pt-6">
      <span className="inline-block rounded-full bg-black/80 px-3 py-1 text-[11px] font-semibold tracking-wide text-white">
        Design {letter} — {name}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Design A — "Sunset Editorial"
// A refined take on the current direction: full sunset gradient, large
// centered type, generous whitespace. Closest to today's DESIGN_SYSTEM.md.
// ---------------------------------------------------------------------------

function DesignA() {
  return (
    <section id="design-a" className="hero-gradient relative flex min-h-screen flex-col">
      <SectionLabel letter="A" name="Sunset Editorial" />
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center px-6 py-28 text-center sm:py-36">
        <Wordmark />

        <h1 className="mt-8 max-w-3xl text-5xl leading-[1.05] font-semibold tracking-tight text-foreground sm:text-7xl">
          Recreate the vocal sound of your favourite artists.
        </h1>

        <p className="mt-6 max-w-xl text-lg text-muted sm:text-xl">
          Type an artist and a song. VocAligner generates a Logic Pro stock
          plugin chain built to match their vocal sound.
        </p>

        <form className="mt-12 flex w-full max-w-md flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="artist-a" className="text-xs font-medium tracking-wide text-muted uppercase">
              Artist
            </label>
            <input
              id="artist-a"
              type="text"
              placeholder="e.g. Frank Ocean"
              className="rounded-lg border border-black/10 bg-white px-5 py-3 text-base text-foreground shadow-sm outline-none placeholder:text-zinc-400 focus:border-black/30"
            />
          </div>
          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="song-a" className="text-xs font-medium tracking-wide text-muted uppercase">
              Song
            </label>
            <input
              id="song-a"
              type="text"
              placeholder="e.g. Thinkin Bout You"
              className="rounded-lg border border-black/10 bg-white px-5 py-3 text-base text-foreground shadow-sm outline-none placeholder:text-zinc-400 focus:border-black/30"
            />
          </div>
          <button
            type="button"
            title="Preview only — not wired up"
            className="mt-2 rounded-lg bg-black px-8 py-3.5 text-lg font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Generate Vocal Chain
          </button>
        </form>

        <p className="mt-6 max-w-md text-sm text-supporting">
          Every chain uses only Logic Pro stock plugins — no third-party
          plugins required.
        </p>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-2">
          {CHAIN_PREVIEW.map((plugin, index) => (
            <div key={plugin} className="flex items-center gap-2">
              <span className="rounded-full border border-black/10 bg-white/70 px-4 py-1.5 text-sm font-medium text-supporting shadow-sm">
                {plugin}
              </span>
              {index < CHAIN_PREVIEW.length - 1 ? (
                <span className="text-muted/50" aria-hidden="true">→</span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-28 grid w-full grid-cols-1 gap-10 border-t border-black/5 pt-16 sm:grid-cols-3">
          {HOW_IT_WORKS.map((step, index) => (
            <div key={step.title} className="flex flex-col items-center text-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                {index + 1}
              </span>
              <h2 className="mt-4 text-base font-semibold text-foreground">{step.title}</h2>
              <p className="mt-2 text-sm text-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </main>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Design B — "Studio Console"
// Linear / Raycast inspired: mostly white, structured top nav, asymmetric
// split hero with a channel-strip visual. Sunset gradient used only as a
// soft glow accent rather than the full background.
// ---------------------------------------------------------------------------

function DesignB() {
  return (
    <section id="design-b" className="relative flex min-h-screen flex-col bg-white">
      <SectionLabel letter="B" name="Studio Console" />

      <nav className="border-b border-black/5">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-5 sm:px-10">
          <Wordmark />
          <div className="hidden items-center gap-8 text-sm font-medium text-muted sm:flex">
            <span>Product</span>
            <span>How it works</span>
          </div>
        </div>
      </nav>

      <main className="mx-auto grid w-full max-w-[1200px] flex-1 grid-cols-1 items-center gap-16 px-6 py-20 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-0">
        <div className="flex flex-col">
          <span className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">
            AI Vocal Chains for Logic Pro
          </span>

          <h1 className="mt-5 max-w-lg text-4xl leading-[1.08] font-semibold tracking-tight text-foreground sm:text-5xl">
            Match the sound.
            <br />
            Skip the guesswork.
          </h1>

          <p className="mt-5 max-w-md text-base text-muted sm:text-lg">
            VocAligner researches the production behind a track and hands you
            a stock Logic Pro plugin chain built to match it.
          </p>

          <form className="mt-10 flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-3 shadow-sm sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1 px-2 pt-1.5">
              <label htmlFor="artist-b" className="text-[11px] font-medium tracking-wide text-muted uppercase">
                Artist
              </label>
              <input
                id="artist-b"
                type="text"
                placeholder="Frank Ocean"
                className="border-none bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-zinc-400"
              />
            </div>
            <div className="hidden h-8 w-px bg-black/10 sm:block" />
            <div className="flex flex-1 flex-col gap-1 px-2 pt-1.5">
              <label htmlFor="song-b" className="text-[11px] font-medium tracking-wide text-muted uppercase">
                Song
              </label>
              <input
                id="song-b"
                type="text"
                placeholder="Thinkin Bout You"
                className="border-none bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-zinc-400"
              />
            </div>
            <button
              type="button"
              title="Preview only — not wired up"
              className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Generate
            </button>
          </form>

          <p className="mt-4 text-xs text-supporting">
            Logic Pro stock plugins only — nothing third-party to buy.
          </p>

          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-black/5 pt-10">
            {HOW_IT_WORKS.map((step, index) => (
              <div key={step.title}>
                <span className="font-mono text-xs text-muted">0{index + 1}</span>
                <h2 className="mt-2 text-sm font-semibold text-foreground">{step.title}</h2>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center py-10 lg:py-0">
          <div
            className="absolute h-[420px] w-[420px] rounded-full opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, var(--sunset-start) 0%, var(--sunset-fade) 60%, transparent 80%)",
            }}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-black/10 bg-white/90 p-5 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                Channel Strip
              </span>
              <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {CHAIN_PREVIEW.map((plugin) => (
                <div
                  key={plugin}
                  className="flex items-center justify-between rounded-lg border border-black/5 bg-zinc-50 px-4 py-3"
                >
                  <span className="font-mono text-sm text-foreground">{plugin}</span>
                  <div className="flex gap-1" aria-hidden="true">
                    <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
                    <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Design C — "Minimal Focus"
// ElevenLabs / Notion inspired: almost entirely white, tiny nav, vertically
// centered content, the artist/song input is the visual hero. Everything
// else is reduced to a whisper.
// ---------------------------------------------------------------------------

function DesignC() {
  return (
    <section id="design-c" className="relative flex min-h-screen flex-col bg-white">
      <SectionLabel letter="C" name="Minimal Focus" />

      <div
        className="absolute inset-x-0 top-0 h-[380px]"
        style={{
          background:
            "linear-gradient(to bottom, var(--sunset-fade) 0%, transparent 100%)",
          opacity: 0.7,
        }}
        aria-hidden="true"
      />

      <header className="relative mx-auto w-full max-w-[1200px] px-6 pt-10 text-center">
        <Link
          href="/"
          className="text-xs font-semibold tracking-[0.3em] text-muted uppercase transition-opacity hover:opacity-70"
        >
          VocAligner
        </Link>
      </header>

      <main className="relative mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="max-w-2xl text-3xl leading-[1.15] font-semibold tracking-tight text-foreground sm:text-4xl">
          Recreate the vocal sound of your favourite artists.
        </h1>

        <div className="mt-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-full border border-black/10 bg-white shadow-lg shadow-black/[0.03] sm:flex-row sm:items-center">
          <div className="flex flex-1 flex-col gap-0.5 px-7 py-4 text-left">
            <label htmlFor="artist-c" className="text-[10px] font-medium tracking-wide text-muted uppercase">
              Artist
            </label>
            <input
              id="artist-c"
              type="text"
              placeholder="Frank Ocean"
              className="border-none bg-transparent p-0 text-base text-foreground outline-none placeholder:text-zinc-400"
            />
          </div>
          <div className="hidden h-8 w-px bg-black/10 sm:block" />
          <div className="flex flex-1 flex-col gap-0.5 px-7 py-4 text-left">
            <label htmlFor="song-c" className="text-[10px] font-medium tracking-wide text-muted uppercase">
              Song
            </label>
            <input
              id="song-c"
              type="text"
              placeholder="Thinkin Bout You"
              className="border-none bg-transparent p-0 text-base text-foreground outline-none placeholder:text-zinc-400"
            />
          </div>
          <button
            type="button"
            title="Preview only — not wired up"
            className="m-1.5 shrink-0 rounded-full bg-black px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Generate
          </button>
        </div>

        <p className="mt-6 max-w-sm text-sm text-supporting">
          Logic Pro stock plugins only. No account, no upload — just an
          artist and a song.
        </p>
      </main>

      <footer className="relative mx-auto w-full max-w-[1200px] px-6 pb-16 text-center">
        <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted">
          {CHAIN_PREVIEW.map((plugin, index) => (
            <span key={plugin} className="flex items-center gap-3">
              {plugin}
              {index < CHAIN_PREVIEW.length - 1 ? (
                <span className="text-muted/40" aria-hidden="true">·</span>
              ) : null}
            </span>
          ))}
        </div>
      </footer>
    </section>
  );
}
