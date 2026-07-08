import { pluginRegistryEntrySchema, type PluginRegistryEntry } from "./types";

const rawEntries: PluginRegistryEntry[] = [
  {
    id: "logic-pro.channel-eq",
    displayName: "Channel EQ",
    vendor: "Apple (Logic Pro stock)",
    category: "eq",
    daw: "logic-pro",
    tier: "stock",
    controls: [
      { parameter: "highPassFrequency", type: "number", unit: "Hz", min: 20, max: 500, default: 80 },
      { parameter: "presenceFrequency", type: "number", unit: "Hz", min: 500, max: 8000, default: 3000 },
      { parameter: "presenceGain", type: "number", unit: "dB", min: -12, max: 12, default: 0 },
      { parameter: "airGain", type: "number", unit: "dB", min: -12, max: 12, default: 0 },
    ],
    education: {
      whyUsed:
        "Shapes the overall tonal balance of the vocal — removing unwanted low-end and sculpting presence.",
      whatToListenFor:
        "Listen for muddiness in the low-mids and whether the vocal cuts through the mix without sounding harsh.",
      commonMistakes:
        "Boosting presence too aggressively, which introduces harshness rather than clarity.",
      adjustmentGuidance:
        "If the vocal sounds thin, reduce the high-pass frequency. If it sounds harsh, reduce the presence gain.",
    },
  },
  {
    id: "logic-pro.compressor",
    displayName: "Compressor",
    vendor: "Apple (Logic Pro stock)",
    category: "dynamics",
    daw: "logic-pro",
    tier: "stock",
    controls: [
      { parameter: "threshold", type: "number", unit: "dB", min: -60, max: 0, default: -20 },
      { parameter: "ratio", type: "number", min: 1, max: 20, default: 4 },
      { parameter: "attack", type: "number", unit: "ms", min: 0.1, max: 100, default: 10 },
      { parameter: "release", type: "number", unit: "ms", min: 10, max: 1000, default: 150 },
      { parameter: "makeupGain", type: "number", unit: "dB", min: 0, max: 24, default: 0 },
    ],
    education: {
      whyUsed:
        "Evens out the vocal's dynamic range so quiet and loud moments sit more consistently in the mix.",
      whatToListenFor:
        "Listen for pumping or breathing artifacts, and whether quiet phrases disappear under the instrumental.",
      commonMistakes:
        "Setting the attack too fast, which can dull transients and remove the vocal's natural punch.",
      adjustmentGuidance:
        "If the vocal still feels inconsistent, lower the threshold. If it sounds squashed, reduce the ratio.",
    },
  },
  {
    id: "logic-pro.de-esser-2",
    displayName: "DeEsser 2",
    vendor: "Apple (Logic Pro stock)",
    category: "de-esser",
    daw: "logic-pro",
    tier: "stock",
    controls: [
      { parameter: "frequency", type: "number", unit: "Hz", min: 2000, max: 10000, default: 6000 },
      { parameter: "reduction", type: "number", unit: "dB", min: 0, max: 24, default: 6 },
    ],
    education: {
      whyUsed:
        "Tames harsh sibilance ('s' and 't' sounds) that becomes more pronounced after compression and EQ boosts.",
      whatToListenFor: "Listen specifically to 's' consonants — they shouldn't jump out or sound sharp.",
      commonMistakes: "Setting reduction too high, which produces an audible lisp-like effect.",
      adjustmentGuidance:
        "If sibilance still bites, narrow in the frequency toward the actual harsh range before adding more reduction.",
    },
  },
  {
    id: "logic-pro.chromaverb",
    displayName: "ChromaVerb",
    vendor: "Apple (Logic Pro stock)",
    category: "space",
    daw: "logic-pro",
    tier: "stock",
    controls: [
      { parameter: "mix", type: "number", unit: "%", min: 0, max: 100, default: 15 },
      { parameter: "decay", type: "number", unit: "s", min: 0.1, max: 10, default: 1.5 },
      { parameter: "predelay", type: "number", unit: "ms", min: 0, max: 250, default: 10 },
    ],
    education: {
      whyUsed:
        "Adds a sense of physical space around the vocal, helping it feel like part of the mix rather than pasted on top.",
      whatToListenFor: "Listen for whether the vocal feels washed out or loses clarity in busy sections.",
      commonMistakes: "Using too much mix level, which pushes the vocal back and reduces intelligibility.",
      adjustmentGuidance: "If the vocal feels distant, reduce mix or decay. If it feels too dry, increase mix slightly.",
    },
  },
  {
    id: "logic-pro.tape-delay",
    displayName: "Tape Delay",
    vendor: "Apple (Logic Pro stock)",
    category: "space",
    daw: "logic-pro",
    tier: "stock",
    controls: [
      { parameter: "mix", type: "number", unit: "%", min: 0, max: 100, default: 10 },
      { parameter: "time", type: "number", unit: "ms", min: 1, max: 2000, default: 350 },
      { parameter: "feedback", type: "number", unit: "%", min: 0, max: 100, default: 20 },
    ],
    education: {
      whyUsed: "Adds rhythmic depth and interest, especially useful for ad-libs and phrase endings.",
      whatToListenFor: "Listen for whether repeats clutter the vocal or step on the following line.",
      commonMistakes: "Setting feedback too high, causing repeats to build up and blur the mix.",
      adjustmentGuidance: "If repeats feel cluttered, reduce feedback or mix level.",
    },
  },
  {
    id: "logic-pro.pitch-correction",
    displayName: "Pitch Correction",
    vendor: "Apple (Logic Pro stock)",
    category: "pitch",
    daw: "logic-pro",
    tier: "stock",
    controls: [
      { parameter: "response", type: "number", unit: "ms", min: 0, max: 500, default: 50 },
      { parameter: "amount", type: "number", unit: "%", min: 0, max: 100, default: 50 },
    ],
    education: {
      whyUsed:
        "Corrects pitch inaccuracies while preserving (or stylising) the natural character of the performance.",
      whatToListenFor:
        "Listen for unnatural warbling or robotic artifacts, especially on sustained notes.",
      commonMistakes:
        "Setting response too fast for a naturalistic style, producing an obviously 'auto-tuned' sound.",
      adjustmentGuidance:
        "For a subtler effect, increase response time. For a stylised, hard-tuned effect, reduce it.",
    },
  },
];

export const logicProStockPlugins: PluginRegistryEntry[] = rawEntries.map((entry) =>
  pluginRegistryEntrySchema.parse(entry)
);
