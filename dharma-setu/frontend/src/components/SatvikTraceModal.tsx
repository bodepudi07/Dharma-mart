import React, { useRef, useState } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { Icon } from './Icon';
import { useToast } from '../contexts/ToastContext';

export const SatvikTraceModal = ({ onClose }: { onClose: () => void }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef);
    const { addToast } = useToast();
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);

    const handleScan = () => {
        setIsScanning(true);
        setScanResult(null);
        setTimeout(() => {
            setIsScanning(false);
            setScanResult({
                product: "Tirupati Laddu Prasadam",
                batch: "B-2024-10-24",
                purity: "100% Pure A2 Ghee",
                lab: "FSSAI Certified Lab, Hyderabad",
                date: new Date().toLocaleDateString()
            });
            addToast("Scan successful!", 'success');
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div 
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                className="bg-main rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-primary transition-colors text-2xl font-bold">&times;</button>
                <div className="text-center mb-6">
                    <Icon name="shield-check" className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
                    <h2 className="text-2xl font-bold text-emerald-900 font-heading">Satvik-Trace</h2>
                    <p className="text-text-muted">Scan QR code on Prasad or Puja items to verify purity.</p>
                </div>

                {!scanResult ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className={`w-48 h-48 border-4 border-dashed rounded-2xl flex items-center justify-center mb-6 transition-colors ${isScanning ? 'border-emerald-500 bg-emerald-50' : 'border-stone-300'}`}>
                            {isScanning ? (
                                <Icon name="lotus" className="w-12 h-12 text-emerald-500 animate-spin" />
                            ) : (
                                <Icon name="camera" className="w-24 h-24 text-stone-300" />
                            )}
                        </div>
                        <button 
                            onClick={handleScan}
                            disabled={isScanning}
                            className="btn-primary w-full bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        >
                            {isScanning ? 'Scanning...' : 'Simulate Scan'}
                        </button>
                    </div>
                ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 animate-fade-in-up">
                        <div className="flex items-center gap-3 mb-4 text-emerald-700">
                            <Icon name="check-circle" className="w-6 h-6" />
                            <h3 className="font-bold text-lg">Verification Passed</h3>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-emerald-100 pb-2">
                                <span className="text-stone-500">Product</span>
                                <span className="font-bold text-ink">{scanResult.product}</span>
                            </div>
                            <div className="flex justify-between border-b border-emerald-100 pb-2">
                                <span className="text-stone-500">Batch No.</span>
                                <span className="font-bold text-ink">{scanResult.batch}</span>
                            </div>
                            <div className="flex justify-between border-b border-emerald-100 pb-2">
                                <span className="text-stone-500">Purity</span>
                                <span className="font-bold text-emerald-600">{scanResult.purity}</span>
                            </div>
                            <div className="flex justify-between border-b border-emerald-100 pb-2">
                                <span className="text-stone-500">Tested By</span>
                                <span className="font-bold text-ink">{scanResult.lab}</span>
                            </div>
                            <div className="flex justify-between mt-2 pt-2 border-t border-emerald-100">
                                <span className="text-stone-500">Date</span>
                                <span className="font-bold text-ink">{scanResult.date}</span>
                            </div>
                        </div>
                        <button onClick={() => setScanResult(null)} className="mt-6 w-full py-2 text-emerald-600 font-bold hover:bg-emerald-100 rounded-full transition-colors">
                            Scan Another
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
