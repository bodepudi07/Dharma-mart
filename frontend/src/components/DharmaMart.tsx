import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';
import { I18nContent, Language } from '../types';

interface Product {
    id: string | number;
    name: string;
    price: number;
    originalPrice?: number;
    desc: string;
    type: string;
    imageUrl: string;
    tag?: string | null;
    featured?: boolean;
}

export const DharmaMart = ({ t, language }: { t: I18nContent, language: Language }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<any[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                let url = '/data/products.json';
                if (language === Language.HI) url = '/data/products.hi.json';
                if (language === Language.TE) url = '/data/products.te.json';
                
                const response = await fetch(url);
                const data = await response.json();
                setProducts(data);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [language]);

    const categories = ['All', ...Array.from(new Set(products.map(p => p.type)))];
    
    const filteredProducts = selectedCategory === 'All' 
        ? products 
        : products.filter(p => p.type === selectedCategory);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const updateQuantity = (id: string | number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQuantity = item.quantity + delta;
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleCheckout = () => {
        setIsCheckingOut(true);
        setTimeout(() => {
            setCart([]);
            setIsCheckingOut(false);
            setIsCartOpen(false);
            alert("Divine order placed successfully! May blessings be with you.");
        }, 1500);
    };

    return (
        <div className="relative min-h-[80vh] bg-paper animate-fade-in pb-12">
            {/* Header Section */}
            <div className="relative h-64 md:h-80 overflow-hidden mb-12">
                <div className="absolute inset-0 bg-stone-900">
                    <img src="https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&w=1600&q=80" alt="Dharma Mart Banner" className="w-full h-full object-cover opacity-40 mix-blend-overlay" />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-paper to-transparent"></div>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                    <div className="bg-white/10 p-4 rounded-full backdrop-blur-md border border-white/20 mb-4 inline-flex animate-float shadow-2xl">
                        <Icon name="package" className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(234,88,12,0.8)]" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-serif text-white font-bold drop-shadow-lg mb-4">{t.navMart || "Dharma Mart"}</h1>
                    <p className="text-amber-100 text-lg md:text-xl font-light tracking-wide max-w-2xl text-shadow-sm">Sacred artifacts and pooja essentials curated for your spiritual journey.</p>
                </div>
            </div>

            <div className="container mx-auto px-4 lg:px-8">
                {/* Utilities Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto hide-scrollbar pb-2">
                        {categories.map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap shadow-sm ${selectedCategory === cat ? 'bg-primary text-white shadow-primary/30 border-transparent' : 'bg-white text-stone-600 border border-stone-200 hover:border-primary/50 hover:text-primary'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={() => setIsCartOpen(true)}
                        className="relative bg-white border border-stone-200 shadow-md text-stone-800 px-6 py-3 rounded-full font-bold flex items-center gap-3 hover:shadow-lg hover:border-primary/50 transition-all group"
                    >
                        <Icon name="shopping-bag" className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                        Cart
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full animate-bounce shadow-md">
                                {cart.reduce((a, b) => a + b.quantity, 0)}
                            </span>
                        )}
                    </button>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredProducts.map((product, idx) => (
                        <motion.div 
                            key={product.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="bg-white rounded-[2rem] overflow-hidden border border-stone-100 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(234,88,12,0.15)] hover:border-primary/30 transition-all duration-300 group flex flex-col"
                        >
                            <div className="relative h-56 overflow-hidden">
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                {product.featured && (
                                    <span className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-sm shadow-orange-500/30">
                                        Best Seller
                                    </span>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                            
                            <div className="p-6 flex flex-col flex-1">
                                <span className="text-xs font-bold text-primary uppercase tracking-widest mb-2 block">{product.type}</span>
                                <h3 className="font-serif font-bold text-lg text-ink mb-2 leading-tight flex-1">{product.name}</h3>
                                <p className="text-stone-500 text-sm mb-6 line-clamp-2">{product.desc}</p>
                                
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-stone-100">
                                    <p className="font-bold text-xl text-stone-800 flex items-center gap-1">
                                        <span className="text-sm">₹</span>{product.price.toLocaleString('en-IN')}
                                    </p>
                                    <button 
                                        onClick={() => addToCart(product)}
                                        className="bg-stone-100 hover:bg-primary hover:text-white text-stone-700 w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm"
                                        aria-label="Add to cart"
                                    >
                                        <Icon name="plus" className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Shopping Cart Sidebar Overlay */}
            <AnimatePresence>
                {isCartOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCartOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-[0_0_50px_rgba(0,0,0,0.3)] z-50 flex flex-col border-l border-stone-200"
                        >
                            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/80 backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <Icon name="shopping-bag" className="w-6 h-6" />
                                    </div>
                                    <h2 className="font-serif font-bold text-xl text-ink">My Cart</h2>
                                </div>
                                <button onClick={() => setIsCartOpen(false)} className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-200 rounded-full transition-colors">
                                    <Icon name="x" className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-stone-400 gap-4">
                                        <Icon name="package" className="w-16 h-16 opacity-20" />
                                        <p className="font-medium text-lg">Your cart is empty.</p>
                                        <button onClick={() => setIsCartOpen(false)} className="text-primary font-bold hover:underline">Continue Shopping</button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {cart.map(item => (
                                            <div key={item.id} className="flex gap-4 bg-stone-50 p-3 rounded-2xl border border-stone-100 relative group">
                                                <img src={item.imageUrl} alt={item.name} className="w-20 h-20 rounded-xl object-cover shadow-sm" />
                                                <div className="flex-1 flex flex-col justify-between py-1 pr-2">
                                                    <div>
                                                        <h4 className="font-semibold text-stone-800 text-sm leading-tight mb-1 pr-6">{item.name}</h4>
                                                        <p className="text-primary font-bold text-sm">₹{item.price.toLocaleString('en-IN')}</p>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-3 bg-white w-fit px-2 py-1 rounded-lg border border-stone-200 mt-2">
                                                        <button onClick={() => updateQuantity(item.id, -1)} className="text-stone-400 hover:text-primary transition-colors disabled:opacity-30 flex items-center justify-center p-1" disabled={item.quantity <= 1}>
                                                            <span className="font-bold text-lg leading-none mt-[-2px]">-</span>
                                                        </button>
                                                        <span className="text-sm font-bold text-stone-700 w-4 text-center">{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.id, 1)} className="text-stone-400 hover:text-primary transition-colors">
                                                            <Icon name="plus" className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <button 
                                                    onClick={() => updateQuantity(item.id, -item.quantity)} 
                                                    className="absolute top-3 right-3 text-stone-300 hover:text-red-500 transition-colors bg-white rounded-full p-1 border border-stone-200 shadow-sm opacity-0 group-hover:opacity-100"
                                                    title="Remove item"
                                                >
                                                    <Icon name="trash" className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {cart.length > 0 && (
                                <div className="border-t border-stone-100 p-6 bg-stone-50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-stone-500 font-medium">Subtotal</span>
                                        <span className="font-bold text-stone-800">₹{cartTotal.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-stone-500 font-medium text-sm">Shipping</span>
                                        <span className="text-green-600 font-bold text-sm tracking-wide">Free of Charge</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-6 border-t border-stone-200 pt-4">
                                        <span className="text-lg font-serif font-bold text-stone-800">Total</span>
                                        <span className="text-2xl font-bold text-primary">₹{cartTotal.toLocaleString('en-IN')}</span>
                                    </div>
                                    
                                    <button 
                                        onClick={handleCheckout}
                                        disabled={isCheckingOut}
                                        className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-4 rounded-xl shadow-[0_5px_15px_rgba(234,88,12,0.3)] hover:shadow-[0_8px_25px_rgba(234,88,12,0.4)] hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isCheckingOut ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Proceed to Checkout</span>
                                                <Icon name="chevron-right" className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
