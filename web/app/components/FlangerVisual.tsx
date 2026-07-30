import { FadedSyncIcon, NumberArcKnob, PluginPanel } from "./controls/PluginKnobPrimitives";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

// Full real panel structure (docs/images/reference/Flanger_plugin.png): Tempo
// Sync (faded, no data) sitting tight against Rate, then Rate/Intensity/
// Feedback/Mix in a row (all real data). Feedback is bipolar (-100 to 100,
// centered at 0) -- confirmed against the reference, same rule as Tape
// Delay's Clip Threshold/Spread. Box widened to fit four 152px knobs
// comfortably (a naive width + even spacing clips the last knob -- the
// knobs need real room, not just repositioning) and trimmed to ~2.2:1
// rather than the raw ~1.42:1 window measurement, which left this single
// knob row floating in unused space below it.
const KNOB_SIZE = 76;

export function FlangerVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin} width="505px" aspectRatio="2.2 / 1">
      <div className="flex flex-1 items-start gap-2 px-4 pt-1 pb-1">
        <div className="flex flex-col items-center pt-1">
          <FadedSyncIcon size={24} />
        </div>
        <div className="flex items-start gap-5">
          <NumberArcKnob plugin={plugin} values={values} parameter="rate" size={KNOB_SIZE} minMax />
          <NumberArcKnob plugin={plugin} values={values} parameter="intensity" size={KNOB_SIZE} />
          <NumberArcKnob plugin={plugin} values={values} parameter="feedback" size={KNOB_SIZE} bipolar />
          <NumberArcKnob plugin={plugin} values={values} parameter="mix" size={KNOB_SIZE} />
        </div>
      </div>
    </PluginPanel>
  );
}
