import { FadedArcKnob, FadedField, FadedSyncIcon, NumberArcKnob, NumberVerticalFader, PluginPanel, formatKnobValue } from "./controls/PluginKnobPrimitives";
import { resolveControlValue } from "@/lib/registry/controlValues";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

const REGULAR_SIZE = 78;
const DECAY_SIZE = 108;

// Predelay has no dial on the real panel -- just a label/value readout with
// the tempo-sync icon to its left, unlike Decay (a full knob with the icon
// inline in its label row). Real data, so bold/colored, not faded.
function PredelayField({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  const definition = plugin.controls.find((c) => c.parameter === "predelay");
  const raw = resolveControlValue(plugin, values, "predelay");
  const value = typeof raw === "number" ? raw : 0;
  return (
    <div className="flex items-center gap-2">
      <FadedSyncIcon />
      <div>
        <p className="text-[11px] font-medium text-foreground">Predelay</p>
        <p className="text-sm font-semibold text-brand-accent">{formatKnobValue("predelay", value, definition?.unit)}</p>
      </div>
    </div>
  );
}

// Full real panel structure (docs/images/reference/Chromaverb_plugin.png), per
// the ChromaVerb design spike (docs/images/spikes/chromaverb/): a top bar
// (Damping EQ label / Room selector / Main-Details tabs, all faded except
// the label), an empty faded Damping EQ graph placeholder, then four
// sections with dividers -- Attack/Size/Density/Predelay | Decay/Freeze |
// Distance | Dry/Wet. Dry and Wet are independent real controls (corrected
// from an invented single "mix" crossfade knob) shown as vertical faders,
// not knobs -- the reference shows them as faders. Decay is visibly larger
// than its neighbors but every knob's own block still starts at the same
// height (a size-only difference, not the whole block shifted down).
export function ChromaVerbVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin} width="1000px" aspectRatio="1.3 / 1">
      <div className="flex flex-1 flex-col gap-3 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-[0.15em] text-supporting uppercase">Damping EQ</p>
          <FadedField label="Algorithm" value="Room" />
          <div className="flex gap-1">
            <FadedField label="Main" value="Main" />
            <FadedField label="Details" value="Details" />
          </div>
        </div>

        <div className="flex w-full flex-1 items-center justify-center rounded-md border border-border bg-background/60 opacity-45">
          <p className="text-[10px] font-medium tracking-wide text-muted uppercase">Damping EQ</p>
        </div>

        <div className="flex items-start divide-x divide-border border-t border-border pt-4">
          <div className="flex flex-col gap-4 pr-9">
            <div className="flex items-start gap-6">
              <FadedArcKnob label="Attack" value="0 %" numericValue={0} size={REGULAR_SIZE} />
              <FadedArcKnob label="Size" value="60 %" numericValue={60} size={REGULAR_SIZE} />
              <FadedArcKnob label="Density" value="60 %" numericValue={60} size={REGULAR_SIZE} />
            </div>
            <PredelayField plugin={plugin} values={values} />
          </div>

          <div className="flex flex-col items-center gap-2 px-9">
            <NumberArcKnob plugin={plugin} values={values} parameter="decay" size={DECAY_SIZE} minMax icon={<FadedSyncIcon />} />
            <FadedField label="Freeze" value="Freeze" />
          </div>

          <div className="flex items-start px-9">
            <FadedArcKnob label="Distance" value="50 %" numericValue={50} size={REGULAR_SIZE} />
          </div>

          <div className="flex items-start gap-6 pl-9">
            <NumberVerticalFader plugin={plugin} values={values} parameter="dry" />
            <NumberVerticalFader plugin={plugin} values={values} parameter="wet" />
          </div>
        </div>
      </div>
    </PluginPanel>
  );
}
