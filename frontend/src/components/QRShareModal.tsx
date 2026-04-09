import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';

interface QRShareModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const QRShareModal = ({ isOpen, onClose }: QRShareModalProps) => {
    const [copied, setCopied] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Use the current URL by default
        const url = window.location.href;
        setShareUrl(url);
    }, [isOpen]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            if (inputRef.current) {
                inputRef.current.select();
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        }
    };

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(shareUrl)}&bgcolor=ffffff&color=1c1917&margin=8`;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden"
                    >
                        {/* Decorative Header */}
                        <div className="relative bg-gradient-to-br from-ink via-stone-900 to-ink p-8 pb-12 text-center overflow-hidden">
                            {/* Decorative orbs */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/20 rounded-full blur-3xl" />

                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                aria-label="Close"
                            >
                                <Icon name="x" className="w-5 h-5" />
                            </button>

                            <div className="relative z-10">
                                <div className="flex items-center justify-center gap-2 mb-3">
                                    <Icon name="cosmic-logo" className="w-7 h-7 text-primary animate-slow-spin" />
                                    <span className="text-xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Dharma Setu</span>
                                </div>
                                <h2 className="text-2xl font-serif font-bold text-white mb-1">
                                    Scan to Experience
                                </h2>
                                <p className="text-sm text-stone-400">
                                    Open on your mobile device
                                </p>
                            </div>
                        </div>

                        {/* QR Code Area */}
                        <div className="relative -mt-8 px-8 pb-6">
                            <div className="bg-white rounded-3xl shadow-lg border border-stone-100 p-6 flex flex-col items-center">
                                {/* QR Code */}
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl" />
                                    <div className="relative bg-white rounded-2xl p-3 border-2 border-stone-100 shadow-inner">
                                        <img
                                            src={qrUrl}
                                            alt="QR Code to access Dharma Setu"
                                            className="w-[240px] h-[240px] rounded-xl"
                                            crossOrigin="anonymous"
                                        />
                                        {/* Center logo overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center border border-stone-200">
                                                <Icon name="cosmic-logo" className="w-7 h-7 text-primary" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* URL Copy Section */}
                                <div className="w-full">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 block text-center">Share Link</label>
                                    <div className="flex items-center gap-2 bg-stone-50 rounded-xl border border-stone-200 p-1.5">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={shareUrl}
                                            onChange={(e) => setShareUrl(e.target.value)}
                                            className="flex-1 bg-transparent text-sm text-stone-700 px-3 py-2 outline-none font-mono truncate min-w-0"
                                            readOnly
                                        />
                                        <button
                                            onClick={handleCopy}
                                            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-1.5 ${
                                                copied
                                                    ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                                                    : 'bg-ink text-white hover:bg-primary hover:shadow-[0_0_15px_rgba(234,88,12,0.4)]'
                                            }`}
                                        >
                                            <Icon name={copied ? 'shield-check' : 'clipboard-list'} className="w-4 h-4" />
                                            {copied ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                </div>

                                {/* Tip */}
                                <p className="text-[11px] text-stone-400 mt-4 text-center leading-relaxed">
                                    <span className="font-semibold text-stone-500">Tip:</span> Both devices must be on the same WiFi network, or deploy to share globally.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
