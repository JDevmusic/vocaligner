import { KnobSection, NumberKnob, PluginPanel } from "./controls/PluginKnobPrimitives";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

export function CompressorVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin}>
      <KnobSection>
        <NumberKnob plugin={plugin} values={values} parameter="threshold" />
        <NumberKnob plugin={plugin} values={values} parameter="ratio" />
        <NumberKnob plugin={plugin} values={values} parameter="attack" />
        <NumberKnob plugin={plugin} values={values} parameter="release" />
        <NumberKnob plugin={plugin} values={values} parameter="makeupGain" />
      </KnobSection>
    </PluginPanel>
  );
}
