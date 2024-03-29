import {Property} from 'csstype';
import React, {useCallback, useRef} from 'react';
import {useEventListener} from 'usehooks-ts';

import {computeEffectsTransform} from '@/src/effects/registry';
import {TransformOptions} from '@/src/effects/transformEffect';
import {ComputedCache} from '@/src/layers/ComputedCache';
import {Layer, Layers} from '@/src/layers/layer';
import {pluginByID} from '@/src/plugins/registry';

type Operation = 'none' | 'move';

export function usePointerControls({
  canvasRef,
  overlayRef,
  setLayers,
  setCursor,
  selectedLayer,
  computedCache,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  overlayRef: React.RefObject<HTMLCanvasElement>;
  setLayers: React.Dispatch<React.SetStateAction<Layers>>;
  setCursor: React.Dispatch<React.SetStateAction<Property.Cursor>>;
  selectedLayer: Layer<string> | undefined;
  computedCache: ComputedCache;
}) {
  const transformRef = useRef<DOMMatrixReadOnly>(new DOMMatrixReadOnly());
  const dragStateRef = useRef({
    operation: 'none' as Operation,
    isDragging: false,
    startX: 0,
    startY: 0,
    targetLayer: undefined as Layer<string> | undefined,
    targetInitX: 0,
    targetInitY: 0,
  });

  const ctx = canvasRef.current?.getContext('2d');
  if (ctx && selectedLayer) {
    const {effectsConfig} = selectedLayer;
    transformRef.current = computeEffectsTransform({effectsConfig, ctx});
  }

  const getOperation = useCallback(
    (canvasX: number, canvasY: number): Operation => {
      if (!ctx) return 'none';
      if (!selectedLayer) return 'none';

      const {pluginID, options} = selectedLayer;
      const plugin = pluginByID(pluginID);
      if (!plugin.bbox) return 'none';

      const computed = computedCache.get(pluginID, options)?.computed;
      const bbox = plugin.bbox({ctx, options, computed});
      if (!bbox) return 'none';

      const transform = transformRef.current;
      const {x, y} = transform
        .inverse()
        .transformPoint({x: canvasX, y: canvasY, z: 1});

      if (x >= bbox[0] && x <= bbox[2] && y >= bbox[1] && y <= bbox[3]) {
        return 'move';
      }
      return 'none';
    },
    [computedCache, ctx, selectedLayer],
  );

  const updateTransform = useCallback(
    (opts: Partial<TransformOptions>) => {
      const dragState = dragStateRef.current;
      setLayers((layers) =>
        layers.map((layer) => {
          if (layer.id === dragState.targetLayer?.id) {
            return {
              ...layer,
              effectsConfig: {
                ...layer.effectsConfig,
                transform: {
                  ...layer.effectsConfig?.transform,
                  ...opts,
                },
              },
            };
          }
          return layer;
        }),
      );
    },
    [setLayers],
  );

  useEventListener(
    'pointerdown',
    useCallback(
      (e: PointerEvent) => {
        if (!selectedLayer) return;
        if (e.currentTarget !== overlayRef.current) return;
        if (!canvasRef.current) return;

        e.preventDefault();

        const canvasRect = canvasRef.current.getBoundingClientRect();
        const canvasX = e.clientX - canvasRect.left;
        const canvasY = e.clientY - canvasRect.top;
        const operation = getOperation(canvasX, canvasY);

        const dragState = dragStateRef.current;
        dragState.isDragging = true;
        dragState.operation = operation;
        dragState.startX = e.clientX;
        dragState.startY = e.clientY;
        dragState.targetLayer = selectedLayer;
        dragState.targetInitX =
          selectedLayer.effectsConfig?.transform?.translateX ?? 0;
        dragState.targetInitY =
          selectedLayer.effectsConfig?.transform?.translateY ?? 0;
      },
      [selectedLayer, overlayRef, canvasRef, getOperation],
    ),
    overlayRef,
  );

  useEventListener(
    'pointerup',
    useCallback(() => {
      const dragState = dragStateRef.current;
      dragState.isDragging = false;
    }, []),
  );

  useEventListener(
    'pointermove',
    useCallback(
      (e: PointerEvent) => {
        if (!canvasRef.current) return;
        const dragState = dragStateRef.current;

        if (!dragState.isDragging) {
          const canvasRect = canvasRef.current.getBoundingClientRect();
          const canvasX = e.clientX - canvasRect.left;
          const canvasY = e.clientY - canvasRect.top;
          const operation = getOperation(canvasX, canvasY);
          setCursor({move: 'move', none: 'default'}[operation] ?? 'default');
        } else {
          e.preventDefault();

          if (dragState.operation === 'move') {
            const dx = e.clientX - dragState.startX;
            const dy = e.clientY - dragState.startY;
            const translateX = dragState.targetInitX + dx;
            const translateY = dragState.targetInitY + dy;

            updateTransform({translateX, translateY});
          } else {
            // noop
          }
        }
      },
      [canvasRef, getOperation, setCursor, updateTransform],
    ),
  );
}
