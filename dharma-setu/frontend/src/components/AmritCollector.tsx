import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';
import { useToast } from '../contexts/ToastContext';

const MAX_ENERGY = 100;
const REFILL_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

export const AmritCollector = () => {
    const [energy, setEnergy] = useState(0);
    const [isFull, setIsFull] = useState(false);
    const [showRewardParticles, setShowRewardParticles] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        // Load last collected time from local storage
        const lastCollectedStr = localStorage.getItem('amrit_last_collected');
        const lastCollectedTime = lastCollectedStr ? parseInt(lastCollectedStr, 10) : Date.now() - (REFILL_DURATION_MS * 0.9); // Default to 90% full for new users

        const updateEnergy = () => {
            const now = Date.now();
            const elapsed = now - lastCollectedTime;

            let percentFull = (elapsed / REFILL_DURATION_MS) * 100;
            if (percentFull >= 100) {
                percentFull = 100;
                setIsFull(true);
            } else {
                setIsFull(false);
            }

            setEnergy(Math.floor(percentFull));
        };

        updateEnergy();
        const interval = setInterval(updateEnergy, 60000); // Check every minute

        return () => clearInterval(interval);
    }, []);

    const handleCollect = () => {
        if (!isFull) {
            addToast(`Amrit is still brewing... Come back in a few hours.`, 'info');
            return;
        }

        // Collect reward
        setShowRewardParticles(true);
        addToast('+50 Dharma Coins Collected! Inner peace expanding.', 'success');

        // Reset timer
        localStorage.setItem('amrit_last_collected', Date.now().toString());
        setEnergy(0);
        setIsFull(false);

        setTimeout(() => setShowRewardParticles(false), 2000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center">
            <AnimatePresence>
                {isFull && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="mb-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse"
                    >
                        Collect Now
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={handleCollect}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-lg transition-all duration-300 ${isFull
                    ? 'bg-amber-100 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:scale-110'
                    : 'bg-white border-stone-200 opacity-80 hover:opacity-100'
                    }`}
            >
                {/* Water level fill background */}
                <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-400 to-amber-200 rounded-b-full rounded-t-[40%] transition-all duration-1000 ease-in-out"
                    style={{ height: `${energy}%`, opacity: 0.8 }}
                />

                {/* Glass reflection */}
                <div className="absolute inset-0 rounded-full border-[3px] border-white/40 shadow-inner z-10" />

                {/* Icon mapping */}
                <Icon
                    name="droplet"
                    className={`w-8 h-8 relative z-20 transition-all ${isFull ? 'text-amber-600 animate-bounce' : 'text-stone-400 grayscale'}`}
                />

                {showRewardParticles && (
                    <div className="absolute inset-0 z-30 pointer-events-none">
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                                animate={{
                                    opacity: 0,
                                    scale: 1.5,
                                    x: (Math.random() - 0.5) * 100,
                                    y: (Math.random() - 0.5) * 100 - 50
                                }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="absolute top-1/2 left-1/2 w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_10px_#facc15]"
                            />
                        ))}
                    </div>
                )}
            </button>

            {/* Quick progress bar below */}
            <div className="w-12 h-1.5 bg-stone-200 rounded-full mt-2 overflow-hidden shadow-inner">
                <div
                    className={`h-full transition-all duration-1000 ${isFull ? 'bg-amber-500' : 'bg-primary'}`}
                    style={{ width: `${energy}%` }}
                />
            </div>
            {!isFull && (
                <span className="text-[9px] text-stone-500 font-bold mt-1 uppercase tracking-wider">{energy}%</span>
            )}
        </div>
    );
};
