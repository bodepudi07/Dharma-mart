

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};


// --- Fuzzy Search Utilities ---

/**
 * Calculates the Levenshtein distance between two strings.
 * A measure of the difference between two sequences (number of edits to change one into the other).
 * @param s1 The first string.
 * @param s2 The second string.
 * @returns The Levenshtein distance.
 */
export const calculateLevenshteinDistance = (s1: string = '', s2: string = ''): number => {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const costs = new Array();
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
};

/**
 * Performs a fuzzy search on an array of objects.
 * @param items The array of items to search.
 * @param query The search query.
 * @param keys The keys within each item to search against.
 * @param maxDistance The maximum Levenshtein distance to be considered a match.
 * @returns A sorted array of items that match the query, including their match score.
 */
/**
 * Performs an improved fuzzy search on an array of objects.
 * Features: Prefix matching, weighted keys, phrase matching, and better scoring.
 * @param items The array of items to search.
 * @param query The search query.
 * @param keys The keys within each item to search against.
 * @param maxDistance The maximum Levenshtein distance to be considered a match (for word-level fallback).
 * @returns A sorted array of items that match the query, including their match score.
 */
/**
 * Calculates estimated travel time in minutes.
 * @param distanceKm Distance in kilometers.
 * @param averageSpeedKmh Average speed in km/h (default 40 for city/traffic).
 * @returns Estimated time in minutes.
 */
export const calculateTravelTime = (distanceKm: number, averageSpeedKmh: number = 40): number => {
  if (distanceKm <= 0) return 0;
  return Math.round((distanceKm / averageSpeedKmh) * 60);
};

export const fuzzySearch = <T extends object>(
  items: T[],
  query: string,
  keys: (keyof T)[],
  maxDistance = 2
): { item: T; score: number }[] => {
  if (!query || query.trim() === '') {
    return items.map(item => ({ item, score: 0 }));
  }

  const trimmedQuery = query.trim().toLowerCase();
  const results: { item: T; score: number }[] = [];

  // Weights for different keys to prioritize certain fields
  const weights: Record<string, number> = {
    name: 2.0,
    deity: 1.5,
    location: 1.2,
    tags: 1.0
  };

  items.forEach(item => {
    let totalScore = 0;

    for (const key of keys) {
      const value = item[key];
      const weight = weights[key as string] || 1.0;

      if (typeof value === 'string') {
        const fieldValue = value.toLowerCase();
        const fieldWords = fieldValue.split(/[\s,.-]+/);

        // 1. Exact Full Match (Highest Boost)
        if (fieldValue === trimmedQuery) {
          totalScore += 100 * weight;
        }
        // 2. Phrase Match
        else if (fieldValue.includes(trimmedQuery)) {
          totalScore += 40 * weight;
          if (fieldValue.startsWith(trimmedQuery)) {
            totalScore += 20 * weight; // Starts with query boost
          }
        }

        // 3. Word-level Matching
        fieldWords.forEach(word => {
          if (word === trimmedQuery) {
            totalScore += 50 * weight; // Exact word match
          } else if (word.startsWith(trimmedQuery)) {
            totalScore += 25 * weight; // Word prefix match
          } else if (trimmedQuery.length > 3 && word.includes(trimmedQuery)) {
            totalScore += 10 * weight; // Substring match
          }

          // 4. Typo Tolerance (Levenshtein)
          if (trimmedQuery.length > 3 && Math.abs(word.length - trimmedQuery.length) <= maxDistance) {
            const distance = calculateLevenshteinDistance(trimmedQuery, word);
            if (distance > 0 && distance <= maxDistance) {
              // Inverse distance score: closer match = higher score
              totalScore += (maxDistance - distance + 1) * 5 * weight;
            }
          }
        });
      } else if (Array.isArray(value)) {
        // Handle array fields (like tags)
        value.forEach(val => {
          if (typeof val === 'string') {
            const lowerVal = val.toLowerCase();
            if (lowerVal === trimmedQuery) {
              totalScore += 60 * weight;
            } else if (lowerVal.includes(trimmedQuery)) {
              totalScore += 30 * weight;
            }
          }
        });
      }
    }

    if (totalScore > 0) {
      results.push({ item, score: totalScore });
    }
  });

  // Sort by score (descending)
  return results.sort((a, b) => b.score - a.score);
};