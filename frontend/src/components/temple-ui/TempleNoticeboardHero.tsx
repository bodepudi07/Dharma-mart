import React, { useState, useEffect } from 'react';
import {
  BrassCorner,
  KolamDivider,
  VintageTempleBell,
  VintageDiyaFlame,
  VerifiedTempleSeal,
  TemplePillarBorder,
} from './TempleOrnaments';

export interface TempleNoticeData {
  id: string;
  name: string;
  location: string;
  deity: string;
  epigraphCode: string;
  nextAarti: {
    name: string;
    sanskritName: string;
    targetHour: number; // 24h format
    targetMinute: number;
    description: string;
  };
  dailySchedule: {
    time: string;
    ritual: string;
    type: 'aarti' | 'darshan' | 'abhishekam' | 'bhog';
  }[];
  queueStatus: {
    sarvaDarshanWait: string;
    compartmentsFilled: number;
    totalCompartments: number;
    specialEntryRemaining: number;
    crowdLevel: 'Moderate' | 'Heavy' | 'Pleasant';
  };
  currentMuhurat: string;
  consecratedSloka: {
    devanagari: string;
    transliteration: string;
    translation: string;
    source: string;
  };
}

const TEMPLE_REGISTRY: TempleNoticeData[] = [
  {
    id: 'kashi',
    name: 'Shri Kashi Vishwanath Dham',
    location: 'Varanasi, Uttar Pradesh',
    deity: 'Lord Vishweshwara (Shiva)',
    epigraphCode: 'KV-VNS-2083',
    nextAarti: {
      name: 'Sandhya Aarti',
      sanskritName: 'सन्ध्या आरती',
      targetHour: 19,
      targetMinute: 0,
      description: 'Grand evening incense offering & Damaru recital at Manikarnika Ghat corridor.',
    },
    dailySchedule: [
      { time: '03:00', ritual: 'Mangla Aarti', type: 'aarti' },
      { time: '11:15', ritual: 'Bhog Aarti & Naivedya', type: 'bhog' },
      { time: '19:00', ritual: 'Sapta Rishi / Sandhya Aarti', type: 'aarti' },
      { time: '21:00', ritual: 'Shringar Aarti', type: 'abhishekam' },
      { time: '22:30', ritual: 'Shayan Aarti', type: 'aarti' },
    ],
    queueStatus: {
      sarvaDarshanWait: '1 hr 45 min',
      compartmentsFilled: 4,
      totalCompartments: 12,
      specialEntryRemaining: 68,
      crowdLevel: 'Pleasant',
    },
    currentMuhurat: 'Pradosha Kaal (18:12 - 19:48)',
    consecratedSloka: {
      devanagari: 'वाराणसीपुरपते भज विश्वनाथं मङ्गलप्रदम्।',
      transliteration: 'Vārāṇasī-pura-pate bhaja Viśvanāthaṁ maṅgala-pradam.',
      translation: 'Worship Vishwanatha, the Lord of Varanasi, the eternal dispenser of auspiciousness.',
      source: 'Kashi Khanda, Skanda Purana',
    },
  },
  {
    id: 'tirupati',
    name: 'Tirumala Tirupati Devasthanams',
    location: 'Tirumala Hills, Andhra Pradesh',
    deity: 'Lord Venkateswara Balaji',
    epigraphCode: 'TTD-SVT-4401',
    nextAarti: {
      name: 'Thomala Seva & Archana',
      sanskritName: 'तोमाल सेवा एवं अर्चना',
      targetHour: 18,
      targetMinute: 30,
      description: 'Adornment with sacred floral garlands woven by the temple Jeeyar swamis.',
    },
    dailySchedule: [
      { time: '03:00', ritual: 'Suprabhatam', type: 'aarti' },
      { time: '04:30', ritual: 'Thomala Seva', type: 'aarti' },
      { time: '08:00', ritual: 'Sarva Darshan Slot A', type: 'darshan' },
      { time: '18:30', ritual: 'Evening Archana & Deeparadhana', type: 'aarti' },
      { time: '23:30', ritual: 'Ekanta Seva', type: 'aarti' },
    ],
    queueStatus: {
      sarvaDarshanWait: '4 hrs 15 min',
      compartmentsFilled: 16,
      totalCompartments: 32,
      specialEntryRemaining: 24,
      crowdLevel: 'Heavy',
    },
    currentMuhurat: 'Sayahna Sandhya (17:50 - 18:45)',
    consecratedSloka: {
      devanagari: 'वेङ्कटाद्रिसमं स्थानं ब्रह्माण्डे नास्ति किञ्चन।',
      transliteration: 'Veṅkaṭādri-samaṁ sthānaṁ brahmāṇḍe nāsti kiñcana.',
      translation: 'There is no sacred abode equal to Venkatadri in the entire cosmos.',
      source: 'Brahmanda Purana',
    },
  },
  {
    id: 'mahakal',
    name: 'Mahakaleshwar Jyotirlinga',
    location: 'Ujjain, Madhya Pradesh',
    deity: 'Lord Mahakal (Dakshinmukhi Shiva)',
    epigraphCode: 'MKL-UJN-7721',
    nextAarti: {
      name: 'Sandhya Aarti with Nagada',
      sanskritName: 'सन्ध्या महाआरती',
      targetHour: 19,
      targetMinute: 30,
      description: 'Evening ritual accompanied by thunderous sacred kettle-drums and bronze cymbals.',
    },
    dailySchedule: [
      { time: '04:00', ritual: 'Bhasma Aarti', type: 'aarti' },
      { time: '10:30', ritual: 'Daddhodak Aarti', type: 'aarti' },
      { time: '17:00', ritual: 'Sandhya Darshan', type: 'darshan' },
      { time: '19:30', ritual: 'Sandhya Aarti', type: 'aarti' },
      { time: '22:30', ritual: 'Shayan Aarti', type: 'aarti' },
    ],
    queueStatus: {
      sarvaDarshanWait: '2 hrs 10 min',
      compartmentsFilled: 7,
      totalCompartments: 16,
      specialEntryRemaining: 42,
      crowdLevel: 'Moderate',
    },
    currentMuhurat: 'Abhijit Muhurat Cleared • Amrit Kaal',
    consecratedSloka: {
      devanagari: 'आकाशे तारकं लिङ्गं पाताले हाटकेश्वरम्।',
      transliteration: 'Ākāśe tārakaṁ liṅgaṁ pātāle hāṭakeśvaram.',
      translation: 'In the celestial realm is the Star Linga, and on earth in Ujjain is Lord Mahakala.',
      source: 'Shiva Purana',
    },
  },
  {
    id: 'vaishnodevi',
    name: 'Shri Mata Vaishno Devi Shrine',
    location: 'Trikuta Hills, Katra (J&K)',
    deity: 'Maa Maha Kali, Maha Lakshmi, Maha Saraswati',
    epigraphCode: 'SMVDSB-KTR-901',
    nextAarti: {
      name: 'Pavitra Sandhya Aarti',
      sanskritName: 'पवित्र सन्ध्या आरती',
      targetHour: 19,
      targetMinute: 15,
      description: 'Devotional aarti performed inside the holy natural cave sanctum.',
    },
    dailySchedule: [
      { time: '05:00', ritual: 'Pratah Kaal Aarti', type: 'aarti' },
      { time: '08:00', ritual: 'Sanctum Darshan Queue Open', type: 'darshan' },
      { time: '19:15', ritual: 'Pavitra Sandhya Aarti', type: 'aarti' },
      { time: '22:00', ritual: 'Night Sanctuary Pass Entry', type: 'darshan' },
    ],
    queueStatus: {
      sarvaDarshanWait: '1 hr 10 min',
      compartmentsFilled: 3,
      totalCompartments: 10,
      specialEntryRemaining: 92,
      crowdLevel: 'Pleasant',
    },
    currentMuhurat: 'Gauri Muhurat (18:00 - 19:30)',
    consecratedSloka: {
      devanagari: 'सर्वमङ्गलमाङ्गल्ये शिवे सर्वार्थसाधिके।',
      transliteration: 'Sarva-maṅgala-māṅgalye śive sarvārtha-sādhike.',
      translation: 'O auspiciousness of all auspicious things, fulfiller of all pure desires.',
      source: 'Devi Mahatmyam',
    },
  },
];

interface TempleNoticeboardHeroProps {
  onReserveSlot?: (templeId: string) => void;
  onBookPooja?: (templeId: string) => void;
  onExploreVirtualDarshan?: (templeId: string) => void;
}

export const TempleNoticeboardHero: React.FC<TempleNoticeboardHeroProps> = ({
  onReserveSlot,
  onBookPooja,
  onExploreVirtualDarshan,
}) => {
  const [selectedTempleId, setSelectedTempleId] = useState<string>('kashi');
  const [countdown, setCountdown] = useState<{ hours: string; minutes: string; seconds: string }>({
    hours: '00',
    minutes: '00',
    seconds: '00',
  });

  const activeTemple =
    TEMPLE_REGISTRY.find((t) => t.id === selectedTempleId) || TEMPLE_REGISTRY[0];

  // Calculate live ticking countdown for the active temple's next aarti
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      // Target time today in IST
      const target = new Date();
      target.setHours(activeTemple.nextAarti.targetHour, activeTemple.nextAarti.targetMinute, 0, 0);

      // If target time has passed for today, point to tomorrow's next aarti
      let diffMs = target.getTime() - now.getTime();
      if (diffMs < 0) {
        diffMs += 24 * 60 * 60 * 1000;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const hrs = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      setCountdown({
        hours: String(hrs).padStart(2, '0'),
        minutes: String(mins).padStart(2, '0'),
        seconds: String(secs).padStart(2, '0'),
      });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [activeTemple]);

  return (
    <section className="relative w-full bg-vintage-paper vintage-noise py-10 px-3 sm:px-6 lg:px-8 border-b-2 border-[#A67C3D] overflow-hidden">
      {/* Structural Yantra Grid Layer */}
      <div className="absolute inset-0 yantra-grid-subtle pointer-events-none" />

      {/* Decorative Outer Pillars on wide viewports */}
      <div className="absolute top-0 bottom-0 left-3 hidden xl:block pointer-events-none">
        <TemplePillarBorder />
      </div>
      <div className="absolute top-0 bottom-0 right-3 hidden xl:block pointer-events-none">
        <TemplePillarBorder />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        {/* ──────────────────────────────────────────────────────────
            1. HEADER BANNER: MONUMENTAL STONE INSCRIPTION
            ────────────────────────────────────────────────────────── */}
        <div className="text-center space-y-3 max-w-3xl mx-auto pt-2">
          <div className="flex items-center justify-center gap-3">
            <VintageDiyaFlame size={26} />
            <span className="font-ticket text-xs uppercase tracking-[0.25em] text-[#A67C3D] font-bold">
              PHYGITAL SPIRITUAL INFRASTRUCTURE OF BHARAT
            </span>
            <VintageDiyaFlame size={26} />
          </div>

          <h1 className="font-inscriptional text-3xl sm:text-5xl lg:text-6xl font-bold text-[#1C1A17] tracking-tight drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
            Dharma Setu
            <span className="block text-2xl sm:text-3xl lg:text-4xl text-[#B5651D] font-cinzel mt-1">
              धर्म सेतु
            </span>
          </h1>

          <p className="font-manuscript text-base sm:text-lg text-stone-700 max-w-2xl mx-auto leading-relaxed italic">
            Connecting seekers with living sanctums through authentic darshan scheduling, Vedic
            sankalpam rituals, certified acharyas, and sacred yatra pathways.
          </p>

          <KolamDivider className="max-w-md mx-auto my-2" />
        </div>

        {/* ──────────────────────────────────────────────────────────
            2. TEMPLE SANCTUM SELECTOR TABS (Stone & Brass Carved Frieze)
            ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {TEMPLE_REGISTRY.map((temple) => {
            const isSelected = temple.id === selectedTempleId;
            return (
              <button
                key={temple.id}
                onClick={() => setSelectedTempleId(temple.id)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-sm font-inscriptional text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 border flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#1C1A17] text-[#F0E6D2] border-[#D4A017] shadow-[0_4px_12px_rgba(28,26,23,0.15)] ring-1 ring-[#D4A017]'
                    : 'bg-[#ECE2D0] hover:bg-[#E3D6BF] text-stone-800 border-[#A67C3D]/40'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-[#D4A017]' : 'bg-[#A67C3D]'
                  }`}
                />
                <span>{temple.name}</span>
                <span className="font-ticket text-[10px] text-[#B5651D] hidden md:inline">
                  [{temple.epigraphCode}]
                </span>
              </button>
            );
          })}
        </div>

        {/* ──────────────────────────────────────────────────────────
            3. MAIN TEMPLE NOTICEBOARD DISPLAY (BASALT & BRASS REPOUSSÉ)
            ────────────────────────────────────────────────────────── */}
        <div className="brass-repousse-dark rounded-lg p-5 sm:p-8 text-[#F0E6D2] relative overflow-hidden">
          {/* Authentic Brass Repoussé Corner Brackets */}
          <BrassCorner position="top-left" className="absolute top-2 left-2 text-[#D4A017]" size={36} />
          <BrassCorner position="top-right" className="absolute top-2 right-2 text-[#D4A017]" size={36} />
          <BrassCorner position="bottom-left" className="absolute bottom-2 left-2 text-[#D4A017]" size={36} />
          <BrassCorner position="bottom-right" className="absolute bottom-2 right-2 text-[#D4A017]" size={36} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
            {/* ── LEFT COLUMN: TEMPLE NOTICE & LIVE AARTI COUNTDOWN (7 Cols) ── */}
            <div className="lg:col-span-7 space-y-6">
              {/* Noticeboard Header */}
              <div className="border-b border-[#A67C3D]/40 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="inline-flex items-center gap-2 font-ticket text-[11px] text-[#D4A017] uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-[#8B1E3F] animate-ping" />
                    <span>SANCTUM NOTICEBOARD • अधिष्ठान सूचना</span>
                  </div>
                  <span className="font-ticket text-[11px] text-stone-400">
                    {activeTemple.currentMuhurat}
                  </span>
                </div>

                <h2 className="font-inscriptional text-2xl sm:text-3xl font-bold text-[#F0E6D2]">
                  {activeTemple.name}
                </h2>
                <p className="text-xs text-stone-400 font-ticket tracking-wider uppercase mt-0.5">
                  📍 {activeTemple.location} • DEITY: {activeTemple.deity}
                </p>
              </div>

              {/* LIVE AARTI COUNTDOWN CARD */}
              <div className="bg-[#141210] border border-[#A67C3D]/50 rounded-sm p-4 sm:p-5 relative shadow-inner">
                <div className="flex items-center justify-between mb-3 border-b border-[#A67C3D]/30 pb-2">
                  <div className="flex items-center gap-2">
                    <VintageTempleBell size={18} className="text-[#D4A017]" />
                    <span className="font-inscriptional text-base sm:text-lg font-bold text-[#D4A017]">
                      {activeTemple.nextAarti.sanskritName}
                    </span>
                    <span className="font-ticket text-xs text-stone-400">
                      ({activeTemple.nextAarti.name})
                    </span>
                  </div>
                  <span className="font-ticket text-[11px] text-[#8B1E3F] bg-[#8B1E3F]/20 px-2 py-0.5 border border-[#8B1E3F]/40 rounded-xs uppercase font-bold">
                    NEXT UPCOMING
                  </span>
                </div>

                <p className="font-manuscript text-stone-300 text-xs sm:text-sm italic mb-4 leading-relaxed">
                  "{activeTemple.nextAarti.description}"
                </p>

                {/* Stamped Numerical Countdown Ticker */}
                <div className="flex items-center justify-center sm:justify-start gap-3 select-none">
                  <div className="flex flex-col items-center">
                    <div className="font-ticket text-2xl sm:text-3xl font-bold text-[#F0E6D2] bg-[#221F1B] px-3 py-1.5 border border-[#A67C3D]/60 rounded-xs shadow-inner">
                      {countdown.hours}
                    </div>
                    <span className="font-ticket text-[9px] uppercase tracking-widest text-[#A67C3D] mt-1">
                      HOURS
                    </span>
                  </div>
                  <span className="font-ticket text-2xl font-bold text-[#D4A017] mb-4">:</span>
                  <div className="flex flex-col items-center">
                    <div className="font-ticket text-2xl sm:text-3xl font-bold text-[#F0E6D2] bg-[#221F1B] px-3 py-1.5 border border-[#A67C3D]/60 rounded-xs shadow-inner">
                      {countdown.minutes}
                    </div>
                    <span className="font-ticket text-[9px] uppercase tracking-widest text-[#A67C3D] mt-1">
                      MINUTES
                    </span>
                  </div>
                  <span className="font-ticket text-2xl font-bold text-[#D4A017] mb-4">:</span>
                  <div className="flex flex-col items-center">
                    <div className="font-ticket text-2xl sm:text-3xl font-bold text-[#E5A91B] bg-[#221F1B] px-3 py-1.5 border border-[#D4A017] rounded-xs shadow-inner">
                      {countdown.seconds}
                    </div>
                    <span className="font-ticket text-[9px] uppercase tracking-widest text-[#D4A017] mt-1">
                      SECONDS
                    </span>
                  </div>
                </div>
              </div>

              {/* TODAY'S CONSECRATED EPIGRAPH / SLOKA TABLET */}
              <div className="bg-[#191714] border border-[#A67C3D]/30 p-4 rounded-sm">
                <div className="flex items-center justify-between text-[10px] font-ticket uppercase text-[#A67C3D] mb-1.5">
                  <span>SACRED EPIGRAPH INSCRIPTION</span>
                  <span>{activeTemple.consecratedSloka.source}</span>
                </div>
                <p className="font-inscriptional text-lg text-[#F0E6D2] font-semibold tracking-wide">
                  {activeTemple.consecratedSloka.devanagari}
                </p>
                <p className="font-manuscript text-xs text-stone-400 italic mt-1">
                  {activeTemple.consecratedSloka.transliteration}
                </p>
                <p className="font-manuscript text-xs text-stone-300 mt-1">
                  Meaning: {activeTemple.consecratedSloka.translation}
                </p>
              </div>
            </div>

            {/* ── RIGHT COLUMN: AUTHENTIC QUEUE STATUS & STAMPED TICKET PASS (5 Cols) ── */}
            <div className="lg:col-span-5 space-y-5">
              {/* LIVE QUEUE & COMPARTMENT METER */}
              <div className="bg-[#141210] border border-[#A67C3D]/40 rounded-sm p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#A67C3D]/20 pb-2">
                  <span className="font-ticket text-xs uppercase tracking-widest text-[#D4A017] font-semibold">
                    DARSHAN QUEUE TELEMETRY
                  </span>
                  <span
                    className={`font-ticket text-[10px] px-2 py-0.5 rounded-xs font-bold uppercase ${
                      activeTemple.queueStatus.crowdLevel === 'Heavy'
                        ? 'bg-[#8B1E3F]/30 text-[#E5A91B] border border-[#8B1E3F]'
                        : 'bg-[#A67C3D]/20 text-[#D4A017] border border-[#A67C3D]/40'
                    }`}
                  >
                    {activeTemple.queueStatus.crowdLevel} CROWD
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-[#201D19] p-2.5 border border-[#A67C3D]/20 rounded-xs">
                    <span className="font-ticket text-[9px] uppercase tracking-wider text-stone-400 block">
                      Sarva Darshan Wait
                    </span>
                    <span className="font-ticket text-base sm:text-lg font-bold text-[#F0E6D2]">
                      {activeTemple.queueStatus.sarvaDarshanWait}
                    </span>
                  </div>
                  <div className="bg-[#201D19] p-2.5 border border-[#A67C3D]/20 rounded-xs">
                    <span className="font-ticket text-[9px] uppercase tracking-wider text-stone-400 block">
                      Sugam (Fast-Track) Spots
                    </span>
                    <span className="font-ticket text-base sm:text-lg font-bold text-[#D4A017]">
                      {activeTemple.queueStatus.specialEntryRemaining} Available
                    </span>
                  </div>
                </div>

                {/* Queue Compartment Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-ticket text-stone-400">
                    <span>Active Queue Compartments</span>
                    <span>
                      {activeTemple.queueStatus.compartmentsFilled} /{' '}
                      {activeTemple.queueStatus.totalCompartments}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#25221D] rounded-xs overflow-hidden flex gap-0.5 p-0.5 border border-[#A67C3D]/30">
                    {Array.from({ length: activeTemple.queueStatus.totalCompartments }).map(
                      (_, idx) => {
                        const isFilled = idx < activeTemple.queueStatus.compartmentsFilled;
                        return (
                          <div
                            key={idx}
                            className={`flex-1 rounded-2xs ${
                              isFilled ? 'bg-[#8B1E3F]' : 'bg-[#3A352D]'
                            }`}
                          />
                        );
                      }
                    )}
                  </div>
                </div>
              </div>

              {/* AUTHENTIC TEMPLE RESERVATION TICKET SLIP (Punched Ticket Aesthetic) */}
              <div className="temple-ticket-stamp rounded-sm p-4 text-[#1C1A17] relative">
                {/* Perforation punched-holes on top & bottom */}
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-[#A67C3D]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-ticket text-[10px] font-bold tracking-widest text-[#8B1E3F]">
                      PASS #DS-{activeTemple.epigraphCode}
                    </span>
                  </div>
                  <span className="font-ticket text-[9px] bg-[#1C1A17] text-[#F0E6D2] px-2 py-0.5 font-bold uppercase rounded-xs">
                    OFFICIAL TOKEN
                  </span>
                </div>

                <div className="py-3 space-y-1">
                  <span className="font-ticket text-[10px] uppercase text-stone-600 block">
                    Sanctum Clearance
                  </span>
                  <p className="font-inscriptional text-base font-bold text-[#1C1A17]">
                    VIP Sugam Darshan & Sankalp Slot
                  </p>
                  <p className="font-ticket text-xs text-stone-700">
                    Valid for: Today's {activeTemple.nextAarti.name} Entry
                  </p>
                </div>

                <div className="pt-2 border-t border-dashed border-[#A67C3D] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <div className="text-left">
                    <span className="font-ticket text-[9px] uppercase text-stone-500 block">
                      Dakshina / Seva
                    </span>
                    <span className="font-ticket text-base font-bold text-[#8B1E3F]">
                      ₹ 300 / Seeker
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      onReserveSlot ? onReserveSlot(activeTemple.id) : alert(`Reserving pass for ${activeTemple.name}`)
                    }
                    className="px-4 py-2 bg-[#8B1E3F] hover:bg-[#A12344] text-[#F0E6D2] font-inscriptional text-xs font-bold uppercase tracking-wider rounded-xs shadow-md active:scale-95 transition-all border border-[#5E1229]"
                  >
                    Reserve Sanctum Pass
                  </button>
                </div>
              </div>

              {/* QUICK ACCESS ACTIONS (Vedic Archana & Virtual Darshan) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    onBookPooja ? onBookPooja(activeTemple.id) : alert(`Offering Archana for ${activeTemple.name}`)
                  }
                  className="px-3 py-2 bg-[#221F1B] hover:bg-[#2C2722] border border-[#A67C3D]/50 text-[#F0E6D2] font-inscriptional text-xs font-semibold rounded-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>🕉️</span>
                  <span>Offer Archana</span>
                </button>

                <button
                  onClick={() =>
                    onExploreVirtualDarshan
                      ? onExploreVirtualDarshan(activeTemple.id)
                      : alert(`Launching live broadcast for ${activeTemple.name}`)
                  }
                  className="px-3 py-2 bg-[#221F1B] hover:bg-[#2C2722] border border-[#A67C3D]/50 text-[#F0E6D2] font-inscriptional text-xs font-semibold rounded-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>🛕</span>
                  <span>Live Stream</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
