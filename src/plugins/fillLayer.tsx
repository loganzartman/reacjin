import {PanelRow} from '@/src/PanelRow';
import {LayerPlugin} from '@/src/plugins/types';

export type FillLayerOptions = {
  fillStyle: string;
};

export const fillLayerPlugin: LayerPlugin<FillLayerOptions> = {
  draw: ({ctx, options}) => {
    ctx.fillStyle = options.fillStyle;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  },

  UIPanel({options, setOptions}) {
    return (
      <>
        <PanelRow label="color">
          <input
            type="color"
            value={options.fillStyle}
            onChange={(e) =>
              setOptions({...options, fillStyle: e.target.value})
            }
          />
        </PanelRow>
      </>
    );
  },
};
