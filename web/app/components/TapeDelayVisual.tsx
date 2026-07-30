import {
  DualRangeTrack,
  FadedArcKnob,
  FadedSyncIcon,
  FadedTabs,
  HorizontalFillTrack,
  NumberArcKnob,
  NumberVerticalFader,
  PluginPanel,
  SectionHeading,
} from "./controls/PluginKnobPrimitives";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

const DELAY_TIME_SIZE = 100;
const MODULATION_KNOB_SIZE = 78;
const OUTPUT_FADER_HEIGHT = 168;

// Note/Deviation have no dial on the real panel -- plain label/value
// readouts, no backing data.
function NoteStepper() {
  return (
    <div className="flex flex-col gap-1 opacity-45">
      <p className="whitespace-nowrap text-[11px] font-medium text-foreground">Note</p>
      <div className="flex w-fit items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5">
        <span className="text-[10px] font-medium text-muted">1/4</span>
        <div className="flex flex-col leading-[5px] text-muted">
          <span className="text-[6px]">▲</span>
          <span className="text-[6px]">▼</span>
        </div>
      </div>
    </div>
  );
}

function DeviationField() {
  return (
    <div className="opacity-45">
      <p className="whitespace-nowrap text-[11px] font-medium text-foreground">Deviation</p>
      <p className="text-sm font-semibold text-muted">0.00 %</p>
    </div>
  );
}

function SmoothingSlider() {
  return (
    <div className="flex flex-col gap-1.5 opacity-45">
      <div className="flex items-baseline justify-between">
        <p className="whitespace-nowrap text-[11px] font-medium text-foreground">Smoothing</p>
        <p className="whitespace-nowrap text-sm font-semibold text-muted">40 ms</p>
      </div>
      <HorizontalFillTrack percent={12} handleShape="circle" />
    </div>
  );
}

function CutRangeSlider() {
  return (
    <div className="flex flex-col gap-1.5 opacity-45">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="whitespace-nowrap text-[11px] font-medium text-foreground">Low Cut</p>
          <p className="whitespace-nowrap text-sm font-semibold text-muted">520 Hz</p>
        </div>
        <div className="text-right">
          <p className="whitespace-nowrap text-[11px] font-medium text-foreground">High Cut</p>
          <p className="whitespace-nowrap text-sm font-semibold text-muted">1500 Hz</p>
        </div>
      </div>
      <DualRangeTrack orientation="horizontal" lowerPercent={47} upperPercent={58} faded />
    </div>
  );
}

// Full real panel structure (docs/images/reference/TapeDelay_plugin.png), per
// the Tape Delay design spike (docs/images/spikes/tape-delay/): Delay |
// Character (with a full-width Modulation band beneath both) beside
// Feedback/Output as one continuous full-height column on the right edge --
// Output's Dry/Wet faders run almost the entire panel height on the real
// panel, not a small box nested under Feedback. Clip Threshold/Spread are
// bipolar (centered at 0). Low Cut/High Cut is a dual-handle range slider
// and Smoothing a single-handle fill slider, both faded shape-only replicas
// (no researched frequency-to-position mapping). Only Time/Feedback/Dry/Wet
// have real data; Dry/Wet are independent real controls (corrected from an
// invented single "mix" crossfade knob).
export function TapeDelayVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin} width="900px" aspectRatio="1.22 / 1">
      <div className="flex flex-1 divide-x divide-border px-5 py-5">
        <div className="flex flex-col gap-4 pr-6" style={{ flexGrow: 3 }}>
          <div className="grid divide-x divide-border" style={{ gridTemplateColumns: "1.15fr 1fr" }}>
            <div className="flex flex-col gap-4 pr-6">
              <SectionHeading>Delay</SectionHeading>
              <div className="relative flex justify-center pb-1">
                <div className="absolute left-0 top-1">
                  <FadedSyncIcon />
                </div>
                <NumberArcKnob plugin={plugin} values={values} parameter="time" size={DELAY_TIME_SIZE} />
                <div className="absolute right-0 top-1 flex flex-col gap-3">
                  <NoteStepper />
                  <DeviationField />
                </div>
              </div>
              <div className="flex justify-center">
                <FadedTabs options={[": 2", "x 2"]} />
              </div>
              <SmoothingSlider />
            </div>

            <div className="flex flex-col gap-4 pl-6">
              <SectionHeading>Character</SectionHeading>
              <div className="flex items-start justify-center gap-16">
                <FadedArcKnob label="Clip Threshold" value="-5.4 dB" numericValue={-5.4} min={-20} max={20} bipolar minLabel="-20" maxLabel="20" />
                <FadedArcKnob label="Spread" value="0" numericValue={0} min={-50} max={50} bipolar />
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <p className="text-[11px] font-medium text-foreground opacity-45">Tape Head Mode</p>
                <FadedTabs options={["Clean", "Diffuse"]} />
              </div>
              <CutRangeSlider />
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center gap-5 border-t border-border pt-4">
            <SectionHeading>Modulation</SectionHeading>
            <div className="flex justify-between px-14">
              <div className="flex gap-8">
                <FadedArcKnob label="LFO Rate" value="0.38 Hz" numericValue={0.38} min={0} max={10} minLabel="0" maxLabel="10" size={MODULATION_KNOB_SIZE} />
                <FadedArcKnob label="LFO Intensity" value="50 %" numericValue={50} size={MODULATION_KNOB_SIZE} />
              </div>
              <div className="flex gap-8">
                <FadedArcKnob label="Flutter Rate" value="1.6 Hz" numericValue={1.6} min={0} max={10} minLabel="0" maxLabel="10" size={MODULATION_KNOB_SIZE} />
                <FadedArcKnob label="Flutter Intensity" value="13 %" numericValue={13} size={MODULATION_KNOB_SIZE} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-border pl-6" style={{ flexGrow: 1 }}>
          <div className="flex flex-1 flex-col gap-4 pb-6">
            <SectionHeading>Feedback</SectionHeading>
            <div className="flex justify-center">
              <NumberArcKnob plugin={plugin} values={values} parameter="feedback" />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-[11px] font-medium text-foreground opacity-45">Freeze</p>
              <FadedTabs options={["Off"]} />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-4 pt-6">
            <SectionHeading>Output</SectionHeading>
            <div className="flex flex-1 items-start justify-center gap-6">
              <NumberVerticalFader plugin={plugin} values={values} parameter="dry" height={OUTPUT_FADER_HEIGHT} />
              <NumberVerticalFader plugin={plugin} values={values} parameter="wet" height={OUTPUT_FADER_HEIGHT} />
            </div>
          </div>
        </div>
      </div>
    </PluginPanel>
  );
}
