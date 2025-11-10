import React from "react";
import { cn } from "@/lib/utils";

export default function GlassButton({ 
  children, 
  variant = "primary",
  size = "md",
  className = "",
  icon: Icon,
  ...props 
}) {
  const variants = {
    primary: "bg-gradient-to-r from-yellow-300 to-yellow-500 text-zinc-900 hover:from-yellow-400 hover:to-yellow-600 shadow-lg shadow-yellow-300/30 hover:shadow-yellow-300/50",
    secondary: "backdrop-blur-md bg-white/10 border border-yellow-300/30 text-yellow-300 hover:bg-white/20 hover:border-yellow-300/50",
    ghost: "text-yellow-300 hover:bg-yellow-300/10",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
}