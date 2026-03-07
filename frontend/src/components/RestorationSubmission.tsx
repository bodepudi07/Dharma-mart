
import React, { useState } from 'react';
import { I18nContent, Language } from '../types';
import { Icon } from './Icon';
import { motion } from 'motion/react';
import { useToast } from '../contexts/ToastContext';

interface RestorationSubmissionProps {
    t: I18nContent;
    language: Language;
    onNavigate: (view: any) => void;
    onSubmit: (data: any) => Promise<void>;
}

export const RestorationSubmission = ({ t, language, onNavigate, onSubmit }: RestorationSubmissionProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        history: '',
        currentCondition: '',
        contactEmail: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSubmit(formData);
            addToast("Thank you! Your submission has been received for archeological review.", "success");
            onNavigate('restorationSanctuary');
        } catch (err) {
            addToast("Failed to submit. Please try again later.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-6 md:p-12 pt-24 font-sans">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => onNavigate('restorationSanctuary')}
                    className="flex items-center gap-2 text-amber-500 mb-8 hover:text-amber-400 transition-colors"
                >
                    <Icon name="arrow-left" className="w-4 h-4" /> Back to Sanctuary
                </button>

                <header className="space-y-4 mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-amber-200">
                        Revive a Sacred Flame
                    </h1>
                    <p className="text-xl text-slate-400">
                        Help us identify forgotten ruins, dilapidated shrines, or ancient temple sites that require our collective attention.
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8 bg-slate-800/20 p-8 md:p-12 rounded-[2.5rem] border border-amber-500/10 backdrop-blur-md shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-amber-500/80 ml-1">TEMPLE NAME / SHRINE TYPE</label>
                            <input
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Ancient Surya Temple Ruins"
                                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 focus:border-amber-500/50 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-amber-500/80 ml-1">PRECISE LOCATION</label>
                            <input
                                required
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Village, District, State"
                                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 focus:border-amber-500/50 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-amber-500/80 ml-1">HISTORICAL SIGNIFICANCE (IF KNOWN)</label>
                        <textarea
                            rows={4}
                            value={formData.history}
                            onChange={(e) => setFormData({ ...formData, history: e.target.value })}
                            placeholder="Tell us what you know about the site's history..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 focus:border-amber-500/50 outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-amber-500/80 ml-1">CURRENT CONDITION</label>
                        <textarea
                            rows={3}
                            value={formData.currentCondition}
                            onChange={(e) => setFormData({ ...formData, currentCondition: e.target.value })}
                            placeholder="Describe the state of the structure (e.g. collapsed roof, overgrowth)"
                            className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 focus:border-amber-500/50 outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            disabled={isLoading}
                            className="w-full md:w-auto px-12 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-amber-900/20 disabled:bg-slate-700 disabled:shadow-none"
                        >
                            {isLoading ? 'Processing...' : 'Submit for Archeological Review'}
                        </button>
                    </div>
                </form>

                <div className="mt-12 p-6 rounded-2xl bg-slate-800/40 border border-slate-700 flex items-start gap-4">
                    <Icon name="info" className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
                    <p className="text-sm text-slate-400">
                        Our team of historians and civil engineers will review your submission within 15 working days. If verified, the temple will be listed in the Restoration Sanctuary for fund mobilization.
                    </p>
                </div>
            </div>
        </div>
    );
};
