import clsx from 'clsx';
import {Reorder} from 'framer-motion';
import {useCallback} from 'react';
import {
  MdContentCopy,
  MdDeleteForever,
  MdOutlineDragIndicator,
  MdOutlineLayers,
} from 'react-icons/md';

import {cloneLayer, Layer, Layers} from '@/src/layer';
import {Panel} from '@/src/Panel';

export function LayerPanel({
  layers,
  setLayers,
  selectedLayerID,
  setSelectedLayerID,
  dragConstraints,
}: {
  layers: Layers;
  setLayers: React.Dispatch<React.SetStateAction<Layers>>;
  selectedLayerID: string | null;
  setSelectedLayerID: React.Dispatch<React.SetStateAction<string | null>>;
  dragConstraints: React.RefObject<HTMLElement>;
}) {
  const handleDelete = useCallback(
    (targetId: string) => {
      setLayers((layers) => layers.filter(({id}) => id !== targetId));
    },
    [setLayers],
  );

  const handleDuplicate = useCallback(
    (targetId: string) => {
      const targetIndex = layers.findIndex(({id}) => id === targetId);
      const clonedLayer = cloneLayer(layers[targetIndex] as Layer<any>);
      setLayers((layers) => {
        const newLayers = [...layers];
        newLayers.splice(targetIndex, 0, clonedLayer);
        return newLayers;
      });
      setSelectedLayerID(clonedLayer.id);
    },
    [layers, setLayers, setSelectedLayerID],
  );

  return (
    <Panel
      title="Layers"
      icon={<MdOutlineLayers />}
      dragConstraints={dragConstraints}
      className="w-[22ch]"
    >
      <Reorder.Group
        axis="y"
        values={layers}
        onReorder={setLayers}
        className="flex-1 overflow-hidden flex flex-col"
      >
        {layers.map((layer) => (
          <Reorder.Item key={layer.id} id={layer.id} value={layer}>
            <div
              className={clsx(
                'group relative transition-colors flex flex-row items-stretch',
                layer.id === selectedLayerID
                  ? 'bg-brand-400 text-background'
                  : 'hover:bg-brand-400/20',
              )}
            >
              <div className="p-2 flex items-center">
                <MdOutlineDragIndicator />
              </div>
              <button
                onClick={() => setSelectedLayerID(layer.id)}
                className="flex-1 p-2 flex items-center overflow-hidden text-ellipsis"
              >
                <div className="flex-1 text-left">
                  {layer.pluginID as string}
                </div>
              </button>
              <div
                className={clsx(
                  'flex items-center transition-opacity opacity-0 group-hover:opacity-100',
                  layer.id === selectedLayerID && 'opacity-100',
                )}
              >
                <button
                  onClick={() => handleDuplicate(layer.id)}
                  className="px-1 py-2"
                >
                  <div className="text-lg hover:bg-brand-100/20 rounded-lg p-1">
                    <MdContentCopy />
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(layer.id)}
                  className="px-1 py-2"
                >
                  <div className="text-lg bg-red-400 text-background rounded-lg p-1">
                    <MdDeleteForever />
                  </div>
                </button>
              </div>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </Panel>
  );
}
