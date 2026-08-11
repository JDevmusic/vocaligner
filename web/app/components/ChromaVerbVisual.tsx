import { FadedArcKnob, FadedSyncIcon, FadedTabs, NumberArcKnob, NumberVerticalFader, PluginPanel, formatKnobValue } from "./controls/PluginKnobPrimitives";
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
    // width is 1250px, not the usual 1000px other plugins use here: at 1000px the
    // row's own fixed section padding (58px x4) plus its five knob/fader columns
    // overflows past the card's right edge, and PluginPanel's overflow-hidden
    // silently clips whatever's rightmost -- the Dry/Wet faders -- regardless of
    // the actual control values. A first attempt at 1080px (hand-calculated from
    // summing the source's own padding/knob-width values, without a real browser
    // to verify against) was confirmed still insufficient -- real font rendering
    // is evidently wider than that estimate accounted for. This is a deliberately
    // large safety margin rather than another marginal guess. aspectRatio is
    // unchanged, so this just scales the whole card up, not just the row.
    <PluginPanel plugin={plugin} width="1250px" aspectRatio="1.3 / 1">
      <div className="flex flex-1 flex-col gap-3 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-[0.15em] text-supporting uppercase">Damping EQ</p>
          {/* Room is the algorithm name, not a caption+value pair -- the
              reference shows it alone, large and bold. Still faded/muted
              rather than the reference's highlighted orange, though: it's
              not backed by real registry data here, same reasoning as
              every other unbacked-but-real-position element on this card. */}
          <span className="rounded-lg border border-border bg-background px-4 py-1.5 text-base font-semibold text-muted opacity-45">Room</span>
          {/* Neither option is backed by real data (this toggles the graph's
              own display mode, not a generated parameter), so -- same
              convention as Compressor's circuit-mode tabs or Side Chain/
              Output -- neither renders as selected, even though the
              reference shows "Main" active. */}
          <FadedTabs options={["Main", "Details"]} />
        </div>

        <div className="flex w-full flex-1 items-center justify-center rounded-md border border-border bg-background/60 opacity-45">
          <p className="text-[10px] font-medium tracking-wide text-muted uppercase">Damping EQ</p>
        </div>

        <div className="flex items-start divide-x divide-border border-t border-border pt-4">
          <div className="flex flex-col gap-4 pr-[58px]">
            <div className="flex items-start gap-12">
              <FadedArcKnob label="Attack" value="0 %" numericValue={0} size={REGULAR_SIZE} />
              <FadedArcKnob label="Size" value="60 %" numericValue={60} size={REGULAR_SIZE} />
              <FadedArcKnob label="Density" value="60 %" numericValue={60} size={REGULAR_SIZE} />
            </div>
            <PredelayField plugin={plugin} values={values} />
          </div>

          <div className="flex flex-col items-center gap-2 px-[58px]">
            {/* Decay's 0.3-100s range reads log-scaled on the real dial, not
                linear -- pixel-measuring the reference's own needle at its
                shown value (1.1s) puts it at ~39% of the sweep, while a
                plain log10 over the printed 0.3-100 range only predicts
                ~22%. logFloor=0.06 is a fitted effective log-scale minimum
                (see `logKnobRotationDeg`'s own comment) -- the printed
                minLabel stays the registry's real "0.3", only the angle
                math uses the fitted floor. */}
            <NumberArcKnob plugin={plugin} values={values} parameter="decay" size={DECAY_SIZE} minMax icon={<FadedSyncIcon />} log logFloor={0.06} />
            <FadedTabs options={["Freeze"]} />
          </div>

          <div className="flex items-start px-[58px]">
            <FadedArcKnob label="Distance" value="50 %" numericValue={50} size={REGULAR_SIZE} />
          </div>

          <div className="flex items-start gap-6 pl-[58px]">
            <NumberVerticalFader plugin={plugin} values={values} parameter="dry" />
            <NumberVerticalFader plugin={plugin} values={values} parameter="wet" />
          </div>
        </div>
      </div>
    </PluginPanel>
  );
}
