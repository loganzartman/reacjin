import {LayerEffect} from '@/src/effects/types';

type TransformOptions = {
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
  rotate: number;
};

export const transformEffect: LayerEffect<TransformOptions> = {
  apply({effectOptions, ctx}) {
    ctx.save();
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.translate(effectOptions.translateX ?? 0, effectOptions.translateY ?? 0);
    ctx.rotate(effectOptions.rotate ?? 0);
    ctx.scale(effectOptions.scaleX ?? 1, effectOptions.scaleY ?? 1);
    return () => {
      ctx.restore();
    };
  },

  UIPanel({options, setOptions}) {
    return (
      <>
        <label>
          Scale X
          <input
            type="number"
            step={0.01}
            value={options.scaleX}
            onChange={(e) =>
              setOptions({...options, scaleX: parseFloat(e.target.value)})
            }
          />
        </label>
        <label>
          Scale Y
          <input
            type="number"
            step={0.01}
            value={options.scaleY}
            onChange={(e) =>
              setOptions({...options, scaleY: parseFloat(e.target.value)})
            }
          />
        </label>
        <label>
          Translate X
          <input
            type="number"
            step={1}
            value={options.translateX}
            onChange={(e) =>
              setOptions({...options, translateX: parseFloat(e.target.value)})
            }
          />
        </label>
        <label>
          Translate Y
          <input
            type="number"
            step={1}
            value={options.translateY}
            onChange={(e) =>
              setOptions({...options, translateY: parseFloat(e.target.value)})
            }
          />
        </label>
        <label>
          Rotate
          <input
            type="number"
            min={-Math.PI}
            max={Math.PI}
            step={0.01}
            value={options.rotate}
            onChange={(e) =>
              setOptions({...options, rotate: parseFloat(e.target.value)})
            }
          />
        </label>
      </>
    );
  },
};
