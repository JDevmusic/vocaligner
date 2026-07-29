import { FadedDisplay, FadedField, FadedKnob, KnobSection, NumberKnob, PluginPanel } from "./controls/PluginKnobPrimitives";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

// Full real panel structure (docs/images.md/Chromaverb_plugin.png): Damping
// EQ curve, algorithm selector, and a bottom row of Attack/Size/Density |
// Decay/Predelay | Distance/Dry/Wet. `mix` maps to the real "Wet" knob
// (Dry's complement isn't modeled -- faded at its real 100% default).
export function ChromaVerbVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin}>
      <FadedField label="Algorithm" value="Room" />
      <FadedDisplay label="Damping EQ" />
      <KnobSection>
        <NumberKnob plugin={plugin} values={values} parameter="decay" />
        <NumberKnob plugin={plugin} values={values} parameter="predelay" />
        <NumberKnob plugin={plugin} values={values} parameter="mix" />
      </KnobSection>
      <KnobSection>
        <FadedKnob label="Attack" value="0 %" />
        <FadedKnob label="Size" value="60 %" />
        <FadedKnob label="Density" value="60 %" />
        <FadedKnob label="Distance" value="50 %" />
        <FadedKnob label="Dry" value="100 %" />
      </KnobSection>
    </PluginPanel>
  );
}
