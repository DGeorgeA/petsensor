import React from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import GlassCard from "../ui/GlassCard";
import GlassButton from "../ui/GlassButton";
import { RotateCw, ZoomIn, Trash2 } from "lucide-react";

export default function OverlayControls({ overlay, onUpdate, onRemove }) {
  if (!overlay) {
    return (
      <GlassCard className="p-6">
        <p className="text-gray-400 text-sm text-center">
          Select an overlay to adjust its properties
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 space-y-6">
      <div>
        <h3 className="text-white font-semibold mb-2">{overlay.overlay_name}</h3>
        <p className="text-gray-400 text-xs">{overlay.description}</p>
      </div>

      {/* Scale Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-gray-300 text-sm flex items-center gap-2">
            <ZoomIn className="w-4 h-4" />
            Scale
          </Label>
          <span className="text-yellow-300 text-sm">{((overlay.scale || 1) * 100).toFixed(0)}%</span>
        </div>
        <Slider
          value={[(overlay.scale || 1) * 100]}
          onValueChange={(value) => onUpdate({ scale: value[0] / 100 })}
          min={10}
          max={200}
          step={5}
          className="w-full"
        />
      </div>

      {/* Rotation Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-gray-300 text-sm flex items-center gap-2">
            <RotateCw className="w-4 h-4" />
            Rotation
          </Label>
          <span className="text-yellow-300 text-sm">{(overlay.rotation || 0).toFixed(0)}°</span>
        </div>
        <Slider
          value={[overlay.rotation || 0]}
          onValueChange={(value) => onUpdate({ rotation: value[0] })}
          min={0}
          max={360}
          step={5}
          className="w-full"
        />
      </div>

      {/* Opacity Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-gray-300 text-sm">Opacity</Label>
          <span className="text-yellow-300 text-sm">{((overlay.opacity || 1) * 100).toFixed(0)}%</span>
        </div>
        <Slider
          value={[(overlay.opacity || 1) * 100]}
          onValueChange={(value) => onUpdate({ opacity: value[0] / 100 })}
          min={10}
          max={100}
          step={5}
          className="w-full"
        />
      </div>

      {/* Remove Button */}
      <GlassButton
        onClick={onRemove}
        variant="secondary"
        icon={Trash2}
        className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
      >
        Remove Overlay
      </GlassButton>

      {/* Info */}
      <div className="pt-4 border-t border-white/10">
        <p className="text-xs text-gray-500 text-center">
          Drag overlay on canvas to reposition
        </p>
      </div>
    </GlassCard>
  );
}