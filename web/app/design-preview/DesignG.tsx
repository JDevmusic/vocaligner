"use client";

import { motion } from "motion/react";
import { Mark } from "../components/Mark";
import { CHAIN_PREVIEW } from "../landing-copy";
import { AnimatedButton } from "./AnimatedButton";
import { container, item } from "./motion-shared";

// ---------------------------------------------------------------------------
// Design G — "Ledger"
// A technical spec-sheet / datasheet composition -- almost nobody builds AI
// product pages this way, which is exactly the point. Monospace-forward,
// dense, precise. Color comes from status indicators and category tags
// rather than a wash, so it stays "precision tool" rather than "poster."
// ---------------------------------------------------------------------------

const STAGE_COLORS = ["var(--vivid-gold)", "var(--vivid-coral)", "var(--vivid-purple)", "var(--vivid-gold)"];

export function DesignG() {
  return (
    <section id="design-g" className="relative flex min-h-screen flex-col bg-[#fdfaf5]">
      <div className="sticky top-10 z-10 px-4 pt-4 sm:px-6 sm:pt-6">
        <span className="inline-block rounded-full bg-black/80 px-3 py-1 text-[11px] font-semibold tracking-wide text-white">
          Design G — Ledger
        </span>
      </div>

      <div
        className="h-1.5 w-full"
        style={{ background: "linear-gradient(90deg, var(--vivid-gold), var(--vivid-coral), var(--vivid-purple))" }}
        aria-hidden="true"
      />

      <header className="border-b border-black/10">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-4 sm:px-10">
          <div className="flex items-center gap-2.5">
            <Mark className="h-4 w-auto text-foreground" />
            <span className="font-mono text-sm font-semibold tracking-[0.1em] text-foreground uppercase">
              VocAligner
            </span>
          </div>
          <span className="font-mono text-[11px] tracking-widest text-muted uppercase">
            Model VA-01 / Vocal Chain Spec
          </span>
        </div>
      </header>

      <motion.main
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        className="mx-auto grid w-full max-w-[1200px] flex-1 grid-cols-1 gap-10 px-6 py-14 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-20"
      >
        <div>
          <motion.h1
            variants={item}
            className="max-w-md text-3xl leading-[1.15] font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            Recreate the vocal sound of your favourite artists.
          </motion.h1>

          <motion.p variants={item} className="mt-4 max-w-sm text-sm text-muted">
            Enter two fields. Get a Logic Pro stock plugin chain researched
            and matched to spec.
          </motion.p>

          <motion.form
            variants={item}
            onSubmit={(event) => event.preventDefault()}
            className="mt-8 flex flex-col divide-y divide-black/10 border border-black/10 bg-white"
          >
            <div className="flex items-center gap-4 px-4 py-3">
              <label htmlFor="artist-g" className="w-16 shrink-0 font-mono text-[11px] tracking-widest text-muted uppercase">
                Artist
              </label>
              <input
                id="artist-g"
                type="text"
                placeholder="Frank Ocean"
                className="min-w-0 flex-1 border-none bg-transparent p-0 font-mono text-sm text-foreground outline-none placeholder:text-zinc-400"
              />
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--vivid-gold)]" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-4 px-4 py-3">
              <label htmlFor="song-g" className="w-16 shrink-0 font-mono text-[11px] tracking-widest text-muted uppercase">
                Song
              </label>
              <input
                id="song-g"
                type="text"
                placeholder="Thinkin Bout You"
                className="min-w-0 flex-1 border-none bg-transparent p-0 font-mono text-sm text-foreground outline-none placeholder:text-zinc-400"
              />
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-black/15" aria-hidden="true" />
            </div>
          </motion.form>

          <motion.div variants={item} className="mt-4">
            <AnimatedButton
              title="Preview only — not wired up"
              className="flex w-full items-center justify-center gap-2 border border-black bg-black py-3 font-mono text-sm font-semibold tracking-wide text-white uppercase transition-colors hover:bg-zinc-800"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--vivid-gold)]" aria-hidden="true" />
              Run Chain
            </AnimatedButton>
          </motion.div>
        </div>

        <motion.div variants={item}>
          <span className="font-mono text-[11px] tracking-widest text-muted uppercase">
            Signal Path
          </span>
          <div className="mt-3 border border-black/10 bg-white">
            {CHAIN_PREVIEW.map((plugin, index) => (
              <div
                key={plugin}
                className="flex items-center gap-4 border-b border-black/10 px-4 py-3.5 last:border-b-0"
              >
                <span className="font-mono text-xs text-muted">STAGE {String(index + 1).padStart(2, "0")}</span>
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: STAGE_COLORS[index % STAGE_COLORS.length] }}
                  aria-hidden="true"
                />
                <span className="flex-1 text-sm font-medium text-foreground">{plugin}</span>
                <span className="font-mono text-[11px] text-muted uppercase">Stock</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.main>
    </section>
  );
}
