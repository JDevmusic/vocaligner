import { KnobSection, NumberKnob, PluginPanel } from "./controls/PluginKnobPrimitives";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

export function DeEsser2Visual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin}>
      <KnobSection>
        <NumberKnob plugin={plugin} values={values} parameter="frequency" />
        <NumberKnob plugin={plugin} values={values} parameter="reduction" />
      </KnobSection>
    </PluginPanel>
  );
}
