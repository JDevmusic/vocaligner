import { FadedDisplay, FadedField, FadedTabs, KnobSection, NumberKnob, PluginPanel } from "./controls/PluginKnobPrimitives";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

// Full real panel structure (docs/images/reference/DeEsser_plugin.png): Detection/
// Reduction meters, Threshold/Max Reduction/Frequency knobs, Mode, Range,
// Filter type, and Filter Solo. Threshold and Max Reduction are both
// independent real controls (corrected from a registry that had Threshold
// missing entirely and modeled Max Reduction as a generic "reduction").
export function DeEsser2Visual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin}>
      <FadedDisplay label="Detection / Reduction Meters" />
      <KnobSection>
        <NumberKnob plugin={plugin} values={values} parameter="threshold" />
        <NumberKnob plugin={plugin} values={values} parameter="maxReduction" />
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
