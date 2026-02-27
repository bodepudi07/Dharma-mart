// This file is repurposed to house the new "Bhakti Chanting Zone" feature for all ages.
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { I18nContent, Chant, User, Badge } from '../types';
import { CHANTS_DATA, CHANTING_BADGES_DATA } from '../constants';
import { useToast } from '../contexts/ToastContext';
import { Icon } from './Icon';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/apiService';

type ViewMode = 'kids' | 'sadhana';
type KidsMode = 'chantAlong' | 'repeatLearn';
type ChantState = 'idle' | 'guru' | 'user' | 'recording' | 'playing';

// --- Japa Mala Component for Sadhana Mode ---
const JapaMala = ({ chant, onComplete, t }: { chant: Chant; onComplete: () => void; t: I18nContent }) => {
    const [japaCount, setJapaCount] = useState(0);
    const [targetCount, setTargetCount] = useState(108);
    const beadRef = useRef<HTMLButtonElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { addToast } = useToast();
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        audioRef.current = new Audio("https://actions.google.com/sounds/v1/switches/switch_1.ogg");
        audioRef.current.volume = 0.5;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'hi-IN';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[event.results.length - 1][0].transcript.trim();
                if (transcript.length > 0) {
                    setJapaCount(count => {
                        if (count < targetCount) {
                            beadRef.current?.classList.add('bead-press-anim');
                            setTimeout(() => beadRef.current?.classList.remove('bead-press-anim'), 150);
                            if (audioRef.current) {
                                audioRef.current.currentTime = 0;
                                audioRef.current.play().catch(e => console.error("Bead sound failed:", e));
                            }
                            return count + 1;
                        }
                        return count;
                    });
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                if (recognitionRef.current && recognitionRef.current.isListeningFlag) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) { }
                }
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.isListeningFlag = false;
                recognitionRef.current.stop();
            }
        };
    }, [targetCount]);

    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.isListeningFlag = isListening;
            if (isListening) {
                try {
                    recognitionRef.current.start();
                } catch (e) { }
            } else {
                recognitionRef.current.stop();
            }
        }
    }, [isListening]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            addToast("Speech recognition is not supported in this browser.", "error");
            return;
        }
        setIsListening(!isListening);
    };

    const handleBeadPress = () => {
        setJapaCount(count => {
            if (count < targetCount) {
                beadRef.current?.classList.add('bead-press-anim');
                setTimeout(() => beadRef.current?.classList.remove('bead-press-anim'), 150);
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(e => console.error("Bead sound failed:", e));
                }
                return count + 1;
            }
            return count;
        });
    };

    const handleComplete = () => {
        if (japaCount >= targetCount) {
            onComplete();
            setJapaCount(0);
            setIsListening(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <style>{`
                .bead-press-anim { animation: bead-press 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
                @keyframes bead-press {
                    0%, 100% { transform: scale(1); filter: brightness(1); }
                    50% { transform: scale(0.92); filter: brightness(1.3); }
                }
            `}</style>
            <p className="font-serif text-3xl md:text-5xl text-center text-amber-300 mb-8 drop-shadow-[0_2px_15px_rgba(245,158,11,0.5)] leading-relaxed">{chant.sanskrit}</p>

            <div className="mb-10 flex items-center gap-4 bg-white/5 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10">
                <label className="font-medium text-stone-300 tracking-wider text-sm uppercase">Target Count</label>
                <select
                    value={targetCount}
                    onChange={(e) => {
                        setTargetCount(Number(e.target.value));
                        setJapaCount(0);
                    }}
                    className="bg-transparent border-none text-amber-400 font-bold text-lg outline-none cursor-pointer focus:ring-0 appearance-none pr-4"
                >
                    <option className="bg-stone-900" value={11}>11</option>
                    <option className="bg-stone-900" value={21}>21</option>
                    <option className="bg-stone-900" value={51}>51</option>
                    <option className="bg-stone-900" value={108}>108</option>
                    <option className="bg-stone-900" value={1008}>1008</option>
                </select>
            </div>

            <div className="relative w-56 h-56 md:w-80 md:h-80 flex items-center justify-center">
                {/* Outer Glow Ring */}
                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl animate-pulse"></div>

                {/* SVG Progress Circle */}
                <svg className="absolute w-full h-full drop-shadow-[0_0_20px_rgba(245,158,11,0.5)] z-10" viewBox="0 0 100 100">
                    <circle className="text-white/5" strokeWidth="2" stroke="currentColor" fill="transparent" r="48" cx="50" cy="50" />
                    <circle
                        className="text-amber-400 transition-all duration-300 ease-out"
                        strokeWidth="3"
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={(2 * Math.PI * 48) * (1 - japaCount / targetCount)}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="48"
                        cx="50"
                        cy="50"
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                </svg>

                {/* Main Japa Button */}
                <button ref={beadRef} onClick={handleBeadPress} className="relative z-20 w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-amber-600 via-amber-500 to-orange-600 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.5),0_0_30px_rgba(245,158,11,0.5)] flex flex-col items-center justify-center text-amber-50 focus:outline-none transition-all hover:brightness-110 group border-4 border-amber-300/30">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-[2px] backdrop-blur-sm shadow-[inset_0_5px_15px_rgba(255,255,255,0.4)] mix-blend-overlay"></div>
                    <span className="font-serif font-bold text-6xl md:text-8xl drop-shadow-lg relative z-10 group-hover:scale-105 transition-transform">{japaCount}</span>
                    <span className="text-sm font-medium tracking-widest text-amber-200/80 relative z-10 mt-1 uppercase">/ {targetCount}</span>
                </button>
            </div>

            <p className="text-stone-400 mt-8 font-light tracking-wide">{t.japaMalaProgress}</p>

            <button
                onClick={toggleListening}
                className={`mt-6 flex items-center gap-2 px-8 py-3 rounded-full font-bold transition-all duration-300 border backdrop-blur-md ${isListening ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse' : 'bg-white/5 text-stone-300 border-white/10 hover:bg-white/10 hover:text-white'}`}
            >
                <Icon name="microphone" className="w-5 h-5" />
                {isListening ? 'Listening... (Recite to count)' : 'Auto-Count via Voice'}
            </button>

            <button
                onClick={handleComplete}
                disabled={japaCount < targetCount}
                className="mt-10 relative overflow-hidden group/done bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xl px-12 py-4 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] transform hover:scale-105 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 disabled:shadow-none border border-emerald-400/50"
            >
                <span className="relative z-10 tracking-widest uppercase">{t.completeMala}</span>
                <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover/done:scale-x-100 transition-transform duration-500 origin-left"></div>
            </button>
        </div>
    );
};

// Deity symbols for the kid-friendly selector
const DEITY_SYMBOLS: Record<string, string> = {
    'Krishna': '🦚', 'Shiva': '🔱', 'Ganesha': '🐘', 'Gayatri Devi': '🌞',
    'Durga': '⚔️', 'Rama': '🏹', 'Hanuman': '🐒', 'Saraswati': '🦢',
    'Lakshmi': '🌺', 'Vishnu': '🌀', 'Murugan': '🪃',
};

const AnimatedDeity = ({ chant, currentUser }: { chant: Chant; currentUser: User | null; }) => {
    const [customImage, setCustomImage] = useState<string | null>(null);
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCustomImage(null);
        if (currentUser) {
            api.getUserPreferences(currentUser.id).then(prefs => {
                if (prefs.chantImages && prefs.chantImages[chant.id]) {
                    setCustomImage(prefs.chantImages[chant.id]);
                }
            });
        }
    }, [chant.id, currentUser]);

    const imgSrc = customImage || chant.deityImage;

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!currentUser) return;
        const file = event.target.files?.[0];
        if (file) {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
                addToast(`Invalid file. Max 2MB JPG, PNG, or WebP.`, 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    await api.updateUserChantImage(currentUser.id, chant.id, reader.result as string);
                    setCustomImage(reader.result as string);
                    addToast(`${chant.deity} image updated.`, 'success');
                } catch (error) {
                    addToast(error instanceof Error ? error.message : 'Could not save image.', 'error');
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileUpload = () => {
        if (!currentUser) {
            addToast('Login to customize images.', 'info');
            return;
        }
        fileInputRef.current?.click();
    };

    return (
        <div className="group relative w-48 h-48 md:w-64 md:h-64 mb-4 animate-deity-breathe">
            <img
                src={imgSrc}
                alt={chant.deity}
                className="w-full h-full object-contain drop-shadow-2xl transition-opacity duration-300 opacity-100"
                style={{ filter: 'drop-shadow(0 0 20px rgba(245,158,11,0.4))' }}
            />
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/png, image/jpeg, image/webp" disabled={!currentUser} />
            <button onClick={triggerFileUpload} className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full disabled:cursor-not-allowed" aria-label={`Upload custom image for ${chant.deity}`} disabled={!currentUser} title={!currentUser ? 'Login to upload an image' : `Upload custom image for ${chant.deity}`}>
                <Icon name="upload" className="w-10 h-10" />
            </button>
        </div>
    );
};


export const ChantingZone = ({ t }: { t: I18nContent }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('kids');
    const [selectedChant, setSelectedChant] = useState<Chant>(CHANTS_DATA[0]);

    const { currentUser } = useAuth();
    const { addToast } = useToast();

    // Kids Zone State
    const [kidsMode, setKidsMode] = useState<KidsMode>('chantAlong');
    const [chantCount, setChantCount] = useState(() => { try { const s = localStorage.getItem('dd-chant-count'); return s ? parseInt(s, 10) : 0; } catch { return 0; } });
    const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
    const [chantState, setChantState] = useState<ChantState>('idle');
    const [currentLine, setCurrentLine] = useState(0);

    // Shared Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioUrlRef = useRef<string | null>(null);
    const synthRef = useRef(window.speechSynthesis);

    // --- API Integration ---
    const handleCompleteSadhana = async () => {
        if (!currentUser) {
            addToast("Please log in to save your progress.", 'info');
            return;
        }
        try {
            await api.completeSpiritualTask(currentUser.id, 'chant');
            addToast(t.malaCompletedMessage, 'success');
        } catch (err) {
            if (err instanceof Error) addToast(err.message, 'error');
        }
    };

    // --- Kids Mode Badge Logic ---
    useEffect(() => {
        localStorage.setItem('dd-chant-count', String(chantCount));
        const newlyUnlocked = CHANTING_BADGES_DATA.filter(badge => chantCount >= badge.chantCount && !unlockedBadges.includes(badge.id));
        if (newlyUnlocked.length > 0) {
            setUnlockedBadges(prev => [...prev, ...newlyUnlocked.map(b => b.id)]);
            newlyUnlocked.forEach(badge => addToast(`${t.achievementUnlocked} ${t[badge.nameKey as keyof I18nContent]}!`, 'success'));
        }
    }, [chantCount, unlockedBadges, addToast, t]);

    // --- Kids Mode Audio Logic ---
    const stopAllAudio = useCallback(() => {
        if (synthRef.current.speaking) synthRef.current.cancel();
    }, []);

    useEffect(() => {
        return () => {
            stopAllAudio();
            if (mediaRecorderRef.current?.state === 'recording') {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                mediaRecorderRef.current.stop();
            }
        };
    }, [stopAllAudio]);

    const speak = useCallback((text: string, onEnd: () => void) => {
        stopAllAudio(); // Ensure any previous speech is stopped.
        const doSpeak = () => {
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = synthRef.current.getVoices();
            utterance.voice = voices.find(v => v.lang.startsWith('hi-IN')) || voices.find(v => v.lang.startsWith('en-IN')) || null;
            utterance.rate = 0.8;
            utterance.pitch = 1.2;
            utterance.onend = onEnd;
            synthRef.current.speak(utterance);
        };
        if (synthRef.current.getVoices().length === 0) synthRef.current.onvoiceschanged = doSpeak;
        else doSpeak();
    }, [stopAllAudio]);

    const handleKidChantCompletion = useCallback(() => {
        setChantState('idle');
        setChantCount(prev => prev + 1);
    }, []);

    const startChantAlong = useCallback(() => {
        setChantState('guru');
        setCurrentLine(0);
    }, []);

    useEffect(() => {
        if (kidsMode !== 'chantAlong' || chantState !== 'guru' || currentLine >= selectedChant.mantra.length) {
            return;
        }

        speak(selectedChant.mantra[currentLine], () => {
            setChantState('user');
            setTimeout(() => {
                if (currentLine + 1 < selectedChant.mantra.length) {
                    setCurrentLine(prev => prev + 1);
                    setChantState('guru');
                } else {
                    handleKidChantCompletion();
                }
            }, 3000);
        });
    }, [kidsMode, chantState, currentLine, selectedChant.mantra, speak, handleKidChantCompletion]);

    const startRepeatLearn = () => {
        setChantState('guru');
        speak(selectedChant.mantra.join(' '), () => setChantState('user'));
    };

    const startRecording = async () => {
        if (chantState !== 'user') return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = e => audioChunksRef.current.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType });
                if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
                audioUrlRef.current = URL.createObjectURL(audioBlob);
                stream.getTracks().forEach(track => track.stop());
                setChantState('playing');
            };
            mediaRecorderRef.current.start();
            setChantState('recording');
        } catch (err) {
            addToast("Microphone access is needed.", 'error');
            setChantState('user');
        }
    };
    const stopRecording = () => mediaRecorderRef.current?.stop();
    const playRecording = () => {
        if (audioUrlRef.current) {
            const audio = new Audio(audioUrlRef.current);
            audio.play();
            audio.onended = handleKidChantCompletion;
        }
    };

    const handleMainButtonClick = () => {
        if (chantState !== 'idle') {
            stopAllAudio();
            setChantState('idle');
            return;
        }
        if (kidsMode === 'chantAlong') startChantAlong();
        if (kidsMode === 'repeatLearn') startRepeatLearn();
    };

    const handleChantSelection = (chant: Chant) => {
        stopAllAudio();
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
        setSelectedChant(chant);
        setChantState('idle');
        setCurrentLine(0);
    };

    const chantStatusText = () => {
        switch (chantState) {
            case 'guru': return `${selectedChant.deity} is chanting...`;
            case 'user': return t.yourTurn;
            case 'recording': return t.recording;
            case 'playing': return t.greatJob;
            default: return `Chant with ${selectedChant.deity}!`;
        }
    };

    return (
        <div className="min-h-full flex flex-col items-center justify-center p-4 md:p-8 text-center bg-black relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                <div className="absolute top-1/4 right-1/4 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-amber-600/20 rounded-full blur-[120px] opacity-40 mix-blend-screen animate-pulse"></div>
                <div className="absolute bottom-1/4 left-1/4 w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] bg-orange-600/20 rounded-full blur-[100px] opacity-40 mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <header className="relative z-10 w-full max-w-4xl mx-auto mb-8 pt-4">
                <h1 className="text-4xl md:text-6xl font-serif text-white tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">{t.chantingZoneTitle}</h1>
                <div className="mt-6 bg-white/5 backdrop-blur-md p-1.5 rounded-full border border-white/10 inline-flex gap-2">
                    <button onClick={() => setViewMode('kids')} className={`px-6 py-2.5 rounded-full text-sm tracking-wider uppercase transition-all duration-300 ${viewMode === 'kids' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'text-stone-400 hover:text-white'}`}>{t.chantingZoneKidsMode}</button>
                    <button onClick={() => setViewMode('sadhana')} className={`px-6 py-2.5 rounded-full text-sm tracking-wider uppercase transition-all duration-300 ${viewMode === 'sadhana' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'text-stone-400 hover:text-white'}`}>{t.chantingZoneSadhanaMode}</button>
                </div>
            </header>

            <div className="w-full max-w-4xl mx-auto animate-fade-in">
                {viewMode === 'kids' && (
                    <div className="relative bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 md:p-12 flex flex-col items-center font-kid-friendly overflow-hidden">
                        {/* Inner subtle glow */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

                        <div className="relative z-10 flex justify-center gap-3 mb-8">
                            <button onClick={() => setKidsMode('chantAlong')} className={`px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${kidsMode === 'chantAlong' ? 'bg-amber-500 text-amber-950 shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105' : 'bg-white/10 text-stone-300 hover:bg-white/20'}`}>{t.chantAlongMode}</button>
                            <button onClick={() => setKidsMode('repeatLearn')} className={`px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${kidsMode === 'repeatLearn' ? 'bg-amber-500 text-amber-950 shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105' : 'bg-white/10 text-stone-300 hover:bg-white/20'}`}>{t.repeatLearnMode}</button>
                        </div>

                        {/* Deity Selector Grid */}
                        <div className="relative z-10 w-full mb-8">
                            <p className="text-xs text-stone-500 uppercase tracking-widest mb-3">Choose Your Deity</p>
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                                {CHANTS_DATA.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => handleChantSelection(c)}
                                        title={c.deity}
                                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 border ${selectedChant.id === c.id
                                            ? 'bg-amber-500/20 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.35)] scale-105'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/25'
                                            }`}
                                    >
                                        <span className="text-2xl">{DEITY_SYMBOLS[c.deity] || '🙏'}</span>
                                        <span className={`text-[9px] font-bold tracking-wide uppercase leading-tight text-center ${selectedChant.id === c.id ? 'text-amber-300' : 'text-stone-400'}`}>
                                            {c.deity.split(' ')[0]}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="relative z-10">
                            <AnimatedDeity chant={selectedChant} currentUser={currentUser} />
                        </div>

                        <div className="relative z-10 text-3xl md:text-5xl font-serif text-amber-300 mb-6 h-32 flex items-center justify-center p-4 text-center leading-relaxed drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)]">
                            <p>{selectedChant.sanskrit}</p>
                        </div>

                        <div className="relative z-10 h-8 mb-8 text-stone-300 font-light tracking-wide text-lg bg-black/30 px-6 py-1 rounded-full border border-white/5">{chantStatusText()}</div>

                        {/* Interaction Buttons */}
                        <div className="relative z-10 flex items-center gap-4">
                            {kidsMode === 'chantAlong' && <button onClick={handleMainButtonClick} className="relative overflow-hidden group bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-xl px-12 py-4 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.4)] transform hover:scale-105 transition-all duration-300 border border-amber-400/50 hover:border-white">
                                <span className="relative z-10 tracking-wider flex items-center gap-2">{chantState === 'idle' ? <><Icon name="play" className="w-5 h-5" /> {t.chantNow}</> : <><Icon name="stop-circle" className="w-5 h-5" /> Stop</>}</span>
                                <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                            </button>}

                            {kidsMode === 'repeatLearn' && (
                                chantState === 'user' ?
                                    <button onClick={startRecording} className="bg-red-500/80 hover:bg-red-500 text-white font-bold text-lg px-8 py-4 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-2 backdrop-blur-md border border-red-400/50 transition-all hover:scale-105 tracking-wider"><Icon name="microphone" className="w-6 h-6" /> {t.recordYourVoice}</button> :
                                    chantState === 'recording' ?
                                        <button onClick={stopRecording} className="bg-red-600 text-white font-bold text-lg px-8 py-4 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.6)] flex items-center gap-2 animate-pulse border border-red-400 tracking-wider"><Icon name="stop-circle" className="w-6 h-6" /> {t.stopRecording}</button> :
                                        chantState === 'playing' ?
                                            <button onClick={playRecording} className="bg-emerald-500/80 hover:bg-emerald-500 text-white font-bold text-lg px-8 py-4 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2 border border-emerald-400/50 transition-all hover:scale-105 tracking-wider"><Icon name="play" className="w-6 h-6" /> {t.playYourChant}</button> :
                                            <button onClick={handleMainButtonClick} className="bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-xl px-12 py-4 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.4)] transform hover:scale-105 transition-all duration-300 flex items-center justify-center border border-amber-400/50">
                                                {chantState === 'idle' ? <Icon name="speaker" className="w-7 h-7 drop-shadow-md" /> : <Icon name="stop-circle" className="w-7 h-7 drop-shadow-md" />}
                                            </button>
                            )}
                        </div>

                        <div className="relative z-10 mt-12 w-full pt-8 border-t border-white/10">
                            <p className="font-medium text-stone-300 tracking-wider text-sm uppercase">{t.chantCountLabel} <span className="text-3xl text-amber-400 font-bold ml-2 font-serif drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">{chantCount}</span></p>
                            <h4 className="font-medium text-stone-400 tracking-wider text-xs uppercase mt-6 mb-4">{t.badgeCollection}</h4>
                            <div className="flex justify-center gap-4">
                                {CHANTING_BADGES_DATA.map(badge => (
                                    <div key={badge.id} className={`p-3 rounded-full relative group transition-all duration-500 ${chantCount >= badge.chantCount ? 'bg-amber-500/20 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-white/5 border border-white/10 opacity-50 grayscale'}`} title={`${t[badge.nameKey as keyof I18nContent]}: ${t[badge.descriptionKey as keyof I18nContent]}`}>
                                        {chantCount >= badge.chantCount && <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-md group-hover:bg-amber-400/40 transition-colors pointer-events-none"></div>}
                                        <Icon name={badge.icon} className={`w-8 h-8 relative z-10 ${chantCount >= badge.chantCount ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'text-stone-500'}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {viewMode === 'sadhana' && (
                    <div className="relative bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 md:p-12 flex flex-col items-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                        <h2 className="relative z-10 text-3xl md:text-4xl font-serif text-white tracking-widest mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{t.sadhanaModeTitle}</h2>
                        <p className="relative z-10 text-stone-400 font-light tracking-wide mb-8">{t.sadhanaModeSubtitle}</p>

                        <div className="relative z-10 w-full max-w-md mb-8">
                            <select onChange={(e) => handleChantSelection(CHANTS_DATA.find(c => c.id === parseInt(e.target.value))!)} value={selectedChant.id} className="w-full bg-black/50 border border-white/20 text-stone-200 text-base md:text-lg rounded-xl focus:ring-amber-500 focus:border-amber-500 block p-3.5 appearance-none shadow-[0_4px_20px_rgba(0,0,0,0.5)] outline-none tracking-wide cursor-pointer transition-all hover:border-white/40">
                                {CHANTS_DATA.map(c => <option key={c.id} value={c.id} className="bg-stone-900">{c.title}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-400">
                                &#9660;
                            </div>
                        </div>

                        <div className="relative z-10 w-full">
                            <JapaMala chant={selectedChant} onComplete={handleCompleteSadhana} t={t} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
