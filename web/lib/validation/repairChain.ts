import type { PluginRegistry } from "../registry/pluginRegistry";
import type { Chain, ControlValue, PluginInstance } from "../schema/chain";
import type { ValidationResult } from "../schema/validationResult";

export interface ValidateAndRepairResult {
  chain: Chain;
  validation: ValidationResult;
}

export function validateAndRepairChain(
  candidate: Chain,
  registry: PluginRegistry
): ValidateAndRepairResult {
  const issues: string[] = [];
  let rejected = false;

  const repairedPlugins: PluginInstance[] = candidate.plugins.map((plugin) => {
    const registryEntry = registry.getById(plugin.pluginId);

    if (!registryEntry) {
      issues.push(`Unknown plugin "${plugin.pluginId}" is not in the registry.`);
      rejected = true;
      return plugin;
    }

    const repairedControls: ControlValue[] = plugin.controls.map((control) => {
      const definition = registry.getControlDefinition(plugin.pluginId, control.parameter);

      if (!definition) {
        issues.push(
          `Plugin "${plugin.pluginId}" has no control "${control.parameter}" in the registry.`
        );
        rejected = true;
        return control;
      }

      if (definition.type !== "number") {
        return control;
      }

      if (typeof control.value !== "number") {
        issues.push(`Control "${control.parameter}" on "${plugin.pluginId}" should be a number.`);
        rejected = true;
        return control;
      }

      const { min, max } = definition;
      const isBelowMin = min !== undefined && control.value < min;
      const isAboveMax = max !== undefined && control.value > max;

      if (!isBelowMin && !isAboveMax) {
        return control;
      }

      const clamped = Math.min(max ?? control.value, Math.max(min ?? control.value, control.value));
      issues.push(
        `Control "${control.parameter}" on "${plugin.pluginId}" was clamped from ${control.value} to ${clamped}.`
      );
      return { ...control, value: clamped, wasRepaired: true };
    });

    return { ...plugin, controls: repairedControls };
  });

  const status = rejected ? "rejected" : issues.length > 0 ? "repaired" : "valid";

  return {
    chain: { ...candidate, plugins: repairedPlugins },
    validation: { status, issues },
  };
}
