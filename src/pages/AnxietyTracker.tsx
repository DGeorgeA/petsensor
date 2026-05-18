import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle, TrendingUp, Calendar, Heart, ArrowRight, Shield } from 'lucide-react';

interface SessionLog {
  id: string;
  date: string;
  time: string;
  petName: string;
  type: string;
  mood: string;
  anxietyScore: number;
  notes: string;
}

export default function AnxietyTracker() {
  const [selectedPet, setSelectedPet] = useState<'all' | 'dog' | 'horse'>('all');
  const [logs, setLogs] = useState<SessionLog[]>([
    { id: '1', date: 'Today', time: '10:14 AM', petName: 'Luna (Golden Retriever)', type: 'Dog', mood: 'Calm & Resting', anxietyScore: 12, notes: 'Very steady breathing pattern, slow and restful posture.' },
    { id: '2', date: 'Today', time: '07:30 AM', petName: 'Luna (Golden Retriever)', type: 'Dog', mood: 'Excited Energy', anxietyScore: 35, notes: 'Playful barks detected during morning walk preparation.' },
    { id: '3', date: 'Yesterday', time: '06:12 PM', petName: 'Spirit (Stallion)', type: 'Horse', mood: 'Stressed / Pacing', anxietyScore: 78, notes: 'Elevated pacing indicators near stable doors; wind was high.' },
    { id: '4', date: 'May 16', time: '02:00 PM', petName: 'Luna (Golden Retriever)', type: 'Dog', mood: 'Mild Separation Distress', anxietyScore: 62, notes: 'Soft whines detected over a 15-minute interval after exit.' },
    { id: '5', date: 'May 15', time: '09:45 AM', petName: 'Spirit (Stallion)', type: 'Horse', mood: 'Serene / Stable', anxietyScore: 8, notes: 'Standing flat-foot rest posture, slow rhythmic chewing.' }
  ]);

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  const stats = React.useMemo(() => {
    const filtered = selectedPet === 'all' ? logs : logs.filter(l => l.type.toLowerCase() === selectedPet);
    const total = filtered.length;
    const avgScore = total > 0 ? Math.round(filtered.reduce((sum, l) => sum + l.anxietyScore, 0) / total) : 0;
    const highAlerts = filtered.filter(l => l.anxietyScore > 50).length;
    return { total, avgScore, highAlerts };
  }, [logs, selectedPet]);

  const handleSimulateSession = () => {
    setIsSimulating(true);
    setSimulationStep(1);
    
    setTimeout(() => setSimulationStep(2), 1200);
    setTimeout(() => setSimulationStep(3), 2400);
    
    setTimeout(() => {
      const newLog: SessionLog = {
        id: Math.random().toString(),
        date: 'Just Now',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        petName: selectedPet === 'horse' ? 'Spirit (Stallion)' : 'Luna (Golden Retriever)',
        type: selectedPet === 'horse' ? 'Horse' : 'Dog',
        mood: Math.random() > 0.5 ? 'Calm & Resting' : 'Mild Playful Agitation',
        anxietyScore: Math.round(Math.random() * 40) + 10,
        notes: 'Simulated real-time diagnostic completed successfully. Standard acoustic baseline maintained.'
      };
      
      setLogs(prev => [newLog, ...prev]);
      setIsSimulating(false);
      setSimulationStep(0);
    }, 3600);
  };

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto" style={{ padding: '0 1rem', marginBottom: '4rem' }}>
      
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 backdrop-blur-md bg-yellow-300/10 border border-yellow-500/20 rounded-full px-4 py-1.5 mb-4"
        >
          <Activity size={16} color="var(--color-sunset-coral)" />
          <span style={{ color: 'var(--color-text-dark)', fontSize: '0.9rem', fontWeight: 500 }}>Predictive Pet Wellness Engine</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="section-title"
        >
          Anxiety & Behavioral Tracker
        </motion.h1>
        <p className="section-subtitle">
          Track anxiety curves, map acoustic patterns, and anticipate emotional needs using continuous baseline telemetry.
        </p>
      </div>

      {/* Pet Selector & Quick Stats */}
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* Selector Panel */}
        <div className="card glass flex-col justify-between" style={{ padding: '2rem' }}>
          <div>
            <h3 style={{ color: 'var(--color-text-dark)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Active Companion</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Select pet to filter real-time baseline metrics.</p>
          </div>
          <div className="flex gap-2 w-full">
            {(['all', 'dog', 'horse'] as const).map((pet) => (
              <button
                key={pet}
                onClick={() => setSelectedPet(pet)}
                className={`btn`}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  fontSize: '0.95rem',
                  background: selectedPet === pet ? 'var(--gradient-sage)' : 'rgba(255,255,255,0.4)',
                  color: selectedPet === pet ? 'white' : 'var(--color-text-dark)',
                  border: selectedPet === pet ? 'none' : '1px solid rgba(156,172,148,0.2)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                {pet.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card glass text-center flex-col justify-center" style={{ padding: '1.5rem' }}>
            <TrendingUp size={24} color="var(--color-muted-teal)" style={{ margin: '0 auto 0.5rem' }} />
            <h4 style={{ fontSize: '1.75rem', fontWeight: 600 }}>{stats.avgScore}%</h4>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Avg Anxiety Index</p>
          </div>

          <div className="card glass text-center flex-col justify-center" style={{ padding: '1.5rem' }}>
            <AlertTriangle size={24} color="var(--color-sunset-coral)" style={{ margin: '0 auto 0.5rem' }} />
            <h4 style={{ fontSize: '1.75rem', fontWeight: 600 }}>{stats.highAlerts}</h4>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Stress Events (7d)</p>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', width: '100%' }}>
        
        {/* Real-time Session Simulator */}
        <div className="card glass flex-col" style={{ position: 'relative', overflow: 'hidden', minHeight: '420px' }}>
          <h3 className="mb-2" style={{ color: 'var(--color-muted-teal)' }}>Acoustic Heartbeat</h3>
          <p className="text-muted mb-6" style={{ fontSize: '0.95rem' }}>Launch a predictive simulation to evaluate immediate vocal & posture telemetry.</p>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <AnimatePresence mode="wait">
              {isSimulating ? (
                <motion.div 
                  key="simulating"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center"
                >
                  <div className="breathing-orb" style={{ margin: '0 auto 1.5rem', background: 'var(--gradient-sunset)' }}></div>
                  <p style={{ fontWeight: 500, fontSize: '1.1rem', color: 'var(--color-text-dark)' }}>
                    {simulationStep === 1 && "Connecting to bio-telemetry..."}
                    {simulationStep === 2 && "Filtering noise harmonics..."}
                    {simulationStep === 3 && "Running pgvector match..."}
                  </p>
                  <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Do not close this window during calibration.</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                  style={{ width: '100%' }}
                >
                  <div className="visualizer-container" style={{ height: '180px', border: 'none', background: 'transparent', marginBottom: '1.5rem' }}>
                    <svg viewBox="0 0 100 40" width="100%" height="100%" style={{ stroke: 'var(--color-sage-green)', strokeWidth: 1.5, fill: 'none' }}>
                      <path d="M 0 20 L 20 20 L 25 10 L 30 30 L 35 20 L 50 20 L 55 5 L 60 35 L 65 20 L 80 20 L 85 15 L 90 25 L 100 20" />
                    </svg>
                  </div>
                  <button onClick={handleSimulateSession} className="btn btn-cta" style={{ width: '100%' }}>
                    Simulate Live Baseline
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.4)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <Shield size={20} color="var(--color-sage-green)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <p className="text-muted" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
              All baseline models run local worker client inference. Zero private bio-data is sent to external APIs.
            </p>
          </div>
        </div>

        {/* Diagnostic Logs (The Timeline) */}
        <div className="card glass flex-col" style={{ height: '560px', overflow: 'hidden' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--color-text-dark)' }}>Historical Timeline</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>Recent behavioral records and pgvector profile logs.</p>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            {logs.filter(l => selectedPet === 'all' || l.type.toLowerCase() === selectedPet).map((log) => (
              <motion.div 
                key={log.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'rgba(255,255,255,0.5)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  marginBottom: '1rem',
                  borderLeft: `4px solid ${log.anxietyScore > 50 ? 'var(--color-sunset-coral)' : 'var(--color-sage-green)'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', display: 'block' }}>
                      {log.petName}
                    </span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-dark)' }}>
                      {log.mood}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '1.15rem', fontWeight: 600, color: log.anxietyScore > 50 ? 'var(--color-sunset-coral)' : 'var(--color-text-dark)' }}>
                      {log.anxietyScore}%
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Anxiety</span>
                  </div>
                </div>
                <p className="text-muted" style={{ fontSize: '0.88rem', lineHeight: '1.4', marginBottom: '0.75rem' }}>
                  {log.notes}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', opacity: 0.6 }}>
                  <span>{log.date} at {log.time}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckCircle size={12} /> Baseline Calibrated
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Vet Consultation Quick Booking CTA */}
      <motion.div 
        whileHover={{ scale: 1.01 }}
        style={{
          width: '100%',
          background: 'var(--gradient-teal)',
          color: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem',
          marginTop: '3.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lux)'
        }}
      >
        <Heart fill="white" size={32} style={{ marginBottom: '1rem', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' }} />
        <h3 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 600 }}>Uncover Deeper Insights with a Professional</h3>
        <p style={{ maxWidth: '650px', margin: '0.75rem 0 2rem', opacity: 0.9, fontSize: '1.05rem', lineHeight: '1.6' }}>
          Connect with elite pet behaviorists or book a calming grooming therapy block in our Wellness Studio.
        </p>
        <button className="btn btn-cta" style={{ background: 'white', color: 'var(--color-muted-teal)' }}>
          Browse Wellness Studio <ArrowRight size={18} />
        </button>
      </motion.div>
    </div>
  );
}
