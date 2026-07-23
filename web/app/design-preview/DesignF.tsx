"use client";

import { motion } from "motion/react";
import { Mark } from "../components/Mark";
import { CHAIN_PREVIEW } from "../landing-copy";
import { AnimatedButton } from "./AnimatedButton";
import { container, item } from "./motion-shared";

// ---------------------------------------------------------------------------
// Design F — "Editorial"
// A full-bleed saturated gradient (not a pale fade-to-white wash) and a
// magazine-spread composition: the artist/song aren't a stacked form, they're
// blanks inside an actual sentence, like liner-notes credits. Chain preview
// reads as a credits list, not badge pills.
// ---------------------------------------------------------------------------

export function DesignF() {
  return (
    <section
      id="design-f"
      className="relative flex min-h-screen flex-col text-white"
      style={{
        background:
          "linear-gradient(135deg, var(--vivid-gold) 0%, var(--vivid-coral) 55%, var(--vivid-purple) 100%)",
      }}
    >
      <div className="sticky top-10 z-10 px-4 pt-4 sm:px-6 sm:pt-6">
        <span className="inline-block rounded-full bg-black/20 px-3 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur">
          Design F — Editorial
        </span>
      </div>

      <header className="relative mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 pt-8 sm:px-10">
        <div className="flex items-center gap-2.5">
          <Mark className="h-4 w-auto text-white" />
          <span className="text-sm font-semibold tracking-[0.15em] text-white uppercase">
            VocAligner
          </span>
        </div>
        <span className="font-mono text-[11px] tracking-widest text-white/70 uppercase">
          Vol. 01 — Vocal Chains
        </span>
      </header>

      <motion.main
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        className="relative mx-auto grid w-full max-w-[1200px] flex-1 grid-cols-1 gap-10 px-6 py-14 sm:px-10 lg:grid-cols-[1fr_280px] lg:items-end lg:py-20"
      >
        <div>
          <motion.h1
            variants={item}
            className="max-w-2xl text-4xl leading-[1.12] font-semibold tracking-tight sm:text-6xl"
          >
            Recreate the vocal sound of your favourite artists.
          </motion.h1>

          <motion.form
            variants={item}
            onSubmit={(event) => event.preventDefault()}
            className="mt-10 flex max-w-2xl flex-wrap items-baseline gap-x-2.5 gap-y-3 text-2xl leading-relaxed font-medium sm:text-3xl"
          >
            <span>Match</span>
            <label className="sr-only" htmlFor="artist-f">Artist</label>
            <input
              id="artist-f"
              type="text"
              placeholder="Frank Ocean"
              size={12}
              className="min-w-0 border-b-2 border-white/50 bg-transparent px-1 pb-0.5 text-white outline-none placeholder:text-white/50 focus:border-white"
            />
            <span>on</span>
            <label className="sr-only" htmlFor="song-f">Song</label>
            <input
              id="song-f"
              type="text"
              placeholder="Thinkin Bout You"
              size={16}
              className="min-w-0 border-b-2 border-white/50 bg-transparent px-1 pb-0.5 text-white outline-none placeholder:text-white/50 focus:border-white"
            />
            <span>, in Logic Pro.</span>
          </motion.form>

          <motion.div variants={item} className="mt-9">
            <AnimatedButton
              title="Preview only — not wired up"
              className="rounded-full bg-black px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-black/80"
            >
              Generate Vocal Chain
            </AnimatedButton>
          </motion.div>
        </div>

        <motion.div variants={item} className="border-t border-white/30 pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
          <span className="font-mono text-[11px] tracking-widest text-white/70 uppercase">
            Produced with
          </span>
          <ol className="mt-3 flex flex-col gap-1.5">
            {CHAIN_PREVIEW.map((plugin, index) => (
              <li key={plugin} className="flex items-baseline gap-2 text-sm text-white/90">
                <span className="font-mono text-xs text-white/50">0{index + 1}</span>
                {plugin}
              </li>
            ))}
          </ol>
        </motion.div>
      </motion.main>
    </section>
  );
}
