import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function VroomieLogo({ size = "md", animate = false, showAnimation = true }) {
  const [isAnimating, setIsAnimating] = useState(showAnimation);

  // Auto-play animation for 3 seconds on mount
  useEffect(() => {
    if (showAnimation) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showAnimation]);

  const sizes = {
    sm: { width: 40, height: 40 },
    md: { width: 60, height: 60 },
    lg: { width: 80, height: 80 },
    xl: { width: 120, height: 120 },
  };

  const { width, height } = sizes[size] || sizes.md;

  const carAnimation = {
    initial: { x: -200, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100,
        duration: 1.5,
      }
    },
    exit: { x: 200, opacity: 0 }
  };

  const bounceAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: 4,
      ease: "easeInOut"
    }
  };

  const wheelAnimation = {
    rotate: [0, 360],
    transition: {
      duration: 1,
      repeat: 2,
      ease: "linear"
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isAnimating ? (
        <motion.div
          key="animating"
          style={{ width, height, position: 'relative' }}
          {...carAnimation}
          animate={{
            ...carAnimation.animate,
            ...bounceAnimation
          }}
        >
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691072dcc471e785f12b2da3/7b9a1e11f_Vroomie.png"
            alt="Vroomie Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'brightness(0.95) contrast(1.1) hue-rotate(-15deg) saturate(1.2)',
              // Color adjustment to make it more yellow/black
            }}
          />
          
          {/* Speed lines effect */}
          <motion.div
            style={{
              position: 'absolute',
              right: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '50px',
              height: '3px',
              background: 'linear-gradient(to right, transparent, #FCD34D)',
              borderRadius: '2px',
            }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scaleX: [0, 1, 0],
            }}
            transition={{
              duration: 0.8,
              repeat: 2,
              ease: "easeOut"
            }}
          />
          
          {/* Additional speed lines */}
          <motion.div
            style={{
              position: 'absolute',
              right: '100%',
              top: '40%',
              width: '30px',
              height: '2px',
              background: 'linear-gradient(to right, transparent, #FCD34D)',
              borderRadius: '2px',
            }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ 
              opacity: [0, 0.7, 0],
              scaleX: [0, 1, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: 3,
              delay: 0.2,
              ease: "easeOut"
            }}
          />
          
          <motion.div
            style={{
              position: 'absolute',
              right: '100%',
              top: '60%',
              width: '30px',
              height: '2px',
              background: 'linear-gradient(to right, transparent, #FCD34D)',
              borderRadius: '2px',
            }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ 
              opacity: [0, 0.7, 0],
              scaleX: [0, 1, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: 3,
              delay: 0.3,
              ease: "easeOut"
            }}
          />
        </motion.div>
      ) : (
        <motion.div
          key="static"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ width, height }}
        >
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691072dcc471e785f12b2da3/7b9a1e11f_Vroomie.png"
            alt="Vroomie Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'brightness(0.95) contrast(1.1) hue-rotate(-15deg) saturate(1.2)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}