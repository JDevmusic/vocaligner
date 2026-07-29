import { KnobSection, NumberKnob, PluginPanel } from "./controls/PluginKnobPrimitives";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

// Mirrors the real panel's DELAY / FEEDBACK / OUTPUT section grouping
// (docs/images.md/TapeDelay_plugin.png) -- only the sections with data our
// registry actually models (no Character/Modulation sections, no data).
export function TapeDelayVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin}>
      <KnobSection heading="Delay">
        <NumberKnob plugin={plugin} values={values} parameter="time" />
      </KnobSection>
      <KnobSection heading="Feedback">
        <NumberKnob plugin={plugin} values={values} parameter="feedback" />
      </KnobSection>
      <KnobSection heading="Output">
        <NumberKnob plugin={plugin} values={values} parameter="mix" />
      </KnobSection>
    </PluginPanel>
  );
}
