import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
    onFinished: () => void;
}

// Pre-generate stable particle data
const PARTICLES = Array.from({ length: 55 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: Math.random() * 4 + 1.5,
    duration: Math.random() * 15 + 12,
    delay: -(Math.random() * 20),
    opacity: Math.random() * 0.5 + 0.15,
}));

export const SplashScreen = ({ onFinished }: SplashScreenProps) => {
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [stage, setStage] = useState<'tracing' | 'pulsing' | 'fading'>('tracing');
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const timer1 = setTimeout(() => setStage('pulsing'), 5000);
        const timer2 = setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(onFinished, 1000);
        }, 9500);
        return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }, [onFinished]);

    const handleStart = () => {
        audioRef.current?.play().catch(() => { });
    };

    return (
        <motion.div
            onClick={handleStart}
            animate={isFadingOut ? { opacity: 0, scale: 1.06 } : { opacity: 1, scale: 1 }}
            transition={isFadingOut ? { duration: 1, ease: 'easeInOut' } : {}}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center cursor-pointer overflow-hidden"
            style={{ background: 'radial-gradient(ellipse at 40% 30%, #1a0802 0%, #08080f 55%, #030308 100%)' }}
        >
            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {PARTICLES.map(p => (
                    <div
                        key={p.id}
                        className="absolute rounded-full"
                        style={{
                            left: `${p.left}%`,
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            opacity: p.opacity,
                            background: `radial-gradient(circle, rgba(217,119,6,0.9), rgba(180,83,9,0.3) 70%, transparent)`,
                            boxShadow: `0 0 ${p.size * 2}px rgba(217,119,6,0.5)`,
                            animation: `float-up ${p.duration}s ${p.delay}s linear infinite`,
                        }}
                    />
                ))}
            </div>

            {/* Distant ambient glow behind everything */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                style={{
                    width: '600px', height: '600px',
                    background: 'radial-gradient(circle, rgba(180,83,9,0.08) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                }}
            />

            {/* Main Content */}
            <div className="relative flex flex-col items-center z-10 max-w-4xl px-6">

                {/* === SWASTIKA + ORBITING RINGS (all in same container) === */}
                <div className="relative flex items-center justify-center mb-12" style={{ width: 320, height: 320 }}>

                    {/* Far outer dashed ring - 300px, rotates slowly */}
                    <motion.svg
                        className="absolute inset-0"
                        width="320" height="320" viewBox="0 0 320 320"
                        initial={{ opacity: 0, rotate: 0 }}
                        animate={{ opacity: stage === 'tracing' ? 0.18 : 0.35, rotate: -360 }}
                        transition={{ opacity: { duration: 2 }, rotate: { duration: 40, repeat: Infinity, ease: 'linear' } }}
                    >
                        <defs>
                            <linearGradient id="outerRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#B45309" />
                                <stop offset="50%" stopColor="#D97706" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <circle cx="160" cy="160" r="155" fill="none" stroke="url(#outerRingGrad)" strokeWidth="1" strokeDasharray="10 20" strokeLinecap="round" />
                        {/* Thin solid ring just inside */}
                        <circle cx="160" cy="160" r="148" fill="none" stroke="rgba(180,83,9,0.15)" strokeWidth="0.5" />
                    </motion.svg>

                    {/* Middle spinning gradient ring - 230px */}
                    <motion.svg
                        className="absolute"
                        style={{ top: '45px', left: '45px' }}
                        width="230" height="230" viewBox="0 0 230 230"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: stage === 'tracing' ? 0.35 : 0.75, rotate: 360 }}
                        transition={{ opacity: { duration: 2 }, rotate: { duration: 18, repeat: Infinity, ease: 'linear' } }}
                    >
                        <defs>
                            <linearGradient id="midRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#D97706" />
                                <stop offset="40%" stopColor="#F59E0B" />
                                <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <circle cx="115" cy="115" r="110" fill="none" stroke="url(#midRingGrad)" strokeWidth="1.2" strokeDasharray="8 14" strokeLinecap="round" />
                    </motion.svg>

                    {/* Inner sacred geometry SVG - triangles + circles - 200px */}
                    <motion.svg
                        className="absolute"
                        style={{ top: '60px', left: '60px' }}
                        width="200" height="200" viewBox="0 0 200 200"
                        initial={{ opacity: 0, scale: 0.6, rotate: -15 }}
                        animate={{ opacity: stage === 'tracing' ? 0.15 : 0.3, scale: 1, rotate: 0 }}
                        transition={{ duration: 2.5, ease: 'easeOut' }}
                    >
                        {/* Outer circle of geometry */}
                        <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(180,83,9,0.4)" strokeWidth="0.5" strokeDasharray="3 5" />
                        <circle cx="100" cy="100" r="76" fill="none" stroke="rgba(180,83,9,0.25)" strokeWidth="0.5" />
                        {/* Star of David / double triangle */}
                        <polygon points="100,10 180,150 20,150" fill="none" stroke="rgba(180,83,9,0.2)" strokeWidth="0.5" />
                        <polygon points="100,190 20,50 180,50" fill="none" stroke="rgba(180,83,9,0.2)" strokeWidth="0.5" />
                        {/* 8 directional tick marks */}
                        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
                            const rad = (angle * Math.PI) / 180;
                            const x1 = 100 + 90 * Math.cos(rad);
                            const y1 = 100 + 90 * Math.sin(rad);
                            const x2 = 100 + 80 * Math.cos(rad);
                            const y2 = 100 + 80 * Math.sin(rad);
                            return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(180,83,9,0.3)" strokeWidth="0.8" />;
                        })}
                    </motion.svg>

                    {/* Innermost close orbit ring - just around swastika ~ 145px */}
                    <motion.svg
                        className="absolute"
                        style={{ top: '87px', left: '87px' }}
                        width="146" height="146" viewBox="0 0 146 146"
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: stage === 'tracing' ? 0.5 : 0.95,
                            rotate: stage === 'pulsing' ? [0, 360] : 0,
                        }}
                        transition={{
                            opacity: { duration: 1.5 },
                            rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
                        }}
                    >
                        <defs>
                            <linearGradient id="innerRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#F59E0B" />
                                <stop offset="50%" stopColor="#D97706" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <circle cx="73" cy="73" r="68" fill="none" stroke="url(#innerRingGrad)" strokeWidth="1.5" strokeDasharray="5 8" strokeLinecap="round" />
                        {/* 4 dot markers on the ring */}
                        {[0, 90, 180, 270].map(angle => {
                            const rad = (angle * Math.PI) / 180;
                            return (
                                <motion.circle
                                    key={angle}
                                    cx={73 + 68 * Math.cos(rad)}
                                    cy={73 + 68 * Math.sin(rad)}
                                    r="2.5"
                                    fill="#F59E0B"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 0.8, scale: 1 }}
                                    transition={{ delay: 1.5 + angle / 360, duration: 0.4 }}
                                />
                            );
                        })}
                    </motion.svg>

                    {/* SWASTIKA at absolute center */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        {/* Radial glow that pulses */}
                        <motion.div
                            animate={stage === 'pulsing' ? {
                                scale: [1, 1.5, 1],
                                opacity: [0.4, 0.8, 0.4],
                            } : { scale: 1, opacity: 0.3 }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                            style={{
                                width: '140px', height: '140px',
                                background: 'radial-gradient(circle, rgba(180,83,9,0.55) 0%, transparent 70%)',
                                filter: 'blur(12px)',
                            }}
                        />

                        <svg
                            width="110"
                            height="110"
                            viewBox="0 0 100 100"
                            className="relative z-10"
                            style={{ filter: 'drop-shadow(0 0 14px rgba(217,119,6,0.85))' }}
                        >
                            <defs>
                                <filter id="splashGlow">
                                    <feGaussianBlur stdDeviation="2" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                                <linearGradient id="swastikaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#D97706" />
                                    <stop offset="50%" stopColor="#F59E0B" />
                                    <stop offset="100%" stopColor="#B45309" />
                                </linearGradient>
                            </defs>

                            {/* Glow outer pass */}
                            <motion.path
                                d="M 10 10 V 50 H 90 V 90 M 90 10 H 50 V 90 H 10"
                                fill="none"
                                stroke="rgba(255,200,100,0.25)"
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.5 }}
                                transition={{ duration: 4.5, ease: 'easeInOut', delay: 0.1 }}
                            />
                            {/* Main swastika */}
                            <motion.path
                                d="M 10 10 V 50 H 90 V 90 M 90 10 H 50 V 90 H 10"
                                fill="none"
                                stroke="url(#swastikaGrad)"
                                strokeWidth="5.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                filter="url(#splashGlow)"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 4.5, ease: 'easeInOut' }}
                            />

                            {/* Corner dots - appear after tracing */}
                            {[
                                { cx: 28, cy: 28, delay: 3.5 },
                                { cx: 72, cy: 28, delay: 4.0 },
                                { cx: 28, cy: 72, delay: 4.3 },
                                { cx: 72, cy: 72, delay: 4.6 },
                            ].map((dot, i) => (
                                <motion.circle
                                    key={i}
                                    cx={dot.cx} cy={dot.cy} r="3.5"
                                    fill="#F59E0B"
                                    filter="url(#splashGlow)"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: dot.delay, duration: 0.4, type: 'spring', stiffness: 280 }}
                                />
                            ))}
                        </svg>
                    </div>
                </div>

                {/* Text reveal section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: stage === 'tracing' ? 0 : 1, y: stage === 'tracing' ? 30 : 0 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center"
                >
                    <div className="overflow-hidden mb-3">
                        <motion.h1
                            initial={{ y: 60 }}
                            animate={{ y: stage === 'tracing' ? 60 : 0 }}
                            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                            className="text-5xl md:text-7xl font-serif font-bold text-white tracking-[0.25em] uppercase"
                            style={{ textShadow: '0 0 40px rgba(180,83,9,0.6), 0 0 80px rgba(180,83,9,0.3)' }}
                        >
                            DHARMA SETU
                        </motion.h1>
                    </div>

                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: stage === 'tracing' ? 0 : 1 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                        className="h-px mx-auto mb-6"
                        style={{ width: '220px', background: 'linear-gradient(90deg, transparent, #D97706, transparent)' }}
                    />

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: stage === 'tracing' ? 0 : 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="text-xl md:text-2xl font-serif italic mb-4"
                        style={{ color: 'rgba(255,255,255,0.8)', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
                    >
                        "The Distance Between You and the Divine is{' '}
                        <span style={{ color: '#D97706', fontWeight: 700 }}>Now Zero.</span>"
                    </motion.p>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: stage === 'tracing' ? 0 : 1 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="text-stone-500 text-xs tracking-[0.25em] uppercase"
                    >
                        India's First Phygital Spiritual Infrastructure
                    </motion.p>
                </motion.div>
            </div>

            {/* Audio */}
            <audio
                ref={audioRef}
                src="https://upload.wikimedia.org/wikipedia/commons/e/e6/Om_chanting.ogg"
                autoPlay loop preload="auto"
                className="hidden"
            />

            {/* Tap hint */}
            <AnimatePresence>
                {stage === 'tracing' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 1.2 }}
                        className="absolute bottom-12 flex flex-col items-center gap-2"
                    >
                        <motion.div
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-white/30 text-[11px] tracking-[0.3em] uppercase"
                        >
                            Tap to enable sound
                        </motion.div>
                        <motion.div
                            animate={{ y: [0, 6, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-px h-8 rounded-full"
                            style={{ background: 'linear-gradient(to bottom, transparent, rgba(180,83,9,0.6))' }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
