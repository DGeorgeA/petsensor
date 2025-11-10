import React from "react";
import { cn } from "@/lib/utils";

export default function GlassCard({ 
  children, 
  className = "", 
  glow = false,
  hover = true,
  ...props 
}) {
  return (
    <div
      className={cn(
        "relative backdrop-blur-md bg-zinc-900/60 border border-yellow-300/20 rounded-2xl overflow-hidden transition-all duration-300",
        hover && "hover:bg-zinc-900/70 hover:border-yellow-300/40 hover:shadow-xl hover:shadow-yellow-300/20",
        glow && "shadow-lg shadow-yellow-300/30",
        className
      )}
      {...props}
    >
      {/* Glass highlight effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/10 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
      
      {children}
    </div>
  );
}