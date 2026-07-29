import { KnobSection, NumberKnob, PluginPanel } from "./controls/PluginKnobPrimitives";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

export function ChorusVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin}>
      <KnobSection>
        <NumberKnob plugin={plugin} values={values} parameter="rate" />
        <NumberKnob plugin={plugin} values={values} parameter="intensity" />
        <NumberKnob plugin={plugin} values={values} parameter="mix" />
      </KnobSection>
    </PluginPanel>
  );
}
