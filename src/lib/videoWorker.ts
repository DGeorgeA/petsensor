// src/lib/videoWorker.ts  (Web Worker)
//
// Honest camera worker.
//
// The previous version misapplied a HUMAN pose model (MoveNet) to pets and, on
// any load failure, fabricated posture + a 512-dim embedding from Math.sin —
// results that had nothing to do with the actual image. That is removed.
//
// Until a real, on-device dog/cat detector is integrated, this worker performs
// NO behavioural classification. It reports the subject as 'unvalidated' and
// contributes no visual evidence, so the fusion layer degrades honestly to
// INSUFFICIENT / UNSUPPORTED instead of inventing a verdict. Frames are consumed
// locally and released immediately — nothing is retained, nothing leaves the device.
//
// Message out: { type: 'RESULT', subject: 'unvalidated', posture: null }

self.onmessage = (e: MessageEvent) => {
  const { imageBitmap } = e.data as { imageBitmap?: ImageBitmap };

  // Release the frame immediately — we do not retain or analyse pixels yet.
  if (imageBitmap && typeof imageBitmap.close === 'function') {
    imageBitmap.close();
  }

  // No real pet-vision model is available, so we assert nothing about the subject.
  self.postMessage({
    type: 'RESULT',
    subject: 'unvalidated',
    posture: null,
  });
};

// Signal readiness so the engine's wiring stays consistent.
self.postMessage({ type: 'STATUS', status: 'ready' });
