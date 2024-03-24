'use client';

import {drawStyledText} from 'canvas-styled-text';
import {useState} from 'react';

import {Button} from '@/src/Button';
import {LoadingOverlay} from '@/src/LoadingOverlay';
import {PanelRow} from '@/src/PanelRow';
import {RemoveBgSection} from '@/src/plugins/RemoveBgSection';
import {LayerPlugin} from '@/src/plugins/types';

export type ImageLayerOptions = {
  src: string;
};

export type ImageLayerComputed = {
  image: ImageBitmap;
};

async function createErrorImage(w: number, h: number, text: string) {
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'red';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 4;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${(w / Math.max(1, text.length)).toFixed(0)}px monospace`;
  drawStyledText(ctx, text, w / 2, h / 2);

  const image = await createImageBitmap(canvas);
  return image;
}

export const imageLayerPlugin: LayerPlugin<
  ImageLayerOptions,
  ImageLayerComputed
> = {
  compute: async ({src}) => {
    const data = await fetch(src, {credentials: 'omit'});
    if (!data.ok) {
      const image = await createErrorImage(256, 256, 'Bad URL');
      return {
        computed: {image},
        cleanup: () => {
          image.close();
        },
      };
    }

    try {
      const blob = await data.blob();
      const image = await createImageBitmap(blob);
      return {
        computed: {image},
        cleanup: () => image.close(),
      };
    } catch (e) {
      const image = await createErrorImage(256, 256, 'Bad Image');
      return {
        computed: {image},
        cleanup: () => {
          image.close();
        },
      };
    }
  },

  draw: ({ctx, computed: {image}}) => {
    // fit the image
    const maxSize = Math.max(image.width, image.height);
    const minSpace = Math.min(ctx.canvas.width, ctx.canvas.height);
    const scale = minSpace / maxSize;
    ctx.drawImage(
      image,
      -image.width / 2,
      -image.height / 2,
      image.width * scale,
      image.height * scale,
    );
  },

  UIPanel({options, setOptions, computed}) {
    const [loading, setLoading] = useState(false);

    const uploadFile = async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        if (input.files && input.files.length > 0) {
          const file = input.files[0];
          const url = URL.createObjectURL(file);
          setOptions({src: url});
        }
      };
      input.click();
    };

    const setFromURL = async () => {
      const url = prompt('Enter image URL', 'https://picsum.photos/256');
      if (url) {
        setLoading(true);
        const result = await fetch(url, {credentials: 'omit'});
        if (!result.ok) {
          setOptions({src: ''});
          return;
        }

        // convert to data URL
        const reader = new FileReader();
        reader.onload = () => {
          setOptions({src: reader.result as string});
        };
        reader.readAsDataURL(await result.blob());
        setLoading(false);
      }
    };

    return (
      <>
        <img
          src={options.src}
          alt="preview"
          className="pointer-events-none select-none w-[256px]"
        />
        <PanelRow label="Replace" className="items-start mt-4 w-max">
          <Button onClick={uploadFile}>Upload</Button>
          <Button onClick={setFromURL}>From URL</Button>
        </PanelRow>
        <RemoveBgSection
          options={options}
          setOptions={setOptions}
          computed={computed}
        />
        {loading && <LoadingOverlay />}
      </>
    );
  },
};
