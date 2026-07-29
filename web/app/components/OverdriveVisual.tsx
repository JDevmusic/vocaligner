import { BooleanToggle, KnobSection, NumberKnob, PluginPanel } from "./controls/PluginKnobPrimitives";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

export function OverdriveVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin}>
      <KnobSection>
        <NumberKnob plugin={plugin} values={values} parameter="drive" />
        <NumberKnob plugin={plugin} values={values} parameter="tone" />
        <NumberKnob plugin={plugin} values={values} parameter="output" />
        <BooleanToggle plugin={plugin} values={values} parameter="levelCompensation" />
      </KnobSection>
    </PluginPanel>
  );
}
