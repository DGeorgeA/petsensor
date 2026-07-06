// src/lib/videoWorker.ts  (Web Worker)
//
// REAL on-device dog/cat visual observation.
//
// Detector: TensorFlow.js COCO-SSD (lite_mobilenet_v2). COCO natively includes
// "dog" and "cat" classes, so we get genuine species validation + a bounding box
// for localisation — no human pose model, no fabricated keypoints, no random
// values. Runs OFF the main thread; tries WebGL, falls back to WASM.
//
// Per frame we emit only a tiny numeric summary (VisualFrameObs): a normalised
// bounding box + detector score + mean luminance + inter-frame motion. The frame
// pixels are measured and immediately released here and NEVER leave the device.
//
// If the model cannot load, we emit modelAvailable:false and contribute NO
// evidence — the pipeline degrades honestly instead of inventing a reading.

import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-converter';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import type { Species, VisualFrameObs } from './vision/types';

// Detection input size. COCO-SSD internally letterboxes to 300×300 — feeding it
// LESS than 300px (previously 256×192) destroyed detail before the model ever
// saw the frame and measurably hurt real-dog detection. 320×320 preserves the
// model's native resolution with a small margin. (P6 RCA fix — species layer.)
const CANVAS_W = 320;
const CANVAS_H = 320;
const MIN_SCORE = 0.35; // below this a box is ignored

let model: cocoSsd.ObjectDetection | null = null;
let modelAvailable = true;
let modelReady = false;

// Reusable offscreen surface + previous grayscale for motion estimation.
const canvas: OffscreenCanvas = new OffscreenCanvas(CANVAS_W, CANVAS_H);
const ctx = canvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D | null;
let prevGray: Uint8ClampedArray | null = null;

async function initBackend(): Promise<void> {
  // Prefer WebGL (fast, GPU). OffscreenCanvas WebGL is not universal, so fall back.
  try {
    await import('@tensorflow/tfjs-backend-webgl');
    await tf.setBackend('webgl');
    await tf.ready();
    return;
  } catch {
    /* fall through to wasm */
  }
  const wasm = await import('@tensorflow/tfjs-backend-wasm');
  // Serve the wasm binaries from a CDN matching the installed version (cached by SW).
  wasm.setWasmPaths(`https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${tf.version_core}/dist/`);
  await tf.setBackend('wasm');
  await tf.ready();
}

async function initModel(): Promise<void> {
  try {
    await initBackend();
    model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
    modelReady = true;
    (self as unknown as Worker).postMessage({ type: 'STATUS', status: 'ready' });
  } catch {
    modelAvailable = false;
    modelReady = true;
    (self as unknown as Worker).postMessage({ type: 'STATUS', status: 'model-unavailable' });
  }
}
const initPromise = initModel();

function measurePixels(): { luminance: number; motion: number } {
  if (!ctx) return { luminance: 0, motion: 0 };
  const { data } = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
  // Downsample by striding for speed.
  const stride = 4 * 6; // every 6th pixel
  let lumSum = 0;
  let count = 0;
  const gray = new Uint8ClampedArray(Math.ceil(data.length / stride));
  let gi = 0;
  let motionSum = 0;
  let motionCount = 0;
  for (let i = 0; i < data.length; i += stride) {
    const g = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    lumSum += g;
    count++;
    gray[gi] = g;
    if (prevGray && gi < prevGray.length) {
      motionSum += Math.abs(g - prevGray[gi]);
      motionCount++;
    }
    gi++;
  }
  prevGray = gray;
  return {
    luminance: count ? lumSum / count / 255 : 0,
    motion: motionCount ? motionSum / motionCount / 255 : 0,
  };
}

function pickSubject(
  preds: cocoSsd.DetectedObject[],
  preferred: Species,
): { present: boolean; species: Species | null; score: number; box: [number, number, number, number] } {
  let best: cocoSsd.DetectedObject | null = null;
  let bestOther: cocoSsd.DetectedObject | null = null;
  for (const p of preds) {
    if (p.score < MIN_SCORE) continue;
    if (p.class === 'dog' || p.class === 'cat') {
      if (!best || p.score > best.score ||
          (p.class === preferred && best.class !== preferred && Math.abs(p.score - best.score) < 0.1)) {
        best = p;
      }
    } else if (!bestOther || p.score > bestOther.score) {
      bestOther = p;
    }
  }
  if (best) {
    return { present: true, species: best.class as Species, score: best.score, box: best.bbox };
  }
  if (bestOther) {
    // A confident non-pet subject (e.g. a person) → "other" so fusion can reject.
    return { present: false, species: 'other', score: bestOther.score, box: bestOther.bbox };
  }
  return { present: false, species: null, score: 0, box: [0, 0, 0, 0] };
}

self.onmessage = async (e: MessageEvent) => {
  const { imageBitmap } = e.data as { imageBitmap: ImageBitmap };
  if (!imageBitmap) return;

  // Wait for model init FIRST, then stamp the time — otherwise the first frame's
  // timestamp would predate a multi-second model load and inflate the observed
  // window duration (overstating observation confidence).
  await initPromise;
  const t = performance.now();

  // Model unavailable → honest empty observation (no fabrication).
  if (!modelAvailable || !model || !ctx) {
    const obs: VisualFrameObs = {
      t, present: false, species: null, score: 0,
      cx: 0, cy: 0, w: 0, h: 0, luminance: 0, motion: 0, modelAvailable: false,
    };
    (self as unknown as Worker).postMessage({ type: 'RESULT', obs });
    imageBitmap.close?.();
    return;
  }

  try {
    // Letterbox (preserve aspect): stretching a 16:9 frame into a square would
    // distort the subject — hurting detection AND the h/w posture proxy. Neutral
    // grey padding keeps the mean-luminance quality gate unbiased.
    const scale = Math.min(CANVAS_W / imageBitmap.width, CANVAS_H / imageBitmap.height);
    const dw = imageBitmap.width * scale;
    const dh = imageBitmap.height * scale;
    const dx = (CANVAS_W - dw) / 2;
    const dy = (CANVAS_H - dh) / 2;
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.drawImage(imageBitmap, dx, dy, dw, dh);
    const { luminance, motion } = measurePixels();
    const preds = await model.detect(canvas as unknown as HTMLCanvasElement, 5);
    const { present, species, score, box } = pickSubject(preds, (e.data.animalType as Species) ?? 'dog');

    const [x, y, w, h] = box;
    const obs: VisualFrameObs = {
      t,
      present,
      species,
      score,
      cx: (x + w / 2) / CANVAS_W,
      cy: (y + h / 2) / CANVAS_H,
      w: w / CANVAS_W,
      h: h / CANVAS_H,
      luminance,
      motion,
      modelAvailable: true,
    };
    (self as unknown as Worker).postMessage({ type: 'RESULT', obs });
  } catch {
    const obs: VisualFrameObs = {
      t, present: false, species: null, score: 0,
      cx: 0, cy: 0, w: 0, h: 0, luminance: 0, motion: 0, modelAvailable: true,
    };
    (self as unknown as Worker).postMessage({ type: 'RESULT', obs });
  } finally {
    imageBitmap.close?.();
  }
};

// modelReady is referenced to keep intent explicit for future readiness gating.
void modelReady;
