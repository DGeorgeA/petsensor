/**
 * src/lib/audioWorker.ts  (Web Worker)
 *
 * Thin wrapper around the pure PetAudioClassifier: receives PCM from the
 * AudioWorklet, runs the shared decision core off the React thread, and posts
 * back the typed outcome. The classification logic lives in audioClassifier.ts
 * so it can be exercised identically by the offline fixture test harness.
 */

import { PetAudioClassifier } from './audioClassifier';
import type { AnimalType } from './petEmotionLibrary';

const classifier = new PetAudioClassifier();

self.onmessage = function (e: MessageEvent) {
  const { pcm, animalType } = e.data as { pcm: Float32Array; animalType: AnimalType };
  if (!pcm || !animalType) return;
  try {
    self.postMessage(classifier.process(pcm, animalType));
  } catch (err) {
    self.postMessage({ type: 'ERROR', error: String(err) });
  }
};
