"use client";

import { MotionConfig } from "motion/react";
import { DesignH } from "./DesignH";

// Throwaway design-exploration page. Delete after a direction is picked.
// Round 5: owner converged on "Wash" (H) as the direction and is now
// iterating on it directly, so this no longer needs a multi-way switcher.

export function DesignPreviewClient() {
  return (
    <MotionConfig reducedMotion="user">
      <DesignH />
    </MotionConfig>
  );
}
