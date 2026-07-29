import { FadedDisplay, FadedField, FadedKnob, KnobSection, NumberKnob, PluginPanel } from "./controls/PluginKnobPrimitives";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

// Full real panel structure (docs/images/reference/Chromaverb_plugin.png): Damping
// EQ curve, algorithm selector, and a bottom row of Attack/Size/Density |
// Decay/Predelay | Distance/Dry/Wet. Dry and Wet are independent real
// controls (corrected from an invented single "mix" crossfade knob).
export function ChromaVerbVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin}>
      <FadedField label="Algorithm" value="Room" />
      <FadedDisplay label="Damping EQ" />
      <KnobSection>
        <NumberKnob plugin={plugin} values={values} parameter="decay" />
        <NumberKnob plugin={plugin} values={values} parameter="predelay" />
        <NumberKnob plugin={plugin} values={values} parameter="dry" />
        <NumberKnob plugin={plugin} values={values} parameter="wet" />
      </KnobSection>
      <KnobSection>
        <FadedKnob label="Attack" value="0 %" />
        <FadedKnob label="Size" value="60 %" />
        <FadedKnob label="Density" value="60 %" />
        <FadedKnob label="Distance" value="50 %" />
      </KnobSection>
    </PluginPanel>
  );
}
