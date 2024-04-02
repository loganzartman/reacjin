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
const rotateBorderSize = 24;

const scaleCursors: Property.Cursor[] = [
  'e-resize',
  'se-resize',
  's-resize',
  'sw-resize',
  'w-resize',
  'nw-resize',
  'n-resize',
  'ne-resize',
];

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
  layers,
  setLayers,
  setCursor,
  hoveredLayerID,
  setHoveredLayerID,
  selectedLayerID,
  setSelectedLayerID,
  computedCache,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  overlayRef: React.RefObject<HTMLCanvasElement>;
  layers: Layers;
  setLayers: React.Dispatch<React.SetStateAction<Layers>>;
  setCursor: React.Dispatch<React.SetStateAction<Property.Cursor>>;
  hoveredLayerID: string | null;
  setHoveredLayerID: React.Dispatch<React.SetStateAction<string | null>>;
  selectedLayerID: string | null;
  setSelectedLayerID: React.Dispatch<React.SetStateAction<string | null>>;
  computedCache: ComputedCache;
}) {
  const selectedLayer = layers.find((layer) => layer.id === selectedLayerID);

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

  const getLayerBbox = useCallback(
    (layer: Layer<string>) => {
      if (!ctx) return null;
      const {pluginID, options} = layer;
      const plugin = pluginByID(pluginID);
      if (!plugin.bbox) return null;

      const computed = computedCache.get(pluginID, options)?.computed;
      return plugin.bbox({ctx, options, computed});
    },
    [computedCache, ctx],
  );

  const getCanvasToLayer = useCallback(
    (layer: Layer<string>) => {
      if (!ctx) throw new Error('Canvas context not available');
      const layerToCanvas = computeEffectsTransform({
        effectsConfig: layer.effectsConfig,
        ctx: ctx,
      });
      const canvasRect = ctx.canvas.getBoundingClientRect();
      const scaleX = ctx.canvas.width / canvasRect.width;
      const scaleY = ctx.canvas.height / canvasRect.height;
      return layerToCanvas.inverse().scale(scaleX, scaleY);
    },
    [ctx],
  );

  const getOperation = useCallback(
    (canvasX: number, canvasY: number): Operation => {
      if (!selectedLayer) return 'none';

      const bbox = getLayerBbox(selectedLayer);
      if (!bbox) return 'none';

      const canvasToLayer = getCanvasToLayer(selectedLayer);
      const {x, y} = canvasToLayer.transformPoint({
        x: canvasX,
        y: canvasY,
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
    [getCanvasToLayer, getLayerBbox, selectedLayer],
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

  const updateHoveredLayer = useCallback(
    (canvasX: number, canvasY: number) => {
      const operation = getOperation(canvasX, canvasY);

      if (operation === 'none') setCursor('default');
      else if (operation === 'move') setCursor('move');
      else if (operation === 'rotate') setCursor('crosshair');
      else if (operation === 'scale') {
        const canvasToLayer = getCanvasToLayer(selectedLayer!);
        const {x, y} = canvasToLayer.transformPoint({
          x: canvasX,
          y: canvasY,
          w: 1,
        });
        const angle = Math.atan2(y, x);
        const cursorIndex = Math.round(
          ((angle + Math.PI) / (2 * Math.PI)) * scaleCursors.length,
        );
        setCursor(scaleCursors[cursorIndex % scaleCursors.length]);
      }

      for (const layer of [
        ...(selectedLayer ? [selectedLayer] : []),
        ...layers,
      ]) {
        let bbox = getLayerBbox(layer);
        if (!bbox) continue;

        if (layer.id === selectedLayerID) {
          bbox = dilateBbox(
            bbox,
            scaledDistance(
              scaleBorderSize + rotateBorderSize,
              getCanvasToLayer(layer),
            ),
          );
        }

        const canvasToLayer = getCanvasToLayer(layer);
        const {x, y} = canvasToLayer.transformPoint({
          x: canvasX,
          y: canvasY,
          w: 1,
        });

        if (bboxContains(bbox, x, y)) {
          setHoveredLayerID(layer.id);
          return;
        }
      }
      setHoveredLayerID(null);
    },
    [
      getCanvasToLayer,
      getLayerBbox,
      getOperation,
      layers,
      selectedLayer,
      selectedLayerID,
      setCursor,
      setHoveredLayerID,
    ],
  );

  const updateDraggedLayer = useCallback(
    (canvasX: number, canvasY: number) => {
      if (!selectedLayer) return;
      if (!ctx) return;

      const dragState = dragStateRef.current;
      const origin = new DOMPointReadOnly(0, 0, 0, 1);
      const canvasRect = ctx.canvas.getBoundingClientRect();
      const canvasToLayer = getCanvasToLayer(selectedLayer);
      const startPos = canvasToLayer.transformPoint({
        x: dragState.startX,
        y: dragState.startY,
        z: 0,
        w: 1,
      });
      const currentPos = canvasToLayer.transformPoint({
        x: canvasX,
        y: canvasY,
        z: 0,
        w: 1,
      });

      if (dragState.operation === 'move') {
        const dx =
          (canvasX - dragState.startX) * (ctx.canvas.width / canvasRect.width);
        const dy =
          (canvasY - dragState.startY) *
          (ctx.canvas.height / canvasRect.height);
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
    },
    [ctx, getCanvasToLayer, selectedLayer, updateTransform],
  );

  useEventListener(
    'pointerdown',
    useCallback(
      (e: PointerEvent) => {
        if (e.currentTarget !== overlayRef.current) return;
        if (!canvasRef.current) return;

        if (!hoveredLayerID) {
          setSelectedLayerID(null);
        } else if (hoveredLayerID !== selectedLayerID) {
          setSelectedLayerID(hoveredLayerID);
        } else {
          if (selectedLayer) {
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
            const {translateX, translateY, rotate, scaleX, scaleY} =
              selectedLayer.effectsConfig?.transform ?? {};
            dragState.targetInitX = translateX ?? 0;
            dragState.targetInitY = translateY ?? 0;
            dragState.targetInitR = rotate ?? 0;
            dragState.targetInitSx = scaleX ?? 1;
            dragState.targetInitSy = scaleY ?? 1;
          }
        }
      },
      [
        overlayRef,
        canvasRef,
        hoveredLayerID,
        selectedLayerID,
        setSelectedLayerID,
        selectedLayer,
        getOperation,
      ],
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

        if (dragState.isDragging) {
          e.preventDefault();
          updateDraggedLayer(canvasX, canvasY);
        } else {
          updateHoveredLayer(canvasX, canvasY);
        }
      },
      [canvasRef, updateDraggedLayer, updateHoveredLayer],
    ),
  );
}
