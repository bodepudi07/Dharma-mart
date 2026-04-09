import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

// A deterministic approximation for demo purposes since we don't have an ephemeris API
const calculatePanchang = (date: Date) => {
    // Known New Moon approx: Jan 11, 2024 (UTC)
    const newMoonDate = new Date(Date.UTC(2024, 0, 11, 11, 57));
    const daysSince = (date.getTime() - newMoonDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Synodic month is approx 29.530588 days
    const phase = (daysSince % 29.530588) / 29.530588;
    const tithiNumber = Math.floor(phase * 30) + 1;
    
    const paksha = tithiNumber <= 15 ? 'Shukla Paksha (Waxing Moon)' : 'Krishna Paksha (Waning Moon)';
    const tithiIndex = (tithiNumber - 1) % 15;
    
    const tithiNames = [
        'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 
        'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 
        'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi'
    ];
    
    let tithiName = tithiNames[tithiIndex];
    if (tithiNumber === 15) tithiName = 'Purnima (Full Moon)';
    if (tithiNumber === 30) tithiName = 'Amavasya (New Moon)';

    // Deterministic mock Nakshatras based on day of year
    const nakshatras = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'];
    
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const nakshatra = nakshatras[dayOfYear % 27];

    return {
        tithi: `${tithiName} - ${paksha}`,
        nakshatra: nakshatra,
        sunrise: '06:24 AM',
        sunset: '06:18 PM',
        rahuKaal: '04:30 PM - 06:00 PM',
        yamaGanda: '12:00 PM - 01:30 PM'
    };
};

export const PanchangWidget = () => {
    const [panchang, setPanchang] = useState(() => calculatePanchang(new Date()));
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        const d = new Date();
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        setCurrentDate(d.toLocaleDateString('en-IN', options));
        
        const timer = setInterval(() => {
            setPanchang(calculatePanchang(new Date()));
        }, 60000 * 60); // Update hourly just in case date rolls over
        
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="bg-gradient-to-br from-[#1a1c29] to-[#0f111a] rounded-[2rem] p-6 lg:p-8 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-amber-500/30 transition-colors duration-500">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] group-hover:bg-amber-500/20 transition-all duration-700 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full blur-[60px] pointer-events-none"></div>
            
            <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                <Icon name="sun" className="w-6 h-6 text-amber-400" />
                            </span>
                            <h2 className="text-2xl font-serif font-bold text-white tracking-widest drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">Daily Panchang</h2>
                        </div>
                        <p className="text-amber-200/80 text-sm tracking-widest uppercase font-medium">{currentDate}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-3 border border-white/5 backdrop-blur-md">
                        <div className="text-center px-4 border-r border-white/10">
                            <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">Sunrise</p>
                            <p className="text-amber-400 font-bold tracking-wider text-sm">{panchang.sunrise}</p>
                        </div>
                        <div className="text-center px-4">
                            <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">Sunset</p>
                            <p className="text-orange-400 font-bold tracking-wider text-sm">{panchang.sunset}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/40 rounded-2xl p-5 border border-white/5 hover:bg-black/60 transition-colors flex items-start gap-4">
                        <div className="bg-white/5 p-3 rounded-full shrink-0 border border-white/10">
                            <Icon name="moon" className="w-5 h-5 text-stone-300" />
                        </div>
                        <div>
                            <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Tithi (Lunar Day)</p>
                            <p className="text-white font-medium text-lg leading-snug">{panchang.tithi}</p>
                        </div>
                    </div>
                    
                    <div className="bg-black/40 rounded-2xl p-5 border border-white/5 hover:bg-black/60 transition-colors flex items-start gap-4">
                        <div className="bg-white/5 p-3 rounded-full shrink-0 border border-white/10">
                            <Icon name="star" className="w-5 h-5 text-stone-300" />
                        </div>
                        <div>
                            <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Nakshatra (Constellation)</p>
                            <p className="text-white font-medium text-lg leading-snug">{panchang.nakshatra}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-red-950/20 rounded-2xl p-4 border border-red-500/20 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-red-400/70 uppercase tracking-widest mb-1 flex items-center gap-1"><Icon name="alert-circle" className="w-3 h-3" /> Rahu Kaal</p>
                            <p className="text-red-200 font-bold tracking-wider text-sm">{panchang.rahuKaal}</p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded uppercase tracking-widest border border-red-500/30">Inauspicious</span>
                    </div>

                    <div className="bg-orange-950/20 rounded-2xl p-4 border border-orange-500/20 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-orange-400/70 uppercase tracking-widest mb-1 flex items-center gap-1"><Icon name="clock" className="w-3 h-3" /> Yama Ganda</p>
                            <p className="text-orange-200 font-bold tracking-wider text-sm">{panchang.yamaGanda}</p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-300 rounded uppercase tracking-widest border border-orange-500/30">Avoid strictly</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
