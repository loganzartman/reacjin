import {fillLayerPlugin} from '@/src/plugins/fillLayer';
import {imageLayerPlugin} from '@/src/plugins/imageLayer';
import {textLayerPlugin} from '@/src/plugins/textLayer';
import {LayerPlugin} from '@/src/plugins/types';

const layerPluginRegistry = {
  fill: fillLayerPlugin,
  image: imageLayerPlugin,
  text: textLayerPlugin,
} as const;

export type PluginID = keyof typeof layerPluginRegistry;

export type PluginOptions<P> = P extends LayerPlugin<infer Options, any>
  ? Options
  : never;

export type PluginByID<ID> = ID extends PluginID
  ? (typeof layerPluginRegistry)[ID]
  : ID extends unknown
  ? LayerPlugin<unknown>
  : never;

export function pluginByID<ID extends string>(id: ID): PluginByID<ID> {
  for (const [pluginID, plugin] of Object.entries(layerPluginRegistry)) {
    if (pluginID === id) return plugin as PluginByID<ID>;
  }
  throw new Error(`Unknown plugin ${id}`);
}
