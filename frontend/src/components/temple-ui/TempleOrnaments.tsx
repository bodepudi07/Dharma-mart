import React from 'react';

/**
 * Authentic Temple Architectural Ornaments & Structural Motifs
 * Handcrafted vector assets avoiding modern SaaS clichés:
 * - Etched Brass Repoussé Corners
 * - Kolam / Rangoli Interlocking Borders
 * - Temple Pillar Relief Vertical Rules
 * - Palm-leaf Pothi Border Dividers
 * - Vintage Estampage Seals & Ticket Badges
 */

export const BrassCorner: React.FC<{
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
  size?: number;
}> = ({ position, className = '', size = 28 }) => {
  const rotation = {
    'top-left': 'rotate(0)',
    'top-right': 'rotate(90deg)',
    'bottom-right': 'rotate(180deg)',
    'bottom-left': 'rotate(270deg)',
  }[position];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: rotation }}
      className={`pointer-events-none text-[#A67C3D] ${className}`}
    >
      {/* Outer corner frame */}
      <path
        d="M2 38V6C2 3.79086 3.79086 2 6 2H38"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Inner stepped relief */}
      <path
        d="M6 30V10C6 7.79086 7.79086 6 10 6H30"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="2 2"
        opacity="0.8"
      />
      {/* Sacred Corner Rosette / Kirtimukha Petal */}
      <circle cx="14" cy="14" r="3.5" fill="#B5651D" stroke="currentColor" strokeWidth="1" />
      <path
        d="M14 6V10.5 M6 14H10.5 M14 17.5V22 M17.5 14H22"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <circle cx="4" cy="4" r="1.5" fill="currentColor" />
    </svg>
  );
};

export const KolamDivider: React.FC<{ className?: string; color?: string }> = ({
  className = '',
  color = '#A67C3D',
}) => {
  return (
    <div className={`flex items-center justify-center gap-2 overflow-hidden select-none ${className}`}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#A67C3D]/40 to-[#A67C3D]/80" />
      <svg
        width="140"
        height="18"
        viewBox="0 0 140 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Central 8-pointed Yantra Star */}
        <polygon points="70,1 74,6 80,6 75,10 77,16 70,12 63,16 65,10 60,6 66,6" fill={color} opacity="0.85" />
        <circle cx="70" cy="9" r="2" fill="#F0E6D2" />
        {/* Symmetrical Kolam Knot Wings */}
        <path
          d="M56 9 C50 3, 44 15, 38 9 C32 3, 26 15, 20 9 C14 3, 8 15, 2 9"
          stroke={color}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M84 9 C90 3, 96 15, 102 9 C108 3, 114 15, 120 9 C126 3, 132 15, 138 9"
          stroke={color}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.7"
        />
        {/* Accent Bindus */}
        <circle cx="47" cy="9" r="1.2" fill={color} />
        <circle cx="29" cy="9" r="1.2" fill={color} />
        <circle cx="93" cy="9" r="1.2" fill={color} />
        <circle cx="111" cy="9" r="1.2" fill={color} />
      </svg>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#A67C3D]/40 to-[#A67C3D]/80" />
    </div>
  );
};

export const TemplePillarBorder: React.FC<{ height?: string; className?: string }> = ({
  height = 'h-full',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center w-4 select-none ${height} ${className}`}>
      {/* Pillar Capital (Kumbha) */}
      <div className="w-3 h-2 border-t-2 border-x-2 border-[#A67C3D] rounded-t-sm bg-[#A67C3D]/20" />
      <div className="w-4 h-1 bg-[#A67C3D]/40" />
      {/* Carved Fluting */}
      <div
        className="w-2 flex-1 my-0.5"
        style={{
          backgroundImage:
            'repeating-linear-gradient(180deg, #A67C3D 0, #A67C3D 2px, transparent 2px, transparent 10px)',
          opacity: 0.35,
        }}
      />
      {/* Pillar Base (Adhisthana) */}
      <div className="w-4 h-1 bg-[#A67C3D]/40" />
      <div className="w-3 h-2 border-b-2 border-x-2 border-[#A67C3D] rounded-b-sm bg-[#A67C3D]/20" />
    </div>
  );
};

export const VintageTempleBell: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 24,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animate-bell-gentle text-[#A67C3D] ${className}`}
    >
      {/* Ring / Hanging Chain */}
      <circle cx="16" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <line x1="16" y1="8" x2="16" y2="10" stroke="currentColor" strokeWidth="1.5" />
      {/* Dome of Ghanta */}
      <path
        d="M16 10 C10 10 9 17 8 22 C7.5 24.5 6 25 6 26 C6 27 8 27.5 16 27.5 C24 27.5 26 27 26 26 C26 25 24.5 24.5 24 22 C23 17 22 10 16 10 Z"
        fill="#C4974E"
        stroke="#7A531E"
        strokeWidth="1.2"
      />
      {/* Clapper / Tongue */}
      <circle cx="16" cy="28.5" r="2" fill="#5C3B11" stroke="#3A250B" strokeWidth="0.8" />
      {/* Brass Ornamental Band */}
      <path d="M9 22 C12 23 20 23 23 22" stroke="#5C3B11" strokeWidth="1.2" strokeDasharray="1.5 1.5" />
    </svg>
  );
};

export const VintageDiyaFlame: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 28,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`text-[#B5651D] ${className}`}
    >
      {/* Brass Diya Base */}
      <path
        d="M7 23 C7 28 14 31 18 31 C22 31 29 28 29 23 C29 21 26 21 18 21 C10 21 7 21 7 23 Z"
        fill="#A67C3D"
        stroke="#6E4D1A"
        strokeWidth="1.2"
      />
      <ellipse cx="18" cy="22" rx="10" ry="2.5" fill="#6E4D1A" opacity="0.6" />
      {/* Diya Spout & Oil Rim */}
      <circle cx="18" cy="32" r="3" fill="#8C5C23" />
      {/* Flame (Flickering) */}
      <g className="animate-diya-glow" style={{ transformOrigin: '18px 19px' }}>
        {/* Outer Glow */}
        <path
          d="M18 5 C15 11 12 14 12 18 C12 21.3 14.7 23 18 23 C21.3 23 24 21.3 24 18 C24 14 21 11 18 5 Z"
          fill="#D4A017"
          opacity="0.9"
        />
        {/* Inner Heart of Flame */}
        <path
          d="M18 9 C16.5 13 14.5 15 14.5 18 C14.5 20 16 21.5 18 21.5 C20 21.5 21.5 20 21.5 18 C21.5 15 19.5 13 18 9 Z"
          fill="#FFF4D0"
        />
        {/* Sindoor core */}
        <circle cx="18" cy="19" r="1.5" fill="#8B1E3F" opacity="0.8" />
      </g>
    </svg>
  );
};

export const VerifiedTempleSeal: React.FC<{
  code?: string;
  location?: string;
  className?: string;
}> = ({ code = 'TTD-SANCTUM-2083', location = 'SANATANA SEVA PARISHAD', className = '' }) => {
  return (
    <div
      className={`inline-flex items-center gap-3 px-3.5 py-1.5 rounded-sm border border-[#8B1E3F]/40 bg-[#8B1E3F]/5 text-[#8B1E3F] font-ticket text-[11px] font-semibold tracking-wider uppercase select-none ${className}`}
      style={{
        boxShadow: 'inset 0 0 6px rgba(139, 30, 63, 0.08)',
      }}
    >
      <span className="w-2 h-2 rounded-full bg-[#8B1E3F] inline-block animate-pulse" />
      <span className="border-r border-[#8B1E3F]/30 pr-2.5">{location}</span>
      <span className="tracking-widest text-stone-700">{code}</span>
    </div>
  );
};
