import {filterEffect} from '@/src/effects/filterEffect';
import {transformEffect} from '@/src/effects/transformEffect';
import {EffectCleanup, LayerEffect} from '@/src/effects/types';

const effectRegistry = {
  transform: transformEffect,
  filter: filterEffect,
} as const;

export type EffectID = keyof typeof effectRegistry;

export type EffectOptions<M> =
  M extends LayerEffect<infer ModOptions> ? ModOptions : never;

export type EffectByID<M extends EffectID> = (typeof effectRegistry)[M];

export type EffectsConfig = {
  [M in EffectID]?: Partial<EffectOptions<EffectByID<M>>>;
};

export const allEffects = () => Object.keys(effectRegistry) as EffectID[];

export const effectByID = (id: string) => {
  for (const [effectID, effect] of Object.entries(effectRegistry)) {
    if (effectID === id) return effect;
  }
  throw new Error(`Unknown effect ${id}`);
};

export const withEffects = ({
  effectsConfig = {},
  ctx,
  drawCallback,
}: {
  effectsConfig?: EffectsConfig;
  ctx: CanvasRenderingContext2D;
  drawCallback: () => void;
}) => {
  const cleanups: EffectCleanup[] = [];

  for (const effectID of allEffects()) {
    const effect = effectByID(effectID);
    const effectOptions = effectsConfig[effectID] ?? {};
    cleanups.unshift(effect.apply({effectOptions, ctx}));
  }

  drawCallback();

  for (const cleanup of cleanups) cleanup();
};

export const computeEffectsTransform = ({
  effectsConfig,
  ctx,
}: {
  effectsConfig?: EffectsConfig;
  ctx: CanvasRenderingContext2D;
}): DOMMatrix => {
  let transform: DOMMatrix | null = null;
  withEffects({
    effectsConfig,
    ctx,
    drawCallback() {
      transform = ctx.getTransform();
    },
  });
  if (!transform) throw new Error('Failed to extract transform');
  return transform;
};
