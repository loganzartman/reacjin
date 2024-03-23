export type LayerComputeResult<Computed> = {
  computed: Computed;
  cleanup?: (computed: Computed) => Promise<void> | void;
};

export interface LayerPlugin<Options, Computed = unknown> {
  compute?(
    options: Options,
  ): Promise<LayerComputeResult<Computed>> | LayerComputeResult<Computed>;

  draw(params: {
    ctx: CanvasRenderingContext2D;
    options: Options;
    computed: Computed;
  }): void;

  UIPanel?: React.FC<{
    ctx: CanvasRenderingContext2D;
    options: Options;
    setOptions: (options: Options) => void;
    computed: Computed;
  }>;
}
