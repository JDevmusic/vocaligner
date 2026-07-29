import { KnobSection, NumberKnob, PluginPanel } from "./controls/PluginKnobPrimitives";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

export function ChromaVerbVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin}>
      <KnobSection>
        <NumberKnob plugin={plugin} values={values} parameter="decay" />
        <NumberKnob plugin={plugin} values={values} parameter="predelay" />
        <NumberKnob plugin={plugin} values={values} parameter="mix" />
      </KnobSection>
    </PluginPanel>
  );
}
