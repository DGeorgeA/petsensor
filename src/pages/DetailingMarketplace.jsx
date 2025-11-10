import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Search, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlassCard from "../components/ui/GlassCard";
import ServiceCard from "../components/detailing/ServiceCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function DetailingMarketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Fetch services
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['detailing-services'],
    queryFn: () => base44.entities.DetailingService.list('-created_date'),
  });

  // Fetch shops
  const { data: shops = [] } = useQuery({
    queryKey: ['detailing-shops'],
    queryFn: () => base44.entities.DetailingShop.list(),
  });

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = service.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getShopForService = (shopId) => {
    return shops.find(s => s.id === shopId);
  };

  const categories = [
    { value: "all", label: "All Services" },
    { value: "coating", label: "Ceramic Coating" },
    { value: "paint", label: "Paint Correction" },
    { value: "wrap", label: "Vehicle Wrap" },
    { value: "interior", label: "Interior Detailing" },
    { value: "decal", label: "Custom Decals" },
    { value: "tint", label: "Window Tinting" },
    { value: "ppf", label: "Paint Protection" },
    { value: "detailing", label: "Full Detailing" },
  ];

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
            <span className="text-green-300 text-sm font-medium">Detailing Services</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-green-300 bg-clip-text text-transparent">
              Detailing Marketplace
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Find the perfect detailing service with AR preview capabilities
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-gray-400 text-sm">
            {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
          </p>
        </motion.div>

        {/* Services Grid */}
        {servicesLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <GlassCard key={i} className="p-6">
                <Skeleton className="h-48 w-full mb-4 bg-zinc-800" />
                <Skeleton className="h-6 w-3/4 mb-2 bg-zinc-800" />
                <Skeleton className="h-4 w-full mb-4 bg-zinc-800" />
                <Skeleton className="h-10 w-full bg-zinc-800" />
              </GlassCard>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Sparkles className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 text-lg">No services found</p>
            <p className="text-gray-500 text-sm mt-2">
              Try adjusting your search or filters
            </p>
          </GlassCard>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                shop={getShopForService(service.shop_id)}
                index={index}
              />
            ))}
          </div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <GlassCard className="p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Own a detailing shop?
            </h2>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Join our marketplace and reach thousands of car enthusiasts. Upload AR overlays 
              to showcase your work and let customers preview before booking.
            </p>
            <a href="/shop-onboarding">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-green-300 to-green-500 text-zinc-900 rounded-xl font-semibold text-lg hover:from-green-400 hover:to-green-600 transition-all shadow-lg shadow-green-300/30"
              >
                Register Your Shop
              </motion.button>
            </a>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}