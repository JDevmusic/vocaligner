"use client";

import { motion } from "motion/react";
import { ChannelEqVisual } from "./ChannelEqVisual";
import { AnimatedButton } from "./AnimatedButton";
import { pluginRegistry } from "@/lib/registry/pluginRegistry";
import type { ControlValue } from "@/lib/schema/chain";
import { container, item } from "./motion-shared";

// A real, one-time-generated example (2026-08-21) -- not a live generation on page load.
// Because identical Artist+Song requests are cached (Epics 2/4), this is genuinely
// representative rather than a fabricated best-case demo: a visitor who searches this
// exact song themselves gets this same real chain back, for as long as this cache entry
// survives its retention window. Real values captured directly from that generation's
// response, not invented.
//
// This stops being true (silently) the moment this specific cache entry is gone --
// either its 30-day TTL lapses (generationStore.ts's RETENTION_SECONDS) or, more likely
// sooner given how often this project bumps them, PIPELINE_VERSION/PROMPT_VERSION/the
// schema version changes, which invalidates the cache hit outright regardless of TTL. A
// fresh generation for the same song isn't guaranteed to reproduce these exact values or
// EXAMPLE_TOTAL_PLUGINS below (AI generation isn't perfectly deterministic across
// regenerations) -- if the copy or these numbers ever look stale, that's the first thing
// to check, and the fix is re-capturing this snapshot from a real fresh generation, not
// just bumping a date.
const EXAMPLE_ARTIST = "The Weeknd";
const EXAMPLE_SONG = "Blinding Lights";
const EXAMPLE_TOTAL_PLUGINS = 8; // real chain length; this section only shows Channel EQ
const EXAMPLE_CHANNEL_EQ_CONTROLS: ControlValue[] = [
  { parameter: "band1Frequency", value: 85, unit: "Hz", confidence: "high", wasRepaired: false },
  { parameter: "band1Slope", value: 18, unit: "dB/Oct", confidence: "high", wasRepaired: false },
  { parameter: "band1Q", value: 0.71, unit: null, confidence: "medium", wasRepaired: false },
  { parameter: "band2Frequency", value: 140, unit: "Hz", confidence: "medium", wasRepaired: false },
  { parameter: "band2Gain", value: -1.5, unit: "dB", confidence: "medium", wasRepaired: false },
  { parameter: "band2Q", value: 0.8, unit: null, confidence: "medium", wasRepaired: false },
  { parameter: "band3Frequency", value: 280, unit: "Hz", confidence: "high", wasRepaired: false },
  { parameter: "band3Gain", value: -2, unit: "dB", confidence: "high", wasRepaired: false },
  { parameter: "band3Q", value: 1.1, unit: null, confidence: "medium", wasRepaired: false },
  { parameter: "band4Frequency", value: 520, unit: "Hz", confidence: "medium", wasRepaired: false },
  { parameter: "band4Gain", value: -0.5, unit: "dB", confidence: "low", wasRepaired: false },
  { parameter: "band4Q", value: 0.7, unit: null, confidence: "low", wasRepaired: false },
  { parameter: "band5Frequency", value: 1040, unit: "Hz", confidence: "low", wasRepaired: false },
  { parameter: "band5Gain", value: 0.5, unit: "dB", confidence: "low", wasRepaired: false },
  { parameter: "band5Q", value: 0.6, unit: null, confidence: "low", wasRepaired: false },
  { parameter: "band6Frequency", value: 2800, unit: "Hz", confidence: "high", wasRepaired: false },
  { parameter: "band6Gain", value: 1.5, unit: "dB", confidence: "high", wasRepaired: false },
  { parameter: "band6Q", value: 0.8, unit: null, confidence: "medium", wasRepaired: false },
  { parameter: "band7Frequency", value: 7200, unit: "Hz", confidence: "medium", wasRepaired: false },
  { parameter: "band7Gain", value: 1, unit: "dB", confidence: "medium", wasRepaired: false },
  { parameter: "band7Q", value: 0.8, unit: null, confidence: "medium", wasRepaired: false },
  { parameter: "band8Frequency", value: 20000, unit: "Hz", confidence: "medium", wasRepaired: false },
  { parameter: "band8Slope", value: 24, unit: "dB/Oct", confidence: "high", wasRepaired: false },
  { parameter: "band8Q", value: 0.71, unit: null, confidence: "low", wasRepaired: false },
];

export function ChainTeaserSection() {
  const channelEqPlugin = pluginRegistry.getById("logic-pro.channel-eq");
  // Defensive only -- the registry always has this entry; satisfies TypeScript's
  // possibly-undefined return type without a real runtime path that hits it. Logged
  // (not silent) if it ever did happen, same pattern as PluginChainVisual.tsx's own
  // registry-lookup guard -- otherwise this entire marketing section would vanish from
  // the landing page with nothing surfacing why.
  if (!channelEqPlugin) {
    console.warn('ChainTeaserSection: no registry entry for "logic-pro.channel-eq" -- section not rendered.');
    return null;
  }

  const query = new URLSearchParams({ artist: EXAMPLE_ARTIST, song: EXAMPLE_SONG }).toString();
  const morePlugins = EXAMPLE_TOTAL_PLUGINS - 1;

  return (
    <section
      className="relative flex flex-col"
      style={{ background: "var(--wash-purple-deep)" }}
    >
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 py-20 text-center sm:px-10 sm:py-28"
      >
        <motion.span
          variants={item}
          className="font-mono text-xs tracking-[0.2em] text-on-dark/55 uppercase"
        >
          See it in action
        </motion.span>

        <motion.h2
          variants={item}
          className="mt-4 max-w-2xl text-4xl leading-[1.05] font-semibold tracking-tight text-on-dark sm:text-5xl"
        >
          A real chain, for a real song.
        </motion.h2>

        <motion.p variants={item} className="mt-5 max-w-md text-base leading-relaxed text-on-dark/70 sm:text-lg">
          For &ldquo;{EXAMPLE_SONG}&rdquo; by {EXAMPLE_ARTIST} — the same chain you&apos;d get searching it yourself.
        </motion.p>

        <motion.div variants={item} className="relative mt-10 w-full max-w-xl overflow-hidden rounded-2xl">
          <div className="max-h-[300px] overflow-hidden rounded-2xl">
            <ChannelEqVisual plugin={channelEqPlugin} values={EXAMPLE_CHANNEL_EQ_CONTROLS} />
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
            style={{ background: "linear-gradient(to bottom, transparent, var(--wash-purple-deep))" }}
            aria-hidden="true"
          />
        </motion.div>

        <motion.p variants={item} className="mt-6 text-sm font-medium text-on-dark/55">
          +{morePlugins} more plugins suggested
        </motion.p>

        <motion.div variants={item} className="mt-8">
          <AnimatedButton
            title={`Generate the chain for "${EXAMPLE_SONG}"`}
            href={`/loading?${query}`}
            className="rounded-full bg-background px-8 py-3.5 text-base font-semibold text-foreground shadow-[0_6px_24px_-6px_color-mix(in_srgb,var(--wash-purple-deep)_60%,transparent)] transition-shadow hover:shadow-[0_8px_30px_-4px_color-mix(in_srgb,var(--wash-purple-deep)_75%,transparent)]"
          >
            See the full chain
          </AnimatedButton>
        </motion.div>
      </motion.div>
    </section>
  );
}
