
import React, { useRef } from 'react';
import { useInView } from '../hooks/useInView';

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  id: string;
  onViewAll?: () => void;
  viewAllText?: string;
}

export const Section = ({ title, icon, children, id, onViewAll, viewAllText }: SectionProps) => {
  const titleRef = useRef<HTMLDivElement>(null);
  const isVisible = useInView(titleRef as React.RefObject<Element>, { once: true, threshold: 0.5 });

  return (
    <section id={id} className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div
            ref={titleRef}
            className={`flex items-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <div className="p-3 bg-primary/5 rounded-2xl text-primary mr-4 shadow-sm">{icon}</div>
            <div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-ink tracking-tight leading-none">{title}</h2>
              <div className="h-1 w-12 bg-primary/20 mt-3 rounded-full"></div>
            </div>
          </div>
          {onViewAll && viewAllText && (
            <button
              onClick={onViewAll}
              className="group flex items-center gap-2 text-stone-500 font-medium hover:text-primary transition-colors text-sm md:text-base"
            >
              <span className="border-b border-stone-200 group-hover:border-primary pb-0.5 transition-colors">{viewAllText}</span>
              <span className="transform group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>
          )}
        </div>
        <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {children}
        </div>
      </div>
    </section>
  );
};
