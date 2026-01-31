import React, { useState, useRef } from "react";
import { Mic, Square, Upload, Loader2, Clock } from "lucide-react";
import GlassButton from "../ui/GlassButton";
import { toast } from "sonner";
import { speak, SCRIPTS } from "@/utils/voice";

export default function AudioRecorder({
  onRecordingComplete,
  vehicleId,
  isAnalyzing = false,
  language = 'en-US'
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const [remainingTime, setRemainingTime] = useState(120); // 2 minutes target

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      streamRef.current = stream;

      // Set up Web Audio API for visualization
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 2048;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyserNode);

      setAudioContext(audioCtx);
      setAnalyser(analyserNode);

      // Set up MediaRecorder for saving audio
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await handleAudioUpload(blob);

        // Clean up
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setRemainingTime(120);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
        setRemainingTime((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            // Auto stop at 0
            stopRecording();
            return 0;
          }
          return next;
        });
      }, 1000);

      toast.success("Recording started - recommended: 2 minutes");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (audioContext) {
        audioContext.close();
      }

      toast.info("Processing audio...");
    }
  };

  const handleAudioUpload = async (blob) => {
    try {
      // Create MOCK analysis record
      const mockId = `analysis-mock-${Date.now()}`;

      const analysis = {
        id: mockId,
        vehicle_id: vehicleId,
        audio_file_url: URL.createObjectURL(blob), // Local object URL
        duration_seconds: recordingTime,
        status: "pending",
        created_date: new Date().toISOString()
      };

      // Simulate analysis (in production, this would be a real ML model)
      setTimeout(async () => {
        await performMockAnalysis(analysis);
      }, 2000);

      toast.success("Audio captured successfully");
    } catch (error) {
      console.error("Error processing audio:", error);
      toast.error("Failed to process audio");
    }
  };

  const performMockAnalysis = async (analysisData) => {
    // Mock analysis - simulate anomaly detection
    const mockAnomalies = [];
    // 50% chance of detecting something
    const shouldDetectAnomaly = Math.random() > 0.5;

    if (shouldDetectAnomaly) {
      const severities = ["low", "medium", "high", "critical"];
      const types = [
        "Belt tension variation",
        "Valve timing offset",
        "Exhaust resonance",
        "Bearing noise",
        "Engine knock",
        "Misfire detected",
        "Timing chain rattle",
      ];

      const numAnomalies = Math.floor(Math.random() * 2) + 1;

      for (let i = 0; i < numAnomalies; i++) {
        const severity = severities[Math.floor(Math.random() * severities.length)];
        mockAnomalies.push({
          type: types[Math.floor(Math.random() * types.length)],
          severity: severity,
          timestamp: Math.random() * recordingTime,
          description: `Detected unusual acoustic pattern in engine sound`,
          frequency_range: `${Math.floor(Math.random() * 5 + 1)}-${Math.floor(Math.random() * 5 + 6)}kHz`,
        });
      }
    }

    const overallHealth = mockAnomalies.length === 0
      ? "healthy"
      : mockAnomalies.some(a => a.severity === "high" || a.severity === "critical")
        ? "critical"
        : "warning";

    const confidenceScore = Math.random() * 15 + 85; // 85-100%

    // Construct the completed analysis object
    const completedAnalysis = {
      ...analysisData,
      status: mockAnomalies.length > 0 ? "flagged" : "completed",
      confidence_score: confidenceScore,
      anomalies_detected: mockAnomalies,
      analysis_result: {
        overall_health: overallHealth,
        confidence_score: confidenceScore,
        frequency_analysis: {
          low_freq: Math.random() > 0.7 ? "elevated" : "normal",
          mid_freq: Math.random() > 0.8 ? "spike" : "normal",
          high_freq: Math.random() > 0.9 ? "abnormal" : "normal",
        },
        detected_patterns: mockAnomalies.length > 0
          ? mockAnomalies.map(a => a.type)
          : ["smooth_idle", "consistent_rpm"],
      },
      processed_at: new Date().toISOString(),
      notes: mockAnomalies.length > 0
        ? "Anomalies detected - recommend professional inspection"
        : "Engine operating within normal parameters",
    };

    if (onRecordingComplete) {
      onRecordingComplete(completedAnalysis);
    }

    // Voice Feedback
    const script = SCRIPTS[language] || SCRIPTS['en-US'];
    if (mockAnomalies.length > 0) {
      const primaryAnomaly = mockAnomalies[0].type;
      speak(script.anomaly(primaryAnomaly), language);
    } else {
      speak(script.safe(), language);
    }

    toast.success("Analysis complete!");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <div className="flex flex-col">
                <span className="text-white font-mono text-lg">
                  {formatTime(recordingTime)}
                </span>
                <span className="text-xs text-gray-500">
                  / 2:00
                </span>
              </div>
            </div>
          )}
          {!isRecording && recordingTime > 0 && (
            <span className="text-gray-400 text-sm">Last run: {formatTime(recordingTime)}</span>
          )}
        </div>

        <div className="flex gap-3">
          {!isRecording ? (
            <GlassButton
              onClick={startRecording}
              disabled={isAnalyzing}
              icon={Mic}
            >
              Start Recording
            </GlassButton>
          ) : (
            <GlassButton
              onClick={stopRecording}
              variant="secondary"
              icon={Square}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              Stop Recording
            </GlassButton>
          )}
        </div>
      </div>

      {/* Pass analyser to parent for waveform visualization */}
      {isRecording && analyser && (
        <div className="hidden" data-analyser={analyser} />
      )}
    </div>
  );
}
