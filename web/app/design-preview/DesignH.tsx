"use client";

import { motion } from "motion/react";
import { Mark } from "../components/Mark";
import { CHAIN_PREVIEW } from "../landing-copy";
import { AnimatedButton } from "./AnimatedButton";
import { item } from "./motion-shared";

// ---------------------------------------------------------------------------
// Design H — "Wash" (v3)
// Coral/red dropped per feedback. Gradient direction flipped: white at
// the top, through sunset gold, down to a deep purple base -- the purple
// is what the owner wants kept and pushed further, not the pink. Text
// color now follows the gradient (dark up top, light by the purple
// footer) instead of assuming white-on-color throughout.
//
// Premium touches added on top of the color change: a very faint film-
// grain texture (flat gradients read cheap/plasticky without it), a soft
// colored glow under the CTA instead of a flat shadow, and a hairline
// gradient-matched nav divider.
// ---------------------------------------------------------------------------

const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function DesignH() {
  return (
    <section
      id="design-h"
      className="relative flex min-h-screen flex-col"
      style={{
        background:
          "linear-gradient(180deg, #ffffff 0%, var(--sunset-fade) 14%, var(--sunset-start) 36%, var(--sunset-start) 58%, var(--wash-lavender) 80%, var(--wash-purple) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{ backgroundImage: GRAIN_URL }}
        aria-hidden="true"
      />

      <nav className="relative border-b border-black/[0.06]">
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-2.5 px-6 py-7 sm:px-10">
          <Mark className="h-4 w-auto text-foreground" />
          <span className="text-sm font-semibold tracking-[0.15em] text-foreground uppercase">
            VocAligner
          </span>
        </div>
      </nav>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={item}
        className="relative mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-8 px-6 pt-10 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:gap-16"
      >
        <div>
          <span className="font-mono text-xs tracking-[0.2em] text-supporting uppercase">
            Signal research, matched to spec
          </span>
          <h1 className="mt-4 max-w-xl text-5xl leading-[1.03] font-semibold tracking-tight text-foreground sm:text-7xl">
            Recreate the vocal sound of your favourite artists.
          </h1>
        </div>

        <div className="lg:pt-2">
          <span className="font-mono text-xs tracking-[0.2em] text-supporting uppercase">
            What VocAligner does
          </span>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-foreground/75 sm:text-base">
            Type an artist and a song. VocAligner researches the production
            behind the record — tone, dynamics, space — and hands you a
            Logic Pro stock plugin chain built to match it. No third-party
            plugins, no guesswork.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={item}
        className="relative mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center justify-center px-6 py-14 text-center"
      >
        <form
          onSubmit={(event) => event.preventDefault()}
          className="flex max-w-xl flex-wrap items-baseline justify-center gap-x-2 gap-y-2 text-xl leading-relaxed font-medium text-foreground sm:text-2xl"
        >
          <span>Match</span>
          <label className="sr-only" htmlFor="artist-h">Artist</label>
          <input
            id="artist-h"
            type="text"
            placeholder="Frank Ocean"
            size={12}
            className="min-w-0 border-b-2 border-black/30 bg-transparent px-1 pb-0.5 text-center text-foreground outline-none placeholder:text-black/35 focus:border-black"
          />
          <span>on</span>
          <label className="sr-only" htmlFor="song-h">Song</label>
          <input
            id="song-h"
            type="text"
            placeholder="Thinkin Bout You"
            size={16}
            className="min-w-0 border-b-2 border-black/30 bg-transparent px-1 pb-0.5 text-center text-foreground outline-none placeholder:text-black/35 focus:border-black"
          />
          <span>, in Logic Pro.</span>
        </form>

        <div className="mt-8">
          <AnimatedButton
            title="Preview only — not wired up"
            className="rounded-full bg-black px-8 py-3.5 text-base font-semibold text-white shadow-[0_6px_24px_-6px_rgba(63,31,74,0.4)] transition-shadow hover:shadow-[0_8px_30px_-4px_rgba(63,31,74,0.55)]"
          >
            Generate Vocal Chain
          </AnimatedButton>
        </div>
      </motion.div>

      <footer className="relative mx-auto w-full max-w-[1200px] px-6 pb-10 text-center">
        <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-white/65">
          {CHAIN_PREVIEW.map((plugin, index) => (
            <span key={plugin} className="flex items-center gap-3">
              {plugin}
              {index < CHAIN_PREVIEW.length - 1 ? (
                <span className="text-white/25" aria-hidden="true">·</span>
              ) : null}
            </span>
          ))}
        </div>
      </footer>
    </section>
  );
}
