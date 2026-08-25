import React from 'react';
import { IconName } from '../types';

interface IconProps {
    name: IconName;
    className?: string;
    style?: React.CSSProperties;
}

export const Icon = ({ name, className, style }: IconProps) => {
    const icons: Record<IconName, React.ReactNode> = {
        'alert-triangle': (
          <g strokeWidth="1.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </g>
        ),
        'alert-circle': (
          <g strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </g>
        ),
        // Custom illustrated Brass Diya representing Pooja/Worship
        'bell': (
          <g strokeWidth="1.5">
            <path d="M12 21c-4.5 0-8-3-8-6.5S7.5 10 12 10s8 1 8 4.5s-3.5 6.5-8 6.5z" />
            <path d="M12 10V6 M12 6C11 5 10 3 12 1s1 4 0 5z" fill="currentColor" />
            <path d="M9 21.5h6" />
          </g>
        ),
        // Custom illustrated Palm Leaf Manuscript representing Scriptures/Books
        'book-open': (
          <g strokeWidth="1.5">
            <rect x="2" y="5" width="20" height="5" rx="1.2" />
            <rect x="2" y="13" width="20" height="5" rx="1.2" />
            <circle cx="6" cy="7.5" r="1" fill="currentColor" />
            <circle cx="6" cy="15.5" r="1" fill="currentColor" />
            <path d="M6 2v19" />
            <circle cx="18" cy="7.5" r="1" fill="currentColor" />
            <circle cx="18" cy="15.5" r="1" fill="currentColor" />
          </g>
        ),
        'bookmark': <path strokeWidth="1.5" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
        'camera': (
          <g strokeWidth="1.5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </g>
        ),
        // Custom illustrated Temple Festival Banner representing Calendar/Events
        'calendar': (
          <g strokeWidth="1.5">
            <path d="M4 2v20 M20 2v20 M4 5h16 M4 12h16" />
            <path d="M7 5v7M10 5v7M14 5v7M17 5v7" />
            <path d="M12 14v5M9 16.5h6" />
          </g>
        ),
        'chakra': (
          <g strokeWidth="1.5">
            <circle cx="12" cy="12" r="2" />
            <path d="M12 2a10 10 0 1 0 10 10" />
            <path d="M12 22a10 10 0 1 0-10-10" />
            <path d="M2 12h20" />
            <path d="M12 2v20" />
          </g>
        ),
        'check-circle': (
          <g strokeWidth="1.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </g>
        ),
        'chevron-left': <polyline strokeWidth="2" points="15 18 9 12 15 6" />,
        'chevron-right': <polyline strokeWidth="2" points="9 18 15 12 9 6" />,
        'circle': <circle cx="12" cy="12" r="10" strokeWidth="1.5" />,
        // Custom illustrated Manuscript Shelf representing Tasks/Lists
        'clipboard-list': (
          <g strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18 M3 15h18" />
            <path d="M7 3v6 M12 3v6 M17 3v6 M9 9v6 M15 9v6 M8 15v6 M16 15v6" />
          </g>
        ),
        'clock': (
          <g strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </g>
        ),
        // Custom illustrated Sacred Pathway representing Journey/Compass
        'compass': (
          <g strokeWidth="1.5">
            <path d="M12 22s6-8 6-13a6 6 0 1 0-12 0c0 5 6 13 6 13z" />
            <circle cx="12" cy="9" r="2.5" />
            <path d="M9 20c1-2 3-4 3-6s2 4 3 6" />
          </g>
        ),
        'conch': <path strokeWidth="1.5" d="M4.3 12.3c-1-1.5-1-3.6.3-5.5 1.4-2 3.8-3 6.2-3h.2c.4 0 .7.3.7.7v0c0 .4-.3.7-.7.7h-.2c-2 0-4 1-5.2 2.7-1 1.5-1.1 3-.3 4.1.9 1.1 2.3 1.2 3.5 1.2h2.5c.4 0 .7.3.7.7v0c0 .4-.3.7-.7.7H9.3c-1.3 0-2.8.2-4.1.8-1.3.6-2.6 1.7-2.6 3.1 0 1.9 1.6 3.4 3.6 3.4 2 0 3.6-1.5 3.6-3.4 0-.4-.3-.7-.7-.7v0c-.4 0-.7.3-.7.7 0 1.1-.9 2-2.1 2-1.2 0-2.1-1-2.1-2.1 0-.9.6-1.7 1.7-2.1.9-.4 2-.5 3-.5h10.3c.4 0 .7-.3.7-.7v0c0-.4-.3.7-.7-.7H15c-3.1 0-5.7-2.5-5.7-5.7 0-1.6.7-3.2 1.8-4.3" />,
        'cow': (
          <g strokeWidth="1.5">
            <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
            <path d="M12 7v10 M8 11h8" />
            <path d="M11 15l1 1 1-1" />
            <circle cx="9" cy="9" r="1" fill="currentColor" />
            <circle cx="15" cy="9" r="1" fill="currentColor" />
          </g>
        ),
        'cosmic-logo': (
          <g strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="5" strokeDasharray="3 3" />
            <path d="M12 3v18 M3 12h18" />
          </g>
        ),
        'animated-cosmic-logo': (
          <g className="animate-om-pulse" style={{ transformOrigin: 'center' }}>
            <g strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3v18 M3 12h18" />
            </g>
          </g>
        ),
        'diya': (
          <g strokeWidth="1.5">
            <path d="M12 21c-4.5 0-8-3-8-6.5S7.5 10 12 10s8 1 8 4.5s-3.5 6.5-8 6.5z" />
            <path d="M12 10V6 M12 6C11 5 10 3 12 1s1 4 0 5z" fill="currentColor" />
            <path d="M9 21.5h6" />
          </g>
        ),
        'edit': <path strokeWidth="1.5" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />,
        'facebook': <path strokeWidth="1.5" d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
        'flame': <path strokeWidth="1.5" d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />,
        'flower': (
          <g strokeWidth="1.5">
            <path d="M12 7.5a4.5 4.5 0 1 1-4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 3M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5a4.5 4.5 0 1 0 4.5-4.5" />
            <circle cx="12" cy="7.5" r="1.5" fill="currentColor" />
          </g>
        ),
        'gada': (
          <g strokeWidth="1.5">
            <circle cx="5" cy="19" r="2" />
            <path d="m6 17 8-8" />
            <path d="m14 9 4-4" />
            <circle cx="19" cy="5" r="2" />
          </g>
        ),
        'google': <path strokeWidth="1.5" d="M20.94 12.35c0-.82-.07-1.6-.2-2.35H12v4.44h5.02c-.22 1.43-1.09 2.65-2.38 3.48v2.85h3.66c2.14-1.97 3.38-4.88 3.38-8.42z M12 23c3.12 0 5.76-1.04 7.68-2.8l-3.66-2.85c-1.03.7-2.36 1.11-3.92 1.11-3.01 0-5.56-2.03-6.47-4.76H2.17v2.96C4.1 20.45 7.72 23 12 23z M5.53 14.24c-.22-.67-.34-1.37-.34-2.14s.12-1.47.34-2.14V7.02H2.17C1.43 8.45 1 10.15 1 12s.43 3.55 1.17 4.98l3.36-2.74z M12 5.37c1.7 0 3.16.58 4.34 1.7L19.4 4C17.47 2.2 14.97 1 12 1 7.72 1 4.1 3.55 2.17 7.02l3.36 2.74c.91-2.73 3.46-4.76 6.47-4.76z" />,
        'gopuram': (
          <g strokeWidth="1.5">
            <path d="M16 3v2 M8 3v2 M12 3v2" />
            <path d="M17.8 21 15 13H9l-2.8 8" />
            <path d="M21 21H3" />
            <path d="m7 13 5-8 5 8" />
          </g>
        ),
        'heart-hand': (
          <g strokeWidth="1.5">
            <path d="M12 22C7 20 4 15 4 10V5l8-3 8 3v5c0 5-3 10-8 12z" />
            <path d="M8 10h8 M12 7v6 M10 14h4" />
          </g>
        ),
        // Handcrafted Home Temple / Shrine
        'home': (
          <g strokeWidth="1.5">
            <path d="M12 2L2 9h20L12 2z M4 9v12h16V9" />
            <path d="M9 21v-7h6v7" />
            <circle cx="12" cy="5" r="1.2" fill="currentColor" />
          </g>
        ),
        'image': <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="1.5" />,
        'info': <circle cx="12" cy="12" r="10" strokeWidth="1.5" />,
        'leaf': <path strokeWidth="1.5" d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 8-.5 2.2-2 4.4-4.3 5.5l-1.3.6a10.5 10.5 0 0 1-3.4 3.9Z" />,
        'lotus': <path strokeWidth="1.5" d="M8.83 2a2 2 0 0 0-2.66 2.66l.04.12 1.35 4.02a4 4 0 0 0 3.1 2.45l4.01 1.35.12.04a2 2 0 0 0 2.66-2.66L16 8.83a4 4 0 0 0-2.45-3.1L9.53 4.38a2 2 0 0 0-.7-.38Z" />,
        'map-pin': (
          <g strokeWidth="1.5">
            <path d="M12 22s6-8 6-13a6 6 0 1 0-12 0c0 5 6 13 6 13z" />
            <path d="M9 20c1-2 3-4 3-6s2 4 3 6" />
          </g>
        ),
        'meditate': <path strokeWidth="1.5" d="m6 18 6-6 6 6 m-12-6 6-6 6 6" />,
        'menu': <path strokeWidth="2" d="M3 12h18 M3 6h18 M3 18h18" />,
        'microphone': <rect x="9" y="2" width="6" height="12" rx="3" strokeWidth="1.5" />,
        'om': (
          <g strokeWidth="1.5">
            <path d="M9 6a4.33 4.33 0 1 1-1.4 8.52" />
            <path d="M12 12a4.42 4.42 0 0 0 4-4.5" />
            <circle cx="13.5" cy="4.5" r="1" fill="currentColor" />
          </g>
        ),
        'pause': <path strokeWidth="1.5" d="M6 4h4v16H6zm8 0h4v16h-4z" />,
        'play': <polygon strokeWidth="1.5" points="5 3 19 12 5 21 5 3" />,
        'plus': <path strokeWidth="2" d="M12 5v14 M5 12h14" />,
        'receipt': <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />,
        'rupee': <path strokeWidth="1.5" d="M6 3h8 M6 8h12 M6 13h12 M6 18h12 M18 3v18 M8 3v18" />,
        'search': <circle cx="11" cy="11" r="8" strokeWidth="1.5" />,
        'settings': <circle cx="12" cy="12" r="3" strokeWidth="1.5" />,
        'shield-check': <path strokeWidth="1.5" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />,
        // Custom illustrated Teak wood offering chest representing Marketplace/Mart
        'shopping-bag': (
          <g strokeWidth="1.5">
            <rect x="3" y="9" width="18" height="11" rx="1.5" />
            <path d="M3 9c0-2.5 3-4 9-4s9 1.5 9 4" />
            <path d="M12 5v15 M7 9v11 M17 9v11" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </g>
        ),
        'speaker': <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth="1.5" />,
        'star': <polygon strokeWidth="1.5" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
        'stop-circle': <circle cx="12" cy="12" r="10" strokeWidth="1.5" />,
        'sudarshana-chakra': <circle cx="12" cy="12" r="10" strokeWidth="1.5" />,
        'swasthika': <path strokeWidth="2.5" d="M12 2 V22 M2 12 H22 M12 2 H22 M22 12 V22 M12 22 H2 M2 12 V2" />,
        // Custom illustrated Temple Gateway representing Temples
        'temple': (
          <g strokeWidth="1.5">
            <path d="M3 22h18 M6 22V13h12v9 M6 13c0-3 2-6 6-8c4 2 6 5 6 8" />
            <path d="M10 13a2 2 0 1 1 4 0 M12 1v5" />
            <path d="M2 13h4 M18 13h4" />
          </g>
        ),
        'trash': <path strokeWidth="1.5" d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />,
        'trishul': <path strokeWidth="1.5" d="M12 2v20 M4 16c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4" />,
        'truck': <rect x="1" y="3" width="15" height="13" strokeWidth="1.5" />,
        'upload': <path strokeWidth="1.5" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />,
        'user-circle': <circle cx="12" cy="12" r="10" strokeWidth="1.5" />,
        'user-edit': <path strokeWidth="1.5" d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22" />,
        'users': (
          <g strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </g>
        ),
        // Custom illustrated Temple Mandap representing Community/Groups
        'users-group': (
          <g strokeWidth="1.5">
            <path d="M2 22h20 M5 22V10 M19 22V10 M8 22V10 M16 22V10" />
            <path d="M2 10h20 M5 10c0-4 4-6 7-6s7 2 7 6" />
            <path d="M12 1v3" />
          </g>
        ),
        'volume-off': <polygon strokeWidth="1.5" points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />,
        'volume-on': <polygon strokeWidth="1.5" points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />,
        'x': <path strokeWidth="2" d="M18 6L6 18M6 6l12 12" />,
        'zoom-in': <circle cx="11" cy="11" r="8" strokeWidth="1.5" />,
        'check': <polyline strokeWidth="2" points="20 6 9 17 4 12" />,
        'package': <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />,
        'shield': <path strokeWidth="1.5" d="M12 22s8-4 8-10V5l-8-3-8 3" />,
        'box': <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />,
        'zap': <polygon strokeWidth="1.5" points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
        'globe': <circle cx="12" cy="12" r="10" strokeWidth="1.5" />,
        'sun': <circle cx="12" cy="12" r="4" strokeWidth="1.5" />,
        'moon': <path strokeWidth="1.5" d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
        'droplet': <path strokeWidth="1.5" d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5" />,
        'heart': <path strokeWidth="1.5" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23" />,
        'heart-filled': <path strokeWidth="1.5" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23" fill="currentColor" />,
        'copy': <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="1.5" />,
        'chat': <path strokeWidth="1.5" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
        'lock': <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="1.5" />,
        'info-circle': <circle cx="12" cy="12" r="10" strokeWidth="1.5" />,
        'video': <rect x="1" y="5" width="15" height="14" rx="2" strokeWidth="1.5" />,
        'arrow-left': <line strokeWidth="1.5" x1="19" y1="12" x2="5" y2="12" />,
        'wifi': <path strokeWidth="1.5" d="M5 12.55a11 11 0 0 1 14.08 0" />,
        'wifi-off': <line strokeWidth="1.5" x1="1" y1="1" x2="23" y2="23" />,
        'refresh-cw': <path strokeWidth="1.5" d="M3.51 9a9 9 0 0 1 14.85-3.36" />,
    };

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            style={style}
            aria-hidden="true"
        >
            {icons[name]}
        </svg>
    );
};
export default Icon;
