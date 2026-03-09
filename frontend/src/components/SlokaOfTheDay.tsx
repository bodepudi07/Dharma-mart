import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sloka, I18nContent } from '../types';
import { explainScripture, getDailySloka } from '../services/aiService';
import { Icon } from './Icon';

interface SlokaOfTheDayProps {
    sloka: Sloka;
    t: I18nContent;
}

export const SlokaOfTheDay = ({ sloka, t }: SlokaOfTheDayProps) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [explanation, setExplanation] = useState('');
    const [isExplaining, setIsExplaining] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);

    const synthRef = useRef(window.speechSynthesis);
    const isSpeechSupported = !!synthRef.current;

    useEffect(() => {
        // Cleanup speech synthesis on component unmount or when the sloka changes
        const synth = synthRef.current;
        return () => {
            if (synth?.speaking) {
                synth.cancel();
            }
            setIsSpeaking(false);
            setShowExplanation(false);
            setExplanation('');
        };
    }, [sloka]);

    const handleListen = () => {
        const synth = synthRef.current;
        if (!isSpeechSupported || !synth) return;

        if (synth.speaking) {
            synth.cancel();
            setIsSpeaking(false);
            return;
        }

        const speak = () => {
            const allVoices = synth.getVoices();
            if (allVoices.length === 0) {
                console.error("No voices available for speech synthesis.");
                // Potentially show a toast to the user
                return;
            }

            // --- Sanskrit utterance ---
            const utteranceSanskrit = new SpeechSynthesisUtterance(sloka.text);
            utteranceSanskrit.lang = 'hi-IN';
            utteranceSanskrit.rate = 0.8;
            // Find the best available Hindi voice
            const hindiVoice = allVoices.find(voice => voice.lang === 'hi-IN' && voice.name.includes('Google')) || allVoices.find(voice => voice.lang === 'hi-IN');
            if (hindiVoice) {
                utteranceSanskrit.voice = hindiVoice;
            }

            // --- English meaning utterance ---
            const utteranceMeaning = new SpeechSynthesisUtterance(sloka.meaning);
            utteranceMeaning.lang = 'en-US';
            utteranceMeaning.rate = 0.9;
            // Find the best available English voice
            const englishVoice = allVoices.find(voice => voice.lang === 'en-US' && voice.name.includes('Google')) || allVoices.find(voice => voice.lang.startsWith('en-'));
            if (englishVoice) {
                utteranceMeaning.voice = englishVoice;
            }

            // --- Event Handlers ---
            utteranceSanskrit.onstart = () => setIsSpeaking(true);

            utteranceSanskrit.onend = () => {
                // Check if cancel() was called, which stops the synth
                if (synth.speaking) {
                    synth.speak(utteranceMeaning);
                } else {
                    // This case happens if the user presses "Stop" during the Sanskrit part
                    setIsSpeaking(false);
                }
            };

            utteranceMeaning.onend = () => setIsSpeaking(false);

            const onError = (event: SpeechSynthesisErrorEvent) => {
                console.error(`Speech synthesis error:`, event.error);
                setIsSpeaking(false);
            }
            utteranceSanskrit.onerror = onError;
            utteranceMeaning.onerror = onError;

            // Start speaking
            synth.speak(utteranceSanskrit);
        };

        // Voices may load asynchronously. If they aren't loaded, wait for the `voiceschanged` event.
        if (synth.getVoices().length === 0) {
            synth.onvoiceschanged = speak;
        } else {
            speak();
        }
    };

    const handleExplainDeeper = async () => {
        if (!showExplanation && !explanation) { // Fetch only if not already fetched
            setIsExplaining(true);
            setShowExplanation(true);
            try {
                const prompt = `this sloka: "${sloka.text}" which is transliterated as "${sloka.translation}" and means "${sloka.meaning}"`;
                const result = await explainScripture(prompt);
                setExplanation(result);
            } catch (error) {
                console.error("Failed to get explanation", error);
                setExplanation("Sorry, the Guru could not provide a deeper explanation at this time. Please try again later.");
            } finally {
                setIsExplaining(false);
            }
        } else {
            setShowExplanation(!showExplanation);
        }
    };

    return (
        <div className="bg-white border border-stone-200 rounded-[2rem] p-8 md:p-12 text-center shadow-sm w-full relative overflow-hidden group transition-all duration-500 hover:border-primary/30">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="flex justify-center items-center mb-8 gap-4">
                <div className="h-px w-12 bg-stone-200"></div>
                <Icon name="om" className="h-6 w-6 text-primary/60" />
                <h2 className="text-xs uppercase tracking-[0.3em] font-semibold text-stone-500">{t.dailySloka}</h2>
                <Icon name="om" className="h-6 w-6 text-primary/60" />
                <div className="h-px w-12 bg-stone-200"></div>
            </div>

            <p className="text-2xl md:text-4xl leading-relaxed text-ink font-serif mb-10 tracking-wide">
                {sloka.text}
            </p>

            <div className="grid md:grid-cols-2 gap-8 text-left border-t border-stone-100 pt-10">
                <div className="space-y-3">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-primary/80">{t.translation}</h4>
                    <p className="text-stone-600 text-sm leading-relaxed italic">{sloka.translation}</p>
                </div>
                <div className="space-y-3">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-primary/80">{t.meaning}</h4>
                    <p className="text-stone-600 text-sm leading-relaxed">{sloka.meaning}</p>
                </div>
            </div>

            <div className="mt-12 flex flex-wrap justify-center items-center gap-4">
                <button
                    onClick={handleListen}
                    disabled={!isSpeechSupported}
                    className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300 ${isSpeaking
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-ink border border-stone-200'
                        }`}
                >
                    <Icon name="speaker" className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
                    <span className="text-xs font-bold tracking-wider uppercase">{isSpeaking ? 'Stop' : t.listen}</span>
                </button>
                <button
                    onClick={handleExplainDeeper}
                    disabled={isExplaining}
                    className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300 ${showExplanation
                            ? 'bg-stone-200 text-ink border border-stone-300'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-ink border border-stone-200'
                        }`}
                >
                    <Icon name="info" className="w-4 h-4" />
                    <span className="text-xs font-bold tracking-wider uppercase">{showExplanation ? 'Hide Explanation' : 'Explain Deeper'}</span>
                </button>
            </div>

            {showExplanation && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-10 text-left p-8 bg-stone-50 rounded-2xl border border-stone-200 max-w-3xl mx-auto"
                >
                    {isExplaining ? (
                        <div className="flex items-center justify-center gap-4 text-stone-500 py-6">
                            <Icon name="lotus" className="w-5 h-5 animate-spin" />
                            <span className="text-xs tracking-widest uppercase font-medium">{t.guruThinking}</span>
                        </div>
                    ) : (
                        <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap font-light">{explanation}</p>
                    )}
                </motion.div>
            )}
        </div>
    );
};
