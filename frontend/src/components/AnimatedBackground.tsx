import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

const PARTICLE_COUNT = 50;

export const AnimatedBackground = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20; // -10 to 10
            const y = (e.clientY / window.innerHeight - 0.5) * 20;
            setMousePosition({ x, y });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
            {/* Background Image Layer with Parallax */}
            <motion.div
                className="absolute inset-[-5%] w-[110%] h-[110%] bg-cover bg-center transition-opacity duration-1000"
                animate={{
                    x: mousePosition.x * -1,
                    y: mousePosition.y * -1,
                }}
                transition={{ type: "spring", stiffness: 50, damping: 30 }}
                style={{
                    backgroundImage: `var(--background-image)`,
                    opacity: `var(--background-opacity)`
                }}
            />

            {/* Ambient Cosmic Glows */}
            <motion.div
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] mix-blend-screen"
                animate={{
                    x: mousePosition.x * 2,
                    y: mousePosition.y * 2,
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] mix-blend-screen"
                animate={{
                    x: mousePosition.x * -2,
                    y: mousePosition.y * -2,
                    scale: [1.2, 1, 1.2],
                    opacity: [0.2, 0.5, 0.2],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Mouse Tracker Aura */}
            <motion.div
                className="absolute w-64 h-64 bg-primary/10 rounded-full blur-[80px] -ml-32 -mt-32 mix-blend-screen"
                animate={{
                    left: `${(mousePosition.x / 20 + 0.5) * 100}%`,
                    top: `${(mousePosition.y / 20 + 0.5) * 100}%`,
                }}
                transition={{ type: "spring", stiffness: 100, damping: 25, mass: 0.5 }}
            />

            {/* Interactive Particle Layer */}
            <div className="absolute inset-0">
                {[...Array(PARTICLE_COUNT)].map((_, i) => {
                    const size = Math.random() * 4 + 1;
                    const duration = Math.random() * 15 + 10;
                    const delay = Math.random() * duration;
                    const left = Math.random() * 100;
                    const depth = Math.random(); // For parallax speed
                    const hue = Math.random() > 0.5 ? 'var(--color-primary)' : 'var(--color-secondary)';

                    return (
                        <motion.div
                            key={i}
                            className="absolute rounded-full"
                            style={{
                                width: `${size}px`,
                                height: `${size}px`,
                                left: `${left}%`,
                                background: `radial-gradient(circle, ${hue} 0%, transparent 80%)`,
                                boxShadow: `0 0 ${size * 2}px ${hue}`,
                                top: '100%',
                            }}
                            animate={{
                                y: ['0vh', '-120vh'],
                                x: [mousePosition.x * depth * 5, mousePosition.x * depth * 15],
                                opacity: [0, 0.8, 0],
                                scale: [0, 1, 0.5]
                            }}
                            transition={{
                                y: { duration: duration, repeat: Infinity, ease: "linear", delay: -delay },
                                x: { type: "spring", stiffness: 20 },
                                opacity: { duration: duration, repeat: Infinity, ease: "easeInOut", delay: -delay },
                                scale: { duration: duration, repeat: Infinity, ease: "easeInOut", delay: -delay }
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
};
