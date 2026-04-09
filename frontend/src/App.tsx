
import React, { useMemo, useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from './services/apiService';
import { Language, DarshanBookingDetails, PoojaBookingDetails, DonationOption, Pandit, View, Temple, MajorEvent, TempleSubmissionData, Book, Festival, Pooja, Yatra, User, TaskType, YatraBookingDetails, CustomYatraBookingDetails, YatraQuoteRequest, YatraPlanItem, TravelMode, Task, YatraPlanSettings, FamilyMember, Category } from './types';
import { I18N_DATA } from './constants';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './contexts/ToastContext';
import { useModal } from './contexts/ModalContext';
import { useHashRouter } from './hooks/useHashRouter';
import { useTheme } from './contexts/ThemeContext';
import { useNotifications } from './contexts/NotificationContext';

// Core layout components (always loaded)
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Icon } from './components/Icon';
import { FloatingDock } from './components/FloatingDock';
import { AnimatedBackground } from './components/AnimatedBackground';
import { AmritCollector } from './components/AmritCollector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SplashScreen } from './components/SplashScreen';
import { NetworkStatus } from './components/NetworkStatus';
import { Home } from './components/Home';
import { WelcomeFlow } from './components/WelcomeFlow';

// Eagerly loaded modals (commonly opened)
import { LoginModal } from './components/LoginModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { BookingConfirmationModal } from './components/BookingConfirmationModal';

// Lazy-loaded page views
const GridView = React.lazy(() => import('./components/GridView').then(m => ({ default: m.GridView })));
const TempleDetail = React.lazy(() => import('./components/TempleDetail').then(m => ({ default: m.TempleDetail })));
const EventDetail = React.lazy(() => import('./components/EventDetail').then(m => ({ default: m.EventDetail })));
const BookReader = React.lazy(() => import('./components/BookReader').then(m => ({ default: m.BookReader })));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const SearchView = React.lazy(() => import('./components/SearchView').then(m => ({ default: m.SearchView })));
const ChantingZone = React.lazy(() => import('./components/SlokaWidget').then(m => ({ default: m.ChantingZone })));
const SettingsView = React.lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));
const KnowledgeView = React.lazy(() => import('./components/KnowledgeView').then(m => ({ default: m.KnowledgeView })));
const ChakraSanctuary = React.lazy(() => import('./components/ChakraSanctuary').then(m => ({ default: m.ChakraSanctuary })));
const YatraPlannerView = React.lazy(() => import('./components/YatraPlannerView').then(m => ({ default: m.YatraPlannerView })));
const SatsangView = React.lazy(() => import('./components/SatsangView').then(m => ({ default: m.SatsangView })));
const SavedInsights = React.lazy(() => import('./components/SavedInsights').then(m => ({ default: m.SavedInsights })));
const ChatRoom = React.lazy(() => import('./components/ChatRoom').then(m => ({ default: m.ChatRoom })));
const NearbyView = React.lazy(() => import('./components/NearbyView').then(m => ({ default: m.NearbyView })));
const StateSanctuary = React.lazy(() => import('./components/StateSanctuary').then(m => ({ default: m.StateSanctuary })));
const RestorationSanctuary = React.lazy(() => import('./components/RestorationSanctuary').then(m => ({ default: m.RestorationSanctuary })));
const RestorationSubmission = React.lazy(() => import('./components/RestorationSubmission').then(m => ({ default: m.RestorationSubmission })));
const DivyaMarga = React.lazy(() => import('./components/DivyaMarga').then(m => ({ default: m.DivyaMarga })));
const MeditationZone = React.lazy(() => import('./components/MeditationZone').then(m => ({ default: m.MeditationZone })));
const DharmaMart = React.lazy(() => import('./components/DharmaMart').then(m => ({ default: m.DharmaMart })));

import { SubscreenLoader, IshtaDevataModal } from './components/SubscreenLoader';
import { QRShareModal } from './components/QRShareModal';

// Lazy-loaded modals (opened on demand)
const UploadTempleModal = React.lazy(() => import('./components/UploadTempleModal').then(m => ({ default: m.UploadTempleModal })));
const YatraDetailModal = React.lazy(() => import('./components/YatraDetailModal').then(m => ({ default: m.YatraDetailModal })));
const LiveDarshanModal = React.lazy(() => import('./components/LiveDarshanModal').then(m => ({ default: m.LiveDarshanModal })));
const VRDarshanModal = React.lazy(() => import('./components/VRDarshanModal').then(m => ({ default: m.VRDarshanModal })));
const EcoInnovationModal = React.lazy(() => import('./components/EcoInnovationModal').then(m => ({ default: m.EcoInnovationModal })));
const DarshanBookingModal = React.lazy(() => import('./components/DarshanBookingModal').then(m => ({ default: m.DarshanBookingModal })));
const PoojaBookingModal = React.lazy(() => import('./components/PoojaBookingModal').then(m => ({ default: m.PoojaBookingModal })));
const PanditBookingModal = React.lazy(() => import('./components/PanditBookingModal').then(m => ({ default: m.PanditBookingModal })));
const DonationModal = React.lazy(() => import('./components/DonationModal').then(m => ({ default: m.DonationModal })));
const CrowdAlertModal = React.lazy(() => import('./components/CrowdAlertModal').then(m => ({ default: m.CrowdAlertModal })));
const PanditModal = React.lazy(() => import('./components/PanditModal').then(m => ({ default: m.PanditModal })));
const BookModal = React.lazy(() => import('./components/BookModal').then(m => ({ default: m.BookModal })));
const EventModal = React.lazy(() => import('./components/EventModal').then(m => ({ default: m.EventModal })));
const FestivalModal = React.lazy(() => import('./components/FestivalModal').then(m => ({ default: m.FestivalModal })));
const ImageDetailModal = React.lazy(() => import('./components/ImageDetailModal').then(m => ({ default: m.ImageDetailModal })));
const PoojaModal = React.lazy(() => import('./components/PoojaModal').then(m => ({ default: m.PoojaModal })));
const YatraModal = React.lazy(() => import('./components/YatraModal').then(m => ({ default: m.YatraModal })));
const UserModal = React.lazy(() => import('./components/UserModal').then(m => ({ default: m.UserModal })));
const ManageTemplePoojasModal = React.lazy(() => import('./components/ManageTemplePoojasModal').then(m => ({ default: m.ManageTemplePoojasModal })));
const MeditationModal = React.lazy(() => import('./components/MeditationModal').then(m => ({ default: m.MeditationModal })));
const YatraBookingModal = React.lazy(() => import('./components/YatraBookingModal').then(m => ({ default: m.YatraBookingModal })));
const AIGuruModal = React.lazy(() => import('./components/AIGuruModal').then(m => ({ default: m.AIGuruModal })));
const YatraQuoteModal = React.lazy(() => import('./components/YatraQuoteModal').then(m => ({ default: m.YatraQuoteModal })));
const UserProfileModal = React.lazy(() => import('./components/UserProfileModal').then(m => ({ default: m.UserProfileModal })));
const YatraPlannerModal = React.lazy(() => import('./components/YatraPlannerModal').then(m => ({ default: m.YatraPlannerModal })));
const PostCreationModal = React.lazy(() => import('./components/PostCreationModal').then(m => ({ default: m.PostCreationModal })));
const PanditRegistrationModal = React.lazy(() => import('./components/PanditRegistrationModal').then(m => ({ default: m.PanditRegistrationModal })));
const TaskModal = React.lazy(() => import('./components/ReminderModal').then(m => ({ default: m.TaskModal })));
const CategoryModal = React.lazy(() => import('./components/CategoryModal').then(m => ({ default: m.CategoryModal })));
const AIShopper = React.lazy(() => import('./components/AIShopper').then(m => ({ default: m.AIShopper })));
const SatvikTraceModal = React.lazy(() => import('./components/SatvikTraceModal').then(m => ({ default: m.SatvikTraceModal })));
const PanchangModal = React.lazy(() => import('./components/PanchangModal').then(m => ({ default: m.PanchangModal })));
const CommandPaletteModal = React.lazy(() => import('./components/CommandPaletteModal').then(m => ({ default: m.CommandPaletteModal })));


interface PanditBookingDetails {
  date: Date;
  timeSlot: string;
}

export const App = () => {
  const [language, setLanguage] = React.useState<Language>(Language.EN);
  const { currentUser, userLoading, logout } = useAuth();
  const { modalType, modalProps, openModal, closeModal } = useModal();
  const { addToast } = useToast();
  const { view, id } = useHashRouter();
  const [showSplash, setShowSplash] = React.useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('dharmasetu_onboarded'));
  const { theme } = useTheme();
  const { addNotification } = useNotifications();

  const [showDevataModal, setShowDevataModal] = useState(false);
  const [showQRShare, setShowQRShare] = useState(false);

  // 6-second forced transition state requested by user
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevViewRef = useRef(view);

  useEffect(() => {
    if (view !== prevViewRef.current && view !== 'home') {
      // Only force loader on "sub pages" as requested, skip for home if desired, 
      // but applying to all navigation away from current view is safest.
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 6000);
      prevViewRef.current = view;
      return () => clearTimeout(timer);
    }
  }, [view]);

  useEffect(() => {
    if (!showSplash && !showWelcome && localStorage.getItem('dharmasetu_ishta_devata') === null) {
      setShowDevataModal(true);
    }
  }, [showSplash, showWelcome]);

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('dharma-setu-tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('dharma-setu-categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const coords = await getUserLocation();
        setUserLocation(coords);
      } catch (error) {
        console.warn("Could not fetch user location for sanctuary:", error);
      }
    };
    fetchLocation();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('dharma-setu-tasks', JSON.stringify(tasks));
    } catch (error) {
      addToast("Could not save tasks.", "error");
    }
  }, [tasks, addToast]);

  useEffect(() => {
    try {
      localStorage.setItem('dharma-setu-categories', JSON.stringify(categories));
    } catch (error) {
      addToast("Could not save categories.", "error");
    }
  }, [categories, addToast]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      addToast("This browser does not support desktop notifications.", "info");
      return 'denied';
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      addToast("Notification permission granted!", "success");
    } else {
      addToast("Notification permission denied.", "info");
    }
    return permission;
  };

  const handleSetTask = async (taskData: Omit<Task, 'id'>) => {
    let permission = notificationPermission;
    if (permission === 'default') {
      permission = await requestNotificationPermission();
    }
    if (permission !== 'granted') {
      addToast("Please enable notifications in your browser settings to receive alerts.", "info");
    }
    const newTask: Task = { ...taskData, id: Date.now() };
    setTasks(prev => [...prev, newTask]);
    addToast(`Task set for ${taskData.itemName}.`, 'success');
  };

  const handleDeleteTask = (id: number) => {
    setTasks(prev => prev.filter(r => r.id !== id));
    addToast("Task deleted.", "info");
  };

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const now = new Date().getTime();
        const dueTasks = tasks.filter(r => {
          try {
            const taskTime = new Date(r.dateTime).getTime();
            return !isNaN(taskTime) && taskTime <= now;
          } catch {
            return false;
          }
        });

        if (dueTasks.length > 0 && notificationPermission === 'granted') {
          dueTasks.forEach(task => {
            try {
              const taskName = task.itemName || 'Scheduled Task';
              new Notification(`Task Due: ${taskName}`, {
                body: task.note || `It's time for your scheduled event.`,
                icon: '/favicon.svg',
                tag: String(task.id) // Use a tag to prevent duplicate notifications if checker runs fast
              });
            } catch (error) {
              console.error('Failed to create notification:', error);
            }
          });
          // Remove triggered tasks
          setTasks(currentTasks => currentTasks.filter(r => !dueTasks.some(due => due.id === r.id)));
        }
      } catch (error) {
        console.error('Error in task notification interval:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [tasks, notificationPermission]);

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory = { ...category, id: Date.now() };
    setCategories(prev => [...prev, newCategory]);
    addToast(`Category "${category.name}" created.`, 'success');
    closeModal();
  };

  const updateCategory = (category: Category) => {
    setCategories(prev => prev.map(c => c.id === category.id ? category : c));
    addToast(`Category "${category.name}" updated.`, 'success');
    closeModal();
  };

  const deleteCategory = (id: number) => {
    setTasks(prev => prev.map(task => task.categoryId === id ? { ...task, categoryId: undefined } : task));
    setCategories(prev => prev.filter(c => c.id !== id));
    addToast("Category deleted.", "info");
  };

  const [yatraPlan, setYatraPlan] = React.useState<YatraPlanItem[]>(() => {
    try {
      const savedPlan = localStorage.getItem('yatraPlan');
      if (!savedPlan) return [];
      let parsedPlan = JSON.parse(savedPlan);
      // Migration logic: check if it's the old Temple[] format
      if (parsedPlan.length > 0 && parsedPlan[0].temple === undefined && parsedPlan[0].name !== undefined) {
        parsedPlan = parsedPlan.map((temple: Temple) => ({ // Don't return here, just transform
          temple: temple,
          visitDate: new Date().toISOString().split('T')[0],
          travelMode: 'Car' as TravelMode
        }));
      }

      // Ensure all items have a priority property for backward compatibility
      return parsedPlan.map((item: any) => ({
        ...item,
        priority: item.priority || 'Medium',
      }));

    } catch (error) {
      console.error('Failed to load yatra plan from localStorage:', error);
      return [];
    }
  });

  const [yatraPlanSettings, setYatraPlanSettings] = useState<YatraPlanSettings>(() => {
    try {
      const saved = localStorage.getItem('dharma-setu-yatra-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.startDate !== 'string') {
          parsed.startDate = new Date().toISOString().split('T')[0];
        }
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load yatra settings from localStorage:', error);
    }
    return {
      numberOfPersons: 1,
      familyMembers: [],
      accommodationTier: 'Comfort (3-star Hotels)',
      foodPreference: 'Satvik',
      transportMode: 'Shared AC Coach',
      startDate: new Date().toISOString().split('T')[0],
      budget: 50000,
    };
  });


  useEffect(() => {
    try {
      localStorage.setItem('yatraPlan', JSON.stringify(yatraPlan));
    } catch (error) {
      console.error("Failed to save yatra plan to localStorage", error);
      addToast("Could not save your Yatra plan. Your browser storage might be full.", "error");
    }
  }, [yatraPlan, addToast]);

  useEffect(() => {
    try {
      localStorage.setItem('dharma-setu-yatra-settings', JSON.stringify(yatraPlanSettings));
    } catch (error) {
      addToast("Could not save your Yatra settings.", "error");
    }
  }, [yatraPlanSettings, addToast]);

  const t = useMemo(() => I18N_DATA[language], [language]);

  const handleSplashFinished = useCallback(() => {
    setShowSplash(false);
  }, []);

  const setView = useCallback((newView: View, newId?: string | number) => {
    window.location.hash = newId ? `${newView}/${newId}` : newView;
  }, []);

  useEffect(() => {
    if (view === 'profile') {
      setView('settings');
    }
  }, [view]);

  useEffect(() => {
    if (view === 'satsang' && !currentUser && !userLoading) {
      addToast("Please log in to join the Satsang.", "info");
    }
  }, [view, currentUser, userLoading, addToast]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openModal('commandPalette');
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [openModal]);

  const handleLogout = () => {
    logout();
    setView('home');
    addToast("You've been logged out.", 'info');
  };

  // --- Yatra Plan Handlers ---
  const toggleInYatraPlan = useCallback((temple: Temple) => {
    setYatraPlan(prevPlan => {
      const isInPlan = prevPlan.some(item => item.temple.id === temple.id);
      if (isInPlan) {
        addToast(`${temple.name} removed from your Yatra.`, 'info');
        return prevPlan.filter(item => item.temple.id !== temple.id);
      } else {
        addToast(`${temple.name} added to your Yatra!`, 'success');
        const newItem: YatraPlanItem = {
          temple,
          visitDate: new Date().toISOString().split('T')[0],
          travelMode: 'Car',
          priority: 'Medium'
        };
        return [...prevPlan, newItem];
      }
    });
  }, [addToast]);

  const removeFromYatraPlan = useCallback((templeId: number) => {
    setYatraPlan(prevPlan => prevPlan.filter(item => item.temple.id !== templeId));
  }, []);

  const updateYatraPlanItem = useCallback((templeId: number, updates: Partial<Omit<YatraPlanItem, 'temple'>>) => {
    setYatraPlan(prevPlan =>
      prevPlan.map(item =>
        item.temple.id === templeId ? { ...item, ...updates } : item
      )
    );
  }, []);

  const isInYatraPlan = useCallback((templeId: number): boolean => {
    return yatraPlan.some(item => item.temple.id === templeId);
  }, [yatraPlan]);

  // --- Modal Handlers ---
  const handleDarshanBooking = async (details: DarshanBookingDetails) => {
    if (!currentUser || !modalProps.temple) return;
    try {
      const result = await api.bookDarshan(modalProps.temple, details, currentUser, currentUser.token!);
      addToast(result.message, 'success');
      addNotification({ title: 'Darshan Booked', message: `Darshan at ${modalProps.temple.name} confirmed!`, type: 'booking', icon: 'eye' });
      await api.completeSpiritualTask(currentUser.id, 'darshan', currentUser.token);
      addToast("You've completed the 'Visit a Temple' task!", 'success');
      closeModal();
      openModal('bookingConfirmation', { type: 'Darshan', itemName: modalProps.temple.name, details, temple: modalProps.temple });
    } catch (err) {
      if (err instanceof Error) addToast(err.message, 'error');
    }
  };

  const handlePoojaBooking = async (details: PoojaBookingDetails) => {
    if (!currentUser) return;
    try {
      const result = await api.bookPooja(details, currentUser, currentUser.token!);
      addToast(result.message, 'success');
      addNotification({ title: 'Pooja Booked', message: `${details.pooja.name} pooja booking confirmed!`, type: 'booking', icon: 'flame' });
      closeModal();
      openModal('bookingConfirmation', { type: 'Pooja', itemName: details.pooja.name, details, temple: details.temple });
    } catch (err) {
      if (err instanceof Error) addToast(err.message, 'error');
    }
  };

  const handleYatraBooking = async (details: YatraBookingDetails) => {
    if (!currentUser) return;
    try {
      const result = await api.bookYatra(details, currentUser, currentUser.token!);
      addToast(result.message, 'success');
      addNotification({ title: 'Yatra Booked', message: `${details.yatra.name} pilgrimage booking confirmed!`, type: 'booking', icon: 'compass' });
      closeModal();
      openModal('bookingConfirmation', { type: 'Yatra', itemName: details.yatra.name, details });
    } catch (err) {
      if (err instanceof Error) addToast(err.message, 'error');
    }
  };

  const handleYatraQuoteRequest = async (details: YatraQuoteRequest) => {
    if (!currentUser) return;
    try {
      const result = await api.submitYatraQuoteRequest(details, currentUser);
      addToast(result.message, 'success');
      closeModal();
    } catch (err) {
      if (err instanceof Error) addToast(err.message, 'error');
    }
  };

  const handlePanditBooking = async (details: { date: Date, timeSlot: string }) => {
    if (!currentUser || !modalProps.pandit || !modalProps.event) return;
    try {
      const result = await api.bookPandit(modalProps.pandit, modalProps.event, currentUser, details);
      addToast(result.message, 'success');
      closeModal();
    } catch (err) {
      if (err instanceof Error) addToast(err.message, 'error');
    }
  };

  const handleDonation = async (amount: number, purpose: DonationOption) => {
    if (!currentUser) return;
    try {
      const result = await api.makeDonation(amount, purpose, currentUser, modalProps.temple);
      addToast(result.message, 'success');
      addNotification({ title: 'Donation Received', message: `₹${amount} donated for ${purpose.title}. Thank you for your seva!`, type: 'booking', icon: 'heart-hand' });
      await api.completeSpiritualTask(currentUser.id, 'seva', currentUser.token);
      addToast("You've completed the 'Offer Seva' task!", 'success');
      closeModal();
    } catch (err) {
      if (err instanceof Error) addToast(err.message, 'error');
    }
  };

  const handleTempleSubmission = async (templeData: TempleSubmissionData) => {
    if (!currentUser) return;
    try {
      const result = await api.submitTemple(templeData, currentUser);
      addToast(result.message, 'success');
      closeModal();
    } catch (err) {
      if (err instanceof Error) addToast(err.message, 'error');
    }
  };

  const handleUpdatePoojaAssociations = async (templeId: number, selectedPoojaIds: number[]) => {
    if (!currentUser?.token) return;
    try {
      const result = await api.updatePoojaAssociationsForTemple(templeId, selectedPoojaIds, currentUser.token);
      addToast(result.message, 'success');
      closeModal();
    } catch (err) {
      if (err instanceof Error) addToast(err.message, 'error');
    }
  };

  const handleCompleteMeditation = async () => {
    if (!currentUser) return;
    try {
      await api.completeSpiritualTask(currentUser.id, 'meditate', currentUser.token);
      addToast(t.meditationComplete, 'success');
      closeModal();
    } catch (err) {
      if (err instanceof Error) addToast(err.message, 'error');
    }
  };

  const handleSevaClick = () => {
    if (currentUser) {
      openModal('donation');
    } else {
      openModal('login');
    }
  };

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
      openModal('login');
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
      } catch (error) {
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
          onBookPooja: (pooja: Pooja) => { openModal('poojaBooking', { pooja, temple: alternativeTemple }); }
        });
      } else {
        openModal('darshanBooking', { temple });
      }
    } else {
      openModal('darshanBooking', { temple });
    }
  };


  const renderView = () => {
    const yatraPlanProps = { yatraPlan: yatraPlan.map(item => item.temple), isInYatraPlan, onToggleYatraPlan: toggleInYatraPlan };
    switch (view) {
      case 'home':
        return <Home t={t} language={language} onDarshanClick={handleDarshanClick} {...yatraPlanProps} />;
      case 'temples':
      case 'poojas':
      case 'yatras':
      case 'events':
        return <GridView type={view} t={t} onDarshanClick={handleDarshanClick} language={language} {...yatraPlanProps} />;
      case 'knowledge':
        return <KnowledgeView t={t} language={language} />;
      case 'chantingZone':
        return <ChantingZone t={t} />;
      case 'chakraSanctuary':
        return <ChakraSanctuary user={currentUser} t={t} />;
      case 'yatraPlanner':
        return <YatraPlannerView
          t={t}
          language={language}
          yatraPlan={yatraPlan}
          setYatraPlan={setYatraPlan}
          toggleInYatraPlan={toggleInYatraPlan}
          settings={yatraPlanSettings}
          setSettings={setYatraPlanSettings}
        />;
      case 'satsang':
        if (!currentUser) {
          return <Home t={t} language={language} onDarshanClick={handleDarshanClick} {...yatraPlanProps} />;
        }
        if (id) {
          const roomId = parseInt(id, 10);
          return !isNaN(roomId) ? <ChatRoom roomId={roomId} t={t} /> : <SatsangView t={t} />;
        }
        return <SatsangView t={t} />;
      case 'search':
        return <SearchView query={id!} t={t} language={language} {...yatraPlanProps} />;
      case 'templeDetail':
        return <TempleDetail templeId={id!} t={t} language={language} onDarshanClick={handleDarshanClick} {...yatraPlanProps} />;
      case 'eventDetail':
        return <EventDetail eventId={id!} t={t} language={language} />;
      case 'bookReader':
        return <BookReader bookId={id!} t={t} language={language} />;
      case 'settings':
        return currentUser ? <SettingsView user={currentUser} t={t} setLang={setLanguage} currentLang={language} tasks={tasks} deleteTask={handleDeleteTask} categories={categories} addCategory={addCategory} updateCategory={updateCategory} deleteCategory={deleteCategory} notificationPermission={notificationPermission} requestNotificationPermission={requestNotificationPermission} /> : <Home t={t} language={language} onDarshanClick={handleDarshanClick} {...yatraPlanProps} />;
      case 'dashboard':
        return currentUser?.role === 'admin' ? <AdminDashboard t={t} /> : <Home t={t} language={language} onDarshanClick={handleDarshanClick} {...yatraPlanProps} />;
      case 'savedInsights':
        return currentUser ? <SavedInsights t={t} /> : <Home t={t} language={language} onDarshanClick={handleDarshanClick} {...yatraPlanProps} />;
      case 'stateSanctuary':
        return <StateSanctuary t={t} language={language} onNavigate={setView} userLocation={userLocation} />;
      case 'restorationSanctuary':
        return <RestorationSanctuary t={t} language={language} onNavigate={setView} onDonate={(temple) => openModal('donation', { temple })} openModal={openModal} />;
      case 'restorationSubmission':
        return <RestorationSubmission t={t} language={language} onNavigate={setView} onSubmit={handleTempleSubmission} />;
      case 'divyaMarga':
        return <DivyaMarga t={t} language={language} onNavigate={setView} openModal={openModal} />;
      case 'meditationZone':
        return <MeditationZone t={t} />;
      case 'mart':
        return <DharmaMart t={t} language={language} />;
      default:
        return <Home t={t} language={language} onDarshanClick={handleDarshanClick} {...yatraPlanProps} />;
    }
  };

  if (showSplash) {
    return <SplashScreen onFinished={handleSplashFinished} />;
  }

  return (
    <div className={`relative h-screen md:flex ${theme.className}`}>
      {/* Skip to main content link for keyboard/screen reader users */}
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
        onLoginClick={() => openModal('login')}
        onSevaClick={handleSevaClick}
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
          onUserClick={() => setView('settings')}
          onLoginClick={() => openModal('login')}
        />
        <main id="main-content" className={`flex-1 overflow-y-auto transition-colors duration-500 pb-24 ${view === 'satsang' ? 'bg-[#08090f]' : 'bg-stone-50/50'}`} aria-live="polite" aria-busy={userLoading}>
          {userLoading ? (
            <div role="status" className="flex justify-center items-center h-full" aria-label={t.festivalsLoading}>
              <Icon name="lotus" className="h-16 w-16 text-primary animate-spin" />
            </div>
          ) : (
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
          )}
        </main>
      </div>

      {/* Floating Yatra Plan Button */}
      {yatraPlan.length > 0 && view !== 'satsang' && (
        <button
          onClick={() => openModal('yatraPlan', {
            plan: yatraPlan,
            settings: yatraPlanSettings,
            onRemove: removeFromYatraPlan,
            onUpdate: updateYatraPlanItem,
            onOpenPlanner: () => {
              closeModal();
              setView('yatraPlanner');
            }
          })}
          className="fixed bottom-6 right-6 z-20 w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform animate-fade-in-up"
          aria-label={`View Yatra Plan with ${yatraPlan.length} temples`}
        >
          <Icon name="compass" className="w-8 h-8" />
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
            {yatraPlan.length}
          </span>
        </button>
      )}

      {/* MODAL RENDERER */}
      <Suspense fallback={null}>
      {modalType === 'login' && <LoginModal onClose={closeModal} t={t} />}
      {modalType === 'uploadTemple' && <UploadTempleModal {...modalProps} onClose={closeModal} onSubmit={modalProps.onSubmit || handleTempleSubmission} />}
      {modalType === 'yatraDetail' && modalProps.yatra && <YatraDetailModal yatra={modalProps.yatra} t={t} onClose={closeModal} onBook={() => openModal('yatraBooking', { yatra: modalProps.yatra })} />}
      {modalType === 'liveDarshan' && <LiveDarshanModal onClose={closeModal} />}
      {modalType === 'vrDarshan' && <VRDarshanModal onClose={closeModal} />}
      {modalType === 'darshanBooking' && modalProps.temple && <DarshanBookingModal temple={modalProps.temple} t={t} onClose={closeModal} onConfirm={handleDarshanBooking} />}
      {modalType === 'poojaBooking' && modalProps.pooja && <PoojaBookingModal pooja={modalProps.pooja} temple={modalProps.temple} t={t} onClose={closeModal} onConfirm={handlePoojaBooking} />}
      {modalType === 'yatraBooking' && modalProps.yatra && <YatraBookingModal yatra={modalProps.yatra} t={t} onClose={closeModal} onConfirm={handleYatraBooking} />}
      {modalType === 'panditBooking' && modalProps.pandit && modalProps.event && <PanditBookingModal pandit={modalProps.pandit} event={modalProps.event} t={t} onClose={closeModal} onConfirm={handlePanditBooking} />}
      {modalType === 'donation' && <DonationModal temple={modalProps.temple} t={t} onClose={closeModal} onConfirm={handleDonation} />}
      {modalType === 'crowdAlert' && modalProps.originalTemple && modalProps.alternativeTemple && <CrowdAlertModal {...modalProps} t={t} isOpen={modalType === 'crowdAlert'} onClose={closeModal} />}
      {modalType === 'panditAdmin' && <PanditModal {...modalProps} t={t} onClose={closeModal} />}
      {modalType === 'bookAdmin' && <BookModal {...modalProps} onClose={closeModal} t={t} />}
      {modalType === 'eventAdmin' && <EventModal {...modalProps} onClose={closeModal} t={t} />}
      {modalType === 'festivalAdmin' && <FestivalModal {...modalProps} onClose={closeModal} t={t} />}
      {modalType === 'poojaAdmin' && <PoojaModal {...modalProps} onClose={closeModal} t={t} />}
      {modalType === 'yatraAdmin' && <YatraModal {...modalProps} onClose={closeModal} t={t} />}
      {modalType === 'userAdmin' && modalProps.initialData && <UserModal {...modalProps} onClose={closeModal} t={t} />}
      {modalType === 'confirmation' && modalProps.onConfirm && <ConfirmationModal {...modalProps} isOpen={modalType === 'confirmation'} onClose={closeModal} />}
      {modalType === 'imageDetail' && modalProps.imageUrl && <ImageDetailModal imageUrl={modalProps.imageUrl} altText={modalProps.altText || 'Image'} onClose={closeModal} />}
      {modalType === 'manageTemplePoojas' && modalProps.temple && <ManageTemplePoojasModal temple={modalProps.temple} t={t} onClose={closeModal} onConfirm={handleUpdatePoojaAssociations} />}
      {modalType === 'meditation' && <MeditationModal t={t} onClose={closeModal} onComplete={handleCompleteMeditation} />}
      {modalType === 'bookingConfirmation' && modalProps.details && <BookingConfirmationModal {...modalProps} onClose={closeModal} t={t} />}
      {modalType === 'aiGuruChat' && <AIGuruModal {...modalProps} onClose={closeModal} t={t} />}
      {modalType === 'yatraQuote' && modalProps.details && <YatraQuoteModal {...modalProps} onClose={closeModal} onSubmit={handleYatraQuoteRequest} t={t} />}
      {modalType === 'userProfile' && modalProps.user && <UserProfileModal user={modalProps.user} onClose={closeModal} t={t} />}
      {modalType === 'yatraPlan' && modalProps.plan && <YatraPlannerModal {...modalProps} onClose={closeModal} t={t} />}
      {modalType === 'postCreation' && <PostCreationModal onClose={closeModal} t={t} />}
      {modalType === 'panditRegistration' && <PanditRegistrationModal onClose={closeModal} t={t} />}
      {modalType === 'task' && modalProps.item && <TaskModal {...modalProps} categories={categories} onClose={closeModal} onConfirm={handleSetTask} />}
      {modalType === 'category' && <CategoryModal {...modalProps} onClose={closeModal} onSubmit={'id' in (modalProps.initialData || {}) ? updateCategory : addCategory} />}
      {modalType === 'aiShopper' && <AIShopper onClose={closeModal} />}
      {modalType === 'satvikTrace' && <SatvikTraceModal onClose={closeModal} />}
      {modalType === 'ecoInnovation' && <EcoInnovationModal onClose={closeModal} t={t} />}
      {modalType === 'panchang' && <PanchangModal language={language} onClose={closeModal} t={t} />}
      {modalType === 'commandPalette' && <CommandPaletteModal onClose={closeModal} language={language} />}
      </Suspense>

      {currentUser && <AmritCollector />}
      <FloatingDock />

      {/* QR Share / Present Button */}
      {view !== 'satsang' && (
        <button
          onClick={() => setShowQRShare(true)}
          className="fixed bottom-24 left-6 z-[60] w-14 h-14 bg-gradient-to-br from-stone-800 to-stone-900 text-white rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.3)] flex items-center justify-center transform hover:scale-110 transition-all duration-300 animate-fade-in-up hover:shadow-[0_0_25px_rgba(0,0,0,0.5)] border border-stone-600/30 group"
          aria-label="Share via QR Code"
          style={{ animationDelay: '0.6s' }}
        >
          <Icon name="qr-code" className="w-7 h-7 group-hover:scale-110 transition-transform" />
        </button>
      )}
      <QRShareModal isOpen={showQRShare} onClose={() => setShowQRShare(false)} />

      {/* Daily Panchang Floating Button */}
      {view !== 'satsang' && (
        <button
          onClick={() => openModal('panchang')}
          className="fixed bottom-[170px] right-6 z-20 w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center transform hover:scale-110 transition-all duration-300 animate-fade-in-up hover:shadow-[0_0_30px_rgba(245,158,11,0.8)] border border-amber-300/30 group"
          aria-label="Daily Panchang"
          style={{ animationDelay: '0.4s' }}
        >
          <Icon name="sun" className="w-8 h-8 group-hover:rotate-180 transition-transform duration-1000" />
        </button>
      )}

      {/* Global AI Guru Floating Button */}
      {view !== 'satsang' && (
        <button
          onClick={() => openModal('aiGuruChat')}
          className="fixed bottom-24 right-6 z-20 w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center transform hover:scale-110 transition-all duration-300 animate-fade-in-up hover:shadow-[0_0_30px_rgba(99,102,241,0.8)] border border-indigo-300/30 group"
          aria-label="Open AI Guru"
          style={{ animationDelay: '0.5s' }}
        >
          <Icon name="cosmic-logo" className="w-8 h-8 group-hover:animate-om-pulse" />
        </button>
      )}
      {/* Welcome Onboarding Flow */}
      {showWelcome && !showSplash && (
        <WelcomeFlow t={t} onComplete={() => setShowWelcome(false)} onNavigate={setView} />
      )}
      
      {/* Ishta Devata Selector */}
      {showDevataModal && (
          <IshtaDevataModal onClose={() => setShowDevataModal(false)} />
        )}

        {/* Global Access Gate - Must be logged in to use any feature */}
        {!currentUser && !showSplash && !showWelcome && !userLoading && (
          <div className="fixed inset-0 z-[9999] bg-stone-950/95 backdrop-blur-xl flex flex-col items-center justify-center">
            <div className="mb-8 text-center px-4 animate-fade-in-up">
              <Icon name="lotus" className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to Dharma Setu</h2>
              <p className="text-amber-200/80">Please log in or register to access the spiritual features.</p>
            </div>
            <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <LoginModal onClose={() => {}} t={t} inline={true} />
            </div>
            <div className="absolute inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-stone-950 to-stone-950"></div>
          </div>
        )}
      </div>
    );
  };
