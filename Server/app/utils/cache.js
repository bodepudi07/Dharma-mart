import NodeCache from 'node-cache';

// Initialize cache with default TTL of 60 seconds and check period of 120 seconds
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

/**
 * Generic get or set function for caching
 * @param {string} key - Cache key
 * @param {function} fetchFn - Async function to fetch data if not in cache
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {Promise<any>} - Cached or fetched data
 */
export const getOrSet = async (key, fetchFn, ttl) => {
  const cachedData = cache.get(key);
  if (cachedData !== undefined) {
    return cachedData;
  }

  const fetchedData = await fetchFn();
  if (ttl) {
    cache.set(key, fetchedData, ttl);
  } else {
    cache.set(key, fetchedData);
  }

  return fetchedData;
};

/**
 * Invalidate a specific cache key
 * @param {string} key - Cache key to remove
 */
export const invalidate = (key) => {
  cache.del(key);
};

/**
 * Invalidate keys matching a pattern (prefix)
 * @param {string} prefix - Prefix to match
 */
export const invalidatePattern = (prefix) => {
  const keys = cache.keys();
  const keysToDelete = keys.filter(key => key.startsWith(prefix));
  if (keysToDelete.length > 0) {
    cache.del(keysToDelete);
  }
};

/**
 * Clear the entire cache
 */
export const clearCache = () => {
  cache.flushAll();
};

export default {
  getOrSet,
  invalidate,
  invalidatePattern,
  clearCache
};
