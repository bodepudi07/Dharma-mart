import React from 'react';
import type { Pooja, I18nContent } from '../types';
import { useImageWithFallback } from '../hooks/useImageWithFallback';
import { getItemFallbackImage } from '../hooks/useItemImage';
import { Icon } from './Icon';
import { useModal } from '../contexts/ModalContext';


interface PoojaCardProps {
    pooja: Pooja;
    t: I18nContent;
    onBook: (pooja: Pooja) => void;
    onViewImage: () => void;
    onAskGuru: (pooja: Pooja) => void;
    isAdmin?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    panditCount?: number;
}

export const PoojaCard = ({ pooja, t, onBook, onViewImage, onAskGuru, isAdmin, onEdit, onDelete, panditCount }: PoojaCardProps) => {
    const fallbackImg = getItemFallbackImage(pooja.name, 'pooja');
    const { imgSrc, status, onLoad, onError } = useImageWithFallback(pooja.imageUrl, fallbackImg);
    const { openModal } = useModal();

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onEdit?.();
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onDelete?.();
    };

    const handleSetTask = (e: React.MouseEvent) => {
        e.stopPropagation();
        openModal('task', { item: pooja, itemType: 'Pooja', t });
    };

    return (
        <div className="card-spiritual group flex flex-col h-full relative overflow-hidden hover:shadow-[0_0_20px_rgba(234,88,12,0.4)] hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-primary/30">
            {isAdmin && (
                <div className="absolute top-3 right-3 flex gap-2 z-10">
                    <button
                        onClick={handleEdit}
                        className="bg-blue-600/80 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                        aria-label={`Edit ${pooja.name}`}
                    >
                        <Icon name="edit" className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="bg-red-600/80 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg"
                        aria-label={`Delete ${pooja.name}`}
                    >
                        <Icon name="trash" className="w-4 h-4" />
                    </button>
                </div>
            )}
            <div className="relative h-56 bg-stone-900 overflow-hidden">
                {status === 'loading' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Icon name="lotus" className="w-8 h-8 text-amber-600/40 animate-spin" />
                    </div>
                )}
                <img
                    src={imgSrc}
                    alt={pooja.name}
                    onLoad={onLoad}
                    onError={onError}
                    onClick={onViewImage}
                    className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 cursor-pointer ${status === 'loading' ? 'opacity-0' : 'opacity-100'}`}
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 text-white pointer-events-auto">
                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-70 mb-1">{pooja.duration}</p>
                    <h3 className="text-xl font-serif font-bold leading-tight">{pooja.name}</h3>
                </div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <p className="text-stone-500 text-sm mb-6 line-clamp-3 flex-grow leading-relaxed">{pooja.description}</p>
                <div className="mt-auto space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-2xl font-serif font-bold text-primary">₹{pooja.cost}</p>
                        {panditCount !== undefined && panditCount > 0 && (
                            <div className="text-[10px] uppercase tracking-widest font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-green-100">
                                <Icon name="users" className="w-3 h-3" />
                                <span>{panditCount} Pandits</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <button
                            onClick={() => onBook(pooja)}
                            className="w-full bg-primary text-white font-bold text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                            <Icon name="bell" className="w-3 h-3" />
                            {t.bookNow}
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleSetTask}
                                className="bg-stone-50 text-primary font-bold text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-stone-100 transition-all border border-primary/20 flex items-center justify-center gap-2"
                                title={t.setTask}
                            >
                                <Icon name="clock" className="w-3 h-3" />
                                {t.setTask}
                            </button>
                            <button
                                onClick={() => onAskGuru(pooja)}
                                className="bg-stone-50 text-primary font-bold text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-stone-100 transition-all border border-primary/20 flex items-center justify-center gap-2"
                                title={`Ask Guru about ${pooja.name}`}
                            >
                                <Icon name="cosmic-logo" className="w-3 h-3" />
                                Ask Guru
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
