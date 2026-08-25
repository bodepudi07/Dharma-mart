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
            className="teakwood-card flex flex-col cursor-pointer h-full focus:outline-none transition-all duration-300 rounded-[2rem] overflow-hidden group border border-[#C3A150]/20 hover:shadow-[0_12px_35px_rgba(184,120,52,0.08)]"
        >
            <div className="relative overflow-hidden h-64 bg-stone-900 border-b border-[#C3A150]/20">
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
                    className={`w-full h-full object-cover transform group-hover:scale-102 transition-all duration-700 ease-out cursor-pointer ${status === 'loading' ? 'opacity-0' : 'opacity-100'}`}
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-4 right-4 pointer-events-auto">
                    <CrowdLevelIndicator level={temple.crowdLevel} size="small" />
                  </div>
                  {temple.distance !== undefined && (
                    <div className="absolute top-4 left-4 bg-[#FAF6EE]/90 backdrop-blur text-stone-700 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-xl border border-[#C3A150]/30 pointer-events-auto">
                      {temple.distance.toFixed(1)} km
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-[9px] uppercase tracking-widest font-mono font-bold opacity-75 mb-1">{temple.location}</p>
                    <h3 className="text-xl font-serif font-bold leading-tight">{temple.name}</h3>
                  </div>
                </div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <p className="text-stone-500 text-sm mb-6 flex-grow line-clamp-2 leading-relaxed font-serif italic font-light">{temple.history}</p>

                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={(e) => handleActionClick(e, onBookDarshan)}
                            className="brass-inlay-btn flex items-center justify-center gap-2 font-serif font-bold text-xs py-2.5 rounded-xl transition-all"
                        >
                            Darshan
                        </button>
                        <button
                            onClick={(e) => handleActionClick(e, onVirtualDarshan)}
                            className="bg-white text-stone-700 border border-[#C3A150]/35 hover:bg-stone-50 flex items-center justify-center gap-2 font-serif font-bold text-xs py-2.5 rounded-xl transition-all"
                        >
                            Virtual
                        </button>
                    </div>

                    <button
                        onClick={(e) => handleActionClick(e, onAskGuru)}
                        className="w-full flex items-center justify-center gap-2 bg-amber-500/5 text-amber-800 font-serif font-bold text-xs py-2.5 rounded-xl hover:bg-amber-500/10 transition-all border border-[#C3A150]/20"
                    >
                        <Icon name="cosmic-logo" className="w-3.5 h-3.5" />
                        <span>Ask Dharma Guru</span>
                    </button>

                    {onToggleYatraPlan && isInYatraPlan !== undefined && (
                        <button
                            onClick={(e) => handleActionClick(e, () => onToggleYatraPlan(temple))}
                            className={`w-full py-2.5 rounded-xl font-serif font-bold text-xs transition-all shadow-sm ${
                              isInYatraPlan
                                ? 'bg-emerald-600 text-white flex items-center justify-center gap-2'
                                : 'brass-inlay-btn'
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
export default TempleCard;
