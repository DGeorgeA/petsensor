import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calendar, Star, Check, ArrowRight, ShieldCheck, Heart, User } from 'lucide-react';

interface ServiceItem {
  id: string;
  name: string;
  category: 'spa' | 'behavior' | 'therapy';
  price: string;
  rating: number;
  duration: string;
  imageColor: string;
  description: string;
  benefits: string[];
}

export default function GroomingMarketplace() {
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [petName, setPetName] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  
  const services: ServiceItem[] = [
    {
      id: '1',
      name: 'Empathetic Calming Lavender Spa',
      category: 'spa',
      price: '₹1,499',
      rating: 4.9,
      duration: '75 mins',
      imageColor: 'var(--gradient-sage)',
      description: 'Slow-pace sensory soak using warm organic lavender mist and positive reinforcement posture holds to deeply soothe anxious pets.',
      benefits: ['Lowers heart-rate base indices', 'Gentle coat conditioning', 'Reduces paw stress sensitivity']
    },
    {
      id: '2',
      name: 'Zen Posture Alignment & Assessment',
      category: 'behavior',
      price: '₹2,199',
      rating: 5.0,
      duration: '60 mins',
      imageColor: 'var(--gradient-teal)',
      description: 'Behavior-guided consultation mapping skeletal alignment and movement. Helps pinpoint hidden stress points or joint strain.',
      benefits: ['Comprehensive stance analysis', 'Custom exercise schedule', 'Veterinarian report copy']
    },
    {
      id: '3',
      name: 'Acoustic Sound Resonance Therapy',
      category: 'therapy',
      price: '₹999',
      rating: 4.8,
      duration: '45 mins',
      imageColor: 'var(--gradient-sunset)',
      description: 'Soothing hertz-frequency sound immersion matched with subtle physical tactile release blocks. Perfect for pets returning from recovery.',
      benefits: ['Targets separation-anxiety nodes', 'Includes vocal profile calibration', 'Deep sleep facilitation']
    },
    {
      id: '4',
      name: 'Calming Paws Reflexology',
      category: 'spa',
      price: '₹1,299',
      rating: 4.9,
      duration: '50 mins',
      imageColor: 'var(--gradient-sage)',
      description: 'Soft paw massage utilizing calming calendula oil, designed to release muscular stress and desensitize pads to daily groomings.',
      benefits: ['Aids nervous system regulation', 'Softens dry pad tissue', 'Includes organic nail trim']
    }
  ];

  const handleBookNow = (service: ServiceItem) => {
    setSelectedService(service);
    setBookingConfirmed(false);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!petName || !bookingDate) return;
    
    setBookingConfirmed(true);
    setTimeout(() => {
      setSelectedService(null);
      setBookingConfirmed(false);
      setPetName('');
      setBookingDate('');
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto" style={{ padding: '0 1rem', marginBottom: '4rem' }}>
      
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 backdrop-blur-md bg-green-300/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-4"
        >
          <Sparkles size={16} color="var(--color-sage-green)" />
          <span style={{ color: 'var(--color-text-dark)', fontSize: '0.9rem', fontWeight: 500 }}>Calm Oasis Pet Wellness Studio</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="section-title"
        >
          Curated Wellness Marketplace
        </motion.h1>
        <p className="section-subtitle">
          Book high-end therapeutic grooming, behavior alignment, and sensory baths designed by premium pet experts.
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', width: '100%' }}>
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            whileHover={{ y: -6 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card glass flex-col overflow-hidden"
            style={{ padding: 0 }}
          >
            {/* Visual Header */}
            <div style={{ height: '140px', background: service.imageColor, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart color="white" fill="rgba(255,255,255,0.2)" size={48} style={{ opacity: 0.8 }} />
              <span style={{
                position: 'absolute', bottom: '1rem', right: '1rem',
                background: 'rgba(255,255,255,0.9)', color: 'var(--color-text-dark)',
                padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem', fontWeight: 600
              }}>
                {service.duration}
              </span>
            </div>

            {/* Content */}
            <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  {service.category === 'spa' ? 'Therapeutic Spa' : service.category === 'behavior' ? 'Behavioral Align' : 'Sensory Therapy'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-soft-gold)', fontSize: '0.9rem', fontWeight: 600 }}>
                  <Star size={14} fill="currentColor" /> {service.rating}
                </span>
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-dark)', lineHeight: '1.3', marginBottom: '0.75rem' }}>
                {service.name}
              </h3>
              
              <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '1.5rem', flex: 1 }}>
                {service.description}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid rgba(156,172,148,0.1)' }}>
                <div>
                  <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block' }}>Starting at</span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--color-text-dark)' }}>{service.price}</span>
                </div>
                <button onClick={() => handleBookNow(service)} className="btn btn-primary" style={{ padding: '0.75rem 1.25rem', fontSize: '0.95rem', borderRadius: 'var(--radius-md)' }}>
                  Book Now
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Booking Calendar Modal */}
      <AnimatePresence>
        {selectedService && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(253, 251, 247, 0.8)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="card glass flex-col" style={{ maxWidth: '480px', width: '90%', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
            >
              {bookingConfirmed ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ textAlign: 'center', padding: '2rem 0' }}
                >
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--gradient-sage)', display: 'flex', alignItems: 'center', margin: '0 auto 1.5rem', justifyContent: 'center', boxShadow: '0 10px 20px rgba(156,172,148,0.2)' }}>
                    <Check color="white" size={32} />
                  </div>
                  <h2 style={{ fontSize: '1.8rem', color: 'var(--color-text-dark)', fontWeight: 600 }}>Booking Confirmed!</h2>
                  <p className="text-muted" style={{ marginTop: '0.75rem', fontSize: '1rem', lineHeight: '1.5' }}>
                    Sensory reserve block initialized for <strong style={{ color: 'var(--color-text-dark)' }}>{petName}</strong> on <strong style={{ color: 'var(--color-text-dark)' }}>{bookingDate}</strong>. Baseline details synchronized with therapist.
                  </p>
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '2rem', opacity: 0.8 }}>Closing overlay...</p>
                </motion.div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Confirm Reservation</h2>
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>{selectedService.name}</span>
                    </div>
                    <button onClick={() => setSelectedService(null)} style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>✕</button>
                  </div>

                  <form onSubmit={handleConfirmBooking} className="flex-col gap-4">
                    
                    <div className="flex-col" style={{ display: 'flex', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-dark)' }}>Pet's Companion Name</label>
                      <div style={{ position: 'relative' }}>
                        <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Luna"
                          value={petName}
                          onChange={(e) => setPetName(e.target.value)}
                          style={{
                            width: '100%', padding: '0.75rem 1rem 0.75rem 2.25rem',
                            borderRadius: 'var(--radius-md)', border: '1px solid rgba(156,172,148,0.2)',
                            background: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-family)', fontSize: '0.95rem'
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex-col" style={{ display: 'flex', gap: '0.25rem', marginTop: '1rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-dark)' }}>Reservation Date & Time</label>
                      <div style={{ position: 'relative' }}>
                        <Calendar size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                          type="datetime-local"
                          required
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          style={{
                            width: '100%', padding: '0.75rem 1rem 0.75rem 2.25rem',
                            borderRadius: 'var(--radius-md)', border: '1px solid rgba(156,172,148,0.2)',
                            background: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-family)', fontSize: '0.95rem'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ background: 'rgba(156,172,148,0.05)', borderRadius: 'var(--radius-md)', padding: '1rem', marginTop: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <ShieldCheck size={18} color="var(--color-sage-green)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                      <p className="text-muted" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                        Includes live baseline telemetry sync. Our experts will automatically review Luna's logged anxiety index charts prior to arrival.
                      </p>
                    </div>

                    <div className="flex gap-3 justify-end" style={{ marginTop: '2rem' }}>
                      <button type="button" onClick={() => setSelectedService(null)} className="btn" style={{ background: 'transparent', color: 'var(--color-text-muted)', fontSize: '1rem', padding: '0.75rem 1.5rem' }}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.75rem 2rem', borderRadius: 'var(--radius-md)' }}>
                        Confirm Block
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
