"use client";

import { motion } from "motion/react";
import { container, item } from "./motion-shared";

// ---------------------------------------------------------------------------
// Meet VocAligner — the section revealed on scroll, after the Design H
// hero. Inspired by ToneAdapt's landing page (a close analog — guitar
// tone matching instead of vocals): pair an inspiring, benefit-first
// intro with a concrete, concise "how it works" breakdown, rather than
// leading with mechanics. Calm, near-white background on purpose — the
// hero already carried the color and drama; this section's job is to
// explain, not perform.
// ---------------------------------------------------------------------------

const STEPS = [
  {
    title: "Tell us the sound",
    description: "Type an artist and a song — the vocal sound you're chasing.",
  },
  {
    title: "We study the record",
    description: "VocAligner researches the tonal balance, dynamics and space of the mix.",
  },
  {
    title: "Build it in Logic Pro",
    description: "Get a stock plugin chain, ready to build — no guesswork.",
  },
];

export function MeetSection() {
  return (
    <section className="relative flex flex-col bg-[#fdfaf5]">
      <div
        className="h-24 w-full"
        style={{ background: "linear-gradient(to bottom, var(--wash-purple), #fdfaf5)" }}
        aria-hidden="true"
      />

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="mx-auto flex w-full max-w-[720px] flex-col items-center px-6 py-20 text-center sm:py-28"
      >
        <motion.span
          variants={item}
          className="font-mono text-xs tracking-[0.2em] text-supporting uppercase"
        >
          How it works
        </motion.span>

        <motion.h2
          variants={item}
          className="mt-4 text-3xl leading-[1.1] font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          Meet VocAligner.
        </motion.h2>

        <motion.p variants={item} className="mt-4 max-w-md text-base leading-relaxed text-muted sm:text-lg">
          It listens the way a mix engineer does — studying the tone,
          dynamics and space of the records you love — then hands back a
          stock Logic Pro chain you can build in minutes.
        </motion.p>

        <motion.div
          variants={container}
          className="mt-16 grid w-full grid-cols-1 gap-10 border-t border-black/5 pt-14 text-left sm:grid-cols-3"
        >
          {STEPS.map((step, index) => (
            <motion.div key={step.title} variants={item}>
              <span className="font-mono text-xs text-black/30">0{index + 1}</span>
              <h3 className="mt-2 text-base font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
