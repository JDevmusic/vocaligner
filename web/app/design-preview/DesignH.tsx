"use client";

import { motion } from "motion/react";
import { Mark } from "../components/Mark";
import { CHAIN_PREVIEW } from "../landing-copy";
import { AnimatedButton } from "./AnimatedButton";
import { item } from "./motion-shared";

// ---------------------------------------------------------------------------
// Design H — "Wash"
// Same agreed layout as the others in this round (top-left eyebrow +
// headline, centered mad-libs sentence, footer chain list) with a soft,
// low-contrast full-bleed color wash -- the F gradient idea, dialed back
// from flamboyant to quiet.
// ---------------------------------------------------------------------------

export function DesignH() {
  return (
    <section
      id="design-h"
      className="relative flex min-h-screen flex-col"
      style={{
        background:
          "linear-gradient(160deg, var(--muted-lavender) 0%, var(--muted-coral) 28%, var(--sunset-fade) 60%, #ffffff 100%)",
      }}
    >
      <div className="sticky top-10 z-10 px-4 pt-4 sm:px-6 sm:pt-6">
        <span className="inline-block rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold tracking-wide text-white">
          Design H — Wash
        </span>
      </div>

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
          <span className="font-mono text-xs tracking-[0.2em] text-supporting uppercase">
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
          <span>Match</span>
          <label className="sr-only" htmlFor="artist-h">Artist</label>
          <input
            id="artist-h"
            type="text"
            placeholder="Frank Ocean"
            size={12}
            className="min-w-0 border-b-2 border-black/25 bg-transparent px-1 pb-0.5 text-center text-foreground outline-none placeholder:text-black/30 focus:border-black/60"
          />
          <span>on</span>
          <label className="sr-only" htmlFor="song-h">Song</label>
          <input
            id="song-h"
            type="text"
            placeholder="Thinkin Bout You"
            size={16}
            className="min-w-0 border-b-2 border-black/25 bg-transparent px-1 pb-0.5 text-center text-foreground outline-none placeholder:text-black/30 focus:border-black/60"
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
        <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-supporting">
          {CHAIN_PREVIEW.map((plugin, index) => (
            <span key={plugin} className="flex items-center gap-3">
              {plugin}
              {index < CHAIN_PREVIEW.length - 1 ? (
                <span className="text-black/25" aria-hidden="true">·</span>
              ) : null}
            </span>
          ))}
        </div>
      </footer>
    </section>
  );
}
