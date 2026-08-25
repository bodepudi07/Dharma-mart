import React from 'react';

interface SidebarProps {
    currentTab: string;
    setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'pujas', label: 'Puja Catalog', icon: '🛕' },
        { id: 'bookings', label: 'Puja Bookings', icon: '📅' },
        { id: 'pandits', label: 'Pandit Network', icon: '🧑‍🦳' },
        { id: 'products', label: 'Products & Store', icon: '📦' },
        { id: 'settings', label: 'Store Settings', icon: '⚙️' },
    ];

    return (
        <aside className="w-64 bg-[var(--color-surface-2)] border-r border-[var(--color-border)] flex flex-col h-screen sticky top-0">
            <div className="p-6 border-b border-[var(--color-border)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-xl shadow-lg">
                    🛕
                </div>
                <div>
                    <h2 className="font-serif font-bold text-base text-[var(--color-text)] leading-tight">Dharma Mart</h2>
                    <p className="text-[10px] text-[var(--color-primary)] font-semibold tracking-wider uppercase">Vendor Admin</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => {
                    const active = currentTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setCurrentTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                                active
                                    ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20'
                                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text)]'
                            }`}
                        >
                            <span className="text-base">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-3)]/50 text-[10px] text-[var(--color-text-dim)] text-center">
                Dharma Mart v2.0 · Made with Devotion
            </div>
        </aside>
    );
};
