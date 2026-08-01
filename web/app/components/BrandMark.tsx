import { Mark } from "./Mark";

// The icon + uppercase tracked wordmark pairing used in the hero nav and
// the Footer. Not the same thing as `Wordmark.tsx` -- that one is a link
// back to "/", which doesn't make sense on the home page itself.
export function BrandMark({
  size = "default",
  className = "text-foreground",
}: {
  size?: "default" | "small";
  className?: string;
}) {
  const markSize = size === "small" ? "h-3.5" : "h-4";
  const textSize = size === "small" ? "text-xs" : "text-sm";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Mark className={`${markSize} w-auto`} />
      <span className={`${textSize} font-semibold tracking-[0.15em] uppercase`}>
        VocAligner
      </span>
    </div>
  );
}
