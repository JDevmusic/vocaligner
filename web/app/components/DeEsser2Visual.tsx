import { ArcKnob, Dropdown, FadedArcKnob, FadedTabs, PluginPanel } from "./controls/PluginKnobPrimitives";
import { invertedKnobRotationDeg } from "@/lib/controls/knobRotation";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

// PRD §8.9: DeEsser 2's Threshold, Max Reduction, and Frequency are never
// researched/generated per song -- de-essing amount is corrective (reacts
// to a specific vocal take's actual sibilance, which VocAligner can't know
// without analyzing the user's own recording), unlike a stylistic choice
// such as reverb character. They always render at Logic's own defaults,
// faded, same treatment as an untouched Channel EQ band -- regardless of
// whatever a Generation's `values` might actually contain for these three
// parameters. This is why every read below goes straight to the registry's
// own `default`, never `values`/`resolveControlValue` -- don't "fix" this
// to read real data without re-reading PRD §8.9 first, it's deliberate.
function registryDefault(plugin: PluginRegistryEntry, parameter: string): number {
  const definition = plugin.controls.find((c) => c.parameter === parameter);
  return typeof definition?.default === "number" ? definition.default : 0;
}

function registryRange(plugin: PluginRegistryEntry, parameter: string): { min: number; max: number } {
  const definition = plugin.controls.find((c) => c.parameter === parameter);
  return { min: definition?.min ?? 0, max: definition?.max ?? 1 };
}

// ---- Detection / Reduction meter strips ------------------------------------
// No live signal behind either meter (there's no audio to analyze), but the
// marker line is still tied to a real number (Threshold/Max Reduction's
// registry default, per the always-faded rule above) rather than hardcoded
// at an arbitrary example position. Real Logic's own scale isn't linear --
// ticks are printed at equal pixel spacing regardless of their dB delta --
// matched by interpolating the marker's position between whichever two
// tick labels bracket it, using the ticks' equal-spaced positions rather
// than the raw dB values.
const DETECTION_TICKS = [6, 3, 0, -3, -6, -9, -12, -16, -20, -24, -30, -40, -50, -60];
const REDUCTION_TICKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 20, 25];
const METER_HEIGHT = 260;

function tickFraction(ticks: number[], value: number): number {
  const n = ticks.length;
  for (let i = 0; i < n - 1; i++) {
    const a = ticks[i];
    const b = ticks[i + 1];
    const between = (value <= a && value >= b) || (value >= a && value <= b);
    if (between) {
      const t = a === b ? 0 : (value - a) / (b - a);
      return (i + t) / (n - 1);
    }
  }
  const descending = ticks[0] > ticks[n - 1];
  const beforeStart = descending ? value > ticks[0] : value < ticks[0];
  return beforeStart ? 0 : 1;
}

function DbMeterStrip({
  heading,
  restingValueLabel,
  ticks,
  markerValue,
  markerLabel,
}: {
  heading: string;
  restingValueLabel: string;
  ticks: number[];
  markerValue: number;
  markerLabel: string;
}) {
  const fraction = tickFraction(ticks, markerValue);
  return (
    <div className="flex w-24 flex-col gap-2">
      <p className="text-[10px] font-semibold tracking-[0.1em] text-muted uppercase opacity-45">{heading}</p>
      <div className="flex items-baseline justify-between opacity-45">
        <span className="text-[9px] text-muted">dB</span>
        <span className="text-[10px] font-medium text-muted">{restingValueLabel}</span>
      </div>
      <div className="relative" style={{ height: METER_HEIGHT }}>
        <div className="absolute inset-0 border-l border-border opacity-45">
          {ticks.map((t, i) => (
            <div
              key={t}
              className="absolute left-0 flex items-center gap-1"
              style={{ top: `${(i / (ticks.length - 1)) * 100}%`, transform: "translateY(-50%)" }}
            >
              <div className="h-px w-1.5 bg-border" />
              <span className="text-[9px] leading-none text-muted">{t}</span>
            </div>
          ))}
        </div>
        {/* Marker: real (default) data, but stays muted grey, never accent
            orange -- still faded relative to a real knob, just not
            opacity-reduced like the rest of the meter, so it reads as
            "visible, not prominent". */}
        <div className="absolute left-0 flex items-center gap-1" style={{ top: `${fraction * 100}%`, transform: "translateY(-50%)" }}>
          <div className="h-px w-4 bg-muted" />
          <span className="text-[10px] font-semibold text-muted">{markerLabel}</span>
        </div>
      </div>
    </div>
  );
}

function LowCutIcon() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
      <path d="M1 9 L5 9 L12 2" stroke="var(--muted)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NotchIcon() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
      <path d="M1 3 L6 9 L13 3" stroke="var(--muted)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FadedIconButton({ children }: { children: React.ReactNode }) {
  return <span className="flex h-7 w-9 items-center justify-center rounded-md border border-border bg-background opacity-45">{children}</span>;
}

// Full real panel structure (docs/images/reference/DeEsser_plugin.png), per
// the DeEsser 2 design spike (docs/images/spikes/de-esser-2/): centered
// header (confirmed a DeEsser-2-specific one-off, not a new default) with
// the "Standard practice" card badge (PRD §8.9); Detection/Reduction as
// vertical dB-scale meter strips; Max Reduction's dial runs high-to-low
// left-to-right (confirmed against the reference's own printed labels);
// Mode/Range/Filter/Filter Solo regrouped to match the real panel's row
// layout (Mode standalone and centered, Range+Filter+Filter Solo sharing
// one row) instead of each stacked under its own knob column.
export function DeEsser2Visual({ plugin }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  const threshold = registryDefault(plugin, "threshold");
  const thresholdRange = registryRange(plugin, "threshold");
  const maxReduction = registryDefault(plugin, "maxReduction");
  const maxReductionRange = registryRange(plugin, "maxReduction");
  const frequency = registryDefault(plugin, "frequency");

  return (
    <PluginPanel plugin={plugin} width="715px" aspectRatio="1.68 / 1" centerHeader badge="Standard practice">
      <div className="grid flex-1 divide-x divide-border px-5 py-5" style={{ gridTemplateColumns: "1fr 2.15fr" }}>
        <div className="flex gap-8 pr-6">
          <DbMeterStrip
            heading="Detection"
            restingValueLabel="-∞"
            ticks={DETECTION_TICKS}
            markerValue={threshold}
            markerLabel={String(Math.round(threshold * 10) / 10)}
          />
          <DbMeterStrip
            heading="Reduction"
            restingValueLabel="0.0"
            ticks={REDUCTION_TICKS}
            markerValue={maxReduction}
            markerLabel={String(Math.round(maxReduction * 10) / 10)}
          />
        </div>

        {/* Grid (not a centered flex stack) so all three rows -- knobs,
            Mode, Range/Filter/Filter Solo -- share exactly the same three
            column positions, and the whole block is left-anchored flush
            against the meters' divider (matching the reference), with any
            leftover width falling entirely on the right rather than split
            on both sides. Mode only occupies the first (Threshold) column;
            the other two cells in its row are empty spacers. */}
        <div className="grid items-start gap-x-14 gap-y-6 pl-6 pt-2" style={{ gridTemplateColumns: "repeat(3, max-content)" }}>
          <FadedArcKnob label="Threshold" value={`${threshold} dB`} numericValue={threshold} min={thresholdRange.min} max={thresholdRange.max} minLabel="-60" maxLabel="0" />
          <ArcKnob
            label="Max Reduction"
            value={`${maxReduction} dB`}
            angleDeg={invertedKnobRotationDeg(maxReduction, maxReductionRange.min, maxReductionRange.max)}
            faded
            minLabel="25"
            maxLabel="0"
          />
          <FadedArcKnob label="Frequency" value={`${frequency} Hz`} numericValue={frequency} min={2000} max={10000} minLabel="1200" maxLabel="12k" />

          <div className="flex flex-col items-center" style={{ marginTop: 8 }}>
            <Dropdown label="Mode" value="Relative" faded />
          </div>
          <div />
          <div />

          <div className="flex flex-col items-center gap-1.5">
            <p className="text-[11px] font-medium text-foreground opacity-45">Range</p>
            <FadedTabs options={["Split", "Wide"]} />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-[11px] font-medium text-foreground opacity-45">Filter</p>
            <div className="flex gap-2">
              <FadedIconButton>
                <LowCutIcon />
              </FadedIconButton>
              <FadedIconButton>
                <NotchIcon />
              </FadedIconButton>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-[11px] font-medium text-foreground opacity-45">Filter Solo</p>
            <FadedTabs options={["Off"]} />
          </div>
        </div>
      </div>
    </PluginPanel>
  );
}
