import { BrandMark } from "./BrandMark";

// Landing page only. Minimal: brand mark + wordmark on one side, a
// copyright + trademark disclaimer on the other. No links to pages that
// don't exist yet -- see docs/DESIGN_SYSTEM.md's Footer section.

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: "var(--wash-purple-deep)" }}>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-3 px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <BrandMark size="small" className="text-on-dark/50" />

        <div className="flex flex-col items-center gap-1 sm:items-end">
          {/* suppressHydrationWarning: the year is computed at render time, so a
              server render and a client hydration that straddle a year boundary
              (rare, but possible near midnight) could otherwise mismatch. */}
          <p className="text-xs text-on-dark/40" suppressHydrationWarning>
            © {year} VocAligner. Not affiliated with or endorsed by Apple. Logic Pro is a trademark of Apple Inc.
          </p>
          <a
            href="https://getsongbpm.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-on-dark/40 underline decoration-on-dark/20 underline-offset-2 transition-colors hover:text-on-dark/70"
          >
            Song data by GetSongBPM
          </a>
        </div>
      </div>
    </footer>
  );
}
