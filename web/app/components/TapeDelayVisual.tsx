import { FadedField, FadedKnob, KnobSection, NumberKnob, PluginPanel } from "./controls/PluginKnobPrimitives";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

// Full real panel structure (docs/images.md/TapeDelay_plugin.png): DELAY /
// CHARACTER / FEEDBACK / OUTPUT across the top, MODULATION along the
// bottom. Only Time/Feedback/Mix have real data -- Character and Modulation
// are entirely real sections with no backing data, shown faded rather than
// omitted.
export function TapeDelayVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin}>
      <KnobSection heading="Delay">
        <NumberKnob plugin={plugin} values={values} parameter="time" />
        <FadedField label="Tempo Sync" value="Off" />
        <FadedField label="Note" value="1/4" />
        <FadedKnob label="Deviation" value="0.00 %" />
        <FadedKnob label="Smoothing" value="40 ms" />
      </KnobSection>
      <KnobSection heading="Character">
        <FadedKnob label="Clip Threshold" value="-5.4 dB" />
        <FadedKnob label="Spread" value="0" />
        <FadedField label="Tape Head Mode" value="Clean" />
        <FadedKnob label="Low Cut" value="520 Hz" />
        <FadedKnob label="High Cut" value="1500 Hz" />
      </KnobSection>
      <KnobSection heading="Feedback">
        <NumberKnob plugin={plugin} values={values} parameter="feedback" />
        <FadedField label="Freeze" value="Off" />
      </KnobSection>
      <KnobSection heading="Output">
        <FadedKnob label="Dry" value="90 %" />
        <NumberKnob plugin={plugin} values={values} parameter="mix" />
      </KnobSection>
      <KnobSection heading="Modulation">
        <FadedKnob label="LFO Rate" value="0.38 Hz" />
        <FadedKnob label="LFO Intensity" value="50 %" />
        <FadedKnob label="Flutter Rate" value="1.6 Hz" />
        <FadedKnob label="Flutter Intensity" value="13 %" />
      </KnobSection>
    </PluginPanel>
  );
}
