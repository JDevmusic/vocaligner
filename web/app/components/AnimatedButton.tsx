"use client";

import { motion } from "motion/react";
import { springTap } from "./motion-shared";

export function AnimatedButton({
  children,
  className,
  title,
  style,
  type = "button",
  disabled = false,
  form,
}: {
  children: React.ReactNode;
  className: string;
  title: string;
  style?: React.CSSProperties;
  type?: "button" | "submit";
  disabled?: boolean;
  form?: string;
}) {
  return (
    <motion.button
      type={type}
      title={title}
      disabled={disabled}
      form={form}
      whileHover={disabled ? undefined : { scale: 1.035 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={springTap}
      className={className}
      style={style}
    >
      {children}
    </motion.button>
  );
}
