import { BooleanToggle, FadedDisplay, KnobSection, NumberKnob, PluginPanel } from "./controls/PluginKnobPrimitives";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

// Full real panel structure (docs/images/reference/Overdrive_plugin.png): Drive/
// Output/Tone knobs + Level Compensation (all real data) alongside a
// Drive/Tone response curve display -- visual only, no backing data.
export function OverdriveVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin}>
      <KnobSection>
        <NumberKnob plugin={plugin} values={values} parameter="drive" />
        <NumberKnob plugin={plugin} values={values} parameter="tone" />
        <NumberKnob plugin={plugin} values={values} parameter="output" />
        <BooleanToggle plugin={plugin} values={values} parameter="levelCompensation" />
      </KnobSection>
      <FadedDisplay label="Drive / Tone Response Curve" />
    </PluginPanel>
  );
}
