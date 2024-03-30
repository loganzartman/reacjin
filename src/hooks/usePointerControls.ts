import {Property} from 'csstype';
import React, {useCallback, useRef} from 'react';
import {useEventListener} from 'usehooks-ts';

import {computeEffectsTransform} from '@/src/effects/registry';
import {TransformOptions} from '@/src/effects/transformEffect';
import {ComputedCache} from '@/src/layers/ComputedCache';
import {Layer, Layers} from '@/src/layers/layer';
import {pluginByID} from '@/src/plugins/registry';

type Operation = 'none' | 'move' | 'scale' | 'rotate';

const scaleBorderSize = 16;
const rotateBorderSize = 48;

const opCursors: Record<Operation, Property.Cursor> = {
  none: 'default',
  move: 'move',
  scale: 'se-resize',
  rotate: 'crosshair',
};

function bboxContains(
  bbox: [number, number, number, number],
  x: number,
  y: number,
) {
  const [x0, y0, x1, y1] = bbox;
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function dilateBbox(
  [x0, y0, x1, y1]: [number, number, number, number],
  d: number,
): [number, number, number, number] {
  return [x0 - d, y0 - d, x1 + d, y1 + d];
}

function len(point: DOMPointReadOnly): number {
  return Math.hypot(point.x, point.y, point.z, point.w);
}

function normalize(point: DOMPointReadOnly): DOMPointReadOnly {
  const length = len(point);
  if (length === 0) return new DOMPointReadOnly();
  return new DOMPointReadOnly(
    point.x / length,
    point.y / length,
    point.z / length,
    point.w / length,
  );
}

function dot2(a: DOMPointReadOnly, b: DOMPointReadOnly): number {
  return a.x * b.x + a.y * b.y;
}

function det2(a: DOMPointReadOnly, b: DOMPointReadOnly): number {
  return a.x * b.y - a.y * b.x;
}

function sub(a: DOMPointReadOnly, b: DOMPointReadOnly): DOMPointReadOnly {
  return new DOMPointReadOnly(a.x - b.x, a.y - b.y, a.z - b.z, a.w - b.w);
}

function scaledDistance(dist: number, transform: DOMMatrixReadOnly): number {
  const {x, y} = transform.transformPoint({x: dist, y: 0, z: 0, w: 0});
  return Math.hypot(x, y);
}

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
  const layerToCanvasRef = useRef<DOMMatrixReadOnly>(new DOMMatrixReadOnly());
  const canvasToLayerRef = useRef<DOMMatrixReadOnly>(new DOMMatrixReadOnly());
  const dragStateRef = useRef({
    operation: 'none' as Operation,
    isDragging: false,
    startX: 0,
    startY: 0,
    targetLayer: undefined as Layer<string> | undefined,
    targetInitX: 0,
    targetInitY: 0,
    targetInitR: 0,
    targetInitSx: 1,
    targetInitSy: 1,
  });

  const ctx = canvasRef.current?.getContext('2d');
  if (ctx && selectedLayer) {
    const {effectsConfig} = selectedLayer;
    layerToCanvasRef.current = computeEffectsTransform({
      effectsConfig,
      ctx,
    });
    canvasToLayerRef.current = layerToCanvasRef.current.inverse();
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

      const canvasToLayer = canvasToLayerRef.current;
      const {x, y} = canvasToLayer.transformPoint({
        x: canvasX,
        y: canvasY,
        z: 0,
        w: 1,
      });

      if (bboxContains(bbox, x, y)) {
        return 'move';
      }

      if (
        bboxContains(
          dilateBbox(bbox, scaledDistance(scaleBorderSize, canvasToLayer)),
          x,
          y,
        )
      ) {
        return 'scale';
      }

      if (
        bboxContains(
          dilateBbox(
            bbox,
            scaledDistance(scaleBorderSize + rotateBorderSize, canvasToLayer),
          ),
          x,
          y,
        )
      ) {
        return 'rotate';
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
        dragState.startX = canvasX;
        dragState.startY = canvasY;
        dragState.targetLayer = selectedLayer;
        dragState.targetInitX =
          selectedLayer.effectsConfig?.transform?.translateX ?? 0;
        dragState.targetInitY =
          selectedLayer.effectsConfig?.transform?.translateY ?? 0;
        dragState.targetInitR =
          selectedLayer.effectsConfig?.transform?.rotate ?? 0;
        dragState.targetInitSx =
          selectedLayer.effectsConfig?.transform?.scaleX ?? 1;
        dragState.targetInitSy =
          selectedLayer.effectsConfig?.transform?.scaleY ?? 1;
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
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const canvasX = e.clientX - canvasRect.left;
        const canvasY = e.clientY - canvasRect.top;
        const origin = new DOMPointReadOnly(0, 0, 0, 1);
        const startPos = canvasToLayerRef.current.transformPoint({
          x: dragState.startX,
          y: dragState.startY,
          z: 0,
          w: 1,
        });
        const currentPos = canvasToLayerRef.current.transformPoint({
          x: canvasX,
          y: canvasY,
          z: 0,
          w: 1,
        });

        if (!dragState.isDragging) {
          const operation = getOperation(canvasX, canvasY);
          setCursor(opCursors[operation] ?? 'default');
        } else {
          e.preventDefault();

          if (dragState.operation === 'move') {
            const dx = canvasX - dragState.startX;
            const dy = canvasY - dragState.startY;
            const translateX = dragState.targetInitX + dx;
            const translateY = dragState.targetInitY + dy;
            updateTransform({translateX, translateY});
          } else if (dragState.operation === 'scale') {
            const startDist = len(sub(startPos, origin));
            const currentDist = dot2(
              sub(currentPos, startPos),
              normalize(sub(startPos, origin)),
            );
            const factor = 1 + currentDist / startDist;
            const scaleX = dragState.targetInitSx * factor;
            const scaleY = dragState.targetInitSy * factor;
            updateTransform({scaleX, scaleY});
          } else if (dragState.operation === 'rotate') {
            const startAngle = normalize(sub(startPos, origin));
            const currentAngle = normalize(sub(currentPos, origin));
            const rotate =
              dragState.targetInitR +
              Math.atan2(
                det2(startAngle, currentAngle),
                dot2(startAngle, currentAngle),
              );
            updateTransform({rotate});
          }
        }
      },
      [canvasRef, getOperation, setCursor, updateTransform],
    ),
  );
}
