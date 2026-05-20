import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Heart, Activity, Settings, PawPrint, Menu, X, Sparkles, TrendingUp, Stethoscope, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HeartPawLogo from './components/HeartPawLogo';

// ── ROUTE SPLITTING (performance) ────────────────────────────────────────────
import Home from './pages/Home';
import DogWhisperer from './pages/DogWhisperer';
import CatWhisperer from './pages/CatWhisperer';
import HorseWhisperer from './pages/HorseWhisperer';
import AnxietyTracker from './pages/AnxietyTracker';
import VocalCalibration from './pages/VocalCalibration';
import ApiDocs from './pages/ApiDocs';

// Lazy-load new pages for route splitting
const GroomingMarketplace = lazy(() => import('./pages/GroomingMarketplace'));
const VetPlus = lazy(() => import('./pages/VetPlus'));
const SettingsPage = lazy(() => import('./pages/Settings'));

// ── LOADING FALLBACK ─────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh',
    }}>
      <div className="breathing-orb" style={{ background: 'linear-gradient(135deg, #ffaaa5, #ffd3b6)' }} />
    </div>
  );
}

// ── NAVIGATION ───────────────────────────────────────────────────────────────
function Navigation() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const NAV_ITEMS = [
    { path: '/dog-whisperer',    icon: PawPrint,    label: 'Sense My Dog',       emoji: '🐶' },
    { path: '/cat-whisperer',    icon: Heart,       label: 'Sense My Cat',       emoji: '🐱' },
    { path: '/horse-whisperer',  icon: Activity,    label: 'Sense My Horse',     emoji: '🐴' },
    { path: '/anxiety-tracker',  icon: TrendingUp,  label: 'My Scans',           emoji: '📊' },
    { path: '/vet-plus',         icon: Stethoscope, label: 'Vet+',               emoji: '🏥' },
    { path: '/vocal-calibration',icon: Sparkles,    label: 'Validation Suite',   emoji: '✨' },
    { path: '/wellness-studio',  icon: Heart,       label: 'Wellness Studio',    emoji: '🌿' },
    { path: '/settings',         icon: Settings2,   label: 'Settings',           emoji: '⚙️' },
  ];

  return (
    <>
      <nav
        className="navbar"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          backgroundColor: 'rgba(251, 247, 243, 0.88)',
          borderBottom: '1px solid rgba(255, 211, 182, 0.2)',
          padding: 'clamp(0.7rem, 2vw, 1rem) clamp(1rem, 4vw, 2rem)',
          margin: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Brand */}
        <Link
          to="/"
          onClick={closeMenu}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            textDecoration: 'none', userSelect: 'none',
          }}
          aria-label="Sense My Pet home"
        >
          {/* Animated logo with breathing pulse */}
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              filter: 'drop-shadow(0 3px 12px rgba(255,170,165,0.45))',
            }}
          >
            <HeartPawLogo size={34} />
          </motion.div>
          <span style={{
            fontWeight: 700,
            letterSpacing: '-0.025em',
            fontSize: 'clamp(1.05rem, 3vw, 1.35rem)',
            color: 'var(--color-text-dark)',
            background: 'linear-gradient(135deg, #c0665e, #b07050)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Sense My Pet
          </span>
        </Link>

        {/* Hamburger */}
        <button
          id="nav-menu-btn"
          className="mobile-menu-btn"
          onClick={toggleMenu}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isOpen}
          style={{
            display: 'flex', background: 'transparent', border: 'none',
            cursor: 'pointer', padding: '0.4rem', borderRadius: '10px',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isOpen ? 'close' : 'open'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {isOpen
                ? <X size={26} color="var(--color-text-dark)" />
                : <Menu size={26} color="var(--color-text-dark)" />}
            </motion.div>
          </AnimatePresence>
        </button>
      </nav>

      {/* ── SLIDE-IN DRAWER ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeMenu}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(74, 64, 58, 0.18)', zIndex: 38,
                backdropFilter: 'blur(3px)',
              }}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: 'min(85vw, 340px)',
                backgroundColor: 'rgba(251, 247, 243, 0.98)',
                backdropFilter: 'blur(28px)',
                zIndex: 40,
                padding: 'clamp(4.5rem, 10vh, 6rem) 1.25rem 2rem',
                display: 'flex', flexDirection: 'column', gap: '0.4rem',
                boxShadow: '-16px 0 48px rgba(0,0,0,0.09)',
                overflowY: 'auto',
              }}
            >
              {/* Logo in drawer header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                marginBottom: '1rem', paddingLeft: '0.5rem',
                borderBottom: '1px solid rgba(255,211,182,0.2)', paddingBottom: '1rem',
              }}>
                <HeartPawLogo size={28} />
                <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-dark)' }}>Sense My Pet</span>
              </div>

              {NAV_ITEMS.map((item, idx) => {
                const active = location.pathname === item.path;
                const isSettings = item.path === '/settings';
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 + idx * 0.04 }}
                  >
                    {/* Divider before settings */}
                    {isSettings && (
                      <div style={{
                        height: '1px', background: 'rgba(255,211,182,0.2)',
                        margin: '0.5rem 0.5rem 0.75rem',
                      }} />
                    )}
                    <Link
                      to={item.path}
                      onClick={closeMenu}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.85rem',
                        padding: '0.8rem 1rem', borderRadius: '14px',
                        background: active
                          ? 'linear-gradient(135deg, rgba(255,170,165,0.18), rgba(255,211,182,0.15))'
                          : 'transparent',
                        color: active ? 'var(--color-text-dark)' : 'var(--color-text-muted)',
                        fontWeight: active ? 600 : 500,
                        fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)',
                        border: active ? '1px solid rgba(255,170,165,0.28)' : '1px solid transparent',
                        transition: 'all 0.2s ease',
                        textDecoration: 'none',
                      }}
                    >
                      <span style={{ fontSize: '1.15rem', lineHeight: 1 }}>{item.emoji}</span>
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                style={{
                  marginTop: 'auto', textAlign: 'center',
                  color: 'var(--color-text-muted)', fontSize: '0.8rem',
                  paddingTop: '2rem', lineHeight: 1.6,
                }}
              >
                <HeartPawLogo size={22} style={{ margin: '0 auto 0.4rem', display: 'block' }} />
                Sense My Pet v1.4 · Emotional AI Wellness
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── PAGE WRAPPER ─────────────────────────────────────────────────────────────
function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
}

// ── ANIMATED ROUTES ──────────────────────────────────────────────────────────
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"                  element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/dog-whisperer"     element={<PageWrapper><DogWhisperer /></PageWrapper>} />
        <Route path="/cat-whisperer"     element={<PageWrapper><CatWhisperer /></PageWrapper>} />
        <Route path="/horse-whisperer"   element={<PageWrapper><HorseWhisperer /></PageWrapper>} />
        <Route path="/anxiety-tracker"   element={<PageWrapper><AnxietyTracker /></PageWrapper>} />
        <Route path="/vocal-calibration" element={<PageWrapper><VocalCalibration /></PageWrapper>} />
        <Route path="/api-docs"          element={<PageWrapper><ApiDocs /></PageWrapper>} />
        <Route path="/wellness-studio"   element={
          <PageWrapper>
            <Suspense fallback={<PageLoader />}><GroomingMarketplace /></Suspense>
          </PageWrapper>
        } />
        <Route path="/vet-plus"          element={
          <PageWrapper>
            <Suspense fallback={<PageLoader />}><VetPlus /></Suspense>
          </PageWrapper>
        } />
        <Route path="/settings"          element={
          <PageWrapper>
            <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>
          </PageWrapper>
        } />
        <Route path="*"                  element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

// ── ROOT APP ─────────────────────────────────────────────────────────────────
function App() {
  return (
    <Router>
      <div
        className="app-container"
        style={{
          overflowX: 'hidden',
          minHeight: '100vh',
          maxWidth: '100%',
          margin: 0,
          padding: 0,
        }}
      >
        <Navigation />
        <main
          style={{
            flex: 1,
            zIndex: 10,
            position: 'relative',
            width: '100%',
            paddingTop: 'clamp(5.5rem, 14vh, 8.5rem)',
            paddingLeft: 'clamp(0.5rem, 2vw, 1.5rem)',
            paddingRight: 'clamp(0.5rem, 2vw, 1.5rem)',
          }}
        >
          <AnimatedRoutes />
        </main>
      </div>
    </Router>
  );
}

export default App;
