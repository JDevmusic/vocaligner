import { getKnobRotationDeg } from "@/lib/controls/knobRotation";
import { getScaleNotes } from "@/lib/pitch/scaleIntervals";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

const WHITE_KEYS = ["C", "D", "E", "F", "G", "A", "B"];
const BLACK_KEYS = [
  { name: "C#", afterWhiteIndex: 0 },
  { name: "D#", afterWhiteIndex: 1 },
  { name: "F#", afterWhiteIndex: 3 },
  { name: "G#", afterWhiteIndex: 4 },
  { name: "A#", afterWhiteIndex: 5 },
];

function resolveControlValue(
  plugin: PluginRegistryEntry,
  values: ControlValue[],
  parameter: string
): string | number | boolean | undefined {
  const found = values.find((v) => v.parameter === parameter);
  if (found) return found.value;
  return plugin.controls.find((c) => c.parameter === parameter)?.default;
}

function resolveControlRange(plugin: PluginRegistryEntry, parameter: string): { min: number; max: number } {
  const definition = plugin.controls.find((c) => c.parameter === parameter);
  return { min: definition?.min ?? 0, max: definition?.max ?? 1 };
}

function FadedToggle({ label, value }: { label: string; value: string }) {
  return (
    <div className="opacity-45">
      <p className="text-[10px] font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className="rounded-md border border-border bg-background px-2 py-1 text-center text-xs text-muted">{value}</p>
    </div>
  );
}

function PitchKnob({ label, value, angleDeg, faded }: { label: string; value: string; angleDeg: number; faded?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-2 ${faded ? "opacity-45" : ""}`}>
      <div className="relative h-12 w-12 rounded-full border border-border bg-background">
        <div
          className={`absolute left-1/2 top-1/2 h-4 w-0.5 rounded-full ${faded ? "bg-muted" : "bg-brand-accent"}`}
          style={{ transform: `translate(-50%, -100%) rotate(${angleDeg}deg)`, transformOrigin: "bottom center" }}
        />
      </div>
      <div className="text-center">
        <p className="text-[10px] font-medium tracking-wide text-muted uppercase">{label}</p>
        <p className={`text-xs ${faded ? "text-muted" : "font-semibold text-foreground"}`}>{value}</p>
      </div>
    </div>
  );
}

export function PitchCorrectionVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  const rootNote = String(resolveControlValue(plugin, values, "rootNote") ?? "C");
  const scale = String(resolveControlValue(plugin, values, "scale") ?? "Major Scale");
  const response = Number(resolveControlValue(plugin, values, "response") ?? 0);
  const tolerance = Number(resolveControlValue(plugin, values, "tolerance") ?? 0);

  const responseRange = resolveControlRange(plugin, "response");
  const toleranceRange = resolveControlRange(plugin, "tolerance");

  // Computed from real music-theory interval math (see
  // web/lib/pitch/scaleIntervals.ts), not a fixed/literal black-white piano.
  const scaleNotes = getScaleNotes(rootNote, scale);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-6 py-4">
        <span className="font-mono text-[11px] tracking-[0.2em] text-supporting uppercase">{plugin.category}</span>
        <h2 className="mt-0.5 text-lg font-semibold text-foreground">{plugin.displayName}</h2>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-5">
        <div className="flex gap-8">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-muted uppercase">Root Note</p>
            <p className="text-sm font-semibold text-foreground">{rootNote}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium tracking-wide text-muted uppercase">Scale / Chord</p>
            <p className="text-sm font-semibold text-foreground">{scale}</p>
          </div>
        </div>
        <div className="flex gap-2 opacity-45">
          <span className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] text-muted">Edit Scale</span>
          <span className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] text-muted">Bypass Notes</span>
          <span className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] text-muted">Bypass All</span>
        </div>
      </div>

      {/* ~2.5:1 width:height, matching the real plugin's keyboard proportions.
          Exactly two flat colors regardless of black/white key shape -- no
          per-key tinting/blending, per docs/DESIGN_SYSTEM.md's Plugin Visual
          Fidelity Standards. */}
      <div className="px-6 pt-4">
        <div className="relative flex w-full" style={{ aspectRatio: "2.5 / 1" }}>
          {WHITE_KEYS.map((note) => (
            <div
              key={note}
              className={
                scaleNotes.has(note)
                  ? "flex flex-1 items-end justify-center rounded-b-md border border-foreground/15 bg-brand-accent pb-3 text-sm font-semibold text-foreground"
                  : "flex flex-1 items-end justify-center rounded-b-md border border-foreground/15 bg-border pb-3 text-sm text-muted"
              }
            >
              {note}
            </div>
          ))}
          {BLACK_KEYS.map((key) => (
            <div
              key={key.name}
              className={
                scaleNotes.has(key.name)
                  ? "absolute top-0 flex h-[62%] w-[7%] items-end justify-center rounded-b-md border border-foreground/15 bg-brand-accent pb-2 text-xs font-semibold text-foreground"
                  : "absolute top-0 flex h-[62%] w-[7%] items-end justify-center rounded-b-md border border-foreground/15 bg-border pb-2 text-xs text-muted"
              }
              style={{ left: `${((key.afterWhiteIndex + 1) / 7) * 100 - 3.5}%` }}
            >
              {key.name}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 px-6 pt-4 opacity-45">
        <span className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] text-muted">Show: Input</span>
        <span className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] text-muted">Output</span>
      </div>

      <div className="mt-4 grid grid-cols-1 divide-y divide-border border-t border-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="px-6 py-5">
          <p className="mb-4 text-xs font-semibold text-foreground">Settings</p>
          <div className="flex flex-wrap items-end gap-6">
            <div className="opacity-45">
              <p className="text-[10px] font-medium tracking-wide text-muted uppercase">Neural Pitch Detection</p>
              <p className="rounded-md border border-border bg-background px-2 py-1 text-center text-xs text-muted">On</p>
            </div>
            <FadedToggle label="Pitch Range" value="Normal" />
            <PitchKnob
              label="Response"
              value={`${response} ms`}
              angleDeg={getKnobRotationDeg(response, responseRange.min, responseRange.max)}
            />
            <PitchKnob
              label="Tolerance"
              value={`${tolerance} Cent`}
              angleDeg={getKnobRotationDeg(tolerance, toleranceRange.min, toleranceRange.max)}
            />
          </div>
        </div>
        <div className="px-6 py-5 opacity-45">
          <p className="mb-4 text-xs font-semibold text-foreground">Tuning</p>
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className="text-[10px] font-medium tracking-wide text-muted uppercase">Global Tuning</p>
              <p className="rounded-md border border-border bg-background px-2 py-1 text-center text-xs text-muted">On</p>
            </div>
            <FadedToggle label="Reference" value="0 ct" />
            <PitchKnob label="Detune" value="0 ct" angleDeg={0} faded />
          </div>
        </div>
      </div>

      <p className="border-t border-border px-6 py-3 text-[11px] text-supporting">
        Faded controls are at Logic&apos;s own default — leave them exactly as they are.
      </p>
    </div>
  );
}
