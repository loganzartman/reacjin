import React, {useCallback, useRef} from 'react';
import {useEventListener} from 'usehooks-ts';

import {Layer, Layers} from '@/src/layers/layer';

export function usePointerControls({
  workspaceRef,
  setLayers,
  selectedLayer,
}: {
  workspaceRef: React.RefObject<HTMLElement>;
  setLayers: React.Dispatch<React.SetStateAction<Layers>>;
  selectedLayer: Layer<string> | undefined;
}) {
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    targetLayer: undefined as Layer<string> | undefined,
    targetInitX: 0,
    targetInitY: 0,
  });

  useEventListener(
    'pointerdown',
    useCallback(
      (e: PointerEvent) => {
        if (!selectedLayer) return;
        if (e.currentTarget !== workspaceRef.current) return;

        e.preventDefault();

        const dragState = dragStateRef.current;
        dragState.isDragging = true;
        dragState.startX = e.clientX;
        dragState.startY = e.clientY;
        dragState.targetLayer = selectedLayer;
        dragState.targetInitX =
          selectedLayer.effectsConfig?.transform?.translateX ?? 0;
        dragState.targetInitY =
          selectedLayer.effectsConfig?.transform?.translateY ?? 0;
      },
      [selectedLayer, workspaceRef],
    ),
    workspaceRef,
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
        const dragState = dragStateRef.current;
        if (!dragState.isDragging) return;

        e.preventDefault();

        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;
        const translateX = dragState.targetInitX + dx;
        const translateY = dragState.targetInitY + dy;

        setLayers((layers) =>
          layers.map((layer) => {
            if (layer.id === dragState.targetLayer?.id) {
              return {
                ...layer,
                effectsConfig: {
                  ...layer.effectsConfig,
                  transform: {
                    ...layer.effectsConfig?.transform,
                    translateX,
                    translateY,
                  },
                },
              };
            }
            return layer;
          }),
        );
      },
      [setLayers],
    ),
  );
}
