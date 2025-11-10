import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Download, Maximize2, Minimize2 } from "lucide-react";
import GlassButton from "../ui/GlassButton";
import { toast } from "sonner";

export default function ARCanvas({ appliedOverlays = [], onOverlayUpdate }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedOverlay, setSelectedOverlay] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
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

  useEffect(() => {
    if (!isStreaming || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    const drawFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Draw overlays
        appliedOverlays.forEach(overlay => {
          if (!overlay.image) return;

          ctx.save();

          // Calculate position (centered by default)
          const x = overlay.x || canvas.width / 2;
          const y = overlay.y || canvas.height / 2;
          
          // Apply transformations
          ctx.translate(x, y);
          ctx.rotate((overlay.rotation || 0) * Math.PI / 180);
          ctx.scale(overlay.scale || 1, overlay.scale || 1);

          // Draw overlay image
          const width = overlay.image.width * (overlay.scale || 1);
          const height = overlay.image.height * (overlay.scale || 1);
          
          ctx.globalAlpha = overlay.opacity || 1;
          ctx.drawImage(overlay.image, -width / 2, -height / 2, width, height);

          // Draw selection border if selected
          if (selectedOverlay?.id === overlay.id) {
            ctx.strokeStyle = '#FCD34D';
            ctx.lineWidth = 3;
            ctx.strokeRect(-width / 2, -height / 2, width, height);
            
            // Draw corner handles
            const handleSize = 10;
            ctx.fillStyle = '#FCD34D';
            ctx.fillRect(-width / 2 - handleSize / 2, -height / 2 - handleSize / 2, handleSize, handleSize);
            ctx.fillRect(width / 2 - handleSize / 2, -height / 2 - handleSize / 2, handleSize, handleSize);
            ctx.fillRect(-width / 2 - handleSize / 2, height / 2 - handleSize / 2, handleSize, handleSize);
            ctx.fillRect(width / 2 - handleSize / 2, height / 2 - handleSize / 2, handleSize, handleSize);
          }

          ctx.restore();
        });
      }
      requestAnimationFrame(drawFrame);
    };

    drawFrame();
  }, [isStreaming, appliedOverlays, selectedOverlay]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if click is on an overlay
    for (let i = appliedOverlays.length - 1; i >= 0; i--) {
      const overlay = appliedOverlays[i];
      const overlayX = overlay.x || canvas.width / 2;
      const overlayY = overlay.y || canvas.height / 2;
      const width = overlay.image.width * (overlay.scale || 1);
      const height = overlay.image.height * (overlay.scale || 1);

      if (
        x >= overlayX - width / 2 &&
        x <= overlayX + width / 2 &&
        y >= overlayY - height / 2 &&
        y <= overlayY + height / 2
      ) {
        setSelectedOverlay(overlay);
        return;
      }
    }

    setSelectedOverlay(null);
  };

  const handleMouseDown = (e) => {
    if (!selectedOverlay) return;
    
    setIsDragging(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    dragStartPos.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedOverlay) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const deltaX = x - dragStartPos.current.x;
    const deltaY = y - dragStartPos.current.y;

    if (onOverlayUpdate) {
      onOverlayUpdate(selectedOverlay.id, {
        x: (selectedOverlay.x || canvas.width / 2) + deltaX,
        y: (selectedOverlay.y || canvas.height / 2) + deltaY,
      });
    }

    dragStartPos.current = { x, y };
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
      a.download = `vroomie-ar-preview-${Date.now()}.png`;
      a.click();
      toast.success('Screenshot saved!');
    });
  };

  const toggleFullscreen = () => {
    const container = canvasRef.current?.parentElement;
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
    <div className="relative">
      {/* Hidden video element */}
      <video
        ref={videoRef}
        className="hidden"
        autoPlay
        playsInline
        muted
      />

      {/* Canvas for rendering */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full rounded-xl cursor-crosshair border-2 border-yellow-300/20"
        style={{ maxHeight: '600px', objectFit: 'contain' }}
      />

      {/* Controls */}
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

      {/* No camera warning */}
      {!isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 rounded-xl">
          <div className="text-center">
            <Camera className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">Starting camera...</p>
          </div>
        </div>
      )}
    </div>
  );
}