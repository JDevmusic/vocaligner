"use client";

import { motion } from "motion/react";
import { Mark } from "../components/Mark";
import { CHAIN_PREVIEW } from "../landing-copy";
import { AnimatedButton } from "./AnimatedButton";
import { item } from "./motion-shared";

// ---------------------------------------------------------------------------
// Design I — "Quiet"
// Same layout again, but color is almost entirely withheld -- ElevenLabs-
// style: a near-white page with one confident color moment (the gradient
// lives only in "Match", plus a faint corner glow) instead of a wash.
// ---------------------------------------------------------------------------

export function DesignI() {
  return (
    <section id="design-i" className="relative flex min-h-screen flex-col overflow-hidden bg-white">
      <div className="sticky top-10 z-10 px-4 pt-4 sm:px-6 sm:pt-6">
        <span className="inline-block rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold tracking-wide text-white">
          Design I — Quiet
        </span>
      </div>

      <div
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-[0.18] blur-3xl"
        style={{
          background:
            "linear-gradient(135deg, var(--muted-gold), var(--muted-coral), var(--muted-lavender))",
        }}
        aria-hidden="true"
      />

      <nav className="relative">
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-2.5 px-6 pt-8 sm:px-10">
          <Mark className="h-4 w-auto text-foreground" />
          <span className="text-sm font-semibold tracking-[0.15em] text-foreground uppercase">
            VocAligner
          </span>
        </div>
      </nav>

      <div className="relative mx-auto w-full max-w-[1200px] px-6 pt-10 sm:px-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={item}
          className="max-w-sm"
        >
          <span className="font-mono text-xs tracking-[0.2em] text-muted uppercase">
            Signal research, matched to spec
          </span>
          <h1 className="mt-3 text-2xl leading-[1.2] font-semibold tracking-tight text-foreground sm:text-3xl">
            Recreate the vocal sound of your favourite artists.
          </h1>
        </motion.div>
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={item}
        className="relative mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center justify-center px-6 py-16 text-center"
      >
        <form
          onSubmit={(event) => event.preventDefault()}
          className="flex max-w-2xl flex-wrap items-baseline justify-center gap-x-2.5 gap-y-3 text-3xl leading-relaxed font-medium text-foreground sm:text-4xl"
        >
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, var(--muted-gold), var(--muted-coral))",
            }}
          >
            Match
          </span>
          <label className="sr-only" htmlFor="artist-i">Artist</label>
          <input
            id="artist-i"
            type="text"
            placeholder="Frank Ocean"
            size={12}
            className="min-w-0 border-b-2 border-black/15 bg-transparent px-1 pb-0.5 text-center text-foreground outline-none placeholder:text-black/25 focus:border-black/50"
          />
          <span>on</span>
          <label className="sr-only" htmlFor="song-i">Song</label>
          <input
            id="song-i"
            type="text"
            placeholder="Thinkin Bout You"
            size={16}
            className="min-w-0 border-b-2 border-black/15 bg-transparent px-1 pb-0.5 text-center text-foreground outline-none placeholder:text-black/25 focus:border-black/50"
          />
          <span>, in Logic Pro.</span>
        </form>

        <div className="mt-9">
          <AnimatedButton
            title="Preview only — not wired up"
            className="rounded-full bg-black px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Generate Vocal Chain
          </AnimatedButton>
        </div>
      </motion.div>

      <footer className="relative mx-auto w-full max-w-[1200px] px-6 pb-10 text-center">
        <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted">
          {CHAIN_PREVIEW.map((plugin, index) => (
            <span key={plugin} className="flex items-center gap-3">
              {plugin}
              {index < CHAIN_PREVIEW.length - 1 ? (
                <span className="text-black/20" aria-hidden="true">·</span>
              ) : null}
            </span>
          ))}
        </div>
      </footer>
    </section>
  );
}
