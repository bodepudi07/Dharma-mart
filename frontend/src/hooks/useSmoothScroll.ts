import { useEffect, useRef } from 'react';

/**
 * Custom hook to normalise scroll behavior and create smooth decay scroll (lerping).
 * This simulates premium smooth scroll libraries (like Lenis) without adding extra bundle weight.
 */
export const useSmoothScroll = (active: boolean = true) => {
  const currentScrollY = useRef(0);
  const targetScrollY = useRef(0);
  const isScrolling = useRef(false);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;

    // Synchronize initial targets
    currentScrollY.current = window.scrollY;
    targetScrollY.current = window.scrollY;

    const handleWheel = (e: WheelEvent) => {
      // Bypasses if user scrolls inside scrollable modals or code blocks
      const path = e.composedPath() as HTMLElement[];
      const isModal = path.some(el => 
        el.classList && (
          el.classList.contains('overflow-y-auto') || 
          el.classList.contains('overflow-auto') ||
          el.getAttribute('role') === 'dialog'
        ) && el !== document.documentElement && el !== document.body
      );

      if (isModal) return;

      e.preventDefault();

      // Damping modifier to match Awwwards decay rates
      const speedModifier = 0.85;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      
      targetScrollY.current = Math.max(
        0,
        Math.min(maxScroll, targetScrollY.current + e.deltaY * speedModifier)
      );

      if (!isScrolling.current) {
        isScrolling.current = true;
        animate();
      }
    };

    const animate = () => {
      // Linear interpolation (lerp factor: 0.075 for soft inertia decay)
      const lerpFactor = 0.075;
      const diff = targetScrollY.current - currentScrollY.current;
      
      currentScrollY.current += diff * lerpFactor;

      // Snapping threshold
      if (Math.abs(diff) < 0.2) {
        currentScrollY.current = targetScrollY.current;
        isScrolling.current = false;
        window.scrollTo(0, currentScrollY.current);
        if (rafId.current) cancelAnimationFrame(rafId.current);
        return;
      }

      window.scrollTo(0, currentScrollY.current);
      rafId.current = requestAnimationFrame(animate);
    };

    // Listen to external scroll adjustments (e.g. click coordinates, view updates)
    const handleScrollSync = () => {
      if (!isScrolling.current) {
        currentScrollY.current = window.scrollY;
        targetScrollY.current = window.scrollY;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScrollSync);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScrollSync);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [active]);
};
export default useSmoothScroll;
