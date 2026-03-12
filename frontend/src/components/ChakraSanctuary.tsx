
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, I18nContent, SpiritualGrowthData, LifetimeStats, TaskType, ChakraTheme } from '../types';
import * as api from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import { DailyTasks } from './DailyTasks';
import { StatCard } from './StatCard';
import { Icon } from './Icon';
import { ACHIEVEMENTS_DATA, CHAKRA_DATA, CHAKRA_MEDITATION_DATA, CHAKRA_FREQUENCIES } from '../constants';
import { AchievementCard } from './AchievementCard';
import { useTheme } from '../contexts/ThemeContext';
import { MeditationZone } from './MeditationZone';
import { ChakraName } from '../types';

interface ChakraSanctuaryProps {
    user: User | null;
    t: I18nContent;
}

const levelToChakraMap: { [level: number]: string } = {
    1: 'Muladhara', 2: 'Muladhara',
    3: 'Swadhisthana', 4: 'Swadhisthana',
    5: 'Manipura', 6: 'Manipura',
    7: 'Anahata', 8: 'Anahata',
    9: 'Vishuddha', 10: 'Vishuddha',
    11: 'Ajna', 12: 'Ajna',
};

const getChakraForLevel = (level: number): ChakraTheme => {
    const chakraName = levelToChakraMap[level] || 'Sahasrara';
    return CHAKRA_DATA.find(c => c.name === chakraName)!;
};

const hexToRgbVal = (hex: string): string | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : null;
};

const SanctuarySkeleton = () => (
    <div className="w-full h-full flex flex-col items-center justify-center space-y-8 animate-pulse">
        {/* Skeleton for central Chakra Ring */}
        <div className="relative w-72 h-72 md:w-96 md:h-96">
            <div className="absolute inset-0 rounded-full border-4 border-gray-500/20 animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute inset-4 rounded-full border-2 border-gray-400/10 animate-[spin_15s_linear_infinite_reverse]"></div>
            <div className="absolute inset-1/4 rounded-full bg-gray-400/20 flex flex-col items-center justify-center p-4">
                <div className="w-8 h-8 rounded bg-gray-300/30 mb-2"></div>
                <div className="w-24 h-4 rounded bg-gray-300/30"></div>
            </div>

            {/* Skeleton for orbital nodes */}
            {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="absolute w-12 h-12 rounded-full border border-gray-400/30 bg-gray-500/10"
                    style={{
                        top: '50%', left: '50%',
                        transform: `translate(-50%, -50%) rotate(${i * (360 / 7)}deg) translateY(-140px)`
                    }}
                ></div>
            ))}
        </div>

        {/* Skeleton for bottom controls */}
        <div className="flex gap-4 opacity-50">
            <div className="w-32 h-12 bg-gray-500/20 rounded-full"></div>
            <div className="w-32 h-12 bg-gray-500/20 rounded-full"></div>
        </div>
    </div>
);


const GUIDED_SECONDS_PER_CHAKRA = 60; // 60 seconds per chakra for real meditation

// --- Solfeggio Frequency Audio Engine (Web Audio API) ---
class ChakraAudioEngine {
    private ctx: AudioContext | null = null;
    private oscillator: OscillatorNode | null = null;
    private gainNode: GainNode | null = null;
    private lfoGain: GainNode | null = null;

    start(frequency: number, muted: boolean) {
        this.stop();
        this.ctx = new AudioContext();
        this.oscillator = this.ctx.createOscillator();
        this.gainNode = this.ctx.createGain();
        this.lfoGain = this.ctx.createGain();

        // Create a subtle LFO for a gentle pulsing/warm effect
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.15; // Very slow pulse — breathlike
        lfo.connect(this.lfoGain);
        this.lfoGain.gain.value = 0.06; // Slight modulation depth

        // Main tone — sine wave at solfeggio frequency
        this.oscillator.type = 'sine';
        this.oscillator.frequency.value = frequency;

        // Second harmonic for richness (one octave above, quieter)
        const harmonic = this.ctx.createOscillator();
        harmonic.type = 'sine';
        harmonic.frequency.value = frequency * 2;
        const harmonicGain = this.ctx.createGain();
        harmonicGain.gain.value = 0.08;
        harmonic.connect(harmonicGain);
        harmonicGain.connect(this.gainNode);

        this.oscillator.connect(this.gainNode);
        this.lfoGain.connect(this.gainNode.gain); // LFO modulates volume
        this.gainNode.connect(this.ctx.destination);

        // Gentle fade in over 3 seconds
        this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
        this.gainNode.gain.linearRampToValueAtTime(muted ? 0 : 0.18, this.ctx.currentTime + 3);

        this.oscillator.start();
        harmonic.start();
        lfo.start();
    }

    setMuted(muted: boolean) {
        if (this.gainNode && this.ctx) {
            this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
            this.gainNode.gain.linearRampToValueAtTime(muted ? 0 : 0.18, this.ctx.currentTime + 0.5);
        }
    }

    stop() {
        if (this.oscillator) {
            try {
                if (this.gainNode && this.ctx) {
                    this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
                }
                setTimeout(() => {
                    try { this.oscillator?.stop(); } catch {}
                    try { this.ctx?.close(); } catch {}
                    this.oscillator = null;
                    this.ctx = null;
                    this.gainNode = null;
                    this.lfoGain = null;
                }, 1200);
            } catch {
                this.oscillator = null;
                this.ctx = null;
            }
        }
    }
}

export const ChakraSanctuary = ({ user, t }: ChakraSanctuaryProps) => {
    const [growthData, setGrowthData] = useState<SpiritualGrowthData | null>(null);
    const [lifetimeStats, setLifetimeStats] = useState<LifetimeStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeChakraId, setActiveChakraId] = useState<number | null>(null);
    const [isGuidedMode, setIsGuidedMode] = useState(false);
    const [guidedIndex, setGuidedIndex] = useState(0);
    const [isStatsPanelOpen, setIsStatsPanelOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isMuted, setIsMuted] = useState(false); // Start unmuted for immersion
    const [activeTab, setActiveTab] = useState<'chakra' | 'meditation'>('chakra');

    // New narration state — line-by-line voiceover
    const [currentMantra, setCurrentMantra] = useState<string | null>(null);
    const [sanskritMantra, setSanskritMantra] = useState<string | null>(null);
    const [currentLine, setCurrentLine] = useState<string>('');
    const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | null>(null);

    const { addToast } = useToast();
    const { setTheme } = useTheme();

    const audioEngineRef = useRef<ChakraAudioEngine>(new ChakraAudioEngine());
    const synthRef = useRef(window.speechSynthesis);
    const guidedModeTimer = useRef<number | null>(null);
    const countdownTimer = useRef<number | null>(null);
    const voiceoverTimers = useRef<number[]>([]);
    const breathTimer = useRef<number | null>(null);

    // --- Stop Everything ---
    const stopAll = useCallback(() => {
        setIsGuidedMode(false);
        setActiveChakraId(null);
        setGuidedIndex(0);
        setCurrentMantra(null);
        setSanskritMantra(null);
        setCurrentLine('');
        setBreathPhase(null);
        setTimeLeft(null);

        audioEngineRef.current.stop();

        if (synthRef.current.speaking) synthRef.current.cancel();

        if (guidedModeTimer.current) { clearTimeout(guidedModeTimer.current); guidedModeTimer.current = null; }
        if (countdownTimer.current) { clearInterval(countdownTimer.current); countdownTimer.current = null; }
        if (breathTimer.current) { clearInterval(breathTimer.current); breathTimer.current = null; }
        voiceoverTimers.current.forEach(t => clearTimeout(t));
        voiceoverTimers.current = [];
    }, []);

    // --- Mute/Unmute ---
    useEffect(() => {
        audioEngineRef.current.setMuted(isMuted);
    }, [isMuted]);

    // --- Cleanup on unmount ---
    useEffect(() => {
        return () => { stopAll(); };
    }, [stopAll]);

    // --- Select the sweetest available voice ---
    const getBhaktiVoice = useCallback(() => {
        const voices = synthRef.current.getVoices();
        // Prefer Indian English female voice for bhakti sweetness
        return voices.find(v => v.lang === 'en-IN' && v.name.toLowerCase().includes('female'))
            || voices.find(v => v.lang === 'en-IN')
            || voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
            || voices.find(v => v.lang.startsWith('en-GB'))
            || voices.find(v => v.lang.startsWith('en-US'))
            || null;
    }, []);

    // --- Speak a single line with sweet bhakti settings ---
    const speakLine = useCallback((text: string, onEnd?: () => void) => {
        if (isMuted) { onEnd?.(); return; }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = getBhaktiVoice();
        utterance.rate = 0.72;   // Slow, contemplative pace
        utterance.pitch = 0.92;  // Slightly deeper — warm and soothing
        utterance.volume = 1.0;
        if (onEnd) utterance.onend = onEnd;
        synthRef.current.speak(utterance);
    }, [isMuted, getBhaktiVoice]);

    // --- Breathing cycle ---
    const startBreathingCycle = useCallback(() => {
        if (breathTimer.current) clearInterval(breathTimer.current);
        let phase = 0; // 0=inhale(4s), 1=hold(4s), 2=exhale(6s)
        const phases: Array<{ name: 'inhale' | 'hold' | 'exhale'; duration: number }> = [
            { name: 'inhale', duration: 4000 },
            { name: 'hold', duration: 4000 },
            { name: 'exhale', duration: 6000 },
        ];
        setBreathPhase(phases[0].name);
        breathTimer.current = window.setInterval(() => {
            phase = (phase + 1) % 3;
            setBreathPhase(phases[phase].name);
        }, phases[phase].duration);
    }, []);

    // --- Play Chakra Sequence (core meditation engine) ---
    const playChakraSequence = useCallback((chakraId: number) => {
        const chakra = CHAKRA_MEDITATION_DATA.find(c => c.id === chakraId);
        if (!chakra) return;

        // Clear previous voiceover timers
        voiceoverTimers.current.forEach(t => clearTimeout(t));
        voiceoverTimers.current = [];
        if (synthRef.current.speaking) synthRef.current.cancel();

        setTheme(chakra.themeName);
        setActiveChakraId(chakra.id);
        setCurrentMantra(chakra.mantra);
        setSanskritMantra(chakra.sanskritMantra);
        setCurrentLine('');
        setTimeLeft(GUIDED_SECONDS_PER_CHAKRA);

        // Start solfeggio frequency tone
        audioEngineRef.current.stop();
        setTimeout(() => {
            audioEngineRef.current.start(chakra.frequency, isMuted);
        }, 300);

        // Start breathing cycle
        startBreathingCycle();

        // Line-by-line voiceover with timed delays
        const lines = chakra.voiceoverLines;
        const lineDelay = (GUIDED_SECONDS_PER_CHAKRA * 1000) / (lines.length + 1);

        lines.forEach((line, i) => {
            const timer = window.setTimeout(() => {
                setCurrentLine(line);
                speakLine(line);
            }, i * lineDelay + 1500); // Start after 1.5s initial pause
            voiceoverTimers.current.push(timer);
        });

    }, [setTheme, isMuted, startBreathingCycle, speakLine]);


    const handleChakraClick = (chakraId: number) => {
        if (isGuidedMode) stopAll();
        playChakraSequence(chakraId);
    };

    const startGuidedMode = () => {
        stopAll();
        setIsGuidedMode(true);
        setGuidedIndex(1);
    };

    useEffect(() => {
        if (isGuidedMode && guidedIndex > 0 && guidedIndex <= CHAKRA_MEDITATION_DATA.length) {
            playChakraSequence(guidedIndex);

            if (countdownTimer.current) clearInterval(countdownTimer.current);
            countdownTimer.current = window.setInterval(() => {
                setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
            }, 1000);

            guidedModeTimer.current = window.setTimeout(() => {
                setGuidedIndex(prev => prev + 1);
            }, GUIDED_SECONDS_PER_CHAKRA * 1000);

            return () => {
                if (guidedModeTimer.current) clearTimeout(guidedModeTimer.current);
                if (countdownTimer.current) clearInterval(countdownTimer.current);
            };
        } else if (isGuidedMode && guidedIndex > CHAKRA_MEDITATION_DATA.length) {
            stopAll();
            addToast('Om Shanti! Your chakra ascension is complete. Namaste. 🙏', 'success');
        }
    }, [isGuidedMode, guidedIndex, playChakraSequence, stopAll, addToast]);

    useEffect(() => {
        if (user) {
            const fetchJourneyData = async () => {
                setIsLoading(true);
                try {
                    const [growth, stats] = await Promise.all([
                        api.checkAndResetStreak(user.id, user.token),
                        api.getLifetimeStats(user.id, user.token!)
                    ]);
                    setGrowthData(growth);
                    setLifetimeStats(stats);
                } catch (error) {
                    if (error instanceof Error) addToast(`Failed to load journey: ${error.message}`, 'error');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchJourneyData();
        } else {
            setIsLoading(false);
            setGrowthData(null);
            setLifetimeStats(null);
        }
    }, [user, addToast]);

    const handleToggleTask = async (taskType: TaskType) => {
        if (!user) return;
        try {
            const updatedData = await api.completeSpiritualTask(user.id, taskType, user.token);
            setGrowthData(updatedData);
            addToast(`Task completed! +50 XP`, 'success');
        } catch (error) {
            if (error instanceof Error) addToast(error.message, 'error');
        }
    };

    const unlockedChakra = growthData ? getChakraForLevel(growthData.level) : null;
    const unlockedChakraId = unlockedChakra ? unlockedChakra.id : 0;

    const activeChakraColor = activeChakraId ? CHAKRA_MEDITATION_DATA.find(c => c.id === activeChakraId)?.color : 'white';

    return (
        <div className="relative h-full w-full bg-slate-950 flex flex-col items-center text-white overflow-hidden font-sans selection:bg-fuchsia-500/30">

            {/* === TAB TOGGLE === */}
            <div className="relative z-30 w-full flex justify-center pt-4 pb-2 px-4">
                <div className="flex bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-lg">
                    <button
                        onClick={() => { setActiveTab('chakra'); if (activeTab !== 'chakra') stopAll(); }}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 flex items-center gap-2 ${activeTab === 'chakra'
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                            : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                            }`}
                    >
                        <Icon name="chakra" className="w-4 h-4" />
                        Chakra Healing
                    </button>
                    <button
                        onClick={() => setActiveTab('meditation')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 flex items-center gap-2 ${activeTab === 'meditation'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30'
                            : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                            }`}
                    >
                        <Icon name="meditate" className="w-4 h-4" />
                        Meditation Zone
                    </button>
                </div>
            </div>

            {/* === MEDITATION ZONE TAB === */}
            {activeTab === 'meditation' && (
                <div className="w-full h-full overflow-y-auto">
                    <MeditationZone t={t} />
                </div>
            )}

            {/* === CHAKRA HEALING TAB === */}
            {activeTab === 'chakra' && (
                <>

                    {/* Deep Ethereal Background */}
                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-black"></div>

                        {/* Dynamic Ambient Glow tied to active chakra */}
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] sm:w-[800px] sm:h-[800px] rounded-full blur-[120px] mix-blend-screen opacity-50 transition-colors duration-1000 ease-in-out"
                            style={{ backgroundColor: activeChakraColor || '#4338ca' }}
                        />

                        {/* Subtle Starfield / Dust effect */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
                    </div>

                    {/* Meditating Figure and Chakras Container */}
                    <div className="relative z-10 w-full h-[70vh] max-w-lg flex items-center justify-center mt-[-10vh]">

                        {/* Ethereal Meditating Shiva Background (Shadow Silhouette) */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                            <img
                                src="/assets/shiva-meditating.png"
                                alt="Lord Shiva Meditating Shadow"
                                className="w-full h-[120%] object-contain transition-all duration-1000 ease-out opacity-25"
                                style={{
                                    filter: `brightness(0) drop-shadow(0 0 40px ${activeChakraColor !== 'white' ? activeChakraColor : 'rgba(255,255,255,0.5)'}) drop-shadow(0 0 80px ${activeChakraColor !== 'white' ? activeChakraColor : 'rgba(255,255,255,0.2)'})`,
                                    transform: activeChakraId ? 'scale(1.1) translateY(-5%)' : 'scale(1.05) translateY(-5%)'
                                }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://i.ibb.co/L5Q5bXj/shiva-silhouette.png';
                                }}
                            />
                        </div>

                        {/* Ethereal Central Energy Pillar */}
                        <div
                            className="absolute top-[10%] bottom-[10%] left-1/2 -translate-x-1/2 w-[3px] rounded-full blur-[1px] shadow-[0_0_30px_rgba(255,255,255,0.8)] transition-all duration-1000 ease-in-out z-10"
                            style={{
                                background: `linear-gradient(to bottom, transparent, ${activeChakraColor !== 'white' ? activeChakraColor : 'rgba(255,255,255,0.5)'}, transparent)`,
                                boxShadow: `0 0 20px ${activeChakraColor !== 'white' ? activeChakraColor : 'white'}, 0 0 60px ${activeChakraColor !== 'white' ? activeChakraColor : 'white'}`
                            }}
                        />

                        {CHAKRA_MEDITATION_DATA.map(chakra => {
                            const isActive = activeChakraId === chakra.id;
                            const isUnlocked = unlockedChakraId >= chakra.id || !user;

                            const buttonStyle: any = {
                                borderColor: isActive ? chakra.color : (isUnlocked ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'),
                                color: chakra.color,
                                boxShadow: isActive ? `0 0 40px ${chakra.color}, inset 0 0 20px ${chakra.color}` : 'none',
                                background: isActive ? `radial-gradient(circle at center, ${chakra.color}40 0%, transparent 70%)` : 'rgba(10, 10, 15, 0.6)'
                            };

                            return (
                                <div key={chakra.id} className="absolute left-1/2 -translate-x-1/2 transition-all duration-1000 ease-out z-20" style={{ top: chakra.top }}>
                                    <div className={`relative w-28 h-28 flex items-center justify-center group ${isActive ? 'scale-125' : 'scale-100 hover:scale-110'} transition-transform duration-500`}>

                                        {/* Expanding Aura Rings */}
                                        {isActive && (
                                            <>
                                                <div className="absolute inset-0 rounded-full border-[2px] opacity-0 animate-ping shadow-xl pointer-events-none" style={{ borderColor: chakra.color, animationDuration: '3s' }}></div>
                                                <div className="absolute inset-[-20%] rounded-full border border-dashed opacity-30 animate-spin-slow pointer-events-none" style={{ borderColor: chakra.color }}></div>
                                            </>
                                        )}

                                        <button
                                            onClick={() => handleChakraClick(chakra.id)}
                                            className={`relative z-10 w-16 h-16 rounded-full border backdrop-blur-xl flex items-center justify-center transition-all duration-500 overflow-hidden ${isUnlocked ? 'cursor-pointer hover:border-white/40' : 'grayscale opacity-30 cursor-not-allowed'}`}
                                            style={buttonStyle}
                                            disabled={!isUnlocked}
                                        >
                                            {/* Glass Reflection */}
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/5 to-white/20 z-0"></div>

                                            <img
                                                src={chakra.symbol}
                                                alt={`${chakra.name} symbol`}
                                                className={`w-10 h-10 object-contain z-10 invert transition-all duration-500 ${isActive ? 'drop-shadow-[0_0_12px_white] brightness-200' : 'opacity-80'}`}
                                            />
                                        </button>

                                        {/* Floating Label */}
                                        <div className={`absolute left-[calc(100%+1.5rem)] px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-lg text-xs font-medium tracking-[0.2em] uppercase whitespace-nowrap shadow-2xl transition-all duration-500 pointer-events-none
                                    ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0'}
                                `}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full shadow-lg" style={{ backgroundColor: chakra.color, boxShadow: `0 0 10px ${chakra.color}` }}></div>
                                                <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent drop-shadow-sm">{chakra.name}</span>
                                            </div>
                                            {isActive && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 border-l border-b border-white/10 bg-slate-900/80"></div>}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        {isLoading && user && <SanctuarySkeleton />}
                    </div>

                    {/* Premium Control Center & HUD */}
                    <div className="absolute bottom-6 w-full max-w-5xl px-4 z-30 flex flex-col items-center">

                        {/* Active Narration Display — Advanced Layout */}
                        <div
                            className={`w-full max-w-2xl backdrop-blur-2xl bg-slate-900/70 rounded-3xl border transition-all duration-700 overflow-hidden relative shadow-2xl mb-5 flex flex-col items-center justify-center
                        ${currentMantra ? 'opacity-100 min-h-[10rem] border-white/20' : 'opacity-70 h-24 border-white/5'}
                    `}
                            style={currentMantra ? { boxShadow: `0 10px 40px -10px ${activeChakraColor}60, inset 0 0 30px ${activeChakraColor}15` } : {}}
                        >
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

                            {/* Breathing indicator bar */}
                            {breathPhase && currentMantra && (
                                <div className="absolute top-0 left-0 w-full h-1 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${breathPhase === 'inhale' ? 'animate-[breatheIn_4s_ease-in-out_forwards]' : breathPhase === 'exhale' ? 'animate-[breatheOut_6s_ease-in-out_forwards]' : 'w-full'}`}
                                        style={{ backgroundColor: activeChakraColor || '#fff' }}
                                    />
                                </div>
                            )}

                            {currentMantra ? (
                                <div className="text-center px-6 py-5 w-full relative">
                                    {/* Timer + Frequency + Breathing */}
                                    <div className="flex items-center justify-between mb-3 px-2">
                                        {/* Frequency badge */}
                                        <span className="text-[10px] tracking-[0.15em] uppercase font-mono text-white/30 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: activeChakraColor || '#fff' }}></span>
                                            {activeChakraId ? `${CHAKRA_FREQUENCIES[CHAKRA_MEDITATION_DATA.find(c => c.id === activeChakraId)?.name as ChakraName || 'Muladhara']} Hz Solfeggio` : ''}
                                        </span>

                                        {/* Breathing Guide */}
                                        {breathPhase && (
                                            <span className={`text-[10px] tracking-[0.2em] uppercase font-mono transition-all duration-1000 ${breathPhase === 'inhale' ? 'text-emerald-400' : breathPhase === 'exhale' ? 'text-sky-400' : 'text-amber-400'}`}>
                                                {breathPhase === 'inhale' ? '↑ Breathe In' : breathPhase === 'exhale' ? '↓ Breathe Out' : '· Hold ·'}
                                            </span>
                                        )}

                                        {/* Timer */}
                                        {timeLeft !== null && (
                                            <span className="text-lg font-mono text-white/40 font-light tracking-widest" style={{ textShadow: `0 0 8px ${activeChakraColor}` }}>
                                                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Sanskrit Bija Mantra — Large sacred text */}
                                    <p className="text-4xl md:text-6xl text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.4)] mb-1" style={{ textShadow: `0 0 25px ${activeChakraColor}, 0 0 50px ${activeChakraColor}40`, fontFamily: "'Noto Sans Devanagari', serif" }}>
                                        {sanskritMantra}
                                    </p>
                                    <p className="text-xs tracking-[0.3em] uppercase text-white/40 font-mono mb-3">{currentMantra}</p>

                                    {/* Current voiceover line — sweet animated text */}
                                    {currentLine && (
                                        <p key={currentLine} className="text-sm md:text-base font-medium tracking-wide text-slate-200/90 italic leading-relaxed animate-fade-in max-w-lg mx-auto" style={{ fontFamily: "'Georgia', serif" }}>
                                            "{currentLine}"
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center flex flex-col items-center opacity-60 py-6">
                                    <Icon name="meditate" className="w-8 h-8 mb-3 text-slate-400" />
                                    <p className="text-xs tracking-[0.2em] font-medium uppercase text-slate-400">Select a Chakra or begin Guided Ascent</p>
                                    <p className="text-[10px] text-slate-500 mt-1 tracking-wide">Real Solfeggio frequencies + Bhakti voice guidance</p>
                                </div>
                            )}
                        </div>

                        {/* Control Actions */}
                        <div className="flex flex-wrap items-center justify-center gap-4 w-full">
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 backdrop-blur-md text-sm font-medium tracking-wide transition-all shadow-lg flex items-center justify-center group"
                                title={isMuted ? "Unmute Om Chants" : "Mute Om Chants"}
                            >
                                <Icon name={isMuted ? "volume-off" : "volume-on"} className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                            </button>

                            {user && (
                                <button
                                    onClick={() => setIsStatsPanelOpen(!isStatsPanelOpen)}
                                    className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 backdrop-blur-md text-sm font-medium tracking-wide transition-all shadow-lg flex items-center gap-2 group"
                                >
                                    <Icon name="user-circle" className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                                    <span>My Journey</span>
                                </button>
                            )}

                            {!isGuidedMode ? (
                                <button
                                    onClick={startGuidedMode}
                                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border border-indigo-400/30 backdrop-blur-md text-sm font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] flex items-center gap-2 hover:-translate-y-1"
                                >
                                    <Icon name="play" className="w-4 h-4" />
                                    <span>Guided Ascent</span>
                                </button>
                            ) : (
                                <button
                                    onClick={stopAll}
                                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-900/80 to-rose-900/80 hover:from-red-800 hover:to-rose-800 text-rose-100 border border-red-500/30 backdrop-blur-md text-sm font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_30px_rgba(225,29,72,0.5)] flex items-center gap-2 hover:-translate-y-1"
                                >
                                    <Icon name="stop-circle" className="w-4 h-4" />
                                    <span>Conclude Session</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats Panel (Cyberpunk Variant) */}
                    <div className={`absolute inset-0 bg-black/90 z-30 transition-opacity duration-300 backdrop-blur-xl ${isStatsPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsStatsPanelOpen(false)}></div>
                    <div className={`absolute bottom-0 left-0 right-0 z-40 bg-[#0a0a0f] border-t border-primary/30 text-white p-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(180,83,9,0.2)] transition-transform duration-500 ease-in-out-cubic max-h-[85vh] overflow-y-auto custom-scrollbar ${isStatsPanelOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                        <div className="container mx-auto max-w-4xl relative">
                            <button onClick={() => setIsStatsPanelOpen(false)} className="absolute top-0 right-0 text-white/50 hover:text-primary transition-colors hover:rotate-90 duration-300">
                                <Icon name="x" className="w-8 h-8" />
                            </button>

                            <div className="mb-8 border-b border-white/10 pb-4 mt-8 md:mt-0">
                                <p className="text-primary font-mono text-xs tracking-widest uppercase mb-1">User Metrics</p>
                                <h2 className="text-3xl font-bold font-heading">{t.chakraSanctuaryTitle}</h2>
                            </div>

                            {growthData && lifetimeStats && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="glass-hud p-6 rounded-2xl border border-white/5">
                                        <h3 className="text-lg font-mono tracking-widest text-white/70 uppercase mb-4 flex items-center gap-2">
                                            <Icon name="check-circle" className="w-4 h-4" /> {t.dailySadhana}
                                        </h3>
                                        <DailyTasks tasks={growthData.dailyTasks} onToggleTask={handleToggleTask} t={t} />
                                    </div>
                                    <div className="glass-hud p-6 rounded-2xl border border-white/5">
                                        <h3 className="text-lg font-mono tracking-widest text-white/70 uppercase mb-4 flex items-center gap-2">
                                            <Icon name="clipboard-list" className="w-4 h-4" /> {t.lifetimeStats}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <StatCard title={t.templesVisited} value={lifetimeStats.templesVisited} icon={<Icon name="temple" className="w-5 h-5" />} />
                                            <StatCard title={t.poojasBooked} value={lifetimeStats.poojasBooked} icon={<Icon name="bell" className="w-5 h-5" />} />
                                            <StatCard title={t.sevaOffered} value={lifetimeStats.sevaOffered} icon={<Icon name="heart-hand" className="w-5 h-5" />} />
                                            <StatCard title={t.knowledgeRead} value={lifetimeStats.knowledgeRead} icon={<Icon name="book-open" className="w-5 h-5" />} />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 glass-hud p-6 rounded-2xl border border-white/5">
                                        <h3 className="text-lg font-mono tracking-widest text-white/70 uppercase mb-4 flex items-center gap-2">
                                            <Icon name="star" className="w-4 h-4" /> {t.achievements}
                                        </h3>
                                        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                                            {ACHIEVEMENTS_DATA.map(ach => (
                                                <AchievementCard key={ach.id} achievement={ach} unlocked={ach.condition(lifetimeStats, growthData)} t={t} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
