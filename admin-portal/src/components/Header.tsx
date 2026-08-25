import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Header: React.FC = () => {
    const { vendor, logout } = useAuth();

    return (
        <header className="h-16 bg-[var(--color-surface-2)]/80 backdrop-blur-md border-b border-[var(--color-border)] px-8 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
                <span className="badge badge-success">Live Platform</span>
                <span className="text-xs text-[var(--color-text-muted)]">Official & Vendor Console</span>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-xs font-bold text-[var(--color-text)]">{vendor?.storeName || vendor?.name}</p>
                    <p className="text-[10px] text-[var(--color-primary)] font-mono">{vendor?.email}</p>
                </div>

                <div className="w-9 h-9 rounded-full bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/40 flex items-center justify-center font-bold text-sm text-[var(--color-primary)]">
                    {vendor?.name ? vendor.name.charAt(0) : 'A'}
                </div>

                <button
                    onClick={logout}
                    className="btn btn-secondary btn-sm text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                    title="Sign Out"
                >
                    Sign Out
                </button>
            </div>
        </header>
    );
};
