import type { Metadata } from "next";
import { DesignPreviewClient } from "./DesignPreviewClient";

// Throwaway design-exploration page. Delete after a direction is picked.

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DesignPreviewPage() {
  return <DesignPreviewClient />;
}
