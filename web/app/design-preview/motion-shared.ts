import type { Variants } from "motion/react";

export const EASE = [0.16, 1, 0.3, 1] as const;

export const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

export const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const springTap = { type: "spring" as const, stiffness: 420, damping: 24 };
