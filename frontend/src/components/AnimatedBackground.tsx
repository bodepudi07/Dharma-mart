import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

export const AnimatedBackground = () => {
  const { calculatedTimeOfDay, ishtaDevata, festivalMode } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 8; 
      const y = (e.clientY / window.innerHeight - 0.5) * 8;
      setMousePosition({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeEnv = useMemo(() => {
    const tod = calculatedTimeOfDay.toLowerCase();
    if (festivalMode === 'Diwali' || tod === 'sunset') {
      return 'aarti';
    }
    if (tod === 'night' || festivalMode === 'Mahashivaratri' || ishtaDevata === 'Shiva' && tod === 'sunset') {
      return 'moonlit';
    }
    if (ishtaDevata === 'Krishna' || ishtaDevata === 'Lakshmi') {
      return 'river';
    }
    if (tod === 'dawn' || tod === 'morning') {
      return 'sunrise';
    }
    return 'courtyard';
  }, [calculatedTimeOfDay, ishtaDevata, festivalMode]);

  const particles = useMemo(() => {
    const list = [];
    const count = activeEnv === 'moonlit' ? 40 : 25;
    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * (activeEnv === 'moonlit' ? 5 : 3.5) + 2,
        delay: Math.random() * 10,
        duration: Math.random() * 12 + 10,
        sway: Math.random() * 60 - 30,
      });
    }
    return list;
  }, [activeEnv]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      
      {/* ─── ENVIRONMENTAL LIGHTING LAYER ─── */}
      <div 
        className="absolute inset-0 transition-all duration-[2000ms] ease-in-out"
        style={{
          background: 'var(--background-image)',
          opacity: 'var(--background-opacity)'
        }}
      />

      {/* Shifting radial lighting (God Rays projection) */}
      <motion.div
        className="absolute -top-[30%] -left-[20%] w-[140vw] h-[140vh] opacity-[0.16] mix-blend-screen pointer-events-none"
        animate={{
          x: [0, 40, -40, 0],
          y: [0, -25, 25, 0],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: 'radial-gradient(circle at 35% 35%, rgba(251, 191, 36, 0.45) 0%, transparent 60%)'
        }}
      />

      {/* ─── TEMPLE LAYER: Sandstone Towers & Pillars ─── */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-64 flex justify-between items-end opacity-[0.06] select-none"
        animate={{
          x: mousePosition.x * -0.4,
          y: mousePosition.y * -0.4 + scrollY * 0.18,
        }}
        transition={{ type: "spring", stiffness: 35, damping: 22 }}
      >
        {/* Left Temple Pillar */}
        <svg width="120" height="400" viewBox="0 0 120 400" className="text-stone-800 fill-current">
          <rect x="30" y="20" width="60" height="380" />
          <rect x="20" y="380" width="80" height="20" rx="3" />
          <path d="M10,20 L110,20 L60,0 Z" />
          {/* Pillar carvings */}
          <line x1="45" y1="40" x2="45" y2="360" stroke="white" strokeWidth="1" strokeDasharray="5 5" opacity="0.3" />
          <line x1="75" y1="40" x2="75" y2="360" stroke="white" strokeWidth="1" strokeDasharray="5 5" opacity="0.3" />
        </svg>

        {/* Right Temple Pillar */}
        <svg width="120" height="400" viewBox="0 0 120 400" className="text-stone-800 fill-current">
          <rect x="30" y="20" width="60" height="380" />
          <rect x="20" y="380" width="80" height="20" rx="3" />
          <path d="M10,20 L110,20 L60,0 Z" />
          <line x1="45" y1="40" x2="45" y2="360" stroke="white" strokeWidth="1" strokeDasharray="5 5" opacity="0.3" />
          <line x1="75" y1="40" x2="75" y2="360" stroke="white" strokeWidth="1" strokeDasharray="5 5" opacity="0.3" />
        </svg>
      </motion.div>

      {/* ─── ATMOSPHERE LAYER & NATURE LAYER ─── */}
      <AnimatePresence mode="popLayout">
        
        {activeEnv === 'sunrise' && (
          <motion.div 
            key="sunrise-layers"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {/* Sunrise morning mist */}
            <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-stone-100/30 to-transparent blur-3xl" />
            
            {/* God Rays entering from top-left */}
            <div 
              className="absolute top-0 left-0 w-full h-[500px] opacity-[0.1] mix-blend-screen pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(55deg, #FFF9E6 0px, #FFF9E6 40px, transparent 40px, transparent 80px)',
              }}
            />

            {/* Flying Parrots (Curved bezier path) */}
            <div className="absolute top-16 left-0 right-0 h-40">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`parrot-${i}`}
                  className="absolute"
                  initial={{ x: -100, y: 50 + i * 35 }}
                  animate={{
                    x: dimensions.width + 100,
                    y: [50 + i * 35, 20 + i * 35, 70 + i * 35, 30 + i * 35, 50 + i * 35]
                  }}
                  transition={{
                    duration: 18 + i * 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 5
                  }}
                >
                  <svg width="28" height="14" viewBox="0 0 28 14" className="text-emerald-500 fill-current opacity-40">
                    <path d="M0,7 C7,0 12,7 13,7 C14,7 20,0 28,7 C21,10 16,10 13,8 C11,10 7,10 0,7 Z">
                      <animate attributeName="d" 
                        values="M0,7 C7,0 12,7 13,7 C14,7 20,0 28,7 C21,10 16,10 13,8 C11,10 7,10 0,7 Z;
                                M0,2 C7,9 12,5 13,5 C14,5 20,9 28,2 C21,5 16,5 13,5 C11,5 7,5 0,2 Z;
                                M0,7 C7,0 12,7 13,7 C14,7 20,0 28,7 C21,10 16,10 13,8 C11,10 7,10 0,7 Z"
                        dur="1.2s" repeatCount="indefinite" />
                    </path>
                  </svg>
                </motion.div>
              ))}
            </div>

            {/* Floating flower petals */}
            {particles.slice(0, 15).map(p => (
              <div 
                key={`petal-${p.id}`}
                className="falling-petal text-amber-500"
                style={{
                  left: `${p.left}%`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`
                }}
              >
                <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor" className="opacity-40">
                  <path d="M10,0 C15,5 20,10 10,20 C0,10 5,5 10,0 Z" />
                </svg>
              </div>
            ))}
          </motion.div>
        )}

        {activeEnv === 'river' && (
          <motion.div 
            key="river-layers"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {/* Water layers */}
            <div className="absolute bottom-0 left-0 right-0 h-44 river-waves" />
            <div className="absolute bottom-0 left-0 right-0 h-44 river-waves-secondary" />

            {/* Shifting water reflections */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-300/10 to-transparent mix-blend-color" />

            {/* Floating Lotuses */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`lotus-${i}`}
                className="absolute bottom-8"
                initial={{ x: i === 0 ? '10%' : i === 1 ? '50%' : '80%', y: 0 }}
                animate={{
                  y: [0, -4, 0],
                  x: [
                    i === 0 ? '10%' : i === 1 ? '50%' : '80%', 
                    i === 0 ? '12%' : i === 1 ? '51%' : '78%', 
                    i === 0 ? '10%' : i === 1 ? '50%' : '80%'
                  ],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{
                  duration: 10 + i * 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <svg width="42" height="24" viewBox="0 0 40 24" fill="none" className="text-pink-400/20 stroke-current" strokeWidth="1">
                  <path d="M20,2 C15,10 6,12 2,18 C10,20 15,16 20,22 C25,16 30,20 38,18 C34,12 25,10 20,2 Z" />
                </svg>
              </motion.div>
            ))}

            {/* Drifting water diyas */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`diya-drift-${i}`}
                className="absolute bottom-12 z-10"
                initial={{ x: -100 }}
                animate={{
                  x: dimensions.width + 100,
                  y: [0, -4, 4, -2, 0]
                }}
                transition={{
                  duration: 45 + i * 10,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 18
                }}
              >
                <div className="relative scale-75">
                  <div className="w-8 h-5 bg-amber-900 rounded-full border border-amber-600/30" />
                  <div className="absolute -top-3.5 left-3 w-2.5 h-4 bg-orange-500 rounded-full blur-[1px] animate-pulse shadow-[0_0_10px_#f97316]" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeEnv === 'courtyard' && (
          <motion.div 
            key="courtyard-layers"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {/* Soft drifting clouds */}
            <div className="absolute top-10 left-10 w-96 h-36 bg-white/5 rounded-full blur-3xl animate-cosmic-drift" />
            <div className="absolute top-32 right-12 w-[34rem] h-44 bg-white/5 rounded-full blur-3xl animate-cosmic-drift-reverse" />

            {/* Fluttering temple flags */}
            <div className="absolute top-8 right-24 opacity-25">
              <svg width="80" height="150" viewBox="0 0 80 150" fill="none" className="text-primary stroke-current">
                <line x1="10" y1="0" x2="10" y2="150" strokeWidth="2" />
                <path d="M10,2 L75,24 L10,46 Z" fill="var(--color-primary)" className="fluttering-flag" />
              </svg>
            </div>

            {/* Slow walking peacock silhouette at bottom */}
            <motion.div
              className="absolute bottom-2 z-10 opacity-[0.04]"
              initial={{ x: -200 }}
              animate={{ x: dimensions.width + 200 }}
              transition={{ duration: 65, repeat: Infinity, ease: "linear" }}
            >
              <svg width="80" height="60" viewBox="0 0 100 80" className="fill-current text-stone-900">
                <path d="M10,70 C15,65 20,40 30,30 C40,20 60,10 80,10 C90,10 95,20 90,30 C85,40 70,55 50,60 C35,63 20,68 10,70 Z" />
                <path d="M75,10 C75,5 80,0 85,2 C90,4 88,10 82,10 Z" />
                <line x1="40" y1="60" x2="35" y2="80" stroke="currentColor" strokeWidth="2" />
                <line x1="55" y1="60" x2="52" y2="80" stroke="currentColor" strokeWidth="2" />
              </svg>
            </motion.div>

            {/* Falling green leaves */}
            {particles.slice(0, 10).map(p => (
              <div 
                key={`leaf-${p.id}`}
                className="falling-petal text-emerald-600"
                style={{
                  left: `${p.left}%`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration * 1.2}s`
                }}
              >
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="opacity-20">
                  <path d="M10,0 C18,5 18,15 10,20 C2,15 2,5 10,0 Z" />
                </svg>
              </div>
            ))}
          </motion.div>
        )}

        {activeEnv === 'aarti' && (
          <motion.div 
            key="aarti-layers"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {/* Glowing diya rows along bottom */}
            <div className="absolute bottom-4 left-0 right-0 diwali-diya-shelf bg-gradient-to-t from-amber-950/25 to-transparent">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="diwali-diya scale-75" />
              ))}
            </div>

            {/* Incense smoke columns */}
            {[...Array(4)].map((_, i) => (
              <div 
                key={`smoke-trail-${i}`}
                className="absolute bottom-20"
                style={{
                  left: `${15 + i * 25}%`,
                  opacity: 0
                }}
              >
                <div className="incense-smoke">
                  <svg width="24" height="120" viewBox="0 0 30 120" className="text-stone-300 stroke-current opacity-15" fill="none" strokeWidth="1">
                    <path d="M15,120 Q22,90 8,60 T15,0" />
                  </svg>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeEnv === 'moonlit' && (
          <motion.div 
            key="moonlit-layers"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {/* Glowing moon */}
            <div className="absolute top-16 right-20 w-16 h-16 rounded-full bg-yellow-50/20 blur-[2px] shadow-[0_0_30px_#fef08a]" />

            {/* Twinkling stars */}
            <div className="absolute inset-0">
              {[...Array(25)].map((_, i) => {
                const left = Math.random() * 100;
                const top = Math.random() * 50; 
                const delay = Math.random() * 6;
                const duration = Math.random() * 3 + 3;
                return (
                  <motion.div
                    key={`star-field-${i}`}
                    className="absolute w-1 h-1 bg-white rounded-full opacity-60"
                    style={{ left: `${left}%`, top: `${top}%` }}
                    animate={{
                      opacity: [0.1, 0.9, 0.1],
                      scale: [0.7, 1.3, 0.7]
                    }}
                    transition={{
                      duration: duration,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: delay
                    }}
                  />
                );
              })}
            </div>

            {/* Glowing green fireflies */}
            <div className="absolute inset-0">
              {particles.map(p => (
                <motion.div
                  key={`firefly-bug-${p.id}`}
                  className="absolute rounded-full bg-green-200/30"
                  style={{
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    left: `${p.left}%`,
                    top: `${p.top}%`,
                    boxShadow: `0 0 10px rgba(187,247,208,0.7)`,
                  }}
                  animate={{
                    x: [0, p.sway * 0.9, 0],
                    y: [0, -p.sway * 0.9, 0],
                    opacity: [0, 0.8, 0],
                    scale: [0.6, 1.2, 0.6]
                  }}
                  transition={{
                    duration: p.duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: p.delay
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default AnimatedBackground;
