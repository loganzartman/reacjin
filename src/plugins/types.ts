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

  /**
   * @returns [x0, y0, x1, y1] or null if the bbox is not available
   */
  bbox?(params: {
    ctx: CanvasRenderingContext2D;
    options: Options;
    computed: Computed;
  }): [number, number, number, number] | null;

  UIPanel?: React.FC<{
    ctx: CanvasRenderingContext2D;
    options: Options;
    setOptions: (options: Options) => void;
    computed: Computed;
  }>;
}
