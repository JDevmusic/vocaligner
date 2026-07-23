"use client";

import { motion } from "motion/react";
import { Mark } from "../components/Mark";
import { CHAIN_PREVIEW } from "../landing-copy";
import { AnimatedButton } from "./AnimatedButton";
import { item } from "./motion-shared";

// ---------------------------------------------------------------------------
// Design H — "Wash" (refined)
// Owner picked this direction but called the color too dulled -- this
// brings back real saturation at the top of the gradient, resolving to
// white ("dark to light", closer to the Lovable reference), makes the
// hero headline the dominant element, shrinks the mad-libs sentence to a
// secondary role, and adds a right-column explanation of what the product
// does (the E-console description treatment, moved beside the headline).
// ---------------------------------------------------------------------------

export function DesignH() {
  return (
    <section
      id="design-h"
      className="relative flex min-h-screen flex-col"
      style={{
        background:
          "linear-gradient(170deg, var(--wash-deep) 0%, var(--wash-coral) 16%, var(--sunset-start) 32%, var(--wash-lavender) 50%, var(--sunset-start) 68%, var(--sunset-fade) 88%, #ffffff 100%)",
      }}
    >
      <nav className="relative">
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-2.5 px-6 pt-8 sm:px-10">
          <Mark className="h-4 w-auto text-white" />
          <span className="text-sm font-semibold tracking-[0.15em] text-white uppercase">
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
          <span className="font-mono text-xs tracking-[0.2em] text-white/80 uppercase">
            Signal research, matched to spec
          </span>
          <h1 className="mt-4 max-w-xl text-5xl leading-[1.03] font-semibold tracking-tight text-white sm:text-7xl">
            Recreate the vocal sound of your favourite artists.
          </h1>
        </div>

        <div className="lg:pt-2">
          <span className="font-mono text-xs tracking-[0.2em] text-white/70 uppercase">
            What VocAligner does
          </span>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/90 sm:text-base">
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
          style={{ textShadow: "0 2px 16px rgba(0,0,0,0.18)" }}
          className="flex max-w-xl flex-wrap items-baseline justify-center gap-x-2 gap-y-2 text-xl leading-relaxed font-medium text-white sm:text-2xl"
        >
          <span>Match</span>
          <label className="sr-only" htmlFor="artist-h">Artist</label>
          <input
            id="artist-h"
            type="text"
            placeholder="Frank Ocean"
            size={12}
            className="min-w-0 border-b-2 border-white/60 bg-transparent px-1 pb-0.5 text-center text-white outline-none placeholder:text-white/50 focus:border-white"
          />
          <span>on</span>
          <label className="sr-only" htmlFor="song-h">Song</label>
          <input
            id="song-h"
            type="text"
            placeholder="Thinkin Bout You"
            size={16}
            className="min-w-0 border-b-2 border-white/60 bg-transparent px-1 pb-0.5 text-center text-white outline-none placeholder:text-white/50 focus:border-white"
          />
          <span>, in Logic Pro.</span>
        </form>

        <div className="mt-8">
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
