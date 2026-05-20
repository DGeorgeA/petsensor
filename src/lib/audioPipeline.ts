// src/lib/audioPipeline.ts

export interface AudioFeatureVector {
  rms: number;
  zcr: number;
  spectralCentroid: number;
  embedding: number[]; // 512-dimensional pseudo-embedding
}

export const EMOTION_TEMPLATES: Record<string, { animal: string; label: string; vector: number[] }> = {
  stress_bark: { animal: 'dog', label: 'Anxious Barking / Separation Stress', vector: [] },
  dog_whining: { animal: 'dog', label: 'Whining / Seeking Attention', vector: [] },
  dog_calm_bark: { animal: 'dog', label: 'Calm Barking / Alert Play', vector: [] },
  dog_stress_growl: { animal: 'dog', label: 'Stress Growling / Protective Fear', vector: [] },
  relaxed_sigh: { animal: 'dog', label: 'Relaxed / Calm Breathing', vector: [] },
  excited_yap: { animal: 'dog', label: 'Excited / Playful Vocalization', vector: [] },
  
  horse_whinny: { animal: 'horse', label: 'Distress / Stable Stress Whinny', vector: [] },
  horse_sigh: { animal: 'horse', label: 'Calm / Grounded Breathing', vector: [] },
  
  cat_relaxed_purr: { animal: 'cat', label: 'Relaxed Purr / Comfort Vibrations', vector: [] }
};

// Low-latency Audio Engine utilizing Web Worker for 60fps UI performance
export class PetAudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private stream: MediaStream | null = null;
  private worker: Worker | null = null;
  private animalType: 'dog' | 'horse' | 'cat';
  private onFeatureUpdate: (features: AudioFeatureVector, bestMatch: string, similarity: number) => void;
  private isProcessing: boolean = false;

  constructor(animalType: 'dog' | 'horse' | 'cat', onFeatureUpdate: (features: AudioFeatureVector, bestMatch: string, similarity: number) => void) {
    this.animalType = animalType;
    this.onFeatureUpdate = onFeatureUpdate;
    this.initWorker();
  }

  private initWorker() {
    this.worker = new Worker(new URL('./audioWorker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e) => {
      this.isProcessing = false;
      const { features, bestMatch, similarity } = e.data;
      this.onFeatureUpdate(features, bestMatch, similarity);
    };
  }

  async start() {
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    this.source = this.audioCtx.createMediaStreamSource(this.stream);
    
    // Add real-time Noise Filtering (highpass to remove low-frequency rumble/hum)
    this.filterNode = this.audioCtx.createBiquadFilter();
    this.filterNode.type = 'highpass';
    this.filterNode.frequency.setValueAtTime(80, this.audioCtx.currentTime); // Gentle roll-off
    
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.8;
    
    this.source.connect(this.filterNode);
    this.filterNode.connect(this.analyser);
    
    this.tick();
  }

  private tick = () => {
    if (!this.analyser || !this.worker) return;
    
    if (!this.isProcessing) {
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const timeDomainArray = new Uint8Array(this.analyser.fftSize);
      
      this.analyser.getByteFrequencyData(dataArray);
      this.analyser.getByteTimeDomainData(timeDomainArray);
      
      this.isProcessing = true;
      this.worker.postMessage({
        dataArray,
        timeDomainArray,
        animalType: this.animalType
      });
    }
    
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
    if (this.worker) {
      this.worker.terminate();
    }
    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.filterNode = null;
    this.worker = null;
  }
}
