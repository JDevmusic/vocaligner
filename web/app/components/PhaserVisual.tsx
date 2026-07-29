import { BooleanToggle, FadedField, FadedKnob, KnobSection, NumberKnob, PluginPanel, StringLabel } from "./controls/PluginKnobPrimitives";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

// Mirrors the real panel's SWEEP / LFO / FEEDBACK / OUT section grouping
// (docs/images.md/Phaser_plugin.png) -- this is why Phaser needed Task 0's
// registry correction: the real plugin's structure (dual-rate LFOs, a
// Ceiling/Floor sweep range, Sweep Mode, a separate Feedback section) is
// what the registry now models. Phase and the LFO1/LFO2 Mix slider (LFO),
// and Low Cut/High Cut (Feedback), are real but have no backing data --
// faded, in their real position, not dropped.
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
        <FadedKnob label="Phase" value="+180°" />
        <FadedField label="LFO 1/2 Mix" value="90% / 10%" />
      </KnobSection>
      <KnobSection heading="Feedback">
        <NumberKnob plugin={plugin} values={values} parameter="feedback" />
        <BooleanToggle plugin={plugin} values={values} parameter="warmth" />
        <FadedKnob label="Low Cut" value="20 Hz" />
        <FadedKnob label="High Cut" value="20000 Hz" />
      </KnobSection>
      <KnobSection heading="Out">
        <NumberKnob plugin={plugin} values={values} parameter="mix" />
      </KnobSection>
    </PluginPanel>
  );
}
