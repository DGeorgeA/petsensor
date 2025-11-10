import React from "react";
import { motion } from "framer-motion";
import Hero from "../components/landing/Hero";
import FeatureCard from "../components/landing/FeatureCard";
import { Activity, Droplets, Sparkles } from "lucide-react";

export default function Landing() {
  const features = [
    {
      title: "Predictive Maintenance",
      description: "AI-powered engine sound analysis detects issues before they become expensive problems. Real-time audio monitoring with ECG-style visualization.",
      icon: Activity,
      accentColor: "yellow",
      pagePath: "PredictiveMaintenance",
      features: [
        "Live audio waveform monitoring",
        "Anomaly detection with 99.8% accuracy",
        "Mechanic report generation",
        "Early warning system",
        "Historical analysis tracking",
      ],
    },
    {
      title: "CarOps Control",
      description: "Remote vehicle control at your fingertips. Pre-cool your car, start the engine, and activate security features from anywhere.",
      icon: Droplets,
      accentColor: "blue",
      pagePath: "CarOps",
      features: [
        "Climate pre-conditioning",
        "Remote engine start/stop",
        "Dash cam activation",
        "Integration with Smartcar & OEM APIs",
        "Real-time status monitoring",
      ],
    },
    {
      title: "AR Detailing Marketplace",
      description: "Visualize car modifications before you commit. Browse detailing services, preview AR overlays, and book appointments with verified shops.",
      icon: Sparkles,
      accentColor: "green",
      pagePath: "DetailingMarketplace",
      features: [
        "AR overlay preview studio",
        "Verified detailing shops",
        "Instant price comparison",
        "Before/after visualization",
        "One-click booking",
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <section className="relative py-20 md:py-32">
        {/* Section header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-yellow-300 bg-clip-text text-transparent">
                Three Powerful Modules
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to maintain, control, and enhance your vehicle
            </p>
          </motion.div>
        </div>

        {/* Feature cards grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative backdrop-blur-xl bg-gradient-to-br from-yellow-300/20 to-yellow-500/20 border border-yellow-300/30 rounded-3xl p-12 md:p-16 text-center overflow-hidden"
          >
            {/* Glow effects */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-yellow-300/30 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-yellow-500/30 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-yellow-300 bg-clip-text text-transparent">
                  Ready to Transform Your Car Care?
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of drivers using AI to save money, time, and hassle.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-gradient-to-r from-yellow-300 to-yellow-500 text-zinc-900 rounded-xl font-semibold text-lg hover:from-yellow-400 hover:to-yellow-600 transition-all shadow-lg shadow-yellow-300/30 hover:shadow-yellow-300/50">
                  Start Free Trial
                </button>
                <button className="px-8 py-4 backdrop-blur-md bg-white/10 border border-yellow-300/30 text-yellow-300 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all">
                  Schedule Demo
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}