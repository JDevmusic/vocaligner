import { FadedDisplay, FadedKnob, FadedTabs, NumberKnob, PluginPanel, SectionHeading } from "./controls/PluginKnobPrimitives";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

const CIRCUIT_MODES = ["Platinum Digital", "Studio VCA", "Studio FET", "Classic VCA", "Vintage VCA", "Vintage FET", "Vintage Opto"];

const PRIMARY_SIZE = 104;
const SECONDARY_SIZE = 78;

// Distortion (Off/Soft/Hard/Clip) and Mix (Input/Output, centered on 1:1)
// are both real knobs on the panel, not buttons -- caught by checking the
// reference directly (docs/DESIGN_SYSTEM.md's "verify each control's
// actual type" finding). Neither has registry data, so both use the
// qualitative-sweep `ticks` escape hatch rather than a fabricated numeric
// range.
const DISTORTION_TICKS = [
  { angleDeg: -135, label: "Off" },
  { angleDeg: -45, label: "Soft" },
  { angleDeg: 45, label: "Hard" },
  { angleDeg: 135, label: "Clip" },
];
const MIX_TICKS = [
  { angleDeg: -135, label: "Input" },
  { angleDeg: 135, label: "Output" },
];

// Ratio's real dial ticks are deliberately irregular -- increasing gaps
// toward the high end (0.4, 0.6, 1, 2, 3, 4, 8, 10) -- read directly off
// the reference, not something the shared evenly-spaced auto-generator can
// produce. Passed as explicit values to `NumberKnob`, which still computes
// each one's angle from the real value via the normal knob rotation math --
// log-scaled (`log` prop below), not linear: Ratio's 1-30 range is wide
// enough that the real dial reads log-scaled, same as Overdrive's Tone --
// a linear mapping bunches 1/1.4/2/3 illegibly close to the minimum stop.
const RATIO_TICK_VALUES = [1, 1.4, 2, 3, 5, 8, 12, 20, 30];

// Release's real dial ticks, read directly off the reference -- same
// reasoning as Ratio above: a 5-5000ms range reads log-scaled, and the
// generic evenly-spaced auto-generator doesn't match the reference's own
// tick set at all.
const RELEASE_TICK_VALUES = [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];

// The reference prints Release's four-figure ticks abbreviated ("1k"/"2k"/
// "5k"), same "k" convention as Channel EQ's own `freqLabelText` -- everything
// else on this dial (5-500) stays a plain number.
function formatReleaseTickLabel(value: number): string {
  return value >= 1000 ? `${value / 1000}k` : String(value);
}

// A deliberate deviation from the reference (which does print "40" here):
// the founder asked for it dropped, not a fidelity correction.
const MAKEUP_GAIN_EXCLUDED_TICKS = [40];

// The real panel's meter box is a much smaller fraction of the panel than a
// flex-1 placeholder assumes -- measured directly against the reference
// (docs/images/reference/Compressor_plugin.png): the meter's outer bezel is
// ~1101px wide by ~421px tall at the screenshot's own resolution (the first
// pass at this measurement missed how much thicker the bezel is at the
// bottom than the top -- re-measured to the true outer edge, not just the
// grey gauge content), a ~2.62:1 ratio.
const METER_ASPECT_RATIO = "2.62 / 1";

// Large, two-line circuit-mode buttons spanning the meter box's full width --
// validated against the reference, where this row's width matches the meter
// box's width exactly. Bespoke to Compressor (the generic FadedTabs' dense
// single-line pills don't match this specific row), all 7 options are real
// two-word labels so splitting on the space is reliable.
function CircuitModeTabs({ options }: { options: string[] }) {
  return (
    <div className="flex w-full gap-1.5 opacity-45">
      {options.map((option) => {
        const [first, second] = option.split(" ");
        return (
          <span
            key={option}
            className="flex flex-1 flex-col items-center justify-center rounded-md border border-border bg-background px-1 py-2.5 text-center text-[10px] font-medium leading-tight text-muted"
          >
            <span>{first}</span>
            <span>{second}</span>
          </span>
        );
      })}
    </div>
  );
}

// A full-height meter-strip-into-knob column -- no live signal to show (so
// just a faded placeholder bar, not fabricated readings), knob pinned at
// the bottom. Same pattern as the panel's outer edges on both sides.
function GainColumn({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-3">
      <div className="w-1.5 flex-1 rounded-full border border-border bg-background/60 opacity-45" />
      {children}
    </div>
  );
}

// Full real panel structure (docs/images/reference/Compressor_plugin.png), per
// the Compressor design spike (docs/images/spikes/compressor/): a
// full-height Input Gain / Output Gain column at each outer edge; a
// three-section layout with dividers (Input Gain | circuit tabs/meter/
// Threshold-Ratio-MakeUp+Auto Gain/Knee-Attack-Release+Auto | Side Chain-
// Output tabs/Limiter/Distortion/Mix, with Output Gain as that section's
// own outer-edge column); a primary/secondary knob-size hierarchy
// (Threshold/Ratio/Make Up visibly larger than Knee/Attack/Release); and
// precise cross-column alignment (Auto Gain's 3-button cluster level with
// Threshold/Ratio/Make Up, the standalone Auto toggle level with Knee/
// Attack/Release, Distortion level with Threshold/Ratio/Make Up, Mix level
// with Knee/Attack/Release and Output Gain's own knob). Only Threshold/
// Ratio/Attack/Release/Make Up have real data -- everything else is real
// but faded, in its real position, not dropped. No option is shown
// selected among the circuit-mode tabs, Auto Gain cluster, or Side
// Chain/Output tabs -- none of that is backed by data, so none of it
// asserts a choice that wasn't made.
export function CompressorVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin} width="1000px">
      <div className="flex divide-x divide-border px-6 py-5">
        <div className="flex flex-col pr-6" style={{ flexGrow: 1 }}>
          <GainColumn>
            <FadedKnob label="Input Gain" value="0 dB" min={-30} max={30} def={0} size={SECONDARY_SIZE} />
          </GainColumn>
        </div>

        <div className="flex flex-col gap-4 px-6" style={{ flexGrow: 3 }}>
          <CircuitModeTabs options={CIRCUIT_MODES} />
          <FadedDisplay label="Gain Reduction Meter" aspectRatio={METER_ASPECT_RATIO} />

          <div className="grid grid-cols-4 items-start gap-6">
            <NumberKnob plugin={plugin} values={values} parameter="threshold" size={PRIMARY_SIZE} />
            <NumberKnob plugin={plugin} values={values} parameter="ratio" size={PRIMARY_SIZE} tickValues={RATIO_TICK_VALUES} log />
            <NumberKnob
              plugin={plugin}
              values={values}
              parameter="makeupGain"
              size={PRIMARY_SIZE}
              excludeTicks={MAKEUP_GAIN_EXCLUDED_TICKS}
            />
            <div className="relative flex flex-col items-center" style={{ marginTop: 20.25 }}>
              {/* Every knob now has its own label above its dial (matches
                  the reference/ArcKnob convention), so Threshold/Ratio/Make
                  Up's own dial centers no longer sit at the row's top edge --
                  they're offset by that label's height + gap-1 (~20px).
                  This cell's marginTop reproduces that same offset so the
                  button stack (first flow child) starts where the knobs'
                  own SVGs do, landing the two centers together. The floated
                  "Auto Gain" heading below rides along with this shift too,
                  which is what actually clears the meter's bottom edge --
                  without it, the heading (anchored to this cell's top)
                  overlapped the meter. */}
              <div className="absolute inset-x-0 bottom-full pb-1">
                <SectionHeading>Auto Gain</SectionHeading>
              </div>
              <div className="flex flex-col gap-1.5 opacity-45">
                <FadedTabs options={["Off"]} />
                <FadedTabs options={["0 dB"]} />
                <FadedTabs options={["-12 dB"]} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-6">
            <FadedKnob label="Knee" value="0.60" min={0} max={1.0} def={0.6} size={SECONDARY_SIZE} />
            <NumberKnob plugin={plugin} values={values} parameter="attack" size={SECONDARY_SIZE} />
            <NumberKnob
              plugin={plugin}
              values={values}
              parameter="release"
              size={SECONDARY_SIZE}
              tickValues={RELEASE_TICK_VALUES}
              log
              formatTickLabel={formatReleaseTickLabel}
            />
            <div className="flex flex-col items-center pt-8">
              <FadedTabs options={["Auto"]} />
            </div>
          </div>
        </div>

        <div className="flex gap-6 pl-6" style={{ flexGrow: 1.6 }}>
          <div className="flex flex-1 flex-col gap-5">
            <FadedTabs options={["Side Chain", "Output"]} dense />
            {/* Side Chain/Output's single-line tabs are shorter than Circuit
                Mode's two-line ones on the other side, so the normal gap-5
                alone lands Limiter above the meter's top edge instead of
                level with it. This adds exactly the difference (measured:
                circuit-tabs-row height 47px vs side-chain-row height 19.5px,
                minus the 4px gap-4/gap-5 difference) on top of that gap. */}
            <div className="flex flex-col items-center gap-2" style={{ marginTop: 23.5 }}>
              <SectionHeading>Limiter</SectionHeading>
              <FadedTabs options={["On"]} />
              <FadedKnob label="Threshold" value="-4 dB" min={-10} max={0} def={-4} size={SECONDARY_SIZE} />
            </div>
            {/* The real reference has a genuinely bigger gap here than
                between Distortion and Mix below it (pixel-measured: ~11% of
                panel height, vs ~2.5% for Distortion-Mix) -- this column's
                content is naturally shorter than the middle column's two
                knob rows, and this is where that real proportional
                difference actually sits, not an arbitrary balancer. Sized
                so Mix lands level with Row 2/Output Gain (on top of the
                existing gap-5, for a ~62px total gap). */}
            <div style={{ marginTop: 42.3 }}>
              <FadedKnob label="Distortion" value="Off" ticks={DISTORTION_TICKS} size={SECONDARY_SIZE} />
            </div>
            <FadedKnob label="Mix" value="1:1" ticks={MIX_TICKS} size={SECONDARY_SIZE} />
          </div>
          <GainColumn>
            <FadedKnob label="Output Gain" value="0 dB" min={-30} max={30} def={0} size={SECONDARY_SIZE} />
          </GainColumn>
        </div>
      </div>
    </PluginPanel>
  );
}
