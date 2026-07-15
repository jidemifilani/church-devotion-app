import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cached-query:';

/**
 * AsyncStorage cache-first + background refresh. Shows the last-known value
 * immediately (if any), then refetches; on refetch failure (e.g. offline)
 * the stale cached value is kept rather than cleared.
 */
export function useCachedQuery<T>(cacheKey: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const storageKey = CACHE_PREFIX + cacheKey;

  const refetch = useCallback(async () => {
    try {
      const fresh = await fetcherRef.current();
      setData(fresh);
      AsyncStorage.setItem(storageKey, JSON.stringify(fresh)).catch(() => {});
    } catch {
      // offline or request failed — keep showing whatever's already cached
    } finally {
      setLoading(false);
    }
  }, [storageKey]);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey).then((cached) => {
      if (cached && active) {
        setData(JSON.parse(cached));
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [storageKey]);

  return { data, loading, refetch };
}
