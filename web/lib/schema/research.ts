import { z } from "zod";

export const registerSchema = z.enum(["low", "mid", "high", "falsetto", "mixed"]);
export const dynamicRangeSchema = z.enum(["narrow", "moderate", "wide"]);
export const sibilanceSchema = z.enum(["low", "moderate", "pronounced"]);
export const perceivedSpaceSchema = z.enum(["dry", "intimate", "roomy", "expansive"]);
export const stereoWidthSchema = z.enum(["narrow", "centered", "wide"]);

export const effectTypeSchema = z.enum([
  "reverb",
  "delay",
  "doubling",
  "harmony",
  "distortion",
  "pitch-correction",
  "other",
]);

export const researchSchema = z.object({
  genre: z.object({
    primary: z.string(),
    secondary: z.array(z.string()),
  }),
  vocalCharacteristics: z.object({
    register: registerSchema,
    descriptors: z.array(z.string()),
    deliveryStyle: z.string(),
  }),
  dynamicProfile: z.object({
    range: dynamicRangeSchema,
    consistency: z.string(),
    notablePeaks: z.string(),
  }),
  tonalBalance: z.object({
    lowEnd: z.string(),
    midrange: z.string(),
    highEnd: z.string(),
    sibilance: sibilanceSchema,
  }),
  spatialCharacter: z.object({
    perceivedSpace: perceivedSpaceSchema,
    width: stereoWidthSchema,
    depthTechniques: z.array(z.string()),
  }),
  commonEffects: z.array(
    z.object({
      effectType: effectTypeSchema,
      description: z.string(),
    })
  ),
  productionNotes: z.array(z.string()),
});

export type Research = z.infer<typeof researchSchema>;
