import React, { useState, useEffect } from 'react';
import { KolamDivider, VintageTempleBell, BrassCorner, VintageDiyaFlame } from './TempleOrnaments';

export type TempleSection = 'darshan' | 'pooja' | 'yatra' | 'pandit';

interface GopuramNavigationProps {
  activeSection: TempleSection;
  onSelectSection: (section: TempleSection) => void;
  onOpenConsult?: () => void;
  onOpenDarshanBooking?: () => void;
}

const SECTIONS: {
  id: TempleSection;
  sanskrit: string;
  english: string;
  subtitle: string;
  code: string;
  talaLevels: number; // Tier count for gopuram silhouette
}[] = [
  {
    id: 'darshan',
    sanskrit: 'दर्शन',
    english: 'DARSHAN',
    subtitle: 'Live Sanctum Queue & Passes',
    code: 'SEC-01-DSN',
    talaLevels: 5,
  },
  {
    id: 'pooja',
    sanskrit: 'पूजा',
    english: 'POOJA',
    subtitle: 'Vedic Archana & Abhishekams',
    code: 'SEC-02-PJA',
    talaLevels: 4,
  },
  {
    id: 'yatra',
    sanskrit: 'यात्रा',
    english: 'YATRA',
    subtitle: 'Sacred Corridors & Circuits',
    code: 'SEC-03-YTR',
    talaLevels: 4,
  },
  {
    id: 'pandit',
    sanskrit: 'पण्डित',
    english: 'PANDIT',
    subtitle: 'Vedic Acharyas & Muhurat',
    code: 'SEC-04-PND',
    talaLevels: 3,
  },
];

export const GopuramNavigation: React.FC<GopuramNavigationProps> = ({
  activeSection,
  onSelectSection,
  onOpenConsult,
  onOpenDarshanBooking,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const istString = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setCurrentTime(istString + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="w-full relative z-30 select-none bg-[#1C1A17] text-[#F0E6D2] border-b-2 border-[#A67C3D] shadow-2xl">
      {/* ──────────────────────────────────────────────────────────
          1. TOP EPIGRAPHIC TICKER: SANATANA PANCHANG & MUHURAT
          ────────────────────────────────────────────────────────── */}
      <div className="border-b border-[#A67C3D]/30 bg-[#141210] px-4 py-1.5 text-[11px] font-ticket text-[#C4974E] flex flex-wrap items-center justify-between gap-3 tracking-widest uppercase">
        <div className="flex items-center gap-3">
          <VintageTempleBell size={16} className="text-[#D4A017]" />
          <span className="text-[#F0E6D2] font-semibold border-r border-[#A67C3D]/40 pr-3">
            DHARMA SETU • धर्म सेतु
          </span>
          <span className="hidden sm:inline text-stone-400">
            SAMVAT 2083 • SHUKLA PAKSHA TRITIYA
          </span>
          <span className="hidden md:inline text-[#D4A017]/80">
            • ABHIJIT: 11:48 - 12:38
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B1E3F] animate-ping" />
            <span className="text-stone-300">LIVE SANCTUM FEED</span>
          </div>
          <span className="font-ticket text-[#E5A91B] font-bold tracking-widest bg-[#221F1B] px-2 py-0.5 border border-[#A67C3D]/40 rounded-sm">
            {currentTime || '16:45:00 IST'}
          </span>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          2. MAIN GOPURAM STEPPED ARCHITECTURE NAVIGATION BAR
          ────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 pb-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          {SECTIONS.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => onSelectSection(sec.id)}
                className={`group relative text-left transition-all duration-300 rounded-t-lg pt-3 pb-3 px-3.5 flex flex-col justify-between overflow-hidden ${
                  isActive
                    ? 'bg-[#2A251E] border-t-2 border-x-2 border-[#D4A017] shadow-[0_-8px_20px_rgba(212,160,23,0.12)]'
                    : 'bg-[#181613] hover:bg-[#221E18] border-t border-x border-[#A67C3D]/30 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Stepped Gopuram Crown Silhouette (SVG at top of each pillar) */}
                <div className="w-full flex justify-center mb-1 pointer-events-none">
                  <svg
                    width="60"
                    height="14"
                    viewBox="0 0 60 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={isActive ? 'text-[#D4A017]' : 'text-[#A67C3D]/60 group-hover:text-[#A67C3D]'}
                  >
                    {/* Kalasam Finial */}
                    <circle cx="30" cy="2" r="1.5" fill="currentColor" />
                    <rect x="29" y="3.5" width="2" height="2" fill="currentColor" />
                    {/* Stepped Tala Tiers */}
                    <path
                      d="M24 6 H36 V8 H39 V10 H44 V12 H52 V14 H8 V12 H16 V10 H21 V8 H24 V6 Z"
                      fill="currentColor"
                      opacity={isActive ? '0.9' : '0.5'}
                    />
                    {/* Engraved Tala band lines */}
                    <line x1="16" y1="11" x2="44" y2="11" stroke="#1C1A17" strokeWidth="0.8" />
                  </svg>
                </div>

                {/* Stamped Ticket Code */}
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-ticket text-[9px] uppercase tracking-wider text-[#A67C3D]">
                    {sec.code}
                  </span>
                  {isActive && (
                    <span className="inline-flex items-center gap-1 font-ticket text-[9px] text-[#8B1E3F] bg-[#8B1E3F]/15 px-1.5 py-0.2 border border-[#8B1E3F]/40 rounded-xs uppercase font-bold">
                      <span className="w-1 h-1 rounded-full bg-[#8B1E3F]" />
                      ACTIVE
                    </span>
                  )}
                </div>

                {/* Sanskrit & English Inscriptional Serifs */}
                <div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`font-inscriptional text-lg sm:text-2xl font-bold tracking-wide transition-colors ${
                        isActive ? 'text-[#F0E6D2]' : 'text-stone-300 group-hover:text-[#F0E6D2]'
                      }`}
                    >
                      {sec.sanskrit}
                    </span>
                    <span className="font-ticket text-[11px] font-bold tracking-widest text-[#D4A017]">
                      {sec.english}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-400 font-manuscript italic line-clamp-1 mt-0.5">
                    {sec.subtitle}
                  </p>
                </div>

                {/* Bottom Carved Tala Line Indicator */}
                <div
                  className={`w-full h-1 mt-2.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#8B1E3F] via-[#D4A017] to-[#8B1E3F]'
                      : 'bg-transparent group-hover:bg-[#A67C3D]/30'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
