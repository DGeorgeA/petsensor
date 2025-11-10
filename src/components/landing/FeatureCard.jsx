import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import GlassButton from "../ui/GlassButton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FeatureCard({ 
  title, 
  description, 
  icon: Icon, 
  features = [],
  pagePath,
  accentColor = "yellow",
  index = 0 
}) {
  const accentColors = {
    yellow: "text-yellow-300 bg-yellow-300/20 border-yellow-300/30",
    blue: "text-blue-300 bg-blue-300/20 border-blue-300/30",
    green: "text-green-300 bg-green-300/20 border-green-300/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
    >
      <GlassCard className="p-8 h-full flex flex-col" hover>
        {/* Icon */}
        <div className="mb-6">
          <div className="relative inline-block">
            <div className={`absolute inset-0 ${accentColors[accentColor].split(' ')[1]} rounded-2xl blur-xl opacity-50`} />
            <div className={`relative ${accentColors[accentColor]} rounded-2xl p-4 border`}>
              <Icon className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Content */}
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
          {title}
        </h3>
        <p className="text-gray-400 mb-6 leading-relaxed flex-grow">
          {description}
        </p>

        {/* Features list */}
        <ul className="space-y-3 mb-8">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3 text-gray-300">
              <div className={`mt-1 w-1.5 h-1.5 rounded-full ${accentColors[accentColor].split(' ')[1]} flex-shrink-0`} />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link to={createPageUrl(pagePath)}>
          <GlassButton variant="secondary" className="w-full" icon={ArrowRight}>
            Explore Feature
          </GlassButton>
        </Link>
      </GlassCard>
    </motion.div>
  );
}