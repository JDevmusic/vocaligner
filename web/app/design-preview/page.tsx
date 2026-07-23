import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { DesignPreviewClient } from "./DesignPreviewClient";

// Throwaway design-exploration page. Delete after a direction is picked.

const displayFont = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DesignPreviewPage() {
  return (
    <div className={displayFont.variable}>
      <DesignPreviewClient />
    </div>
  );
}
