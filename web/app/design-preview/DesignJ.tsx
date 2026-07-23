"use client";

import { motion } from "motion/react";
import { Mark } from "../components/Mark";
import { CHAIN_PREVIEW } from "../landing-copy";
import { AnimatedButton } from "./AnimatedButton";
import { item } from "./motion-shared";

// ---------------------------------------------------------------------------
// Design J — "Dusk"
// Same layout, a third color treatment: a quiet, muted warm-dark neutral
// rather than the "hardware black" of Design E -- moody instead of loud,
// one soft accent color instead of a multi-stop gradient.
// ---------------------------------------------------------------------------

export function DesignJ() {
  return (
    <section
      id="design-j"
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{ background: "var(--dusk-panel)" }}
    >
      <div className="sticky top-10 z-10 px-4 pt-4 sm:px-6 sm:pt-6">
        <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur">
          Design J — Dusk
        </span>
      </div>

      <div
        className="pointer-events-none absolute top-1/3 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--muted-gold)" }}
        aria-hidden="true"
      />

      <nav className="relative">
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-2.5 px-6 pt-8 sm:px-10">
          <Mark className="h-4 w-auto text-white" />
          <span className="text-sm font-semibold tracking-[0.15em] text-white uppercase">
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
          <span className="font-mono text-xs tracking-[0.2em] text-white/45 uppercase">
            Signal research, matched to spec
          </span>
          <h1 className="mt-3 text-2xl leading-[1.2] font-semibold tracking-tight text-white sm:text-3xl">
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
          className="flex max-w-2xl flex-wrap items-baseline justify-center gap-x-2.5 gap-y-3 text-3xl leading-relaxed font-medium text-white sm:text-4xl"
        >
          <span>Match</span>
          <label className="sr-only" htmlFor="artist-j">Artist</label>
          <input
            id="artist-j"
            type="text"
            placeholder="Frank Ocean"
            size={12}
            className="min-w-0 border-b-2 border-white/25 bg-transparent px-1 pb-0.5 text-center text-white outline-none placeholder:text-white/30 focus:border-[var(--muted-gold)]"
          />
          <span>on</span>
          <label className="sr-only" htmlFor="song-j">Song</label>
          <input
            id="song-j"
            type="text"
            placeholder="Thinkin Bout You"
            size={16}
            className="min-w-0 border-b-2 border-white/25 bg-transparent px-1 pb-0.5 text-center text-white outline-none placeholder:text-white/30 focus:border-[var(--muted-gold)]"
          />
          <span>, in Logic Pro.</span>
        </form>

        <div className="mt-9">
          <AnimatedButton
            title="Preview only — not wired up"
            className="rounded-full px-8 py-3.5 text-base font-semibold text-[#2b2622] transition-opacity hover:opacity-90"
            style={{ background: "var(--muted-gold)" }}
          >
            Generate Vocal Chain
          </AnimatedButton>
        </div>
      </motion.div>

      <footer className="relative mx-auto w-full max-w-[1200px] px-6 pb-10 text-center">
        <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-white/40">
          {CHAIN_PREVIEW.map((plugin, index) => (
            <span key={plugin} className="flex items-center gap-3">
              {plugin}
              {index < CHAIN_PREVIEW.length - 1 ? (
                <span className="text-white/20" aria-hidden="true">·</span>
              ) : null}
            </span>
          ))}
        </div>
      </footer>
    </section>
  );
}
