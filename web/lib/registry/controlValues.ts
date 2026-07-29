import type { ControlValue } from "../schema/chain";
import type { PluginRegistryEntry } from "./types";

// A Generation's controls[] is sparse -- a plugin instance only includes the
// controls it actually set. Falls back to the registry's own default for
// whatever wasn't set, never to zero/undefined.
export function resolveControlValue(
  plugin: PluginRegistryEntry,
  values: ControlValue[],
  parameter: string
): string | number | boolean | undefined {
  const found = values.find((v) => v.parameter === parameter);
  if (found) return found.value;
  return plugin.controls.find((c) => c.parameter === parameter)?.default;
}

export function resolveControlRange(plugin: PluginRegistryEntry, parameter: string): { min: number; max: number } {
  const definition = plugin.controls.find((c) => c.parameter === parameter);
  return { min: definition?.min ?? 0, max: definition?.max ?? 1 };
}
