import { FadedField, KnobSection, NumberKnob, PluginPanel } from "./controls/PluginKnobPrimitives";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

// Full real panel structure (docs/images.md/Flnager_plugin.png): Rate/
// Intensity/Feedback/Mix (all real data) plus a Tempo Sync toggle on Rate --
// real, faded, no backing data.
export function FlangerVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin}>
      <KnobSection>
        <NumberKnob plugin={plugin} values={values} parameter="rate" />
        <NumberKnob plugin={plugin} values={values} parameter="intensity" />
        <NumberKnob plugin={plugin} values={values} parameter="feedback" />
        <NumberKnob plugin={plugin} values={values} parameter="mix" />
        <FadedField label="Tempo Sync" value="Off" />
      </KnobSection>
    </PluginPanel>
  );
}
