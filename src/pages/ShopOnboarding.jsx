import React, { useState } from "react";
import { motion } from "framer-motion";
import { Store, Sparkles, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GlassCard from "../components/ui/GlassCard";
import ShopForm from "../components/detailing/ShopForm";
import OverlayUploader from "../components/detailing/OverlayUploader";

export default function ShopOnboarding() {
  const [createdShop, setCreatedShop] = useState(null);
  const [currentTab, setCurrentTab] = useState("shop");

  const handleShopCreated = (shop) => {
    setCreatedShop(shop);
    setCurrentTab("overlays");
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 backdrop-blur-md bg-green-300/10 border border-green-300/30 rounded-full px-4 py-2 mb-6">
            <Store className="w-4 h-4 text-green-300" />
            <span className="text-green-300 text-sm font-medium">Shop Registration</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-green-300 bg-clip-text text-transparent">
              Join Vroomie Marketplace
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Register your detailing shop and upload AR overlays to showcase your services
          </p>
        </motion.div>

        {/* Success Banner */}
        {createdShop && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <GlassCard className="p-4 border-green-500/30">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-white font-semibold">Shop Created Successfully!</p>
                  <p className="text-gray-400 text-sm">
                    Now upload AR overlays to showcase your work
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="shop" className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                Shop Details
              </TabsTrigger>
              <TabsTrigger 
                value="overlays" 
                className="flex items-center gap-2"
                disabled={!createdShop}
              >
                <Sparkles className="w-4 h-4" />
                AR Overlays
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shop">
              <GlassCard className="p-8">
                <ShopForm onSuccess={handleShopCreated} />
              </GlassCard>
            </TabsContent>

            <TabsContent value="overlays">
              {createdShop ? (
                <GlassCard className="p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Upload AR Overlays
                    </h2>
                    <p className="text-gray-400">
                      Upload transparent PNG images that customers can preview on their vehicles
                    </p>
                  </div>
                  <OverlayUploader 
                    shopId={createdShop.id} 
                    onSuccess={() => {
                      // Could show list of uploaded overlays here
                    }}
                  />
                </GlassCard>
              ) : (
                <GlassCard className="p-8 text-center">
                  <Store className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">
                    Please create your shop first before uploading overlays
                  </p>
                </GlassCard>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid md:grid-cols-3 gap-6"
        >
          <GlassCard className="p-6">
            <div className="text-green-300 font-bold text-lg mb-2">1. Register</div>
            <p className="text-gray-400 text-sm">
              Fill out your shop details, upload images, and select services offered
            </p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="text-green-300 font-bold text-lg mb-2">2. Upload Overlays</div>
            <p className="text-gray-400 text-sm">
              Create PNG overlays with transparency showing your work (wraps, coatings, etc.)
            </p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="text-green-300 font-bold text-lg mb-2">3. Get Discovered</div>
            <p className="text-gray-400 text-sm">
              Customers can preview your work with AR and book services directly
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}