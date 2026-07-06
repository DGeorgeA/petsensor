/**
 * src/lib/audioPipeline.ts
 *
 * Production PetAudioEngine using AudioWorklet for zero-latency DSP.
 *
 * Architecture:
 *   MIC → AudioContext (16kHz) → AudioWorkletNode → ring buffer
 *   → Web Worker (fingerprint engine) → callback with EmotionResult
 *
 * Graceful degradation:
 *   AudioWorklet not available → ScriptProcessorNode fallback
 *   Camera denied → audio-only mode
 *
 * Performance:
 *   - AudioWorklet runs in dedicated audio thread (never blocks UI)
 *   - Web Worker runs fingerprinting off React thread
 *   - AudioContext pre-warmed on first user interaction
 */

import type { AnimalType } from './petEmotionLibrary';
import type { ScreeningCategory } from './screening';

// ── Public result type ────────────────────────────────────────────────────────
export interface EmotionResult {
  key: string;
  label: string;
  emotionalMessage: string;
  level: 'LOW' | 'MODERATE' | 'HIGH';
  category: ScreeningCategory;
  anxietyScore: number;       // 0–100
  similarity: number;         // 0–1
  features: {
    rms: number;
    zcr: number;
    spectralCentroid: number;
    spectralRolloff: number;
    spectralFlux: number;
    spectralFlatness: number;
    f0Estimate: number;
    subBandEnergy: number[];
    mfcc: number[];
    chroma: number[];
  };
  embedding: number[];
}

export type PipelineStatus =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'accumulating'
  | 'detected'
  | 'insufficient'
  | 'unsupported'
  | 'error';

/** Why no confirmed match this frame — surfaced to the screening fusion layer. */
export type NoDetectionKind = 'insufficient' | 'unsupported';

/** Per-frame gate trace for dev diagnostics (mirrors ClassifierDiag). */
export interface AudioDiag {
  rms: number;
  top1Key: string;
  top1Score: number;
  top2Key: string;
  top2Score: number;
  margin: number;
  stage: string;
  reason?: string;
}

export interface PipelineCallback {
  onStatus: (status: PipelineStatus) => void;
  onFeatureUpdate: (rms: number, zcr: number, spectralCentroid: number) => void;
  onDetection: (result: EmotionResult) => void;
  onNoDetection: (kind: NoDetectionKind) => void;
  /** Optional: dev-only per-frame gate trace. */
  onDiag?: (diag: AudioDiag) => void;
}

// ── AudioWorklet processor inline code ───────────────────────────────────────
// Injected as a Blob URL to avoid separate file transpilation complexity
const WORKLET_CODE = `
class PetSensingProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this._buffer = new Float32Array(2048);
    this._writePos = 0;
    this._hopSize = 1024;
    this._frameSize = 2048;
    this._samplesSinceLastHop = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    
    const channel = input[0];
    
    for (let i = 0; i < channel.length; i++) {
      this._buffer[this._writePos % this._frameSize] = channel[i];
      this._writePos++;
      this._samplesSinceLastHop++;
      
      // Emit a frame every hopSize samples (50% overlap)
      if (this._samplesSinceLastHop >= this._hopSize) {
        this._samplesSinceLastHop = 0;
        
        // Build ordered frame starting from oldest sample
        const frame = new Float32Array(this._frameSize);
        const startIdx = this._writePos % this._frameSize;
        for (let j = 0; j < this._frameSize; j++) {
          frame[j] = this._buffer[(startIdx + j) % this._frameSize];
        }
        
        this.port.postMessage({ frame }, [frame.buffer]);
      }
    }
    
    return true; // Keep processor alive
  }
}

registerProcessor('pet-sensing-processor', PetSensingProcessor);
`;

// ── Noise gate: adaptive gain normalization ──────────────────────────────────
function applySpectralGating(pcm: Float32Array, noiseFloor: number): Float32Array {
  const gated = new Float32Array(pcm.length);
  const threshold = noiseFloor * 2.5; // 8dB above noise floor
  for (let i = 0; i < pcm.length; i++) {
    const abs = Math.abs(pcm[i]);
    gated[i] = abs > threshold ? pcm[i] : pcm[i] * (abs / (threshold + 1e-8));
  }
  return gated;
}

// ── Main engine ───────────────────────────────────────────────────────────────
export class PetAudioEngine {
  private audioCtx: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private scriptProcessorNode: ScriptProcessorNode | null = null; // fallback
  private analyserNode: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private worker: Worker | null = null;
  private isWorkerBusy = false;
  private noiseFloorEstimate = 0.012;
  private noiseFloorSamples: number[] = [];
  private animalType: AnimalType;
  private cb: PipelineCallback;
  private useWorklet = false;
  private status: PipelineStatus = 'idle';
  private rafId: number | null = null;

  constructor(animalType: AnimalType, cb: PipelineCallback) {
    this.animalType = animalType;
    this.cb = cb;
  }

  // ── Start the pipeline ─────────────────────────────────────────────────────
  async start(): Promise<void> {
    this.setStatus('starting');

    try {
      // 1. Request microphone at 16kHz
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: { ideal: 16000 },
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false, // we do our own AGC
        },
      });

      // 2. Create AudioContext
      this.audioCtx = new AudioContext({ sampleRate: 16000 });
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      // 3. Create source
      this.sourceNode = this.audioCtx.createMediaStreamSource(this.stream);

      // 4. Analyser for live waveform display (separate from DSP)
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 1024;
      this.analyserNode.smoothingTimeConstant = 0.75;

      // 5. High-pass filter (remove sub-20Hz rumble)
      const hpf = this.audioCtx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 20;
      hpf.Q.value = 0.5;

      this.sourceNode.connect(hpf);
      hpf.connect(this.analyserNode);

      // 6. Init Web Worker
      this.worker = new Worker(new URL('./audioWorker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (e) => this.handleWorkerMessage(e);

      // 7. Try AudioWorklet (preferred)
      try {
        const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        await this.audioCtx.audioWorklet.addModule(url);
        URL.revokeObjectURL(url);

        this.workletNode = new AudioWorkletNode(this.audioCtx, 'pet-sensing-processor');
        this.workletNode.port.onmessage = (e) => {
          const { frame } = e.data as { frame: Float32Array };
          this.processFrame(frame);
        };

        hpf.connect(this.workletNode);
        this.workletNode.connect(this.audioCtx.destination); // needed for audio graph
        this.useWorklet = true;
      } catch {
        // Fallback: ScriptProcessorNode
        console.warn('[PetAudio] AudioWorklet unavailable, using ScriptProcessorNode fallback');
        this.scriptProcessorNode = this.audioCtx.createScriptProcessor(2048, 1, 1);
        this.scriptProcessorNode.onaudioprocess = (e) => {
          const pcmInput = e.inputBuffer.getChannelData(0);
          this.processFrame(new Float32Array(pcmInput));
        };
        hpf.connect(this.scriptProcessorNode);
        this.scriptProcessorNode.connect(this.audioCtx.destination);
        this.useWorklet = false;
      }

      // 8. Start waveform RAF loop for live RMS display
      this.startVisualizationLoop();

      // 9. Calibrate noise floor (first 500ms of silence)
      this.calibrateNoiseFloor();

      this.setStatus('listening');
    } catch (err) {
      console.error('[PetAudio] Start error:', err);
      this.setStatus('error');
      throw err;
    }
  }

  // ── Noise floor calibration (first 20 frames) ──────────────────────────────
  private calibrateNoiseFloor() {
    // Auto-calibrate over first 20 frames
    this.noiseFloorSamples = [];
  }

  private updateNoiseFloor(rms: number) {
    if (this.noiseFloorSamples.length < 20) {
      this.noiseFloorSamples.push(rms);
      if (this.noiseFloorSamples.length === 20) {
        const sorted = [...this.noiseFloorSamples].sort((a, b) => a - b);
        // Use 10th percentile as noise floor estimate
        this.noiseFloorEstimate = Math.max(0.008, sorted[2]);
      }
    }
  }

  // ── Process each audio frame ───────────────────────────────────────────────
  private processFrame(pcm: Float32Array) {
    if (this.isWorkerBusy || !this.worker) return;

    // Quick RMS check for waveform
    let sumSq = 0;
    for (let i = 0; i < pcm.length; i++) sumSq += pcm[i] * pcm[i];
    const rms = Math.sqrt(sumSq / pcm.length);
    this.updateNoiseFloor(rms);

    // Spectral gating
    const gated = applySpectralGating(pcm, this.noiseFloorEstimate);

    // Send to worker (transferable for zero-copy)
    const copy = gated.buffer.slice(0) as ArrayBuffer;
    this.isWorkerBusy = true;
    this.worker.postMessage(
      { pcm: new Float32Array(copy), animalType: this.animalType },
      [copy],
    );
  }

  // ── Worker message handler ─────────────────────────────────────────────────
  private handleWorkerMessage(e: MessageEvent) {
    this.isWorkerBusy = false;
    const data = e.data;

    // Forward the classifier's gate trace to dev tooling (never user-facing).
    if (data?.diag && this.cb.onDiag) {
      this.cb.onDiag({ ...data.diag, reason: data.reason });
    }

    switch (data.type) {
      case 'DETECTION':
        this.setStatus('detected');
        this.cb.onDetection({
          key: data.key,
          label: data.label,
          emotionalMessage: data.emotionalMessage,
          level: data.level,
          category: data.category,
          anxietyScore: data.anxietyScore,
          similarity: data.similarity,
          features: data.features,
          embedding: data.embedding,
        });
        // Feed live feature display
        this.cb.onFeatureUpdate(
          data.features.rms,
          data.features.zcr,
          data.features.spectralCentroid,
        );
        break;

      case 'ACCUMULATING':
        this.setStatus('accumulating');
        if (data.features) {
          this.cb.onFeatureUpdate(
            data.features.rms,
            data.features.zcr,
            data.features.spectralCentroid,
          );
        }
        break;

      case 'INSUFFICIENT':
      case 'UNSUPPORTED': {
        const kind: NoDetectionKind = data.type === 'UNSUPPORTED' ? 'unsupported' : 'insufficient';
        this.setStatus(kind);
        if (data.features) {
          this.cb.onFeatureUpdate(
            data.features.rms,
            data.features.zcr,
            data.features.spectralCentroid,
          );
        }
        this.cb.onNoDetection(kind);
        break;
      }

      case 'ERROR':
        console.error('[AudioWorker]', data.error);
        break;
    }
  }

  // ── Visualization loop (60fps, lightweight) ────────────────────────────────
  private startVisualizationLoop() {
    if (!this.analyserNode) return;
    const bufLen = this.analyserNode.frequencyBinCount;
    const timeBuf = new Float32Array(bufLen);

    const loop = () => {
      if (!this.analyserNode) return;
      this.analyserNode.getFloatTimeDomainData(timeBuf);
      let sumSq = 0;
      for (let i = 0; i < bufLen; i++) sumSq += timeBuf[i] * timeBuf[i];
      const rms = Math.sqrt(sumSq / bufLen);

      // ZCR from time domain
      let zcr = 0;
      for (let i = 1; i < bufLen; i++) {
        if ((timeBuf[i - 1] >= 0) !== (timeBuf[i] >= 0)) zcr++;
      }

      // Centroid from freq domain (lightweight for display)
      const freqBuf = new Uint8Array(bufLen);
      this.analyserNode.getByteFrequencyData(freqBuf);
      let wNum = 0, wDen = 0;
      for (let k = 0; k < bufLen; k++) {
        wNum += k * freqBuf[k];
        wDen += freqBuf[k];
      }
      const centroid = wDen > 0 ? wNum / wDen / bufLen : 0;

      this.cb.onFeatureUpdate(rms, zcr, centroid);
      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  // ── Stop the pipeline ──────────────────────────────────────────────────────
  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.scriptProcessorNode) {
      this.scriptProcessorNode.disconnect();
      this.scriptProcessorNode = null;
    }
    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.isWorkerBusy = false;
    this.setStatus('idle');
  }

  private setStatus(s: PipelineStatus) {
    this.status = s;
    this.cb.onStatus(s);
  }

  getStatus() { return this.status; }
}
