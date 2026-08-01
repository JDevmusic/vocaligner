"use client";

import { motion } from "motion/react";
import { STEPS } from "../landing-copy";
import { container, item } from "./motion-shared";

// "Meet VocAligner" -- the how-it-works section below the hero.
// Background picks up exactly where the hero's gradient ends (wash-purple)
// and deepens further into near-black, so the two sections read as one
// continuous piece rather than a hard cut back to light. See
// docs/DESIGN_SYSTEM.md's Storytelling Sections.

export function MeetSection() {
  return (
    <section
      className="relative flex flex-col"
      style={{
        background: "linear-gradient(to bottom, var(--wash-purple) 0%, var(--wash-purple-deep) 30%, var(--wash-purple-deep) 100%)",
      }}
    >
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-12 px-6 py-20 sm:px-10 sm:py-28 lg:grid-cols-[1fr_1fr] lg:items-start lg:gap-16"
      >
        <div>
          <motion.span
            variants={item}
            className="font-mono text-xs tracking-[0.2em] text-on-dark/55 uppercase"
          >
            How it works
          </motion.span>

          <motion.h2
            variants={item}
            className="mt-4 text-4xl leading-[1.05] font-semibold tracking-tight text-on-dark sm:text-5xl"
          >
            Meet VocAligner.
          </motion.h2>

          <motion.p variants={item} className="mt-5 max-w-md text-base leading-relaxed text-on-dark/70 sm:text-lg">
            It listens the way a mix engineer does — studying the tone,
            dynamics and space of the records you love — then hands back a
            stock Logic Pro chain you can build in minutes.
          </motion.p>
        </div>

        <div className="flex flex-col gap-4">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.title}
              variants={item}
              className="rounded-xl border border-on-dark/10 bg-on-dark/5 p-5"
            >
              <span className="font-mono text-xs text-on-dark/40">0{index + 1}</span>
              <h3 className="mt-2 text-base font-semibold text-on-dark">{step.title}</h3>
              <p className="mt-1.5 text-sm text-on-dark/60">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
