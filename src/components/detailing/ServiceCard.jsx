import React from "react";
import { motion } from "framer-motion";
import { Clock, DollarSign, Star, CheckCircle } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import GlassButton from "../ui/GlassButton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ServiceCard({ service, shop, index = 0 }) {
  const formatPrice = (price) => {
    if (service.price_range_min && service.price_range_max) {
      return `$${service.price_range_min} - $${service.price_range_max}`;
    }
    return `$${price}`;
  };

  const getCategoryColor = (category) => {
    const colors = {
      coating: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      paint: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      wrap: "bg-green-500/20 text-green-400 border-green-500/30",
      interior: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      decal: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      tint: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      ppf: "bg-red-500/20 text-red-400 border-red-500/30",
      detailing: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      restoration: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    return colors[category] || colors.coating;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <GlassCard className="overflow-hidden" hover>
        {/* Image */}
        {service.preview_image_url && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={service.preview_image_url}
              alt={service.service_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
            
            {/* Category Badge */}
            <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(service.category)}`}>
              {service.category}
            </div>

            {/* Featured Badge */}
            {service.is_featured && (
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-yellow-300/20 text-yellow-300 border border-yellow-300/30">
                Featured
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Shop Info */}
          {shop && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {shop.shop_name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-gray-300 font-medium">{shop.shop_name}</p>
                {shop.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-400">
                      {shop.rating} ({shop.total_reviews})
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Service Name */}
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              {service.service_name}
            </h3>
            <p className="text-gray-400 text-sm line-clamp-2">
              {service.description}
            </p>
          </div>

          {/* Features */}
          {service.features && service.features.length > 0 && (
            <div className="space-y-2">
              {service.features.slice(0, 3).map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-400">{feature}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pricing & Duration */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-lg font-bold text-green-400">
                  {formatPrice(service.price)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">
                  {service.duration_minutes}m
                </span>
              </div>
            </div>

            {/* Availability */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              service.availability === 'available' 
                ? 'bg-green-500/20 text-green-400' 
                : service.availability === 'limited'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {service.availability}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Link to={createPageUrl("DetailingStudio")} className="flex-1">
              <GlassButton variant="secondary" className="w-full">
                AR Preview
              </GlassButton>
            </Link>
            <GlassButton className="flex-1">
              Book Now
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}