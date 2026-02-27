
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, I18nContent, SpiritualGrowthData, LifetimeStats, TaskType, ChakraTheme } from '../types';
import * as api from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import { DailyTasks } from './DailyTasks';
import { StatCard } from './StatCard';
import { Icon } from './Icon';
import { ACHIEVEMENTS_DATA, CHAKRA_DATA, CHAKRA_MEDITATION_DATA } from '../constants';
import { AchievementCard } from './AchievementCard';
import { useTheme } from '../contexts/ThemeContext';

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
    <div className="animate-pulse w-full h-full flex items-center justify-center">
        <div className="w-96 h-96 bg-gray-300/20 rounded-full"></div>
    </div>
);


export const ChakraSanctuary = ({ user, t }: ChakraSanctuaryProps) => {
    const [growthData, setGrowthData] = useState<SpiritualGrowthData | null>(null);
    const [lifetimeStats, setLifetimeStats] = useState<LifetimeStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeChakraId, setActiveChakraId] = useState<number | null>(null);
    const [isGuidedMode, setIsGuidedMode] = useState(false);
    const [guidedIndex, setGuidedIndex] = useState(0);
    const [narration, setNarration] = useState<{ mantra: string; text: string; } | null>(null);
    const [isStatsPanelOpen, setIsStatsPanelOpen] = useState(false);

    const { addToast } = useToast();
    const { setTheme } = useTheme();

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const synthRef = useRef(window.speechSynthesis);
    const guidedModeTimer = useRef<number | null>(null);

    const stopAll = useCallback(() => {
        setIsGuidedMode(false);
        setActiveChakraId(null);
        setGuidedIndex(0);
        setNarration(null);
        if (audioRef.current) {
            audioRef.current.pause();
        }
        if (synthRef.current.speaking) {
            synthRef.current.cancel();
        }
        if (guidedModeTimer.current) {
            clearTimeout(guidedModeTimer.current);
            guidedModeTimer.current = null;
        }
    }, []);

    useEffect(() => {
        audioRef.current = new Audio();
        // Return a cleanup function for component unmount
        return () => {
            stopAll();
        };
    }, [stopAll]);

    const playChakraSequence = useCallback((chakraId: number) => {
        const chakra = CHAKRA_MEDITATION_DATA.find(c => c.id === chakraId);
        if (!chakra) return;

        stopAll();
        setTheme(chakra.themeName);

        setActiveChakraId(chakra.id);
        setNarration({ mantra: chakra.mantra, text: `${chakra.name}: ${chakra.voiceover}` });

        if (audioRef.current) {
            audioRef.current.src = chakra.audioUrl;
            audioRef.current.load(); // Explicitly load the new source
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    if (e.name !== 'AbortError') {
                        console.error(`Audio failed for ${chakra.name}:`, e);
                    }
                });
            }
        }

        const utterance = new SpeechSynthesisUtterance(chakra.voiceover);
        const voices = synthRef.current.getVoices();
        utterance.voice = voices.find(v => v.lang.startsWith('en-IN')) || voices.find(v => v.lang.startsWith('en-US')) || null;
        utterance.rate = 0.9;
        synthRef.current.speak(utterance);
    }, [stopAll, setTheme]);


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
            guidedModeTimer.current = window.setTimeout(() => {
                setGuidedIndex(prev => prev + 1);
            }, 7000);

            return () => { if (guidedModeTimer.current) clearTimeout(guidedModeTimer.current) };
        } else if (isGuidedMode && guidedIndex > CHAKRA_MEDITATION_DATA.length) {
            stopAll();
        }
    }, [isGuidedMode, guidedIndex, playChakraSequence, stopAll]);

    useEffect(() => {
        if (user) {
            const fetchJourneyData = async () => {
                setIsLoading(true);
                try {
                    const [growth, stats] = await Promise.all([
                        api.checkAndResetStreak(user.id),
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
            const updatedData = await api.completeSpiritualTask(user.id, taskType);
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
        <div className="relative h-full w-full bg-[#03050a] cyber-grid-bg flex flex-col items-center justify-center text-white overflow-hidden p-4">

            {/* Ambient Tech Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] mix-blend-screen animate-cyber-pulse"></div>
            </div>

            {/* Meditating Figure and Chakras */}
            <div className="relative z-10 w-full h-[80vh] max-w-lg flex items-center justify-center">

                {/* Sushumna Nadi - Futuristic Energy Beam */}
                <div className="absolute top-[20%] bottom-[15%] left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-tech-scan" />

                {CHAKRA_MEDITATION_DATA.map(chakra => {
                    const isActive = activeChakraId === chakra.id;
                    const isUnlocked = unlockedChakraId >= chakra.id || !user;

                    const buttonStyle: any = {
                        borderColor: isActive ? chakra.color : (isUnlocked ? chakra.color : 'rgba(255,255,255,0.2)'),
                        color: chakra.color,
                        boxShadow: isActive ? `0 0 20px ${chakra.color}, inset 0 0 10px ${chakra.color}` : 'none'
                    };

                    if (isActive && chakra.color) {
                        const rgbVal = hexToRgbVal(chakra.color);
                        if (rgbVal) {
                            buttonStyle['--active-chakra-color-val'] = rgbVal;
                        }
                    }

                    return (
                        <div key={chakra.id} className="absolute left-1/2 -translate-x-1/2 transition-all duration-700" style={{ top: chakra.top }}>
                            <div className={`relative w-24 h-24 flex items-center justify-center group ${isActive ? chakra.animationClass : ''}`}>

                                {/* Futuristic Rotating Ring */}
                                {isUnlocked && (
                                    <div className="absolute inset-0 rounded-full border border-dashed opacity-50 animate-hologram-spin pointer-events-none" style={{ borderColor: chakra.color }}></div>
                                )}

                                {/* Intense Glow behind active chakra */}
                                {isActive && (
                                    <div className="absolute inset-0 rounded-full blur-xl mix-blend-screen animate-cyber-pulse pointer-events-none" style={{ backgroundColor: chakra.color }}></div>
                                )}

                                <button
                                    onClick={() => handleChakraClick(chakra.id)}
                                    className={`relative z-10 w-14 h-14 rounded-full border-[1.5px] bg-black/60 backdrop-blur-md flex items-center justify-center transition-all duration-500 hover:scale-110 ${isUnlocked ? 'hover:shadow-[0_0_20px_currentColor]' : 'grayscale opacity-50'} ${isActive ? 'scale-110' : ''}`}
                                    style={buttonStyle}
                                >
                                    <img src={chakra.symbol} alt={`${chakra.name} symbol`} className={`w-10 h-10 invert transition-all duration-500 ${isActive ? 'drop-shadow-[0_0_8px_white] brightness-200' : 'brightness-150'}`} />
                                </button>

                                {/* Tooltip / Node Label (Cyber style) */}
                                <div className={`absolute left-full ml-4 px-3 py-1 bg-black/80 border border-white/20 rounded text-[10px] font-mono tracking-widest uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${isActive ? 'opacity-100 border-l-2' : ''}`} style={isActive ? { borderLeftColor: chakra.color, textShadow: `0 0 5px ${chakra.color}` } : {}}>
                                    {chakra.name}
                                </div>
                            </div>
                        </div>
                    )
                })}
                {isLoading && user && <SanctuarySkeleton />}
            </div>

            {/* Futuristic HUD (Heads Up Display) */}
            <div className="absolute bottom-6 w-full max-w-4xl text-center space-y-6 px-4 z-20">

                {/* Narration Panel */}
                <div className="h-28 flex flex-col items-center justify-center p-4 glass-hud rounded-2xl relative overflow-hidden transition-all duration-500" style={{ borderBottom: `2px solid ${activeChakraColor || 'rgba(255,255,255,0.1)'}` }}>
                    {/* Scanline effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[200%] animate-tech-scan pointer-events-none"></div>

                    {narration ? (
                        <div className="animate-fade-in relative z-10">
                            <p className="text-5xl font-bold font-serif tracking-widest drop-shadow-[0_0_15px_currentColor]" style={{ color: activeChakraColor }}>{narration.mantra}</p>
                            <p className="text-xs font-mono tracking-widest text-white/70 mt-3 uppercase">{narration.text}</p>
                        </div>
                    ) : (
                        <div className="animate-fade-in relative z-10 flex flex-col items-center">
                            <Icon name="leaf" className="w-6 h-6 text-white/30 mb-2" />
                            <p className="font-mono text-xs tracking-[0.2em] text-white/50 uppercase">Initialize Bio-Spiritual Interface. Select a Node.</p>
                        </div>
                    )}
                </div>

                {/* Cyber Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {user && (
                        <button onClick={() => setIsStatsPanelOpen(!isStatsPanelOpen)} className="w-full sm:w-auto btn-cyber">
                            <span className="relative z-10 flex items-center gap-2">
                                <Icon name="clipboard-list" className="w-4 h-4" /> System Stats
                            </span>
                        </button>
                    )}
                    {!isGuidedMode ? (
                        <button onClick={startGuidedMode} className="w-full sm:w-auto btn-cyber border-primary text-primary hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(180,83,9,0.5)]">
                            <span className="relative z-10 flex items-center gap-2">
                                <Icon name="play" className="w-4 h-4" /> Auto-Sequence
                            </span>
                        </button>
                    ) : (
                        <button onClick={stopAll} className="w-full sm:w-auto btn-cyber border-red-500 text-red-500 hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                            <span className="relative z-10 flex items-center gap-2">
                                <Icon name="stop-circle" className="w-4 h-4" /> Terminate Link
                            </span>
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
        </div>
    );
};
