import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import GlassButton from "../ui/GlassButton";
import { Store, Upload, Loader2, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ShopForm({ onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    shop_name: "",
    owner_email: "",
    business_phone: "",
    location_shorthand: "",
    bio: "",
    years_in_business: "",
    services_offered: [],
    certifications: [],
  });
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const serviceOptions = [
    "ceramic_coating",
    "paint_correction",
    "detailing",
    "ppf",
    "vinyl_wrap",
    "chrome_delete",
    "tint",
    "custom_graphics",
  ];

  const certificationOptions = [
    "IDA Certified",
    "Gtechniq Accredited",
    "Ceramic Pro Certified",
    "3M Preferred",
    "XPEL Certified",
    "Avery Dennison Certified",
  ];

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    if (type === 'logo') {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleServiceToggle = (service) => {
    setFormData(prev => ({
      ...prev,
      services_offered: prev.services_offered.includes(service)
        ? prev.services_offered.filter(s => s !== service)
        : [...prev.services_offered, service]
    }));
  };

  const handleCertificationToggle = (cert) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Upload logo if provided
      let logoUrl = null;
      if (logoFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: logoFile });
        logoUrl = file_url;
      }

      // Upload cover image if provided
      let coverUrl = null;
      if (coverFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: coverFile });
        coverUrl = file_url;
      }

      // Create shop record
      const shop = await base44.entities.DetailingShop.create({
        ...formData,
        logo_url: logoUrl,
        cover_image_url: coverUrl,
        years_in_business: parseInt(formData.years_in_business) || 0,
        is_verified: false,
        rating: 0,
        total_reviews: 0,
      });

      toast.success('Shop created successfully!');
      
      if (onSuccess) {
        onSuccess(shop);
      }
    } catch (error) {
      console.error('Error creating shop:', error);
      toast.error('Failed to create shop. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Store className="w-5 h-5 text-green-400" />
          Basic Information
        </h3>

        <div>
          <Label className="text-gray-300">Shop Name *</Label>
          <Input
            required
            value={formData.shop_name}
            onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
            placeholder="Elite Auto Detailing"
            className="mt-1"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-300">Owner Email *</Label>
            <Input
              required
              type="email"
              value={formData.owner_email}
              onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
              placeholder="owner@shop.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-gray-300">Business Phone *</Label>
            <Input
              required
              type="tel"
              value={formData.business_phone}
              onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
              placeholder="(555) 123-4567"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-300">Location *</Label>
            <Input
              required
              value={formData.location_shorthand}
              onChange={(e) => setFormData({ ...formData, location_shorthand: e.target.value })}
              placeholder="Downtown, East Bay, etc."
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-gray-300">Years in Business</Label>
            <Input
              type="number"
              value={formData.years_in_business}
              onChange={(e) => setFormData({ ...formData, years_in_business: e.target.value })}
              placeholder="5"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label className="text-gray-300">Shop Bio *</Label>
          <Textarea
            required
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Describe your shop, specialties, and what makes you unique..."
            className="mt-1 h-24"
          />
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-400" />
          Shop Images
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Logo Upload */}
          <div>
            <Label className="text-gray-300">Shop Logo</Label>
            <div className="mt-2">
              {logoPreview ? (
                <div className="relative">
                  <img src={logoPreview} alt="Logo preview" className="w-32 h-32 object-cover rounded-xl border border-green-500/30" />
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-green-500/50 transition-colors">
                  <Upload className="w-8 h-8 text-gray-500 mb-2" />
                  <span className="text-xs text-gray-500">Upload Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'logo')}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Cover Image Upload */}
          <div>
            <Label className="text-gray-300">Cover Image</Label>
            <div className="mt-2">
              {coverPreview ? (
                <div className="relative">
                  <img src={coverPreview} alt="Cover preview" className="w-full h-32 object-cover rounded-xl border border-green-500/30" />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverFile(null);
                      setCoverPreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-green-500/50 transition-colors">
                  <Upload className="w-8 h-8 text-gray-500 mb-2" />
                  <span className="text-xs text-gray-500">Upload Cover (1200x400)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'cover')}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Services Offered */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Services Offered *</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {serviceOptions.map((service) => (
            <div key={service} className="flex items-center gap-2">
              <Checkbox
                checked={formData.services_offered.includes(service)}
                onCheckedChange={() => handleServiceToggle(service)}
              />
              <label className="text-sm text-gray-300 capitalize">
                {service.replace('_', ' ')}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Certifications</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {certificationOptions.map((cert) => (
            <div key={cert} className="flex items-center gap-2">
              <Checkbox
                checked={formData.certifications.includes(cert)}
                onCheckedChange={() => handleCertificationToggle(cert)}
              />
              <label className="text-sm text-gray-300">{cert}</label>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-4">
        <GlassButton
          type="submit"
          disabled={isSubmitting}
          icon={isSubmitting ? Loader2 : CheckCircle}
          className={`flex-1 ${isSubmitting ? 'opacity-50' : ''}`}
        >
          {isSubmitting ? 'Creating Shop...' : 'Create Shop'}
        </GlassButton>
      </div>
    </form>
  );
}