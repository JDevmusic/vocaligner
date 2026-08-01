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
          {/* Intensity's real dial doesn't follow its printed 0-100 range
              linearly -- pixel-measured against the reference (needle
              direction fit directly from its pixel coordinates, independent
              of any assumed knob center, to avoid the center-estimation
              error a naive radius/angle scan is prone to): at 50.0%, the
              needle sits at ~25deg clockwise of 12 o'clock (~59% of the
              270deg sweep), not 0deg/50% as plain linear predicts. Mix,
              same 0-100 range, right next to it on the same reference,
              measures ~0deg at its own 50% -- confirming this is specific
              to Intensity, not a shared bug. logFloor=18.3 is fit by
              solving `logKnobRotationDeg`'s formula backward from that one
              measured point (the only real Intensity reference value this
              project has); the registry's real min/max (0/100) and the
              printed "50.0%" label are unchanged, only the internal angle
              math uses the fitted floor -- same treatment as ChromaVerb's
              Decay. Single-point fit: re-tighten if a second real Intensity
              reference value ever turns up.
              Separately (not fixed here, flagging for a future round):
              Feedback's needle on this same reference (67%, bipolar -100..
              100) measures ~101deg where a linear bipolar mapping predicts
              ~90deg -- a smaller but real-looking deviation worth checking
              later. */}
          <NumberArcKnob plugin={plugin} values={values} parameter="intensity" size={KNOB_SIZE} log logFloor={18.3} />
          <NumberArcKnob plugin={plugin} values={values} parameter="feedback" size={KNOB_SIZE} bipolar />
          <NumberArcKnob plugin={plugin} values={values} parameter="mix" size={KNOB_SIZE} />
        </div>
      </div>
    </PluginPanel>
  );
}
