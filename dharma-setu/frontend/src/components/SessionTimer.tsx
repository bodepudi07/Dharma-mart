import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from './Icon';

export const SessionTimer: React.FC = () => {
  const { remainingMs, session } = useAuth();

  if (!session) return null;

  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

  const isUrgent = remainingMs < 30 * 60 * 1000; // Less than 30 minutes
  const isCritical = remainingMs < 10 * 60 * 1000; // Less than 10 minutes

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-bold transition-all duration-300 ${
        isCritical
          ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
          : isUrgent
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          : 'bg-stone-100 border-stone-200 text-stone-700'
      }`}
      title="Session time remaining"
    >
      <Icon
        name="clock"
        className={`w-3.5 h-3.5 ${
          isCritical ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-stone-500'
        }`}
      />
      <span>{pad(hours)}:{pad(minutes)}:{pad(seconds)}</span>
    </div>
  );
};
