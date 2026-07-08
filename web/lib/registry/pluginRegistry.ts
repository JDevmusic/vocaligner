import type { Daw, PluginTier } from "../domain/registry";
import { logicProStockPlugins } from "./logicPro";
import type { ControlDefinition, PluginRegistryEntry } from "./types";

export interface RegistryContext {
  daw: Daw;
  tier: PluginTier;
}

export interface PluginRegistry {
  getById(pluginId: string): PluginRegistryEntry | undefined;
  getAvailable(context: RegistryContext): PluginRegistryEntry[];
  getControlDefinition(pluginId: string, parameter: string): ControlDefinition | undefined;
}

export function createStaticPluginRegistry(entries: PluginRegistryEntry[]): PluginRegistry {
  return {
    getById(pluginId) {
      return entries.find((entry) => entry.id === pluginId);
    },
    getAvailable(context) {
      return entries.filter((entry) => entry.daw === context.daw && entry.tier === context.tier);
    },
    getControlDefinition(pluginId, parameter) {
      return this.getById(pluginId)?.controls.find((control) => control.parameter === parameter);
    },
  };
}

export const pluginRegistry: PluginRegistry = createStaticPluginRegistry(logicProStockPlugins);
