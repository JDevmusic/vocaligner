import { getKnobRotationDeg, invertedKnobRotationDeg } from "@/lib/controls/knobRotation";
import { niceTickValues } from "@/lib/controls/knobTicks";
import { formatParameterLabel } from "@/lib/format/parameterLabel";
import { resolveControlRange, resolveControlValue } from "@/lib/registry/controlValues";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

// Shared building blocks for the 8 knob-based Plugin Visuals (Compressor,
// DeEsser 2, ChromaVerb, Tape Delay, Overdrive, Flanger, Phaser, Chorus) --
// one knob-rendering treatment reused across all of them, per Story 1.3
// Task 1, with each plugin supplying its own bespoke section layout to
// mirror its real panel's grouping. Channel EQ and Pitch Correction don't
// use these -- they're not knob grids.

// `width`/`aspectRatio` size the panel to the real plugin's own proportions
// (docs/DESIGN_SYSTEM.md's "build to the real plugin's own proportions"
// rule) instead of stretching to fill the results page's column -- every
// plugin's design spike validated its own box size this way. `centerHeader`
// is a DeEsser-2-specific one-off (confirmed in that spike, not a new
// default); `badge` is the small muted "Standard practice" label PRD §8.9
// puts on DeEsser 2's card, next to its category/name, not a banner.
// Padding/gap inside the panel is deliberately NOT set here -- each
// plugin's own top-level layout (grid, dividers, section spacing) owns its
// own spacing, since that's bespoke per plugin by design.
export function PluginPanel({
  plugin,
  children,
  width,
  aspectRatio,
  centerHeader,
  badge,
}: {
  plugin: PluginRegistryEntry;
  children: React.ReactNode;
  width?: string;
  aspectRatio?: string;
  centerHeader?: boolean;
  badge?: string;
}) {
  const sizeStyle = width || aspectRatio ? { width, aspectRatio, maxWidth: "100%" } : undefined;
  return (
    <div style={sizeStyle}>
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className={`border-b border-border px-6 py-4 ${centerHeader ? "text-center" : ""}`}>
          <div className={`flex items-center gap-2 ${centerHeader ? "justify-center" : ""}`}>
            <span className="font-mono text-[11px] tracking-[0.2em] text-supporting uppercase">{plugin.category}</span>
            {badge ? (
              <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted opacity-70">
                {badge}
              </span>
            ) : null}
          </div>
          <h2 className="mt-0.5 text-lg font-semibold text-foreground">{plugin.displayName}</h2>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

export function KnobSection({ heading, children }: { heading?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      {heading ? <p className="text-[10px] font-semibold tracking-[0.15em] text-supporting uppercase">{heading}</p> : null}
      <div className="flex flex-wrap gap-6">{children}</div>
    </div>
  );
}

// Radial tick-mark knob, validated in the Compressor design spike
// (docs/images/spikes/compressor/) and generalized to docs/DESIGN_SYSTEM.md
// v1.5 as the standard knob treatment for all 8 knob-based plugins -- real
// Logic knobs carry tick marks around the dial's circumference, not just a
// label above and a value below. `ticks` is optional: NumberKnob always
// supplies them (computed from the control's own registry min/max, so no
// per-knob hand-tuning); FadedKnob only supplies them where a real Logic
// range has actually been researched for that specific faded control --
// otherwise it renders as a plain dial rather than fabricating a range.
const KNOB_SIZE = 84;

export interface KnobTick {
  angleDeg: number;
  label: string;
}

function knobPolarPoint(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: 60 + radius * Math.sin(rad), y: 60 - radius * Math.cos(rad) };
}

// Computes ticks for a real numeric range -- the mechanical, no-research-
// needed path used by every NumberKnob and any FadedKnob given a real min/max.
export function numericTicks(min: number, max: number): KnobTick[] {
  return niceTickValues(min, max).map((t) => ({
    angleDeg: getKnobRotationDeg(t, min, max),
    label: String(Math.round(t * 100) / 100),
  }));
}

export function Knob({
  label,
  value,
  angleDeg,
  ticks = [],
  faded,
  size = KNOB_SIZE,
}: {
  label: string;
  value: string;
  angleDeg: number;
  ticks?: KnobTick[];
  faded?: boolean;
  size?: number;
}) {
  const start = knobPolarPoint(angleDeg, 11);
  const end = knobPolarPoint(angleDeg, 25);
  // Label above the dial, sized to the dial itself -- matches ArcKnob's
  // convention (this file's other knob family) and the real reference,
  // rather than the small label-below treatment this used to render.
  // Knob's only consumer is Compressor, whose own two sizes (PRIMARY_SIZE
  // 104, SECONDARY_SIZE 78) sit well under ArcKnob's >=130 "large" cutoff,
  // so the threshold here is its own, picked to fall between those two.
  const isLarge = size >= 90;
  return (
    <div className={`flex flex-col items-center gap-1 ${faded ? "opacity-45" : ""}`}>
      <p className={`whitespace-nowrap text-center font-medium tracking-wide text-muted uppercase ${isLarge ? "text-xs" : "text-[9px]"}`}>
        {label}
      </p>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="27" fill="var(--background)" stroke="var(--border)" strokeWidth="1.5" />
        {ticks.map((t, i) => {
          const inner = knobPolarPoint(t.angleDeg, 30);
          const outer = knobPolarPoint(t.angleDeg, 35);
          const labelPos = knobPolarPoint(t.angleDeg, 47);
          return (
            <g key={i}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="var(--border)" strokeWidth="1.2" />
              <text x={labelPos.x} y={labelPos.y} fontSize={11} textAnchor="middle" dominantBaseline="middle" className="fill-supporting">
                {t.label}
              </text>
            </g>
          );
        })}
        <line
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={faded ? "var(--muted)" : "var(--brand-accent)"}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
      <p className={`whitespace-nowrap text-center ${isLarge ? "text-sm" : "text-[10px]"} ${faded ? "text-muted" : "font-semibold text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

// Label above, ON/OFF pill below -- matches the arc-knob family's
// label-above-value convention (validated across Overdrive/Flanger/
// Phaser's spikes), not the tick-mark Knob's label-below convention.
export function TogglePill({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="whitespace-nowrap text-[11px] font-medium text-foreground">{label}</p>
      <span
        className={
          on
            ? "rounded-md border border-brand-accent bg-brand-accent/15 px-3 py-1 text-xs font-semibold text-brand-accent"
            : "rounded-md border border-border bg-background px-3 py-1 text-xs font-semibold text-muted"
        }
      >
        {on ? "ON" : "OFF"}
      </span>
    </div>
  );
}

export function StringPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="rounded-md border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">{value}</span>
      <p className="text-[10px] font-medium tracking-wide text-muted uppercase">{label}</p>
    </div>
  );
}

function formatNumber(value: number): string {
  return String(Math.round(value * 100) / 100);
}

// Ratio is the one existing control that needs plugin-specific display
// convention (Logic shows compressor ratio as "4:1", not "4"); everything
// else is a plain rounded value + its registry unit.
export function formatKnobValue(parameter: string, value: number, unit?: string): string {
  if (parameter === "ratio") return `${formatNumber(value)}:1`;
  return unit ? `${formatNumber(value)} ${unit}` : formatNumber(value);
}

interface ControlProps {
  plugin: PluginRegistryEntry;
  values: ControlValue[];
  parameter: string;
}

// Resolves a single parameter (sparse values[] -> registry default fallback)
// and renders it as the appropriate widget by its registry `type` -- the
// per-plugin components below just declare which parameters go where.
// `size` supports the primary/secondary size hierarchy validated in the
// Compressor design spike -- Threshold/Ratio/Make Up (data-backed, primary)
// are visibly larger than Knee/Attack/Release (secondary) below them,
// matching the real panel's own emphasis.
export function NumberKnob({ plugin, values, parameter, size }: ControlProps & { size?: number }) {
  const definition = plugin.controls.find((c) => c.parameter === parameter);
  const raw = resolveControlValue(plugin, values, parameter);
  const value = typeof raw === "number" ? raw : 0;
  const range = resolveControlRange(plugin, parameter);
  return (
    <Knob
      label={formatParameterLabel(parameter)}
      value={formatKnobValue(parameter, value, definition?.unit)}
      angleDeg={getKnobRotationDeg(value, range.min, range.max)}
      ticks={numericTicks(range.min, range.max)}
      size={size}
    />
  );
}

export function BooleanToggle({ plugin, values, parameter }: ControlProps) {
  const raw = resolveControlValue(plugin, values, parameter);
  return <TogglePill label={formatParameterLabel(parameter)} on={raw === true} />;
}

export function StringLabel({ plugin, values, parameter }: ControlProps) {
  const raw = resolveControlValue(plugin, values, parameter);
  return <StringPill label={formatParameterLabel(parameter)} value={String(raw ?? "")} />;
}

// Faded elements: the real panel's structure that VocAligner doesn't
// generate a value for, still shown in its real position -- per
// docs/DESIGN_SYSTEM.md's Plugin Visual Fidelity Standards. `value` should
// be Logic's own real default/resting reading for that control (read off
// the reference screenshot), the same convention already used for Pitch
// Correction's Settings/Tuning sections -- never a placeholder dash or
// blank, and never implying a specific generated value.

// `min`/`max`/`def` are optional and deliberately not required: they should
// only be supplied where a real Logic range has actually been researched for
// that specific faded control (e.g. Compressor's Knee, read directly off the
// reference screenshot) -- never invented to make a knob look more precise
// than the research behind it. Without them, this renders as a plain dial
// (no ticks, pointing straight up), same as before tick marks existed.
// `ticks` is an escape hatch for a qualitative sweep (e.g. Compressor's
// Distortion: Off/Soft/Hard/Clip) that isn't a numeric range at all.
export function FadedKnob({
  label,
  value,
  min,
  max,
  def,
  ticks,
  size,
}: {
  label: string;
  value: string;
  min?: number;
  max?: number;
  def?: number;
  ticks?: KnobTick[];
  size?: number;
}) {
  const hasRange = min !== undefined && max !== undefined;
  const resolvedTicks = ticks ?? (hasRange ? numericTicks(min, max) : []);
  const angleDeg = hasRange && def !== undefined ? getKnobRotationDeg(def, min, max) : 0;
  return <Knob label={label} value={value} angleDeg={angleDeg} ticks={resolvedTicks} faded size={size} />;
}

export function FadedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-2 opacity-45">
      <span className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-muted">{value}</span>
      <p className="text-[10px] font-medium tracking-wide text-muted uppercase">{label}</p>
    </div>
  );
}

// A row of mutually-exclusive options with no data to indicate which is
// selected (e.g. Compressor's 7 circuit-mode tabs) -- shown as a faded row
// with none highlighted, rather than guessing/asserting a selection.
export function FadedTabs({ options, dense }: { options: string[]; dense?: boolean }) {
  return (
    <div className={`flex flex-wrap opacity-45 ${dense ? "gap-1" : "gap-2"}`}>
      {options.map((option) => (
        <span
          key={option}
          className={`rounded-md border border-border bg-background text-center font-medium text-muted ${dense ? "px-0.5 py-0.5 text-[9px]" : "px-3 py-1.5 text-[11px]"}`}
        >
          {option}
        </span>
      ))}
    </div>
  );
}

// A meter, graph, or curve display -- visual elements with no data backing
// them at all (Compressor's gain-reduction meter, ChromaVerb's damping EQ
// curve, Overdrive's drive/tone response graph). Shown as a labeled, faded
// placeholder occupying the real panel's layout position, not a fabricated
// chart implying real readings.
//
// `aspectRatio` sizes the box to the real plugin's own measured proportions
// (e.g. Compressor's meter, ~2.92:1) instead of the default flex-1 behavior,
// which stretches to fill whatever space its flex container has free -- a
// placeholder with no content of its own has nothing to size itself by, so
// left unconstrained it can end up dominating the panel instead of matching
// the real element's real footprint.
export function FadedDisplay({ label, aspectRatio }: { label: string; aspectRatio?: string }) {
  return (
    <div
      className={`flex w-full min-w-[220px] items-center justify-center rounded-lg border border-border bg-background/60 opacity-45 ${aspectRatio ? "" : "h-20 flex-1"}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      <p className="text-[10px] font-medium tracking-wide text-muted uppercase">{label}</p>
    </div>
  );
}

// =============================================================================
// Arc-ring knob family -- the alternative knob treatment validated across the
// ChromaVerb, Tape Delay, DeEsser 2, Overdrive, Flanger, Phaser, and Chorus
// design spikes, for plugins whose real dial has no tick-mark numbers (just a
// filled arc ring, label above, value below). Compressor keeps the tick-mark
// `Knob` above -- its real dials DO have tick numbers. See
// docs/DESIGN_SYSTEM.md's Plugin Visual Fidelity Standards for when to use
// which.
// =============================================================================

const ARC_KNOB_MIN_DEG = -135;
const ARC_KNOB_MAX_DEG = 135;
const ARC_KNOB_SIZE = 92;

function arcKnobRotationDeg(value: number, min: number, max: number): number {
  if (max <= min) return ARC_KNOB_MIN_DEG;
  const clamped = Math.min(max, Math.max(min, value));
  const t = (clamped - min) / (max - min);
  return ARC_KNOB_MIN_DEG + t * (ARC_KNOB_MAX_DEG - ARC_KNOB_MIN_DEG);
}

function arcPoint(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: 60 + radius * Math.sin(rad), y: 60 - radius * Math.cos(rad) };
}

function describeArc(startDeg: number, endDeg: number, radius: number) {
  const start = arcPoint(startDeg, radius);
  const end = arcPoint(endDeg, radius);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

// `startDeg` overrides where the fill begins -- defaults to the dial's
// absolute minimum (a normal unipolar knob), but a bipolar (centered-at-
// zero) knob like Tape Delay's Clip Threshold/Spread or Flanger's Feedback
// passes the center value's own angle instead, so the fill runs from 12
// o'clock outward toward whichever side the value sits on (see
// docs/DESIGN_SYSTEM.md's bipolar-knob rule). `icon` sits inline with the
// label (Tape Delay's Decay/Predelay tempo-sync icon) -- keeps every knob's
// label starting at the same height whether or not it has one.
export function ArcKnob({
  label,
  value,
  angleDeg,
  startDeg = ARC_KNOB_MIN_DEG,
  faded,
  size = ARC_KNOB_SIZE,
  minLabel,
  maxLabel,
  icon,
  refValue,
  refLabel,
  min,
  max,
}: {
  label: string;
  value: string;
  angleDeg: number;
  startDeg?: number;
  faded?: boolean;
  size?: number;
  minLabel?: string;
  maxLabel?: string;
  icon?: React.ReactNode;
  // A small reference tick on the track, independent of minLabel/maxLabel --
  // Overdrive's Output dial marks "0" at unity gain on the real panel, not
  // just at its min/max endpoints. Needs both `min`/`max` (to place it) and
  // `refValue`/`refLabel` (what it marks).
  refValue?: number;
  refLabel?: string;
  min?: number;
  max?: number;
}) {
  const track = describeArc(ARC_KNOB_MIN_DEG, ARC_KNOB_MAX_DEG, 42);
  const color = faded ? "var(--muted)" : "var(--brand-accent)";
  const lower = Math.min(startDeg, angleDeg);
  const upper = Math.max(startDeg, angleDeg);
  const fill = upper - lower > 0.5 ? describeArc(lower, upper, 42) : null;
  const needleStart = arcPoint(angleDeg, 15);
  const needleEnd = arcPoint(angleDeg, 34);
  const refDeg = refValue !== undefined && min !== undefined && max !== undefined ? arcKnobRotationDeg(refValue, min, max) : undefined;
  const refInner = refDeg !== undefined ? arcPoint(refDeg, 38) : undefined;
  const refOuter = refDeg !== undefined ? arcPoint(refDeg, 46) : undefined;
  const refTextPos = refDeg !== undefined ? arcPoint(refDeg, 54) : undefined;
  // Label/value text scales with the dial itself -- validated in the
  // Flanger/Chorus spikes, where a bigger knob (>=130px, those two plugins'
  // only real controls) got proportionally bigger text, not the same small
  // size sitting on top of a larger dial.
  const isLarge = size >= 130;
  return (
    <div className={`flex flex-col items-center gap-1 ${faded ? "opacity-45" : ""}`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <p className={`whitespace-nowrap font-medium text-foreground ${isLarge ? "text-lg" : "text-[11px]"}`}>{label}</p>
      </div>
      <p className={`whitespace-nowrap font-semibold ${isLarge ? "text-base" : "text-sm"} ${faded ? "text-muted" : "text-brand-accent"}`}>{value}</p>
      <svg width={size} height={size} viewBox="0 0 120 120" overflow="visible">
        <circle cx="60" cy="60" r="34" fill="var(--background)" stroke="var(--border)" strokeWidth="1" />
        <path d={track} fill="none" stroke="var(--border)" strokeWidth="5" strokeLinecap="round" />
        {fill ? <path d={fill} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" /> : null}
        {refInner && refOuter ? <line x1={refInner.x} y1={refInner.y} x2={refOuter.x} y2={refOuter.y} stroke="var(--muted)" strokeWidth="1.5" /> : null}
        {refTextPos && refLabel ? (
          <text x={refTextPos.x} y={refTextPos.y} fontSize={9} textAnchor="middle" dominantBaseline="middle" className="fill-muted">
            {refLabel}
          </text>
        ) : null}
        <line x1={needleStart.x} y1={needleStart.y} x2={needleEnd.x} y2={needleEnd.y} stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
      {minLabel !== undefined && maxLabel !== undefined ? (
        <div className={`flex w-full justify-between px-2 text-muted ${isLarge ? "text-xs" : "text-[10px]"}`}>
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      ) : null}
    </div>
  );
}

export interface NumberArcKnobProps extends ControlProps {
  size?: number;
  minMax?: boolean;
  minLabel?: string;
  maxLabel?: string;
  bipolar?: boolean;
  invert?: boolean;
  label?: string;
  icon?: React.ReactNode;
  refValue?: number;
  refLabel?: string;
}

// `invert`: DeEsser 2's Max Reduction dial runs high-to-low left-to-right
// (confirmed against the reference's own printed labels, not assumed) --
// same fraction-of-range math as a normal knob, just mapped onto the angle
// range backwards, via `invertedKnobRotationDeg` from
// `web/lib/controls/knobRotation.ts`. `label` overrides the auto-derived
// parameter label for cases where the real panel's own label differs from
// the registry parameter name (e.g. Phaser's `feedback` control is labeled
// "Level" on the real panel -- the section header already says FEEDBACK).
// `minLabel`/`maxLabel` override `minMax`'s auto-derived registry min/max
// text for a cosmetic display difference (e.g. Overdrive's Tone prints
// "20k" on the real panel, not the registry's literal "20000") -- the
// underlying value/range/fill math is unaffected, only the printed text.
export function NumberArcKnob({ plugin, values, parameter, size, minMax, minLabel, maxLabel, bipolar, invert, label, icon, refValue, refLabel }: NumberArcKnobProps) {
  const definition = plugin.controls.find((c) => c.parameter === parameter);
  const raw = resolveControlValue(plugin, values, parameter);
  const value = typeof raw === "number" ? raw : 0;
  const range = resolveControlRange(plugin, parameter);
  const angleDeg = invert
    ? invertedKnobRotationDeg(value, range.min, range.max)
    : arcKnobRotationDeg(value, range.min, range.max);
  const startDeg = bipolar ? arcKnobRotationDeg((range.min + range.max) / 2, range.min, range.max) : ARC_KNOB_MIN_DEG;
  const resolvedMinLabel = minLabel ?? (minMax ? String(invert ? range.max : range.min) : undefined);
  const resolvedMaxLabel = maxLabel ?? (minMax ? String(invert ? range.min : range.max) : undefined);
  return (
    <ArcKnob
      label={label ?? formatParameterLabel(parameter)}
      value={formatKnobValue(parameter, value, definition?.unit)}
      angleDeg={angleDeg}
      startDeg={startDeg}
      size={size}
      minLabel={resolvedMinLabel}
      maxLabel={resolvedMaxLabel}
      icon={icon}
      refValue={refValue}
      refLabel={refLabel}
      min={range.min}
      max={range.max}
    />
  );
}

// Faded arc knob with no registry data -- `numericValue`/`min`/`max` should
// be Logic's own real resting value and range read off the reference
// screenshot (same discipline as `FadedKnob` above), never invented.
export function FadedArcKnob({
  label,
  value,
  numericValue,
  min = 0,
  max = 100,
  bipolar,
  minLabel,
  maxLabel,
  size,
}: {
  label: string;
  value: string;
  numericValue: number;
  min?: number;
  max?: number;
  bipolar?: boolean;
  minLabel?: string;
  maxLabel?: string;
  size?: number;
}) {
  const angleDeg = arcKnobRotationDeg(numericValue, min, max);
  const startDeg = bipolar ? arcKnobRotationDeg((min + max) / 2, min, max) : ARC_KNOB_MIN_DEG;
  return <ArcKnob label={label} value={value} angleDeg={angleDeg} startDeg={startDeg} faded minLabel={minLabel} maxLabel={maxLabel} size={size} />;
}

// A small faded icon button (tempo-sync note icon) with no backing data --
// Tape Delay's Decay/Predelay, Flanger's Rate, Phaser's Rate 1/Rate 2.
export function FadedSyncIcon({ size = 28 }: { size?: number }) {
  const iconSize = Math.round(size * 0.39);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded border border-border bg-background opacity-45"
      style={{ width: size, height: size }}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 11 11" fill="none">
        <circle cx="3" cy="8" r="2" fill="var(--muted)" />
        <circle cx="9" cy="7" r="2" fill="var(--muted)" />
        <path d="M5 8V2l5-1v6" stroke="var(--muted)" strokeWidth="1" />
      </svg>
    </div>
  );
}

// =============================================================================
// Fader family -- vertical/horizontal fill sliders, the real control type on
// several plugins' panels where the brief's first pass assumed a knob
// (ChromaVerb/Tape Delay's Dry/Wet, Phaser's Out Mix). Same "filled =
// reached, grey = remaining" convention as the arc knobs, just linear.
// =============================================================================

const FADER_HEIGHT = 128;

// Some faders are Hz-range controls (Phaser's faded Low Cut/High Cut) whose
// position reads log-scaled on the real panel, same as a frequency knob.
function logFraction(value: number, min: number, max: number): number {
  const clampedMin = Math.max(min, 1e-6);
  const clamped = Math.min(max, Math.max(clampedMin, value));
  return (Math.log(clamped) - Math.log(clampedMin)) / (Math.log(max) - Math.log(clampedMin));
}

export function VerticalFader({
  label,
  value,
  percent,
  faded,
  height = FADER_HEIGHT,
}: {
  label: string;
  value: string;
  percent: number;
  faded?: boolean;
  height?: number;
}) {
  const color = faded ? "bg-muted" : "bg-brand-accent";
  return (
    <div className={`flex flex-col items-center gap-1 ${faded ? "opacity-45" : ""}`}>
      <p className="whitespace-nowrap text-[11px] font-medium text-foreground">{label}</p>
      <p className={`whitespace-nowrap text-sm font-semibold ${faded ? "text-muted" : "text-brand-accent"}`}>{value}</p>
      <div className="relative w-1.5 overflow-hidden rounded-full bg-border" style={{ height }}>
        <div className={`absolute bottom-0 left-0 w-full rounded-full ${color}`} style={{ height: `${percent}%` }} />
      </div>
    </div>
  );
}

export interface NumberVerticalFaderProps extends ControlProps {
  log?: boolean;
  plusPrefix?: boolean;
  height?: number;
}

// `plusPrefix`: Phaser's Out Mix prints a literal "+" ahead of positive
// values on the real panel ("+50 %") -- replicated as display text, not
// implying a bipolar range the registry doesn't have.
export function NumberVerticalFader({ plugin, values, parameter, log: useLog, plusPrefix, height }: NumberVerticalFaderProps) {
  const definition = plugin.controls.find((c) => c.parameter === parameter);
  const raw = resolveControlValue(plugin, values, parameter);
  const value = typeof raw === "number" ? raw : 0;
  const range = resolveControlRange(plugin, parameter);
  const percent = useLog ? logFraction(value, range.min, range.max) * 100 : ((value - range.min) / (range.max - range.min)) * 100;
  const display = `${plusPrefix && value >= 0 ? "+" : ""}${formatKnobValue(parameter, value, definition?.unit)}`;
  return <VerticalFader label={formatParameterLabel(parameter)} value={display} percent={percent} height={height} />;
}

export function FadedVerticalFader({
  label,
  value,
  percent,
  height,
}: {
  label: string;
  value: string;
  percent: number;
  height?: number;
}) {
  return <VerticalFader label={label} value={value} percent={percent} faded height={height} />;
}

// The track+fill+handle for a single-handle horizontal fill slider (faded,
// no registry data -- Tape Delay's Smoothing, Phaser's LFO 1/2 Mix). The
// label row above it is bespoke per plugin (a plain label+value pair vs. a
// left%/label/right% row), so it isn't baked in here.
export function HorizontalFillTrack({ percent, handleShape = "circle" }: { percent: number; handleShape?: "circle" | "bar" }) {
  return (
    <div className="relative h-1.5 w-full rounded-full bg-border">
      <div className="absolute left-0 top-0 h-full rounded-full bg-muted" style={{ width: `${percent}%` }} />
      <div
        className={`absolute top-1/2 h-3 -translate-x-1/2 -translate-y-1/2 border border-border bg-white ${
          handleShape === "circle" ? "w-3 rounded-full" : "w-1.5 rounded-sm"
        }`}
        style={{ left: `${percent}%` }}
      />
    </div>
  );
}

// Dual-handle range track (Tape Delay's horizontal Low Cut/High Cut,
// faded/shape-only; Phaser's vertical Ceiling/Floor, real data so bold
// fill). One shared track, not two independent single-handle sliders --
// the fill runs between the two handles, not from an edge.
export function DualRangeTrack({
  orientation,
  lowerPercent,
  upperPercent,
  faded,
}: {
  orientation: "horizontal" | "vertical";
  lowerPercent: number;
  upperPercent: number;
  faded?: boolean;
}) {
  const fillColor = faded ? "bg-muted" : "bg-brand-accent";
  if (orientation === "horizontal") {
    return (
      <div className="relative h-1.5 w-full rounded-full bg-border">
        <div
          className={`absolute top-0 h-full rounded-full ${fillColor}`}
          style={{ left: `${lowerPercent}%`, width: `${upperPercent - lowerPercent}%` }}
        />
        <div className="absolute top-1/2 h-3 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-border bg-white" style={{ left: `${lowerPercent}%` }} />
        <div className="absolute top-1/2 h-3 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-border bg-white" style={{ left: `${upperPercent}%` }} />
      </div>
    );
  }
  return (
    <div className="relative w-1.5 rounded-full bg-border" style={{ height: FADER_HEIGHT }}>
      <div
        className={`absolute left-0 w-full rounded-full ${fillColor}`}
        style={{ bottom: `${lowerPercent}%`, height: `${upperPercent - lowerPercent}%` }}
      />
      <div className="absolute left-1/2 h-1.5 w-4 -translate-x-1/2 translate-y-1/2 rounded-sm border border-border bg-white" style={{ bottom: `${upperPercent}%` }} />
      <div className="absolute left-1/2 h-1.5 w-4 -translate-x-1/2 translate-y-1/2 rounded-sm border border-border bg-white" style={{ bottom: `${lowerPercent}%` }} />
    </div>
  );
}

// =============================================================================
// Dropdown + large section heading
// =============================================================================

export function Dropdown({ label, value, faded }: { label: string; value: string; faded?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 ${faded ? "opacity-45" : ""}`}>
      <p className="whitespace-nowrap text-[11px] font-medium text-foreground">{label}</p>
      <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1">
        <span className={`whitespace-nowrap text-sm font-semibold ${faded ? "text-muted" : "text-brand-accent"}`}>{value}</span>
        <span className="text-[9px] text-muted">▾</span>
      </div>
    </div>
  );
}

export function StringDropdown({ plugin, values, parameter }: ControlProps) {
  const raw = resolveControlValue(plugin, values, parameter);
  return <Dropdown label={formatParameterLabel(parameter)} value={String(raw ?? "")} />;
}

// Large, centered section title (SWEEP, DELAY, FEEDBACK, etc.) -- validated
// in the Tape Delay and Phaser design spikes, where the real panel's own
// titles are noticeably large and centered within their section's width,
// not `KnobSection`'s small left-aligned heading.
export function SectionHeading({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-base font-semibold tracking-[0.15em] text-supporting uppercase">{children}</p>;
}
