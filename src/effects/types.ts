export type EffectArgs<EffectOptions> = {
  effectOptions: Partial<EffectOptions>;
  ctx: CanvasRenderingContext2D;
};

export type EffectCleanup = () => void;

export interface LayerEffect<EffectOptions> {
  apply: (args: EffectArgs<EffectOptions>) => EffectCleanup;

  UIPanel?: React.FC<{
    ctx: CanvasRenderingContext2D;
    options: Partial<EffectOptions>;
    setOptions: (options: Partial<EffectOptions>) => void;
  }>;
}
