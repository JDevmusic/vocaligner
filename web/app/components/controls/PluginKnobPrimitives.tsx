import { getKnobRotationDeg } from "@/lib/controls/knobRotation";
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

export function Knob({ label, value, angleDeg }: { label: string; value: string; angleDeg: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-14 w-14 rounded-full border border-border bg-background">
        <div
          className="absolute left-1/2 top-1/2 h-5 w-0.5 rounded-full bg-brand-accent"
          style={{ transform: `translate(-50%, -100%) rotate(${angleDeg}deg)`, transformOrigin: "bottom center" }}
        />
      </div>
      <div className="text-center">
        <p className="text-[10px] font-medium tracking-wide text-muted uppercase">{label}</p>
        <p className="text-xs font-semibold text-foreground">{value}</p>
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
