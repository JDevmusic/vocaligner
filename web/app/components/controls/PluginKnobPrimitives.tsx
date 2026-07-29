import { getKnobRotationDeg } from "@/lib/controls/knobRotation";
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

export function PluginPanel({ plugin, children }: { plugin: PluginRegistryEntry; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-6 py-4">
        <span className="font-mono text-[11px] tracking-[0.2em] text-supporting uppercase">{plugin.category}</span>
        <h2 className="mt-0.5 text-lg font-semibold text-foreground">{plugin.displayName}</h2>
      </div>
      <div className="flex flex-wrap gap-x-10 gap-y-6 px-6 py-6">{children}</div>
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
  return (
    <div className={`flex flex-col items-center gap-1 ${faded ? "opacity-45" : ""}`}>
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
      <div className="text-center">
        <p className="text-[9px] font-medium tracking-wide text-muted uppercase">{label}</p>
        <p className={faded ? "text-[10px] text-muted" : "text-[10px] font-semibold text-foreground"}>{value}</p>
      </div>
    </div>
  );
}

export function TogglePill({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={
          on
            ? "rounded-md border border-brand-accent bg-brand-accent/15 px-3 py-1 text-xs font-semibold text-brand-accent"
            : "rounded-md border border-border bg-background px-3 py-1 text-xs font-semibold text-muted"
        }
      >
        {on ? "On" : "Off"}
      </span>
      <p className="text-[10px] font-medium tracking-wide text-muted uppercase">{label}</p>
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
export function NumberKnob({ plugin, values, parameter }: ControlProps) {
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
}: {
  label: string;
  value: string;
  min?: number;
  max?: number;
  def?: number;
  ticks?: KnobTick[];
}) {
  const hasRange = min !== undefined && max !== undefined;
  const resolvedTicks = ticks ?? (hasRange ? numericTicks(min, max) : []);
  const angleDeg = hasRange && def !== undefined ? getKnobRotationDeg(def, min, max) : 0;
  return <Knob label={label} value={value} angleDeg={angleDeg} ticks={resolvedTicks} faded />;
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
export function FadedTabs({ options }: { options: string[] }) {
  return (
    <div className="flex flex-wrap gap-2 opacity-45">
      {options.map((option) => (
        <span key={option} className="rounded-md border border-border bg-background px-3 py-1.5 text-center text-[11px] font-medium text-muted">
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
export function FadedDisplay({ label }: { label: string }) {
  return (
    <div className="flex h-20 w-full min-w-[220px] flex-1 items-center justify-center rounded-lg border border-border bg-background/60 opacity-45">
      <p className="text-[10px] font-medium tracking-wide text-muted uppercase">{label}</p>
    </div>
  );
}
