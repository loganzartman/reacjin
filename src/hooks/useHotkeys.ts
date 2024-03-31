import React, {useCallback} from 'react';
import {useEventListener} from 'usehooks-ts';

import {
  createImageLayer,
  createTextLayer,
  Layer,
  Layers,
} from '@/src/layers/layer';

export function useHotkeys({
  selectedLayer,
  setLayers,
  setSelectedLayerID,
}: {
  selectedLayer: Layer<string> | undefined;
  setLayers: React.Dispatch<React.SetStateAction<Layers>>;
  setSelectedLayerID: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const handleGlobalKeydown = useCallback(
    (event: KeyboardEvent) => {
      console.log('global');
      if (event.key === 'Delete' && selectedLayer) {
        setLayers((layers) =>
          layers.filter((layer) => layer.id !== selectedLayer.id),
        );
        setSelectedLayerID(null);
      }

      if (event.key === 'Escape') {
        setSelectedLayerID(null);
      }
    },
    [selectedLayer, setLayers, setSelectedLayerID],
  );

  useEventListener(
    'keydown',
    useCallback(
      (event: KeyboardEvent) => {
        if (
          document.activeElement instanceof HTMLElement &&
          document.activeElement !== document.body
        ) {
          if (event.key === 'Escape') {
            document.activeElement.blur();
          }
        } else {
          handleGlobalKeydown(event);
        }
      },
      [handleGlobalKeydown],
    ),
  );

  useEventListener(
    'paste',
    useCallback(
      (event: ClipboardEvent) => {
        if (!event.clipboardData) return;
        if (event.clipboardData.files.length > 0) {
          const file = event.clipboardData.files[0];
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const src = event.target?.result as string;
              const newLayer = createImageLayer({src});
              setLayers((layers) => [newLayer, ...layers]);
              setSelectedLayerID(newLayer.id);
            };
            reader.readAsDataURL(file);
          }
        } else {
          const text = event.clipboardData.getData('text');
          if (text) {
            const newLayer = createTextLayer({text});
            setLayers((layers) => [newLayer, ...layers]);
            setSelectedLayerID(newLayer.id);
          }
        }
      },
      [setLayers, setSelectedLayerID],
    ),
  );
}
