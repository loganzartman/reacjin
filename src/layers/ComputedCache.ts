import {Layers} from '@/src/layers/layer';
import {pluginByID} from '@/src/plugins/registry';
import {LayerComputeResult} from '@/src/plugins/types';

export class ComputedCache {
  private cache = new Map<string, Map<string, LayerComputeResult<unknown>>>();

  anyOutdated(layers: Layers): boolean {
    return layers.some(({pluginID, options}) => {
      const plugin = pluginByID(pluginID);
      if (typeof plugin.compute === 'function') {
        if (!this.has(pluginID, options)) {
          return true;
        }
      }
      return false;
    });
  }

  async computeOutdated(layers: Layers): Promise<void> {
    await Promise.all(
      layers.map(async ({pluginID, options}) => {
        const plugin = pluginByID(pluginID);
        if (typeof plugin.compute === 'function') {
          if (!this.has(pluginID, options)) {
            // TODO: run cleanup on old results
            const result = await plugin.compute(options);
            this.set(pluginID, options, result);
          }
        }
      }),
    );
  }

  has(pluginID: string, options: unknown): boolean {
    const resultsByOptions = this.cache.get(pluginID);
    if (!resultsByOptions) {
      return false;
    }
    return resultsByOptions.has(JSON.stringify(options));
  }

  set(pluginID: string, options: unknown, result: LayerComputeResult<unknown>) {
    let resultsByOptions = this.cache.get(pluginID);
    if (!resultsByOptions) {
      resultsByOptions = new Map();
      this.cache.set(pluginID, resultsByOptions);
    }
    resultsByOptions.set(JSON.stringify(options), result);
  }

  get(
    pluginID: string,
    options: unknown,
  ): LayerComputeResult<unknown> | undefined {
    const resultsByOptions = this.cache.get(pluginID);
    if (!resultsByOptions) {
      return;
    }
    return resultsByOptions.get(JSON.stringify(options));
  }
}
