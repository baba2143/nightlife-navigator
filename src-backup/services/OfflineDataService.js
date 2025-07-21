/**
 * Offline Data Service
 * Manages data availability and caching for offline functionality
 */

import NetInfo from '@react-native-netinfo/';
import { Platform } from 'react-native';

import DatabaseService from './DatabaseService';
import LocalStorageService from './LocalStorageService';
import DataSyncService from './DataSyncService';
import ConfigService from './ConfigService';
import LoggingService from './LoggingService';
import MonitoringManager from './MonitoringManager';

class OfflineDataService {
  constructor() {
    this.initialized = false;
    this.isOnline = true;
    this.offlineCapabilities = new Map();
    this.cachePolicies = new Map();
    this.priorityQueues = new Map();
    
    // Cache configuration
    this.defaultCacheTTL = 3600000; // 1 hour
    this.maxCacheSize = 100 * 1024 * 1024; // 100MB
    this.highPriorityCacheTTL = 86400000; // 24 hours
    this.lowPriorityCacheTTL = 1800000; // 30 minutes
    
    // Offline strategy configuration
    this.strategies = {
      'cache-first': this.cacheFirstStrategy.bind(this),
      'network-first': this.networkFirstStrategy.bind(this),
      'cache-only': this.cacheOnlyStrategy.bind(this),
      'network-only': this.networkOnlyStrategy.bind(this),
      'stale-while-revalidate': this.staleWhileRevalidateStrategy.bind(this),
    };
    
    // Statistics
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      networkRequests: 0,
      offlineRequests: 0,
      failedRequests: 0,
      bytesServedFromCache: 0,
      bytesFetchedFromNetwork: 0,
    };
    
    // Event listeners
    this.offlineListeners = new Set();
    this.netInfoUnsubscribe = null;
  }

  /**
   * Initialize offline data service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Setup network monitoring
      await this.setupNetworkMonitoring();
      
      // Setup offline capabilities
      this.setupOfflineCapabilities();
      
      // Setup cache policies
      this.setupCachePolicies();
      
      // Load offline data
      await this.loadOfflineData();
      
      // Setup cache maintenance
      this.setupCacheMaintenance();
      
      this.initialized = true;
      
      LoggingService.info('[OfflineDataService] Initialized', {
        isOnline: this.isOnline,
        offlineCapabilities: this.offlineCapabilities.size,
        cachePolicies: this.cachePolicies.size,
      });

    } catch (error) {
      LoggingService.error('[OfflineDataService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Setup network monitoring
   */
  async setupNetworkMonitoring() {
    try {
      // Get initial network state
      const netInfo = await NetInfo.fetch();
      this.isOnline = netInfo.isConnected && netInfo.isInternetReachable;
      
      // Listen for network changes
      this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
        const wasOnline = this.isOnline;
        this.isOnline = state.isConnected && state.isInternetReachable;
        
        LoggingService.debug('[OfflineDataService] Network state changed', {
          isOnline: this.isOnline,
          wasOnline,
          connectionType: state.type,
        });
        
        // Handle offline/online transitions
        if (wasOnline && !this.isOnline) {
          this.handleGoingOffline();
        } else if (!wasOnline && this.isOnline) {
          this.handleGoingOnline();
        }
        
        // Notify listeners
        this.notifyListeners('network_changed', { 
          isOnline: this.isOnline,
          connectionType: state.type,
        });
      });

    } catch (error) {
      LoggingService.error('[OfflineDataService] Failed to setup network monitoring', {
        error: error.message,
      });
    }
  }

  /**
   * Setup offline capabilities for different data types
   */
  setupOfflineCapabilities() {
    // Define what data should be available offline
    this.offlineCapabilities.set('venues', {
      priority: 'high',
      strategy: 'cache-first',
      syncOnConnect: true,
      maxAge: this.highPriorityCacheTTL,
      preloadCriteria: {
        userLocation: true,
        favorites: true,
        recentlyViewed: true,
      },
    });
    
    this.offlineCapabilities.set('user_profile', {
      priority: 'high',
      strategy: 'cache-first',
      syncOnConnect: true,
      maxAge: this.highPriorityCacheTTL,
    });
    
    this.offlineCapabilities.set('user_favorites', {
      priority: 'high',
      strategy: 'cache-first',
      syncOnConnect: true,
      maxAge: this.highPriorityCacheTTL,
    });
    
    this.offlineCapabilities.set('reviews', {
      priority: 'medium',
      strategy: 'stale-while-revalidate',
      syncOnConnect: true,
      maxAge: this.defaultCacheTTL,
    });
    
    this.offlineCapabilities.set('search_results', {
      priority: 'low',
      strategy: 'network-first',
      syncOnConnect: false,
      maxAge: this.lowPriorityCacheTTL,
    });
    
    this.offlineCapabilities.set('venue_images', {
      priority: 'medium',
      strategy: 'cache-first',
      syncOnConnect: false,
      maxAge: this.highPriorityCacheTTL * 7, // 1 week
    });

    LoggingService.debug('[OfflineDataService] Offline capabilities configured', {
      capabilities: Array.from(this.offlineCapabilities.keys()),
    });
  }

  /**
   * Setup cache policies
   */
  setupCachePolicies() {
    this.cachePolicies.set('high', {
      ttl: this.highPriorityCacheTTL,
      maxSize: this.maxCacheSize * 0.6, // 60% of total cache
      evictionPolicy: 'lru',
    });
    
    this.cachePolicies.set('medium', {
      ttl: this.defaultCacheTTL,
      maxSize: this.maxCacheSize * 0.3, // 30% of total cache
      evictionPolicy: 'lfu',
    });
    
    this.cachePolicies.set('low', {
      ttl: this.lowPriorityCacheTTL,
      maxSize: this.maxCacheSize * 0.1, // 10% of total cache
      evictionPolicy: 'fifo',
    });
  }

  /**
   * Load essential offline data
   */
  async loadOfflineData() {
    try {
      // Preload high-priority data when online
      if (this.isOnline) {
        await this.preloadCriticalData();
      }
      
      // Load cached data for immediate availability
      await this.loadCachedData();
      
      LoggingService.debug('[OfflineDataService] Offline data loaded');

    } catch (error) {
      LoggingService.error('[OfflineDataService] Failed to load offline data', {
        error: error.message,
      });
    }
  }

  /**
   * Preload critical data for offline use
   */
  async preloadCriticalData() {
    try {
      const criticalDataTypes = Array.from(this.offlineCapabilities.entries())
        .filter(([, config]) => config.priority === 'high')
        .map(([type]) => type);
      
      LoggingService.info('[OfflineDataService] Preloading critical data', {
        dataTypes: criticalDataTypes,
      });
      
      for (const dataType of criticalDataTypes) {
        try {
          await this.preloadDataType(dataType);
        } catch (error) {
          LoggingService.warn('[OfflineDataService] Failed to preload data type', {
            dataType,
            error: error.message,
          });
        }
      }

    } catch (error) {
      LoggingService.error('[OfflineDataService] Failed to preload critical data', {
        error: error.message,
      });
    }
  }

  /**
   * Preload specific data type
   */
  async preloadDataType(dataType) {
    const capability = this.offlineCapabilities.get(dataType);
    if (!capability) return;
    
    try {
      switch (dataType) {
        case 'user_profile':
          await this.preloadUserProfile();
          break;
          
        case 'user_favorites':
          await this.preloadUserFavorites();
          break;
          
        case 'venues':
          await this.preloadVenues();
          break;
          
        case 'reviews':
          await this.preloadReviews();
          break;
      }
      
      LoggingService.debug('[OfflineDataService] Data type preloaded', {
        dataType,
      });

    } catch (error) {
      LoggingService.error('[OfflineDataService] Failed to preload data type', {
        dataType,
        error: error.message,
      });
    }
  }

  /**
   * Preload user profile data
   */
  async preloadUserProfile() {
    // User profile should already be in local database
    const userProfile = await DatabaseService.findOne('users', 'is_deleted = 0');
    
    if (userProfile) {
      await this.setCacheData('user_profile', userProfile.id, userProfile, 'high');
    }
  }

  /**
   * Preload user favorites
   */
  async preloadUserFavorites() {
    const favorites = await DatabaseService.select('user_favorites', {
      where: 'is_deleted = 0',
      orderBy: 'created_at DESC',
    });
    
    for (const favorite of favorites) {
      await this.setCacheData('user_favorites', favorite.id, favorite, 'high');
    }
    
    // Also preload venue details for favorites
    for (const favorite of favorites) {
      const venue = await DatabaseService.findOne('venues', 'id = ? AND is_deleted = 0', [favorite.venue_id]);
      if (venue) {
        await this.setCacheData('venues', venue.id, venue, 'high');
      }
    }
  }

  /**
   * Preload venues data
   */
  async preloadVenues() {
    // Preload recently viewed and nearby venues
    const recentVenues = await DatabaseService.select('venues', {
      where: 'is_deleted = 0',
      orderBy: 'updated_at DESC',
      limit: 50,
    });
    
    for (const venue of recentVenues) {
      await this.setCacheData('venues', venue.id, venue, 'high');
    }
  }

  /**
   * Preload reviews data
   */
  async preloadReviews() {
    const recentReviews = await DatabaseService.select('reviews', {
      where: 'is_deleted = 0',
      orderBy: 'created_at DESC',
      limit: 100,
    });
    
    for (const review of recentReviews) {
      await this.setCacheData('reviews', review.id, review, 'medium');
    }
  }

  /**
   * Load cached data into memory
   */
  async loadCachedData() {
    try {
      // Load cache statistics and metadata
      const cacheStats = await LocalStorageService.getItem('cache_stats');
      if (cacheStats) {
        this.stats = { ...this.stats, ...cacheStats };
      }

    } catch (error) {
      LoggingService.warn('[OfflineDataService] Failed to load cached data', {
        error: error.message,
      });
    }
  }

  /**
   * Get data with offline support
   */
  async getData(dataType, id, options = {}) {
    try {
      const capability = this.offlineCapabilities.get(dataType);
      if (!capability) {
        throw new Error(`No offline capability defined for ${dataType}`);
      }
      
      const strategy = options.strategy || capability.strategy;
      const cacheKey = this.getCacheKey(dataType, id);
      
      LoggingService.debug('[OfflineDataService] Getting data', {
        dataType,
        id,
        strategy,
        isOnline: this.isOnline,
      });
      
      // Execute strategy
      const result = await this.strategies[strategy](dataType, id, options);
      
      // Track statistics
      this.trackDataAccess(dataType, result.fromCache);
      
      return result.data;

    } catch (error) {
      this.stats.failedRequests++;
      
      LoggingService.error('[OfflineDataService] Failed to get data', {
        error: error.message,
        dataType,
        id,
      });
      
      throw error;
    }
  }

  /**
   * Cache-first strategy
   */
  async cacheFirstStrategy(dataType, id, options = {}) {
    const cacheKey = this.getCacheKey(dataType, id);
    
    // Try cache first
    const cachedData = await this.getCacheData(cacheKey);
    if (cachedData && !this.isCacheExpired(cachedData)) {
      this.stats.cacheHits++;
      return { data: cachedData.value, fromCache: true };
    }
    
    // Fall back to network if online
    if (this.isOnline) {
      try {
        const networkData = await this.fetchFromNetwork(dataType, id, options);
        await this.setCacheData(dataType, id, networkData);
        this.stats.networkRequests++;
        return { data: networkData, fromCache: false };
      } catch (error) {
        // Return stale cache if network fails
        if (cachedData) {
          LoggingService.warn('[OfflineDataService] Using stale cache due to network error', {
            dataType,
            id,
            error: error.message,
          });
          return { data: cachedData.value, fromCache: true };
        }
        throw error;
      }
    }
    
    // Offline: return cache or throw
    if (cachedData) {
      this.stats.offlineRequests++;
      return { data: cachedData.value, fromCache: true };
    }
    
    throw new Error(`No cached data available for ${dataType}:${id} while offline`);
  }

  /**
   * Network-first strategy
   */
  async networkFirstStrategy(dataType, id, options = {}) {
    // Try network first if online
    if (this.isOnline) {
      try {
        const networkData = await this.fetchFromNetwork(dataType, id, options);
        await this.setCacheData(dataType, id, networkData);
        this.stats.networkRequests++;
        return { data: networkData, fromCache: false };
      } catch (error) {
        LoggingService.warn('[OfflineDataService] Network fetch failed, trying cache', {
          dataType,
          id,
          error: error.message,
        });
      }
    }
    
    // Fall back to cache
    const cacheKey = this.getCacheKey(dataType, id);
    const cachedData = await this.getCacheData(cacheKey);
    if (cachedData) {
      this.stats.cacheHits++;
      this.stats.offlineRequests++;
      return { data: cachedData.value, fromCache: true };
    }
    
    throw new Error(`No data available for ${dataType}:${id}`);
  }

  /**
   * Cache-only strategy
   */
  async cacheOnlyStrategy(dataType, id, options = {}) {
    const cacheKey = this.getCacheKey(dataType, id);
    const cachedData = await this.getCacheData(cacheKey);
    
    if (cachedData) {
      this.stats.cacheHits++;
      return { data: cachedData.value, fromCache: true };
    }
    
    this.stats.cacheMisses++;
    throw new Error(`No cached data available for ${dataType}:${id}`);
  }

  /**
   * Network-only strategy
   */
  async networkOnlyStrategy(dataType, id, options = {}) {
    if (!this.isOnline) {
      throw new Error(`Cannot fetch ${dataType}:${id} while offline`);
    }
    
    const networkData = await this.fetchFromNetwork(dataType, id, options);
    this.stats.networkRequests++;
    return { data: networkData, fromCache: false };
  }

  /**
   * Stale-while-revalidate strategy
   */
  async staleWhileRevalidateStrategy(dataType, id, options = {}) {
    const cacheKey = this.getCacheKey(dataType, id);
    const cachedData = await this.getCacheData(cacheKey);
    
    // Return cached data immediately if available
    if (cachedData) {
      this.stats.cacheHits++;
      
      // Revalidate in background if online and cache is stale
      if (this.isOnline && this.isCacheExpired(cachedData)) {
        this.revalidateInBackground(dataType, id, options);
      }
      
      return { data: cachedData.value, fromCache: true };
    }
    
    // No cache: fetch from network
    if (this.isOnline) {
      const networkData = await this.fetchFromNetwork(dataType, id, options);
      await this.setCacheData(dataType, id, networkData);
      this.stats.networkRequests++;
      return { data: networkData, fromCache: false };
    }
    
    throw new Error(`No data available for ${dataType}:${id}`);
  }

  /**
   * Revalidate data in background
   */
  async revalidateInBackground(dataType, id, options = {}) {
    try {
      const networkData = await this.fetchFromNetwork(dataType, id, options);
      await this.setCacheData(dataType, id, networkData);
      
      LoggingService.debug('[OfflineDataService] Background revalidation completed', {
        dataType,
        id,
      });

    } catch (error) {
      LoggingService.warn('[OfflineDataService] Background revalidation failed', {
        dataType,
        id,
        error: error.message,
      });
    }
  }

  /**
   * Fetch data from network
   */
  async fetchFromNetwork(dataType, id, options = {}) {
    const apiConfig = ConfigService.getApiConfig();
    const endpoint = this.getApiEndpoint(dataType, id);
    
    const response = await fetch(`${apiConfig.baseURL}${endpoint}`, {
      method: 'GET',
      headers: {
        'X-API-Version': apiConfig.version,
        'Content-Type': 'application/json',
      },
      timeout: options.timeout || 10000,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    this.stats.bytesFetchedFromNetwork += JSON.stringify(data).length;
    
    return data;
  }

  /**
   * Get API endpoint for data type
   */
  getApiEndpoint(dataType, id) {
    const endpoints = {
      venues: `/api/venues/${id}`,
      user_profile: `/api/users/${id}`,
      user_favorites: `/api/users/${id}/favorites`,
      reviews: `/api/reviews/${id}`,
      search_results: `/api/search?q=${id}`,
    };
    
    return endpoints[dataType] || `/api/${dataType}/${id}`;
  }

  /**
   * Set cache data
   */
  async setCacheData(dataType, id, data, priority = null) {
    try {
      const capability = this.offlineCapabilities.get(dataType);
      const cachePriority = priority || capability?.priority || 'medium';
      const policy = this.cachePolicies.get(cachePriority);
      
      const cacheKey = this.getCacheKey(dataType, id);
      const cacheValue = {
        value: data,
        timestamp: Date.now(),
        ttl: policy.ttl,
        priority: cachePriority,
        dataType,
        id,
      };
      
      // Store in database cache
      await DatabaseService.setCache(cacheKey, cacheValue, policy.ttl);
      
      // Also store in local storage for instant access
      await LocalStorageService.setItem(`cache_${cacheKey}`, cacheValue, {
        ttl: policy.ttl,
      });
      
      this.stats.bytesServedFromCache += JSON.stringify(data).length;
      
      LoggingService.debug('[OfflineDataService] Data cached', {
        dataType,
        id,
        priority: cachePriority,
        size: JSON.stringify(data).length,
      });

    } catch (error) {
      LoggingService.error('[OfflineDataService] Failed to cache data', {
        error: error.message,
        dataType,
        id,
      });
    }
  }

  /**
   * Get cache data
   */
  async getCacheData(cacheKey) {
    try {
      // Try local storage first for speed
      let cachedData = await LocalStorageService.getItem(`cache_${cacheKey}`);
      
      // Fall back to database cache
      if (!cachedData) {
        cachedData = await DatabaseService.getCache(cacheKey);
      }
      
      return cachedData;

    } catch (error) {
      LoggingService.warn('[OfflineDataService] Failed to get cache data', {
        error: error.message,
        cacheKey,
      });
      return null;
    }
  }

  /**
   * Check if cache is expired
   */
  isCacheExpired(cachedData) {
    if (!cachedData.ttl) return false;
    return Date.now() > cachedData.timestamp + cachedData.ttl;
  }

  /**
   * Get cache key
   */
  getCacheKey(dataType, id) {
    return `${dataType}_${id}`;
  }

  /**
   * Track data access statistics
   */
  trackDataAccess(dataType, fromCache) {
    if (fromCache) {
      this.stats.cacheHits++;
    } else {
      this.stats.cacheMisses++;
    }
    
    // Track analytics
    MonitoringManager.trackUserAction?.('data_access', 'system', {
      dataType,
      fromCache,
      isOnline: this.isOnline,
    });
  }

  /**
   * Handle going offline
   */
  handleGoingOffline() {
    LoggingService.info('[OfflineDataService] App went offline');
    
    // Notify listeners
    this.notifyListeners('went_offline', {
      timestamp: new Date().toISOString(),
    });
    
    // Track analytics
    MonitoringManager.trackUserAction?.('went_offline', 'system');
  }

  /**
   * Handle going online
   */
  handleGoingOnline() {
    LoggingService.info('[OfflineDataService] App came back online');
    
    // Trigger data sync
    if (DataSyncService.initialized) {
      DataSyncService.triggerSync('came_online');
    }
    
    // Notify listeners
    this.notifyListeners('came_online', {
      timestamp: new Date().toISOString(),
    });
    
    // Track analytics
    MonitoringManager.trackUserAction?.('came_online', 'system');
  }

  /**
   * Setup cache maintenance
   */
  setupCacheMaintenance() {
    // Clean expired cache every 30 minutes
    setInterval(async () => {
      try {
        await this.cleanExpiredCache();
      } catch (error) {
        LoggingService.error('[OfflineDataService] Cache maintenance failed', {
          error: error.message,
        });
      }
    }, 30 * 60 * 1000);
  }

  /**
   * Clean expired cache
   */
  async cleanExpiredCache() {
    try {
      // Clean database cache
      await DatabaseService.clearExpiredCache();
      
      // Clean local storage cache
      const keys = await LocalStorageService.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      for (const key of cacheKeys) {
        const cachedData = await LocalStorageService.getItem(key);
        if (cachedData && this.isCacheExpired(cachedData)) {
          await LocalStorageService.removeItem(key);
        }
      }
      
      LoggingService.debug('[OfflineDataService] Expired cache cleaned');

    } catch (error) {
      LoggingService.error('[OfflineDataService] Failed to clean expired cache', {
        error: error.message,
      });
    }
  }

  /**
   * Get offline statistics
   */
  getOfflineStatistics() {
    return {
      ...this.stats,
      isOnline: this.isOnline,
      initialized: this.initialized,
      offlineCapabilities: Array.from(this.offlineCapabilities.keys()),
    };
  }

  /**
   * Add offline listener
   */
  addOfflineListener(listener) {
    this.offlineListeners.add(listener);
    
    return () => {
      this.offlineListeners.delete(listener);
    };
  }

  /**
   * Notify offline listeners
   */
  notifyListeners(event, data) {
    this.offlineListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        LoggingService.error('[OfflineDataService] Listener error', {
          error: error.message,
          event,
        });
      }
    });
  }

  /**
   * Clear all cache
   */
  async clearAllCache() {
    try {
      // Clear database cache
      await DatabaseService.delete('cache', '1=1');
      
      // Clear local storage cache
      await LocalStorageService.clear({ pattern: '^cache_' });
      
      LoggingService.info('[OfflineDataService] All cache cleared');

    } catch (error) {
      LoggingService.error('[OfflineDataService] Failed to clear cache', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }
    
    this.offlineListeners.clear();
    this.offlineCapabilities.clear();
    this.cachePolicies.clear();
    this.priorityQueues.clear();
    this.initialized = false;
  }
}

// Create singleton instance
const offlineDataService = new OfflineDataService();

export default offlineDataService;