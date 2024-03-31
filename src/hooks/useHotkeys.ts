import React from 'react';
import {useEventListener} from 'usehooks-ts';

import {createImageLayer, createTextLayer, Layers} from '@/src/layers/layer';

export function useHotkeys({
  setLayers,
  setSelectedLayerID,
}: {
  setLayers: React.Dispatch<React.SetStateAction<Layers>>;
  setSelectedLayerID: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  useEventListener('paste', (event: ClipboardEvent) => {
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
  });
}
