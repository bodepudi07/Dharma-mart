import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { Icon } from './Icon';
import { I18nContent } from '../types';
import { useToast } from '../contexts/ToastContext';
import DOMPurify from 'dompurify';

interface EcoInnovationModalProps {
    onClose: () => void;
    t: I18nContent;
}

type Page = 'floral' | 'bricks' | 'hub';

export const EcoInnovationModal = ({ onClose, t }: EcoInnovationModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();
    const [activePage, setActivePage] = useState<Page>('floral');

    // Page 1: Floral States
    const [flowerWeight, setFlowerWeight] = useState<number>(0);

    // Page 2: Brick States
    const [brickCount, setBrickCount] = useState<number>(100);
    const [laborType, setLaborType] = useState<'standard' | 'skilled'>('skilled');
    const [hasSigned, setHasSigned] = useState(false);

    // Page 3: Hub States
    const [innovationName, setInnovationName] = useState('');
    const [innovationDesc, setInnovationDesc] = useState('');

    useFocusTrap(modalRef);

    // Calculations
    const exchangeRate = 0.2;
    const organicProduct = (flowerWeight * exchangeRate).toFixed(2);

    const brickPrice = 501;
    const laborRate = laborType === 'skilled' ? 150 : 80;
    const totalCost = (brickCount * brickPrice) + (brickCount * laborRate);

    const navItems: { id: Page; label: string; icon: string }[] = [
        { id: 'floral', label: t.ecoFloralExchange, icon: 'leaf' },
        { id: 'bricks', label: t.ecoPoojaGadi, icon: 'temple' },
        { id: 'hub', label: t.ecoInnovationPortal, icon: 'plus' }
    ];

    return (
        <div
            className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-0 md:p-4 overflow-hidden"
            onClick={onClose}
        >
            <motion.div
                ref={modalRef}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                role="dialog"
                aria-modal="true"
                className="bg-[#051510] border border-emerald-500/30 w-full max-w-5xl h-full md:h-[85vh] md:rounded-[2.5rem] shadow-[0_0_100px_rgba(16,185,129,0.1)] relative flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Background Glows */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full" />

                {/* Header Section */}
                <div className="relative z-10 px-8 py-6 border-b border-emerald-500/10 flex justify-between items-center bg-[#051510]/80 backdrop-blur-md">
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-200">
                            {t.ecoInnovationHub}
                        </h2>
                        <p className="text-xs text-emerald-500/60 font-mono tracking-widest uppercase mt-1">{t.ecoSustainableDharma}</p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-white/5 rounded-full transition-colors group"
                    >
                        <Icon name="x" className="w-6 h-6 text-stone-500 group-hover:text-white" />
                    </button>
                </div>

                {/* Main Navigation */}
                <div className="relative z-10 px-8 pt-4 flex gap-4 overflow-x-auto no-scrollbar pb-2 border-b border-emerald-500/10">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActivePage(item.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all whitespace-nowrap ${activePage === item.id
                                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'
                                }`}
                        >
                            <Icon name={item.icon as any} className="w-5 h-5" />
                            <span className="font-bold text-sm tracking-wide">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-8">
                    <AnimatePresence mode="wait">
                        {activePage === 'floral' && (
                            <motion.div
                                key="floral"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid lg:grid-cols-2 gap-12"
                            >
                                <div className="space-y-6">
                                    <div className="inline-block p-4 bg-emerald-500/10 rounded-3xl border border-emerald-500/20">
                                        <Icon name="leaf" className="w-10 h-10 text-emerald-400" />
                                    </div>
                                    <h3 className="text-4xl font-serif font-bold text-white leading-tight">
                                        {t.ecoFloralWasteTitle.split('Exchange')[0]} <br /><span className="text-emerald-500">Exchange Program</span>
                                    </h3>
                                    <p className="text-stone-400 leading-relaxed text-lg">
                                        {t.ecoFloralWasteDesc}
                                    </p>
                                    <ul className="space-y-4">
                                        {[t.ecoPureCompost, t.ecoChemicalFreeIncense, t.ecoWaterPreservation].map((text) => (
                                            <li key={text} className="flex items-center gap-3 text-stone-300">
                                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                    <Icon name="check" className="w-4 h-4 text-emerald-400" />
                                                </div>
                                                {text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-[#0a251c] rounded-[2.5rem] border border-emerald-500/20 p-8 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 italic text-[120px] pointer-events-none">Nirmalya</div>

                                    <div className="relative z-10 space-y-8">
                                        <div className="space-y-4">
                                            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-emerald-500/60">{t.ecoInputWeightKg}</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={flowerWeight || ''}
                                                    onChange={(e) => setFlowerWeight(Number(e.target.value))}
                                                    placeholder="0.00"
                                                    className="w-full bg-[#051510] border-2 border-emerald-500/20 rounded-3xl px-8 py-6 text-4xl font-serif font-bold text-white focus:border-emerald-500 outline-none transition-all placeholder:text-stone-800"
                                                />
                                                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-bold text-stone-600">KG</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 p-6 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10">
                                            <div className="p-4 bg-emerald-500/20 rounded-2xl">
                                                <Icon name="package" className="w-8 h-8 text-emerald-400" />
                                            </div>
                                            <div>
                                                <div className="text-3xl font-bold text-white">{organicProduct}kg</div>
                                                <div className="text-xs font-bold text-emerald-500/60 uppercase tracking-widest">{t.ecoOrganicReturn}</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                addToast('Pickup scheduled! Our team will contact you shortly.', 'success');
                                                setFlowerWeight(0);
                                            }}
                                            disabled={!flowerWeight}
                                            className="w-full py-6 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 disabled:opacity-30 rounded-3xl font-bold text-white text-lg tracking-widest shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all transform hover:-translate-y-1"
                                        >
                                            {t.ecoSchedulePickup}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activePage === 'bricks' && (
                            <motion.div
                                key="bricks"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-12"
                            >
                                <div className="text-center max-w-2xl mx-auto space-y-4">
                                    <h3 className="text-5xl font-serif font-bold text-white">{t.ecoPoojaGadiTitle.split('Construction')[0]} <span className="text-amber-400">Construction</span></h3>
                                    <p className="text-stone-400">{t.ecoPoojaGadiDesc}</p>
                                </div>

                                <div className="grid lg:grid-cols-3 gap-8">
                                    {/* Costing Card */}
                                    <div className="lg:col-span-2 bg-[#0a251c]/50 rounded-[2.5rem] border border-emerald-500/20 p-10 space-y-8">
                                        <div className="grid sm:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <label className="block text-xs font-bold uppercase text-amber-500/60 tracking-widest">{t.ecoBrickQuantity}</label>
                                                <input
                                                    type="number"
                                                    value={brickCount}
                                                    onChange={(e) => setBrickCount(Number(e.target.value))}
                                                    className="w-full bg-[#051510] border border-amber-500/20 rounded-2xl px-6 py-4 text-2xl font-bold text-white focus:border-amber-500 outline-none transition-all"
                                                />
                                                <div className="text-xs text-stone-500">Unit Price: <span className="text-amber-400">₹501</span></div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="block text-xs font-bold uppercase text-amber-500/60 tracking-widest">{t.ecoCraftsmanshipLevel}</label>
                                                <div className="flex gap-2 p-1 bg-[#051510] rounded-2xl border border-amber-500/10">
                                                    <button
                                                        onClick={() => setLaborType('standard')}
                                                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${laborType === 'standard' ? 'bg-amber-500 text-black' : 'text-stone-500 hover:text-white'}`}
                                                    >
                                                        {t.ecoStandard}
                                                    </button>
                                                    <button
                                                        onClick={() => setLaborType('skilled')}
                                                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${laborType === 'skilled' ? 'bg-amber-500 text-black' : 'text-stone-500 hover:text-white'}`}
                                                    >
                                                        {t.ecoSkilledVedic}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 bg-[#051510] rounded-[2rem] border border-amber-500/20">
                                            <div className="flex justify-between items-center mb-6">
                                                <span className="text-stone-400">{t.ecoTotalEstimate}</span>
                                                <span className="text-4xl font-serif font-bold text-white">₹{totalCost.toLocaleString()}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-xs">
                                                <div className="flex justify-between text-stone-500">
                                                    <span>Bricks ({brickCount}):</span>
                                                    <span>₹{(brickCount * brickPrice).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-stone-500">
                                                    <span>Labour ({laborType}):</span>
                                                    <span>₹{(brickCount * laborRate).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Legal Card */}
                                    <div className="bg-[#1a0f0a] rounded-[2.5rem] border border-red-500/20 p-8 flex flex-col">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-red-500/20 rounded-lg">
                                                <Icon name="shield" className="w-5 h-5 text-red-400" />
                                            </div>
                                            <h4 className="font-bold text-red-300">{t.ecoLegalAgreement}</h4>
                                        </div>

                                        <div className="flex-1 overflow-y-auto text-[10px] text-stone-500 leading-relaxed pr-2 custom-scrollbar bg-black/30 p-4 rounded-xl mb-6">
                                            <p className="font-bold text-red-500 mb-2 uppercase">{t.ecoStrictCompliance}</p>
                                            {t.ecoLegalBody}
                                        </div>

                                        <label className="flex items-start gap-3 cursor-pointer group mb-6">
                                            <input
                                                type="checkbox"
                                                checked={hasSigned}
                                                onChange={(e) => setHasSigned(e.target.checked)}
                                                className="mt-1 w-5 h-5 accent-red-500 rounded border-stone-800"
                                            />
                                            <div className="text-sm font-bold text-stone-300 group-hover:text-white transition-colors">
                                                {t.ecoLegalPledge}
                                            </div>
                                        </label>

                                        <button
                                            disabled={!hasSigned}
                                            onClick={() => {
                                                addToast('Order placed successfully! The construction team has been assigned.', 'success');
                                                // Removed onClose() to allow user to continue browsing other tabs
                                            }}
                                            className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:opacity-20 rounded-2xl font-bold text-white shadow-lg shadow-red-900/40 transition-all"
                                        >
                                            {t.ecoConfirmBook}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activePage === 'hub' && (
                            <motion.div
                                key="hub"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="max-w-3xl mx-auto space-y-12"
                            >
                                <div className="text-center space-y-4">
                                    <div className="inline-block px-4 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary tracking-[0.3em] uppercase mb-4">
                                        Open Source Spirituality
                                    </div>
                                    <h3 className="text-4xl font-serif font-bold text-white">{t.ecoPortalTitle.split(' ')[0]} <span className="text-primary italic">{t.ecoPortalTitle.split(' ')[1]}</span></h3>
                                    <p className="text-stone-400">{t.ecoPortalDesc}</p>
                                </div>

                                <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 space-y-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">{t.ecoInnovationName}</label>
                                            <input
                                                type="text"
                                                value={innovationName}
                                                onChange={(e) => setInnovationName(e.target.value)}
                                                placeholder="e.g. Solar Powered Diya System"
                                                className="w-full bg-stone-900/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">{t.ecoCoreVision}</label>
                                            <textarea
                                                value={innovationDesc}
                                                onChange={(e) => setInnovationDesc(e.target.value)}
                                                placeholder="Explain how it saves the environment while upholding Vedic practices..."
                                                rows={5}
                                                className="w-full bg-stone-900/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-primary outline-none transition-all resize-none"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            const cleanName = DOMPurify.sanitize(innovationName);
                                            const cleanDesc = DOMPurify.sanitize(innovationDesc);

                                            if (cleanName.length < 3 || cleanDesc.length < 10) {
                                                addToast('Please provide a more detailed innovation proposal.', 'error');
                                                return;
                                            }

                                            addToast('Innovation submitted! Our Rishi-Engineers will review it within 48 hours.', 'success');
                                            setInnovationName('');
                                            setInnovationDesc('');
                                        }}
                                        disabled={!innovationName || !innovationDesc}
                                        className="w-full py-6 bg-white text-black rounded-3xl font-bold text-lg hover:bg-stone-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-20"
                                    >
                                        <Icon name="upload" className="w-5 h-5" />
                                        {t.ecoSubmitReview}
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-6 opacity-30">
                                    <div className="h-24 bg-white/5 rounded-2xl flex items-center justify-center grayscale"><Icon name="box" className="w-10 h-10" /></div>
                                    <div className="h-24 bg-white/5 rounded-2xl flex items-center justify-center grayscale"><Icon name="zap" className="w-10 h-10" /></div>
                                    <div className="h-24 bg-white/5 rounded-2xl flex items-center justify-center grayscale"><Icon name="globe" className="w-10 h-10" /></div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
