import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { DashboardView } from './components/views/Dashboard';
import { PujaManagementView } from './components/views/PujaManagement';
import { BookingManagementView } from './components/views/BookingManagement';
import { PanditManagementView } from './components/views/PanditManagement';
import { ProductManagementView } from './components/views/ProductManagement';
import { StoreSettingsView } from './components/views/StoreSettings';

const MainContent: React.FC = () => {
    const { token, loading } = useAuth();
    const [currentTab, setCurrentTab] = useState('dashboard');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
                <div className="flex items-center gap-3 text-[var(--color-primary)]">
                    <div className="w-6 h-6 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold">Loading Admin Portal...</span>
                </div>
            </div>
        );
    }

    if (!token) {
        return <LoginPage />;
    }

    const renderTab = () => {
        switch (currentTab) {
            case 'dashboard':
                return <DashboardView onNavigate={setCurrentTab} />;
            case 'pujas':
                return <PujaManagementView />;
            case 'bookings':
                return <BookingManagementView />;
            case 'pandits':
                return <PanditManagementView />;
            case 'products':
                return <ProductManagementView />;
            case 'settings':
                return <StoreSettingsView />;
            default:
                return <DashboardView onNavigate={setCurrentTab} />;
        }
    };

    return (
        <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
            {renderTab()}
        </Layout>
    );
};

export const App: React.FC = () => {
    return (
        <AuthProvider>
            <MainContent />
        </AuthProvider>
    );
};

export default App;
