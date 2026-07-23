"use client";

import Link from "next/link";
import { motion, MotionConfig } from "motion/react";
import { EASE } from "./motion-shared";
import { DesignH } from "./DesignH";
import { DesignI } from "./DesignI";
import { DesignJ } from "./DesignJ";

// Throwaway design-exploration page. Delete after a direction is picked.
// Round 4: owner liked F's layout (top-left eyebrow+headline, centered
// mad-libs artist/song sentence, footer chain list) and E's small
// description treatment -- kept that layout fixed across H/I/J and only
// varied the color treatment, dialed back from "flamboyant" toward
// ElevenLabs-style restraint per feedback.

export function DesignPreviewClient() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col">
        <style>{"html { scroll-behavior: smooth; }"}</style>
        <PreviewSwitcher />
        <DesignH />
        <DesignI />
        <DesignJ />
      </div>
    </MotionConfig>
  );
}

function PreviewSwitcher() {
  return (
    <motion.div
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="sticky top-0 z-50 flex items-center justify-center gap-6 border-b border-black/10 bg-white/90 py-2.5 text-xs font-medium text-zinc-500 backdrop-blur"
    >
      <span className="text-zinc-400">Design preview — jump to:</span>
      <Link href="#design-h" className="transition-colors hover:text-black">H · Wash</Link>
      <Link href="#design-i" className="transition-colors hover:text-black">I · Quiet</Link>
      <Link href="#design-j" className="transition-colors hover:text-black">J · Dusk</Link>
    </motion.div>
  );
}
