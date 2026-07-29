import { BooleanToggle, KnobSection, NumberKnob, PluginPanel, StringLabel } from "./controls/PluginKnobPrimitives";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

// Mirrors the real panel's SWEEP / LFO / FEEDBACK / OUT section grouping
// (docs/images.md/Phaser_plugin.png) -- this is why Phaser needed Task 0's
// registry correction: the real plugin's structure (dual-rate LFOs, a
// Ceiling/Floor sweep range, Sweep Mode, a separate Feedback section) is
// what the registry now models, and what this layout reflects directly.
export function PhaserVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin}>
      <KnobSection heading="Sweep">
        <NumberKnob plugin={plugin} values={values} parameter="stages" />
        <NumberKnob plugin={plugin} values={values} parameter="ceiling" />
        <NumberKnob plugin={plugin} values={values} parameter="floor" />
        <StringLabel plugin={plugin} values={values} parameter="sweepMode" />
      </KnobSection>
      <KnobSection heading="LFO">
        <NumberKnob plugin={plugin} values={values} parameter="rate1" />
        <NumberKnob plugin={plugin} values={values} parameter="rate2" />
      </KnobSection>
      <KnobSection heading="Feedback">
        <NumberKnob plugin={plugin} values={values} parameter="feedback" />
        <BooleanToggle plugin={plugin} values={values} parameter="warmth" />
      </KnobSection>
      <KnobSection heading="Out">
        <NumberKnob plugin={plugin} values={values} parameter="mix" />
      </KnobSection>
    </PluginPanel>
  );
}
