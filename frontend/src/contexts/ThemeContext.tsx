import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { ChakraTheme } from '../types';
import { CHAKRA_DATA } from '../constants';

export type AtmosphereMode = 'Automatic' | 'Dawn' | 'Morning' | 'Day' | 'Sunset' | 'Night';
export type FestivalMode = 'None' | 'Diwali' | 'Mahashivaratri' | 'Janmashtami' | 'Rama Navami' | 'Hanuman Jayanti' | 'Navaratri';

interface ThemeContextType {
  theme: ChakraTheme;
  setTheme: (themeName: string) => void;
  ishtaDevata: string;
  setIshtaDevata: (devata: string) => void;
  atmosphereMode: AtmosphereMode;
  setAtmosphereMode: (mode: AtmosphereMode) => void;
  festivalMode: FestivalMode;
  setFestivalMode: (mode: FestivalMode) => void;
  calculatedTimeOfDay: string;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const defaultTheme = CHAKRA_DATA.find(c => c.name === 'Sahasrara')!;

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // 1. Core Chakra Theme (Chakra Sanctuary compatibility)
  const [chakraTheme, setChakraThemeState] = useState<ChakraTheme>(() => {
    try {
      const savedThemeName = localStorage.getItem('dharma-setu-theme');
      const savedTheme = CHAKRA_DATA.find(c => c.name === savedThemeName);
      return savedTheme || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  // 2. Ishta Devata State
  const [ishtaDevata, setIshtaDevataState] = useState<string>(() => {
    try {
      // Check if stored in loader STORAGE_KEY ('dharmasetu_ishta_devata')
      // Note: loader stores the index of DEITY_THEMES in SubscreenLoader
      const savedIdx = localStorage.getItem('dharmasetu_ishta_devata');
      if (savedIdx !== null) {
        const idx = parseInt(savedIdx, 10);
        // Map index to name
        const DEITY_NAMES = [
          'Venkateswara', 'Ram', 'Krishna', 'Shiva', 'Durga', 'Ganesh',
          'Hanuman', 'Lakshmi', 'Saraswati', 'Kali', 'Murugan', 'Ayyappa'
        ];
        if (idx >= 0 && idx < DEITY_NAMES.length) {
          return DEITY_NAMES[idx];
        }
      }
      return localStorage.getItem('dharma-setu-ishta-devata') || 'Shiva';
    } catch {
      return 'Shiva';
    }
  });

  // 3. Time of Day (Atmosphere) State
  const [atmosphereMode, setAtmosphereModeState] = useState<AtmosphereMode>(() => {
    try {
      return (localStorage.getItem('dharma-setu-atmosphere-mode') as AtmosphereMode) || 'Automatic';
    } catch {
      return 'Automatic';
    }
  });

  // 4. Festival State
  const [festivalMode, setFestivalModeState] = useState<FestivalMode>(() => {
    try {
      return (localStorage.getItem('dharma-setu-festival-mode') as FestivalMode) || 'None';
    } catch {
      return 'None';
    }
  });

  // 5. Calculated Time of Day (for Automatic mode)
  const [calculatedTimeOfDay, setCalculatedTimeOfDay] = useState<string>('Day');

  // Recalculate Time of Day dynamically every minute
  useEffect(() => {
    const updateTimeOfDay = () => {
      if (atmosphereMode === 'Automatic') {
        const hours = new Date().getHours();
        if (hours >= 4 && hours < 7) {
          setCalculatedTimeOfDay('Dawn');
        } else if (hours >= 7 && hours < 12) {
          setCalculatedTimeOfDay('Morning');
        } else if (hours >= 12 && hours < 16) {
          setCalculatedTimeOfDay('Day');
        } else if (hours >= 16 && hours < 19) {
          setCalculatedTimeOfDay('Sunset');
        } else {
          setCalculatedTimeOfDay('Night');
        }
      } else {
        setCalculatedTimeOfDay(atmosphereMode);
      }
    };

    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000);
    return () => clearInterval(interval);
  }, [atmosphereMode]);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('dharma-setu-theme', chakraTheme.name);
    } catch {}
  }, [chakraTheme]);

  // Setters
  const setTheme = (themeName: string) => {
    const newTheme = CHAKRA_DATA.find(c => c.name === themeName);
    if (newTheme) {
      setChakraThemeState(newTheme);
    }
  };

  const setIshtaDevata = (devata: string) => {
    setIshtaDevataState(devata);
    try {
      localStorage.setItem('dharma-setu-ishta-devata', devata);
      // Also sync back to subscreen loader's index representation
      const DEITY_NAMES = [
        'Venkateswara', 'Ram', 'Krishna', 'Shiva', 'Durga', 'Ganesh',
        'Hanuman', 'Lakshmi', 'Saraswati', 'Kali', 'Murugan', 'Ayyappa'
      ];
      const idx = DEITY_NAMES.indexOf(devata);
      if (idx !== -1) {
        localStorage.setItem('dharmasetu_ishta_devata', String(idx));
      }
    } catch {}
  };

  const setAtmosphereMode = (mode: AtmosphereMode) => {
    setAtmosphereModeState(mode);
    try {
      localStorage.setItem('dharma-setu-atmosphere-mode', mode);
    } catch {}
  };

  const setFestivalMode = (mode: FestivalMode) => {
    setFestivalModeState(mode);
    try {
      localStorage.setItem('dharma-setu-festival-mode', mode);
    } catch {}
  };

  // Compile active theme class combining chakra theme, ishta devata, atmosphere, and festival modes
  const theme = useMemo((): ChakraTheme => {
    const devataClass = `theme-${ishtaDevata.toLowerCase()}`;
    const atmosphereClass = `atmosphere-${calculatedTimeOfDay.toLowerCase()}`;
    const festivalClass = `festival-${festivalMode.toLowerCase()}`;
    const baseChakraClass = chakraTheme.className;

    return {
      ...chakraTheme,
      // Concatenate classes so styling rules apply correctly
      className: `${baseChakraClass} ${devataClass} ${atmosphereClass} ${festivalClass} ishta-${ishtaDevata.toLowerCase()}`,
    };
  }, [chakraTheme, ishtaDevata, calculatedTimeOfDay, festivalMode]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    ishtaDevata,
    setIshtaDevata,
    atmosphereMode,
    setAtmosphereMode,
    festivalMode,
    setFestivalMode,
    calculatedTimeOfDay
  }), [theme, ishtaDevata, atmosphereMode, festivalMode, calculatedTimeOfDay]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
