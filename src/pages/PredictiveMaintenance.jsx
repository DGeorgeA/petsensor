import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle, TrendingUp, Maximize2, Minimize2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import GlassCard from "../components/ui/GlassCard";
import AudioWaveform from "../components/predictive/AudioWaveform";
import AudioRecorder from "../components/predictive/AudioRecorder";
import AnalysisHistory from "../components/predictive/AnalysisHistory";
import AnalysisDetails from "../components/predictive/AnalysisDetails";
import { toast } from 'sonner';

export default function PredictiveMaintenance() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [analyser, setAnalyser] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [isFullscreenECG, setIsFullscreenECG] = useState(false);

  // Fetch user's vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  // Fetch audio analyses for selected vehicle
  const { data: analyses = [], isLoading: analysesLoading, refetch: refetchAnalyses } = useQuery({
    queryKey: ['audio-analyses', selectedVehicle?.id],
    queryFn: () => selectedVehicle 
      ? base44.entities.AudioAnalysis.filter({ vehicle_id: selectedVehicle.id }, '-created_date')
      : Promise.resolve([]),
    enabled: !!selectedVehicle,
    refetchInterval: 5000,
  });

  // Auto-select first vehicle
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0]);
    }
  }, [vehicles]);

  // Calculate stats from analyses
  const stats = React.useMemo(() => {
    const total = analyses.length;
    const flagged = analyses.filter(a => a.status === 'flagged').length;
    const avgConfidence = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + (a.confidence_score || 0), 0) / analyses.length
      : 0;
    
    const recentAnalysis = analyses[0];
    const overallHealth = recentAnalysis?.analysis_result?.overall_health || 'unknown';

    return { total, flagged, avgConfidence, overallHealth };
  }, [analyses]);

  const handleRecordingComplete = () => {
    setTimeout(() => {
      refetchAnalyses();
    }, 1000);
  };

  const handleAnomalyDetected = (anomaly) => {
    toast.warning(`${anomaly.severity.toUpperCase()} anomaly detected!`, {
      description: anomaly.type,
      duration: 5000,
    });
  };

  return (
    <div className="min-h-screen py-6 md:py-12 px-2 md:px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - Hidden on mobile when fullscreen ECG */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center mb-4 md:mb-8 ${isFullscreenECG ? 'hidden md:block' : ''}`}
        >
          <div className="inline-flex items-center gap-2 backdrop-blur-md bg-yellow-300/10 border border-yellow-300/30 rounded-full px-3 md:px-4 py-1.5 md:py-2 mb-3 md:mb-6">
            <Activity className="w-3 h-3 md:w-4 md:h-4 text-yellow-300" />
            <span className="text-yellow-300 text-xs md:text-sm font-medium">AI-Powered Diagnostics</span>
          </div>
          <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold mb-2 md:mb-4">
            <span className="bg-gradient-to-r from-white to-yellow-300 bg-clip-text text-transparent">
              Predictive Maintenance
            </span>
          </h1>
          <p className="text-sm md:text-xl text-gray-400 max-w-3xl mx-auto px-4">
            Listen to your engine's heartbeat. Real-time ECG-style audio analysis detects issues before they happen.
          </p>
        </motion.div>

        {/* Vehicle Selector - Hidden on mobile when fullscreen ECG */}
        {vehicles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`mb-3 md:mb-6 ${isFullscreenECG ? 'hidden md:block' : ''}`}
          >
            <GlassCard className="p-3 md:p-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
                <div className="w-full md:w-auto">
                  <p className="text-xs md:text-sm text-gray-400 mb-2">Selected Vehicle</p>
                  <div className="flex gap-2 md:gap-3 overflow-x-auto w-full">
                    {vehicles.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        onClick={() => setSelectedVehicle(vehicle)}
                        className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-all whitespace-nowrap text-sm ${
                          selectedVehicle?.id === vehicle.id
                            ? "bg-yellow-300/20 text-yellow-300 border border-yellow-300/30"
                            : "bg-white/5 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        {vehicle.make} {vehicle.model}
                      </button>
                    ))}
                  </div>
                </div>
                {selectedVehicle && (
                  <div className="text-right w-full md:w-auto">
                    <p className="text-xs md:text-sm text-gray-400">VIN</p>
                    <p className="text-white font-mono text-xs md:text-sm">{selectedVehicle.vin}</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Status Overview Cards - Hidden on mobile when fullscreen ECG */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-3 md:mb-6 ${isFullscreenECG ? 'hidden md:grid' : ''}`}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <GlassCard className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <div className={`rounded-lg md:rounded-xl p-1.5 md:p-2 ${
                  stats.overallHealth === 'healthy' 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-yellow-500/20 border border-yellow-500/30'
                }`}>
                  {stats.overallHealth === 'healthy' ? (
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                  )}
                </div>
              </div>
              <h3 className="text-base md:text-xl font-bold text-white mb-0.5 md:mb-1 capitalize">{stats.overallHealth}</h3>
              <p className="text-gray-400 text-[10px] md:text-xs">Engine Status</p>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <GlassCard className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg md:rounded-xl p-1.5 md:p-2">
                  <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                </div>
              </div>
              <h3 className="text-base md:text-xl font-bold text-white mb-0.5 md:mb-1">{stats.flagged}</h3>
              <p className="text-gray-400 text-[10px] md:text-xs">Anomalies</p>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <GlassCard className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg md:rounded-xl p-1.5 md:p-2">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                </div>
              </div>
              <h3 className="text-base md:text-xl font-bold text-white mb-0.5 md:mb-1">{stats.avgConfidence.toFixed(1)}%</h3>
              <p className="text-gray-400 text-[10px] md:text-xs">Accuracy</p>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <GlassCard className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg md:rounded-xl p-1.5 md:p-2">
                  <Activity className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                </div>
              </div>
              <h3 className="text-base md:text-xl font-bold text-white mb-0.5 md:mb-1">{stats.total}</h3>
              <p className="text-gray-400 text-[10px] md:text-xs">Analyses</p>
            </GlassCard>
          </motion.div>
        </div>

        {/* MAIN LAYOUT: Mobile Fullscreen ECG, Desktop 40/60 Split */}
        <div className={`grid ${isFullscreenECG ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-5'} gap-3 md:gap-6`}>
          {/* Live Audio Monitor - Fullscreen on Mobile */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className={`${isFullscreenECG ? 'col-span-1' : 'lg:col-span-2'}`}
          >
            <GlassCard className={`p-3 md:p-6 ${isFullscreenECG ? 'min-h-screen' : 'h-full'}`}>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 md:w-5 md:h-5 text-yellow-300" />
                  <span className="hidden md:inline">Live ECG Monitor</span>
                  <span className="md:hidden">ECG Monitor</span>
                </h2>
                <div className="flex items-center gap-2">
                  {isRecording && (
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-400 rounded-full animate-pulse" />
                      <span className="text-[10px] md:text-xs text-red-400 font-medium">REC</span>
                    </div>
                  )}
                  <button
                    onClick={() => setIsFullscreenECG(!isFullscreenECG)}
                    className="md:hidden p-1.5 rounded-lg bg-yellow-300/10 hover:bg-yellow-300/20 transition-colors"
                  >
                    {isFullscreenECG ? (
                      <Minimize2 className="w-4 h-4 text-yellow-300" />
                    ) : (
                      <Maximize2 className="w-4 h-4 text-yellow-300" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* ECG-Style Waveform - Larger on Mobile Fullscreen */}
              <div 
                className={`bg-zinc-950/50 rounded-xl p-2 md:p-3 border border-yellow-300/10 mb-3 md:mb-4 ${
                  isFullscreenECG ? 'min-h-[70vh]' : 'min-h-[300px] md:min-h-[400px]'
                }`}
              >
                <AudioWaveform
                  audioContext={audioContext}
                  analyser={analyser}
                  isRecording={isRecording}
                  anomalies={selectedAnalysis?.anomalies_detected || []}
                  duration={selectedAnalysis?.duration_seconds || 0}
                  onAnomalyDetected={handleAnomalyDetected}
                />
              </div>

              {/* Audio Recorder Controls */}
              {selectedVehicle && (
                <AudioRecorder
                  vehicleId={selectedVehicle.id}
                  onRecordingComplete={handleRecordingComplete}
                />
              )}

              {/* ECG Info */}
              <div className="mt-3 md:mt-4 p-2 md:p-3 bg-yellow-300/5 border border-yellow-300/10 rounded-lg">
                <p className="text-[10px] md:text-xs text-gray-400 leading-relaxed">
                  <span className="font-semibold text-yellow-300">Real-time Engine Heartbeat:</span> Watch live acoustic patterns as your engine runs. Anomalies trigger audio alerts instantly.
                </p>
              </div>
            </GlassCard>
          </motion.div>

          {/* Analysis History - Hidden on mobile when ECG is fullscreen */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className={`${isFullscreenECG ? 'hidden' : 'lg:col-span-3'}`}
          >
            <GlassCard className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Analysis History</h2>
              
              <AnalysisHistory
                analyses={analyses}
                isLoading={analysesLoading}
                onSelectAnalysis={setSelectedAnalysis}
              />
            </GlassCard>
          </motion.div>
        </div>

        {/* Analysis Details Modal */}
        <AnimatePresence>
          {selectedAnalysis && (
            <AnalysisDetails
              analysis={selectedAnalysis}
              onClose={() => setSelectedAnalysis(null)}
            />
          )}
        </AnimatePresence>

        {/* How It Works - Hidden on mobile when fullscreen ECG */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className={`mt-6 md:mt-12 ${isFullscreenECG ? 'hidden md:block' : ''}`}
        >
          <GlassCard className="p-4 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">How Real-Time ECG Monitoring Works</h3>
            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              <div>
                <div className="text-yellow-300 font-bold text-base md:text-lg mb-2">1. Listen</div>
                <p className="text-gray-400 text-xs md:text-sm">
                  Real-time audio capture with live ECG-style waveform. Watch your engine's "heartbeat" as it runs.
                </p>
              </div>
              <div>
                <div className="text-yellow-300 font-bold text-base md:text-lg mb-2">2. Analyze</div>
                <p className="text-gray-400 text-xs md:text-sm">
                  AI analyzes frequency patterns instantly, detecting anomalies in real-time with audio alerts.
                </p>
              </div>
              <div>
                <div className="text-yellow-300 font-bold text-base md:text-lg mb-2">3. Prevent</div>
                <p className="text-gray-400 text-xs md:text-sm">
                  Get immediate warnings for critical issues. Review detailed reports when you exit the vehicle.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}