import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MeditationAudioEngine } from '../utils/meditationAudio';
import { Icon } from './Icon';

class ExtendedAudioEngine extends MeditationAudioEngine {
  private conchOscs: OscillatorNode[] = [];
  private conchGains: GainNode[] = [];
  private chantOscs: OscillatorNode[] = [];
  private chantGains: GainNode[] = [];
  private chantInterval: ReturnType<typeof setInterval> | null = null;
  private conchInterval: ReturnType<typeof setInterval> | null = null;
  private warmthFilter: BiquadFilterNode | null = null;

  private setupWarmthFilter(ctx: AudioContext, source: AudioNode): AudioNode {
    if (!this.warmthFilter) {
      this.warmthFilter = ctx.createBiquadFilter();
      this.warmthFilter.type = 'lowpass';
      this.warmthFilter.frequency.setValueAtTime(3200, ctx.currentTime); // Soften digital highs
      this.warmthFilter.Q.setValueAtTime(0.8, ctx.currentTime);
      this.warmthFilter.connect(ctx.destination);
    }
    source.connect(this.warmthFilter);
    return this.warmthFilter;
  }

  playConchCall() {
    const ctx = (this as any).getContext();
    const now = ctx.currentTime;
    
    const baseFreq = 150;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, now + 1.5);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.12, now + 3.8);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + 4.8);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(baseFreq * 1.008, now);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.3 * 1.008, now + 1.5);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.12 * 1.008, now + 3.8);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 0.8 * 1.008, now + 4.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.Q.setValueAtTime(4, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 3.2);
    gain.gain.linearRampToValueAtTime(0, now + 4.8);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    
    this.setupWarmthFilter(ctx, gain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 4.9);
    osc2.stop(now + 4.9);

    this.conchOscs.push(osc1, osc2);
    this.conchGains.push(gain);
  }

  playVedicChantStep(ctx: AudioContext, gainNode: AudioNode) {
    const now = ctx.currentTime;
    const pitches = [108, 121.5, 96];
    const pitch = pitches[Math.floor(Math.random() * pitches.length)];
    
    const osc = ctx.createOscillator();
    const form1 = ctx.createBiquadFilter();
    const form2 = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.linearRampToValueAtTime(pitch * 1.006, now + 1.0);

    form1.type = 'bandpass';
    form1.frequency.setValueAtTime(400, now);
    form1.Q.setValueAtTime(5, now);

    form2.type = 'bandpass';
    form2.frequency.setValueAtTime(750, now);
    form2.Q.setValueAtTime(4, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.3);
    gain.gain.linearRampToValueAtTime(0.09, now + 1.3);
    gain.gain.linearRampToValueAtTime(0, now + 1.7);

    osc.connect(form1);
    osc.connect(form2);
    form1.connect(gain);
    form2.connect(gain);
    gain.connect(gainNode);

    osc.start(now);
    osc.stop(now + 1.8);

    this.chantOscs.push(osc);
    this.chantGains.push(gain);
  }

  toggleExtendedAmbient(id: string): boolean {
    const coreIds = ['bells', 'river', 'wind', 'om', 'rain', 'birds'];
    if (coreIds.includes(id)) {
      const active = this.toggleAmbient(id);
      // Connect master gain to warmth filter if active
      const ctx = (this as any).getContext();
      if (active && (this as any).masterGain) {
        this.setupWarmthFilter(ctx, (this as any).masterGain);
      }
      return active;
    }

    if (id === 'conch') {
      if (this.conchInterval) {
        clearInterval(this.conchInterval);
        this.conchInterval = null;
        return false;
      }
      this.conchInterval = setInterval(() => {
        this.playConchCall();
      }, 14000);
      this.playConchCall();
      return true;
    }

    if (id === 'chanting') {
      if (this.chantInterval) {
        clearInterval(this.chantInterval);
        this.chantInterval = null;
        return false;
      }
      const ctx = (this as any).getContext();
      const chantMasterGain = ctx.createGain();
      chantMasterGain.gain.setValueAtTime(0.4, ctx.currentTime);
      this.setupWarmthFilter(ctx, chantMasterGain);

      this.chantInterval = setInterval(() => {
        this.playVedicChantStep(ctx, chantMasterGain);
      }, 1900);
      this.playVedicChantStep(ctx, chantMasterGain);
      return true;
    }

    return false;
  }

  stopAllExtended() {
    this.stopAll();
    if (this.conchInterval) {
      clearInterval(this.conchInterval);
      this.conchInterval = null;
    }
    if (this.chantInterval) {
      clearInterval(this.chantInterval);
      this.chantInterval = null;
    }
    this.conchOscs.forEach(o => { try { o.stop(); } catch {} });
    this.chantOscs.forEach(o => { try { o.stop(); } catch {} });
    this.conchOscs = [];
    this.chantOscs = [];
  }
}

export const AmbientAudioPlayer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    drone: false,
    bells: false,
    birds: false,
    river: false,
    rain: false,
    wind: false,
    conch: false,
    chanting: false
  });
  
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [masterVolume, setMasterVolume] = useState(60);

  const engineRef = useRef<ExtendedAudioEngine | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    engineRef.current = new ExtendedAudioEngine();
    return () => {
      if (engineRef.current) {
        engineRef.current.stopAllExtended();
        engineRef.current.destroy();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (engineRef.current && (engineRef.current as any).masterGain) {
      const vol = masterVolume / 100;
      try {
        (engineRef.current as any).masterGain.gain.setValueAtTime(vol, (engineRef.current as any).getContext().currentTime);
      } catch {}
    }
  }, [masterVolume]);

  useEffect(() => {
    if (sleepTimer === null) {
      setTimeLeft(null);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      return;
    }

    setTimeLeft(sleepTimer * 60);

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          timerIntervalRef.current = null;
          handleStopAll();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [sleepTimer]);

  const handleStopAll = () => {
    if (engineRef.current) {
      engineRef.current.stopAllExtended();
    }
    setActiveLayers({
      drone: false,
      bells: false,
      birds: false,
      river: false,
      rain: false,
      wind: false,
      conch: false,
      chanting: false
    });
    setIsPlaying(false);
    setSleepTimer(null);
  };

  const toggleLayer = (id: string, engineKey: string) => {
    if (!engineRef.current) return;

    let isNowActive = false;
    if (engineKey === 'drone') {
      if (activeLayers.drone) {
        engineRef.current.stopTrackDrone();
      } else {
        engineRef.current.playTrackDrone('Universal', ['inner-peace']);
      }
      isNowActive = !activeLayers.drone;
    } else {
      isNowActive = engineRef.current.toggleExtendedAmbient(engineKey);
    }

    setActiveLayers(prev => {
      const updated = { ...prev, [id]: isNowActive };
      const anyActive = Object.values(updated).some(val => val);
      setIsPlaying(anyActive);
      return updated;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const soundLayers: { id: string; label: string; key: string; icon: any }[] = [
    { id: 'drone', label: 'Spiritual Drone', key: 'drone', icon: 'om' },
    { id: 'bells', label: 'Temple Bells', key: 'bells', icon: 'bell' },
    { id: 'birds', label: 'Forest Birds', key: 'birds', icon: 'leaf' },
    { id: 'river', label: 'Sacred River', key: 'river', icon: 'droplet' },
    { id: 'rain', label: 'Raindrops', key: 'rain', icon: 'droplet' },
    { id: 'wind', label: 'Mountain Wind', key: 'wind', icon: 'wind' },
    { id: 'conch', label: 'Sacred Conch', key: 'conch', icon: 'star' },
    { id: 'chanting', label: 'Vedic Chanting', key: 'chanting', icon: 'users' },
  ];

  return (
    <div className="fixed bottom-6 left-6 z-40">
      
      {/* Floating Trigger Button (Temple Bell with sway motion) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-110 border ${
          isPlaying 
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/30 border-amber-400' 
            : 'bg-white text-stone-700 hover:text-primary border-stone-200 shadow-stone-200/50'
        }`}
        aria-label="Toggle Sacred Ambience Player"
      >
        <div className={isPlaying ? 'animate-bell-shake' : ''}>
          <Icon name="bell" className="w-8 h-8" />
        </div>
      </button>

      {/* Slide-out Player Dashboard (Sandalwood / brass aesthetics) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className="absolute bottom-20 left-0 bg-[#FAF6EE] border-2 border-[#C3A150]/30 rounded-[2rem] shadow-[0_20px_50px_rgba(27,24,18,0.15)] p-6 w-[320px] md:w-[360px] text-ink relative"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-[#C3A150]/20 mb-4">
              <div>
                <h3 className="font-bold text-lg text-copper">Sacred Ambience</h3>
                <p className="text-[10px] text-stone-500 uppercase tracking-widest font-mono">Mix Devotional Channels</p>
              </div>
              {isPlaying && (
                <button 
                  onClick={handleStopAll}
                  className="px-3 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200/50"
                >
                  Mute All
                </button>
              )}
            </div>

            {/* Mix Sound Layers */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {soundLayers.map(layer => {
                const isActive = activeLayers[layer.id];
                return (
                  <button
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id, layer.key)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-[#C3A150]/60 text-primary font-bold shadow-sm' 
                        : 'bg-white border-stone-200/70 text-stone-600 hover:border-primary/20 hover:bg-stone-50/50'
                    }`}
                  >
                    <Icon name={layer.icon} className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-stone-400'}`} />
                    <span className="text-xs truncate">{layer.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Volume Control (Brass Rod slider style) */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center text-xs text-stone-500">
                <span>Volume</span>
                <span className="font-mono">{masterVolume}%</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-amber-900/15 rounded-lg appearance-none cursor-pointer accent-[#C3A150]"
                  style={{
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Sleep Timer */}
            <div className="border-t border-[#C3A150]/20 pt-4 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs text-stone-500">
                <span>Sleep Timer</span>
                {timeLeft !== null && (
                  <span className="font-mono text-primary font-bold">{formatTime(timeLeft)} left</span>
                )}
              </div>
              <div className="flex gap-2">
                {[10, 20, 30, 60].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setSleepTimer(sleepTimer === mins ? null : mins)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      sleepTimer === mins
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Devotional Note */}
            <div className="text-[10px] text-stone-400/80 text-center mt-6">
              🕉️ Synthesized locally with warm analog lowpass filtering.
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
