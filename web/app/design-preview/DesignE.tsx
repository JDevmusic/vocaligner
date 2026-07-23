"use client";

import { motion } from "motion/react";
import { Mark } from "../components/Mark";
import { CHAIN_PREVIEW } from "../landing-copy";
import { ChamferPanel } from "./Chamfer";
import { AnimatedButton } from "./AnimatedButton";
import { container, item, EASE } from "./motion-shared";

// ---------------------------------------------------------------------------
// Design E — "Console"
// A genuine pivot, not a re-skin: dark warm-black hardware panel instead of
// a light marketing page, an amber "LCD" readout instead of plain text
// inputs, and a vivid gold -> coral -> purple gradient used as literal
// backlight bleeding from behind the device rather than decorative wash.
// ---------------------------------------------------------------------------

const LED_COLORS = ["var(--vivid-gold)", "var(--vivid-coral)", "var(--vivid-purple)", "var(--vivid-gold)"];

export function DesignE() {
  return (
    <section
      id="design-e"
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{ background: "var(--panel-dark)" }}
    >
      <div className="sticky top-10 z-10 px-4 pt-4 sm:px-6 sm:pt-6">
        <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur">
          Design E — Console
        </span>
      </div>

      <nav className="relative border-b border-white/10">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-4 sm:px-10">
          <div className="flex items-center gap-2.5">
            <Mark className="h-4 w-auto text-white" />
            <span className="text-sm font-semibold tracking-[0.15em] text-white uppercase">
              VocAligner
            </span>
          </div>
          <span className="hidden font-mono text-[11px] tracking-widest text-white/40 uppercase sm:block">
            Unit 01 / Vocal Chain
          </span>
        </div>
      </nav>

      <main className="relative mx-auto grid w-full max-w-[1200px] flex-1 grid-cols-1 items-center gap-14 px-6 py-16 sm:px-10 lg:grid-cols-[1fr_1fr]">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.span
            variants={item}
            className="font-mono text-xs tracking-[0.2em] text-[var(--vivid-gold)] uppercase"
          >
            Signal research, in progress
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-5 max-w-lg text-4xl leading-[1.05] font-semibold tracking-tight text-white sm:text-5xl"
          >
            Recreate the vocal sound of your favourite artists.
          </motion.h1>

          <motion.p variants={item} className="mt-4 max-w-md text-base text-white/50 sm:text-lg">
            Type an artist and a song. VocAligner researches the production
            and hands you a Logic Pro stock plugin chain built to match it.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-2">
            {CHAIN_PREVIEW.map((plugin, index) => (
              <span
                key={plugin}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-white/70"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: LED_COLORS[index % LED_COLORS.length], boxShadow: `0 0 6px ${LED_COLORS[index % LED_COLORS.length]}` }}
                  aria-hidden="true"
                />
                {plugin}
              </span>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, clipPath: "inset(0% 0% 100% 0%)" }}
          whileInView={{ opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="relative"
        >
          <div
            className="absolute -inset-10 opacity-50 blur-2xl"
            style={{
              background:
                "linear-gradient(135deg, var(--vivid-gold) 0%, var(--vivid-coral) 45%, var(--vivid-purple) 100%)",
            }}
            aria-hidden="true"
          />
          <ChamferPanel
            size={20}
            strokeWidth={1}
            stroke="rgba(255,255,255,0.12)"
            fill="var(--panel-dark-raised)"
            className="relative w-full"
            innerClassName="p-6"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-widest text-white/40 uppercase">
                Input
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--vivid-gold)]">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[var(--vivid-gold)]"
                  style={{ boxShadow: "0 0 6px var(--vivid-gold)" }}
                  aria-hidden="true"
                />
                READY
              </span>
            </div>

            <ChamferPanel
              size={10}
              strokeWidth={1}
              stroke="rgba(255,255,255,0.08)"
              fill="#120d0b"
              className="mt-3"
              innerClassName="p-4"
            >
              <form onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="artist-e" className="font-mono text-[10px] tracking-widest text-white/35 uppercase">
                    Artist
                  </label>
                  <input
                    id="artist-e"
                    type="text"
                    placeholder="Frank Ocean"
                    className="border-none bg-transparent p-0 font-mono text-base text-[var(--vivid-gold)] outline-none placeholder:text-white/20"
                    style={{ textShadow: "0 0 12px rgba(255,176,32,0.45)" }}
                  />
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex flex-col gap-1">
                  <label htmlFor="song-e" className="font-mono text-[10px] tracking-widest text-white/35 uppercase">
                    Song
                  </label>
                  <input
                    id="song-e"
                    type="text"
                    placeholder="Thinkin Bout You"
                    className="border-none bg-transparent p-0 font-mono text-base text-[var(--vivid-gold)] outline-none placeholder:text-white/20"
                    style={{ textShadow: "0 0 12px rgba(255,176,32,0.45)" }}
                  />
                </div>
              </form>
            </ChamferPanel>

            <AnimatedButton
              title="Preview only — not wired up"
              className="chamfer mt-4 w-full py-3.5 text-sm font-semibold text-[#1c1512] transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(90deg, var(--vivid-gold), var(--vivid-coral))" }}
            >
              Generate Vocal Chain
            </AnimatedButton>
          </ChamferPanel>
        </motion.div>
      </main>
    </section>
  );
}
