import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I18nContent, Temple, Pooja, Yatra, Book, Sloka, Language } from '../types';
import { useModal } from '../contexts/ModalContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { SLOKA_DATA } from '../constants';
import { useHomePageData } from '../hooks/useHomePageData';
import { Icon } from './Icon';
import { useTheme } from '../contexts/ThemeContext';
import { getDailySloka } from '../services/aiService';

// Import sub components
import { SlokaOfTheDay } from './SlokaOfTheDay';
import { PanchangWidget } from './PanchangWidget';
import { TempleCard } from './TempleCard';
import { PoojaCard } from './PoojaCard';
import { YatraCard } from './YatraCard';
import { LiveDarshanCard } from './LiveDarshanCard';
import { VRDarshan } from './VRDarshan';
import { DonationCard } from './DonationCard';
import { GopuramNavigation, TempleSection } from './temple-ui/GopuramNavigation';
import { TempleNoticeboardHero } from './temple-ui/TempleNoticeboardHero';

export interface HomeProps {
    t: I18nContent;
    language: Language;
    onDarshanClick: (temple: Temple) => void;
    yatraPlan: Temple[];
    isInYatraPlan: (templeId: number) => boolean;
    onToggleYatraPlan: (temple: Temple) => void;
}

const DEITY_SYMBOLS: Record<string, { char: string; color: string; label: string }> = {
  Shiva: { char: '🔱', color: '#0284c7', label: 'Mahadev' },
  Krishna: { char: '🪈', color: '#1d4ed8', label: 'Sri Krishna' },
  Ram: { char: '🏹', color: '#ea580c', label: 'Maryada Purushottam' },
  Vishnu: { char: '🐚', color: '#ca8a04', label: 'Narayana' },
  Hanuman: { char: '🌅', color: '#c2410c', label: 'Bajrangbali' },
  Lakshmi: { char: '🪷', color: '#db2777', label: 'Maa Lakshmi' },
  Durga: { char: '🌺', color: '#dc2626', label: 'Adi Shakti' },
  Saraswati: { char: '🎵', color: '#4f46e5', label: 'Maa Saraswati' },
  Ganesh: { char: '🐘', color: '#d97706', label: 'Vighnaharta' },
  Murugan: { char: '🌟', color: '#be185d', label: 'Kartikeya' },
  Ayyappa: { char: '🌿', color: '#15803d', label: 'Hariharasuta' },
};

const DEITY_PRODUCTS: Record<string, { name: string; price: number; image: string; category: string }[]> = {
  Shiva: [
    { name: "Panchamukhi Rudraksha Mala (108+1 Beads)", price: 450, image: "https://images.unsplash.com/photo-1609137144814-722a874744d0?q=80&w=800", category: "Sacred Beads" },
    { name: "Pure Copper Abhishek Lota & Plate", price: 850, image: "https://images.unsplash.com/photo-1590736969955-71cb94801758?q=80&w=800", category: "Brassware" },
    { name: "Organic Vetiver & Vibhuti Incense", price: 180, image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800", category: "Incense" }
  ],
  Krishna: [
    { name: "Handcrafted Brass Krishna Flute", price: 350, image: "https://images.unsplash.com/photo-1588047746535-64d41285098d?q=80&w=800", category: "Sacred Instruments" },
    { name: "Premium Vrindavan Mayur Feathers", price: 120, image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=800", category: "Sacred Decor" },
    { name: "Pure Cow Ghee Diya Wicks (Pack of 100)", price: 290, image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=800", category: "Pooja Essentials" }
  ],
  Ram: [
    { name: "Brass Rama Darbar Temple Frame", price: 1200, image: "https://images.unsplash.com/photo-1590736969955-71cb94801758?q=80&w=800", category: "Brassware" },
    { name: "Tulsi Kanthi Mala (Double Strand)", price: 250, image: "https://images.unsplash.com/photo-1609137144814-722a874744d0?q=80&w=800", category: "Beads" },
    { name: "Premium Saffron Sandalwood Paste", price: 190, image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800", category: "Incense" }
  ],
};

const DEFAULT_PRODUCTS = [
  { name: "Handcrafted Copper Panchapatra Set", price: 650, image: "https://images.unsplash.com/photo-1590736969955-71cb94801758?q=80&w=800", category: "Copperware" },
  { name: "Organic Loban & Camphor Dhoop Cups", price: 220, image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800", category: "Incense" },
  { name: "Premium Brass Diya for Daily Sadhana", price: 380, image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=800", category: "Brassware" }
];

export const Home = ({ t, language, onDarshanClick, yatraPlan, isInYatraPlan, onToggleYatraPlan }: HomeProps) => {
  const { openModal } = useModal();
  const { currentUser } = useAuth();
  const { ishtaDevata, calculatedTimeOfDay, festivalMode } = useTheme();
  const { data, isLoading } = useHomePageData(language);

  const [dailySloka, setDailySloka] = useState<Sloka | null>(SLOKA_DATA[language][0]);

  // Fetch daily sloka
  useEffect(() => {
    let isCancelled = false;
    getDailySloka(language).then(data => {
      if (!isCancelled) {
        setDailySloka({
          text: data.sloka_devanagari,
          translation: data.sloka_transliteration,
          meaning: data.meaning,
        });
      }
    }).catch(err => {
      console.error("Failed to fetch daily sloka, using fallback.", err);
    });
    return () => { isCancelled = true; };
  }, [language]);

  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours >= 4 && hours < 11) return { sanskrit: "शुभप्रभातम्", english: "A blessed morning to you" };
    if (hours >= 11 && hours < 16) return { sanskrit: "शुभदिवसः", english: "Wishing you a peaceful day" };
    if (hours >= 16 && hours < 19) return { sanskrit: "शुभसन्ध्या", english: "A peaceful evening to you" };
    return { sanskrit: "शुभरात्रिः", english: "May your night be peaceful" };
  }, [calculatedTimeOfDay]);

  const activeDeity = useMemo(() => {
    return DEITY_SYMBOLS[ishtaDevata] || DEITY_SYMBOLS['Shiva'];
  }, [ishtaDevata]);

  const recommendedProducts = useMemo(() => {
    return DEITY_PRODUCTS[ishtaDevata] || DEFAULT_PRODUCTS;
  }, [ishtaDevata]);

  const handleLoginOrAction = (action: () => void) => {
    if (!currentUser) {
      openModal('login');
    } else {
      action();
    }
  };

  const [activeSection, setActiveSection] = useState<TempleSection>('darshan');

  const handleSelectSection = (sec: TempleSection) => {
    setActiveSection(sec);
    switch (sec) {
      case 'darshan':
        navigateTo('temples');
        break;
      case 'pooja':
        navigateTo('onlinePoojas');
        break;
      case 'yatra':
        navigateTo('yatraPlanner');
        break;
      case 'pandit':
        navigateTo('pandits');
        break;
    }
  };

  const handleHeroReserveSlot = (templeId: string) => {
    const matched = data?.temples?.find((t: Temple) => 
      t.name.toLowerCase().includes(templeId.toLowerCase()) || 
      t.location.toLowerCase().includes(templeId.toLowerCase())
    ) || data?.temples?.[0];
    if (matched) {
      onDarshanClick(matched);
    } else {
      openModal('darshanBooking');
    }
  };

  const handleHeroBookPooja = (templeId: string) => {
    const matchedPooja = data?.poojas?.[0];
    if (matchedPooja) {
      openModal('poojaBooking', { pooja: matchedPooja });
    } else {
      openModal('poojaBooking');
    }
  };

  const handleHeroVirtualDarshan = (templeId: string) => {
    const matched = data?.temples?.find((t: Temple) => 
      t.name.toLowerCase().includes(templeId.toLowerCase())
    ) || data?.temples?.[0];
    if (matched) {
      openModal('liveDarshan', { temple: matched });
    } else {
      openModal('liveDarshan');
    }
  };

  return (
    <div className="space-y-20 pb-24 bg-paper/20">
      {/* ────────────────────────────────────────────────────────
          AUTHENTIC STEPPED GOPURAM NAVIGATION & MUHURAT TICKER
          ──────────────────────────────────────────────────────── */}
      <GopuramNavigation
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        onOpenConsult={() => openModal('aiGuruChat')}
        onOpenDarshanBooking={() => openModal('darshanBooking')}
      />

      {/* ────────────────────────────────────────────────────────
          AUTHENTIC TEMPLE NOTICEBOARD & LIVE AARTI COUNTDOWN HERO
          ──────────────────────────────────────────────────────── */}
      <TempleNoticeboardHero
        onReserveSlot={handleHeroReserveSlot}
        onBookPooja={handleHeroBookPooja}
        onExploreVirtualDarshan={handleHeroVirtualDarshan}
      />

      {/* ────────────────────────────────────────────────────────
          SECTION 2: THREE SACRED GATEWAYS (discovered arches)
          ──────────────────────────────────────────────────────── */}
      <section className="container mx-auto max-w-6xl px-4 md:px-8">
        <div className="text-center space-y-4 mb-20">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest font-mono">Sacred Portals</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-copper">Three Gateways to Dharma</h2>
          <p className="text-stone-500 max-w-lg mx-auto font-light italic">Walk through the carved portals of scripture study, seva rituals, and natural living.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Portal 1: Gurukul (Teak scroll arch) */}
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            onClick={() => navigateTo('knowledge')}
            className="sacred-gate cursor-pointer p-8 flex flex-col justify-between min-h-[420px] group border-2 border-[#C3A150]/20 rounded-t-[100px] rounded-b-[20px]"
            style={{
              background: 'linear-gradient(180deg, #FDFBF7 0%, #F5EDE4 100%)',
              boxShadow: '0 10px 40px -15px rgba(184,115,51,0.06)'
            }}
          >
            <div className="space-y-6 text-center">
              <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20 mx-auto group-hover:scale-105 transition-all">
                <Icon name="book-open" className="w-6 h-6 text-amber-600" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-serif font-bold text-copper">Dharma Gurukul</h3>
                <p className="text-stone-500 text-sm leading-relaxed font-light">
                  Unroll ancient palm-leaf manuscripts containing translations of the Vedas, Upanishads, and the Bhagavad Gita.
                </p>
              </div>
            </div>
            
            <div className="border-t border-[#C3A150]/15 pt-6 flex justify-between items-center text-xs font-bold text-amber-600">
              <span className="text-[10px] font-mono text-stone-400">Vedas • Gita</span>
              <span className="group-hover:translate-x-2 transition-transform font-serif uppercase tracking-widest">Read Sastras →</span>
            </div>
          </motion.div>

          {/* Portal 2: ParokshaSeva (Temple gate arch) */}
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            onClick={() => navigateTo('temples')}
            className="sacred-gate cursor-pointer p-8 flex flex-col justify-between min-h-[420px] group border-2 border-[#C3A150]/20 rounded-t-[100px] rounded-b-[20px]"
            style={{
              background: 'linear-gradient(180deg, #FAF7F0 0%, #EFEBE0 100%)',
              boxShadow: '0 10px 40px -15px rgba(195,161,80,0.08)'
            }}
          >
            <div className="space-y-6 text-center">
              <div className="w-14 h-14 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/20 mx-auto group-hover:scale-105 transition-all">
                <Icon name="temple" className="w-6 h-6 text-orange-600" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-serif font-bold text-copper">Paroksha Seva</h3>
                <p className="text-stone-500 text-sm leading-relaxed font-light">
                  Approach the inner temple sanctums. Book remote Vedic poojas, offer heritage seva, and seek Live Darshans.
                </p>
              </div>
            </div>

            <div className="border-t border-[#C3A150]/15 pt-6 flex justify-between items-center text-xs font-bold text-orange-600">
              <span className="text-[10px] font-mono text-stone-400">Pooja • Darshan</span>
              <span className="group-hover:translate-x-2 transition-transform font-serif uppercase tracking-widest">Offer Seva →</span>
            </div>
          </motion.div>

          {/* Portal 3: Dharma Mart (Artisan wood arch) */}
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            onClick={() => navigateTo('mart')}
            className="sacred-gate cursor-pointer p-8 flex flex-col justify-between min-h-[420px] group border-2 border-[#C3A150]/20 rounded-t-[100px] rounded-b-[20px]"
            style={{
              background: 'linear-gradient(180deg, #FAF8F2 0%, #ECE3DA 100%)',
              boxShadow: '0 10px 40px -15px rgba(139,90,43,0.06)'
            }}
          >
            <div className="space-y-6 text-center">
              <div className="w-14 h-14 bg-stone-700/10 rounded-full flex items-center justify-center border border-stone-700/20 mx-auto group-hover:scale-105 transition-all">
                <Icon name="shopping-bag" className="w-6 h-6 text-stone-700" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-serif font-bold text-stone-800">Dharma Mart</h3>
                <p className="text-stone-500 text-sm leading-relaxed font-light">
                  Acquire sacred brass idols, organic herbal dhoop, copper vessels, and fabrics woven by village artisans.
                </p>
              </div>
            </div>

            <div className="border-t border-[#C3A150]/15 pt-6 flex justify-between items-center text-xs font-bold text-stone-700">
              <span className="text-[10px] font-mono text-stone-400">Pure • Handmade</span>
              <span className="group-hover:translate-x-2 transition-transform font-serif uppercase tracking-widest">Enter Bazaar →</span>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          SECTION 3: CONTINUE READING (Sadhana bookshelf)
          ──────────────────────────────────────────────────────── */}
      <section className="container mx-auto max-w-6xl px-4 md:px-8">
        <div className="bg-[#FAF6EE] border-2 border-[#C3A150]/20 rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          {/* Tactile background leaf pattern */}
          <div className="absolute top-1/2 left-10 -translate-y-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-mono font-bold uppercase tracking-widest rounded-full">Scripture Study</span>
              <span className="text-stone-400 text-xs font-mono">Resume your reading</span>
            </div>
            <h3 className="text-3xl font-serif font-bold text-ink">Continue Reading Scriptures</h3>
            <p className="text-stone-500 text-sm max-w-xl font-light italic">
              "Yada yada hi dharmasya..." Chapter 2 of the Bhagavad Gita was last opened. Continue your path of spiritual knowledge.
            </p>
            <div className="w-full max-w-sm h-1.5 bg-stone-200 rounded-full overflow-hidden mt-4">
              <div className="h-full bg-amber-500" style={{ width: '42%' }} />
            </div>
          </div>
          <button 
            onClick={() => navigateTo('knowledge')}
            className="flex-shrink-0 px-8 py-3.5 bg-white text-stone-700 hover:text-primary border border-stone-200/80 hover:border-primary/40 font-bold rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2 z-10 font-serif"
          >
            <Icon name="book-open" className="w-4 h-4" />
            <span>Resume Journey</span>
          </button>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          SECTION 4: TODAY'S FESTIVAL & PANCHANG
          ──────────────────────────────────────────────────────── */}
      <section className="container mx-auto max-w-6xl px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          
          {/* Panchang Timings */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div className="space-y-4 mb-6">
              <h2 className="text-3xl font-serif font-bold text-copper">Daily Panchang & Auspicious Timings</h2>
              <p className="text-stone-500 text-sm font-light">Align your daily rituals and meditation with the Vedic calendar.</p>
            </div>
            <PanchangWidget />
          </div>

          {/* Festival Inscription Slab */}
          <div className="lg:col-span-5">
            <div className="bg-[#FAF0E6] border-2 border-[#C3A150]/20 rounded-[2.5rem] p-8 h-full flex flex-col justify-between shadow-sm relative overflow-hidden group">
              <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-mono font-bold uppercase tracking-widest rounded-full">Festival Inscription</span>
                  <span className="text-stone-500 text-xs font-mono">Tithi Vrata</span>
                </div>
                <h3 className="text-3xl font-serif font-bold text-ink">
                  {festivalMode !== 'None' ? festivalMode : 'Ekadashi Vrata'}
                </h3>
                <p className="text-stone-600 text-sm leading-relaxed font-light italic">
                  {festivalMode === 'Diwali' && 'A day of lighting lamps, celebration, and worshiping Goddess Lakshmi for prosperity and internal illumination.'}
                  {festivalMode === 'Mahashivaratri' && 'A sacred night of deep meditation, fasting, and chanting Om Namah Shivaya dedicated to Lord Shiva.'}
                  {festivalMode === 'None' && 'A day dedicated to fasting, reading scriptures, and purification of the mind. Observing the vrata brings peacefulness.'}
                </p>
                <div className="p-4 bg-white/40 rounded-2xl border border-[#C3A150]/20">
                  <h4 className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Sadhana Tip for Today</h4>
                  <p className="text-stone-500 text-xs font-serif">Chant the Vishnu Sahasranama or meditate on your heart center for 15 minutes before sunset.</p>
                </div>
              </div>

              <div className="pt-8 relative z-10">
                <button 
                  onClick={() => openModal('panchang')}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-700 text-white font-serif font-bold rounded-xl shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform border border-[#C3A150]/20"
                >
                  <Icon name="calendar" className="w-5 h-5" />
                  <span>View Festival Calendar</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          SECTION 5: FEATURED TEMPLES
          ──────────────────────────────────────────────────────── */}
      <section id="featured-temples" className="container mx-auto max-w-6xl px-4 md:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Icon name="temple" className="w-5 h-5" />
              <span className="text-xs uppercase tracking-widest font-bold font-mono">Sacred Abodes</span>
            </div>
            <h2 className="text-4xl font-serif font-bold text-ink">{t.featuredTemples}</h2>
          </div>
          <button onClick={() => navigateTo('temples')} className="text-sm font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest flex items-center gap-1 font-serif">
            <span>Explore All Temples</span>
            <Icon name="chevron-right" className="w-4 h-4" />
          </button>
        </div>

        <div className="flex overflow-x-auto space-x-6 pb-6 -mx-4 px-4 hide-scrollbar">
          {isLoading.temples ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="w-80 h-96 bg-white rounded-2xl shadow animate-pulse flex-shrink-0" />
            ))
          ) : (
            data.temples.slice(0, 5).map(temple => (
              <div key={temple.id} className="w-80 flex-shrink-0">
                <TempleCard
                  temple={temple}
                  t={t}
                  onSelectTemple={() => navigateTo(`templeDetail/${temple.id}`)}
                  onBookDarshan={() => onDarshanClick(temple)}
                  onVirtualDarshan={() => openModal('vrDarshan')}
                  onViewImage={() => openModal('imageDetail', { imageUrl: temple.imageUrl, altText: temple.name })}
                  onAskGuru={() => openModal('aiGuruChat', { temple })}
                  isInYatraPlan={isInYatraPlan(temple.id)}
                  onToggleYatraPlan={onToggleYatraPlan}
                />
              </div>
            ))
          )}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          SECTION 6: UPCOMING POOJAS
          ──────────────────────────────────────────────────────── */}
      <section className="container mx-auto max-w-6xl px-4 md:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Icon name="bell" className="w-5 h-5" />
              <span className="text-xs uppercase tracking-widest font-bold font-mono">Sacred Offerings</span>
            </div>
            <h2 className="text-4xl font-serif font-bold text-ink">Remote Pooja Services</h2>
          </div>
          <button onClick={() => navigateTo('poojas')} className="text-sm font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest flex items-center gap-1 font-serif">
            <span>All Pooja Services</span>
            <Icon name="chevron-right" className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading.poojas ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-72 bg-white rounded-2xl shadow animate-pulse" />
            ))
          ) : (
            data.poojas.slice(0, 4).map(pooja => (
              <PoojaCard
                key={pooja.id}
                pooja={pooja}
                t={t}
                onBook={(p) => handleLoginOrAction(() => openModal('poojaBooking', { pooja: p }))}
                onViewImage={() => openModal('imageDetail', { imageUrl: pooja.imageUrl, altText: pooja.name })}
                onAskGuru={(p) => openModal('aiGuruChat', { pooja: p })}
              />
            ))
          )}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          SECTION 7: RECOMMENDED PRODUCTS
          ──────────────────────────────────────────────────────── */}
      <section className="container mx-auto max-w-6xl px-4 md:px-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl font-serif font-bold text-copper">Personalized Spiritual Essentials</h2>
          <p className="text-stone-500 text-sm">Recommended items for your daily worship, based on your selected deity: <span className="font-semibold text-primary">{ishtaDevata}</span></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {recommendedProducts.map((prod, idx) => (
            <div key={idx} className="bg-white border-2 border-stone-200/60 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full group">
              <div className="relative h-48 bg-stone-100 overflow-hidden border-b border-stone-200/50">
                <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-[#8B5A2B] border border-stone-200">{prod.category}</span>
              </div>
              <div className="p-6 space-y-4 flex-grow flex flex-col justify-between bg-[#FAF6EE]/40">
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-800 line-clamp-1">{prod.name}</h3>
                  <p className="text-stone-400 text-xs font-mono mt-1">Handcrafted Traditional Item</p>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-bold text-stone-800 font-mono">₹{prod.price}</span>
                  <button 
                    onClick={() => navigateTo('mart')}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-600 hover:to-orange-700 text-primary hover:text-white font-serif font-bold text-xs rounded-full border border-primary/25 hover:border-transparent transition-all duration-300"
                  >
                    View in Mart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          SECTION 8: COMMUNITY SEVA & HERITAGE
          ──────────────────────────────────────────────────────── */}
      <section className="container mx-auto max-w-6xl px-4 md:px-8">
        <div className="bg-[#FAF6EE] border-2 border-[#C3A150]/20 rounded-[2.5rem] overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12">
          
          <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Icon name="heart-hand" className="w-5 h-5 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest font-mono">Dharma Uddhar</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-ink">Community Seva & Restoration</h2>
              <p className="text-stone-600 text-sm leading-relaxed max-w-xl font-light font-serif italic">
                We believe in preserving the physical structures of our cultural heritage. Support active efforts to restore forgotten temples, feed cows in Goshalas, and provide meals at Annadanam counters.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-stone-200/60">
              <div className="space-y-1">
                <h4 className="text-2xl font-bold font-mono text-copper">₹45.6L</h4>
                <p className="text-[10px] text-stone-500 uppercase font-semibold">Total Seva Done</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-2xl font-bold font-mono text-copper">1.2L+</h4>
                <p className="text-[10px] text-stone-500 uppercase font-semibold">Meals Served</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-2xl font-bold font-mono text-copper">34</h4>
                <p className="text-[10px] text-stone-500 uppercase font-semibold">Shrines Restored</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-2xl font-bold font-mono text-copper">890+</h4>
                <p className="text-[10px] text-stone-500 uppercase font-semibold">Cows Supported</p>
              </div>
            </div>

            <div className="pt-6">
              <button 
                onClick={() => handleLoginOrAction(() => openModal('donation'))} 
                className="px-8 py-3.5 bg-[#1B1812] text-[#F0DFC0] hover:bg-stone-800 font-serif font-bold rounded-xl shadow-md hover:scale-[1.02] transition-transform border border-[#C3A150]/20"
              >
                Offer Seva Contribution
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-stone-900 to-stone-950 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/az-subtle.png')] opacity-10" />
            
            <div className="space-y-4 relative z-10">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#C3A150] font-mono">Restoration Spotlight</span>
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-white">Devuni Gutti Temple</h3>
              <p className="text-stone-300 text-xs leading-relaxed font-light font-serif italic">
                An ancient 12th-century Kakatiya dynasty rock temple located in Telangana, partially in ruins. Our community is currently funding the documentation and reconstruction of its sacred garbhagriha.
              </p>
              <div className="flex gap-2 p-1.5 bg-white/5 rounded-lg border border-white/10 w-fit">
                <img src="https://images.unsplash.com/photo-1587895259837-2637b51e133e?q=80&w=300" className="w-16 h-16 object-cover rounded opacity-80" alt="Before" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Somnath_Temple_At_Sunset_2.jpg/300px-Somnath_Temple_At_Sunset_2.jpg" className="w-16 h-16 object-cover rounded opacity-80" alt="Target" />
              </div>
            </div>

            <div className="pt-6 relative z-10">
              <button 
                onClick={() => navigateTo('restorationSanctuary')} 
                className="text-xs font-bold text-[#C3A150] hover:text-white uppercase tracking-widest flex items-center gap-1 font-serif"
              >
                <span>Read Restoration Files</span>
                <Icon name="chevron-right" className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          SECTION 9: COMING SOON ROADMAP
          ──────────────────────────────────────────────────────── */}
      <section className="container mx-auto max-w-6xl px-4 md:px-8">
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-bold text-primary uppercase tracking-widest font-mono">Future Vision</span>
          <h2 className="text-4xl font-serif font-bold text-ink">Dharmasethu Vision Roadmap</h2>
          <p className="text-stone-500 text-sm max-w-lg mx-auto font-light font-serif italic">We are continuously building new bridges to make Sanatana Dharma accessible to all.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          <div className="bg-white/50 border-2 border-stone-200/80 rounded-2xl p-8 space-y-4 relative shadow-sm">
            <span className="text-xs font-mono font-bold text-primary bg-primary/5 px-2.5 py-0.5 rounded-full">Phase 1 (Q3 2026)</span>
            <h4 className="text-xl font-serif font-bold text-stone-800">3D VR Darshan & Audiobooks</h4>
            <p className="text-stone-500 text-xs leading-relaxed font-light font-serif">
              Virtual Reality integration for 360-degree interactive temple sanctuary walks, alongside dramatized scripture audiobooks.
            </p>
          </div>

          <div className="bg-white/50 border-2 border-stone-200/80 rounded-2xl p-8 space-y-4 relative shadow-sm">
            <span className="text-xs font-mono font-bold text-primary bg-primary/5 px-2.5 py-0.5 rounded-full">Phase 2 (Q4 2026)</span>
            <h4 className="text-xl font-serif font-bold text-stone-800">Bal-Vihar Pronunciation Coach</h4>
            <p className="text-stone-500 text-xs leading-relaxed font-light font-serif">
              An AI-powered pronunciation analyzer designed for children, helping them learn Sanskrit Slokas and Vedic grammar.
            </p>
          </div>

          <div className="bg-white/50 border-2 border-stone-200/80 rounded-2xl p-8 space-y-4 relative shadow-sm">
            <span className="text-xs font-mono font-bold text-primary bg-primary/5 px-2.5 py-0.5 rounded-full">Phase 3 (Q1 2027)</span>
            <h4 className="text-xl font-serif font-bold text-stone-800">Satvik-Trace Blockchain Verification</h4>
            <p className="text-stone-500 text-xs leading-relaxed font-light font-serif">
              Supply-chain tracing on the blockchain to verify the organic purity of Prasad items, puja oils, and sacred threads.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};
export default Home;
