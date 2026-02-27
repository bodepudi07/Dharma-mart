import React, { useRef, useState, useEffect } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { Icon } from './Icon';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = [
    { id: 'all', label: 'All', emoji: '🪔', color: 'from-amber-500 to-orange-600' },
    { id: 'kit', label: 'Puja Kits', emoji: '📿', color: 'from-purple-500 to-indigo-600' },
    { id: 'essential', label: 'Essentials', emoji: '🌿', color: 'from-green-500 to-emerald-600' },
    { id: 'accessory', label: 'Sacred Items', emoji: '⚱️', color: 'from-yellow-500 to-amber-600' },
    { id: 'eco', label: 'Eco-Seva', emoji: '🌍', color: 'from-teal-500 to-cyan-600' },
];

const SORT_OPTIONS = [
    { value: 'relevance', label: '⭐ Most Relevant' },
    { value: 'price_asc', label: '↑ Price: Low to High' },
    { value: 'price_desc', label: '↓ Price: High to Low' },
];

const RARITY_LABELS: Record<number, { label: string; color: string }> = {
    10: { label: 'DIVINE', color: 'from-yellow-400 to-amber-500 text-black' },
    9: { label: 'REVERED', color: 'from-purple-500 to-indigo-600 text-white' },
    8: { label: 'SACRED', color: 'from-primary to-orange-700 text-white' },
    7: { label: 'BLESSED', color: 'from-green-500 to-emerald-600 text-white' },
};

export const AIShopper = ({ onClose }: { onClose: () => void }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef);
    const { addToast } = useToast();
    const { currentUser } = useAuth();
    const { openModal } = useModal();
    const [isPurchasing, setIsPurchasing] = useState<number | null>(null);
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('relevance');
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [cartCount, setCartCount] = useState(0);
    const [addedToCart, setAddedToCart] = useState<Set<number>>(new Set());

    const products = [
        { id: 1, name: "Smart Puja Kit (Basic)", price: 501, originalPrice: 699, desc: "Auto-suggested samagri for daily rituals.", type: "kit", relevance: 9, imageUrl: "https://picsum.photos/seed/pujakit1/800/600", detailedDesc: "Contains haldi, kumkum, akshata, camphor, incense sticks, and a small brass diya. Perfect for everyday home puja.", tag: "Best Seller" },
        { id: 2, name: "Pure A2 Ghee (1L)", price: 1200, originalPrice: 1500, desc: "Lab-tested purity delivered to your doorstep.", type: "essential", relevance: 8, imageUrl: "https://picsum.photos/seed/ghee2/800/600", detailedDesc: "100% pure A2 cow ghee made using the traditional bilona method. Ideal for deepam and naivedyam.", tag: "Top Rated" },
        { id: 3, name: "Organic Kumkum & Camphor", price: 251, originalPrice: 320, desc: "100% natural, chemical-free formulation.", type: "essential", relevance: 7, imageUrl: "https://picsum.photos/seed/kumkum3/800/600", detailedDesc: "Sourced from organic farms. The camphor burns completely without leaving any black residue.", tag: null },
        { id: 4, name: "Satyanarayana Swamy Vratham Kit", price: 1101, originalPrice: 1400, desc: "Complete kit with idol, patri, and all samagri.", type: "kit", relevance: 10, imageUrl: "https://picsum.photos/seed/vratham4/800/600", detailedDesc: "Includes a beautiful photo frame, navagraha vastram, kalasham, and 40+ items required for the vratham.", tag: "Divine Pick" },
        { id: 5, name: "Griha Pravesham Kit", price: 2501, originalPrice: 3200, desc: "Everything for a perfect housewarming ceremony.", type: "kit", relevance: 8, imageUrl: "https://picsum.photos/seed/griha5/800/600", detailedDesc: "A comprehensive kit featuring homa samagri, navaratnas, panchaloha, and a detailed instruction manual.", tag: null },
        { id: 6, name: "Navagraha Shanti Homa Kit", price: 1501, originalPrice: 1800, desc: "Specific wood, grains & samagri for 9 planets.", type: "kit", relevance: 7, imageUrl: "https://picsum.photos/seed/navagraha6/800/600", detailedDesc: "Contains 9 types of samidha (wood), 9 types of grains (navadhanya), and specific vastrams for each graha.", tag: null },
        { id: 7, name: "Premium Agarbatti Set (4 Fragrances)", price: 351, originalPrice: 450, desc: "Hand-rolled, charcoal-free incense sticks.", type: "essential", relevance: 6, imageUrl: "https://picsum.photos/seed/agarbatti7/800/600", detailedDesc: "A set of 4 fragrances: Sandalwood, Jasmine, Rose, and Lavender. Long-lasting and soothing.", tag: null },
        { id: 8, name: "Brass Diya Set (Pair)", price: 851, originalPrice: 1100, desc: "Heavy brass traditional oil lamps, hand-crafted.", type: "accessory", relevance: 5, imageUrl: "https://picsum.photos/seed/diya8/800/600", detailedDesc: "Exquisitely crafted 6-inch brass diyas. Heavy base ensures stability. Perfect for daily aarti.", tag: null },
        { id: 9, name: "Rudraksha Mala (108 beads)", price: 551, originalPrice: 800, desc: "Authentic 5 Mukhi Rudraksha from Nepal.", type: "accessory", relevance: 6, imageUrl: "https://picsum.photos/seed/rudraksha9/800/600", detailedDesc: "Lab-certified authentic 5-mukhi rudraksha beads strung in traditional red thread with a sumeru bead.", tag: "Authenticated" },
        { id: 10, name: "Eco-Devotion Waste Collection", price: 299, originalPrice: 399, desc: "Monthly pickup of home floral waste. Keep rivers clean.", type: "eco", relevance: 10, imageUrl: "https://picsum.photos/seed/ecofloral10/800/600", detailedDesc: "We collect your used pooja flowers and organic waste weekly to upcycle them into compost and incense.", tag: "Eco Hero" },
        { id: 11, name: "Sacred Floral Compost (5kg)", price: 350, originalPrice: 450, desc: "Compost from upcycled temple flowers.", type: "eco", relevance: 9, imageUrl: "https://picsum.photos/seed/compost11/800/600", detailedDesc: "Premium organic compost made entirely from sacred flowers offered at local temples. Perfect for your home garden.", tag: null },
        { id: 12, name: "Homa Bhasma Briquettes (1kg)", price: 251, originalPrice: 320, desc: "Eco-friendly ash & cow dung fuel briquettes.", type: "eco", relevance: 8, imageUrl: "https://picsum.photos/seed/bhasma12/800/600", detailedDesc: "Sustainable, slow-burning briquettes made from Vedic homa bhasma and cow dung. Ideal for dhoop and purification.", tag: null },
    ];


    const filteredProducts = products
        .filter(p => filterType === 'all' || p.type === filterType)
        .sort((a, b) => {
            if (sortBy === 'price_asc') return a.price - b.price;
            if (sortBy === 'price_desc') return b.price - a.price;
            return b.relevance - a.relevance;
        });

    const handleAddToCart = (product: typeof products[0]) => {
        if (!currentUser) { openModal('login'); return; }
        if (addedToCart.has(product.id)) return;
        setAddedToCart(prev => new Set(prev).add(product.id));
        setCartCount(c => c + 1);
        addToast(`${product.name} added to cart!`, 'success');
    };

    const handlePurchase = (product: typeof products[0]) => {
        if (!currentUser) { openModal('login'); return; }
        setIsPurchasing(product.id);
        setTimeout(() => {
            addToast(`🙏 ${product.name} ordered successfully! Delivery in 2-3 days.`, 'success');
            setIsPurchasing(null);
            onClose();
        }, 1800);
    };

    const rarityInfo = (relevance: number) => RARITY_LABELS[relevance] || RARITY_LABELS[7];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(180,83,9,0.3) 0%, rgba(0,0,0,0.85) 60%)' }}
            onClick={onClose}
        >
            <motion.div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-6xl rounded-3xl overflow-hidden flex flex-col max-h-[95vh] shadow-[0_0_80px_rgba(180,83,9,0.4)]"
                style={{
                    background: 'linear-gradient(145deg, #0f0a05 0%, #1a0f05 40%, #0d0d12 100%)',
                    border: '1px solid rgba(180,83,9,0.3)',
                }}
            >
                {/* Animated background glow */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-900/20 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-900/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                    {/* Grid lines */}
                    <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(180,83,9,1)" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                {/* Header */}
                <div className="relative z-10 shrink-0 px-6 pt-6 pb-4 border-b border-white/5">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all text-lg font-bold z-10"
                    >
                        ✕
                    </button>
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #B45309, #D97706)' }}>
                                <Icon name="shopping-bag" className="w-7 h-7 text-white" />
                            </div>
                            <div className="absolute -inset-1 rounded-2xl opacity-40 blur-md" style={{ background: 'linear-gradient(135deg, #B45309, #D97706)' }} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-bold text-white tracking-tight font-serif">Dharma Mart</h2>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase" style={{ background: 'linear-gradient(90deg, #B45309, #D97706)', color: 'white' }}>PREMIUM</span>
                            </div>
                            <p className="text-white/40 text-sm mt-0.5">Sacred goods • Pure & AI-curated • Delivered with devotion</p>
                        </div>
                        {cartCount > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white border border-orange-500/30"
                                style={{ background: 'rgba(180,83,9,0.2)' }}
                            >
                                🛒 {cartCount} item{cartCount > 1 ? 's' : ''}
                            </motion.div>
                        )}
                    </div>

                    {/* Category filters */}
                    <div className="flex gap-2 mt-5 overflow-x-auto pb-1">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setFilterType(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${filterType === cat.id
                                    ? 'text-white scale-105 shadow-lg'
                                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-white/10'
                                    }`}
                                style={filterType === cat.id ? { background: `linear-gradient(135deg, ${cat.color.replace('from-', '').replace('to-', ', ')})` } : {}}
                            >
                                <span>{cat.emoji}</span>
                                <span className="tracking-wide uppercase">{cat.label}</span>
                            </button>
                        ))}
                        <div className="ml-auto pl-4 shrink-0">
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="text-xs font-bold px-3 py-2 rounded-full border border-white/10 bg-white/5 text-white/60 outline-none cursor-pointer"
                            >
                                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="relative z-10 overflow-y-auto flex-1 p-5">
                    <motion.div
                        layout
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredProducts.map((product, i) => {
                                const rarity = rarityInfo(product.relevance);
                                const isHovered = hoveredId === product.id;
                                const inCart = addedToCart.has(product.id);
                                const isBuying = isPurchasing === product.id;
                                const discount = Math.round((1 - product.price / product.originalPrice) * 100);

                                return (
                                    <motion.div
                                        key={product.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: i * 0.04, duration: 0.3 }}
                                        onMouseEnter={() => setHoveredId(product.id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        className="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer"
                                        style={{
                                            background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                                            border: isHovered ? '1px solid rgba(180,83,9,0.6)' : '1px solid rgba(255,255,255,0.07)',
                                            boxShadow: isHovered ? '0 0 30px rgba(180,83,9,0.25), inset 0 0 20px rgba(180,83,9,0.05)' : '0 4px 20px rgba(0,0,0,0.4)',
                                            transition: 'all 0.3s ease',
                                        }}
                                    >
                                        {/* Image section */}
                                        <div className="relative h-44 overflow-hidden bg-black/30">
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115"
                                                style={{ transform: isHovered ? 'scale(1.12)' : 'scale(1)' }}
                                            />
                                            {/* Dark overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                                            {/* Rarity Badge */}
                                            <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase bg-gradient-to-r ${rarity.color} shadow-lg`}>
                                                {rarity.label}
                                            </div>

                                            {/* Discount badge */}
                                            {discount > 0 && (
                                                <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-[9px] font-black bg-red-500/90 text-white tracking-wide">
                                                    -{discount}%
                                                </div>
                                            )}

                                            {/* Bottom tag */}
                                            <div className="absolute bottom-3 left-3 right-3">
                                                {product.tag && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 backdrop-blur-sm">
                                                        ✦ {product.tag}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Hover reveal description */}
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: isHovered ? 1 : 0 }}
                                                className="absolute inset-0 flex items-end p-3"
                                                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)' }}
                                            >
                                                <p className="text-white/80 text-xs leading-relaxed">{product.detailedDesc}</p>
                                            </motion.div>
                                        </div>

                                        {/* Info section */}
                                        <div className="flex flex-col flex-grow p-4 gap-3">
                                            <div>
                                                <h3 className="font-bold text-white text-sm leading-tight line-clamp-2">{product.name}</h3>
                                                <p className="text-white/40 text-xs mt-1 line-clamp-1">{product.desc}</p>
                                            </div>

                                            <div className="mt-auto flex items-center justify-between">
                                                <div>
                                                    <span className="text-white font-black text-lg">₹{product.price}</span>
                                                    {product.originalPrice > product.price && (
                                                        <span className="text-white/30 text-xs ml-2 line-through">₹{product.originalPrice}</span>
                                                    )}
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => handleAddToCart(product)}
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all text-xs ${inCart
                                                            ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                                                            : 'bg-white/5 text-white/50 border border-white/10 hover:border-orange-500/50 hover:text-orange-400'
                                                            }`}
                                                    >
                                                        {inCart ? '✓' : '+'}
                                                    </button>
                                                    <button
                                                        onClick={() => handlePurchase(product)}
                                                        disabled={!!isPurchasing}
                                                        className="px-4 py-2 rounded-full text-xs font-black tracking-wide text-white transition-all disabled:opacity-50 relative overflow-hidden"
                                                        style={{ background: 'linear-gradient(135deg, #B45309, #D97706)' }}
                                                    >
                                                        {isBuying ? (
                                                            <span className="flex items-center gap-1">
                                                                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                                Ordering
                                                            </span>
                                                        ) : 'Buy Now'}
                                                        {/* Shine effect */}
                                                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Left glow accent */}
                                        <motion.div
                                            animate={{ opacity: isHovered ? 1 : 0 }}
                                            className="absolute left-0 top-0 bottom-0 w-0.5 pointer-events-none"
                                            style={{ background: 'linear-gradient(to bottom, transparent, #B45309, transparent)' }}
                                        />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>

                    {filteredProducts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-white/30">
                            <div className="text-5xl mb-4">🙏</div>
                            <p className="text-lg font-semibold">No items in this category yet.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="relative z-10 shrink-0 px-6 py-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-white/30 text-xs">
                        <span>🔒 Secure Checkout</span>
                        <span>🚚 2-3 Day Delivery</span>
                        <span>🔄 Easy Returns</span>
                    </div>
                    <div className="text-white/20 text-xs">All products are purity-certified</div>
                </div>
            </motion.div>
        </div>
    );
};
