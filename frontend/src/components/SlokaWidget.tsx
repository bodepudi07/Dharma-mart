// This file is repurposed to house the new "Bhakti Chanting Zone" feature for all ages.
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { I18nContent, Chant, User, Badge } from '../types';
import { CHANTS_DATA, CHANTING_BADGES_DATA } from '../constants';
import { useToast } from '../contexts/ToastContext';
import { Icon } from './Icon';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/apiService';

type ViewMode = 'kids' | 'sadhana';
type KidsMode = 'chantAlong' | 'repeatLearn' | 'spellingPractice';
type ChantState = 'idle' | 'guru' | 'user' | 'recording' | 'playing';

// --- Confetti Burst Effect ---
const ConfettiBurst = ({ active }: { active: boolean }) => {
    if (!active) return null;
    const particles = Array.from({ length: 30 }, (_, i) => {
        const colors = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6'];
        const color = colors[i % colors.length];
        const angle = (i / 30) * 360;
        const distance = 60 + Math.random() * 100;
        const x = Math.cos((angle * Math.PI) / 180) * distance;
        const y = Math.sin((angle * Math.PI) / 180) * distance;
        const size = 4 + Math.random() * 8;
        const delay = Math.random() * 0.3;
        return (
            <div key={i} className="absolute rounded-full" style={{
                width: size, height: size, backgroundColor: color,
                left: '50%', top: '50%',
                animation: `confetti-fly 1s ease-out ${delay}s forwards`,
                transform: 'translate(-50%, -50%) scale(1)',
                '--tx': `${x}px`, '--ty': `${y}px`,
            } as React.CSSProperties} />
        );
    });
    return <div className="absolute inset-0 pointer-events-none z-50">{particles}</div>;
};

// --- Animated Star Reward ---
const StarReward = ({ count }: { count: number }) => (
    <div className="flex items-center gap-1">
        {Array.from({ length: 3 }, (_, i) => (
            <span key={i} className={`text-2xl transition-all duration-500 ${i < count ? 'text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'text-stone-600 scale-90'}`}
                style={{ animationDelay: `${i * 0.15}s` }}>⭐</span>
        ))}
    </div>
);

// --- XP Progress Bar ---
const XPBar = ({ xp, level }: { xp: number; level: number }) => {
    const xpForLevel = level * 50;
    const progress = Math.min((xp % xpForLevel) / xpForLevel * 100, 100);
    return (
        <div className="w-full max-w-xs">
            <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-amber-300 font-bold flex items-center gap-1">
                    <span className="text-base">🏆</span> Level {level}
                </span>
                <span className="text-stone-400">{xp % xpForLevel}/{xpForLevel} XP</span>
            </div>
            <div className="h-3 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
                <div className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${progress}%` }}>
                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                </div>
            </div>
        </div>
    );
};

// --- Difficulty Badge ---
const DifficultyBadge = ({ difficulty }: { difficulty?: string }) => {
    const config = {
        easy: { label: '🌱 Easy', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
        medium: { label: '🔥 Medium', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
        hard: { label: '💎 Hard', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/40' },
    };
    const c = config[(difficulty as keyof typeof config) || 'easy'] || config.easy;
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.bg}`}>{c.label}</span>;
};

// --- Streak Flame ---
const StreakFlame = ({ streak }: { streak: number }) => {
    if (streak < 2) return null;
    return (
        <div className="flex items-center gap-1 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/30 animate-bounce" style={{ animationDuration: '2s' }}>
            <span className="text-xl">🔥</span>
            <span className="text-orange-400 font-bold text-sm">{streak} Streak!</span>
        </div>
    );
};

// --- Spelling Practice Game ---
const SpellingPractice = ({ chant, onComplete, t }: { chant: Chant; onComplete: () => void; t: I18nContent }) => {
    const [currentLineIdx, setCurrentLineIdx] = useState(0);
    const [currentWordIdx, setCurrentWordIdx] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [showHint, setShowHint] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [lineComplete, setLineComplete] = useState(false);
    const [stars, setStars] = useState(3);
    const [showConfetti, setShowConfetti] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const phonetic = chant.phonetic || chant.mantra.map(line => line.split(' '));
    const words = chant.mantra[currentLineIdx]?.split(' ') || [];
    const currentWord = words[currentWordIdx] || '';
    const currentPhonetic = phonetic[currentLineIdx]?.[currentWordIdx] || '';

    useEffect(() => {
        inputRef.current?.focus();
        setIsCorrect(null);
        setUserInput('');
        setShowHint(false);
        setAttempts(0);
        setStars(3);
    }, [currentLineIdx, currentWordIdx]);

    const normalizeText = (text: string) => text.toLowerCase().replace(/[,.'"\s]/g, '').trim();

    const checkAnswer = () => {
        if (!userInput.trim()) return;
        const normalized = normalizeText(userInput);
        const expected = normalizeText(currentWord);

        if (normalized === expected) {
            setIsCorrect(true);
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 1200);

            setTimeout(() => {
                if (currentWordIdx + 1 < words.length) {
                    setCurrentWordIdx(prev => prev + 1);
                } else if (currentLineIdx + 1 < chant.mantra.length) {
                    setLineComplete(true);
                    setTimeout(() => {
                        setCurrentLineIdx(prev => prev + 1);
                        setCurrentWordIdx(0);
                        setLineComplete(false);
                    }, 1500);
                } else {
                    setLineComplete(true);
                    setTimeout(() => onComplete(), 1500);
                }
            }, 800);
        } else {
            setIsCorrect(false);
            setAttempts(prev => prev + 1);
            setStars(prev => Math.max(1, prev - 1));
            if (attempts >= 1) setShowHint(true);
            setTimeout(() => {
                setIsCorrect(null);
                setUserInput('');
                inputRef.current?.focus();
            }, 1000);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 p-4 relative">
            <ConfettiBurst active={showConfetti} />
            <style>{`
                @keyframes confetti-fly {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); opacity: 0; }
                }
                @keyframes word-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
                @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
            `}</style>

            {/* Progress bar */}
            <div className="w-full max-w-md">
                <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-stone-400">Line {currentLineIdx + 1}/{chant.mantra.length}</span>
                    <StarReward count={stars} />
                </div>
                <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${((currentLineIdx * words.length + currentWordIdx) / (chant.mantra.reduce((a, l) => a + l.split(' ').length, 0))) * 100}%` }} />
                </div>
            </div>

            {/* Current line display with word highlighting */}
            <div className="bg-black/40 rounded-2xl p-6 border border-white/10 w-full max-w-md">
                <p className="text-stone-500 text-xs uppercase tracking-widest mb-3">Spell each word correctly</p>
                <div className="flex flex-wrap gap-2 justify-center">
                    {words.map((word, idx) => (
                        <span key={idx} className={`text-lg md:text-xl font-serif px-2 py-1 rounded-lg transition-all duration-300 ${idx < currentWordIdx ? 'text-emerald-400 bg-emerald-500/10 line-through decoration-emerald-500/50' :
                            idx === currentWordIdx ? 'text-amber-300 bg-amber-500/15 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]' :
                                'text-stone-600'
                            }`} style={idx === currentWordIdx ? { animation: 'word-bounce 1.5s ease-in-out infinite' } : {}}>
                            {idx <= currentWordIdx ? word : '•'.repeat(word.length)}
                        </span>
                    ))}
                </div>
            </div>

            {/* Input area */}
            {!lineComplete ? (
                <div className="w-full max-w-md space-y-3">
                    {showHint && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2">
                            <span className="text-xl">💡</span>
                            <div>
                                <p className="text-amber-400 text-sm font-medium">Pronunciation Hint:</p>
                                <p className="text-amber-300 font-serif text-lg">{currentPhonetic}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                            placeholder={`Type "${currentWord.substring(0, 2)}..." here`}
                            className={`flex-1 bg-black/50 border-2 rounded-xl px-4 py-3 text-lg text-white outline-none transition-all duration-300 ${isCorrect === true ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' :
                                isCorrect === false ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' :
                                    'border-white/20 focus:border-amber-500'
                                }`}
                            style={isCorrect === false ? { animation: 'shake 0.4s ease-in-out' } : {}}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                        />
                        <button onClick={checkAnswer}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-6 py-3 rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] border border-amber-400/50">
                            ✓
                        </button>
                    </div>

                    {isCorrect === true && (
                        <p className="text-emerald-400 text-center font-bold text-lg animate-bounce">✨ Correct! Amazing! ✨</p>
                    )}
                    {isCorrect === false && (
                        <p className="text-red-400 text-center font-medium">Not quite! Try again 💪</p>
                    )}

                    <div className="flex justify-center gap-3">
                        <button onClick={() => setShowHint(true)}
                            className="text-xs text-stone-500 hover:text-amber-400 transition-colors flex items-center gap-1">
                            <span>💡</span> Show Hint
                        </button>
                        <button onClick={() => {
                            const utterance = new SpeechSynthesisUtterance(currentWord);
                            utterance.rate = 0.7;
                            utterance.pitch = 1.1;
                            const voices = window.speechSynthesis.getVoices();
                            utterance.voice = voices.find(v => v.lang.startsWith('hi-IN')) || voices.find(v => v.lang.startsWith('en-IN')) || null;
                            window.speechSynthesis.speak(utterance);
                        }}
                            className="text-xs text-stone-500 hover:text-amber-400 transition-colors flex items-center gap-1">
                            <span>🔊</span> Listen
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center space-y-2">
                    <p className="text-3xl">🎉</p>
                    <p className="text-emerald-400 font-bold text-xl">Line Complete!</p>
                    <StarReward count={stars} />
                </div>
            )}
        </div>
    );
};


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
    const [kidsXP, setKidsXP] = useState(() => { try { const s = localStorage.getItem('dd-kids-xp'); return s ? parseInt(s, 10) : 0; } catch { return 0; } });
    const [kidsLevel, setKidsLevel] = useState(() => { try { const s = localStorage.getItem('dd-kids-level'); return s ? parseInt(s, 10) : 1; } catch { return 1; } });
    const [kidsStreak, setKidsStreak] = useState(() => { try { const s = localStorage.getItem('dd-kids-streak'); return s ? parseInt(s, 10) : 0; } catch { return 0; } });
    const [lastChantDate, setLastChantDate] = useState(() => { try { return localStorage.getItem('dd-kids-last-date') || ''; } catch { return ''; } });
    const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
    const [chantState, setChantState] = useState<ChantState>('idle');
    const [currentLine, setCurrentLine] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);

    // Sadhana Mode State
    const [sadhanaTab, setSadhanaTab] = useState<'mala' | 'recite'>('mala');
    const [reciteActiveLine, setReciteActiveLine] = useState(0);
    const [reciteRecording, setReciteRecording] = useState<string | null>(null);
    const [isReciteRecording, setIsReciteRecording] = useState(false);
    const [reciteSpelling, setReciteSpelling] = useState<Record<number, boolean>>({});
    const reciteMediaRef = useRef<MediaRecorder | null>(null);

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

    // --- Gamification: XP & Level System ---
    const addXP = useCallback((amount: number) => {
        setKidsXP(prev => {
            const newXP = prev + amount;
            const xpForLevel = kidsLevel * 50;
            if (newXP >= xpForLevel) {
                setKidsLevel(l => {
                    const newLevel = l + 1;
                    localStorage.setItem('dd-kids-level', String(newLevel));
                    setShowLevelUp(true);
                    setTimeout(() => setShowLevelUp(false), 3000);
                    return newLevel;
                });
            }
            localStorage.setItem('dd-kids-xp', String(newXP));
            return newXP;
        });
    }, [kidsLevel]);

    // --- Streak Tracking ---
    const updateStreak = useCallback(() => {
        const today = new Date().toDateString();
        if (lastChantDate === today) return;

        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastChantDate === yesterday) {
            setKidsStreak(prev => {
                const newStreak = prev + 1;
                localStorage.setItem('dd-kids-streak', String(newStreak));
                return newStreak;
            });
        } else if (lastChantDate !== today) {
            setKidsStreak(1);
            localStorage.setItem('dd-kids-streak', '1');
        }
        setLastChantDate(today);
        localStorage.setItem('dd-kids-last-date', today);
    }, [lastChantDate]);

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
        addXP(10);
        updateStreak();
    }, [addXP, updateStreak]);

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
        setReciteSpelling({});
        setReciteRecording(null);
        setReciteActiveLine(0);
    };

    const handleSpellingComplete = () => {
        setChantCount(prev => prev + 1);
        addXP(25); // More XP for spelling practice
        updateStreak();
        addToast('🎉 Amazing! You spelled the whole mantra correctly! +25 XP', 'success');
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
            {/* Level Up Celebration */}
            {showLevelUp && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="text-center space-y-4 animate-bounce">
                        <p className="text-6xl">🎊</p>
                        <p className="text-4xl font-bold text-amber-400 font-serif drop-shadow-[0_0_30px_rgba(245,158,11,0.8)]">Level Up!</p>
                        <p className="text-2xl text-white">Level {kidsLevel} 🏆</p>
                        <p className="text-stone-400">Keep chanting for more rewards!</p>
                    </div>
                </div>
            )}

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

                        {/* Top Stats Bar */}
                        <div className="relative z-10 w-full flex flex-wrap items-center justify-between gap-4 mb-4 bg-black/30 rounded-2xl p-4 border border-white/5">
                            <XPBar xp={kidsXP} level={kidsLevel} />
                            <div className="flex items-center gap-3">
                                <StreakFlame streak={kidsStreak} />
                                <div className="bg-white/5 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
                                    <span className="text-lg">🕉️</span>
                                    <span className="text-amber-400 font-bold">{chantCount}</span>
                                    <span className="text-stone-500 text-xs">chants</span>
                                </div>
                            </div>
                        </div>

                        {/* Daily Challenge & Motivation Banner */}
                        <div className="relative z-10 w-full mb-6">
                            <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 rounded-2xl p-4 border border-purple-500/20 flex items-center gap-4">
                                <div className="text-4xl animate-bounce" style={{ animationDuration: '2s' }}>
                                    {kidsStreak >= 7 ? '🏆' : kidsStreak >= 3 ? '⭐' : '🌟'}
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-bold text-sm tracking-wider">
                                        {kidsStreak === 0 ? '🎯 Start Your Chanting Journey!' :
                                            kidsStreak >= 7 ? `🔥 ${kidsStreak}-Day Master Streak!` :
                                                kidsStreak >= 3 ? `⚡ ${kidsStreak}-Day Streak — Keep Going!` :
                                                    `✨ Day ${kidsStreak} — You're Doing Great!`}
                                    </p>
                                    <p className="text-stone-400 text-xs mt-0.5">
                                        {chantCount < 5 ? 'Complete 5 chants to earn your first badge!' :
                                            chantCount < 25 ? `${25 - chantCount} more to unlock 🌿 Devotee badge!` :
                                                chantCount < 50 ? `${50 - chantCount} more to unlock 🪷 Scholar badge!` :
                                                    `Level ${kidsLevel} — ${(kidsLevel * 100) - kidsXP} XP to next level!`}
                                    </p>
                                </div>
                                <div className="shrink-0 bg-white/10 rounded-xl px-3 py-2 border border-white/10 text-center">
                                    <p className="text-amber-400 font-bold text-lg">{Math.min(chantCount, 3)}/3</p>
                                    <p className="text-stone-500 text-[10px] uppercase tracking-wider">Today</p>
                                </div>
                            </div>
                        </div>
                        <div className="relative z-10 flex flex-wrap justify-center gap-2 mb-8">
                            <button onClick={() => setKidsMode('chantAlong')} className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 flex items-center gap-2 ${kidsMode === 'chantAlong' ? 'bg-amber-500 text-amber-950 shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105' : 'bg-white/10 text-stone-300 hover:bg-white/20'}`}>
                                <span>🎵</span> {t.chantAlongMode}
                            </button>
                            <button onClick={() => setKidsMode('repeatLearn')} className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 flex items-center gap-2 ${kidsMode === 'repeatLearn' ? 'bg-amber-500 text-amber-950 shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105' : 'bg-white/10 text-stone-300 hover:bg-white/20'}`}>
                                <span>🔄</span> {t.repeatLearnMode}
                            </button>
                            <button onClick={() => setKidsMode('spellingPractice')} className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 flex items-center gap-2 ${kidsMode === 'spellingPractice' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] scale-105' : 'bg-white/10 text-stone-300 hover:bg-white/20'}`}>
                                <span>✏️</span> Spelling Practice
                            </button>
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
                                        {c.difficulty && <DifficultyBadge difficulty={c.difficulty} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Spelling Practice Mode */}
                        {kidsMode === 'spellingPractice' ? (
                            <div className="relative z-10 w-full">
                                <div className="text-center mb-6">
                                    <h3 className="text-2xl font-serif text-amber-300 mb-1">{selectedChant.title}</h3>
                                    <p className="text-stone-500 text-sm">Practice spelling each word of the mantra correctly!</p>
                                    <p className="text-amber-400/60 text-xs mt-1">+25 XP per completed mantra</p>
                                </div>
                                <SpellingPractice chant={selectedChant} onComplete={handleSpellingComplete} t={t} />
                            </div>
                        ) : (
                            <>
                                <div className="relative z-10">
                                    <AnimatedDeity chant={selectedChant} currentUser={currentUser} />
                                </div>

                                <div className="relative z-10 text-3xl md:text-5xl font-serif text-amber-300 mb-6 h-32 flex items-center justify-center p-4 text-center leading-relaxed drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)]">
                                    <p>{selectedChant.sanskrit}</p>
                                </div>

                                {/* Phonetic pronunciation guide */}
                                {selectedChant.phonetic && chantState === 'idle' && (
                                    <div className="relative z-10 mb-4 bg-black/30 rounded-xl p-4 border border-white/5 max-w-md w-full">
                                        <p className="text-xs text-stone-500 uppercase tracking-widest mb-2">📖 Pronunciation Guide</p>
                                        {selectedChant.phonetic.map((line, i) => (
                                            <p key={i} className="text-stone-300 font-mono text-sm leading-relaxed">
                                                {line.map((word, j) => (
                                                    <span key={j} className="inline-block mr-2 px-1 py-0.5 rounded bg-white/5 text-amber-300/80 mb-1">{word}</span>
                                                ))}
                                            </p>
                                        ))}
                                    </div>
                                )}

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
                            </>
                        )}

                        {/* Story Section */}
                        <div className="relative z-10 mt-8 w-full bg-gradient-to-r from-amber-500/5 to-orange-500/5 rounded-2xl p-5 border border-amber-500/10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">📜</span>
                                <p className="text-amber-400 font-bold text-sm uppercase tracking-wider">{t.storyMode}</p>
                            </div>
                            <p className="text-stone-300 text-sm leading-relaxed italic">{selectedChant.story}</p>
                        </div>

                        {/* Badges Section */}
                        <div className="relative z-10 mt-8 w-full pt-6 border-t border-white/10">
                            <h4 className="font-medium text-stone-400 tracking-wider text-xs uppercase mb-4">{t.badgeCollection}</h4>
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
                        <p className="relative z-10 text-stone-400 font-light tracking-wide mb-4">{t.sadhanaModeSubtitle}</p>

                        {/* Sadhana Sub-Mode Tabs */}
                        <div className="relative z-10 flex gap-2 bg-black/30 p-1.5 rounded-full border border-white/10 mb-6">
                            <button onClick={() => setSadhanaTab('mala')} className={`px-5 py-2 rounded-full text-sm tracking-wider transition-all duration-300 ${sadhanaTab === 'mala' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'text-stone-400 hover:text-white'}`}>
                                🕉️ Japa Mala
                            </button>
                            <button onClick={() => setSadhanaTab('recite')} className={`px-5 py-2 rounded-full text-sm tracking-wider transition-all duration-300 ${sadhanaTab === 'recite' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'text-stone-400 hover:text-white'}`}>
                                🎙️ Recite & Verify
                            </button>
                        </div>

                        <div className="relative z-10 w-full max-w-md mb-6">
                            <select onChange={(e) => handleChantSelection(CHANTS_DATA.find(c => c.id === parseInt(e.target.value))!)} value={selectedChant.id} className="w-full bg-black/50 border border-white/20 text-stone-200 text-base md:text-lg rounded-xl focus:ring-amber-500 focus:border-amber-500 block p-3.5 appearance-none shadow-[0_4px_20px_rgba(0,0,0,0.5)] outline-none tracking-wide cursor-pointer transition-all hover:border-white/40">
                                {CHANTS_DATA.map(c => <option key={c.id} value={c.id} className="bg-stone-900">{c.title}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-400">
                                &#9660;
                            </div>
                        </div>

                        {sadhanaTab === 'mala' && (
                            <div className="relative z-10 w-full">
                                <JapaMala chant={selectedChant} onComplete={handleCompleteSadhana} t={t} />
                            </div>
                        )}

                        {sadhanaTab === 'recite' && (
                            <div className="relative z-10 w-full max-w-2xl space-y-6">
                                {/* Sanskrit Display */}
                                <div className="text-center mb-4">
                                    <p className="font-serif text-3xl md:text-4xl text-amber-300 drop-shadow-[0_2px_15px_rgba(245,158,11,0.4)] leading-relaxed mb-3">{selectedChant.sanskrit}</p>
                                    <p className="text-stone-500 text-sm uppercase tracking-widest">{selectedChant.deity} • {selectedChant.category}</p>
                                </div>

                                {/* Line-by-line Sloka Display */}
                                <div className="space-y-3">
                                    {selectedChant.mantra.map((line, idx) => (
                                        <div key={idx} className={`group bg-black/30 rounded-xl p-4 border transition-all duration-300 cursor-pointer hover:bg-black/50 ${reciteActiveLine === idx ? 'border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-white/10'}`}
                                            onClick={() => setReciteActiveLine(idx)}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <p className={`font-serif text-lg transition-colors ${reciteActiveLine === idx ? 'text-amber-300' : 'text-stone-200'}`}>{line}</p>
                                                    {selectedChant.phonetic && selectedChant.phonetic[idx] && (
                                                        <p className="text-stone-500 text-xs mt-1 font-mono tracking-wider">
                                                            {selectedChant.phonetic[idx].join(' · ')}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const utterance = new SpeechSynthesisUtterance(line);
                                                        utterance.rate = 0.7; utterance.pitch = 1.0;
                                                        const voices = window.speechSynthesis.getVoices();
                                                        utterance.voice = voices.find(v => v.lang.startsWith('hi-IN')) || voices.find(v => v.lang.startsWith('en-IN')) || null;
                                                        window.speechSynthesis.cancel();
                                                        window.speechSynthesis.speak(utterance);
                                                    }}
                                                    className="shrink-0 w-9 h-9 rounded-full bg-white/10 hover:bg-amber-500/30 flex items-center justify-center transition-all hover:scale-110 border border-white/10"
                                                    title="Listen to correct pronunciation"
                                                >
                                                    <Icon name="speaker" className="w-4 h-4 text-amber-400" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Listen to Full Mantra */}
                                <button
                                    onClick={() => {
                                        const text = selectedChant.mantra.join('. ');
                                        const utterance = new SpeechSynthesisUtterance(text);
                                        utterance.rate = 0.65; utterance.pitch = 1.0;
                                        const voices = window.speechSynthesis.getVoices();
                                        utterance.voice = voices.find(v => v.lang.startsWith('hi-IN')) || voices.find(v => v.lang.startsWith('en-IN')) || null;
                                        window.speechSynthesis.cancel();
                                        window.speechSynthesis.speak(utterance);
                                    }}
                                    className="w-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-300 font-medium hover:bg-amber-500/20 transition-all flex items-center justify-center gap-3 tracking-wider"
                                >
                                    <Icon name="speaker" className="w-5 h-5" /> Listen Complete Mantra (Correct Pronunciation)
                                </button>

                                {/* Record Your Chanting */}
                                <div className="bg-black/30 rounded-2xl p-6 border border-white/10 space-y-4">
                                    <h3 className="text-white font-medium tracking-wider flex items-center gap-2">
                                        <Icon name="microphone" className="w-5 h-5 text-red-400" /> Record Your Chanting
                                    </h3>
                                    <p className="text-stone-500 text-sm">Record yourself chanting the sloka, then play back to compare with the correct pronunciation above.</p>

                                    <div className="flex flex-wrap gap-3 justify-center">
                                        {!reciteRecording ? (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                                        const mr = new MediaRecorder(stream);
                                                        const chunks: Blob[] = [];
                                                        mr.ondataavailable = e => chunks.push(e.data);
                                                        mr.onstop = () => {
                                                            const blob = new Blob(chunks, { type: mr.mimeType });
                                                            setReciteRecording(URL.createObjectURL(blob));
                                                            stream.getTracks().forEach(t => t.stop());
                                                        };
                                                        reciteMediaRef.current = mr;
                                                        mr.start();
                                                        setIsReciteRecording(true);
                                                    } catch { addToast('Microphone access required to record your chanting.', 'error'); }
                                                }}
                                                className="bg-red-500/20 text-red-400 border border-red-500/40 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-red-500/30 transition-all hover:scale-105"
                                            >
                                                <Icon name="microphone" className="w-5 h-5" /> Start Recording
                                            </button>
                                        ) : null}

                                        {isReciteRecording && (
                                            <button
                                                onClick={() => {
                                                    reciteMediaRef.current?.stop();
                                                    setIsReciteRecording(false);
                                                }}
                                                className="bg-red-600 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 animate-pulse border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                                            >
                                                <Icon name="stop-circle" className="w-5 h-5" /> Stop Recording
                                            </button>
                                        )}

                                        {reciteRecording && !isReciteRecording && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        const audio = new Audio(reciteRecording);
                                                        audio.play();
                                                    }}
                                                    className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-emerald-500/30 transition-all hover:scale-105"
                                                >
                                                    <Icon name="play" className="w-5 h-5" /> Play My Recording
                                                </button>
                                                <button
                                                    onClick={() => setReciteRecording(null)}
                                                    className="bg-white/10 text-stone-400 border border-white/10 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-white/20 transition-all"
                                                >
                                                    <Icon name="microphone" className="w-5 h-5" /> Re-Record
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {reciteRecording && !isReciteRecording && (
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-400 text-sm text-center">
                                            ✅ Recording saved! Use "Listen Complete Mantra" above to hear the correct version, then "Play My Recording" to compare.
                                        </div>
                                    )}
                                </div>

                                {/* Spelling Verification for Adults */}
                                <div className="bg-black/30 rounded-2xl p-6 border border-white/10 space-y-4">
                                    <h3 className="text-white font-medium tracking-wider flex items-center gap-2">
                                        ✏️ Sloka Spelling Verification
                                    </h3>
                                    <p className="text-stone-500 text-sm">Type each line of the mantra to verify your spelling knowledge.</p>

                                    {selectedChant.mantra.map((line, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <label className="text-xs text-stone-500 uppercase tracking-widest">Line {idx + 1}</label>
                                            <input
                                                type="text"
                                                placeholder={`Type line ${idx + 1}...`}
                                                className={`w-full bg-black/50 border rounded-lg px-4 py-2.5 text-white outline-none transition-all ${reciteSpelling[idx] === undefined ? 'border-white/15 focus:border-amber-500' :
                                                    reciteSpelling[idx] ? 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]' :
                                                        'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                                                    }`}
                                                onChange={(e) => {
                                                    const val = e.target.value.toLowerCase().replace(/[,.'"\s]/g, '').trim();
                                                    const expected = line.toLowerCase().replace(/[,.'"\s]/g, '').trim();
                                                    setReciteSpelling(prev => ({ ...prev, [idx]: val === expected }));
                                                }}
                                                autoComplete="off" autoCorrect="off" spellCheck={false}
                                            />
                                            {reciteSpelling[idx] !== undefined && (
                                                <p className={`text-xs ${reciteSpelling[idx] ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {reciteSpelling[idx] ? '✅ Correct!' : `❌ Expected: "${line}"`}
                                                </p>
                                            )}
                                        </div>
                                    ))}

                                    {Object.keys(reciteSpelling).length === selectedChant.mantra.length && Object.values(reciteSpelling).every(Boolean) && (
                                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center space-y-2">
                                            <p className="text-2xl">🎉</p>
                                            <p className="text-emerald-400 font-bold">Perfect! All lines spelled correctly!</p>
                                            <p className="text-stone-500 text-sm">Your knowledge of this sloka's spelling is verified.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Story Section */}
                                <div className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 rounded-2xl p-5 border border-amber-500/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg">📜</span>
                                        <p className="text-amber-400 font-bold text-sm uppercase tracking-wider">{t.storyMode}</p>
                                    </div>
                                    <p className="text-stone-300 text-sm leading-relaxed italic">{selectedChant.story}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
