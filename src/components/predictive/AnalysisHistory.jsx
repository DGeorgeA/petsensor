import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle, Clock, ExternalLink } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalysisHistory({ 
  analyses = [], 
  isLoading = false,
  onSelectAnalysis 
}) {
  const getSeverityColor = (severity) => {
    const colors = {
      low: "bg-green-500/20 text-green-400 border-green-500/30",
      medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      critical: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return colors[severity] || colors.low;
  };

  const getHealthIcon = (health) => {
    if (health === "healthy") {
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
    return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <GlassCard key={i} className="p-4">
            <Skeleton className="h-16 w-full bg-zinc-800" />
          </GlassCard>
        ))}
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
        <p className="text-gray-400">No analyses yet</p>
        <p className="text-gray-500 text-sm mt-1">
          Start recording to see engine health reports
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      {analyses.map((analysis, index) => (
        <motion.div
          key={analysis.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <GlassCard 
            className="p-4 cursor-pointer"
            hover
            onClick={() => onSelectAnalysis && onSelectAnalysis(analysis)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {getHealthIcon(analysis.analysis_result?.overall_health)}
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        analysis.status === "flagged"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : analysis.status === "completed"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      }`}
                    >
                      {analysis.status.toUpperCase()}
                    </span>
                    {analysis.confidence_score && (
                      <span className="text-xs text-gray-400">
                        {analysis.confidence_score.toFixed(1)}% confidence
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {analysis.processed_at
                      ? format(new Date(analysis.processed_at), "MMM d, yyyy 'at' h:mm a")
                      : format(new Date(analysis.created_date), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              {analysis.audio_file_url && (
                <a
                  href={analysis.audio_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Anomalies */}
            {analysis.anomalies_detected && analysis.anomalies_detected.length > 0 && (
              <div className="space-y-2">
                {analysis.anomalies_detected.slice(0, 2).map((anomaly, i) => (
                  <div
                    key={i}
                    className="backdrop-blur-md bg-white/5 border border-yellow-300/10 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-medium text-white">
                        {anomaly.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getSeverityColor(
                          anomaly.severity
                        )}`}
                      >
                        {anomaly.severity?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{anomaly.description}</p>
                    {anomaly.frequency_range && (
                      <p className="text-xs text-gray-500 mt-1">
                        Frequency: {anomaly.frequency_range}
                      </p>
                    )}
                  </div>
                ))}
                {analysis.anomalies_detected.length > 2 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{analysis.anomalies_detected.length - 2} more anomalies
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            {analysis.notes && (
              <div className="mt-3 text-sm text-gray-400 italic">
                {analysis.notes}
              </div>
            )}
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}