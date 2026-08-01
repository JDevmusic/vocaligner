import { Dropdown, FadedArcKnob, NumberArcKnob } from "./controls/PluginKnobPrimitives";
import { getScaleNotes } from "@/lib/pitch/scaleIntervals";
import { resolveControlValue } from "@/lib/registry/controlValues";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

const WHITE_KEYS = ["C", "D", "E", "F", "G", "A", "B"];
const BLACK_KEYS = [
  { name: "C#", afterWhiteIndex: 0 },
  { name: "D#", afterWhiteIndex: 1 },
  { name: "F#", afterWhiteIndex: 3 },
  { name: "G#", afterWhiteIndex: 4 },
  { name: "A#", afterWhiteIndex: 5 },
];

function FadedToggle({ label, value }: { label: string; value: string }) {
  return (
    <div className="opacity-45">
      <p className="text-[10px] font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className="rounded-md border border-border bg-background px-2 py-1 text-center text-xs text-muted">{value}</p>
    </div>
  );
}

// Two-line button, one word per line -- the reference genuinely stacks
// "Edit"/"Scale", "Bypass"/"Notes", "Bypass"/"All" inside each button
// rather than fitting them on one line (confirmed by zooming into the
// reference; an earlier round misdiagnosed this as unwanted wrapping and
// forced `whitespace-nowrap`). Same pattern as Compressor's
// `CircuitModeTabs`: `display: inline-block`/`w-fit` (not a plain inline
// `<span>`) so the two wrapped lines share one unified border/background
// box sized to the longer line, instead of each line getting its own
// disjoint inline box.
function TwoLineButton({ label }: { label: string }) {
  const [first, second] = label.split(" ");
  return (
    <span className="inline-block w-fit rounded-md border border-border bg-background px-2.5 py-1 text-center text-[11px] leading-tight text-muted">
      <span className="block">{first}</span>
      <span className="block">{second}</span>
    </span>
  );
}

// A single button whose own text is the control's name -- no separate
// caption above it, no "ON"/"OFF" value (Neural Pitch Detection, Global
// Tuning: the reference labels the button itself, directly). Same on/off
// color treatment as `TogglePill` elsewhere in this file's shared
// primitives (border-brand-accent/bg-brand-accent for real+true, muted
// border/bg for anything else), so if either of these ever gets a real
// registry parameter, passing `on` from that value picks up the same
// brand-accent highlight a real knob gets, with no structural change here.
// `inline-block` + `w-fit` (capped by `max-w-28`, same width the column
// used to force on everything) -- not a plain inline `<span>` -- so a
// wrapped two-line label like "Neural Pitch Detection" gets one unified
// border/background box sized to its own content (the wider of its two
// wrapped lines), rather than each wrapped line drawing its own disjoint
// inline box and the text overflowing the visible border. A short label
// like "Global Tuning" just renders on one line, narrower than the cap.
function NamedToggleButton({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      className={
        "inline-block w-fit max-w-28 rounded-md border px-2.5 py-1.5 text-center text-xs font-semibold leading-tight " +
        (on ? "border-brand-accent bg-brand-accent/15 text-brand-accent" : "border-border bg-background text-muted")
      }
    >
      {label}
    </span>
  );
}

// Ticks positioned by order, not by value -- same convention as DeEsser 2's
// meter strips (real Logic scales like this print ticks at equal pixel
// spacing regardless of the numeric delta between them). `label` is omitted
// on the minor ticks between the labeled major ones, matching the
// reference's own tick density.
const CORRECTION_TICKS: { value: number; label?: string }[] = [
  { value: 100, label: "+100" },
  { value: 75 },
  { value: 50, label: "50" },
  { value: 25 },
  { value: 0, label: "0" },
  { value: -25 },
  { value: -50, label: "50" },
  { value: -75 },
  { value: -100, label: "-100" },
];

// Fixed x-offset (px) of the meter's vertical bar from the container's own
// left edge -- tick rows reserve exactly this much width so their number +
// dash right-justify flush against the bar.
const METER_BAR_OFFSET = 40;

// Correction is a live analysis output (how far off-pitch the incoming
// signal currently is) -- there's no `correction` parameter in the
// registry and never will be, a Generation has no way to know this ahead
// of time. Rendered the same way as every other no-live-data meter on this
// project (Compressor's Gain Reduction Meter, DeEsser 2's Detection/
// Reduction strips): a faded static scale, marker resting at its neutral
// position (0 Cent, dead center -- matching the reference's own default
// state), never a fabricated reading.
function CorrectionMeter() {
  return (
    <div className="flex w-20 shrink-0 flex-col items-center gap-1 opacity-45">
      <p className="text-[10px] font-medium tracking-wide text-muted uppercase">Correction</p>
      <p className="text-xs font-semibold text-muted">0 Cent</p>
      {/* Numbers sit left of the tick dash and the vertical bar, not right
          of it -- reference has [number][dash][bar] reading left to right;
          this previously rendered [bar][dash][number]. Each tick row is a
          fixed-width, right-justified flex row so its dash lands flush
          against the bar regardless of the number's own text width. */}
      <div className="relative mt-1 w-full" style={{ height: 180 }}>
        <div className="absolute top-0 bottom-0 w-px bg-border" style={{ left: METER_BAR_OFFSET }} />
        {CORRECTION_TICKS.map((t, i) => (
          <div
            key={t.value}
            className="absolute left-0 flex items-center justify-end gap-1"
            style={{ top: `${(i / (CORRECTION_TICKS.length - 1)) * 100}%`, width: METER_BAR_OFFSET, transform: "translateY(-50%)" }}
          >
            {t.label !== undefined ? <span className="text-[9px] leading-none text-muted">{t.label}</span> : null}
            <div className="h-px w-1.5 bg-border" />
          </div>
        ))}
        {/* Marker: the neutral (0 Cent) resting position, dead center --
            crosses over the bar, same as the reference's own marker line. */}
        <div className="absolute flex items-center" style={{ top: "50%", left: METER_BAR_OFFSET - 4, transform: "translateY(-50%)" }}>
          <div className="h-px w-4 bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function PitchCorrectionVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  const rootNote = String(resolveControlValue(plugin, values, "rootNote") ?? "C");
  const scale = String(resolveControlValue(plugin, values, "scale") ?? "Major Scale");

  // Computed from real music-theory interval math (see
  // web/lib/pitch/scaleIntervals.ts), not a fixed/literal black-white piano.
  const scaleNotes = getScaleNotes(rootNote, scale);

  return (
    // Real width:height constraint (the reference screenshot is
    // 1452x1154px, ~1.26:1) instead of letting the card grow however tall
    // its stacked content happens to need -- this component predates
    // PluginPanel and is still hand-rolled, so the sizing/structure is
    // reproduced by hand here (width+aspectRatio on the outer box, h-full
    // flex-col card, flex-1 overflow-hidden content) rather than imported.
    <div style={{ width: "715px", aspectRatio: "1.26 / 1", maxWidth: "100%" }}>
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-6 py-3">
          <span className="font-mono text-[11px] tracking-[0.2em] text-supporting uppercase">{plugin.category}</span>
          <h2 className="mt-0.5 text-lg font-semibold text-foreground">{plugin.displayName}</h2>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
      {/* Three areas side by side, matching the reference: a left column
          (Root Note/Scale -- the visual headline of the whole plugin,
          large/bold/accent, not incidental labels -- with Show Pitch
          further down, all sharing the same left edge) so it reads as
          prominent as it does on the real panel; the keyboard with its
          buttons above, in the middle; the Correction meter on the right. */}
      <div className="flex gap-6 px-6 pt-3">
        <div className="flex w-32 shrink-0 flex-col gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-muted uppercase">Root Note</p>
            <p className="text-lg font-bold leading-tight text-brand-accent">{rootNote}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium tracking-wide text-muted uppercase">Scale / Chord</p>
            <p className="text-lg font-bold leading-tight text-brand-accent">{scale}</p>
          </div>
          {/* Show Pitch shares the same left edge as Root Note/Scale in the
              reference -- part of this column, not stacked under the
              keyboard in the middle section. Its gap from Scale/Chord is
              deliberately much larger than the Root Note-to-Scale/Chord gap
              above it (measured in the reference: 167px vs 47px on a
              1452px-wide card, ~82px vs ~23px scaled to this card's 715px
              width) -- the extra mt-[59px] tops up the column's own gap-4
              to reach that wider separation, without touching the Root
              Note/Scale/Chord spacing, which already matches. */}
          <div className="mt-[59px]">
            <p className="text-[10px] font-medium tracking-wide text-muted uppercase opacity-45">Show Pitch</p>
            {/* One joined segmented pill (shared outer border, thin internal
                divider) -- not FadedTabs' gap-separated look, which other
                already-approved plugins rely on for their own genuinely
                gap-separated tab rows (Side Chain/Output, Main/Details).
                The reference shows Input/Output as a single continuous
                control, not two independent buttons. */}
            <div className="mt-0.5 flex items-center overflow-hidden rounded-md border border-border bg-background opacity-45">
              <span className="whitespace-nowrap border-r border-border px-2.5 py-1 text-[11px] text-muted">Input</span>
              <span className="whitespace-nowrap px-2.5 py-1 text-[11px] text-muted">Output</span>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-start justify-between gap-4 opacity-45">
            <div className="flex gap-2">
              <TwoLineButton label="Edit Scale" />
              <TwoLineButton label="Bypass Notes" />
            </div>
            <TwoLineButton label="Bypass All" />
          </div>

          {/* ~2.5:1 width:height, matching the real plugin's keyboard
              proportions. Fixed width (not w-full/stretched-to-the-flex-
              parent) -- pixel-measured against the reference, the keyboard
              is a fixed ~49% of the card's own 715px width (709px of
              1452px there), left-aligned with the button row above it,
              not stretched to fill the rest of the middle column's flex
              space out to the Correction meter. Exactly two flat colors
              regardless of black/white key shape -- no per-key tinting/
              blending, per docs/DESIGN_SYSTEM.md's Plugin Visual Fidelity
              Standards. */}
          <div className="relative flex" style={{ aspectRatio: "2.5 / 1", width: 349 }}>
            {WHITE_KEYS.map((note) => (
              <div
                key={note}
                className={
                  scaleNotes.has(note)
                    ? "flex flex-1 items-end justify-center rounded-b-md border border-foreground/15 bg-brand-accent pb-3 text-sm font-semibold text-foreground"
                    : "flex flex-1 items-end justify-center rounded-b-md border border-foreground/15 bg-border pb-3 text-sm text-muted"
                }
              >
                {note}
              </div>
            ))}
            {/* Black key width re-measured against the reference directly:
                a black key's own width is ~76% of a white key's width there
                (78px of 102.86px), not the ~49% the old w-[7%] produced
                (7% of the keyboard's total width vs. white keys' 1/7 each).
                11% of the total keyboard width matches. */}
            {BLACK_KEYS.map((key) => (
              <div
                key={key.name}
                className={
                  scaleNotes.has(key.name)
                    ? "absolute top-0 flex h-[62%] w-[11%] items-end justify-center rounded-b-md border border-foreground/15 bg-brand-accent pb-2 text-xs font-semibold text-foreground"
                    : "absolute top-0 flex h-[62%] w-[11%] items-end justify-center rounded-b-md border border-foreground/15 bg-border pb-2 text-xs text-muted"
                }
                style={{ left: `${((key.afterWhiteIndex + 1) / 7) * 100 - 5.5}%` }}
              >
                {key.name}
              </div>
            ))}
          </div>
        </div>

        <CorrectionMeter />
      </div>

      {/* Settings is genuinely wider than Tuning in the reference (~1.45:1,
          pixel-measured) -- Settings has three columns of real content
          (Neural Pitch Detection/Pitch Range, Response, Tolerance) where
          Tuning only has two (Global Tuning/Reference, Detune), so an even
          50/50 split doesn't match. */}
      <div className="mt-3 grid grid-cols-1 divide-y divide-border border-t border-border sm:grid-cols-[1.45fr_1fr] sm:divide-x sm:divide-y-0">
        {/* Neural Pitch Detection/Pitch Range form their own left-hand
            column (stacked, not a row) -- Response/Tolerance sit beside
            that column, centered in the remaining width, not crowded
            against it. */}
        <div className="px-6 py-3">
          <p className="mb-2 text-xs font-semibold text-foreground">Settings</p>
          <div className="flex items-start gap-8">
            <div className="flex w-28 shrink-0 flex-col" style={{ gap: 34 }}>
              {/* No registry parameter backs this (rootNote/scale/response/
                  tolerance are the only real ones), so it renders faded --
                  but reuses TogglePill's real on/off color logic, not a
                  bespoke muted style, so a future real boolean here just
                  needs `on` wired to real data, no rebuild. Gap to Pitch
                  Range below re-measured against the reference (69px gap
                  there / 0.4924 scale = ~34px on our card) -- gap-3 read
                  visibly tighter than the real breathing room there. */}
              <div className="opacity-45">
                <NamedToggleButton label="Neural Pitch Detection" on={false} />
              </div>
              <Dropdown label="Pitch Range" value="Normal" faded />
            </div>
            {/* Gap re-measured against the reference: Response/Tolerance's
                own knob-edge gap is ~2.08x the knob's diameter there
                (208px gap / 100px knob), which at our size=50 knobs works
                out to ~104px -- much wider than the gap-8 (32px) it was
                eyeballed at before. */}
            <div className="flex flex-1 items-start justify-center" style={{ gap: 104 }}>
              <NumberArcKnob plugin={plugin} values={values} parameter="response" minMax size={50} />
              <NumberArcKnob plugin={plugin} values={values} parameter="tolerance" minMax size={50} />
            </div>
          </div>
        </div>
        {/* Same pattern: Global Tuning/Reference stacked as a left column,
            Detune (unchanged) roughly vertically centered beside it. */}
        <div className="px-6 py-3 opacity-45">
          <p className="mb-2 text-xs font-semibold text-foreground">Tuning</p>
          <div className="flex items-center gap-8">
            <div className="flex w-28 shrink-0 flex-col" style={{ gap: 34 }}>
              <NamedToggleButton label="Global Tuning" on={false} />
              <FadedToggle label="Reference" value="0 ct" />
            </div>
            <div className="flex flex-1 justify-center">
              <FadedArcKnob label="Detune" value="0 ct" numericValue={0} size={50} />
            </div>
          </div>
        </div>
      </div>

          <p className="mt-auto border-t border-border px-6 py-1.5 text-[11px] text-supporting">
            Faded controls are at Logic&apos;s own default — leave them exactly as they are.
          </p>
        </div>
      </div>
    </div>
  );
}
