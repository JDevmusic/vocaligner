"use client";

import { motion } from "motion/react";
import { springTap } from "./motion-shared";

// The `href` variant renders a plain motion.a, not next/link's Link -- tried
// wrapping Link with motion.create() first, but Motion couldn't get a working
// DOM ref through it: whileHover/whileTap silently did nothing (confirmed by
// checking the rendered element's style in the browser, not just typechecking
// it). motion.a is Motion's own primitive, so the animation is guaranteed to
// work; the only cost is a full page reload instead of a client-side
// transition for these three "go back" actions, a fine tradeoff for actually
// getting real <a> semantics (new-tab, copy-link, no-JS fallback) -- see
// Story 1.4's code review, which is why this variant exists at all.
type CommonProps = {
  children: React.ReactNode;
  className: string;
  title: string;
  style?: React.CSSProperties;
};

// Either a real navigation (`href`, renders as a link) or an in-page action
// (`onClick`, renders as a button) -- not both, so a caller can't accidentally
// end up with an <a> that also needs JS to do anything.
type AnimatedButtonProps =
  | (CommonProps & { href: string; onClick?: never; type?: never; disabled?: never; form?: never })
  | (CommonProps & { href?: never; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean; form?: string });

export function AnimatedButton(props: AnimatedButtonProps) {
  const { children, className, title, style } = props;
  const hover = props.disabled ? undefined : { scale: 1.035 };
  const tap = props.disabled ? undefined : { scale: 0.96 };

  if ("href" in props && props.href !== undefined) {
    return (
      <motion.a
        href={props.href}
        title={title}
        whileHover={hover}
        whileTap={tap}
        transition={springTap}
        className={className}
        style={style}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={props.type ?? "button"}
      title={title}
      disabled={props.disabled ?? false}
      form={props.form}
      onClick={props.onClick}
      whileHover={hover}
      whileTap={tap}
      transition={springTap}
      className={className}
      style={style}
    >
      {children}
    </motion.button>
  );
}
