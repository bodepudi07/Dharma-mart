/**
 * Generates rich, unique inline SVG art for each item.
 * Completely offline - no external URLs, no CORS issues.
 */

export type ItemImageType = 'temple' | 'pooja' | 'yatra' | 'event' | 'book' | 'product' | 'general';

interface SvgImageOptions {
    name: string;
    type?: ItemImageType;
}

// --- Color palettes per category ---
const PALETTES = {
    temple: [
        ['#0a0400', '#2d1005', '#6b2a0a', '#c4600f', '#e8890d'],
        ['#020510', '#0a1430', '#1a3a80', '#2d5fc4', '#4a90e8'],
        ['#08010a', '#220530', '#550d80', '#9030c4', '#c060e8'],
        ['#010805', '#052a10', '#0d6030', '#20a050', '#3adc78'],
        ['#0a0202', '#2d0505', '#6b0d0d', '#c42020', '#e84040'],
        ['#080700', '#251f00', '#5c4a00', '#b08a00', '#f0c000'],
    ],
    pooja: [
        ['#0f0500', '#3a1200', '#8a3200', '#d96000', '#f0a020'],
        ['#020a14', '#062540', '#0e508a', '#1a88c4', '#30c0f0'],
        ['#0a0208', '#280520', '#5f0d4a', '#b01880', '#e030b0'],
        ['#050f02', '#102808', '#245e18', '#3ca030', '#60e050'],
        ['#100005', '#300015', '#700030', '#c00060', '#f000a0'],
        ['#04000a', '#100020', '#280050', '#5000a0', '#9000e0'],
    ],
    yatra: [
        ['#020810', '#062030', '#0e4a70', '#1880b0', '#30c0f0'],
        ['#080505', '#201010', '#4a2020', '#8a3838', '#c45050'],
        ['#050020', '#100058', '#2000c0', '#5020e0', '#8040ff'],
        ['#021008', '#063020', '#0e7040', '#1ab870', '#30f098'],
    ],
    event: [
        ['#060005', '#180015', '#3c0038', '#800080', '#d000d0'],
        ['#000510', '#001530', '#004080', '#0080d0', '#00c0ff'],
        ['#050800', '#141f00', '#2e4800', '#5a9000', '#90e000'],
        ['#100500', '#301500', '#703500', '#c06000', '#f09000'],
    ],
    book: [
        ['#080510', '#201030', '#4a2870', '#8a4ac0', '#c080f0'],
        ['#0a0802', '#281e04', '#5e480e', '#a87820', '#f0b030'],
    ],
    product: [
        ['#080400', '#201000', '#4a2800', '#905000', '#d08000'],
        ['#020800', '#062000', '#0e5000', '#1a9000', '#30d000'],
        ['#000c10', '#002030', '#005060', '#009090', '#00c0d0'],
    ],
    general: [
        ['#0a0600', '#261600', '#5e3600', '#b06000', '#e09000'],
        ['#050810', '#121f28', '#234858', '#3878a0', '#50b0e0'],
    ],
};

const SYMBOLS: Record<string, string[]> = {
    temple: ['ॐ', '🛕', '🪔', '🔱', '🌸', '🕉️', '⚡'],
    pooja: ['🪔', 'ॐ', '🌺', '🌿', '🌼', '🪷', '🙏'],
    yatra: ['🏔️', '⛰️', '🌄', '🌅', '🛤️', '🚶', '🕌'],
    event: ['🌟', '🎊', '✨', '🎆', '🌠', '🪄', '💫'],
    book: ['📖', '📜', '🔮', '✍️', '🌙', '📿', '🌌'],
    product: ['🛍️', '🌿', '✨', '💫', '🪔', '⭐', '🌟'],
    general: ['ॐ', '🙏', '🌸', '🪔', '🌺', '🌟', '✨'],
};

function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

function buildPoojaSvg(name: string, hash: number, colors: string[], symbol: string): string {
    const c0 = colors[0], c1 = colors[1], c2 = colors[2], c3 = colors[3], c4 = colors[4];
    const r1 = 80 + (hash % 20), r2 = 55 + (hash % 15), r3 = 35 + (hash % 10);
    const dashA = `${4 + hash % 4} ${6 + hash % 4}`;
    const shortName = name.length > 22 ? name.substring(0, 20) + '…' : name;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <defs>
    <radialGradient id="bg" cx="40%" cy="35%" r="70%">
      <stop offset="0%" stop-color="${c2}" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c0}"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="${c4}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${c0}" stop-opacity="0"/>
    </radialGradient>
    <filter id="blr"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="gf"><feGaussianBlur stdDeviation="2"/></filter>
  </defs>
  <rect width="400" height="300" fill="url(#bg)"/>
  <!-- Ambient glow -->
  <ellipse cx="200" cy="130" rx="130" ry="100" fill="url(#glow)" filter="url(#blr)" opacity="0.8"/>
  <!-- Outer mandala ring -->
  <circle cx="200" cy="130" r="${r1}" fill="none" stroke="${c3}" stroke-width="0.8" stroke-dasharray="${dashA}" opacity="0.45"/>
  <!-- Middle ring -->
  <circle cx="200" cy="130" r="${r2}" fill="none" stroke="${c4}" stroke-width="0.6" opacity="0.35"/>
  <!-- Inner ring -->
  <circle cx="200" cy="130" r="${r3}" fill="none" stroke="${c3}" stroke-width="1" stroke-dasharray="3 5" opacity="0.55"/>
  <!-- 8 petal mandala -->
  ${[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
        const rad = a * Math.PI / 180;
        const px = 200 + r2 * Math.cos(rad), py = 130 + r2 * Math.sin(rad);
        return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3" fill="${c4}" opacity="0.5"/>`;
    }).join('')}
  <!-- Corner flame hints -->
  <text x="18" y="38" font-size="18" opacity="0.2">🔥</text>
  <text x="362" y="38" font-size="18" opacity="0.2">🔥</text>
  <!-- Main symbol -->
  <text x="200" y="152" font-size="60" text-anchor="middle" dominant-baseline="middle" opacity="0.9" filter="url(#gf)">${symbol}</text>
  <!-- Divider -->
  <line x1="110" y1="205" x2="290" y2="205" stroke="${c3}" stroke-width="0.8" opacity="0.5"/>
  <!-- Name -->
  <text x="200" y="228" font-size="12" text-anchor="middle" fill="${c4}" opacity="0.85" font-family="Georgia,serif" letter-spacing="1">${shortName}</text>
  <!-- Deity subtext hint -->
  <text x="200" y="252" font-size="9" text-anchor="middle" fill="${c3}" opacity="0.45" letter-spacing="2">✦ SACRED RITUAL ✦</text>
  <!-- Dark overlay at bottom -->
  <rect y="260" width="400" height="40" fill="${c0}" opacity="0.6"/>
</svg>`;
}

function buildEventSvg(name: string, hash: number, colors: string[], symbol: string): string {
    const c0 = colors[0], c1 = colors[1], c2 = colors[2], c3 = colors[3], c4 = colors[4];
    const r1 = 90 + (hash % 20);
    const shortName = name.length > 22 ? name.substring(0, 20) + '…' : name;
    // Starburst lines
    const starLines = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => {
        const rad = a * Math.PI / 180;
        const x1 = 200 + (r1 - 20) * Math.cos(rad), y1 = 130 + (r1 - 20) * Math.sin(rad);
        const x2 = 200 + r1 * Math.cos(rad), y2 = 130 + r1 * Math.sin(rad);
        return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c4}" stroke-width="0.8" opacity="0.5"/>`;
    }).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="${c2}" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c0}"/>
    </radialGradient>
    <radialGradient id="starGlow" cx="50%" cy="43%" r="45%">
      <stop offset="0%" stop-color="${c4}" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${c0}" stop-opacity="0"/>
    </radialGradient>
    <filter id="blr"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="gf"><feGaussianBlur stdDeviation="2"/></filter>
  </defs>
  <rect width="400" height="300" fill="url(#bg)"/>
  <!-- Central glow burst -->
  <circle cx="200" cy="130" r="110" fill="url(#starGlow)" filter="url(#blr)" opacity="0.9"/>
  <!-- Starburst -->
  ${starLines}
  <!-- Outer ring -->
  <circle cx="200" cy="130" r="${r1}" fill="none" stroke="${c3}" stroke-width="1" stroke-dasharray="6 10" opacity="0.4"/>
  <!-- Inner halo -->
  <circle cx="200" cy="130" r="50" fill="none" stroke="${c4}" stroke-width="1.5" opacity="0.3"/>
  <!-- Sparkle dots -->
  ${[30, 90, 150, 210, 270, 330].map(a => {
        const rad = a * Math.PI / 180;
        const px = 200 + 75 * Math.cos(rad), py = 130 + 75 * Math.sin(rad);
        return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="2.5" fill="${c4}" opacity="0.7"/>`;
    }).join('')}
  <!-- Corner accents -->
  <text x="10" y="30" font-size="16" opacity="0.25">✨</text>
  <text x="365" y="30" font-size="16" opacity="0.25">✨</text>
  <text x="10" y="290" font-size="14" opacity="0.2">⭐</text>
  <text x="368" y="290" font-size="14" opacity="0.2">⭐</text>
  <!-- Main symbol -->
  <text x="200" y="152" font-size="58" text-anchor="middle" dominant-baseline="middle" opacity="0.92" filter="url(#gf)">${symbol}</text>
  <!-- Horizontal line accent -->
  <line x1="90" y1="205" x2="310" y2="205" stroke="${c3}" stroke-width="0.8" opacity="0.4"/>
  <!-- Event name -->
  <text x="200" y="228" font-size="12" text-anchor="middle" fill="${c4}" opacity="0.85" font-family="Georgia,serif" letter-spacing="1">${shortName}</text>
  <text x="200" y="252" font-size="9" text-anchor="middle" fill="${c3}" opacity="0.4" letter-spacing="2">✦ SACRED EVENT ✦</text>
  <rect y="262" width="400" height="38" fill="${c0}" opacity="0.55"/>
</svg>`;
}

function buildTempleSvg(name: string, hash: number, colors: string[], symbol: string): string {
    const c0 = colors[0], c1 = colors[1], c2 = colors[2], c3 = colors[3], c4 = colors[4];
    const shortName = name.length > 24 ? name.substring(0, 22) + '…' : name;
    const r1 = 85 + (hash % 25), r2 = 60 + (hash % 18), r3 = 40 + (hash % 12);
    const d8 = [0, 45, 90, 135, 180, 225, 270, 315].map(a => {
        const rad = a * Math.PI / 180;
        const px = 200 + r2 * Math.cos(rad), py = 130 + r2 * Math.sin(rad);
        return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="2.5" fill="${c4}" opacity="0.5"/>`;
    }).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c0}"/>
      <stop offset="45%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c0}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="43%" r="50%">
      <stop offset="0%" stop-color="${c3}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${c0}" stop-opacity="0"/>
    </radialGradient>
    <filter id="blr"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="gf"><feGaussianBlur stdDeviation="2"/></filter>
  </defs>
  <rect width="400" height="300" fill="url(#bg)"/>
  <ellipse cx="200" cy="130" rx="140" ry="110" fill="url(#glow)" filter="url(#blr)"/>
  <!-- Concentric geometry -->
  <circle cx="200" cy="130" r="${r1}" fill="none" stroke="${c3}" stroke-width="0.8" stroke-dasharray="5 8" opacity="0.4"/>
  <circle cx="200" cy="130" r="${r2}" fill="none" stroke="${c3}" stroke-width="0.5" opacity="0.3"/>
  <circle cx="200" cy="130" r="${r3}" fill="none" stroke="${c4}" stroke-width="1" stroke-dasharray="2 4" opacity="0.55"/>
  <!-- 8 sacred dots -->
  ${d8}
  <!-- Cross lines (cardinal) -->
  <line x1="200" y1="${130 - r1}" x2="200" y2="${130 - r3}" stroke="${c4}" stroke-width="0.5" opacity="0.3"/>
  <line x1="200" y1="${130 + r3}" x2="200" y2="${130 + r1}" stroke="${c4}" stroke-width="0.5" opacity="0.3"/>
  <line x1="${200 - r1}" y1="130" x2="${200 - r3}" y2="130" stroke="${c4}" stroke-width="0.5" opacity="0.3"/>
  <line x1="${200 + r3}" y1="130" x2="${200 + r1}" y2="130" stroke="${c4}" stroke-width="0.5" opacity="0.3"/>
  <!-- Main symbol -->
  <text x="200" y="148" font-size="56" text-anchor="middle" dominant-baseline="middle" opacity="0.88" filter="url(#gf)">${symbol}</text>
  <!-- Name overlay -->
  <rect y="218" width="400" height="82" fill="${c0}" opacity="0.7"/>
  <line x1="80" y1="222" x2="320" y2="222" stroke="${c3}" stroke-width="0.6" opacity="0.4"/>
  <text x="200" y="244" font-size="12.5" text-anchor="middle" fill="${c4}" opacity="0.9" font-family="Georgia,serif" letter-spacing="1.5">${shortName}</text>
  <text x="200" y="262" font-size="8.5" text-anchor="middle" fill="${c3}" opacity="0.45" letter-spacing="2.5">✦ SACRED TEMPLE ✦</text>
</svg>`;
}

function buildYatraSvg(name: string, hash: number, colors: string[], symbol: string): string {
    const c0 = colors[0], c1 = colors[1], c2 = colors[2], c3 = colors[3], c4 = colors[4];
    const shortName = name.length > 22 ? name.substring(0, 20) + '…' : name;
    // Mountain silhouette path based on hash
    const peak1 = 120 + (hash % 30);
    const peak2 = 80 + ((hash >> 3) % 40);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${c0}"/>
      <stop offset="60%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="mtn" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${c3}"/>
      <stop offset="100%" stop-color="${c0}"/>
    </linearGradient>
    <radialGradient id="sun" cx="70%" cy="20%" r="25%">
      <stop offset="0%" stop-color="${c4}" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="${c0}" stop-opacity="0"/>
    </radialGradient>
    <filter id="blr"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <rect width="400" height="300" fill="url(#sky)"/>
  <!-- Sun/moon glow -->
  <ellipse cx="290" cy="65" rx="60" ry="60" fill="url(#sun)" filter="url(#blr)"/>
  <circle cx="290" cy="65" r="18" fill="${c4}" opacity="0.5"/>
  <!-- Mountain range: far peaks (light) -->
  <path d="M0 300 L60 ${230 - (hash % 20)} L120 195 L180 ${220 - (hash % 15)} L240 200 L300 ${210 - (hash % 25)} L360 195 L400 220 L400 300Z" fill="${c1}" opacity="0.45"/>
  <!-- Mountain range: main peaks (darker) -->
  <path d="M0 300 L50 250 L100 ${peak1} L150 215 L200 ${peak2} L260 200 L310 ${peak1 + 20} L360 ${peak2 + 15} L400 250 L400 300Z" fill="${c2}" opacity="0.7"/>
  <!-- Snow cap on main peak -->
  <path d="M${100} ${peak1} L${85} ${peak1 + 25} L${115} ${peak1 + 25}Z" fill="white" opacity="0.3"/>
  <!-- Path suggestion -->
  <path d="M30 280 Q200 240 370 280" stroke="${c4}" stroke-width="1" fill="none" stroke-dasharray="4 6" opacity="0.35"/>
  <!-- Main symbol -->
  <text x="200" y="145" font-size="50" text-anchor="middle" dominant-baseline="middle" opacity="0.75">${symbol}</text>
  <!-- Bottom info bar -->
  <rect y="258" width="400" height="42" fill="${c0}" opacity="0.8"/>
  <line x1="100" y1="263" x2="300" y2="263" stroke="${c3}" stroke-width="0.6" opacity="0.4"/>
  <text x="200" y="282" font-size="12" text-anchor="middle" fill="${c4}" opacity="0.9" font-family="Georgia,serif" letter-spacing="1">${shortName}</text>
</svg>`;
}

function buildGenericSvg(name: string, type: ItemImageType, hash: number, colors: string[], symbol: string): string {
    const c0 = colors[0], c1 = colors[1], c2 = colors[2], c3 = colors[3], c4 = colors[4];
    const r1 = 80 + (hash % 30), r2 = 55 + (hash % 20);
    const shortName = name.length > 24 ? name.substring(0, 22) + '…' : name;
    const typeLabel = type.toUpperCase();
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c0}"/>
      <stop offset="50%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c0}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="43%" r="50%">
      <stop offset="0%" stop-color="${c3}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${c0}" stop-opacity="0"/>
    </radialGradient>
    <filter id="blr"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="gf"><feGaussianBlur stdDeviation="2"/></filter>
  </defs>
  <rect width="400" height="300" fill="url(#bg)"/>
  <ellipse cx="200" cy="130" rx="150" ry="120" fill="url(#glow)" filter="url(#blr)"/>
  <circle cx="200" cy="130" r="${r1}" fill="none" stroke="${c3}" stroke-width="0.8" stroke-dasharray="5 8" opacity="0.4"/>
  <circle cx="200" cy="130" r="${r2}" fill="none" stroke="${c3}" stroke-width="0.5" opacity="0.3"/>
  <text x="200" y="152" font-size="56" text-anchor="middle" dominant-baseline="middle" opacity="0.88" filter="url(#gf)">${symbol}</text>
  <line x1="100" y1="208" x2="300" y2="208" stroke="${c3}" stroke-width="0.6" opacity="0.4"/>
  <text x="200" y="230" font-size="12" text-anchor="middle" fill="${c4}" opacity="0.88" font-family="Georgia,serif" letter-spacing="1">${shortName}</text>
  <text x="200" y="252" font-size="8" text-anchor="middle" fill="${c3}" opacity="0.4" letter-spacing="2">✦ ${typeLabel} ✦</text>
  <rect y="265" width="400" height="35" fill="${c0}" opacity="0.55"/>
</svg>`;
}

export function generateItemSvg({ name, type = 'general' }: SvgImageOptions): string {
    const hash = hashCode(name + type);
    const palette = PALETTES[type] || PALETTES.general;
    const colors = palette[hash % palette.length];
    const symbols = SYMBOLS[type] || SYMBOLS.general;
    const symbol = symbols[hash % symbols.length];

    let svg: string;
    if (type === 'pooja') {
        svg = buildPoojaSvg(name, hash, colors, symbol);
    } else if (type === 'event') {
        svg = buildEventSvg(name, hash, colors, symbol);
    } else if (type === 'temple') {
        svg = buildTempleSvg(name, hash, colors, symbol);
    } else if (type === 'yatra') {
        svg = buildYatraSvg(name, hash, colors, symbol);
    } else {
        svg = buildGenericSvg(name, type, hash, colors, symbol);
    }

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function getItemFallbackImage(name: string, type: ItemImageType = 'general'): string {
    return generateItemSvg({ name, type });
}
