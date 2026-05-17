// src/lib/audioPipeline.ts

export interface AudioFeatureVector {
  rms: number;
  zcr: number;
  spectralCentroid: number;
  embedding: number[]; // 512-dimensional pseudo-embedding
}

// Pre-defined template embeddings for pet emotional states (512-dimensions)
// These templates serve as target anchor points for cosine similarity calculations
export const EMOTION_TEMPLATES: Record<string, { animal: string; label: string; vector: number[] }> = {
  stress_bark: {
    animal: 'dog',
    label: 'Stress Barking / separation anxiety',
    vector: Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.1) * 0.5 + 0.1),
  },
  relaxed_sigh: {
    animal: 'dog',
    label: 'Relaxed / Calm Breathing',
    vector: Array.from({ length: 512 }, (_, i) => Math.cos(i * 0.05) * 0.3),
  },
  excited_yap: {
    animal: 'dog',
    label: 'Excited / Playful Vocalization',
    vector: Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.25) * 0.7 + 0.2),
  },
  horse_whinny: {
    animal: 'horse',
    label: 'Distress / Stable Stress Whinny',
    vector: Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.08) * 0.6 + 0.15),
  },
  horse_sigh: {
    animal: 'horse',
    label: 'Calm / Grounded Breathing',
    vector: Array.from({ length: 512 }, (_, i) => Math.cos(i * 0.02) * 0.25),
  }
};

// Compute cosine similarity between two vectors
export function computeCosineSimilarity(vecA: number[], vecB: number[]): number {
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

// Low-latency Audio Engine
export class PetAudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private stream: MediaStream | null = null;
  private onFeatureUpdate: (features: AudioFeatureVector, bestMatch: string, similarity: number) => void;

  constructor(onFeatureUpdate: (features: AudioFeatureVector, bestMatch: string, similarity: number) => void) {
    this.onFeatureUpdate = onFeatureUpdate;
  }

  async start() {
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.source = this.audioCtx.createMediaStreamSource(this.stream);
    
    // Add real-time Noise Filtering (highpass to remove low-frequency rumble/hum)
    this.filterNode = this.audioCtx.createBiquadFilter();
    this.filterNode.type = 'highpass';
    this.filterNode.frequency.setValueAtTime(100, this.audioCtx.currentTime); // Filter out below 100Hz noise
    
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 1024;
    
    // Chain connections: Mic -> Noise Filter -> Analyser -> Output (muted/no destination to avoid feedback)
    this.source.connect(this.filterNode);
    this.filterNode.connect(this.analyser);
    
    this.tick();
  }

  private tick = () => {
    if (!this.analyser) return;
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDomainArray = new Uint8Array(this.analyser.fftSize);
    
    this.analyser.getByteFrequencyData(dataArray);
    this.analyser.getByteTimeDomainData(timeDomainArray);
    
    // Extract real-time features
    // 1. RMS (Root Mean Square - volume/intensity)
    let sum = 0;
    for (let i = 0; i < timeDomainArray.length; i++) {
      const val = (timeDomainArray[i] - 128) / 128;
      sum += val * val;
    }
    const rms = Math.sqrt(sum / timeDomainArray.length);
    
    // 2. ZCR (Zero Crossing Rate - high-frequency signal changes, e.g. sharp barks vs soft rumbles)
    let zcr = 0;
    for (let i = 1; i < timeDomainArray.length; i++) {
      const prev = (timeDomainArray[i - 1] - 128) / 128;
      const curr = (timeDomainArray[i] - 128) / 128;
      if (prev * curr < 0) zcr++;
    }
    
    // 3. Spectral Centroid
    let num = 0;
    let den = 0;
    for (let i = 0; i < dataArray.length; i++) {
      num += i * dataArray[i];
      den += dataArray[i];
    }
    const spectralCentroid = den === 0 ? 0 : num / den;
    
    // Build real-time 512-dimensional embedding using these raw audio features
    const embedding = Array.from({ length: 512 }, (_, i) => {
      // Modulate the template vector slightly based on current live audio features
      const baseVal = Math.sin(i * (zcr * 0.001 + 0.05)) * rms;
      return baseVal + (spectralCentroid * 0.001 * Math.cos(i * 0.1));
    });
    
    // Perform real-time embedding-based matching via cosine similarity
    let bestMatchKey = '';
    let highestSim = -1;
    
    Object.entries(EMOTION_TEMPLATES).forEach(([key, template]) => {
      const sim = computeCosineSimilarity(embedding, template.vector);
      if (sim > highestSim) {
        highestSim = sim;
        bestMatchKey = key;
      }
    });
    
    this.onFeatureUpdate(
      { rms, zcr, spectralCentroid, embedding },
      bestMatchKey,
      highestSim
    );
    
    // Loop
    if (this.audioCtx && this.audioCtx.state === 'running') {
      requestAnimationFrame(this.tick);
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioCtx) {
      this.audioCtx.close();
    }
    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.filterNode = null;
  }
}
