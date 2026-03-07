import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from './Icon';
import { I18nContent, IconName } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { MeditationAudioEngine } from '../utils/meditationAudio';

// --- Types ---
interface MeditationTrack {
    id: number;
    title: string;
    artist: string;
    deity: string;
    category: string;
    purpose: string[];
    duration: string;
    imageUrl: string;
    audioUrl: string;
    isFeatured: boolean;
    timeOfDay: string;
}

type MeditationPurpose = 'anxiety-relief' | 'deep-sleep' | 'morning-energy' | 'focus' | 'stress-relief' | 'inner-peace' | 'heart-healing' | 'positive-energy';

interface DayWise {
    day: string;
    deity: string;
    theme: string;
    gradient: string;
    iconBg: string;
    symbol: string;
}

interface FestivalPlaylist {
    id: string;
    name: string;
    emoji: string;
    gradient: string;
    tracks: number[];
}

// --- Constants ---
const DAY_WISE_DATA: DayWise[] = [
    { day: 'Monday', deity: 'Shiva', theme: 'Trident & Moon', gradient: 'from-blue-600 to-indigo-800', iconBg: 'bg-blue-500/20', symbol: '🔱' },
    { day: 'Tuesday', deity: 'Hanuman', theme: 'Mace & Fire', gradient: 'from-red-600 to-rose-800', iconBg: 'bg-red-500/20', symbol: '💪' },
    { day: 'Wednesday', deity: 'Ganesha', theme: 'Modak & Lotus', gradient: 'from-orange-500 to-amber-700', iconBg: 'bg-orange-500/20', symbol: '🐘' },
    { day: 'Thursday', deity: 'Vishnu', theme: 'Chakra & Gold', gradient: 'from-yellow-500 to-amber-600', iconBg: 'bg-yellow-500/20', symbol: '🌟' },
    { day: 'Friday', deity: 'Lakshmi', theme: 'Lotus & Pink', gradient: 'from-pink-500 to-rose-600', iconBg: 'bg-pink-500/20', symbol: '🪷' },
    { day: 'Saturday', deity: 'Shani', theme: 'Dark & Deep', gradient: 'from-slate-700 to-indigo-900', iconBg: 'bg-slate-500/20', symbol: '🪐' },
    { day: 'Sunday', deity: 'Surya', theme: 'Golden Sun', gradient: 'from-amber-400 to-orange-600', iconBg: 'bg-amber-500/20', symbol: '☀️' },
];

const PURPOSE_DATA: { id: MeditationPurpose; label: string; emoji: string; gradient: string; desc: string }[] = [
    { id: 'anxiety-relief', label: 'Anxiety Relief', emoji: '🧠', gradient: 'from-teal-500 to-cyan-600', desc: 'Calm your mind' },
    { id: 'deep-sleep', label: 'Deep Sleep', emoji: '😴', gradient: 'from-indigo-600 to-purple-800', desc: 'Restful night' },
    { id: 'morning-energy', label: 'Morning Energy', emoji: '🌅', gradient: 'from-orange-400 to-rose-500', desc: 'Energize your day' },
    { id: 'focus', label: 'Study / Focus', emoji: '📚', gradient: 'from-blue-500 to-indigo-600', desc: 'Sharpen concentration' },
    { id: 'stress-relief', label: 'Stress Relief', emoji: '💆', gradient: 'from-green-500 to-emerald-600', desc: 'Release tension' },
    { id: 'inner-peace', label: 'Inner Peace', emoji: '🧘', gradient: 'from-violet-500 to-purple-600', desc: 'Find serenity' },
    { id: 'heart-healing', label: 'Heart Healing', emoji: '💖', gradient: 'from-rose-500 to-pink-600', desc: 'Emotional balance' },
    { id: 'positive-energy', label: 'Positive Energy', emoji: '⚡', gradient: 'from-yellow-400 to-amber-500', desc: 'Uplift your spirit' },
];

const DEITY_DATA = [
    { deity: 'Shiva', emoji: '🕉', gradient: 'from-blue-600 to-indigo-700', label: 'Shiva Meditation' },
    { deity: 'Krishna', emoji: '🎵', gradient: 'from-blue-500 to-cyan-600', label: 'Krishna Bhajans' },
    { deity: 'Rama', emoji: '🏹', gradient: 'from-orange-500 to-amber-600', label: 'Ram Bhakti Music' },
    { deity: 'Durga', emoji: '🔥', gradient: 'from-red-600 to-rose-700', label: 'Shakti Mantras' },
    { deity: 'Ganesha', emoji: '🐘', gradient: 'from-orange-500 to-yellow-600', label: 'Ganesha Meditation' },
    { deity: 'Vishnu', emoji: '🌊', gradient: 'from-blue-700 to-indigo-800', label: 'Narayana Chants' },
    { deity: 'Hanuman', emoji: '💪', gradient: 'from-red-500 to-orange-600', label: 'Hanuman Meditation' },
    { deity: 'Lakshmi', emoji: '💰', gradient: 'from-yellow-400 to-amber-500', label: 'Prosperity Meditation' },
];

const FESTIVAL_PLAYLISTS: FestivalPlaylist[] = [
    { id: 'shivratri', name: 'Maha Shivratri', emoji: '🕉', gradient: 'from-blue-700 to-indigo-900', tracks: [1, 4, 7, 18] },
    { id: 'diwali', name: 'Diwali Bhajans', emoji: '🪔', gradient: 'from-amber-500 to-orange-700', tracks: [12, 15, 11] },
    { id: 'navratri', name: 'Navratri Devi Chants', emoji: '🌸', gradient: 'from-red-500 to-pink-700', tracks: [9, 5] },
    { id: 'janmashtami', name: 'Krishna Janmashtami', emoji: '🎂', gradient: 'from-blue-500 to-cyan-700', tracks: [2, 8] },
    { id: 'ramnavami', name: 'Ram Navami', emoji: '🏹', gradient: 'from-orange-500 to-amber-700', tracks: [15, 5] },
    { id: 'ganesh', name: 'Ganesh Chaturthi', emoji: '🐘', gradient: 'from-orange-400 to-yellow-600', tracks: [10] },
];

const AMBIENT_SOUNDS = [
    { id: 'bells', label: 'Temple Bells', emoji: '🔔' },
    { id: 'river', label: 'River Flow', emoji: '🌊' },
    { id: 'wind', label: 'Mountain Wind', emoji: '🌬️' },
    { id: 'om', label: 'Om Vibration', emoji: '🕉️' },
    { id: 'rain', label: 'Sacred Rain', emoji: '🌧️' },
    { id: 'birds', label: 'Forest Birds', emoji: '🐦' },
];

const TIMER_OPTIONS = [5, 10, 20, 30, 60];

// --- Sub Components ---

const FloatingLotus = ({ delay: d }: { delay: number }) => (
    <motion.div
        className="absolute text-2xl opacity-30 pointer-events-none select-none"
        initial={{ x: Math.random() * 100 + '%', y: '110%', rotate: 0, scale: 0.5 + Math.random() * 0.5 }}
        animate={{ y: '-10%', rotate: 360 * (Math.random() > 0.5 ? 1 : -1), opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 15 + Math.random() * 10, delay: d, repeat: Infinity, ease: 'linear' }}
    >
        🪷
    </motion.div>
);

const BreathingOrb = () => (
    <motion.div
        className="absolute w-48 h-48 rounded-full bg-gradient-to-br from-amber-400/10 to-orange-500/5 blur-3xl"
        animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '20%', left: '50%', transform: 'translateX(-50%)' }}
    />
);

// --- Main Component ---
interface MeditationZoneProps {
    t: I18nContent;
}

export const MeditationZone = ({ t }: MeditationZoneProps) => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();

    // State
    const [tracks, setTracks] = useState<MeditationTrack[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'home' | 'day' | 'deity' | 'purpose' | 'festival' | 'player' | 'timer' | 'personal'>('home');
    const [currentTrack, setCurrentTrack] = useState<MeditationTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedDay, setSelectedDay] = useState<DayWise | null>(null);
    const [selectedDeity, setSelectedDeity] = useState<string | null>(null);
    const [selectedPurpose, setSelectedPurpose] = useState<MeditationPurpose | null>(null);
    const [selectedFestival, setSelectedFestival] = useState<FestivalPlaylist | null>(null);
    const [favorites, setFavorites] = useState<number[]>(() => {
        try {
            const saved = localStorage.getItem('dharma-meditation-favorites');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [meditationHistory, setMeditationHistory] = useState<{ trackId: number; date: string; minutes: number }[]>(() => {
        try {
            const saved = localStorage.getItem('dharma-meditation-history');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [dailyStreak, setDailyStreak] = useState(() => {
        try {
            const saved = localStorage.getItem('dharma-meditation-streak');
            return saved ? JSON.parse(saved) : { count: 0, lastDate: '' };
        } catch { return { count: 0, lastDate: '' }; }
    });

    // Timer State
    const [timerMinutes, setTimerMinutes] = useState(10);
    const [timerActive, setTimerActive] = useState(false);
    const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);
    const [timerMode, setTimerMode] = useState<'silent' | 'bell' | 'mantra'>('bell');

    // Ambient Mix
    const [activeAmbients, setActiveAmbients] = useState<string[]>([]);

    // Player state
    const [playerProgress, setPlayerProgress] = useState(0);
    const playerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Audio engine
    const audioEngineRef = useRef<MeditationAudioEngine | null>(null);

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Initialize audio engine
    useEffect(() => {
        audioEngineRef.current = new MeditationAudioEngine();
        return () => {
            audioEngineRef.current?.destroy();
            audioEngineRef.current = null;
        };
    }, []);

    // Load data
    useEffect(() => {
        fetch('/data/meditation.json')
            .then(r => r.json())
            .then(data => {
                setTracks(data);
                setIsLoading(false);
            })
            .catch(() => {
                addToast('Could not load meditation tracks.', 'error');
                setIsLoading(false);
            });
    }, [addToast]);

    // Save favorites
    useEffect(() => {
        localStorage.setItem('dharma-meditation-favorites', JSON.stringify(favorites));
    }, [favorites]);

    // Save history
    useEffect(() => {
        localStorage.setItem('dharma-meditation-history', JSON.stringify(meditationHistory));
    }, [meditationHistory]);

    // Save streak
    useEffect(() => {
        localStorage.setItem('dharma-meditation-streak', JSON.stringify(dailyStreak));
    }, [dailyStreak]);

    // Timer logic
    useEffect(() => {
        if (!timerActive || timerSecondsLeft <= 0) return;
        const interval = setInterval(() => {
            setTimerSecondsLeft(prev => {
                if (prev <= 1) {
                    setTimerActive(false);
                    setIsPlaying(false);
                    audioEngineRef.current?.playSingingBowl();
                    addToast('🔔 Meditation timer complete. Namaste! 🙏', 'success');
                    logMeditationSession(timerMinutes);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [timerActive, timerSecondsLeft, timerMinutes, addToast]);

    // Audio playback & progress sync
    useEffect(() => {
        const engine = audioEngineRef.current;
        if (isPlaying && currentTrack) {
            // Start the audio drone
            engine?.playTrackDrone(currentTrack.deity, currentTrack.purpose);
            playerIntervalRef.current = setInterval(() => {
                setPlayerProgress(prev => (prev >= 100 ? 0 : prev + 0.1));
            }, 100);
        } else {
            engine?.stopTrackDrone();
            if (playerIntervalRef.current) {
                clearInterval(playerIntervalRef.current);
            }
        }
        return () => {
            if (playerIntervalRef.current) clearInterval(playerIntervalRef.current);
        };
    }, [isPlaying, currentTrack]);

    const logMeditationSession = useCallback((minutes: number) => {
        if (currentTrack) {
            const today = new Date().toISOString().split('T')[0];
            setMeditationHistory(prev => [...prev, { trackId: currentTrack.id, date: today, minutes }]);
            setDailyStreak(prev => {
                if (prev.lastDate === today) return prev;
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yStr = yesterday.toISOString().split('T')[0];
                const newCount = prev.lastDate === yStr ? prev.count + 1 : 1;
                return { count: newCount, lastDate: today };
            });
        }
    }, [currentTrack]);

    const toggleFavorite = useCallback((id: number) => {
        setFavorites(prev => {
            if (prev.includes(id)) {
                addToast('Removed from favorites.', 'info');
                return prev.filter(f => f !== id);
            }
            addToast('Added to favorites! ❤️', 'success');
            return [...prev, id];
        });
    }, [addToast]);

    const toggleAmbient = useCallback((id: string) => {
        const engine = audioEngineRef.current;
        if (engine) {
            engine.toggleAmbient(id);
        }
        setActiveAmbients(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
    }, []);

    const playTrack = useCallback((track: MeditationTrack) => {
        setCurrentTrack(track);
        setIsPlaying(true);
        setPlayerProgress(0);
        setActiveSection('player');
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const getTimeRecommendation = useMemo((): MeditationTrack | null => {
        const hour = new Date().getHours();
        const timeOfDay = hour < 12 ? 'morning' : 'night';
        const recommended = tracks.filter(t => t.timeOfDay === timeOfDay && t.isFeatured);
        return recommended.length > 0 ? recommended[0] : tracks.find(t => t.isFeatured) || null;
    }, [tracks]);

    const filteredTracksByDeity = useMemo(() => tracks.filter(t => t.deity === selectedDeity), [tracks, selectedDeity]);
    const filteredTracksByPurpose = useMemo(() => tracks.filter(t => selectedPurpose && t.purpose.includes(selectedPurpose)), [tracks, selectedPurpose]);
    const filteredTracksByDay = useMemo(() => {
        if (!selectedDay) return [];
        return tracks.filter(t => t.deity === selectedDay.deity || t.deity === 'Universal');
    }, [tracks, selectedDay]);
    const filteredTracksByFestival = useMemo(() => {
        if (!selectedFestival) return [];
        return tracks.filter(t => selectedFestival.tracks.includes(t.id));
    }, [tracks, selectedFestival]);
    const favoriteTracks = useMemo(() => tracks.filter(t => favorites.includes(t.id)), [tracks, favorites]);

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        return tracks.filter(t =>
            t.title.toLowerCase().includes(q) ||
            t.deity.toLowerCase().includes(q) ||
            t.artist.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q)
        );
    }, [tracks, searchQuery]);

    const totalMeditationMinutes = useMemo(() =>
        meditationHistory.reduce((sum, h) => sum + h.minutes, 0),
        [meditationHistory]
    );

    const todayIndex = new Date().getDay();
    const todayDayWise = DAY_WISE_DATA[todayIndex === 0 ? 6 : todayIndex - 1];

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // --- Track Card ---
    const TrackCard = ({ track, compact = false }: { track: MeditationTrack; compact?: boolean }) => (
        <motion.button
            onClick={() => playTrack(track)}
            className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 text-left ${compact ? 'flex items-center gap-3 p-3' : 'p-0'}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {compact ? (
                <>
                    <img src={track.imageUrl} alt={track.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" loading="lazy" />
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{track.title}</p>
                        <p className="text-xs text-white/50 truncate">{track.artist} · {track.duration}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(track.id); }}
                            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <Icon name={favorites.includes(track.id) ? 'heart-filled' : 'heart'} className={`w-4 h-4 ${favorites.includes(track.id) ? 'text-rose-400' : 'text-white/40'}`} />
                        </button>
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-amber-500/80 transition-colors">
                            <Icon name="play" className="w-3 h-3 text-white ml-0.5" />
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl">
                        <img src={track.imageUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                            <p className="font-bold text-white text-base drop-shadow-lg">{track.title}</p>
                            <p className="text-xs text-white/70">{track.artist}</p>
                        </div>
                        <div className="absolute top-3 right-3 flex gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(track.id); }}
                                className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
                            >
                                <Icon name={favorites.includes(track.id) ? 'heart-filled' : 'heart'} className={`w-4 h-4 ${favorites.includes(track.id) ? 'text-rose-400' : 'text-white/60'}`} />
                            </button>
                        </div>
                        <div className="absolute bottom-3 right-3">
                            <span className="text-xs text-white/60 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">{track.duration}</span>
                        </div>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                        <span className="text-xs text-amber-300/70 font-medium capitalize">{track.category.replace('-', ' ')}</span>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                            <Icon name="play" className="w-3.5 h-3.5 text-white ml-0.5" />
                        </div>
                    </div>
                </>
            )}
        </motion.button>
    );

    // --- Section Header ---
    const SectionHeader = ({ title, emoji, onBack }: { title: string; emoji?: string; onBack?: () => void }) => (
        <div className="flex items-center gap-3 mb-6">
            {onBack && (
                <button onClick={onBack} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <Icon name="arrow-left" className="w-5 h-5 text-white/70" />
                </button>
            )}
            <h2 className="text-2xl md:text-3xl font-bold text-white font-serif">
                {emoji && <span className="mr-2">{emoji}</span>}
                {title}
            </h2>
        </div>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a0a2e] via-[#1a1a4e] to-[#0d0d35] flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
                    <Icon name="lotus" className="w-16 h-16 text-amber-400" />
                </motion.div>
            </div>
        );
    }

    // --- Full Screen Player ---
    const renderPlayer = () => {
        if (!currentTrack) return null;
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative min-h-[80vh] flex flex-col"
            >
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img src={currentTrack.imageUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a2e] via-[#0a0a2e]/80 to-[#0a0a2e]/40" />
                </div>

                <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full">
                    <button onClick={() => setActiveSection('home')} className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors">
                        <Icon name="arrow-left" className="w-5 h-5 text-white" />
                    </button>

                    {/* Mandala Animation */}
                    <motion.div
                        className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-amber-400/30 shadow-[0_0_60px_rgba(245,158,11,0.3)] mb-8"
                        animate={isPlaying ? { rotate: 360 } : {}}
                        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    >
                        <img src={currentTrack.imageUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
                    </motion.div>

                    {/* Track Info */}
                    <h2 className="text-2xl md:text-3xl font-bold text-white font-serif text-center mb-1">{currentTrack.title}</h2>
                    <p className="text-amber-300/70 text-sm mb-8">{currentTrack.artist}</p>

                    {/* Progress Bar */}
                    <div className="w-full mb-3">
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                                style={{ width: `${playerProgress}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-white/40">
                            <span>{currentTrack.duration}</span>
                            <span>{timerActive ? formatTime(timerSecondsLeft) : currentTrack.duration}</span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-6 mb-8">
                        <button className="p-3 rounded-full hover:bg-white/10 transition-colors">
                            <Icon name="chevron-left" className="w-6 h-6 text-white/60" />
                        </button>
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:shadow-[0_0_40px_rgba(245,158,11,0.7)] transition-shadow"
                        >
                            <Icon name={isPlaying ? 'pause' : 'play'} className={`w-7 h-7 text-white ${!isPlaying ? 'ml-1' : ''}`} />
                        </button>
                        <button className="p-3 rounded-full hover:bg-white/10 transition-colors">
                            <Icon name="chevron-right" className="w-6 h-6 text-white/60" />
                        </button>
                    </div>

                    {/* Extra Controls Row */}
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => toggleFavorite(currentTrack.id)}
                            className="flex flex-col items-center gap-1"
                        >
                            <Icon name={favorites.includes(currentTrack.id) ? 'heart-filled' : 'heart'} className={`w-5 h-5 ${favorites.includes(currentTrack.id) ? 'text-rose-400' : 'text-white/50'}`} />
                            <span className="text-[10px] text-white/40">Save</span>
                        </button>
                        <button
                            onClick={() => {
                                if (!timerActive) {
                                    setTimerSecondsLeft(timerMinutes * 60);
                                    setTimerActive(true);
                                    addToast(`Timer set for ${timerMinutes} minutes.`, 'success');
                                } else {
                                    setTimerActive(false);
                                    addToast('Timer stopped.', 'info');
                                }
                            }}
                            className="flex flex-col items-center gap-1"
                        >
                            <Icon name="clock" className={`w-5 h-5 ${timerActive ? 'text-amber-400' : 'text-white/50'}`} />
                            <span className="text-[10px] text-white/40">{timerActive ? formatTime(timerSecondsLeft) : 'Timer'}</span>
                        </button>
                        <button className="flex flex-col items-center gap-1">
                            <Icon name="volume-on" className="w-5 h-5 text-white/50" />
                            <span className="text-[10px] text-white/40">Loop</span>
                        </button>
                    </div>

                    {/* Ambient Mix */}
                    <div className="w-full">
                        <p className="text-xs text-white/40 uppercase tracking-widest mb-3 text-center font-bold">Ambient Mix</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {AMBIENT_SOUNDS.map(amb => (
                                <button
                                    key={amb.id}
                                    onClick={() => toggleAmbient(amb.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeAmbients.includes(amb.id) ? 'bg-amber-500/30 text-amber-300 border border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}
                                >
                                    {amb.emoji} {amb.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    // --- Timer View ---
    const renderTimer = () => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6">
            <SectionHeader title="Meditation Timer" emoji="⏳" onBack={() => setActiveSection('home')} />
            <div className="max-w-md mx-auto">
                {/* Timer Display */}
                <div className="relative flex items-center justify-center my-12">
                    <motion.div
                        className="w-56 h-56 rounded-full border-4 border-amber-400/30 flex items-center justify-center relative"
                        animate={timerActive ? { boxShadow: ['0 0 20px rgba(245,158,11,0.2)', '0 0 40px rgba(245,158,11,0.4)', '0 0 20px rgba(245,158,11,0.2)'] } : {}}
                        transition={{ duration: 4, repeat: Infinity }}
                    >
                        {timerActive && (
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle cx="50%" cy="50%" r="48%" fill="none" stroke="rgba(245,158,11,0.3)" strokeWidth="4" />
                                <motion.circle
                                    cx="50%" cy="50%" r="48%" fill="none" stroke="url(#timerGrad)" strokeWidth="4" strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 112}`}
                                    strokeDashoffset={`${2 * Math.PI * 112 * (1 - timerSecondsLeft / (timerMinutes * 60))}`}
                                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                                />
                                <defs>
                                    <linearGradient id="timerGrad"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#ea580c" /></linearGradient>
                                </defs>
                            </svg>
                        )}
                        <div className="text-center">
                            <p className="text-5xl font-bold text-white font-mono">{timerActive ? formatTime(timerSecondsLeft) : `${timerMinutes}:00`}</p>
                            <p className="text-xs text-white/40 mt-1">{timerActive ? 'remaining' : 'minutes'}</p>
                        </div>
                    </motion.div>
                </div>

                {/* Timer Options */}
                {!timerActive && (
                    <>
                        <div className="flex justify-center gap-3 mb-8">
                            {TIMER_OPTIONS.map(min => (
                                <button
                                    key={min}
                                    onClick={() => setTimerMinutes(min)}
                                    className={`w-14 h-14 rounded-2xl font-bold text-sm transition-all ${timerMinutes === min ? 'bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg shadow-amber-500/30' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}
                                >
                                    {min}
                                </button>
                            ))}
                        </div>

                        {/* Mode Selection */}
                        <div className="space-y-2 mb-8">
                            <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Mode</p>
                            {([
                                { id: 'silent' as const, label: 'Silent Meditation', icon: '🧘' },
                                { id: 'bell' as const, label: 'Bell Start/End', icon: '🔔' },
                                { id: 'mantra' as const, label: 'Background Mantra', icon: '🎵' },
                            ]).map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => setTimerMode(mode.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${timerMode === mode.id ? 'bg-amber-500/20 border border-amber-400/50 text-amber-300' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'}`}
                                >
                                    <span className="text-lg">{mode.icon}</span>
                                    <span className="font-medium text-sm">{mode.label}</span>
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* Start/Stop */}
                <button
                    onClick={() => {
                        if (timerActive) {
                            setTimerActive(false);
                            setIsPlaying(false);
                            audioEngineRef.current?.playSingingBowl();
                            logMeditationSession(Math.round((timerMinutes * 60 - timerSecondsLeft) / 60));
                            addToast('Session ended. Peace be with you. 🙏', 'info');
                        } else {
                            setTimerSecondsLeft(timerMinutes * 60);
                            setTimerActive(true);
                            setIsPlaying(true);
                            if (timerMode === 'bell') {
                                audioEngineRef.current?.playSingingBowl();
                            }
                        }
                    }}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${timerActive ? 'bg-white/10 text-white/70 hover:bg-red-500/20 hover:text-red-300 border border-white/10' : 'bg-gradient-to-r from-amber-400 to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50'}`}
                >
                    {timerActive ? '⏹ End Session' : '▶ Begin Meditation'}
                </button>
            </div>
        </motion.div>
    );

    // --- Personal Space ---
    const renderPersonal = () => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6">
            <SectionHeader title="Spiritual Space" emoji="❤️" onBack={() => setActiveSection('home')} />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {[
                    { label: 'Saved Bhajans', value: favoriteTracks.length, emoji: '❤️', color: 'from-rose-500/20 to-pink-500/20' },
                    { label: 'Sessions', value: meditationHistory.length, emoji: '📊', color: 'from-blue-500/20 to-indigo-500/20' },
                    { label: 'Daily Streak', value: `${dailyStreak.count} 🔥`, emoji: '', color: 'from-orange-500/20 to-amber-500/20' },
                    { label: 'Total Time', value: `${totalMeditationMinutes}m`, emoji: '⏱', color: 'from-purple-500/20 to-violet-500/20' },
                ].map(stat => (
                    <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border border-white/10 rounded-2xl p-4 text-center backdrop-blur-sm`}>
                        <p className="text-2xl font-bold text-white">{stat.emoji}{stat.value}</p>
                        <p className="text-xs text-white/50 mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Daily Streak Banner */}
            {dailyStreak.count > 0 && (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-2xl p-4 mb-8 text-center">
                    <p className="text-lg font-bold text-amber-300">🔥 You meditated {dailyStreak.count} day{dailyStreak.count > 1 ? 's' : ''} in a row!</p>
                    <p className="text-sm text-white/50 mt-1">Total: {Math.floor(totalMeditationMinutes / 60)}h {totalMeditationMinutes % 60}m of mindfulness</p>
                </div>
            )}

            {/* Favorites */}
            <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-3">❤️ Saved Bhajans</h3>
                {favoriteTracks.length > 0 ? (
                    <div className="space-y-2">
                        {favoriteTracks.map(t => <TrackCard key={t.id} track={t} compact />)}
                    </div>
                ) : (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                        <p className="text-white/40">No favorites yet. Tap the ❤️ on any track to save it.</p>
                    </div>
                )}
            </div>

            {/* Recent Sessions */}
            <div>
                <h3 className="text-lg font-bold text-white mb-3">📊 Recent Sessions</h3>
                {meditationHistory.length > 0 ? (
                    <div className="space-y-2">
                        {meditationHistory.slice(-5).reverse().map((h, i) => {
                            const track = tracks.find(t => t.id === h.trackId);
                            return (
                                <div key={i} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-500/30 flex items-center justify-center text-sm">🧘</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{track?.title || 'Meditation'}</p>
                                        <p className="text-xs text-white/40">{h.date} · {h.minutes} min</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                        <p className="text-white/40">Start meditating to build your history.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );

    // --- Track List View (for day/deity/purpose/festival sub-views) ---
    const renderTrackList = (trackList: MeditationTrack[], title: string, emoji: string) => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6">
            <SectionHeader title={title} emoji={emoji} onBack={() => setActiveSection('home')} />
            {trackList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {trackList.map(t => <TrackCard key={t.id} track={t} compact />)}
                </div>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                    <p className="text-white/40 text-lg">No tracks found for this section.</p>
                </div>
            )}
        </motion.div>
    );

    // --- HOME VIEW ---
    const renderHome = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-10">

            {/* === HEADER === */}
            <header className="text-center pt-4 pb-2">
                <motion.div
                    className="inline-block mb-4"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 6, repeat: Infinity }}
                >
                    <span className="text-5xl">🕉️</span>
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold text-white font-serif mb-2">Meditation Zone</h1>
                <p className="text-amber-300/60 text-sm italic">"Find Peace Through Divine Sound"</p>

                {/* Quick Actions */}
                <div className="flex justify-center gap-3 mt-6">
                    <button
                        onClick={() => setActiveSection('personal')}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-all"
                    >
                        <Icon name="heart" className="w-4 h-4" /> Favorites
                    </button>
                    <button
                        onClick={() => setActiveSection('timer')}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-all"
                    >
                        <Icon name="clock" className="w-4 h-4" /> Timer
                    </button>
                </div>
            </header>

            {/* === SEARCH BAR === */}
            <div className="relative max-w-md mx-auto">
                <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search mantras, deities, bhajans..."
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30 transition-all"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10">
                        <Icon name="x" className="w-4 h-4 text-white/40" />
                    </button>
                )}
            </div>

            {/* Search Results */}
            {searchQuery && (
                <div>
                    <p className="text-sm text-white/40 mb-3">{searchResults.length} results for "{searchQuery}"</p>
                    <div className="space-y-2">
                        {searchResults.map(t => <TrackCard key={t.id} track={t} compact />)}
                    </div>
                </div>
            )}

            {/* === FEATURED / RECOMMENDATION === */}
            {!searchQuery && getTimeRecommendation && (
                <section>
                    <p className="text-xs text-amber-300/50 uppercase tracking-widest font-bold mb-3">
                        {new Date().getHours() < 12 ? '🌅 Morning Recommendation' : '🌙 Evening Recommendation'}
                    </p>
                    <motion.button
                        onClick={() => playTrack(getTimeRecommendation)}
                        className="w-full relative overflow-hidden rounded-3xl group"
                        whileHover={{ scale: 1.01 }}
                    >
                        <div className="relative aspect-[2.2/1] overflow-hidden rounded-3xl">
                            <img src={getTimeRecommendation.imageUrl} alt={getTimeRecommendation.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <p className="text-2xl md:text-3xl font-bold text-white font-serif mb-1">{getTimeRecommendation.title}</p>
                                <p className="text-sm text-white/60 mb-4">{getTimeRecommendation.artist}</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                                        <Icon name="play" className="w-5 h-5 text-white ml-0.5" />
                                    </div>
                                    <div className="flex gap-2">
                                        {[10, 20, 30].map(min => (
                                            <span key={min} className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/60 border border-white/10">⏱ {min} min</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.button>
                </section>
            )}

            {!searchQuery && (
                <>
                    {/* === TODAY'S DEITY === */}
                    <section>
                        <p className="text-xs text-amber-300/50 uppercase tracking-widest font-bold mb-3">📅 Today's Divine Energy</p>
                        <button
                            onClick={() => {
                                setSelectedDay(todayDayWise);
                                setActiveSection('day');
                            }}
                            className={`w-full bg-gradient-to-r ${todayDayWise.gradient} rounded-2xl p-5 text-left group hover:shadow-lg transition-all relative overflow-hidden`}
                        >
                            <div className="absolute top-0 right-0 text-8xl opacity-10 -mr-4 -mt-4">{todayDayWise.symbol}</div>
                            <p className="text-white/60 text-xs font-bold uppercase">{todayDayWise.day}</p>
                            <p className="text-2xl font-bold text-white font-serif mt-1">{todayDayWise.symbol} {todayDayWise.deity} Meditation</p>
                            <p className="text-white/50 text-sm mt-1">Tap to explore {todayDayWise.deity} bhajans, mantras & meditation</p>
                        </button>
                    </section>

                    {/* === DAY-WISE BHAJANS === */}
                    <section>
                        <p className="text-xs text-amber-300/50 uppercase tracking-widest font-bold mb-3">📅 Day-Wise Divine Bhajans</p>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                            {DAY_WISE_DATA.map((day, i) => (
                                <motion.button
                                    key={day.day}
                                    onClick={() => { setSelectedDay(day); setActiveSection('day'); }}
                                    className={`flex-shrink-0 w-28 bg-gradient-to-br ${day.gradient} rounded-2xl p-4 text-center hover:scale-105 transition-transform ${todayIndex === (i === 6 ? 0 : i + 1) ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#0a0a2e]' : ''}`}
                                    whileHover={{ y: -4 }}
                                >
                                    <span className="text-3xl block mb-2">{day.symbol}</span>
                                    <p className="text-white font-bold text-sm">{day.day.slice(0, 3)}</p>
                                    <p className="text-white/60 text-xs">{day.deity}</p>
                                </motion.button>
                            ))}
                        </div>
                    </section>

                    {/* === GOD-WISE LIBRARY === */}
                    <section>
                        <p className="text-xs text-amber-300/50 uppercase tracking-widest font-bold mb-3">🛕 God-Wise Meditation Library</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {DEITY_DATA.map(d => (
                                <motion.button
                                    key={d.deity}
                                    onClick={() => { setSelectedDeity(d.deity); setActiveSection('deity'); }}
                                    className={`bg-gradient-to-br ${d.gradient} rounded-2xl p-4 text-left group hover:shadow-lg transition-all relative overflow-hidden`}
                                    whileHover={{ scale: 1.03 }}
                                >
                                    <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform">{d.emoji}</span>
                                    <p className="text-white font-bold text-sm">{d.label}</p>
                                    <p className="text-white/50 text-xs mt-0.5">{tracks.filter(t => t.deity === d.deity).length} tracks</p>
                                </motion.button>
                            ))}
                        </div>
                    </section>

                    {/* === PURPOSE-BASED === */}
                    <section>
                        <p className="text-xs text-amber-300/50 uppercase tracking-widest font-bold mb-3">🌿 Purpose-Based Meditation</p>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                            {PURPOSE_DATA.map(p => (
                                <motion.button
                                    key={p.id}
                                    onClick={() => { setSelectedPurpose(p.id); setActiveSection('purpose'); }}
                                    className={`flex-shrink-0 w-36 bg-gradient-to-br ${p.gradient} rounded-2xl p-4 text-left hover:shadow-lg transition-all`}
                                    whileHover={{ y: -4 }}
                                >
                                    <span className="text-3xl block mb-2">{p.emoji}</span>
                                    <p className="text-white font-bold text-sm">{p.label}</p>
                                    <p className="text-white/50 text-[11px] mt-1">{p.desc}</p>
                                </motion.button>
                            ))}
                        </div>
                    </section>

                    {/* === FESTIVAL MUSIC === */}
                    <section>
                        <p className="text-xs text-amber-300/50 uppercase tracking-widest font-bold mb-3">🎉 Festival & Occasion Music</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {FESTIVAL_PLAYLISTS.map(f => (
                                <motion.button
                                    key={f.id}
                                    onClick={() => { setSelectedFestival(f); setActiveSection('festival'); }}
                                    className={`bg-gradient-to-br ${f.gradient} rounded-2xl p-4 text-left group hover:shadow-lg transition-all relative overflow-hidden`}
                                    whileHover={{ scale: 1.03 }}
                                >
                                    <div className="absolute top-0 right-0 text-6xl opacity-10 -mr-2 -mt-2">{f.emoji}</div>
                                    <span className="text-3xl block mb-2">{f.emoji}</span>
                                    <p className="text-white font-bold text-sm">{f.name}</p>
                                    <p className="text-white/50 text-xs mt-1">{f.tracks.length} sacred tracks</p>
                                </motion.button>
                            ))}
                        </div>
                    </section>

                    {/* === ALL TRACKS === */}
                    <section>
                        <p className="text-xs text-amber-300/50 uppercase tracking-widest font-bold mb-3">🎧 All Tracks</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tracks.slice(0, 6).map(t => <TrackCard key={t.id} track={t} />)}
                        </div>
                        {tracks.length > 6 && (
                            <div className="mt-4 text-center">
                                <button className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-white/50 text-sm hover:bg-white/10 transition-all">
                                    View all {tracks.length} tracks →
                                </button>
                            </div>
                        )}
                    </section>

                    {/* === FLOATING MINI PLAYER === */}
                    {currentTrack && activeSection === 'home' && (
                        <motion.div
                            initial={{ y: 80, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-3rem)] max-w-lg"
                        >
                            <button
                                onClick={() => setActiveSection('player')}
                                className="w-full flex items-center gap-3 p-3 bg-[#1a1a4e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                            >
                                <img src={currentTrack.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-sm font-semibold text-white truncate">{currentTrack.title}</p>
                                    <p className="text-xs text-white/40 truncate">{currentTrack.artist}</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center flex-shrink-0"
                                >
                                    <Icon name={isPlaying ? 'pause' : 'play'} className={`w-4 h-4 text-white ${!isPlaying ? 'ml-0.5' : ''}`} />
                                </button>
                            </button>
                        </motion.div>
                    )}
                </>
            )}
        </motion.div>
    );

    return (
        <div ref={scrollRef} className="min-h-screen bg-gradient-to-br from-[#0a0a2e] via-[#1a1a4e] to-[#0d0d35] relative overflow-hidden">
            {/* Ambient Visual Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <BreathingOrb />
                {[0, 3, 7, 11, 16].map((d, i) => <FloatingLotus key={i} delay={d} />)}
                {/* Mandala pattern overlay */}
                <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: 'radial-gradient(circle at center, rgba(245,158,11,0.3) 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                }} />
            </div>

            {/* Content */}
            <div className="relative z-10">
                <AnimatePresence mode="wait">
                    {activeSection === 'player' && renderPlayer()}
                    {activeSection === 'timer' && renderTimer()}
                    {activeSection === 'personal' && renderPersonal()}
                    {activeSection === 'day' && selectedDay && renderTrackList(filteredTracksByDay, `${selectedDay.symbol} ${selectedDay.day} – ${selectedDay.deity}`, '')}
                    {activeSection === 'deity' && selectedDeity && renderTrackList(filteredTracksByDeity, `${DEITY_DATA.find(d => d.deity === selectedDeity)?.emoji || ''} ${selectedDeity} Meditation`, '')}
                    {activeSection === 'purpose' && selectedPurpose && renderTrackList(filteredTracksByPurpose, PURPOSE_DATA.find(p => p.id === selectedPurpose)?.label || '', PURPOSE_DATA.find(p => p.id === selectedPurpose)?.emoji || '')}
                    {activeSection === 'festival' && selectedFestival && renderTrackList(filteredTracksByFestival, selectedFestival.name, selectedFestival.emoji)}
                    {activeSection === 'home' && renderHome()}
                </AnimatePresence>
            </div>
        </div>
    );
};
