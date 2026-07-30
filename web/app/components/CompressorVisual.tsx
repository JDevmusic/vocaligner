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
    <PluginPanel plugin={plugin} width="1000px" aspectRatio="1.3 / 1">
      <div className="flex flex-1 divide-x divide-border px-6 py-5">
        <div className="flex flex-col pr-6" style={{ flexGrow: 1 }}>
          <GainColumn>
            <FadedKnob label="Input Gain" value="0 dB" min={-30} max={30} def={0} size={SECONDARY_SIZE} />
          </GainColumn>
        </div>

        <div className="flex flex-col gap-4 px-6" style={{ flexGrow: 3 }}>
          <FadedTabs options={CIRCUIT_MODES} dense />
          <FadedDisplay label="Gain Reduction Meter" />

          <div className="grid grid-cols-4 items-start gap-6">
            <NumberKnob plugin={plugin} values={values} parameter="threshold" size={PRIMARY_SIZE} />
            <NumberKnob plugin={plugin} values={values} parameter="ratio" size={PRIMARY_SIZE} />
            <NumberKnob plugin={plugin} values={values} parameter="makeupGain" size={PRIMARY_SIZE} />
            <div className="flex flex-col items-center gap-2">
              <SectionHeading>Auto Gain</SectionHeading>
              <div className="flex flex-col gap-1.5 opacity-45">
                <FadedTabs options={["Off"]} />
                <FadedTabs options={["0 dB"]} />
                <FadedTabs options={["-12 dB"]} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-6">
            <FadedKnob label="Knee" value="0.60" min={0.2} max={0.8} def={0.6} size={SECONDARY_SIZE} />
            <NumberKnob plugin={plugin} values={values} parameter="attack" size={SECONDARY_SIZE} />
            <NumberKnob plugin={plugin} values={values} parameter="release" size={SECONDARY_SIZE} />
            <div className="flex items-center pt-8">
              <FadedTabs options={["Auto"]} />
            </div>
          </div>
        </div>

        <div className="flex gap-6 pl-6" style={{ flexGrow: 1.6 }}>
          <div className="flex flex-1 flex-col gap-5">
            <FadedTabs options={["Side Chain", "Output"]} />
            {/* Mirrors the gain-reduction meter's flex-1 growth on the
                middle section, so Limiter/Distortion land level with
                Threshold/Ratio/Make Up (both columns are the same overall
                height, so an equal-proportioned spacer on this side keeps
                them starting at the same Y) rather than riding much higher
                since this column has far less content above it. */}
            <div className="flex-1" />
            <div className="flex flex-col items-center gap-2">
              <SectionHeading>Limiter</SectionHeading>
              <FadedTabs options={["On"]} />
              <FadedKnob label="Threshold" value="-4 dB" min={-10} max={0} def={-4} size={SECONDARY_SIZE} />
            </div>
            <FadedKnob label="Distortion" value="Off" ticks={DISTORTION_TICKS} size={SECONDARY_SIZE} />
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
