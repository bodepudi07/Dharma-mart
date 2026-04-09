import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../services/apiService';
import { Icon } from './Icon';

const trialHighlights = [
  {
    title: '8-hour guided trial',
    description: 'Explore temples, verses, chants, and AI guidance in one focused session.',
  },
  {
    title: 'Instant activation',
    description: 'Request a code by email and begin exploring in seconds.',
  },
  {
    title: 'Personalized experience',
    description: 'Your session remembers progress while you move through the app.',
  },
];

const trialSteps = [
  'Request your access code',
  'Enter the 6-character code',
  'Start your 8-hour journey',
];

type GatewayStep = 'welcome' | 'email' | 'code' | 'granted';

interface AccessGatewayProps {
  onAccessGranted: (token: string, expiresAt: string, remainingMs: number, email: string) => void;
}

export const AccessGateway: React.FC<AccessGatewayProps> = ({ onAccessGranted }) => {
  const [step, setStep] = useState<GatewayStep>('welcome');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Particle field animation
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${p.opacity})`;
        ctx.fill();
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleRequestCode = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await api.requestAccessCode(email);
      setGeneratedCode(result.code); // In dev, we display the code
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send access code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit access code.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await api.verifyAccessCode(fullCode);
      setStep('granted');
      setTimeout(() => {
        onAccessGranted(result.token, result.expiresAt, result.remainingMs, result.email);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid access code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleVerifyCode();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().toUpperCase().slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);
    if (pasted.length === 6) {
      codeInputRefs.current[5]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
      {/* Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Radial glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(180,83,9,0.08)_0%,transparent_70%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {/* STEP 1: Welcome */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 text-center px-6 max-w-2xl"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.8, type: 'spring' }}
              className="mx-auto mb-8 w-24 h-24 bg-gradient-to-br from-amber-500/20 to-orange-600/10 rounded-full flex items-center justify-center border border-amber-500/20 shadow-[0_0_60px_rgba(245,158,11,0.15)]"
            >
              <Icon name="cosmic-logo" className="w-14 h-14 text-amber-400" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 mb-4 tracking-tight"
            >
              Dharma Setu
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-amber-200/70 text-sm md:text-base font-medium mb-3 tracking-[0.3em] uppercase"
            >
              Guided 8-Hour Trial Access
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-stone-300 text-sm md:text-base mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Start with a short trial that unlocks our best features for 8 hours. Browse temples, read the Verse of the Day, ask the AI Guru, and experience Dharma Setu without friction.
            </motion.p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
              {trialHighlights.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 + index * 0.08 }}
                  className="rounded-2xl border border-amber-500/15 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/20 flex items-center justify-center text-amber-300">
                      <Icon name="check-circle" className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-amber-100">{item.title}</h3>
                  </div>
                  <p className="text-xs md:text-sm text-stone-400 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
              {trialSteps.map((item, index) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-stone-300"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-bold">
                    {index + 1}
                  </span>
                  {item}
                </span>
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(245, 158, 11, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep('email')}
              className="px-10 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-full text-sm tracking-wide shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_50px_rgba(245,158,11,0.4)] transition-all duration-500 relative overflow-hidden group"
            >
              <span className="relative z-10">Enter Access Code</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </motion.button>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={() => setStep('email')}
              className="block mx-auto mt-4 text-amber-500/40 text-xs hover:text-amber-400/60 transition-colors"
            >
              Request a new code →
            </motion.button>
          </motion.div>
        )}

        {/* STEP 2: Email Input */}
        {step === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-2xl px-6"
          >
            <button
              onClick={() => setStep('welcome')}
              className="text-stone-600 hover:text-stone-400 mb-6 flex items-center gap-2 text-sm transition-colors"
            >
              <Icon name="chevron-left" className="w-4 h-4" /> Back
            </button>

            <h2 className="text-2xl font-serif font-bold text-amber-100 mb-2">Request Access</h2>
            <p className="text-stone-500 text-sm mb-8">
              Enter your email address. We’ll send you a one-time access code for an 8-hour trial.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {trialHighlights.map((item) => (
                <div key={item.title} className="rounded-xl border border-stone-700/50 bg-white/5 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-200 mb-2">{item.title}</h3>
                  <p className="text-xs text-stone-400 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleRequestCode()}
                  placeholder="your@email.com"
                  className="w-full px-5 py-4 bg-white/5 border border-stone-700/50 text-amber-100 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 placeholder-stone-600 text-sm transition-all"
                  autoFocus
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRequestCode}
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl text-sm shadow-lg hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="lotus" className="w-4 h-4 animate-spin" />
                    Generating Code...
                  </span>
                ) : (
                  'Send Access Code'
                )}
              </motion.button>

              <button
                onClick={() => setStep('welcome')}
                className="w-full text-center text-stone-600 text-xs hover:text-stone-400 transition-colors mt-2"
              >
                I already have a code
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Code Input */}
        {step === 'code' && (
          <motion.div
            key="code"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-2xl px-6"
          >
            <button
              onClick={() => setStep('email')}
              className="text-stone-600 hover:text-stone-400 mb-6 flex items-center gap-2 text-sm transition-colors"
            >
              <Icon name="chevron-left" className="w-4 h-4" /> Back
            </button>

            <h2 className="text-2xl font-serif font-bold text-amber-100 mb-2">Enter Your Code</h2>
            <p className="text-stone-500 text-sm mb-2">
              Enter the 6-character access code sent to <span className="text-amber-400">{email}</span>
            </p>

            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-full bg-amber-500/15 border border-amber-400/20 flex items-center justify-center text-amber-300">
                  <Icon name="lotus" className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-100">Your 8-hour trial unlocks the full experience</p>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">Use the code once, then explore the app at your own pace. You’ll see a calm session timer after activation.</p>
                </div>
              </div>
            </div>

            {/* Dev mode: show the code */}
            {generatedCode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-6"
              >
                <p className="text-amber-300/60 text-xs mb-1">Dev mode — your generated code:</p>
                <p className="text-amber-300 font-mono text-2xl font-bold tracking-[0.3em]">{generatedCode}</p>
              </motion.div>
            )}

            {/* Code input boxes */}
            <div className="flex gap-3 justify-center mb-6" onPaste={handleCodePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { codeInputRefs.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-mono font-bold bg-white/5 border-2 border-stone-700/50 text-amber-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all uppercase"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-xs text-center mb-4"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleVerifyCode}
              disabled={isLoading || code.join('').length !== 6}
              className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl text-sm shadow-lg hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Icon name="lotus" className="w-4 h-4 animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Activate Access'
              )}
            </motion.button>
          </motion.div>
        )}

        {/* STEP 4: Access Granted Animation */}
        {step === 'granted' && (
          <motion.div
            key="granted"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="relative z-10 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-6 w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-600/10 rounded-full flex items-center justify-center border border-green-500/30 shadow-[0_0_60px_rgba(34,197,94,0.2)]"
            >
              <Icon name="check-circle" className="w-12 h-12 text-green-400" />
            </motion.div>
            <h2 className="text-3xl font-serif font-bold text-green-300 mb-2">Access Granted</h2>
            <p className="text-stone-500 text-sm">Preparing your exclusive spiritual experience...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom branding */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-stone-700 text-[10px] tracking-widest uppercase">
          Dharma Setu • 8-Hour Guided Access
        </p>
      </div>
    </div>
  );
};
