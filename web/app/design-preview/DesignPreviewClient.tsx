"use client";

import Link from "next/link";
import { motion, MotionConfig } from "motion/react";
import { EASE } from "./motion-shared";
import { DesignE } from "./DesignE";
import { DesignF } from "./DesignF";
import { DesignG } from "./DesignG";

// Throwaway design-exploration page. Delete after a direction is picked.
// Round 3: three structurally distinct concepts built around the real VA
// mark and a bolder, more saturated palette, replacing the earlier four
// (A-D) which read as too close to generic AI-product templates.

export function DesignPreviewClient() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col">
        <style>{"html { scroll-behavior: smooth; }"}</style>
        <PreviewSwitcher />
        <DesignE />
        <DesignF />
        <DesignG />
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
      <Link href="#design-e" className="transition-colors hover:text-black">E · Console</Link>
      <Link href="#design-f" className="transition-colors hover:text-black">F · Editorial</Link>
      <Link href="#design-g" className="transition-colors hover:text-black">G · Ledger</Link>
    </motion.div>
  );
}
