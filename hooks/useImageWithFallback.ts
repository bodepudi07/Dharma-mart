import { useState, useEffect, useCallback } from 'react';
import { getItemFallbackImage, ItemImageType } from './useItemImage';

type ImageStatus = 'loading' | 'loaded' | 'error';

/**
 * A custom hook to reliably handle image source fallbacks with loading states.
 * @param defaultSrc The primary image URL.
 * @param fallbackSrc The URL to use if the primary one fails.
 * @param itemName The name of the item to generate a unique SVG for.
 * @param itemType The type of item (temple, pooja, event, etc).
 */
export const useImageWithFallback = (defaultSrc: string, fallbackSrc: string, itemName: string = 'Spiritual Item', itemType: ItemImageType = 'general') => {
  const [status, setStatus] = useState<ImageStatus>('loading');
  const [currentSrc, setCurrentSrc] = useState(defaultSrc || fallbackSrc || '');
  const [attempt, setAttempt] = useState(0); // 0=primary, 1=fallback, 2=ultimate

  useEffect(() => {
    setStatus('loading');
    setAttempt(0);
    setCurrentSrc(defaultSrc || fallbackSrc || '');
    // If both are empty initially, jump straight to ultimate fallback
    if (!defaultSrc && !fallbackSrc) {
      setCurrentSrc(getItemFallbackImage(itemName, itemType));
    }
  }, [defaultSrc, fallbackSrc, itemName, itemType]);

  const onLoad = useCallback(() => {
    setStatus('loaded');
  }, []);

  const onError = useCallback(() => {
    setAttempt(prev => {
      const next = prev + 1;
      if (next === 1 && fallbackSrc && fallbackSrc !== currentSrc) {
        setCurrentSrc(fallbackSrc);
        setStatus('loading');
      } else if (next === 2) {
        // Use a beautiful inline SVG - never fails
        setCurrentSrc(getItemFallbackImage(itemName, itemType));
        setStatus('loading');
      } else {
        setStatus('error');
      }
      return next;
    });
  }, [currentSrc, fallbackSrc]);

  return { imgSrc: currentSrc, status, onLoad, onError };
};
