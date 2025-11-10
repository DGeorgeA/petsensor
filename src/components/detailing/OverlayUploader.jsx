import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlassButton from "../ui/GlassButton";
import GlassCard from "../ui/GlassCard";
import { Upload, Loader2, CheckCircle, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function OverlayUploader({ shopId, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overlayFile, setOverlayFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    overlay_name: "",
    description: "",
    category: "wrap",
    color: "",
    finish: "glossy",
    price_modifier: 0,
    is_premium: false,
  });

  const categories = ["paint", "wrap", "decal", "ceramic", "ppf", "stripe", "graphics", "tint"];
  const finishes = ["glossy", "matte", "satin", "metallic", "chrome", "carbon_fiber"];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type (PNG only for transparency)
    if (!file.type.includes('png')) {
      toast.error('Please upload a PNG file for transparency support');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setOverlayFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      
      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        console.log(`Image dimensions: ${img.width}x${img.height}`);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!overlayFile) {
      toast.error('Please select an overlay image');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload overlay image
      const { file_url } = await base44.integrations.Core.UploadFile({ file: overlayFile });

      // Create thumbnail (use same image for now)
      const thumbnailUrl = file_url;

      // Create AR overlay record
      const overlay = await base44.entities.AROverlay.create({
        shop_id: shopId,
        overlay_name: formData.overlay_name,
        description: formData.description,
        image_url: file_url,
        preview_thumbnail_url: thumbnailUrl,
        category: formData.category,
        color: formData.color,
        finish: formData.finish,
        opacity: 1.0,
        scale_factor: 1.0,
        position_presets: {
          sedan: { x: 0, y: 0, scale: 1.0 },
          suv: { x: 0, y: 0, scale: 1.1 },
          coupe: { x: 0, y: 0, scale: 0.95 }
        },
        tags: [formData.category, formData.finish, formData.color].filter(Boolean),
        is_premium: formData.price_modifier > 0,
        price_modifier: formData.price_modifier,
        view_count: 0,
        usage_count: 0,
        is_active: true,
      });

      toast.success('Overlay uploaded successfully!');
      
      // Reset form
      setOverlayFile(null);
      setPreview(null);
      setFormData({
        overlay_name: "",
        description: "",
        category: "wrap",
        color: "",
        finish: "glossy",
        price_modifier: 0,
        is_premium: false,
      });

      if (onSuccess) {
        onSuccess(overlay);
      }
    } catch (error) {
      console.error('Error uploading overlay:', error);
      toast.error('Failed to upload overlay. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload */}
      <div>
        <Label className="text-gray-300 mb-2 block">Overlay Image (PNG with transparency) *</Label>
        {preview ? (
          <GlassCard className="p-6">
            <div className="relative">
              {/* Checkered background to show transparency */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,#1a1a1a_25%,transparent_25%,transparent_75%,#1a1a1a_75%,#1a1a1a),linear-gradient(45deg,#1a1a1a_25%,transparent_25%,transparent_75%,#1a1a1a_75%,#1a1a1a)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] rounded-xl" />
              <img 
                src={preview} 
                alt="Overlay preview" 
                className="relative w-full h-64 object-contain rounded-xl"
              />
              <button
                type="button"
                onClick={() => {
                  setOverlayFile(null);
                  setPreview(null);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full px-3 py-1 text-sm hover:bg-red-600"
              >
                Remove
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              PNG format • Transparency preserved • Max 5MB
            </p>
          </GlassCard>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-green-500/50 transition-colors bg-zinc-900/50">
            <Upload className="w-12 h-12 text-gray-500 mb-3" />
            <span className="text-sm text-gray-400 mb-1">Click to upload or drag and drop</span>
            <span className="text-xs text-gray-500">PNG format (max 5MB)</span>
            <input
              type="file"
              accept="image/png"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Overlay Details */}
      <div className="space-y-4">
        <div>
          <Label className="text-gray-300">Overlay Name *</Label>
          <Input
            required
            value={formData.overlay_name}
            onChange={(e) => setFormData({ ...formData, overlay_name: e.target.value })}
            placeholder="Matte Black Hood"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-gray-300">Description</Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Premium matte black overlay for hood area"
            className="mt-1"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-300">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="capitalize">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-300">Finish *</Label>
            <Select value={formData.finish} onValueChange={(value) => setFormData({ ...formData, finish: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {finishes.map((finish) => (
                  <SelectItem key={finish} value={finish} className="capitalize">
                    {finish.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-300">Color</Label>
            <Input
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="Black, Red, Gold, etc."
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-gray-300">Price Modifier ($)</Label>
            <Input
              type="number"
              value={formData.price_modifier}
              onChange={(e) => setFormData({ ...formData, price_modifier: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Additional cost for this overlay</p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <GlassButton
        type="submit"
        disabled={isSubmitting || !overlayFile}
        icon={isSubmitting ? Loader2 : CheckCircle}
        className={`w-full ${(isSubmitting || !overlayFile) ? 'opacity-50' : ''}`}
      >
        {isSubmitting ? 'Uploading...' : 'Upload Overlay'}
      </GlassButton>
    </form>
  );
}