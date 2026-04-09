import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';
import { I18nContent } from '../types';

interface WelcomeFlowProps {
    t: I18nContent;
    onComplete: () => void;
    onNavigate: (view: string) => void;
}

const STEPS = [
    {
        icon: 'cosmic-logo' as const,
        title: 'Welcome to Dharma Setu',
        subtitle: 'Your digital bridge to sacred India',
        description: 'Explore ancient temples, book poojas, join yatras, and grow spiritually — all from one place.',
        color: 'from-primary to-secondary',
    },
    {
        icon: 'temple' as const,
        title: 'Discover Temples',
        subtitle: '150+ sacred temples across India',
        description: 'Browse temples by state, check live crowd levels, book darshan, and view 360° virtual tours.',
        color: 'from-amber-500 to-orange-600',
    },
    {
        icon: 'flame' as const,
        title: 'Book Poojas & Sevas',
        subtitle: 'Remote poojas at rural temples',
        description: 'Book poojas performed by verified pandits. Receive geotagged video proof and prasad delivered home.',
        color: 'from-red-500 to-rose-600',
    },
    {
        icon: 'compass' as const,
        title: 'Plan Sacred Yatras',
        subtitle: 'AI-powered pilgrimage planner',
        description: 'Build custom pilgrimage itineraries with route planning, accommodation, and group bookings.',
        color: 'from-emerald-500 to-teal-600',
    },
    {
        icon: 'book-open' as const,
        title: 'Sacred Knowledge',
        subtitle: '190+ spiritual texts & scriptures',
        description: 'Read the Vedas, Upanishads, Bhagavad Gita, and more in your language. Chant mantras with AI guidance.',
        color: 'from-indigo-500 to-purple-600',
    },
];

export const WelcomeFlow: React.FC<WelcomeFlowProps> = ({ t, onComplete, onNavigate }) => {
    const [step, setStep] = useState(0);

    const handleNext = () => {
        if (step < STEPS.length - 1) {
            setStep(step + 1);
        } else {
            localStorage.setItem('dharmasetu_onboarded', 'true');
            onComplete();
        }
    };

    const handleSkip = () => {
        localStorage.setItem('dharmasetu_onboarded', 'true');
        onComplete();
    };

    const current = STEPS[step];

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
                key={step}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ duration: 0.4, type: 'spring', bounce: 0.3 }}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
                {/* Visual Header */}
                <div className={`bg-gradient-to-br ${current.color} p-8 pb-12 text-center relative`}>
                    <div className="absolute inset-0 bg-white/5 background" />
                    <div className="relative z-10">
                        <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                            <Icon name={current.icon} className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
                            {current.title}
                        </h2>
                        <p className="text-white/80 text-sm mt-1 font-medium">{current.subtitle}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 -mt-6">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
                        <p className="text-stone-600 text-sm leading-relaxed text-center">
                            {current.description}
                        </p>
                    </div>

                    {/* Progress Dots */}
                    <div className="flex justify-center gap-2 my-6">
                        {STEPS.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setStep(i)}
                                className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-primary' : 'w-2 bg-stone-200 hover:bg-stone-300'}`}
                                aria-label={`Go to step ${i + 1}`}
                            />
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleSkip}
                            className="text-sm text-stone-400 hover:text-stone-600 font-medium transition-colors"
                        >
                            Skip
                        </button>
                        <button
                            onClick={handleNext}
                            className="bg-gradient-to-r from-primary to-secondary text-white font-bold px-8 py-3 rounded-xl text-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                        >
                            {step < STEPS.length - 1 ? 'Next' : 'Get Started'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
