import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateVendorProfile } from '../../services/api';

export const StoreSettingsView: React.FC = () => {
    const { vendor, token } = useAuth();
    const [storeName, setStoreName] = useState(vendor?.storeName || 'Dharma Mart Official Store');
    const [phone, setPhone] = useState(vendor?.phone || '+91-9999999999');
    const [address, setAddress] = useState(vendor?.address || 'Hyderabad, Telangana, India');
    const [saved, setSaved] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        try {
            await updateVendorProfile(token, { storeName, phone, address });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn max-w-2xl">
            <div>
                <h1 className="text-2xl font-serif font-bold text-[var(--color-text)]">Store & Official Settings</h1>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Configure your official store profile and contact information</p>
            </div>

            {saved && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    ✓ Store settings saved successfully.
                </div>
            )}

            <form onSubmit={handleSave} className="card p-6 space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Official Account Email</label>
                    <input type="email" disabled value={vendor?.email || 'official@dharmamart.com'} className="w-full opacity-60 cursor-not-allowed" />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Store / Entity Name</label>
                    <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} className="w-full" />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Official Support Phone</label>
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full" />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">HQ Address</label>
                    <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3} className="w-full resize-none" />
                </div>

                <div className="pt-4 border-t border-[var(--color-border)] flex justify-end">
                    <button type="submit" className="btn btn-primary text-xs">
                        Save Store Changes
                    </button>
                </div>
            </form>
        </div>
    );
};
