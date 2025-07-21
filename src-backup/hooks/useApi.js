import { useState, useCallback } from 'react';
import { handleError } from '../utils';

export const useApi = (apiFunction) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction(...args);
      
      if (result.success) {
        setData(result.data);
        return result;
      } else {
        const errorMessage = result.error || '予期しないエラーが発生しました';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = handleError(err, 'API呼び出し');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
};

export const useApiWithCache = (apiFunction, cacheKey) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState(new Map());

  const execute = useCallback(async (...args) => {
    const key = cacheKey ? cacheKey(...args) : JSON.stringify(args);
    
    // キャッシュから取得
    if (cache.has(key)) {
      const cachedData = cache.get(key);
      setData(cachedData);
      return { success: true, data: cachedData, fromCache: true };
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction(...args);
      
      if (result.success) {
        setData(result.data);
        // キャッシュに保存
        setCache(prev => new Map(prev).set(key, result.data));
        return result;
      } else {
        const errorMessage = result.error || '予期しないエラーが発生しました';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = handleError(err, 'API呼び出し');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [apiFunction, cacheKey, cache]);

  const invalidateCache = useCallback((key) => {
    if (key) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
    } else {
      setCache(new Map());
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    invalidateCache,
    reset
  };
};

export const usePolling = (apiFunction, interval = 5000, enabled = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  const startPolling = useCallback(async () => {
    if (!enabled || isPolling) return;

    setIsPolling(true);
    
    const poll = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await apiFunction();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'ポーリングエラー');
        }
      } catch (err) {
        setError(handleError(err, 'ポーリング'));
      } finally {
        setLoading(false);
      }
    };

    // 初回実行
    await poll();

    // 定期的に実行
    const intervalId = setInterval(poll, interval);

    return () => {
      clearInterval(intervalId);
      setIsPolling(false);
    };
  }, [apiFunction, interval, enabled, isPolling]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
    setIsPolling(false);
  }, []);

  return {
    data,
    loading,
    error,
    isPolling,
    startPolling,
    stopPolling,
    reset
  };
}; 