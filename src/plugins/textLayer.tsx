import {
  drawStyledText,
  measureStyledText,
  StyledTextStyle,
} from 'canvas-styled-text';

import {allFonts, FontPicker} from '@/src/FontPicker';
import {PanelRow} from '@/src/PanelRow';
import {LayerPlugin} from '@/src/plugins/types';

export type TextLayerOptions = {
  text: string;
  autoFitText: boolean;
  fontSize: number;
  fontName: string;
  fontWeight: number;
  fillStyle: string;
  strokeStyle: string;
  strokeWidth: number;
  textAlign: CanvasTextAlign;
  lineHeight: number;
};

const getFontFamily = (fontName: string): string => {
  if (fontName in allFonts) {
    const key = fontName as keyof typeof allFonts;
    return allFonts[key].style.fontFamily;
  }
  return fontName;
};

const getStyle = (options: TextLayerOptions) =>
  ({
    font: `${options.fontWeight} ${options.fontSize}px ${getFontFamily(
      options.fontName,
    )}`,
    fill: options.fillStyle,
    stroke: options.strokeStyle,
    strokeWidth: options.strokeWidth,
    align: options.textAlign,
    baseline: 'middle',
    lineHeight: options.lineHeight,
  } satisfies StyledTextStyle);

function getBestFitFontSize(
  ctx: CanvasRenderingContext2D,
  options: TextLayerOptions,
  fontSize: number,
  desiredWidth: number,
  maxSteps: number = 8,
  minSize: number = 8,
  maxSize: number = ctx.canvas.width,
): number {
  if (maxSteps <= 0) return fontSize;
  const metrics = measureStyledText(
    ctx,
    options.text,
    getStyle({...options, fontSize}),
  );
  const width = metrics.width;
  if (width < desiredWidth)
    return getBestFitFontSize(
      ctx,
      options,
      fontSize + (maxSize - fontSize) * 0.5,
      desiredWidth,
      maxSteps - 1,
      fontSize,
      maxSize,
    );
  else
    return getBestFitFontSize(
      ctx,
      options,
      fontSize + (minSize - fontSize) * 0.5,
      desiredWidth,
      maxSteps - 1,
      minSize,
      fontSize,
    );
}

export const textLayerPlugin: LayerPlugin<TextLayerOptions> = {
  async compute(options) {
    const style = getStyle(options);
    try {
      await document.fonts.load(style.font);
    } catch (e) {
      console.error('Failed to load font', e);
    }
    return {computed: {}};
  },

  draw: ({ctx, options}) => {
    const baseStyle = getStyle(options);
    ctx.lineJoin = 'round';
    drawStyledText(
      ctx,
      options.text,
      ctx.canvas.width / 2,
      ctx.canvas.height / 2,
      baseStyle,
    );
  },

  UIPanel: ({ctx, options, setOptions}) => {
    if (options.autoFitText) {
      const fontSize = Math.round(
        getBestFitFontSize(ctx, options, 50, ctx.canvas.width),
      );
      if (fontSize !== options.fontSize) {
        setOptions({
          ...options,
          fontSize,
        });
      }
    }

    return (
      <>
        <PanelRow label="text">
          <textarea
            value={options.text}
            onChange={(e) =>
              setOptions({
                ...options,
                text: e.currentTarget.value,
              })
            }
          />
        </PanelRow>
        <PanelRow label="auto-fit text">
          <input
            type="checkbox"
            checked={options.autoFitText}
            onChange={(e) =>
              setOptions({
                ...options,
                autoFitText: e.currentTarget.checked,
              })
            }
          />
        </PanelRow>
        <PanelRow label="font size">
          <input
            className={options.autoFitText ? 'disabled' : ''}
            type="number"
            value={options.fontSize}
            onChange={(e) =>
              setOptions({
                ...options,
                fontSize: e.currentTarget.valueAsNumber,
              })
            }
          />
        </PanelRow>
        <PanelRow label="font family">
          <FontPicker
            value={options.fontName}
            onChange={(fontName) => setOptions({...options, fontName})}
          />
        </PanelRow>
        <PanelRow label="font weight">
          <input
            type="number"
            value={options.fontWeight}
            min={100}
            step={100}
            max={900}
            onChange={(e) =>
              setOptions({
                ...options,
                fontWeight: e.currentTarget.valueAsNumber,
              })
            }
          />
        </PanelRow>
        <PanelRow label="fill style">
          <input
            type="color"
            value={options.fillStyle}
            onChange={(e) =>
              setOptions({
                ...options,
                fillStyle: e.target.value,
              })
            }
          />
        </PanelRow>
        <PanelRow label="stroke style">
          <input
            type="color"
            value={options.strokeStyle}
            onChange={(e) =>
              setOptions({
                ...options,
                strokeStyle: e.target.value,
              })
            }
          />
        </PanelRow>
        <PanelRow label="stroke width">
          <input
            type="number"
            value={options.strokeWidth}
            onChange={(e) =>
              setOptions({
                ...options,
                strokeWidth: parseInt(e.currentTarget.value),
              })
            }
          />
        </PanelRow>
        <PanelRow label="text align">
          <select
            value={options.textAlign}
            onChange={(e) =>
              setOptions({
                ...options,
                textAlign: e.currentTarget.value as CanvasTextAlign,
              })
            }
          >
            <option value="left">left</option>
            <option value="right">right</option>
            <option value="center">center</option>
          </select>
        </PanelRow>
        <PanelRow label="line height">
          <input
            type="number"
            value={options.lineHeight}
            step="0.01"
            onChange={(e) =>
              setOptions({
                ...options,
                lineHeight: e.currentTarget.valueAsNumber,
              })
            }
          />
        </PanelRow>
      </>
    );
  },
};
