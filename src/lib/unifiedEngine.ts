import { PetAudioEngine, type AudioFeatureVector } from './audioPipeline';

export interface UnifiedResult {
  audio: {
    features: AudioFeatureVector;
    bestMatch: string;
    similarity: number;
    level: 'LOW' | 'MODERATE' | 'HIGH';
    message: string;
  } | null;
  video: {
    posture: { label: string; confidence: number; details: string; level: 'LOW' | 'MODERATE' | 'HIGH' };
    embedding: number[];
  } | null;
  combinedScore: number; // 0 to 100 (100 is perfectly calm)
  finalLevel: 'LOW' | 'MODERATE' | 'HIGH';
  finalMessage: string;
}

export class UnifiedSensingEngine {
  private audioEngine: PetAudioEngine | null = null;
  private videoWorker: Worker | null = null;
  private animalType: 'dog' | 'cat' | 'horse';
  
  private latestAudio: any = null;
  private latestVideo: any = null;

  private onUpdate: (result: UnifiedResult) => void;
  
  // Video specific
  private videoElement: HTMLVideoElement | null = null;
  private videoStream: MediaStream | null = null;
  private videoInterval: number | null = null;
  private isProcessingVideo = false;

  constructor(animalType: 'dog' | 'cat' | 'horse', onUpdate: (result: UnifiedResult) => void) {
    this.animalType = animalType;
    this.onUpdate = onUpdate;
  }

  async start(videoEl: HTMLVideoElement) {
    this.videoElement = videoEl;

    // 1. Initialize Audio Engine
    this.audioEngine = new PetAudioEngine(this.animalType, (features, bestMatch, similarity) => {
      let level: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
      let message = `Your ${this.animalType} feels calm and safe.`;
      
      if (bestMatch.includes('stress')) {
        level = 'HIGH';
        message = 'High vocal anxiety detected.';
      } else if (bestMatch.includes('whining') || bestMatch.includes('excited')) {
        level = 'MODERATE';
        message = 'Mild vocal excitation or stress detected.';
      }

      this.latestAudio = { features, bestMatch, similarity, level, message };
      this.emitCombined();
    });

    // 2. Initialize Video Worker
    this.videoWorker = new Worker(new URL('./videoWorker.ts', import.meta.url), { type: 'module' });
    this.videoWorker.onmessage = (e) => {
      if (e.data.type === 'RESULT') {
        this.isProcessingVideo = false;
        this.latestVideo = { posture: e.data.posture, embedding: e.data.embedding };
        this.emitCombined();
      }
    };

    // 3. Start Audio
    await this.audioEngine.start().catch(console.error);

    // 4. Start Video
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } });
      this.videoElement.srcObject = this.videoStream;
      await this.videoElement.play();
      
      this.videoInterval = window.setInterval(() => this.processVideoFrame(), 1000 / 15); // Process at 15fps to save battery, UI runs at 60fps
    } catch (err) {
      console.error('Unified Video Start Error:', err);
    }
  }

  private processVideoFrame() {
    if (!this.videoElement || this.isProcessingVideo || !this.videoWorker) return;
    
    // Only capture if video is actually playing
    if (this.videoElement.readyState >= 2) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
        
        // Use createImageBitmap for zero-copy off-thread processing
        createImageBitmap(canvas).then((imageBitmap) => {
          this.isProcessingVideo = true;
          this.videoWorker?.postMessage({ imageBitmap, animalType: this.animalType }, [imageBitmap]);
        }).catch(err => {
          // ignore bitmap errors
        });
      } catch (err) {
        // ignore frame capture errors
      }
    }
  }

  private emitCombined() {
    let combinedScore = 100;
    
    // Base 100 is perfectly calm.
    // Audio penalties
    if (this.latestAudio?.level === 'HIGH') combinedScore -= 40;
    else if (this.latestAudio?.level === 'MODERATE') combinedScore -= 20;

    // Video penalties
    if (this.latestVideo?.posture.level === 'HIGH') combinedScore -= 40;
    else if (this.latestVideo?.posture.level === 'MODERATE') combinedScore -= 20;

    // Ensure within bounds
    combinedScore = Math.max(0, Math.min(100, combinedScore));

    let finalLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
    let finalMessage = `Your ${this.animalType} appears wonderfully calm and emotionally balanced.`;

    if (combinedScore <= 30) {
      finalLevel = 'HIGH';
      finalMessage = `High combined anxiety detected (Vocal & Posture). Your ${this.animalType} needs a calm environment and gentle reassurance.`;
    } else if (combinedScore <= 70) {
      finalLevel = 'MODERATE';
      finalMessage = `Mild stress or excitement detected. Monitor your ${this.animalType}'s environment closely.`;
    }

    this.onUpdate({
      audio: this.latestAudio,
      video: this.latestVideo,
      combinedScore,
      finalLevel,
      finalMessage
    });
  }

  stop() {
    if (this.audioEngine) {
      this.audioEngine.stop();
      this.audioEngine = null;
    }
    if (this.videoInterval) {
      clearInterval(this.videoInterval);
      this.videoInterval = null;
    }
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(t => t.stop());
      this.videoStream = null;
    }
    if (this.videoWorker) {
      this.videoWorker.terminate();
      this.videoWorker = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }
}
