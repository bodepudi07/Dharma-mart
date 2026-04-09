import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { I18nContent, Book, Language } from '../types';
import * as api from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import { Icon } from './Icon';
import { SLOKA_DATA } from '../constants';

// ─── 50+ VEDIC CATEGORIES DATA ──────────────────────────────────────────────

interface CategoryItem {
  tag: string; // Used for mapping DB books
  title: string;
  subtitle: string;
  count: number | 'coming_soon';
}

interface SectionData {
  id: string;
  title: string;
  titleDev: string;
  categories: CategoryItem[];
}

const BOOKS_SECTIONS: SectionData[] = [
  {
    id: 'shastra',
    title: 'Śāstra',
    titleDev: 'शास्त्र',
    categories: [
      { tag: 'gita', title: 'Gītā', subtitle: 'Bhagavad-gītā • Aṣṭāvakra Gītā • Jñāneśvarī...', count: 41 },
      { tag: 'ramayana', title: 'Rāmāyaṇa', subtitle: 'Valmiki Ramayana • Tulasi Ramayana...', count: 17 },
      { tag: 'mahabharata', title: 'Mahābhārata', subtitle: 'The biggest epic ever written • Harivamsa...', count: 7 },
      { tag: 'purana', title: 'Purāṇa', subtitle: 'Srimad Bhagavatam • Shiv Puran • Agni Puran...', count: 18 },
      { tag: 'upapurana', title: 'Upa–Purāṇa', subtitle: 'Ganesh Puran • Narsimha Puran • Kalki Puran...', count: 14 },
      { tag: 'veda', title: 'Veda', subtitle: 'Rigveda • Yajurveda • Samaveda • Atharva Veda', count: 4 },
      { tag: 'upanishad', title: 'Upaniṣad', subtitle: 'Brihadaranyaka • Taitariya • Mandukya...', count: 112 },
      { tag: 'smriti', title: 'Smṛti', subtitle: 'Manusmriti • Yagyavalkya Smriti...', count: 21 },
      { tag: 'upasmriti', title: 'Upa–Smṛti', subtitle: 'Bharadvajah Smriti • Prajapati Smriti...', count: 5 },
      { tag: 'tantra', title: 'Tantra Śāstra', subtitle: 'Rudra Yamala • Kularnava Tantra...', count: 43 },
      { tag: 'samhita', title: 'Saṁhitā', subtitle: 'Dhanurved Samhita • Charaka Samhita...', count: 13 },
      { tag: 'darsana', title: 'Darśana', subtitle: 'Nyaya • Vaisheshika • Samkhya • Yoga...', count: 8 },
      { tag: 'niti', title: 'Nīti', subtitle: 'Chanakya Niti • Vidura Niti • Sukra Niti...', count: 5 },
      { tag: 'sutra', title: 'Sūtra', subtitle: 'Brahma Sutra • Vaisesika Sutra...', count: 17 },
      { tag: 'agama', title: 'Āgama', subtitle: 'Shaiva Agamas • Vaishnava Pancharatra...', count: 13 },
      { tag: 'other', title: 'Other Śāstras', subtitle: 'Vaimanika Shastra • Kautilya Arthashastra', count: 2 },
    ],
  },
  {
    id: 'teachers',
    title: 'Spiritual Teachers',
    titleDev: 'आचार्य/गुरु',
    categories: [
      { tag: 'gaudiya', title: 'Gaudiya Vaishnav Acharyas', subtitle: 'Srila Prabhupada • Bhaktivinoda Thakura...', count: 5 },
      { tag: 'advaita', title: 'Advaita Vedanta Acharyas', subtitle: 'Adi Shankaracharya • Ramana Maharshi...', count: 7 },
      { tag: 'sri_vaishnava', title: 'Sri Vaishnava Acharyas', subtitle: 'Ramanujacharya (Sri Bhashya)', count: 1 },
      { tag: 'madhva', title: 'Madhva Acharyas', subtitle: 'Madhvacharya (Brahmasutra Bhashya)', count: 1 },
      { tag: 'rudra', title: 'Rudra Vaishnava Acharyas', subtitle: 'Vallabhacharya (Anubhashya)', count: 1 },
      { tag: 'kumar', title: 'Kumar Vaishnava Acharyas', subtitle: 'Nimbarkacharya (Vedanta Parijata Saurabha)', count: 1 },
    ],
  },
  {
    id: 'vedic',
    title: 'Vedic Studies',
    titleDev: 'अन्य वेदांग',
    categories: [
      { tag: 'ayurveda', title: 'Ayurveda', subtitle: 'Sushruta Samhita • Ashtang Hridayam...', count: 40 },
      { tag: 'astrology', title: 'Astrology', subtitle: 'Brihat Parasara Hora Shastra...', count: 42 },
      { tag: 'yoga_study', title: 'Yoga Texts', subtitle: 'Patanjali Yoga • Hatha Yoga Pradipika...', count: 28 },
      { tag: 'vastu', title: 'Vastu', subtitle: 'Vastu Shastra • Manasara • Mayamatam...', count: 15 },
      { tag: 'history', title: 'History', subtitle: 'Chhatrapati Shivaji • Maharana Pratap...', count: 55 },
      { tag: 'samskara', title: 'Samskaras', subtitle: '16 Sanskar & Other books', count: 'coming_soon' },
      { tag: 'vedic_maths', title: 'Vedic Maths', subtitle: 'Vedic Formulaes • Arithmetic', count: 16 },
    ],
  },
  {
    id: 'devotional',
    title: 'Devotional Collection',
    titleDev: 'पूजन संग्रह',
    categories: [
      { tag: 'aarati', title: 'Aaratisa', subtitle: 'Mangalaarti • Ganesh Arti • Shiv Aarati...', count: 25 },
      { tag: 'ashtaka', title: 'Ashtakas', subtitle: 'Lingashtakam • Vishwanathashtakam...', count: 35 },
      { tag: 'bhajan', title: 'Bhajans', subtitle: 'Vaishnav Geet • Krishna Bhajans...', count: 18 },
      { tag: 'chalisa', title: 'Chalisas', subtitle: 'Hanuman Chalisa • Shiv Chalisa...', count: 25 },
      { tag: 'katha', title: 'Kathaas', subtitle: 'Satyanarayan Katha • Vrat Kathayen...', count: 46 },
      { tag: 'sukta', title: 'Suktas', subtitle: 'Purusha Sukta • Shree Sukta...', count: 32 },
      { tag: 'stotram', title: 'Stotram', subtitle: 'Ram Raksha Stotram • Shiv Tandav Stotram...', count: 19 },
      { tag: 'sahastranaam', title: 'Sahastranaam', subtitle: 'Vishnu Sahastranaam • Shiv Sahastranaam...', count: 9 },
    ],
  },
  {
    id: 'nonvedic',
    title: 'Non-Vedic',
    titleDev: 'अनार्य साहित्य',
    categories: [
      { tag: 'art', title: 'Art', subtitle: 'Art references, visual culture...', count: 'coming_soon' },
      { tag: 'money', title: 'Money', subtitle: 'Financial wisdom from ancient Indian texts...', count: 'coming_soon' },
      { tag: 'psychology', title: 'Psychology', subtitle: 'Psychological insights from Dharmic traditions...', count: 'coming_soon' },
    ],
  },
];

const ANCIENT_INDIA_SECTIONS: SectionData[] = [
  {
    id: 'ancient_india_core',
    title: 'Ancient India',
    titleDev: 'प्राचीन भारत',
    categories: [
      { tag: 'science_tech', title: 'Ancient Science & Tech', subtitle: 'Metallurgy, Architecture, Navigation...', count: 18 },
      { tag: 'society', title: 'Society & Culture', subtitle: 'Education, Governance, Economy...', count: 24 },
      { tag: 'geography', title: 'Sacred Geography', subtitle: 'Tirthas, Rivers, Kingdoms...', count: 12 },
    ],
  }
];

const FACTS_SECTIONS: SectionData[] = [
  {
    id: 'facts_core',
    title: 'Interesting Facts',
    titleDev: 'रोचक तथ्य',
    categories: [
      { tag: 'scientific_facts', title: 'Scientific Facts', subtitle: 'Astronomy, Physics, Mathematics discoveries...', count: 50 },
      { tag: 'historical_facts', title: 'Historical Facts', subtitle: 'Chronology, Kings, Empires, Battles...', count: 45 },
      { tag: 'spiritual_facts', title: 'Spiritual Facts', subtitle: 'Deities, Temples, Rituals, Significance...', count: 108 },
    ],
  }
];

// Helper to map a book's tags to our detailed tags above.
const bookToCategoryTag = (book: Book): string => {
  const tags = book.tags || [];
  // flatten all our valid tags
  const validTags = [...BOOKS_SECTIONS, ...ANCIENT_INDIA_SECTIONS, ...FACTS_SECTIONS].flatMap(s => s.categories.map(c => c.tag));
  for (const t of tags) {
    if (validTags.includes(t)) return t;
    // Map generic 'itihasa' to 'mahabharata' or 'ramayana' based on name roughly, or default to mahabharata
    if (t === 'itihasa') return book.name.toLowerCase().includes('ram') ? 'ramayana' : 'mahabharata';
    if (t === 'guru') return 'gaudiya';
    if (t === 'ancient_science') return 'ayurveda';
    if (t === 'animated_video') return 'art';
  }
  return 'other';
};

// ─── SVG ICONS ─────────────────────────────────────────────────────────────

const BooksSVG = () => (
  <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="6" width="5" height="18" rx="1.5" fill="#C4521A" opacity="0.85" />
    <rect x="11" y="4" width="5" height="20" rx="1.5" fill="#C4521A" opacity="0.65" />
    <rect x="18" y="8" width="5" height="16" rx="1.5" fill="#C4521A" opacity="0.45" />
  </svg>
);

const ChevronDownSVG = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    width="16" height="16" viewBox="0 0 16 16" fill="none"
    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
  >
    <path d="M4 6l4 4 4-4" stroke="#9B7040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── COMPONENT ────────────────────────────────────────────────────────────

export const KnowledgeView = ({ t, language }: { t: I18nContent, language: Language }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'books' | 'ancient_india' | 'facts'>('books');

  const activeSections = useMemo(() => {
    switch (activeTab) {
      case 'ancient_india': return ANCIENT_INDIA_SECTIONS;
      case 'facts': return FACTS_SECTIONS;
      default: return BOOKS_SECTIONS;
    }
  }, [activeTab]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    shastra: true,
    teachers: true,
    vedic: true,
    devotional: true,
    nonvedic: false,
    ancient_india_core: true,
    facts_core: true,
  });

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null);

  useEffect(() => {
    api.getBooks(language).then(setBooks).catch(() => addToast("Failed to load scriptures.", 'error')).finally(() => setIsLoading(false));
  }, [addToast, language]);

  const toggleSection = useCallback((id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleCategory = useCallback((tag: string, hasBooks: boolean) => {
    if (!hasBooks) return;
    setOpenCategories(prev => ({ ...prev, [tag]: !prev[tag] }));
  }, []);

  const categorizedBooks = useMemo(() => {
    const categories: Record<string, Book[]> = {};
    activeSections.forEach(s => s.categories.forEach(c => categories[c.tag] = []));
    categories['other'] = categories['other'] || [];

    const filtered = books.filter(book => {
      return !searchQuery || book.name.toLowerCase().includes(searchQuery.toLowerCase()) || book.description?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    filtered.forEach(book => {
      const tag = bookToCategoryTag(book);
      if (categories[tag]) {
        categories[tag].push(book);
      } else {
        categories['other'].push(book);
      }
    });

    for (const key in categories) {
      categories[key].sort((a, b) => a.name.localeCompare(b.name));
    }
    return categories;
  }, [books, searchQuery, activeSections]);

  const dailySloka = useMemo(() => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const slokaList = SLOKA_DATA[language] || SLOKA_DATA[Language.EN];
    return slokaList[dayOfYear % slokaList.length];
  }, [language]);

  const navigateTo = (path: string) => { window.location.hash = path; };

  const handleExplainSection = async (e: React.MouseEvent, sectionId: string, sectionTitle: string) => {
    e.stopPropagation();
    if (explanations[sectionId]) return;

    setLoadingExplanation(sectionId);
    try {
      const result = await api.explainScripture(`the ${sectionTitle}`);
      setExplanations(prev => ({ ...prev, [sectionId]: result }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get explanation.";
      addToast(message, 'error');
      setExplanations(prev => ({ ...prev, [sectionId]: "Sorry, the Guru could not provide an explanation at this time." }));
    } finally {
      setLoadingExplanation(null);
    }
  };

  return (
    <div className="min-h-full p-4 sm:p-8 animate-fade-in relative overflow-hidden" style={{ background: '#FAF0E6', color: '#2E1A0A', fontFamily: 'Georgia, serif' }}>
      
      {/* Warm Parchment Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[30%] right-[20%] w-[25%] h-[25%] bg-yellow-500/10 rounded-full blur-[100px]"></div>
      </div>

      <header className="text-center mb-10 relative z-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Icon name="cosmic-logo" className="w-8 h-8 text-[#C4521A]" />
          <span className="text-[#9B7040] font-bold tracking-widest text-sm uppercase">The Akashic Records</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#5C3D1E' }}>
          {t.knowledgeHubTitle || 'Dharma Gurukul'}
        </h1>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mt-6">
          <div className="relative shadow-[0_4px_20px_rgba(100,60,20,0.08)] rounded-2xl">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9B7040]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search extensive scriptures by name..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-[#EDD9BE] text-[#2E1A0A] placeholder-[#9B7040]/60 focus:outline-none focus:border-[#C4521A] focus:ring-1 focus:ring-[#C4521A] transition-all font-sans"
            />
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
            <button
               onClick={() => setActiveTab('books')}
               className={`px-5 py-2.5 rounded-xl font-bold font-sans transition-all shadow-sm border ${activeTab === 'books' ? 'bg-[#C4521A] text-white border-[#C4521A] shadow-orange-900/20' : 'bg-white text-[#9B7040] border-[#EDD9BE] hover:bg-[#FFF5EB] hover:text-[#C4521A]'}`}
            >
               Sacred Books & Texts
            </button>
            <button
               onClick={() => setActiveTab('ancient_india')}
               className={`px-5 py-2.5 rounded-xl font-bold font-sans transition-all shadow-sm border ${activeTab === 'ancient_india' ? 'bg-[#C4521A] text-white border-[#C4521A] shadow-orange-900/20' : 'bg-white text-[#9B7040] border-[#EDD9BE] hover:bg-[#FFF5EB] hover:text-[#C4521A]'}`}
            >
               Ancient India
            </button>
            <button
               onClick={() => setActiveTab('facts')}
               className={`px-5 py-2.5 rounded-xl font-bold font-sans transition-all shadow-sm border ${activeTab === 'facts' ? 'bg-[#C4521A] text-white border-[#C4521A] shadow-orange-900/20' : 'bg-white text-[#9B7040] border-[#EDD9BE] hover:bg-[#FFF5EB] hover:text-[#C4521A]'}`}
            >
               Interesting Facts
            </button>
        </div>
      </header>

      {/* Daily Wisdom Altar (Themed Warmly) */}
      <section className="mb-12 relative z-10 max-w-4xl mx-auto px-2">
        <div className="p-1 bg-gradient-to-r from-[#D49A36] via-[#C4521A] to-[#8B4000] rounded-[2.5rem] shadow-xl">
          <div className="bg-[#FFF5EB] p-8 md:p-10 rounded-[2.4rem] relative overflow-hidden text-center group">
             <Icon name="om" className="absolute -top-10 -right-10 w-48 h-48 text-[#D49A36]/10 -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
             <div className="flex flex-col items-center space-y-5 relative z-10">
                <div className="w-14 h-14 rounded-full bg-[#FAF0E6] flex items-center justify-center border border-[#EDD9BE] shadow-sm">
                    <Icon name="lotus" className="w-7 h-7 text-[#C4521A] animate-pulse" />
                </div>
                <h2 className="text-[#C4521A] font-bold tracking-widest uppercase text-xs">{t.dailyWisdom || 'Daily Wisdom'}</h2>
                <p className="text-2xl md:text-3xl font-serif italic text-[#3E2511] leading-relaxed max-w-2xl">
                    "{dailySloka.meaning}"
                </p>
                <div className="flex items-center gap-4 pt-2">
                    <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#C4521A]/40"></div>
                    <span className="text-xs text-[#9B7040] font-bold tracking-tighter uppercase">— Sacred Verses —</span>
                    <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#C4521A]/40"></div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Main Knowledge List */}
      <main className="max-w-4xl mx-auto relative z-10 space-y-6 pb-20">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Icon name="lotus" className="w-12 h-12 text-[#C4521A] animate-spin" />
            <p className="text-[#9B7040] font-serif italic">Unrolling the celestial scrolls...</p>
          </div>
        ) : (
          activeSections.map(section => (
            <div key={section.id} className="bg-white shadow-[0_4px_20px_rgba(100,60,20,0.06)] rounded-3xl overflow-hidden border border-[#EDD9BE]">
              
              {/* Section Header */}
              <button
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '20px 24px', width: '100%',
                  background: 'linear-gradient(to right, #FFF5EB, #FFFFFF)',
                }}
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-[#5C3D1E] uppercase tracking-wide">{section.title}</span>
                  <span className="text-[#9B7040] text-sm">({section.titleDev})</span>
                </div>
                <ChevronDownSVG isOpen={!!openSections[section.id]} />
              </button>

              {/* AI Scholarly Overview Box for Section */}
              {openSections[section.id] && (
                <div className="px-6 py-3 bg-[#FCF8F2] border-b border-[#EDD9BE] flex flex-col items-start gap-4">
                  <button
                      onClick={(e) => handleExplainSection(e, section.id, section.title)}
                      disabled={loadingExplanation === section.id}
                      className="px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 text-[#C4521A] font-bold text-xs flex items-center justify-center gap-2 hover:bg-orange-100 transition-all font-sans disabled:opacity-50"
                  >
                      {loadingExplanation === section.id ? <Icon name="lotus" className="w-4 h-4 animate-spin" /> : <Icon name="cosmic-logo" className="w-4 h-4" />}
                      Get AI Overview for {section.title}
                  </button>
                  {explanations[section.id] && (
                      <div className="p-4 rounded-xl bg-white border border-[#EDD9BE] text-sm text-[#4A3219] italic shadow-inner">
                          {explanations[section.id]}
                      </div>
                  )}
                </div>
              )}

              {/* Categories Rows */}
              <div style={{
                maxHeight: openSections[section.id] ? 10000 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.4s ease',
              }}>
                {section.categories.map((cat, idx) => {
                  const booksInCat = categorizedBooks[cat.tag] || [];
                  const dbCount = booksInCat.length;
                  const displayCount = dbCount > 0 ? dbCount : cat.count;
                  const hasRealBooks = dbCount > 0;
                  const isCatOpen = !!openCategories[cat.tag];

                  return (
                    <div key={cat.tag} className={`border-b border-[#EDD9BE] last:border-b-0 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[#FAF0E6]/30'}`}>
                      <div 
                        className={`flex items-center p-4 px-6 gap-4 cursor-pointer transition-colors ${hasRealBooks ? 'hover:bg-[#F5E4CC]' : 'opacity-80'}`}
                        onClick={() => toggleCategory(cat.tag, hasRealBooks)}
                      >
                        <BooksSVG />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#2E1A0A] text-base m-0 tracking-tight">{cat.title}</p>
                          <p className="text-[#8B6040] text-xs m-0 truncate mt-0.5">{cat.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {displayCount === 'coming_soon' && !hasRealBooks ? (
                            <span className="text-xs italic text-[#B0907A] whitespace-nowrap">Coming Soon</span>
                          ) : (
                            <span className={`font-bold text-sm ${hasRealBooks ? 'text-[#C4521A]' : 'text-[#A08060]'}`}>{displayCount} texts</span>
                          )}
                          {hasRealBooks && <ChevronDownSVG isOpen={isCatOpen} />}
                        </div>
                      </div>

                      {/* Display Fetched Books if Expanded */}
                      {hasRealBooks && isCatOpen && (
                        <div className="bg-[#1C1208]/5 p-4 pl-16 space-y-2 border-t border-[#EDD9BE]/50 shadow-inner">
                          {booksInCat.map(book => (
                             <button
                               key={book.id}
                               onClick={(e) => { e.stopPropagation(); book.contentKey ? navigateTo(`/bookReader/${book.contentKey}`) : addToast(t.bookNotAvailable || 'Book not ready', 'info'); }}
                               className="w-full text-left p-3 rounded-xl bg-white hover:bg-[#FDF0E3] shadow-sm border border-[#EDD9BE]/60 flex items-center justify-between group transition-all"
                             >
                                <span className="text-sm font-semibold text-[#3E2511] group-hover:text-[#C4521A] transition-colors font-sans">{book.name}</span>
                                <Icon name="chevron-left" className="w-4 h-4 transform rotate-180 opacity-40 text-[#C4521A] group-hover:opacity-100 transition-opacity" />
                             </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Modern Curated Reading Paths */}
      <section className="max-w-4xl mx-auto mt-10 pt-16 border-t border-[#EDD9BE] relative z-10 pb-20">
        <div className="space-y-6 text-center">
            <h2 className="text-3xl font-bold text-[#5C3D1E]">Suggested Reading Paths</h2>
            <p className="text-[#8B6040]">Curated sequences for exploring timeless wisdom.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-8">
                {[
                    { title: "Begin with the Gita", desc: "Start with the foundational spiritual philosophy.", books: books.filter(b => b.tags?.includes('gita')).slice(0, 3) },
                    { title: "Explore the Epics", desc: "The Ramayana and Mahabharata — narrating Dharma.", books: books.filter(b => b.tags?.includes('itihasa') || bookToCategoryTag(b) === 'ramayana' || bookToCategoryTag(b) === 'mahabharata' ).slice(0, 3) },
                    { title: "Vedic Hymns", desc: "The oldest spiritual texts and cosmic knowledge.", books: books.filter(b => b.tags?.includes('veda')).slice(0, 3) },
                ].map((path, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white shadow-md border border-[#EDD9BE] flex flex-col h-full hover:-translate-y-1 transition-transform">
                        <div className="w-10 h-10 rounded-full bg-[#FFF5EB] flex items-center justify-center mb-4 text-[#C4521A] border border-orange-200">
                           <Icon name="book-open" className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-lg text-[#2E1A0A] mb-2">{path.title}</h4>
                        <p className="text-sm text-[#8B6040] mb-4 flex-grow">{path.desc}</p>
                        <div className="space-y-2 mt-auto">
                            {path.books.map(book => (
                                <button
                                    key={book.id}
                                    onClick={() => book.contentKey ? navigateTo(`/bookReader/${book.contentKey}`) : addToast(t.bookNotAvailable || 'Book not ready', 'info')}
                                    className="w-full text-left p-2 rounded-lg bg-[#FAF0E6]/50 hover:bg-[#FAF0E6] text-xs font-semibold text-[#5C3D1E] flex items-center justify-between font-sans border border-transparent hover:border-[#EDD9BE] transition-all"
                                >
                                    <span className="truncate pr-2">{book.name}</span>
                                    <Icon name="chevron-left" className="w-3 h-3 flex-shrink-0 transform rotate-180 opacity-50 text-[#C4521A]" />
                                </button>
                            ))}
                            {path.books.length === 0 && <p className="text-xs text-[#B0907A] italic text-center p-2">Wait for texts to arrive.</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

    </div>
  );
};
