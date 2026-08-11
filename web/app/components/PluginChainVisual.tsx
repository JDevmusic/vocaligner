import { ChannelEqVisual } from "./ChannelEqVisual";
import { ChorusVisual } from "./ChorusVisual";
import { ChromaVerbVisual } from "./ChromaVerbVisual";
import { CompressorVisual } from "./CompressorVisual";
import { DeEsser2Visual } from "./DeEsser2Visual";
import { FlangerVisual } from "./FlangerVisual";
import { OverdriveVisual } from "./OverdriveVisual";
import { PhaserVisual } from "./PhaserVisual";
import { PitchCorrectionVisual } from "./PitchCorrectionVisual";
import { TapeDelayVisual } from "./TapeDelayVisual";
import { pluginRegistry } from "@/lib/registry/pluginRegistry";
import type { PluginRegistryEntry } from "@/lib/registry/types";
import type { ControlValue, PluginInstance } from "@/lib/schema/chain";

type PluginVisualComponent = (props: { plugin: PluginRegistryEntry; values: ControlValue[] }) => React.JSX.Element;

const PLUGIN_VISUAL_COMPONENTS: Record<string, PluginVisualComponent> = {
  "logic-pro.channel-eq": ChannelEqVisual,
  "logic-pro.compressor": CompressorVisual,
  "logic-pro.de-esser-2": DeEsser2Visual,
  "logic-pro.chromaverb": ChromaVerbVisual,
  "logic-pro.tape-delay": TapeDelayVisual,
  "logic-pro.pitch-correction": PitchCorrectionVisual,
  "logic-pro.overdrive": OverdriveVisual,
  "logic-pro.flanger": FlangerVisual,
  "logic-pro.phaser": PhaserVisual,
  "logic-pro.chorus": ChorusVisual,
};

// Shared plugin-chain-to-visuals dispatch, factored out of the results page so
// the compare-plugins tool can render a chain the same way without duplicating
// the 10-entry lookup table.
export function PluginChainVisual({ plugins, className }: { plugins: PluginInstance[]; className?: string }) {
  return (
    <div className={className ?? "flex w-full flex-col items-center gap-8"}>
      {plugins.map((instance, index) => {
        const plugin = pluginRegistry.getById(instance.pluginId);
        const Component = PLUGIN_VISUAL_COMPONENTS[instance.pluginId];
        if (!plugin || !Component) {
          console.warn(`No registry entry or Visual component for plugin id "${instance.pluginId}" — skipping.`);
          return null;
        }
        // Array index, not `instance.order`: order is only schema-constrained to be
        // a positive int, not unique, so it isn't a safe React key on its own.
        return <Component key={index} plugin={plugin} values={instance.controls} />;
      })}
    </div>
  );
}
