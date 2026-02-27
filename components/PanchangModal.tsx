import React, { useRef, useEffect, useState } from 'react';
import { I18nContent, Language } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { Icon } from './Icon';
import { getDailySloka, getDailyPanchang } from '../services/aiService';

interface PanchangModalProps {
    onClose: () => void;
    t: I18nContent;
    language: Language;
}

export const PanchangModal = ({ onClose, t, language }: PanchangModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef);
    const [sloka, setSloka] = useState<any>(null);
    const [loadingSloka, setLoadingSloka] = useState(true);

    const [panchangData, setPanchangData] = useState<any>(null);
    const [loadingPanchang, setLoadingPanchang] = useState(true);

    useEffect(() => {
        // Fetch Daily Sloka
        getDailySloka(language).then(data => {
            setSloka(data);
            setLoadingSloka(false);
        }).catch(() => setLoadingSloka(false));

        // Fetch AI Generated Panchang
        getDailyPanchang(language).then(data => {
            setPanchangData(data);
            setLoadingPanchang(false);
        }).catch(() => setLoadingPanchang(false));
    }, [language]);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="panchang-modal-title" className="bg-main rounded-3xl shadow-2xl w-full max-w-lg p-6 md:p-8 relative border border-amber-200/20 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none" />

                <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-text-muted hover:text-primary transition-colors text-2xl font-bold z-10">&times;</button>

                <div className="text-center mb-6 relative z-10">
                    <Icon name="sun" className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-spin-slow" />
                    <h2 id="panchang-modal-title" className="text-3xl font-bold text-primary font-heading">
                        Daily Panchang
                    </h2>
                    <p className="text-text-muted">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                {loadingPanchang ? (
                    <div className="flex justify-center py-8 mb-6 relative z-10">
                        <Icon name="chakra" className="w-10 h-10 animate-spin text-amber-500" />
                    </div>
                ) : panchangData ? (
                    <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                        <div className="bg-paper p-4 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow">
                            <div className="text-xs text-text-muted mb-1 flex items-center gap-1"><Icon name="moon" className="w-3 h-3" /> Tithi</div>
                            <div className="font-semibold text-primary line-clamp-2" title={panchangData.tithi}>{panchangData.tithi}</div>
                        </div>
                        <div className="bg-paper p-4 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow">
                            <div className="text-xs text-text-muted mb-1 flex items-center gap-1"><Icon name="star" className="w-3 h-3" /> Nakshatra</div>
                            <div className="font-semibold text-primary">{panchangData.nakshatra}</div>
                        </div>
                        <div className="bg-paper p-4 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow">
                            <div className="text-xs text-text-muted mb-1 flex items-center gap-1"><Icon name="sun" className="w-3 h-3 text-red-500" /> Rahu Kalam</div>
                            <div className="font-semibold text-red-600">{panchangData.rahuKalam}</div>
                        </div>
                        <div className="bg-paper p-4 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow">
                            <div className="text-xs text-text-muted mb-1 flex items-center gap-1"><Icon name="sun" className="w-3 h-3 text-amber-500" /> Sunrise/Sunset</div>
                            <div className="font-semibold text-text-main">{panchangData.sunrise} - {panchangData.sunset}</div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-text-muted py-4 mb-6 relative z-10">Unable to load Panchang data.</div>
                )}

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-5 rounded-2xl border border-amber-200/50 mb-2 relative z-10 shadow-inner">
                    <h3 className="font-bold text-lg text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2">
                        <Icon name="book-open" className="w-5 h-5" />
                        Daily Sloka
                    </h3>
                    {loadingSloka ? (
                        <div className="flex justify-center py-4"><Icon name="lotus" className="w-6 h-6 animate-spin text-amber-500" /></div>
                    ) : sloka ? (
                        <div className="space-y-3">
                            <p className="text-center font-sanskrit text-lg text-amber-900 dark:text-amber-100">{sloka.sloka_devanagari}</p>
                            <p className="text-center text-sm italic text-amber-700 dark:text-amber-300">{sloka.sloka_transliteration}</p>
                            <div className="h-px bg-amber-200/50 w-3/4 mx-auto my-2" />
                            <p className="text-sm text-amber-800 dark:text-amber-200 text-center leading-relaxed">{sloka.meaning}</p>
                        </div>
                    ) : (
                        <p className="text-center text-amber-700">Unable to load daily sloka.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
