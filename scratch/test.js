import { PET_EMOTION_LIBRARY, REFERENCE_EMBEDDINGS } from '../src/lib/petEmotionLibrary.ts';
import { extractFeatures } from '../src/lib/audioFingerprintEngine.ts';

console.log("Successfully loaded petEmotionLibrary!");
console.log("PET_EMOTION_LIBRARY count:", PET_EMOTION_LIBRARY.length);
console.log("REFERENCE_EMBEDDINGS count:", REFERENCE_EMBEDDINGS.size);

// Try dummy extraction
const pcm = new Float32Array(2048);
const feat = extractFeatures(pcm);
console.log("Feature extraction test passed! Centroid:", feat.features.spectralCentroid);
