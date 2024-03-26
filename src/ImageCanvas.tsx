'use client';

import clsx from 'clsx';
import {useEffect, useImperativeHandle, useState} from 'react';
import React from 'react';

import {ComputedCache} from '@/src/ComputedCache';
import {drawBbox} from '@/src/drawBbox';
import {withEffects} from '@/src/effects/registry';
import {Layers} from '@/src/layer';
import {LoadingOverlay} from '@/src/LoadingOverlay';
import {pluginByID} from '@/src/plugins/registry';
import styles from '@/src/styles.module.css';

export const ImageCanvas = React.forwardRef(
  (
    {
      width,
      height,
      zoom,
      layers,
      selectedLayerID,
      computing,
      computedCache,
    }: {
      width: number;
      height: number;
      zoom: number;
      layers: Layers;
      selectedLayerID: string | null;
      computing: boolean;
      computedCache: ComputedCache;
    },
    ref,
  ) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = React.useRef<HTMLCanvasElement>(null);
    const displayRef = React.useRef<HTMLImageElement>(null);
    const [dataURL, setDataURL] = useState<string>('');

    const overlayWidth = overlayCanvasRef.current?.offsetWidth ?? 256;
    const overlayHeight = overlayCanvasRef.current?.offsetHeight ?? 256;

    useImperativeHandle(ref, () => canvasRef.current);

    useEffect(() => {
      if (computing) return;
      if (!canvasRef.current) return;
      if (!overlayCanvasRef.current) return;
      if (!displayRef.current) return;
      const ctx = canvasRef.current.getContext('2d')!;
      const overlayCtx = overlayCanvasRef.current.getContext('2d')!;

      const overlayRect = overlayCanvasRef.current.getBoundingClientRect();
      const displayRect = displayRef.current.getBoundingClientRect();
      const ctxToOverlay = new DOMMatrixReadOnly([
        zoom,
        0,
        0,
        zoom,
        displayRect.left - overlayRect.left,
        displayRect.top - overlayRect.top,
      ]);

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      overlayCtx.clearRect(
        0,
        0,
        overlayCtx.canvas.width,
        overlayCtx.canvas.height,
      );

      ctx.save();
      for (let i = layers.length - 1; i >= 0; --i) {
        const layer = layers[i];
        const plugin = pluginByID(layer.pluginID);
        const {options} = layer;
        const {computed} = computedCache.get(layer.pluginID, options) ?? {};
        withEffects({
          effectsConfig: layer.effectsConfig,
          ctx,
          drawCallback: () => {
            plugin.draw({ctx, options, computed});
            if (layer.id === selectedLayerID) {
              const bbox = plugin.bbox?.({ctx, options, computed});
              if (bbox) drawBbox(ctx, overlayCtx, bbox, ctxToOverlay);
            }
          },
        });
      }
      ctx.restore();

      setDataURL(canvasRef.current.toDataURL());
    }, [computing, computedCache, layers, selectedLayerID, zoom]);

    const sizeStyle = {
      width: `${(width * zoom).toFixed(0)}px`,
      height: `${(height * zoom).toFixed(0)}px`,
    };

    return (
      <div className="absolute left-0 top-0 right-0 bottom-0 overflow-auto flex flex-col items-center justify-center">
        <div className="flex items-center justify-center">
          <div
            className={`relative p-2 shadow-lg rounded-md ring-1 ring-brand-100/20`}
          >
            <div style={sizeStyle} className="relative">
              <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="hidden"
              ></canvas>
              <img
                ref={displayRef}
                src={dataURL}
                className={clsx(
                  'absolute top-0 left-0',
                  styles.checkerBackground,
                )}
                style={sizeStyle}
                alt="Output image"
              />
              {computing && <LoadingOverlay />}
            </div>
          </div>
        </div>
        <canvas
          ref={overlayCanvasRef}
          width={overlayWidth}
          height={overlayHeight}
          className="absolute top-0 left-0 w-full h-full"
        ></canvas>
      </div>
    );
  },
);
ImageCanvas.displayName = 'ImageCanvas';
