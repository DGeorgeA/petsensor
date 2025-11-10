import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Download, Maximize2, Minimize2, Target, Sparkles } from "lucide-react";
import { toast } from "sonner";
import GlassCard from "../ui/GlassCard";
import GlassButton from "../ui/GlassButton";

export default function ARStudioModal({ overlay, onClose, shopName }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [overlayPosition, setOverlayPosition] = useState({ x: 0.5, y: 0.5 }); // Normalized 0-1
  const [overlayScale, setOverlayScale] = useState(1.0);
  const [overlayRotation, setOverlayRotation] = useState(0);
  const [overlayOpacity, setOverlayOpacity] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [carDetected, setCarDetected] = useState(false);
  const [detectionBox, setDetectionBox] = useState(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const overlayImageRef = useRef(null);

  useEffect(() => {
    startCamera();
    loadOverlayImage();
    return () => stopCamera();
  }, []);

  const loadOverlayImage = () => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      overlayImageRef.current = img;
    };
    img.onerror = () => {
      toast.error("Failed to load overlay image");
    };
    img.src = overlay.image_url;
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment' // Prefer rear camera on mobile
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
        simulateCarDetection();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  // Simulate car detection (in production, use TensorFlow.js Object Detection)
  const simulateCarDetection = () => {
    setTimeout(() => {
      setCarDetected(true);
      // Mock detection box (centered, 60% of frame)
      setDetectionBox({
        x: 0.2,
        y: 0.25,
        width: 0.6,
        height: 0.5
      });
      toast.success("Vehicle detected! Overlay locked to car surface.");
    }, 2000);
  };

  useEffect(() => {
    if (!isStreaming || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    const drawFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Draw car detection box
        if (carDetected && detectionBox) {
          ctx.strokeStyle = '#22C55E';
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 5]);
          const box = {
            x: detectionBox.x * canvas.width,
            y: detectionBox.y * canvas.height,
            width: detectionBox.width * canvas.width,
            height: detectionBox.height * canvas.height
          };
          ctx.strokeRect(box.x, box.y, box.width, box.height);
          ctx.setLineDash([]);
          
          // Detection label
          ctx.fillStyle = '#22C55E';
          ctx.fillRect(box.x, box.y - 25, 150, 25);
          ctx.fillStyle = '#000';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText('Vehicle Detected', box.x + 5, box.y - 8);
        }

        // Draw overlay on detected car surface
        if (overlayImageRef.current && carDetected && detectionBox) {
          ctx.save();
          
          // Calculate position relative to car
          const carX = detectionBox.x * canvas.width;
          const carY = detectionBox.y * canvas.height;
          const carWidth = detectionBox.width * canvas.width;
          const carHeight = detectionBox.height * canvas.height;
          
          // Overlay position (normalized to car coordinates)
          const x = carX + (overlayPosition.x * carWidth);
          const y = carY + (overlayPosition.y * carHeight);
          
          ctx.translate(x, y);
          ctx.rotate((overlayRotation * Math.PI) / 180);
          ctx.scale(overlayScale, overlayScale);
          
          const overlayWidth = overlayImageRef.current.width;
          const overlayHeight = overlayImageRef.current.height;
          
          ctx.globalAlpha = overlayOpacity;
          ctx.drawImage(
            overlayImageRef.current,
            -overlayWidth / 2,
            -overlayHeight / 2,
            overlayWidth,
            overlayHeight
          );
          
          ctx.restore();
          
          // Draw control handles
          ctx.strokeStyle = '#FCD34D';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(
            x - (overlayWidth * overlayScale) / 2,
            y - (overlayHeight * overlayScale) / 2,
            overlayWidth * overlayScale,
            overlayHeight * overlayScale
          );
          ctx.setLineDash([]);
          
          // Corner handles
          const handleSize = 12;
          ctx.fillStyle = '#FCD34D';
          const corners = [
            { dx: -1, dy: -1 },
            { dx: 1, dy: -1 },
            { dx: -1, dy: 1 },
            { dx: 1, dy: 1 }
          ];
          corners.forEach(({ dx, dy }) => {
            ctx.fillRect(
              x + dx * (overlayWidth * overlayScale) / 2 - handleSize / 2,
              y + dy * (overlayHeight * overlayScale) / 2 - handleSize / 2,
              handleSize,
              handleSize
            );
          });
        }

        // Crosshair in center
        if (!carDetected) {
          ctx.strokeStyle = '#FCD34D';
          ctx.lineWidth = 2;
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const size = 30;
          ctx.beginPath();
          ctx.moveTo(centerX - size, centerY);
          ctx.lineTo(centerX + size, centerY);
          ctx.moveTo(centerX, centerY - size);
          ctx.lineTo(centerX, centerY + size);
          ctx.stroke();
          
          ctx.fillStyle = '#FCD34D';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Point camera at vehicle...', centerX, centerY + 50);
        }
      }
      requestAnimationFrame(drawFrame);
    };

    drawFrame();
  }, [isStreaming, overlayPosition, overlayScale, overlayRotation, overlayOpacity, carDetected, detectionBox]);

  const handleMouseDown = (e) => {
    if (!carDetected) return;
    setIsDragging(true);
    const rect = canvasRef.current.getBoundingClientRect();
    dragStartPos.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !carDetected) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Constrain to car detection box
    const constrainedX = Math.max(0, Math.min(1, x - 0.2) / 0.6);
    const constrainedY = Math.max(0, Math.min(1, y - 0.25) / 0.5);
    
    setOverlayPosition({ x: constrainedX, y: constrainedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const captureScreenshot = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vroomie-ar-${overlay.overlay_name}-${Date.now()}.png`;
      a.click();
      toast.success('Screenshot saved!');
    });
  };

  const toggleFullscreen = () => {
    const container = document.getElementById('ar-studio-modal');
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  return (
    <motion.div
      id="ar-studio-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-green-400" />
                AR Preview Studio
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {overlay.overlay_name} by {shopName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* AR Canvas */}
          <div className="relative bg-black rounded-xl overflow-hidden mb-4" style={{ height: '60vh' }}>
            <video
              ref={videoRef}
              className="hidden"
              autoPlay
              playsInline
              muted
            />
            
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-full object-contain cursor-crosshair"
            />

            {/* Detection Status */}
            {!carDetected && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2">
                <div className="backdrop-blur-md bg-yellow-300/10 border border-yellow-300/30 rounded-lg px-4 py-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-yellow-300 animate-pulse" />
                  <span className="text-sm text-yellow-300 font-medium">
                    Detecting vehicle...
                  </span>
                </div>
              </div>
            )}

            {/* Camera Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={captureScreenshot}
                className="backdrop-blur-md bg-white/10 border border-yellow-300/30 rounded-full p-3 hover:bg-white/20 transition-colors"
              >
                <Camera className="w-6 h-6 text-yellow-300" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleFullscreen}
                className="backdrop-blur-md bg-white/10 border border-yellow-300/30 rounded-full p-3 hover:bg-white/20 transition-colors"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-6 h-6 text-yellow-300" />
                ) : (
                  <Maximize2 className="w-6 h-6 text-yellow-300" />
                )}
              </motion.button>
            </div>

            {/* Instructions */}
            {carDetected && (
              <div className="absolute top-4 right-4">
                <div className="backdrop-blur-md bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2">
                  <p className="text-xs text-green-400 font-medium">
                    ✓ Locked to vehicle • Drag to reposition
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Transform Controls */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Scale</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={overlayScale}
                onChange={(e) => setOverlayScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-300"
              />
              <span className="text-xs text-yellow-300">{(overlayScale * 100).toFixed(0)}%</span>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Rotation</label>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={overlayRotation}
                onChange={(e) => setOverlayRotation(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-300"
              />
              <span className="text-xs text-yellow-300">{overlayRotation}°</span>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Opacity</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-300"
              />
              <span className="text-xs text-yellow-300">{(overlayOpacity * 100).toFixed(0)}%</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <GlassButton onClick={onClose} variant="secondary" className="flex-1">
              Close Preview
            </GlassButton>
            <GlassButton onClick={captureScreenshot} icon={Download} className="flex-1">
              Save Screenshot
            </GlassButton>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}