import * as ort from 'onnxruntime-web';
import ortWasmPath from 'onnxruntime-web-dist/ort-wasm.wasm';
import ortWasmSimdPath from 'onnxruntime-web-dist/ort-wasm-simd.wasm';

import modelPath from '@/static/models/u2net.quant.onnx';

type FetchModelArgs = {
  onProgress?: (progress: number) => void;
  abortSignal?: AbortSignal;
};

let onnxSession: ort.InferenceSession | null = null;

async function fetchModelData({onProgress, abortSignal}: FetchModelArgs) {
  const response = await fetch(modelPath, {signal: abortSignal});
  if (!response.ok) {
    throw new Error('Failed to load model');
  }
  if (!response.body) {
    throw new Error('No response body');
  }

  const contentLength = Number.parseInt(
    response.headers.get('Content-Length') ?? '1',
    10,
  );

  const reader = response.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    chunks.push(value);
    totalBytes += value.byteLength;
    onProgress?.(totalBytes / contentLength);
  }

  return new Blob(chunks).arrayBuffer();
}

export async function loadModel(
  args: FetchModelArgs = {},
): Promise<ort.InferenceSession> {
  if (onnxSession) return onnxSession;
  console.log('Fetching model');
  const modelData = await fetchModelData(args);
  console.log('Loading model');
  const basepath = document.location.href;
  ort.env.wasm.wasmPaths = {
    'ort-wasm.wasm': new URL(ortWasmPath, basepath).toString(),
    'ort-wasm-simd.wasm': new URL(ortWasmSimdPath, basepath).toString(),
  };
  ort.env.wasm.proxy = true;
  onnxSession = await ort.InferenceSession.create(modelData);
  console.log('Model loaded');
  return onnxSession;
}

function padImage(
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
): OffscreenCanvas {
  const dim = Math.max(sourceWidth, sourceHeight);
  const canvas = new OffscreenCanvas(dim, dim);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, dim, dim);
  ctx.drawImage(image, (dim - sourceWidth) / 2, (dim - sourceHeight) / 2);
  return canvas;
}

function resizeImage(
  image: CanvasImageSource,
  width: number,
  height: number,
): OffscreenCanvas {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
}

export async function removeBackground(
  image: CanvasImageSource,
  imageWidth: number,
  imageHeight: number,
): Promise<CanvasImageSource> {
  const session = await loadModel();

  const resizedCanvas = resizeImage(
    padImage(image, imageWidth, imageHeight),
    320,
    320,
  );

  const resizedData = resizedCanvas
    .getContext('2d')!
    .getImageData(0, 0, 320, 320).data;

  // generate input tensor as flattened and normalized array
  const data = new Float32Array(320 * 320 * 3);
  for (let c = 0; c < 3; ++c) {
    for (let x = 0; x < 320; ++x) {
      for (let y = 0; y < 320; ++y) {
        data[c * 320 * 320 + y * 320 + x] =
          resizedData[(y * 320 + x) * 4 + c] / 255;
      }
    }
  }

  const inputTensor = new ort.Tensor('float32', data, [1, 3, 320, 320]);

  // run inference!
  const feeds: ort.InferenceSession.FeedsType = {
    [session.inputNames[0]]: inputTensor,
  };
  const inferenceResult = await session.run(feeds);

  // Get output results with the output name from the model export.
  const output = inferenceResult[session.outputNames[0]];
  // probabilities
  const outputP = output.data as Float32Array;

  // use the probabilities to create a mask
  const threshold = 0.3;
  const band = 0.3;
  const lowerBound = threshold - band * 0.5;
  const maskCanvas = new OffscreenCanvas(320, 320);
  const maskCtx = maskCanvas.getContext('2d')!;
  const maskData = maskCtx.createImageData(320, 320);
  for (let i = 0; i < 320 * 320; ++i) {
    maskData.data[i * 4 + 3] =
      Math.max(0, Math.min(1, (outputP[i] - lowerBound) / band)) * 255;
  }
  maskCtx.putImageData(maskData, 0, 0);

  // mask the original image using probabilities
  const outputImage = resizeImage(maskCanvas, imageWidth, imageHeight);
  const outputCtx = outputImage.getContext('2d')!;
  outputCtx.globalCompositeOperation = 'source-in';
  outputCtx.drawImage(image, 0, 0, imageWidth, imageHeight);

  return outputImage;
}
