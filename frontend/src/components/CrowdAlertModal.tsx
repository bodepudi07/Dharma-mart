
import React, { useState, useEffect, useRef } from 'react';
import { I18nContent, Temple, Pooja } from '../types';
import * as aiService from '../services/aiService';
import { Icon } from './Icon';
import { useFocusTrap } from '../hooks/useFocusTrap';

export interface CrowdAlertModalProps {
    onProceed: () => void;
    onExploreAlternative: () => void;
    onBookPooja: (pooja: Pooja) => void;
    originalTemple: Temple;
    alternativeTemple: Temple;
    alternativePoojas: Pooja[];
    t: I18nContent;
    isOpen: boolean;
    onClose: () => void;
}

export const CrowdAlertModal = ({
    isOpen,
    onClose,
    onProceed,
    onExploreAlternative,
    onBookPooja,
    originalTemple,
    alternativeTemple,
    alternativePoojas,
    t
}: CrowdAlertModalProps) => {
    const [comparison, setComparison] = useState('');
    const [isLoadingComparison, setIsLoadingComparison] = useState(true);
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef);

    useEffect(() => {
        if (isOpen) {
            let isCancelled = false;
            setIsLoadingComparison(true);
            aiService.generateTempleComparison(originalTemple, alternativeTemple)
                .then(text => {
                    if (!isCancelled) {
                        setComparison(text);
                    }
                })
                .catch(() => {
                    // Fallback in case AI fails
                    if (!isCancelled) {
                        setComparison(`Discover the unique spiritual energies of both ${originalTemple.name} and ${alternativeTemple.name}. Each holds a special place in the hearts of devotees.`);
                    }
                })
                .finally(() => {
                    if (!isCancelled) {
                        setIsLoadingComparison(false);
                    }
                });

            return () => {
                isCancelled = true;
            };
        }
    }, [isOpen, originalTemple, alternativeTemple]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="crowd-alert-title" className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
                        <Icon name="alert-triangle" className="h-6 w-6 text-orange-600" />
                    </div>
                    <h2 id="crowd-alert-title" className="text-2xl font-bold text-stone-900 mt-4">{t.crowdAlertTitle}</h2>
                    <p className="text-stone-600 mt-2 mb-4">{t.crowdAlertInfo}</p>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center mb-4">
                    <p className="font-bold text-lg text-orange-800">{alternativeTemple.name}</p>
                    <p className="text-sm text-stone-500">{alternativeTemple.location}</p>
                </div>

                {/* AI Comparison */}
                <div className="bg-stone-50 p-4 rounded-lg mb-4 min-h-[60px] border border-stone-100">
                    {isLoadingComparison ? (
                        <div className="space-y-2 animate-pulse">
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                        </div>
                    ) : (
                        <p className="text-xs text-stone-600 italic leading-relaxed">{comparison}</p>
                    )}
                </div>

                {/* Available Pooja Services at Alternative */}
                {alternativePoojas.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2">
                            <Icon name="bell" className="w-4 h-4 text-orange-500" /> Available Poojas at {alternativeTemple.name}
                        </h3>
                        <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar snap-x">
                            {alternativePoojas.map(pooja => (
                                <div key={pooja.id} className="min-w-[140px] bg-white border border-stone-200 rounded-xl p-3 snap-start shadow-sm flex flex-col justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-stone-800 line-clamp-2">{pooja.name}</p>
                                        <p className="text-[10px] text-orange-600 font-bold mt-1">₹{pooja.cost}</p>
                                    </div>
                                    <button
                                        onClick={() => onBookPooja(pooja)}
                                        className="mt-3 w-full bg-orange-100 hover:bg-orange-200 text-orange-700 text-[10px] font-bold py-1.5 rounded-lg transition-colors"
                                    >
                                        Book Now
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <button onClick={onExploreAlternative} className="bg-green-600 text-white font-bold py-3 px-6 rounded-full hover:bg-green-700 transition-colors w-full shadow-lg shadow-green-900/10">
                        {t.exploreAlternative}
                    </button>
                    <button onClick={onProceed} className="bg-stone-200 text-stone-800 font-bold py-3 px-6 rounded-full hover:bg-stone-300 transition-colors w-full">
                        {t.proceedAnyway}
                    </button>
                </div>
            </div>
        </div>
    );
};
