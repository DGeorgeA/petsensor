import React from "react";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import GlassButton from "../ui/GlassButton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/4 -left-32 w-96 h-96 bg-yellow-300/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-1/4 -right-32 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-2 backdrop-blur-md bg-yellow-300/10 border border-yellow-300/30 rounded-full px-4 py-2 mb-8">
            <Zap className="w-4 h-4 text-yellow-300" />
            <span className="text-yellow-300 text-sm font-medium">Next-Gen Car Intelligence</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
        >
          <span className="bg-gradient-to-r from-white via-yellow-100 to-yellow-300 bg-clip-text text-transparent">
            Your Car's
          </span>
          <br />
          <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
            AI Copilot
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          Predict maintenance issues before they happen. Control your car remotely. 
          Transform your ride with AR detailing.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link to={createPageUrl("PredictiveMaintenance")}>
            <GlassButton size="lg" icon={ArrowRight}>
              Get Started
            </GlassButton>
          </Link>
          <GlassButton variant="secondary" size="lg">
            Watch Demo
          </GlassButton>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto"
        >
          {[
            { value: "99.8%", label: "Accuracy" },
            { value: "24/7", label: "Monitoring" },
            { value: "5min", label: "Avg Response" },
          ].map((stat, index) => (
            <div key={index} className="backdrop-blur-md bg-white/5 border border-yellow-300/20 rounded-xl p-6">
              <div className="text-3xl md:text-4xl font-bold text-yellow-300 mb-2">
                {stat.value}
              </div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-yellow-300/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-yellow-300 rounded-full" />
        </div>
      </motion.div>
    </div>
  );
}