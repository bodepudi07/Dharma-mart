
import React, { useMemo, useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from './services/apiService';
import { Language, DarshanBookingDetails, PoojaBookingDetails, DonationOption, View, Temple, Pooja } from './types';
import { I18N_DATA } from './constants';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './contexts/ToastContext';
import { useModal } from './contexts/ModalContext';
import { useHashRouter } from './hooks/useHashRouter';
import { useTheme } from './contexts/ThemeContext';

// Core layout components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Icon } from './components/Icon';
import { FloatingDock } from './components/FloatingDock';
import { AnimatedBackground } from './components/AnimatedBackground';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SplashScreen } from './components/SplashScreen';
import { NetworkStatus } from './components/NetworkStatus';
import { Home } from './components/Home';
import { AccessGateway } from './components/AccessGateway';

// Modals kept for darshan flow
import { ConfirmationModal } from './components/ConfirmationModal';
import { BookingConfirmationModal } from './components/BookingConfirmationModal';

// Lazy-loaded views — only the ones we keep
const GridView = React.lazy(() => import('./components/GridView').then(m => ({ default: m.GridView })));
const TempleDetail = React.lazy(() => import('./components/TempleDetail').then(m => ({ default: m.TempleDetail })));
const ChantingZone = React.lazy(() => import('./components/SlokaWidget').then(m => ({ default: m.ChantingZone })));

import { SubscreenLoader } from './components/SubscreenLoader';

// Lazy-loaded modals — only darshan-related + AI Guru
const DarshanBookingModal = React.lazy(() => import('./components/DarshanBookingModal').then(m => ({ default: m.DarshanBookingModal })));
const CrowdAlertModal = React.lazy(() => import('./components/CrowdAlertModal').then(m => ({ default: m.CrowdAlertModal })));
const AIGuruModal = React.lazy(() => import('./components/AIGuruModal').then(m => ({ default: m.AIGuruModal })));

export const App = () => {
  const [language, setLanguage] = React.useState<Language>(Language.EN);
  const { currentUser, isAuthenticated, userLoading, logout, activateSession } = useAuth();
  const { modalType, modalProps, openModal, closeModal } = useModal();
  const { addToast } = useToast();
  const { view, id } = useHashRouter();
  const [showSplash, setShowSplash] = React.useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme } = useTheme();

  // Transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevViewRef = useRef(view);

  useEffect(() => {
    if (view !== prevViewRef.current && view !== 'home') {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 3000); // Reduced from 6s to 3s for better UX
      prevViewRef.current = view;
      return () => clearTimeout(timer);
    }
  }, [view]);

  const t = useMemo(() => I18N_DATA[language], [language]);

  const handleSplashFinished = useCallback(() => {
    setShowSplash(false);
  }, []);

  const setView = useCallback((newView: View, newId?: string | number) => {
    window.location.hash = newId ? `${newView}/${newId}` : newView;
  }, []);

  const handleLogout = () => {
    logout();
    setView('home');
    addToast("Your session has ended.", 'info');
  };

  const handleAccessGranted = useCallback((token: string, expiresAt: string, remainingMs: number, email: string) => {
    activateSession(token, expiresAt, remainingMs, email);
    addToast("Welcome to your exclusive spiritual experience!", 'success');
  }, [activateSession, addToast]);

  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(false);
    }
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getUserLocation = (): Promise<{ latitude: number, longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Geolocation is not supported by your browser."));
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        (error) => reject(error),
        { timeout: 10000 }
      );
    });
  };

  const handleDarshanClick = async (temple: Temple) => {
    if (!currentUser) {
      addToast("Session required for this action.", "info");
      return;
    }

    const highCrowd = temple.crowdLevel === 'High' || temple.crowdLevel === 'Very High';

    if (highCrowd) {
      addToast("High crowd detected, searching for a nearby alternative...", 'info');
      const allTemples = await api.getTemples(language);
      let alternativeTemple: Temple | null = null;

      try {
        const userCoords = await getUserLocation();
        alternativeTemple = api.findClosestAlternative(userCoords, temple.id, allTemples);
      } catch (_error) {
        addToast("Could not get location. Finding best available alternative.", 'info');
        const originalCity = temple.location.split(',')[0].trim();
        const alternativeInCity = allTemples.find(t =>
          t.id !== temple.id &&
          (t.crowdLevel === 'Low' || t.crowdLevel === 'Medium') &&
          t.location.includes(originalCity)
        );
        alternativeTemple = alternativeInCity || allTemples.find(t =>
          t.id !== temple.id && (t.crowdLevel === 'Low' || t.crowdLevel === 'Medium')
        ) || null;
      }

      if (alternativeTemple) {
        const allPoojas = await api.getPoojas(language);
        const alternativePoojas = allPoojas.filter(p => p.templeIds?.includes(alternativeTemple!.id));

        openModal('crowdAlert', {
          originalTemple: temple,
          alternativeTemple: alternativeTemple,
          alternativePoojas: alternativePoojas,
          onProceed: () => { closeModal(); openModal('darshanBooking', { temple }); },
          onExploreAlternative: () => { closeModal(); setView('templeDetail', alternativeTemple!.id); },
          onBookPooja: (_pooja: Pooja) => { /* Pooja booking removed in exclusive mode */ }
        });
      } else {
        openModal('darshanBooking', { temple });
      }
    } else {
      openModal('darshanBooking', { temple });
    }
  };

  const handleDarshanBooking = async (details: DarshanBookingDetails) => {
    if (!currentUser || !modalProps.temple) return;
    try {
      const result = await api.bookDarshan(modalProps.temple, details, currentUser, currentUser.token!);
      addToast(result.message, 'success');
      closeModal();
      openModal('bookingConfirmation', { type: 'Darshan', itemName: modalProps.temple.name, details, temple: modalProps.temple });
    } catch (err) {
      if (err instanceof Error) addToast(err.message, 'error');
    }
  };

  // Restrict views: only home, temples, templeDetail, chantingZone
  const renderView = () => {
    const yatraPlanProps = { yatraPlan: [] as Temple[], isInYatraPlan: () => false, onToggleYatraPlan: () => {} };
    switch (view) {
      case 'home':
        return <Home t={t} language={language} onDarshanClick={handleDarshanClick} {...yatraPlanProps} />;
      case 'temples':
        return <GridView type="temples" t={t} onDarshanClick={handleDarshanClick} language={language} {...yatraPlanProps} />;
      case 'templeDetail':
        return <TempleDetail templeId={id!} t={t} language={language} onDarshanClick={handleDarshanClick} {...yatraPlanProps} />;
      case 'chantingZone':
        return <ChantingZone t={t} />;
      default:
        // All other views redirect to home
        return <Home t={t} language={language} onDarshanClick={handleDarshanClick} {...yatraPlanProps} />;
    }
  };

  if (showSplash) {
    return <SplashScreen onFinished={handleSplashFinished} />;
  }

  // Gate: Show AccessGateway if not authenticated (and not loading)
  if (!userLoading && !isAuthenticated) {
    return <AccessGateway onAccessGranted={handleAccessGranted} />;
  }

  // Loading state
  if (userLoading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center">
        <Icon name="lotus" className="h-16 w-16 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`relative h-screen md:flex ${theme.className}`}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold focus:text-sm">
        Skip to main content
      </a>
      <NetworkStatus />
      <AnimatedBackground />
      <Sidebar
        currentLang={language}
        setLang={setLanguage}
        t={t}
        currentUser={currentUser}
        currentView={view}
        onSetView={setView}
        onLoginClick={() => {}}
        onSevaClick={() => {}}
        logout={handleLogout}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      <div className="relative z-1 flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          currentLang={language}
          setLang={setLanguage}
          currentUser={currentUser}
          t={t}
          onMenuClick={() => setIsSidebarOpen(true)}
          onUserClick={() => {}}
          onLoginClick={() => {}}
        />
        <main id="main-content" className="flex-1 overflow-y-auto transition-colors duration-500 pb-24 bg-stone-50/50" aria-live="polite">
          <ErrorBoundary>
            <Suspense fallback={<SubscreenLoader />}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={view + (id || '') + (isTransitioning ? '-loading' : '')}
                    initial={{ opacity: 0, scale: 0.98, y: 15, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.98, y: -15, filter: 'blur(4px)' }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full"
                  >
                    {isTransitioning ? <SubscreenLoader /> : renderView()}
                  </motion.div>
                </AnimatePresence>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* MODAL RENDERER — only darshan, crowd alert, AI guru, booking confirmation */}
      <Suspense fallback={null}>
        {modalType === 'darshanBooking' && modalProps.temple && <DarshanBookingModal temple={modalProps.temple} t={t} onClose={closeModal} onConfirm={handleDarshanBooking} />}
        {modalType === 'crowdAlert' && modalProps.originalTemple && modalProps.alternativeTemple && <CrowdAlertModal {...modalProps} t={t} isOpen={modalType === 'crowdAlert'} onClose={closeModal} />}
        {modalType === 'confirmation' && modalProps.onConfirm && <ConfirmationModal {...modalProps} isOpen={modalType === 'confirmation'} onClose={closeModal} />}
        {modalType === 'bookingConfirmation' && modalProps.details && <BookingConfirmationModal {...modalProps} onClose={closeModal} t={t} />}
        {modalType === 'aiGuruChat' && <AIGuruModal {...modalProps} onClose={closeModal} t={t} />}
      </Suspense>

      <FloatingDock />

      {/* AI Guru Floating Button */}
      <button
        onClick={() => openModal('aiGuruChat')}
        className="fixed bottom-24 right-6 z-20 w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center transform hover:scale-110 transition-all duration-300 animate-fade-in-up hover:shadow-[0_0_30px_rgba(99,102,241,0.8)] border border-indigo-300/30 group"
        aria-label="Open AI Guru"
        style={{ animationDelay: '0.5s' }}
      >
        <Icon name="cosmic-logo" className="w-8 h-8 group-hover:animate-om-pulse" />
      </button>
    </div>
  );
};
