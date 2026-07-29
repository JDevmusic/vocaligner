import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue } from "@/lib/schema/chain";
import {
  FREQ_MAJOR,
  FREQ_TICKS,
  GAIN_LABELED,
  GAIN_TICKS,
  BASELINE_Y,
  type ChannelEqBandKind,
  type ResolvedEqBand,
  computeCurvePoints,
  dbToY,
  fillPath,
  freqLabelText,
  freqToX,
  resolveChannelEqBands,
  selectVisibleFreqTicks,
  strokePath,
} from "@/lib/eq/channelEqCurve";

// No decimal shown for a whole-number frequency (e.g. "250 Hz"); one decimal
// place when the value genuinely has a fractional part (e.g. "69.5 Hz").
function formatBandFreq(freq: number): string {
  return Number.isInteger(freq) ? `${freq} Hz` : `${freq.toFixed(1)} Hz`;
}

function formatBandGain(db: number): string {
  const rounded = Math.round(db * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(1)} dB`;
}

function BandIcon({ kind, active }: { kind: ChannelEqBandKind; active: boolean }) {
  const stroke = active ? "var(--brand-accent)" : "var(--muted)";
  const common = { fill: "none", stroke, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (kind === "highpass") return <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true"><path d="M2,12 Q8,12 11,3 L20,3" {...common} /></svg>;
  if (kind === "lowpass") return <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true"><path d="M2,3 L11,3 Q14,3 20,12" {...common} /></svg>;
  if (kind === "lowshelf") return <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true"><path d="M2,9 L8,9 Q11,9 11,5 L20,5" {...common} /></svg>;
  if (kind === "highshelf") return <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true"><path d="M2,5 L11,5 Q14,5 14,9 L20,9" {...common} /></svg>;
  return <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true"><path d="M11,2 L19,7 L11,12 L3,7 Z" {...common} /></svg>;
}

function EQGraph({ bands }: { bands: ResolvedEqBand[] }) {
  const points = computeCurvePoints(bands);
  const stroke = strokePath(points);
  const fill = fillPath(points);
  const visibleFreqTicks = selectVisibleFreqTicks(FREQ_TICKS);

  return (
    <div className="flex gap-3 px-5">
      <div className="relative flex-1">
        <div className="relative h-6">
          {bands.map((band) => (
            <div key={band.index} className="absolute" style={{ left: freqToX(band.freq) - 11, top: 0 }}>
              <BandIcon kind={band.kind} active={band.enabled} />
            </div>
          ))}
        </div>
        <svg viewBox="0 0 940 335" className="w-full" role="img" aria-label="Frequency response computed from the generated band settings">
          <defs>
            <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand-accent)" stopOpacity={0.16} />
              <stop offset="100%" stopColor="var(--brand-accent)" stopOpacity={0.03} />
            </linearGradient>
          </defs>

          {FREQ_TICKS.map((hz) => (
            <line key={hz} x1={freqToX(hz)} x2={freqToX(hz)} y1={4} y2={330} stroke="var(--border)" strokeWidth={FREQ_MAJOR.has(hz) ? 1 : 0.5} opacity={FREQ_MAJOR.has(hz) ? 0.9 : 0.4} />
          ))}
          {GAIN_TICKS.map((db) => (
            <line key={db} x1={40} x2={900} y1={dbToY(db)} y2={dbToY(db)} stroke="var(--border)" strokeWidth={db === 0 ? 1.2 : 0.5} opacity={db === 0 ? 0.9 : 0.5} />
          ))}

          <path d={fill} fill="url(#eqFill)" />
          <path d={stroke} fill="none" stroke="var(--brand-accent)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

          {GAIN_TICKS.filter((db) => GAIN_LABELED.has(db)).map((db) => (
            <text key={db} x={905} y={dbToY(db) + 3} fontSize={9} className="fill-supporting">{db > 0 ? `+${db}` : db}</text>
          ))}
          {FREQ_TICKS.filter((hz) => visibleFreqTicks.has(hz)).map((hz) => {
            const isLastTick = hz === 20000;
            return (
              <text
                key={hz}
                x={isLastTick ? freqToX(hz) - 8 : freqToX(hz)}
                y={BASELINE_Y + (FREQ_MAJOR.has(hz) ? 3 : 2.3)}
                textAnchor={isLastTick ? "end" : "middle"}
                fontSize={FREQ_MAJOR.has(hz) ? 9 : 6.5}
                opacity={FREQ_MAJOR.has(hz) ? 1 : 0.75}
                className="fill-supporting"
              >
                {freqLabelText(hz)}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="flex w-16 shrink-0 flex-col items-center justify-center border-l border-border pl-3 opacity-45">
        <p className="text-[10px] font-medium tracking-wide text-muted uppercase">Gain</p>
        <p className="mt-1 text-xs text-muted">0.0 dB</p>
      </div>
    </div>
  );
}

const PLOT_MARGIN_FRACTION = (40 / 940) * 100;

function BandData({ bands }: { bands: ResolvedEqBand[] }) {
  return (
    <div className="mt-3 flex gap-3 px-5 pb-4 pt-2">
      <div className="flex flex-1" style={{ paddingLeft: `${PLOT_MARGIN_FRACTION}%`, paddingRight: `${PLOT_MARGIN_FRACTION}%` }}>
        {bands.map((band) => (
          <div key={band.index} className={`flex-1 ${band.enabled ? "" : "opacity-40"}`}>
            <p className={band.enabled ? "text-xs font-semibold text-foreground" : "text-xs font-medium text-foreground"}>
              {formatBandFreq(band.freq)}
            </p>
            <p className={band.enabled ? "text-xs font-semibold text-brand-accent" : "text-xs text-muted"}>
              {band.kind === "highpass" || band.kind === "lowpass" ? `${band.slopeDbPerOct} dB/Oct` : formatBandGain(band.gainDb)}
            </p>
            <p className="text-[10px] text-supporting">Q {band.q.toFixed(2)}</p>
          </div>
        ))}
      </div>
      <div className="w-16 shrink-0" />
    </div>
  );
}

export function ChannelEqVisual({ plugin, values }: { plugin: PluginRegistryEntry; values: ControlValue[] }) {
  const bands = resolveChannelEqBands(plugin, values);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-6 py-4">
        <span className="font-mono text-[11px] tracking-[0.2em] text-supporting uppercase">{plugin.category}</span>
        <h2 className="mt-0.5 text-lg font-semibold text-foreground">{plugin.displayName}</h2>
      </div>
      <div className="pt-5">
        <EQGraph bands={bands} />
        <BandData bands={bands} />
        <div className="flex gap-2 border-t border-border px-5 py-3 opacity-45">
          {["Analyzer", "Q-Couple", "HQ"].map((label) => (
            <span key={label} className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] text-muted">{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
