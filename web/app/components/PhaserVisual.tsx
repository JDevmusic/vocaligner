import {
  BooleanToggle,
  DualRangeTrack,
  FadedArcKnob,
  FadedSyncIcon,
  FadedVerticalFader,
  HorizontalFillTrack,
  NumberArcKnob,
  NumberVerticalFader,
  PluginPanel,
  SectionHeading,
  StringDropdown,
  formatKnobValue,
} from "./controls/PluginKnobPrimitives";
import { resolveControlValue } from "@/lib/registry/controlValues";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

function logFraction(value: number, min: number, max: number): number {
  const clampedMin = Math.max(min, 1e-6);
  const clamped = Math.min(max, Math.max(clampedMin, value));
  return (Math.log(clamped) - Math.log(clampedMin)) / (Math.log(max) - Math.log(clampedMin));
}

// Ceiling/Floor is one shared dual-handle vertical range slider, not two
// independent sliders -- top handle is Ceiling, bottom handle is Floor,
// fill running between them. Both real data, so bold accent fill. Hz
// position is log-scaled (confirmed by measuring the reference's own
// handle positions against the printed values, not assumed linear).
function CeilingFloorSlider({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  const ceilingDef = plugin.controls.find((c) => c.parameter === "ceiling");
  const floorDef = plugin.controls.find((c) => c.parameter === "floor");
  const ceilingRaw = resolveControlValue(plugin, values, "ceiling");
  const ceiling = typeof ceilingRaw === "number" ? ceilingRaw : 0;
  const floorRaw = resolveControlValue(plugin, values, "floor");
  const floor = typeof floorRaw === "number" ? floorRaw : 0;
  const min = ceilingDef?.min ?? 20;
  const max = ceilingDef?.max ?? 20000;
  const topFraction = logFraction(ceiling, min, max) * 100;
  const bottomFraction = logFraction(floor, min, max) * 100;
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="whitespace-nowrap text-[11px] font-medium text-foreground">Ceiling</p>
      <p className="whitespace-nowrap text-sm font-semibold text-brand-accent">{formatKnobValue("ceiling", ceiling, ceilingDef?.unit)}</p>
      <DualRangeTrack orientation="vertical" lowerPercent={bottomFraction} upperPercent={topFraction} />
      <p className="whitespace-nowrap text-[11px] font-medium text-foreground">Floor</p>
      <p className="whitespace-nowrap text-sm font-semibold text-brand-accent">{formatKnobValue("floor", floor, floorDef?.unit)}</p>
    </div>
  );
}

// Faded, no registry data -- blends between LFO 1 and LFO 2, distinct from
// the overall wet/dry Mix in OUT.
function LfoMixSlider() {
  return (
    <div className="flex w-full flex-col items-center gap-1.5 opacity-45">
      <div className="flex w-full items-center justify-between text-sm font-semibold text-muted">
        <span>90 %</span>
        <span className="text-[11px] font-medium text-foreground">Mix</span>
        <span>10 %</span>
      </div>
      <HorizontalFillTrack percent={22} handleShape="bar" />
    </div>
  );
}

// Full real panel structure (docs/images/reference/Phaser_plugin.png), per
// the Phaser design spike (docs/images/spikes/phaser/): four sections with
// dividers (Sweep | LFO | Feedback | Out). Ceiling, Floor, and Out's Mix
// are vertical sliders on the real panel, not knobs -- caught the same way
// as ChromaVerb/Tape Delay's Dry/Wet and Compressor's Distortion/Mix, by
// checking the reference directly rather than trusting the brief. Sweep
// Mode's dropdown sits in the same row as Stages/the slider (a fixed gap
// against Stages, not `justify-between`, which silently absorbs margin
// adjustments -- confirmed by a pixel-identical before/after diff when
// that was tried first) so it shares Floor's exact baseline. Feedback's
// real knob is labeled "Level" on the panel itself -- the section header
// already says FEEDBACK.
export function PhaserVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin} width="1000px" aspectRatio="2.45 / 1">
      <div className="grid flex-1 divide-x divide-border px-5 py-5" style={{ gridTemplateColumns: "2.3fr 3.8fr 3.1fr minmax(90px, 0.9fr)" }}>
        <div className="flex flex-col gap-4 pr-5">
          <SectionHeading>Sweep</SectionHeading>
          <div className="flex justify-center gap-6">
            <div className="flex flex-col items-center gap-[50px]">
              <NumberArcKnob plugin={plugin} values={values} parameter="stages" minLabel="4" maxLabel="12" />
              <StringDropdown plugin={plugin} values={values} parameter="sweepMode" />
            </div>
            <CeilingFloorSlider plugin={plugin} values={values} />
          </div>
        </div>

        <div className="flex flex-col gap-5 px-5">
          <SectionHeading>LFO</SectionHeading>
          <div className="flex items-start justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <NumberArcKnob plugin={plugin} values={values} parameter="rate1" minLabel="0" maxLabel="10" />
              <FadedSyncIcon />
            </div>
            <div className="flex flex-col items-center gap-2">
              <NumberArcKnob plugin={plugin} values={values} parameter="rate2" minLabel="0" maxLabel="10" />
              <FadedSyncIcon />
            </div>
            <FadedArcKnob label="Phase" value="+180 °" numericValue={180} min={0} max={360} />
          </div>
          <LfoMixSlider />
        </div>

        <div className="flex flex-col gap-4 px-5">
          <SectionHeading>Feedback</SectionHeading>
          <div className="flex items-start justify-center gap-6">
            <div className="flex flex-col items-center gap-4">
              <NumberArcKnob plugin={plugin} values={values} parameter="feedback" label="Level" />
              <BooleanToggle plugin={plugin} values={values} parameter="warmth" />
            </div>
            <FadedVerticalFader label="Low Cut" value="20 Hz" percent={3} />
            <FadedVerticalFader label="High Cut" value="20000 Hz" percent={97} />
          </div>
        </div>

        <div className="flex flex-col gap-4 pl-5">
          <SectionHeading>Out</SectionHeading>
          <div className="flex items-start justify-center">
            <NumberVerticalFader plugin={plugin} values={values} parameter="mix" plusPrefix />
          </div>
        </div>
      </div>
    </PluginPanel>
  );
}
