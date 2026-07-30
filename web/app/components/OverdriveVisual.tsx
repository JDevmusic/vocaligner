import { BooleanToggle, NumberArcKnob, PluginPanel } from "./controls/PluginKnobPrimitives";
import { driveCurveY, toneCurveY } from "@/lib/eq/overdriveResponseCurve";
import { resolveControlValue } from "@/lib/registry/controlValues";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

const GRAPH_W = 420;
const GRAPH_H = 320;
const PAD = 10;
const GRID_ROWS = 6;
const V_INSET = (GRAPH_H - 2 * PAD) / GRID_ROWS;

// Drive plots into a vertical range inset by one grid row from the
// top/bottom borders -- confirmed by direct pixel measurement of
// Overdrive2.png: Drive's flat top/bottom segments sit exactly on the
// first/fifth of the 6 grid rows, one row short of the outer border on
// each side. Tone does NOT get this inset -- its real curve keeps
// descending in a continuous diagonal all the way to the right edge,
// never leveling off within the visible window, so it plots into the full
// (non-inset) range.
function buildPath(fn: (xNorm: number) => number, inset: boolean, samples = 100): string {
  const points: string[] = [];
  const plotTop = inset ? PAD + V_INSET : PAD;
  const plotHeight = inset ? GRAPH_H - 2 * PAD - 2 * V_INSET : GRAPH_H - 2 * PAD;
  for (let i = 0; i <= samples; i++) {
    const xNorm = i / samples;
    const y = fn(xNorm);
    const px = PAD + xNorm * (GRAPH_W - 2 * PAD);
    const py = plotTop + ((1 - y) / 2) * plotHeight;
    points.push(`${i === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`);
  }
  return points.join(" ");
}

function ResponseGraph({ driveDb, toneHz }: { driveDb: number; toneHz: number }) {
  const drivePath = buildPath((xNorm) => driveCurveY(driveDb, xNorm * 2 - 1), true);
  // Same log-frequency sampling Channel EQ's own computeCurvePoints uses
  // (20Hz-20kHz via 20 * 1000^t), so the x-axis positioning logic matches.
  const tonePath = buildPath((xNorm) => toneCurveY(toneHz, 20 * Math.pow(1000, xNorm)), false);
  const gridFractions = [1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6];
  const gridX = gridFractions.map((f) => ({ pos: PAD + f * (GRAPH_W - 2 * PAD), center: Math.abs(f - 0.5) < 0.001 }));
  const gridY = gridFractions.map((f) => ({ pos: PAD + f * (GRAPH_H - 2 * PAD), center: Math.abs(f - 0.5) < 0.001 }));

  return (
    <div className="flex h-full flex-1 items-center justify-center rounded-lg border border-border bg-background/40 p-4">
      <svg viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`} className="h-full w-full">
        {gridX.map(({ pos, center }) => (
          <line key={pos} x1={pos} y1={PAD} x2={pos} y2={GRAPH_H - PAD} stroke="var(--border)" strokeWidth={center ? 1.7 : 1} />
        ))}
        {gridY.map(({ pos, center }) => (
          <line key={pos} x1={PAD} y1={pos} x2={GRAPH_W - PAD} y2={pos} stroke="var(--border)" strokeWidth={center ? 1.7 : 1} />
        ))}
        <rect x={PAD} y={PAD} width={GRAPH_W - 2 * PAD} height={GRAPH_H - 2 * PAD} fill="none" stroke="var(--border)" strokeWidth="1" />

        <path d={tonePath} fill="none" stroke="var(--supporting)" strokeWidth="2" strokeLinecap="round" />
        <path d={drivePath} fill="none" stroke="var(--brand-accent)" strokeWidth="2" strokeLinecap="round" />

        <text x={GRAPH_W - PAD - 4} y={PAD + 16} fontSize={11} fontWeight={600} textAnchor="end" className="fill-brand-accent" style={{ letterSpacing: "0.1em" }}>
          DRIVE
        </text>
        <text x={PAD + 4} y={PAD + 30} fontSize={11} fontWeight={600} textAnchor="start" fill="var(--supporting)" style={{ letterSpacing: "0.1em" }}>
          TONE
        </text>
      </svg>
    </div>
  );
}

// Full real panel structure (docs/images/reference/Overdrive_plugin.png), per
// the Overdrive design spike (docs/images/spikes/overdrive/): four corner
// knobs (Drive, Output, Tone, Level Compensation) with Output keeping a
// small "0" reference tick independent of its min/max labels, and a
// genuinely computed Drive/Tone response graph (not a faded placeholder) --
// Drive is a tanh soft-clip waveshaper, Tone reuses Channel EQ's own
// lowpass biquad math (`web/lib/eq/overdriveResponseCurve.ts`).
export function OverdriveVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  const driveRaw = resolveControlValue(plugin, values, "drive");
  const driveDb = typeof driveRaw === "number" ? driveRaw : 0;
  const toneRaw = resolveControlValue(plugin, values, "tone");
  const toneHz = typeof toneRaw === "number" ? toneRaw : 0;

  return (
    <PluginPanel plugin={plugin} width="820px" aspectRatio="1.58 / 1">
      <div className="grid flex-1 divide-x divide-border px-5 py-5" style={{ gridTemplateColumns: "1fr 1.15fr" }}>
        <div className="grid grid-cols-2 items-start justify-items-center gap-x-8 gap-y-10 pr-6">
          <NumberArcKnob plugin={plugin} values={values} parameter="drive" minMax />
          <NumberArcKnob plugin={plugin} values={values} parameter="output" minMax refValue={0} refLabel="0" />
          <NumberArcKnob plugin={plugin} values={values} parameter="tone" minLabel="20" maxLabel="20k" />
          <BooleanToggle plugin={plugin} values={values} parameter="levelCompensation" />
        </div>
        <div className="flex pl-6">
          <ResponseGraph driveDb={driveDb} toneHz={toneHz} />
        </div>
      </div>
    </PluginPanel>
  );
}
