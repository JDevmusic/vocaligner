"use client";

import { MotionConfig } from "motion/react";
import { DesignH } from "./DesignH";
import { MeetSection } from "./MeetSection";

// Throwaway design-exploration page. Delete after a direction is picked.
// Round 6: owner converged on "Wash" (H) as the hero and added a second
// scroll section -- "Meet VocAligner" -- inspired by ToneAdapt's landing
// page structure (inspiring intro + concise how-it-works).

export function DesignPreviewClient() {
  return (
    <MotionConfig reducedMotion="user">
      <DesignH />
      <MeetSection />
    </MotionConfig>
  );
}
