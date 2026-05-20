import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Heart, Activity, Settings, PawPrint, Menu, X, Sparkles, TrendingUp, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import DogWhisperer from './pages/DogWhisperer';
import CatWhisperer from './pages/CatWhisperer';
import HorseWhisperer from './pages/HorseWhisperer';
import ApiDocs from './pages/ApiDocs';
import AnxietyTracker from './pages/AnxietyTracker';
import GroomingMarketplace from './pages/GroomingMarketplace';
import VocalCalibration from './pages/VocalCalibration';

function Navigation() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <nav
        className="navbar"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          backgroundColor: 'rgba(251, 247, 243, 0.88)',
          borderBottom: '1px solid rgba(255, 211, 182, 0.2)',
          padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 4vw, 2rem)',
          margin: 0,
        }}
      >
        <Link to="/" className="nav-brand" onClick={closeMenu} style={{ gap: '0.6rem' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #ffaaa5, #ffd3b6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', flexShrink: 0,
          }}>🐾</div>
          <span style={{ fontWeight: 600, letterSpacing: '-0.02em', fontSize: 'clamp(1.1rem, 3vw, 1.45rem)' }}>Sense My Pet</span>
        </Link>

        <button
          className="mobile-menu-btn"
          onClick={toggleMenu}
          aria-label="Open navigation menu"
          style={{ display: 'flex', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.4rem', borderRadius: '10px' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isOpen ? 'close' : 'open'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isOpen ? <X size={26} color="var(--color-text-dark)" /> : <Menu size={26} color="var(--color-text-dark)" />}
            </motion.div>
          </AnimatePresence>
        </button>
      </nav>

      {/* Slide-in drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeMenu}
              style={{ position: 'fixed', inset: 0, background: 'rgba(74, 64, 58, 0.15)', zIndex: 38, backdropFilter: 'blur(2px)' }}
            />
            {/* Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: 'min(85vw, 340px)',
                backgroundColor: 'rgba(251, 247, 243, 0.98)',
                backdropFilter: 'blur(24px)',
                zIndex: 40,
                padding: 'clamp(4.5rem, 10vh, 6rem) 1.5rem 2rem',
                display: 'flex', flexDirection: 'column', gap: '0.5rem',
                boxShadow: '-12px 0 40px rgba(0,0,0,0.08)',
                overflowY: 'auto',
              }}
            >
              {[
                { path: '/dog-whisperer',    icon: PawPrint,    label: 'Dog Whisperer',    emoji: '🐶' },
                { path: '/cat-whisperer',    icon: Heart,       label: 'Cat Whisperer',    emoji: '🐱' },
                { path: '/horse-whisperer',  icon: Activity,    label: 'Horse Whisperer',  emoji: '🐴' },
                { path: '/anxiety-tracker',  icon: TrendingUp,  label: 'Anxiety Tracker',  emoji: '📊' },
                { path: '/wellness-studio',  icon: Calendar,    label: 'Wellness Studio',  emoji: '🌿' },
                { path: '/vocal-calibration',icon: Sparkles,    label: 'Calibration Suite',emoji: '✨' },
                { path: '/api-docs',         icon: Settings,    label: 'API Docs',         emoji: '⚙️' },
              ].map((item, idx) => {
                const active = location.pathname === item.path;
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + idx * 0.04 }}
                  >
                    <Link
                      to={item.path}
                      onClick={closeMenu}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.9rem',
                        padding: '0.85rem 1.1rem', borderRadius: '14px',
                        background: active ? 'linear-gradient(135deg, rgba(255,170,165,0.2), rgba(255,211,182,0.2))' : 'transparent',
                        color: active ? 'var(--color-text-dark)' : 'var(--color-text-muted)',
                        fontWeight: active ? 600 : 500,
                        fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
                        border: active ? '1px solid rgba(255,170,165,0.3)' : '1px solid transparent',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>{item.emoji}</span>
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }}
                style={{ marginTop: 'auto', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem', paddingTop: '2rem' }}
              >
                Sense My Pet v1.3 · Emotional AI Wellness
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"                element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/dog-whisperer"   element={<PageWrapper><DogWhisperer /></PageWrapper>} />
        <Route path="/cat-whisperer"   element={<PageWrapper><CatWhisperer /></PageWrapper>} />
        <Route path="/horse-whisperer" element={<PageWrapper><HorseWhisperer /></PageWrapper>} />
        <Route path="/anxiety-tracker" element={<PageWrapper><AnxietyTracker /></PageWrapper>} />
        <Route path="/wellness-studio" element={<PageWrapper><GroomingMarketplace /></PageWrapper>} />
        <Route path="/vocal-calibration" element={<PageWrapper><VocalCalibration /></PageWrapper>} />
        <Route path="/api-docs"        element={<PageWrapper><ApiDocs /></PageWrapper>} />
        <Route path="*"                element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <div
        className="app-container"
        style={{
          overflowX: 'hidden',
          minHeight: '100vh',
          paddingTop: 'clamp(4rem, 10vh, 5.5rem)',
          maxWidth: '100%',
          margin: 0,
          padding: 0,
        }}
      >
        <Navigation />
        <main style={{ flex: 1, zIndex: 10, position: 'relative', width: '100%', padding: 'clamp(0.5rem, 2vw, 1.5rem)' }}>
          <AnimatedRoutes />
        </main>
      </div>
    </Router>
  );
}

export default App;
