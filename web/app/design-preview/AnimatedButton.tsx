"use client";

import { motion } from "motion/react";
import { springTap } from "./motion-shared";

export function AnimatedButton({
  children,
  className,
  title,
  style,
}: {
  children: React.ReactNode;
  className: string;
  title: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.button
      type="button"
      title={title}
      whileHover={{ scale: 1.035 }}
      whileTap={{ scale: 0.96 }}
      transition={springTap}
      className={className}
      style={style}
    >
      {children}
    </motion.button>
  );
}
