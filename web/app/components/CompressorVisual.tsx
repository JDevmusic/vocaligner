import {
  FadedDisplay,
  FadedField,
  FadedKnob,
  FadedTabs,
  KnobSection,
  NumberKnob,
  PluginPanel,
} from "./controls/PluginKnobPrimitives";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

const CIRCUIT_MODES = ["Platinum Digital", "Studio VCA", "Studio FET", "Classic VCA", "Vintage VCA", "Vintage FET", "Vintage Opto"];

// Full real panel structure (docs/images/reference/Compressor_plugin.png): circuit
// tabs, the gain-reduction meter, main dynamics knobs, Auto Gain, a Limiter
// section (its own Threshold, distinct from the main one), Distortion, and
// Input/Output Gain + Mix. Only Threshold/Ratio/Attack/Release/Makeup Gain
// have real data (bold) -- everything else is real but faded, in its real
// position, not dropped.
export function CompressorVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin}>
      <FadedTabs options={CIRCUIT_MODES} />
      <FadedDisplay label="Gain Reduction Meter" />
      <KnobSection>
        <NumberKnob plugin={plugin} values={values} parameter="threshold" />
        <NumberKnob plugin={plugin} values={values} parameter="ratio" />
        <NumberKnob plugin={plugin} values={values} parameter="makeupGain" />
        <FadedField label="Auto Gain" value="Off" />
      </KnobSection>
      <KnobSection>
        <FadedKnob label="Knee" value="0.60" min={0.2} max={0.8} def={0.6} />
        <NumberKnob plugin={plugin} values={values} parameter="attack" />
        <NumberKnob plugin={plugin} values={values} parameter="release" />
        <FadedKnob label="Input Gain" value="0 dB" min={-30} max={30} def={0} />
      </KnobSection>
      <KnobSection heading="Limiter">
        <FadedField label="Limiter" value="On" />
        <FadedKnob label="Limiter Threshold" value="-4 dB" min={-10} max={0} def={-4} />
      </KnobSection>
      <KnobSection heading="Distortion & Output">
        <FadedField label="Distortion" value="Off" />
        <FadedField label="Mix" value="1:1" />
        <FadedKnob label="Output Gain" value="0 dB" min={-30} max={30} def={0} />
      </KnobSection>
    </PluginPanel>
  );
}
