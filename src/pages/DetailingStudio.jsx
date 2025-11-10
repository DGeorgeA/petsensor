import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import GlassCard from "../components/ui/GlassCard";
import GlassButton from "../components/ui/GlassButton";
import ARStudioModal from "../components/detailing/ARStudioModal";

export default function DetailingStudio() {
  const [selectedOverlay, setSelectedOverlay] = useState(null);

  // Fetch available AR overlays
  const { data: overlays = [], isLoading } = useQuery({
    queryKey: ['ar-overlays'],
    queryFn: () => base44.entities.AROverlay.filter({ is_active: true }),
  });

  // Fetch shops for overlay vendor info
  const { data: shops = [] } = useQuery({
    queryKey: ['detailing-shops'],
    queryFn: () => base44.entities.DetailingShop.list(),
  });

  const getShopForOverlay = (shopId) => {
    return shops.find(s => s.id === shopId);
  };

  const handleOpenAR = async (overlay) => {
    setSelectedOverlay(overlay);
    
    // Update view count
    await base44.entities.AROverlay.update(overlay.id, {
      view_count: (overlay.view_count || 0) + 1,
    });
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 backdrop-blur-md bg-green-300/10 border border-green-300/30 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-green-300" />
            <span className="text-green-300 text-sm font-medium">Real-Time AR Preview</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-green-300 bg-clip-text text-transparent">
              AR Detailing Studio
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Preview detailing overlays in real-time with AI-powered vehicle detection
          </p>
        </motion.div>

        {/* Overlays Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <p className="text-gray-400 col-span-full text-center">Loading overlays...</p>
          ) : overlays.length === 0 ? (
            <GlassCard className="col-span-full p-12 text-center">
              <Sparkles className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No overlays available</p>
            </GlassCard>
          ) : (
            overlays.map((overlay, index) => {
              const shop = getShopForOverlay(overlay.shop_id);
              return (
                <motion.div
                  key={overlay.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlassCard className="overflow-hidden" hover>
                    {/* Thumbnail */}
                    {overlay.preview_thumbnail_url && (
                      <div className="relative h-48 bg-[linear-gradient(45deg,#1a1a1a_25%,transparent_25%,transparent_75%,#1a1a1a_75%,#1a1a1a),linear-gradient(45deg,#1a1a1a_25%,transparent_25%,transparent_75%,#1a1a1a_75%,#1a1a1a)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]">
                        <img
                          src={overlay.preview_thumbnail_url}
                          alt={overlay.overlay_name}
                          className="w-full h-full object-contain p-4"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-white font-bold text-lg mb-2">
                        {overlay.overlay_name}
                      </h3>
                      {shop && (
                        <p className="text-gray-400 text-sm mb-3">{shop.shop_name}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30 capitalize">
                          {overlay.category}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 capitalize">
                          {overlay.finish?.replace('_', ' ')}
                        </span>
                      </div>

                      <GlassButton
                        onClick={() => handleOpenAR(overlay)}
                        icon={Plus}
                        className="w-full"
                      >
                        Open AR Preview
                      </GlassButton>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })
          )}
        </div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <GlassCard className="p-8">
            <h3 className="text-2xl font-bold text-white mb-6">How AR Preview Works</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-green-300 font-bold text-lg mb-2">1. Point Camera</div>
                <p className="text-gray-400 text-sm">
                  Point your camera at your vehicle. AI will detect and track the car automatically.
                </p>
              </div>
              <div>
                <div className="text-green-300 font-bold text-lg mb-2">2. Customize</div>
                <p className="text-gray-400 text-sm">
                  Drag, scale, and rotate the overlay. It locks to your car's surface in real-time.
                </p>
              </div>
              <div>
                <div className="text-green-300 font-bold text-lg mb-2">3. Book Service</div>
                <p className="text-gray-400 text-sm">
                  Happy with the preview? Save a screenshot and book the detailing service.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* AR Studio Modal */}
      {selectedOverlay && (
        <ARStudioModal
          overlay={selectedOverlay}
          shopName={getShopForOverlay(selectedOverlay.shop_id)?.shop_name || "Unknown Shop"}
          onClose={() => setSelectedOverlay(null)}
        />
      )}
    </div>
  );
}