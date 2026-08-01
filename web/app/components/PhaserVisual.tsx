import {
  ArcKnob,
  BooleanToggle,
  DualRangeTrack,
  FadedArcKnob,
  FadedSyncIcon,
  FadedVerticalFader,
  HorizontalFillTrack,
  NumberArcKnob,
  NumberVerticalFader,
  PluginPanel,
  SectionHeading,
  StringDropdown,
  formatKnobValue,
} from "./controls/PluginKnobPrimitives";
import { formatParameterLabel } from "@/lib/format/parameterLabel";
import { resolveControlValue } from "@/lib/registry/controlValues";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";

// `epsilon` floors the range's minimum before taking its log, same trick
// Ceiling/Floor below needs for its own Hz range -- generalized here (was
// hardcoded 1e-6) because Rate 1/2's 0-10 range needs a much bigger floor:
// see RATE_LOG_EPSILON below for why 1e-6 doesn't transfer.
function logFraction(value: number, min: number, max: number, epsilon = 1e-6): number {
  const clampedMin = Math.max(min, epsilon);
  const clamped = Math.min(max, Math.max(clampedMin, value));
  return (Math.log(clamped) - Math.log(clampedMin)) / (Math.log(max) - Math.log(clampedMin));
}

const ARC_MIN_DEG = -135;
const ARC_MAX_DEG = 135;

// Rate 1/2's real dial reads log-scaled, not linear (confirmed by pixel-
// measuring both needles' actual angles in the reference: at their real
// values, Rate 1 (0.24Hz) sits at roughly -120deg and Rate 2 (0.48Hz) at
// roughly -85deg, versus a plain linear mapping's -122deg/-122deg -- Rate 2
// is barely past Rate 1 under linear, but the reference shows it noticeably
// further along). Unlike Tone's 20Hz-20kHz mapping (Overdrive,
// `logKnobRotationDeg`), this range starts at exactly 0, so a direct log10
// mapping is undefined at the minimum -- the epsilon-floor trick `logFraction`
// already uses for Ceiling/Floor's Hz slider transfers, but NOT with that
// same 1e-6 floor: over an 0-10 range, 1e-6 is so small it compresses both
// real values up near the maximum (a direct check put Rate 1 past 75%,
// nowhere close to the reference). RATE_LOG_EPSILON=0.214 is instead fit by
// least-squares against both measured needle angles simultaneously --
// landing within ~7deg of each (roughly a quarter of a clock-hour), the
// closest a single-parameter epsilon can get both points at once.
const RATE_LOG_EPSILON = 0.214;

function rateKnobAngleDeg(value: number, min: number, max: number): number {
  const fraction = logFraction(value, min, max, RATE_LOG_EPSILON);
  return ARC_MIN_DEG + fraction * (ARC_MAX_DEG - ARC_MIN_DEG);
}

// Rate 1/2 need the custom log mapping above, which `NumberArcKnob` has no
// hook for -- rendered via the lower-level `ArcKnob` directly instead,
// reproducing the same label/value/minLabel formatting `NumberArcKnob`
// would have produced.
function RateKnob({ plugin, values, parameter }: { plugin: PluginRegistryEntry; values: ControlValue[]; parameter: string }) {
  const definition = plugin.controls.find((c) => c.parameter === parameter);
  const raw = resolveControlValue(plugin, values, parameter);
  const value = typeof raw === "number" ? raw : 0;
  const min = definition?.min ?? 0;
  const max = definition?.max ?? 10;
  return (
    <ArcKnob
      label={formatParameterLabel(parameter)}
      value={formatKnobValue(parameter, value, definition?.unit)}
      angleDeg={rateKnobAngleDeg(value, min, max)}
      minLabel="0"
      maxLabel="10"
    />
  );
}

// Ceiling/Floor is one shared dual-handle vertical range slider, not two
// independent sliders -- top handle is Ceiling, bottom handle is Floor,
// fill running between them. Both real data, so bold accent fill. Hz
// position is log-scaled (confirmed by measuring the reference's own
// handle positions against the printed values, not assumed linear).
function CeilingFloorSlider({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  const ceilingDef = plugin.controls.find((c) => c.parameter === "ceiling");
  const floorDef = plugin.controls.find((c) => c.parameter === "floor");
  const ceilingRaw = resolveControlValue(plugin, values, "ceiling");
  const ceiling = typeof ceilingRaw === "number" ? ceilingRaw : 0;
  const floorRaw = resolveControlValue(plugin, values, "floor");
  const floor = typeof floorRaw === "number" ? floorRaw : 0;
  const min = ceilingDef?.min ?? 20;
  const max = ceilingDef?.max ?? 20000;
  const topFraction = logFraction(ceiling, min, max) * 100;
  const bottomFraction = logFraction(floor, min, max) * 100;
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="whitespace-nowrap text-[11px] font-medium text-foreground">Ceiling</p>
      <p className="whitespace-nowrap text-sm font-semibold text-brand-accent">{formatKnobValue("ceiling", ceiling, ceilingDef?.unit)}</p>
      <DualRangeTrack orientation="vertical" lowerPercent={bottomFraction} upperPercent={topFraction} />
      {/* Floor sat higher than Sweep Mode beside it -- the reference has
          both on the same baseline. This column's own gap-1 is too tight
          to reach that row on its own (Sweep Mode's column instead relies
          on a fixed 50px gap against Stages); pixel-measured against the
          render to land Floor's caption on the same row. */}
      <p className="mt-[29px] whitespace-nowrap text-[11px] font-medium text-foreground">Floor</p>
      <p className="whitespace-nowrap text-sm font-semibold text-brand-accent">{formatKnobValue("floor", floor, floorDef?.unit)}</p>
    </div>
  );
}

// Faded, no registry data -- blends between LFO 1 and LFO 2, distinct from
// the overall wet/dry Mix in OUT.
function LfoMixSlider() {
  return (
    <div className="flex w-full flex-col items-center gap-1.5 opacity-45">
      <div className="flex w-full items-center justify-between text-sm font-semibold text-muted">
        <span>90 %</span>
        <span className="text-[11px] font-medium text-foreground">Mix</span>
        <span>10 %</span>
      </div>
      <HorizontalFillTrack percent={22} handleShape="bar" />
    </div>
  );
}

// Full real panel structure (docs/images/reference/Phaser_plugin.png), per
// the Phaser design spike (docs/images/spikes/phaser/): four sections with
// dividers (Sweep | LFO | Feedback | Out). Ceiling, Floor, and Out's Mix
// are vertical sliders on the real panel, not knobs -- caught the same way
// as ChromaVerb/Tape Delay's Dry/Wet and Compressor's Distortion/Mix, by
// checking the reference directly rather than trusting the brief. Sweep
// Mode's dropdown sits in the same row as Stages/the slider (a fixed gap
// against Stages, not `justify-between`, which silently absorbs margin
// adjustments -- confirmed by a pixel-identical before/after diff when
// that was tried first) so it shares Floor's exact baseline. Feedback's
// real knob is labeled "Level" on the panel itself -- the section header
// already says FEEDBACK.
export function PhaserVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  return (
    <PluginPanel plugin={plugin} width="1000px" aspectRatio="2.45 / 1">
      <div className="grid flex-1 divide-x divide-border px-5 py-5" style={{ gridTemplateColumns: "2.3fr 3.8fr 3.1fr minmax(90px, 0.9fr)" }}>
        <div className="flex flex-col gap-4 pr-5">
          <SectionHeading large>Sweep</SectionHeading>
          <div className="flex justify-center gap-6">
            <div className="flex flex-col items-center gap-[50px]">
              <NumberArcKnob plugin={plugin} values={values} parameter="stages" minLabel="4" maxLabel="12" />
              <StringDropdown plugin={plugin} values={values} parameter="sweepMode" />
            </div>
            <CeilingFloorSlider plugin={plugin} values={values} />
          </div>
        </div>

        <div className="flex flex-col gap-5 px-5">
          <SectionHeading large>LFO</SectionHeading>
          <div className="flex items-start justify-center gap-6">
            {/* Mix's slider only spans Rate 1+2's own width in the reference,
                stopping well short of Phase -- nested in its own column so
                LfoMixSlider's `w-full` matches just these two knobs, not the
                whole LFO section (Phase sits outside this wrapper). */}
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-6">
                <div className="flex flex-col items-center gap-2">
                  <RateKnob plugin={plugin} values={values} parameter="rate1" />
                  <FadedSyncIcon />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <RateKnob plugin={plugin} values={values} parameter="rate2" />
                  <FadedSyncIcon />
                </div>
              </div>
              <LfoMixSlider />
            </div>
            <FadedArcKnob label="Phase" value="+180 °" numericValue={180} min={0} max={360} />
          </div>
        </div>

        <div className="flex flex-col gap-4 px-5">
          <SectionHeading large>Feedback</SectionHeading>
          <div className="flex items-start justify-center gap-6">
            <div className="flex flex-col items-center gap-4">
              <NumberArcKnob plugin={plugin} values={values} parameter="feedback" label="Level" />
              <BooleanToggle plugin={plugin} values={values} parameter="warmth" />
            </div>
            {/* Taller than the shared FADER_HEIGHT default -- pixel-measured
                against the reference, both faders visibly extend below the
                Warmth button beside them, not stop above it. */}
            <FadedVerticalFader label="Low Cut" value="20 Hz" percent={3} height={190} />
            <FadedVerticalFader label="High Cut" value="20000 Hz" percent={97} height={190} />
          </div>
        </div>

        <div className="flex flex-col gap-4 pl-5">
          <SectionHeading large>Out</SectionHeading>
          <div className="flex items-start justify-center">
            <NumberVerticalFader plugin={plugin} values={values} parameter="mix" plusPrefix />
          </div>
        </div>
      </div>
    </PluginPanel>
  );
}
