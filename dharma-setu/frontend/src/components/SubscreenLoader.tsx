import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── DEITY DATA ─────────────────────────────────────────────────────────────

interface DeityTheme {
  name: string;
  devanagari: string;
  emoji: string;
  imageUrl: string;
  background: string;
  accent: string;
  header: string;
  mandala: string;
}

export const DEITY_THEMES: DeityTheme[] = [
  { name: 'Venkateswara', devanagari: 'वेंकटेश्वर', emoji: '🏛️', imageUrl: '/images/deities/deity_venkateswara.png', background: '#EDE0F5', accent: '#6B21A8', header: '#6B21A8', mandala: '#F4A0C0' },
  { name: 'Ram', devanagari: 'राम', emoji: '🏹', imageUrl: '/images/deities/deity_ram.png', background: '#FFF3E0', accent: '#B45309', header: '#92400E', mandala: '#F59E0B' },
  { name: 'Krishna', devanagari: 'कृष्ण', emoji: '🪈', imageUrl: '/images/deities/deity_krishna.png', background: '#E8F4FD', accent: '#1D4ED8', header: '#1E40AF', mandala: '#FCD34D' },
  { name: 'Shiva', devanagari: 'शिव', emoji: '🔱', imageUrl: '/images/deities/deity_shiva.png', background: '#F0FDF4', accent: '#374151', header: '#1F2937', mandala: '#E5E7EB' },
  { name: 'Durga', devanagari: 'दुर्गा', emoji: '🌺', imageUrl: '/images/deities/deity_durga.png', background: '#FFF1F2', accent: '#BE123C', header: '#9F1239', mandala: '#FB923C' },
  { name: 'Ganesh', devanagari: 'गणेश', emoji: '🐘', imageUrl: '/images/deities/deity_ganesh.png', background: '#FFFBEB', accent: '#D97706', header: '#92400E', mandala: '#EF4444' },
  { name: 'Hanuman', devanagari: 'हनुमान', emoji: '🌅', imageUrl: '/images/deities/deity_hanuman.png', background: '#FFF7ED', accent: '#EA580C', header: '#C2410C', mandala: '#FB923C' },
  { name: 'Lakshmi', devanagari: 'लक्ष्मी', emoji: '🪷', imageUrl: '/images/deities/deity_lakshmi.png', background: '#FDFCE4', accent: '#A16207', header: '#854D0E', mandala: '#F472B6' },
  { name: 'Saraswati', devanagari: 'सरस्वती', emoji: '🎵', imageUrl: '/images/deities/deity_saraswati.png', background: '#EFF6FF', accent: '#1D4ED8', header: '#1E3A8A', mandala: '#F8FAFC' },
  { name: 'Kali', devanagari: 'काली', emoji: '⚡', imageUrl: '/images/deities/deity_kali.png', background: '#1C0A2E', accent: '#7C3AED', header: '#4C1D95', mandala: '#DC2626' },
  { name: 'Murugan', devanagari: 'मुरुगन', emoji: '🌟', imageUrl: '/images/deities/deity_murugan.png', background: '#FFF1F2', accent: '#BE185D', header: '#9D174D', mandala: '#F59E0B' },
  { name: 'Ayyappa', devanagari: 'अय्यप्पा', emoji: '🌿', imageUrl: '/images/deities/deity_ayyappa.png', background: '#F0FDF4', accent: '#065F46', header: '#064E3B', mandala: '#D97706' },
  { name: 'Jagannath', devanagari: 'जगन्नाथ', emoji: '🌊', imageUrl: '/images/deities/deity_jagannath.png', background: '#FEF9C3', accent: '#CA8A04', header: '#A16207', mandala: '#3B82F6' },
  { name: 'Narsimha', devanagari: 'नृसिंह', emoji: '🦁', imageUrl: '/images/deities/deity_narsimha.png', background: '#FFF7ED', accent: '#C2410C', header: '#9A3412', mandala: '#F59E0B' },
  { name: 'Radha', devanagari: 'राधा', emoji: '💛', imageUrl: '/images/deities/deity_radha.png', background: '#FDF2F8', accent: '#DB2777', header: '#9D174D', mandala: '#FCD34D' },
  { name: 'Dattatreya', devanagari: 'दत्तात्रेय', emoji: '🔯', imageUrl: '/images/deities/deity_dattatreya.png', background: '#F5F3FF', accent: '#7C3AED', header: '#4C1D95', mandala: '#F97316' },
  { name: 'Subramanya', devanagari: 'सुब्रह्मण्य', emoji: '✨', imageUrl: '/images/deities/deity_murugan.png', background: '#FFF1F2', accent: '#BE185D', header: '#881337', mandala: '#F59E0B' },
  { name: 'Adi Shankaracharya', devanagari: 'आदि शंकराचार्य', emoji: '🕉️', imageUrl: '/images/deities/deity_adi_shankaracharya.png', background: '#F5F3FF', accent: '#5B21B6', header: '#4C1D95', mandala: '#F97316' },
];

export const DEITY_FACTS: Record<string, string[]> = {
  'Venkateswara': ['TTD maintains 62+ ancient temples across India and abroad.', 'Tirupati Balaji receives 75,000–100,000 pilgrims every single day.', 'The Tirupati laddu has an official GI tag.', 'The main idol at Tirumala is Swayambhu.', 'TTD publishes the Sthala Puranam for free public access.'],
  'Ram': ['Ayodhya is 1 of 7 sacred Saptapuri cities.', 'The Ramayana is translated into more than 300 languages.', 'Lord Ram is the Maryada Purushottam.', 'Ram Setu is documented in Valmiki Ramayana.', 'Ram Navami falls on the 9th day of Chaitra Shukla Paksha.'],
  'Krishna': ['Lord Krishna delivered the Bhagavad Gita on the battlefield of Kurukshetra.', 'Mathura, Vrindavan, and Dwarka are holiest Krishna cities.', 'Krishna was born at midnight on Ashtami.', 'Puri Jagannath temple is dedicated to Krishna.'],
  'Shiva': ['There are 12 Jyotirlingas spread across the Indian subcontinent.', 'Shiva is called Mahamrityunjaya.', 'Kashi is known as the eternal city of Lord Shiva.', 'Om Namah Shivaya contains all 5 elements of nature.'],
  'Durga': ['There are 108 Shakti Peethas across the subcontinent.', '9 forms of Durga are worshipped across Navratri.', 'Durga slew the demon Mahishasura.', 'Navratri is celebrated twice a year.'],
  'Ganesh': ['Lord Ganesh is always worshipped first before any puja.', 'Ashtavinayak are 8 sacred Ganesh temples in Maharashtra.', 'His vehicle Mushak symbolizes ego controlled by wisdom.', 'Ganesh is revered across Hinduism, Buddhism, and Jainism.'],
  'Hanuman': ['Hanuman is the 11th Rudra avatar of Lord Shiva.', 'Hanuman Chalisa was composed by Tulsidas in the 16th century.', 'Hanuman is a Chiranjeevi — one of 7 immortals.', 'Tuesday and Saturday are considered sacred days.'],
  'Lakshmi': ['Goddess Lakshmi emerged during Samudra Manthan.', 'Diwali is the grandest annual celebration of Goddess Lakshmi.', 'Sri Yantra represents Lakshmi\'s energy.', 'Her 4 arms represent Dharma, Artha, Kama, Moksha.'],
  'Saraswati': ['Saraswati is the deity of knowledge, music, arts, and wisdom.', 'On Vasant Panchami, books and instruments are worshipped.', 'She is one of the three Tridevi.', 'Pushkar lake is associated with Brahma and Saraswati.'],
  'Kali': ['Kali is the most powerful form of Adi Shakti.', 'Kalighat temple is one of the 51 principal Shakti Peethas.', 'Her dark complexion represents the infinite void.', 'Kamakhya temple in Assam is a powerful Kali Peetha.'],
  'Murugan': ['Murugan is the supreme deity of Tamil Nadu.', 'His Vel symbolizes divine knowledge.', 'Thaipusam features a grand procession.', 'The 6 sacred Arupadai Veedu abodes are in Tamil Nadu.'],
  'Ayyappa': ['Sabarimala is one of the world\'s largest annual pilgrimages.', 'The 18 sacred steps represent the 18 Puranas.', 'Ayyappa is the son of Shiva and Mohini.', 'The Makaravilakku star marks the pilgrimage season.'],
  'Jagannath': ['Rath Yatra of Puri is the world\'s oldest chariot festival.', 'The idols are renewed in the secret Nabakalebara ritual.', 'Puri temple kitchen is the world\'s largest.', 'Lord Jagannath represents the formless Brahman.'],
  'Narsimha': ['Narsimha is the 4th avatar of Vishnu.', 'Ahobilam has 9 Narsimha temples in a single complex.', 'The Narsimha Kavach is a powerful protective mantra.', 'Worshipped especially on Vaishakha Shukla Chaturdashi.'],
  'Radha': ['Radha is the Hladini Shakti of Krishna.', 'Barsana celebrates Lathmar Holi.', 'Radha Raman temple is the most sacred Vaishnava shrine.', 'Radha\'s name is always chanted before Krishna\'s.'],
  'Dattatreya': ['Dattatreya is the combined avatar of Brahma, Vishnu, and Shiva.', 'He is the Adi Guru — teacher of all knowledge.', 'Gangapur in Karnataka is the most sacred pilgrimage site.', 'Worshipped on Dattatreya Jayanti.'],
  'Subramanya': ['Subramanya is the commander of celestial armies.', 'The Skanda Purana is entirely dedicated to him.', 'Palani Murugan temple receives millions of devotees.', 'Karthigai Deepam festival is his grandest celebration.'],
  'Adi Shankaracharya': ['Consolidated Advaita Vedanta.', 'Established 4 Mathas at 4 corners of India.', 'Composed 500+ works including Vivekachudamani.', 'He lived only 32 years yet transformed philosophy.'],
};

export const STORAGE_KEY = 'dharmasetu_ishta_devata';

// ─── SVG COMPONENTS ─────────────────────────────────────────────────────────

const PlumeriaFlower = ({ size, color, style, animDelay }: { size: number; color: string; style: React.CSSProperties; animDelay: number }) => (
  <svg
    width={size} height={size} viewBox="0 0 60 60" fill="none"
    style={{
      ...style,
      animation: `floatFlower 3s ease-in-out ${animDelay}s infinite alternate, rotateFlower 6s linear ${animDelay}s infinite`,
      position: 'absolute',
    }}
  >
    <g stroke={color} strokeWidth="1.5" opacity="0.4">
      <ellipse cx="30" cy="16" rx="8" ry="14" transform="rotate(0 30 30)" />
      <ellipse cx="30" cy="16" rx="8" ry="14" transform="rotate(72 30 30)" />
      <ellipse cx="30" cy="16" rx="8" ry="14" transform="rotate(144 30 30)" />
      <ellipse cx="30" cy="16" rx="8" ry="14" transform="rotate(216 30 30)" />
      <ellipse cx="30" cy="16" rx="8" ry="14" transform="rotate(288 30 30)" />
      <circle cx="30" cy="30" r="6" />
    </g>
  </svg>
);

const MandalaSVG = ({ color }: { color: string }) => (
  <svg width="250" height="250" viewBox="0 0 250 250" fill="none" style={{
    animation: 'rotateMandala 30s linear infinite',
  }}>
    <g stroke={color} opacity="0.3" strokeWidth="1">
      <circle cx="125" cy="125" r="120" />
      <circle cx="125" cy="125" r="100" />
      <circle cx="125" cy="125" r="80" />
      <circle cx="125" cy="125" r="60" />
      <circle cx="125" cy="125" r="40" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => (
        <line key={deg} x1="125" y1="5" x2="125" y2="245" transform={`rotate(${deg} 125 125)`} />
      ))}
      {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
        <ellipse key={`p${deg}`} cx="125" cy="45" rx="12" ry="25" transform={`rotate(${deg} 125 125)`} />
      ))}
    </g>
  </svg>
);

// ─── SUBSCREEN LOADER COMPONENT ─────────────────────────────────────────────

export const SubscreenLoader = () => {
  const [factIdx, setFactIdx] = useState(0);
  const [factVisible, setFactVisible] = useState(true);
  const [isReady, setIsReady] = useState(false);
  
  // Ensure we mount immediately but prevent hydration mismatch
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Fact rotation
  useEffect(() => {
    const factInterval = setInterval(() => {
      setFactVisible(false);
      setTimeout(() => {
        setFactIdx(prev => (prev + 1) % 4); // Show up to 4 facts
        setFactVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(factInterval);
  }, []);

  if (!isReady) return <div className="min-h-[50vh] flex justify-center items-center">Loading...</div>;

  const savedIdx = localStorage.getItem(STORAGE_KEY);
  const idx = savedIdx !== null ? parseInt(savedIdx, 10) : 0; // Default to 0 if not selected
  const deity = DEITY_THEMES[isValidIdx(idx) ? idx : 0];
  const isKali = deity.name === 'Kali';
  const textColor = isKali ? '#E9D5FF' : '#1A1A1A';
  const subtextColor = isKali ? '#C4B5FD' : '#4B5563';
  const facts = DEITY_FACTS[deity.name] || [];

  return (
    <div className="w-full flex-1 flex flex-col justify-center items-center" style={{
      fontFamily: 'Georgia, serif',
      background: deity.background,
      minHeight: '60vh',
      position: 'relative', 
      overflow: 'hidden',
    }}>
      {/* Floating Flowers */}
      <PlumeriaFlower size={60} color={deity.accent} style={{ top: 20, left: 10, transform: 'rotate(-20deg)' }} animDelay={0} />
      <PlumeriaFlower size={45} color={deity.accent} style={{ top: 30, right: 20, transform: 'rotate(15deg)' }} animDelay={0.5} />
      <PlumeriaFlower size={50} color={deity.accent} style={{ top: 340, left: 10, transform: 'rotate(-10deg)' }} animDelay={1} />
      <PlumeriaFlower size={70} color={deity.accent} style={{ top: 330, right: 10, transform: 'rotate(25deg)' }} animDelay={1.5} />

      {/* Deity Image Area */}
      <div style={{ height: 260, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Mandala behind */}
        <div style={{
          position: 'absolute',
          animation: 'pulseMandala 4s ease-in-out infinite alternate',
        }}>
          <MandalaSVG color={deity.mandala} />
        </div>
        {/* Deity SVG Icon or Image */}
        <div style={{
          position: 'relative', zIndex: 2, textAlign: 'center',
          animation: 'swayDeity 6s ease-in-out infinite',
          marginTop: 10
        }}>
          <div style={{ 
            width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', 
            border: `6px solid ${deity.accent}40`, boxShadow: `0 0 30px ${deity.accent}60`,
            margin: '0 auto', background: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
             <img src={deity.imageUrl} alt={deity.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <p style={{ fontSize: 18, fontWeight: 'bold', color: textColor, marginTop: 12 }}>{deity.devanagari}</p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20, zIndex: 10 }}>
        <p style={{ fontSize: 18, color: textColor, fontWeight: 'bold' }}>Embracing the Divine...</p>
      </div>

      {/* Did You Know */}
      <div style={{
        background: 'rgba(255,255,255,0.60)', borderRadius: 16,
        padding: '16px 20px', margin: '0 20px', maxWidth: 400,
        zIndex: 10, alignSelf: 'center', width: '100%',
        boxShadow: `0 8px 32px ${deity.accent}15`
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 'bold', color: textColor, margin: '0 0 8px', fontFamily: 'Georgia, serif' }}>
          Did you know?
        </h3>
        <p style={{
          fontSize: 14, color: isKali ? '#D8B4FE' : '#374151', lineHeight: 1.6,
          fontFamily: 'Georgia, serif',
          opacity: factVisible ? 1 : 0,
          transition: 'opacity 300ms ease',
          minHeight: 45,
        }}>
          {facts[factIdx] || ''}
        </p>
      </div>

      <style>{`
        @keyframes floatFlower {
          from { transform: translateY(0px); }
          to { transform: translateY(-8px); }
        }
        @keyframes rotateFlower {
          from { transform: rotate(0deg); }
          to { transform: rotate(12deg); }
        }
        @keyframes rotateMandala {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseMandala {
          from { transform: scale(1.0); }
          to { transform: scale(1.03); }
        }
        @keyframes swayDeity {
          0%, 100% { transform: rotate(-1deg); }
          50% { transform: rotate(1deg); }
        }
      `}</style>
    </div>
  );
};

function isValidIdx(idx: number) {
    return !isNaN(idx) && idx >= 0 && idx < DEITY_THEMES.length;
}

// ─── ISHTA DEVATA SELECTION MODAL ─────────────────────────────────────────

export const IshtaDevataModal = ({ onClose }: { onClose: () => void }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const selectDeity = useCallback((idx: number) => {
    setSelectedIdx(idx);
    localStorage.setItem(STORAGE_KEY, String(idx));
    setTimeout(onClose, 500); // Close slightly after so they see confirmation
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF0E6] rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative" style={{ fontFamily: 'Georgia, serif' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 20px 16px', textAlign: 'center', background: '#1C1208' }}>
          <button onClick={onClose} className="absolute top-4 right-4 text-[#F0DFC0] text-2xl" aria-label="Skip">✕</button>
          <h1 style={{ fontSize: 22, fontWeight: 'bold', color: '#F0DFC0', margin: '0 0 6px' }}>Choose Your Ishta Devata</h1>
          <p style={{ fontSize: 13, color: '#A08060', margin: 0 }}>Select the deity for your divine loading experience</p>
        </div>

        {/* Grid Area - scrollable */}
        <div className="p-4 md:p-6 overflow-y-auto" style={{ flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
            {DEITY_THEMES.map((d, idx) => {
              const isSelected = selectedIdx === idx;
              const isShankaracharya = d.name === 'Adi Shankaracharya';
              return (
                <button
                  key={d.name}
                  onClick={() => selectDeity(idx)}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    background: d.background,
                    borderRadius: 16,
                    border: isSelected ? `2px solid ${d.accent}` : '2px solid transparent',
                    boxShadow: isSelected ? `0 0 0 3px ${d.accent}33` : '0 2px 8px rgba(0,0,0,0.06)',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 200ms ease',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: 8,
                  }}
                >
                  {isShankaracharya && (
                    <span style={{
                      position: 'absolute', top: -6, right: -6, zIndex: 10,
                      fontSize: 9, color: '#fff', fontWeight: 'bold',
                      background: d.accent, padding: '2px 8px', borderRadius: 10,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>Jagadguru</span>
                  )}
                  <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${isSelected ? d.accent : 'transparent'}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                     <img src={d.imageUrl} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 'bold', color: '#2E1A0A', textAlign: 'center', lineHeight: 1.1 }}>{d.name}</span>
                  <span style={{ fontSize: 12, color: '#8B6040', textAlign: 'center' }}>{d.devanagari}</span>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 24, padding: '12px 16px', background: '#F5F3FF', borderRadius: 12, borderLeft: '3px solid #5B21B6' }}>
            <p style={{ fontSize: 12, color: '#4C1D95', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
              🕉️ This deity will appear to bless you while the Dharma Setu app is loading inside various sections.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
