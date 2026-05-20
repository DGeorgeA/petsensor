// src/lib/audioWorker.ts

const EMOTION_TEMPLATES: Record<string, { vector: number[] }> = {
  // Dog templates
  stress_bark: { vector: Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.1) * 0.5 + 0.1) },
  dog_whining: { vector: Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.15) * 0.4 + 0.2) },
  dog_calm_bark: { vector: Array.from({ length: 512 }, (_, i) => Math.cos(i * 0.12) * 0.3 + 0.1) },
  dog_stress_growl: { vector: Array.from({ length: 512 }, (_, i) => Math.cos(i * 0.08) * 0.5 - 0.1) },
  relaxed_sigh: { vector: Array.from({ length: 512 }, (_, i) => Math.cos(i * 0.05) * 0.3) },
  excited_yap: { vector: Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.25) * 0.7 + 0.2) },
  
  // Horse templates
  horse_whinny: { vector: Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.08) * 0.6 + 0.15) },
  horse_sigh: { vector: Array.from({ length: 512 }, (_, i) => Math.cos(i * 0.02) * 0.25) },
  
  // Cat templates
  cat_relaxed_purr: { vector: Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.03) * 0.2) }
};

function computeCosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < Math.min(vecA.length, vecB.length); i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

self.onmessage = function(e) {
  const { dataArray, timeDomainArray, animalType } = e.data;
  
  let sum = 0;
  for (let i = 0; i < timeDomainArray.length; i++) {
    const val = (timeDomainArray[i] - 128) / 128;
    sum += val * val;
  }
  const rms = Math.sqrt(sum / timeDomainArray.length);
  
  let zcr = 0;
  for (let i = 1; i < timeDomainArray.length; i++) {
    const prev = (timeDomainArray[i - 1] - 128) / 128;
    const curr = (timeDomainArray[i] - 128) / 128;
    if (prev * curr < 0) zcr++;
  }
  
  let num = 0;
  let den = 0;
  for (let i = 0; i < dataArray.length; i++) {
    num += i * dataArray[i];
    den += dataArray[i];
  }
  const spectralCentroid = den === 0 ? 0 : num / den;
  
  const embedding = Array.from({ length: 512 }, (_, i) => {
    const baseVal = Math.sin(i * (zcr * 0.001 + 0.05)) * rms;
    return baseVal + (spectralCentroid * 0.001 * Math.cos(i * 0.1));
  });
  
  let bestMatchKey = '';
  let highestSim = -1;
  
  Object.entries(EMOTION_TEMPLATES).forEach(([key, template]) => {
    // Filter templates to match animal type
    if (animalType === 'dog' && (key.startsWith('horse_') || key.startsWith('cat_'))) return;
    if (animalType === 'horse' && !key.startsWith('horse_')) return;
    if (animalType === 'cat' && !key.startsWith('cat_')) return;
        
    const sim = computeCosineSimilarity(embedding, template.vector);
    if (sim > highestSim) {
      highestSim = sim;
      bestMatchKey = key;
    }
  });
  
  self.postMessage({
    features: { rms, zcr, spectralCentroid, embedding },
    bestMatch: bestMatchKey,
    similarity: highestSim
  });
};
