
import React from 'react';
import type { Temple, I18nContent } from '../types';
import { CrowdLevelIndicator } from './CrowdLevelIndicator';
import { useImageWithFallback } from '../hooks/useImageWithFallback';
import { getItemFallbackImage } from '../hooks/useItemImage';
import { Icon } from './Icon';

interface TempleCardProps {
    temple: Temple;
    t: I18nContent;
    onSelectTemple: () => void;
    onBookDarshan: () => void;
    onVirtualDarshan: () => void;
    onViewImage: () => void;
    onAskGuru: () => void;
    // FIX: Make Yatra plan props optional so TempleCard can be used in views without Yatra context.
    onToggleYatraPlan?: (temple: Temple) => void;
    isInYatraPlan?: boolean;
}

export const TempleCard = ({ temple, t, onSelectTemple, onBookDarshan, onVirtualDarshan, onViewImage, onAskGuru, onToggleYatraPlan, isInYatraPlan }: TempleCardProps) => {
    const fallbackImg = getItemFallbackImage(temple.name, 'temple');
    const { imgSrc, status, onLoad, onError } = useImageWithFallback(temple.imageUrl, fallbackImg);

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        e.preventDefault();
        action();
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectTemple();
        }
    }

    return (
        <div
            onClick={onSelectTemple}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label={`Explore details for ${temple.name}`}
            className="card-spiritual group flex flex-col cursor-pointer h-full focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/70 hover:shadow-[0_0_20px_rgba(234,88,12,0.4)] hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-primary/30"
        >
            <div className="relative overflow-hidden h-64 bg-stone-900">
                {status === 'loading' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Icon name="lotus" className="w-8 h-8 text-amber-600/40 animate-spin" />
                    </div>
                )}
                <img
                    src={imgSrc}
                    alt={temple.name}
                    onLoad={onLoad}
                    onError={onError}
                    onClick={(e) => handleActionClick(e, onViewImage)}
                    className={`w-full h-full object-cover transform group-hover:scale-105 transition-all duration-700 ease-out cursor-pointer ${status === 'loading' ? 'opacity-0' : 'opacity-100'}`}
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-4 right-4 pointer-events-auto">
                        <CrowdLevelIndicator level={temple.crowdLevel} size="small" />
                    </div>
                    {temple.distance !== undefined && (
                        <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border border-white/20 pointer-events-auto">
                            {temple.distance.toFixed(1)} km
                        </div>
                    )}
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                        <p className="text-[10px] uppercase tracking-widest font-bold opacity-70 mb-1">{temple.location}</p>
                        <h3 className="text-xl font-serif font-bold leading-tight">{temple.name}</h3>
                    </div>
                </div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <p className="text-stone-500 text-sm mb-6 flex-grow line-clamp-2 leading-relaxed">{temple.history}</p>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={(e) => handleActionClick(e, onBookDarshan)}
                            className="flex items-center justify-center gap-2 bg-stone-50 text-primary font-bold text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-primary hover:text-white transition-all border border-primary/20"
                        >
                            Darshan
                        </button>
                        <button
                            onClick={(e) => handleActionClick(e, onVirtualDarshan)}
                            className="flex items-center justify-center gap-2 bg-stone-50 text-primary font-bold text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-primary hover:text-white transition-all border border-primary/20"
                        >
                            Virtual
                        </button>
                    </div>

                    <button
                        onClick={(e) => handleActionClick(e, onAskGuru)}
                        className="w-full flex items-center justify-center gap-2 bg-primary/5 text-primary font-bold text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-primary/10 transition-all border border-primary/10"
                    >
                        <Icon name="cosmic-logo" className="w-3 h-3" />
                        Ask Dharma Guru
                    </button>

                    {onToggleYatraPlan && isInYatraPlan !== undefined && (
                        <button
                            onClick={(e) => handleActionClick(e, () => onToggleYatraPlan(temple))}
                            className={`w-full py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm ${isInYatraPlan
                                ? 'bg-green-500 text-white flex items-center justify-center gap-2'
                                : 'bg-primary text-white hover:brightness-110'
                                }`}
                        >
                            {isInYatraPlan ? (
                                <>
                                    In Yatra <Icon name="check-circle" className="w-3 h-3" />
                                </>
                            ) : (
                                'Add to Yatra'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
