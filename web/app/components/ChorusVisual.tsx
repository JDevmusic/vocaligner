import { NumberArcKnob, PluginPanel } from "./controls/PluginKnobPrimitives";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

// Full real panel structure (docs/images/reference/Chorus_plugin.png): three
// knobs (Rate, Intensity, Mix), nothing else -- confirmed the simplest of
// all 10 plugins, no faded elements needed. Box trimmed to ~2:1 (validated
// in the design spike) rather than the raw ~1.43:1 window measurement,
// which left the single knob row floating in unused space -- this app's
// header doesn't reproduce Logic's own heavier toolbar chrome, so the raw
// ratio overstates the box height needed (see docs/DESIGN_SYSTEM.md).
export function ChorusVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin} width="700px" aspectRatio="2 / 1">
      <div className="flex flex-1 items-start justify-center gap-14 px-8 pt-8 pb-6">
        <NumberArcKnob plugin={plugin} values={values} parameter="rate" size={150} minMax />
        <NumberArcKnob plugin={plugin} values={values} parameter="intensity" size={150} />
        <NumberArcKnob plugin={plugin} values={values} parameter="mix" size={150} />
      </div>
    </PluginPanel>
  );
}
