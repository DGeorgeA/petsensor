import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Heart, Activity, Settings, PawPrint, Menu, X } from 'lucide-react';
import Home from './pages/Home';
import DogWhisperer from './pages/DogWhisperer';
import HorseWhisperer from './pages/HorseWhisperer';
import ApiDocs from './pages/ApiDocs';

function Navigation() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);
  
  return (
    <>
      <nav className="navbar" style={{ position: 'relative', zIndex: 50 }}>
        <Link to="/" className="nav-brand" onClick={closeMenu}>
          <Heart fill="var(--color-primary)" />
          Sense My Pet
        </Link>
        
        {/* Mobile Hamburger Icon */}
        <button className="mobile-menu-btn" onClick={toggleMenu} style={{ display: 'block' }}>
          {isOpen ? <X size={28} color="var(--color-primary)" /> : <Menu size={28} color="var(--color-primary)" />}
        </button>
      </nav>

      {/* Fullscreen Mobile Sidebar / PWA Menu */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'var(--color-bg)',
        zIndex: 40,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '5rem 2rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        <Link to="/dog-whisperer" className={`nav-item ${location.pathname === '/dog-whisperer' ? 'active' : ''}`} onClick={closeMenu} style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <PawPrint size={28} />
          Dog Whisperer
        </Link>
        <Link to="/horse-whisperer" className={`nav-item ${location.pathname === '/horse-whisperer' ? 'active' : ''}`} onClick={closeMenu} style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Activity size={28} />
          Horse Whisperer
        </Link>
        <Link to="/api-docs" className={`nav-item ${location.pathname === '/api-docs' ? 'active' : ''}`} onClick={closeMenu} style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Settings size={28} />
          API Docs
        </Link>
        
        <div style={{ marginTop: 'auto', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Sense My Pet v1.0 <br/> Zen Wellness Platform
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container" style={{ overflowX: 'hidden' }}>
        <Navigation />
        <main style={{ flex: 1, zIndex: 10, position: 'relative' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dog-whisperer" element={<DogWhisperer />} />
            <Route path="/horse-whisperer" element={<HorseWhisperer />} />
            <Route path="/api-docs" element={<ApiDocs />} />
            {/* Catch-all redirection to ensure no blank screens are rendered */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
