// A clip-path border alone can't stroke its own diagonal cut -- the browser
// just crops the rectangular border, leaving the cut edge bare. This layers
// a stroke-colored outer shape behind an inset fill-colored inner shape (both
// clipped to the same chamfer, offset by the stroke width) so the cut corner
// reads as a real uniform-width edge, not a mismatched miter.
function polygon(size: number) {
  return `polygon(${size}px 0, 100% 0, 100% calc(100% - ${size}px), calc(100% - ${size}px) 100%, 0 100%, 0 ${size}px)`;
}

export function ChamferPanel({
  size = 14,
  strokeWidth = 1,
  stroke = "rgba(0,0,0,0.15)",
  fill = "#ffffff",
  className,
  innerClassName,
  children,
}: {
  size?: number;
  strokeWidth?: number;
  stroke?: string;
  fill?: string;
  className?: string;
  innerClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{ clipPath: polygon(size), background: stroke, padding: strokeWidth }}
      className={className}
    >
      <div
        style={{ clipPath: polygon(Math.max(size - strokeWidth, 0)), background: fill }}
        className={`h-full w-full ${innerClassName ?? ""}`}
      >
        {children}
      </div>
    </div>
  );
}
