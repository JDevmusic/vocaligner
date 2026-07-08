import { z } from "zod";

export const dawSchema = z.enum(["logic-pro"]);
export type Daw = z.infer<typeof dawSchema>;

export const pluginTierSchema = z.enum(["stock", "free-3rd-party", "commercial"]);
export type PluginTier = z.infer<typeof pluginTierSchema>;
