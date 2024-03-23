import {useState} from 'react';
import {FaWandMagicSparkles} from 'react-icons/fa6';

import {Button} from '@/src/Button';
import type {
  ImageLayerComputed,
  ImageLayerOptions,
} from '@/src/plugins/imageLayer';
import {loadModel, removeBackground} from '@/src/removeBackground';
import {Section} from '@/src/Section';

export function RemoveBgSection({
  ctx,
  options,
  setOptions,
  computed,
}: {
  ctx: CanvasRenderingContext2D;
  options: ImageLayerOptions;
  setOptions: (options: ImageLayerOptions) => void;
  computed: ImageLayerComputed;
}) {
  const [statusText, setStatusText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number | undefined>();

  const handleRemoveBg = async () => {
    setLoading(true);
    setProgress(0);
    setStatusText('Downloading model...');

    await loadModel({onProgress: setProgress});

    setProgress(undefined);
    setStatusText('Removing background...');

    await new Promise((resolve) => setTimeout(resolve, 100));

    const newImage = await removeBackground(
      computed.image,
      computed.image.width,
      computed.image.height,
    );

    const canvas = new OffscreenCanvas(
      computed.image.width,
      computed.image.height,
    );
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(newImage, 0, 0);
    const blob = await canvas.convertToBlob();
    const reader = new FileReader();
    const dataURL = await new Promise<string>((res, rej) => {
      reader.onload = () => res(reader.result as string);
      reader.onerror = rej;
      reader.readAsDataURL(blob);
    });

    setOptions({...options, src: dataURL});
    setLoading(false);
  };

  return (
    <Section label="Magic">
      <div className="flex flex-col gap-1">
        <Button
          disabled={loading}
          icon={<FaWandMagicSparkles />}
          onClick={handleRemoveBg}
        >
          Remove background
        </Button>
        {loading && statusText && <div>{statusText}</div>}
        {loading && (
          <progress
            className="progress progress-primary"
            value={progress}
            max="1"
          ></progress>
        )}
      </div>
    </Section>
  );
}
