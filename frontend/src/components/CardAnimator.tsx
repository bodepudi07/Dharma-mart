
import React, { useRef, useState } from 'react';
import { useInView } from '../hooks/useInView';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

interface CardAnimatorProps {
  children: React.ReactNode;
}

export const CardAnimator = ({ children }: CardAnimatorProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useInView(ref as React.RefObject<Element>, { once: true, threshold: 0.1 });

  // 3D Parallax Tilt state
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["100%", "0%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["100%", "0%"]);
  const glareOpacity = useTransform(mouseXSpring, [-0.5, 0.5], [0, 0.8]);

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`relative h-full text-left perspective-1000 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div
        className="h-full w-full block transition-transform duration-300"
        style={{ transform: isHovered ? "translateZ(30px)" : "translateZ(0px)" }}
      >
        {children}

        {/* Dynamic Glare Overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-3xl z-50 overflow-hidden mix-blend-overlay"
          style={{
            background: `radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`,
            left: glareX,
            top: glareY,
            width: '200%',
            height: '200%',
            transform: 'translate(-50%, -50%)',
            opacity: isHovered ? glareOpacity : 0,
            transition: 'opacity 0.3s ease'
          }}
        />
      </div>
    </motion.div>
  );
};
