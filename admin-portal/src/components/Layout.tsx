import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
    currentTab: string;
    setCurrentTab: (tab: string) => void;
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentTab, setCurrentTab, children }) => {
    return (
        <div className="flex min-h-screen bg-[var(--color-surface)]">
            <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};
