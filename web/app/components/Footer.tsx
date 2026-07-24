import { Mark } from "./Mark";

// Landing page only. Minimal: brand mark + wordmark on one side, a
// copyright + trademark disclaimer on the other. No links to pages that
// don't exist yet -- see docs/DESIGN_SYSTEM.md's Footer section.

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: "var(--wash-purple-deep)" }}>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-3 px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <Mark className="h-3.5 w-auto text-white/50" />
          <span className="text-xs font-semibold tracking-[0.15em] text-white/50 uppercase">
            VocAligner
          </span>
        </div>

        <p className="text-xs text-white/40">
          © {year} VocAligner. Not affiliated with or endorsed by Apple. Logic Pro is a trademark of Apple Inc.
        </p>
      </div>
    </footer>
  );
}
