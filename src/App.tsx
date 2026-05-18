import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Heart, Activity, Settings, PawPrint, Menu, X, Sparkles, TrendingUp, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import DogWhisperer from './pages/DogWhisperer';
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
      <nav className="navbar" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, backdropFilter: 'blur(20px)', backgroundColor: 'rgba(253, 251, 247, 0.85)', borderBottom: '1px solid rgba(156, 172, 148, 0.15)' }}>
        <Link to="/" className="nav-brand" onClick={closeMenu}>
          <Heart fill="var(--color-sunset-coral)" className="pulse-heart" color="var(--color-sunset-coral)" />
          <span style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Sense My Pet</span>
        </Link>
        
        {/* Mobile Hamburger Icon */}
        <button className="mobile-menu-btn" onClick={toggleMenu} style={{ display: 'block', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
          {isOpen ? <X size={28} color="var(--color-text-dark)" /> : <Menu size={28} color="var(--color-text-dark)" />}
        </button>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(253, 251, 247, 0.98)',
              backdropFilter: 'blur(20px)',
              zIndex: 40,
              padding: '6rem 2rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.05)',
              overflowY: 'auto'
            }}
          >
            {[
              { path: '/dog-whisperer', icon: PawPrint, label: 'Dog Whisperer' },
              { path: '/horse-whisperer', icon: Activity, label: 'Horse Whisperer' },
              { path: '/anxiety-tracker', icon: TrendingUp, label: 'Anxiety Tracker' },
              { path: '/wellness-studio', icon: Calendar, label: 'Wellness Studio' },
              { path: '/vocal-calibration', icon: Sparkles, label: 'Calibration Suite' },
              { path: '/api-docs', icon: Settings, label: 'API Docs' }
            ].map((item, idx) => (
              <motion.div key={item.path} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + idx * 0.04 }}>
                <Link 
                  to={item.path} 
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`} 
                  onClick={closeMenu} 
                  style={{ 
                    fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem', 
                    padding: '0.85rem 1.25rem', borderRadius: '1rem', background: location.pathname === item.path ? 'rgba(156, 172, 148, 0.15)' : 'transparent',
                    color: location.pathname === item.path ? 'var(--color-text-dark)' : 'var(--color-text-muted)',
                    transition: 'all 0.2s ease',
                    border: '1px solid transparent'
                  }}
                >
                  <item.icon size={22} style={{ color: location.pathname === item.path ? 'var(--color-sage-green)' : 'inherit' }} />
                  <span style={{ fontWeight: 500 }}>{item.label}</span>
                </Link>
              </motion.div>
            ))}
            
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              style={{ marginTop: 'auto', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5', paddingTop: '2rem' }}
            >
              Sense My Pet v1.2 <br/> Curated Zen Wellness Platform
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/dog-whisperer" element={<PageWrapper><DogWhisperer /></PageWrapper>} />
        <Route path="/horse-whisperer" element={<PageWrapper><HorseWhisperer /></PageWrapper>} />
        <Route path="/anxiety-tracker" element={<PageWrapper><AnxietyTracker /></PageWrapper>} />
        <Route path="/wellness-studio" element={<PageWrapper><GroomingMarketplace /></PageWrapper>} />
        <Route path="/vocal-calibration" element={<PageWrapper><VocalCalibration /></PageWrapper>} />
        <Route path="/api-docs" element={<PageWrapper><ApiDocs /></PageWrapper>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container" style={{ overflowX: 'hidden', minHeight: '100vh', paddingTop: '5rem' }}>
        <Navigation />
        <main style={{ flex: 1, zIndex: 10, position: 'relative', width: '100%' }}>
          <AnimatedRoutes />
        </main>
      </div>
    </Router>
  );
}

export default App;
