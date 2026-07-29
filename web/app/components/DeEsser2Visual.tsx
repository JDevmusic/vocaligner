import { FadedDisplay, FadedField, FadedKnob, FadedTabs, KnobSection, NumberKnob, PluginPanel } from "./controls/PluginKnobPrimitives";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

// Full real panel structure (docs/images.md/DeEsser_plugin.png): Detection/
// Reduction meters, Threshold/Max Reduction/Frequency knobs, Mode, Range,
// Filter type, and Filter Solo. Our registry's `reduction` maps to the real
// "Max Reduction" knob; `frequency` maps directly. Threshold has no
// backing data -- real, faded, in its real position.
export function DeEsser2Visual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin}>
      <FadedDisplay label="Detection / Reduction Meters" />
      <KnobSection>
        <FadedKnob label="Threshold" value="-9.5 dB" />
        <NumberKnob plugin={plugin} values={values} parameter="reduction" />
        <NumberKnob plugin={plugin} values={values} parameter="frequency" />
      </KnobSection>
      <KnobSection>
        <FadedField label="Mode" value="Relative" />
        <FadedTabs options={["Split", "Wide"]} />
        <FadedTabs options={["Low Cut", "Notch"]} />
        <FadedField label="Filter Solo" value="Off" />
      </KnobSection>
    </PluginPanel>
  );
}
