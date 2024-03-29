import {allEffects, effectByID, EffectID} from '@/src/effects/registry';
import {Layer} from '@/src/layer';

export default function LayerEffectsUI({
  layer,
  ctx,
  layers,
  setLayers,
}: {
  layer: Layer<string>;
  ctx: CanvasRenderingContext2D;
  layers: Layer<string>[];
  setLayers: (layers: Layer<string>[]) => void;
}) {
  const handleSetOptions = (effectID: EffectID, newOptions: object) => {
    setLayers(
      layers.map((l) =>
        l === layer
          ? {
              ...l,
              effectsConfig: {
                ...l.effectsConfig,
                [effectID]: {
                  ...l.effectsConfig?.[effectID],
                  ...newOptions,
                },
              },
            }
          : l,
      ),
    );
  };

  const effectsUIs = allEffects().map((effectID) => {
    const effect = effectByID(effectID);
    if (!effect.UIPanel) return null;

    const options = layer.effectsConfig?.[effectID] ?? {};
    const setOptions = (newOptions: object) =>
      handleSetOptions(effectID, newOptions);

    return (
      <div key={effectID} className="flex flex-col gap-1">
        <effect.UIPanel ctx={ctx} options={options} setOptions={setOptions} />
      </div>
    );
  });

  return <div className="flex flex-row gap-2 divide-x">{effectsUIs}</div>;
}
