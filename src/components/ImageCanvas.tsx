'use client';

import clsx from 'clsx';
import type {Property} from 'csstype';
import {useCallback, useEffect, useMemo, useState} from 'react';
import React from 'react';

import {LoadingOverlay} from '@/src/components/LoadingOverlay';
import {withEffects} from '@/src/effects/registry';
import {drawBbox} from '@/src/image/drawBbox';
import {ComputedCache} from '@/src/layers/ComputedCache';
import {Layers} from '@/src/layers/layer';
import {pluginByID} from '@/src/plugins/registry';
import styles from '@/src/styles.module.css';

export const ImageCanvas = ({
  width,
  height,
  zoom,
  layers,
  selectedLayerID,
  hoveredLayerID,
  computing,
  computedCache,
  accurate,
  cursor,
  canvasRef,
  overlayRef,
}: {
  width: number;
  height: number;
  zoom: number;
  layers: Layers;
  selectedLayerID: string | null;
  hoveredLayerID: string | null;
  computing: boolean;
  computedCache: ComputedCache;
  accurate: boolean;
  cursor: Property.Cursor;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  overlayRef: React.RefObject<HTMLCanvasElement>;
}) => {
  const imgRef = React.useRef<HTMLImageElement>(null);
  const displayRef = accurate ? imgRef : canvasRef;
  const [dataURL, setDataURL] = useState<string>('');

  const overlayWidth = overlayRef.current?.offsetWidth ?? 256;
  const overlayHeight = overlayRef.current?.offsetHeight ?? 256;

  const getCtxToOverlay = useCallback(() => {
    if (!overlayRef.current) return null;
    if (!displayRef.current) return null;

    const overlayRect = overlayRef.current.getBoundingClientRect();
    const displayRect = displayRef.current.getBoundingClientRect();
    return new DOMMatrixReadOnly([
      zoom,
      0,
      0,
      zoom,
      displayRect.left - overlayRect.left,
      displayRect.top - overlayRect.top,
    ]);
  }, [displayRef, overlayRef, zoom]);

  // draw image
  useEffect(() => {
    if (computing) return;
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d')!;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

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
        },
      });
    }
    ctx.restore();

    if (accurate) setDataURL(canvasRef.current.toDataURL());
  }, [accurate, canvasRef, computedCache, computing, layers]);

  // draw overlay
  useEffect(() => {
    if (computing) return;
    if (!canvasRef.current) return;
    if (!overlayRef.current) return;

    const ctxToOverlay = getCtxToOverlay();
    if (!ctxToOverlay) return;

    const ctx = canvasRef.current.getContext('2d')!;
    const overlayCtx = overlayRef.current.getContext('2d')!;

    overlayCtx.clearRect(
      0,
      0,
      overlayCtx.canvas.width,
      overlayCtx.canvas.height,
    );

    overlayCtx.save();
    for (let i = layers.length - 1; i >= 0; --i) {
      const layer = layers[i];
      const plugin = pluginByID(layer.pluginID);
      const {options} = layer;
      const {computed} = computedCache.get(layer.pluginID, options) ?? {};
      const selected = layer.id === selectedLayerID;
      const hovered = layer.id === hoveredLayerID;
      if (selected || hovered) {
        withEffects({
          effectsConfig: layer.effectsConfig,
          ctx,
          drawCallback: () => {
            const bbox = plugin.bbox?.({ctx, options, computed});
            if (bbox) {
              drawBbox({
                srcCtx: ctx,
                dstCtx: overlayCtx,
                bbox,
                srcToDst: ctxToOverlay,
                selected,
              });
            }
          },
        });
      }
    }
    overlayCtx.restore();
  }, [
    canvasRef,
    computedCache,
    computing,
    getCtxToOverlay,
    hoveredLayerID,
    layers,
    overlayRef,
    selectedLayerID,
  ]);

  const sizeStyle = useMemo(
    () => ({
      width: `${(width * zoom).toFixed(0)}px`,
      height: `${(height * zoom).toFixed(0)}px`,
    }),
    [height, width, zoom],
  );

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
              style={sizeStyle}
              className={clsx(
                accurate && 'hidden',
                'absolute top-0 left-0',
                styles.checkerBackground,
              )}
            ></canvas>
            {accurate && (
              <img
                ref={imgRef}
                src={dataURL}
                className={clsx(
                  'absolute top-0 left-0',
                  styles.checkerBackground,
                )}
                style={sizeStyle}
                alt="Output image"
              />
            )}
            {computing && <LoadingOverlay />}
          </div>
        </div>
      </div>
      <canvas
        ref={overlayRef}
        width={overlayWidth}
        height={overlayHeight}
        onPointerDown={() => {
          if (document.activeElement && 'blur' in document.activeElement) {
            (document.activeElement as HTMLElement).blur();
          }
        }}
        className="absolute top-0 left-0 w-full h-full"
        style={{cursor}}
      ></canvas>
    </div>
  );
};
ImageCanvas.displayName = 'ImageCanvas';
