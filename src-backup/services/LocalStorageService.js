/**
 * Local Storage Service
 * Comprehensive local storage management with encryption and caching
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import ConfigService from './ConfigService';
import LoggingService from './LoggingService';
import MonitoringManager from './MonitoringManager';

class LocalStorageService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
    this.initialized = false;
    this.encryptionEnabled = true;
    this.maxCacheSize = 100;
    
    // Storage keys prefix
    this.keyPrefix = 'nightlife_';
    
    // Sensitive data keys that should use SecureStore
    this.sensitiveKeys = new Set([
      'auth_token',
      'refresh_token',
      'user_credentials',
      'api_keys',
      'encryption_keys',
      'biometric_data',
      'payment_info',
    ]);
    
    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      writes: 0,
      deletes: 0,
      errors: 0,
    };
  }

  /**
   * Initialize storage service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      const config = ConfigService.getConfig();
      this.encryptionEnabled = config.security?.enableEncryption !== false;
      
      // Test storage availability
      await this.testStorageAvailability();
      
      // Setup cache cleanup interval
      this.setupCacheCleanup();
      
      this.initialized = true;
      
      LoggingService.info('[LocalStorageService] Initialized', {
        encryptionEnabled: this.encryptionEnabled,
        platform: Platform.OS,
      });

    } catch (error) {
      LoggingService.error('[LocalStorageService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Test storage availability
   */
  async testStorageAvailability() {
    try {
      const testKey = `${this.keyPrefix}test`;
      const testValue = 'test_value';
      
      // Test AsyncStorage
      await AsyncStorage.setItem(testKey, testValue);
      const retrievedValue = await AsyncStorage.getItem(testKey);
      await AsyncStorage.removeItem(testKey);
      
      if (retrievedValue !== testValue) {
        throw new Error('AsyncStorage test failed');
      }
      
      // Test SecureStore on supported platforms
      if (Platform.OS !== 'web') {
        const secureTestKey = `${this.keyPrefix}secure_test`;
        await SecureStore.setItemAsync(secureTestKey, testValue);
        const secureRetrievedValue = await SecureStore.getItemAsync(secureTestKey);
        await SecureStore.deleteItemAsync(secureTestKey);
        
        if (secureRetrievedValue !== testValue) {
          throw new Error('SecureStore test failed');
        }
      }
      
      LoggingService.debug('[LocalStorageService] Storage availability test passed');
      
    } catch (error) {
      LoggingService.error('[LocalStorageService] Storage availability test failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Setup cache cleanup interval
   */
  setupCacheCleanup() {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60000); // Clean every minute
  }

  /**
   * Store data
   */
  async setItem(key, value, options = {}) {
    try {
      const {
        encrypt = this.shouldEncrypt(key),
        ttl = null,
        cache = true,
      } = options;

      const prefixedKey = this.getPrefixedKey(key);
      const serializedValue = this.serializeValue(value);
      
      // Prepare storage data
      const storageData = {
        value: serializedValue,
        timestamp: Date.now(),
        ttl,
        encrypted: encrypt,
      };

      // Store data
      if (encrypt && this.isSensitiveKey(key)) {
        await this.setSecureItem(prefixedKey, storageData);
      } else {
        await AsyncStorage.setItem(prefixedKey, JSON.stringify(storageData));
      }

      // Update cache
      if (cache) {
        this.updateCache(key, value, ttl);
      }

      // Update statistics
      this.stats.writes++;
      
      LoggingService.debug('[LocalStorageService] Item stored', {
        key: prefixedKey,
        encrypted: encrypt,
        cached: cache,
        size: serializedValue.length,
      });

      // Track analytics
      MonitoringManager.trackUserAction?.('storage_write', 'system', {
        key: key.substring(0, 20), // Limit key length for privacy
        encrypted: encrypt,
      });

      return true;

    } catch (error) {
      this.stats.errors++;
      
      LoggingService.error('[LocalStorageService] Failed to store item', {
        error: error.message,
        key,
      });
      
      throw error;
    }
  }

  /**
   * Retrieve data
   */
  async getItem(key, defaultValue = null) {
    try {
      // Check cache first
      if (this.cache.has(key)) {
        const cachedItem = this.cache.get(key);
        
        if (!this.isCacheExpired(cachedItem)) {
          this.stats.hits++;
          
          LoggingService.debug('[LocalStorageService] Cache hit', { key });
          return cachedItem.value;
        } else {
          // Remove expired cache
          this.cache.delete(key);
        }
      }

      this.stats.misses++;
      
      const prefixedKey = this.getPrefixedKey(key);
      let storageData;

      // Retrieve data
      if (this.isSensitiveKey(key)) {
        storageData = await this.getSecureItem(prefixedKey);
      } else {
        const rawData = await AsyncStorage.getItem(prefixedKey);
        storageData = rawData ? JSON.parse(rawData) : null;
      }

      if (!storageData) {
        LoggingService.debug('[LocalStorageService] Item not found', { key });
        return defaultValue;
      }

      // Check TTL
      if (storageData.ttl && Date.now() > storageData.timestamp + storageData.ttl) {
        await this.removeItem(key);
        LoggingService.debug('[LocalStorageService] Item expired', { key });
        return defaultValue;
      }

      const value = this.deserializeValue(storageData.value);
      
      // Update cache
      this.updateCache(key, value, storageData.ttl);
      
      LoggingService.debug('[LocalStorageService] Item retrieved', {
        key: prefixedKey,
        encrypted: storageData.encrypted,
      });

      return value;

    } catch (error) {
      this.stats.errors++;
      
      LoggingService.error('[LocalStorageService] Failed to retrieve item', {
        error: error.message,
        key,
      });
      
      return defaultValue;
    }
  }

  /**
   * Remove data
   */
  async removeItem(key) {
    try {
      const prefixedKey = this.getPrefixedKey(key);

      // Remove from storage
      if (this.isSensitiveKey(key)) {
        await SecureStore.deleteItemAsync(prefixedKey);
      } else {
        await AsyncStorage.removeItem(prefixedKey);
      }

      // Remove from cache
      this.cache.delete(key);

      // Update statistics
      this.stats.deletes++;
      
      LoggingService.debug('[LocalStorageService] Item removed', { key: prefixedKey });

      return true;

    } catch (error) {
      this.stats.errors++;
      
      LoggingService.error('[LocalStorageService] Failed to remove item', {
        error: error.message,
        key,
      });
      
      throw error;
    }
  }

  /**
   * Clear all data
   */
  async clear(options = {}) {
    try {
      const { includeSecure = false, pattern = null } = options;

      if (pattern) {
        await this.clearByPattern(pattern, includeSecure);
      } else {
        // Clear AsyncStorage
        const keys = await AsyncStorage.getAllKeys();
        const prefixedKeys = keys.filter(key => key.startsWith(this.keyPrefix));
        await AsyncStorage.multiRemove(prefixedKeys);
        
        // Clear SecureStore if requested
        if (includeSecure && Platform.OS !== 'web') {
          for (const sensitiveKey of this.sensitiveKeys) {
            try {
              await SecureStore.deleteItemAsync(this.getPrefixedKey(sensitiveKey));
            } catch (error) {
              // Ignore errors for non-existent keys
            }
          }
        }
      }

      // Clear cache
      this.cache.clear();
      
      LoggingService.info('[LocalStorageService] Storage cleared', {
        includeSecure,
        pattern,
      });

      return true;

    } catch (error) {
      LoggingService.error('[LocalStorageService] Failed to clear storage', {
        error: error.message,
      });
      
      throw error;
    }
  }

  /**
   * Clear storage by pattern
   */
  async clearByPattern(pattern, includeSecure = false) {
    try {
      const regex = new RegExp(pattern);
      
      // Clear AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const matchingKeys = keys.filter(key => 
        key.startsWith(this.keyPrefix) && regex.test(key.replace(this.keyPrefix, ''))
      );
      
      if (matchingKeys.length > 0) {
        await AsyncStorage.multiRemove(matchingKeys);
      }
      
      // Clear SecureStore if requested
      if (includeSecure && Platform.OS !== 'web') {
        for (const sensitiveKey of this.sensitiveKeys) {
          if (regex.test(sensitiveKey)) {
            try {
              await SecureStore.deleteItemAsync(this.getPrefixedKey(sensitiveKey));
            } catch (error) {
              // Ignore errors for non-existent keys
            }
          }
        }
      }
      
      // Clear matching cache entries
      for (const [key] of this.cache) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
      
      LoggingService.debug('[LocalStorageService] Storage cleared by pattern', {
        pattern,
        matchingKeys: matchingKeys.length,
      });

    } catch (error) {
      LoggingService.error('[LocalStorageService] Failed to clear storage by pattern', {
        error: error.message,
        pattern,
      });
      throw error;
    }
  }

  /**
   * Get all keys
   */
  async getAllKeys(includeSecure = false) {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let filteredKeys = keys
        .filter(key => key.startsWith(this.keyPrefix))
        .map(key => key.replace(this.keyPrefix, ''));

      if (includeSecure) {
        // Add sensitive keys that might exist
        for (const sensitiveKey of this.sensitiveKeys) {
          try {
            const value = await SecureStore.getItemAsync(this.getPrefixedKey(sensitiveKey));
            if (value) {
              filteredKeys.push(sensitiveKey);
            }
          } catch (error) {
            // Ignore errors for non-existent keys
          }
        }
      }

      return filteredKeys;

    } catch (error) {
      LoggingService.error('[LocalStorageService] Failed to get all keys', {
        error: error.message,
      });
      
      return [];
    }
  }

  /**
   * Get multiple items
   */
  async getMultipleItems(keys) {
    try {
      const results = {};
      
      await Promise.all(
        keys.map(async (key) => {
          try {
            results[key] = await this.getItem(key);
          } catch (error) {
            LoggingService.warn('[LocalStorageService] Failed to get item in batch', {
              key,
              error: error.message,
            });
            results[key] = null;
          }
        })
      );
      
      return results;

    } catch (error) {
      LoggingService.error('[LocalStorageService] Failed to get multiple items', {
        error: error.message,
        keys,
      });
      
      throw error;
    }
  }

  /**
   * Set multiple items
   */
  async setMultipleItems(items, options = {}) {
    try {
      const results = {};
      
      await Promise.all(
        Object.entries(items).map(async ([key, value]) => {
          try {
            results[key] = await this.setItem(key, value, options);
          } catch (error) {
            LoggingService.warn('[LocalStorageService] Failed to set item in batch', {
              key,
              error: error.message,
            });
            results[key] = false;
          }
        })
      );
      
      return results;

    } catch (error) {
      LoggingService.error('[LocalStorageService] Failed to set multiple items', {
        error: error.message,
      });
      
      throw error;
    }
  }

  /**
   * Get storage size
   */
  async getStorageSize() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const prefixedKeys = keys.filter(key => key.startsWith(this.keyPrefix));
      
      let totalSize = 0;
      
      for (const key of prefixedKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        } catch (error) {
          // Ignore individual errors
        }
      }
      
      return {
        keys: prefixedKeys.length,
        sizeBytes: totalSize,
        sizeMB: (totalSize / 1024 / 1024).toFixed(2),
      };

    } catch (error) {
      LoggingService.error('[LocalStorageService] Failed to get storage size', {
        error: error.message,
      });
      
      return { keys: 0, sizeBytes: 0, sizeMB: '0.00' };
    }
  }

  /**
   * Export storage data
   */
  async exportData(options = {}) {
    try {
      const { includeSecure = false, pattern = null } = options;
      
      const keys = await this.getAllKeys(includeSecure);
      const filteredKeys = pattern 
        ? keys.filter(key => new RegExp(pattern).test(key))
        : keys;
      
      const data = await this.getMultipleItems(filteredKeys);
      
      return {
        data,
        metadata: {
          exportedAt: new Date().toISOString(),
          keys: filteredKeys.length,
          includeSecure,
          pattern,
        },
      };

    } catch (error) {
      LoggingService.error('[LocalStorageService] Failed to export data', {
        error: error.message,
      });
      
      throw error;
    }
  }

  /**
   * Import storage data
   */
  async importData(exportedData, options = {}) {
    try {
      const { overwrite = false, validate = true } = options;
      
      if (validate && !this.validateImportData(exportedData)) {
        throw new Error('Invalid import data format');
      }
      
      const { data } = exportedData;
      const results = {};
      
      for (const [key, value] of Object.entries(data)) {
        try {
          if (!overwrite) {
            const existing = await this.getItem(key);
            if (existing !== null) {
              LoggingService.debug('[LocalStorageService] Skipping existing key', { key });
              results[key] = { success: false, reason: 'exists' };
              continue;
            }
          }
          
          await this.setItem(key, value);
          results[key] = { success: true };
          
        } catch (error) {
          LoggingService.warn('[LocalStorageService] Failed to import item', {
            key,
            error: error.message,
          });
          results[key] = { success: false, error: error.message };
        }
      }
      
      LoggingService.info('[LocalStorageService] Data imported', {
        totalItems: Object.keys(data).length,
        successful: Object.values(results).filter(r => r.success).length,
        overwrite,
      });
      
      return results;

    } catch (error) {
      LoggingService.error('[LocalStorageService] Failed to import data', {
        error: error.message,
      });
      
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      cacheHitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      initialized: this.initialized,
      encryptionEnabled: this.encryptionEnabled,
    };
  }

  // Helper methods

  /**
   * Get prefixed key
   */
  getPrefixedKey(key) {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Check if key is sensitive
   */
  isSensitiveKey(key) {
    return this.sensitiveKeys.has(key) || key.includes('token') || key.includes('password');
  }

  /**
   * Check if encryption should be used
   */
  shouldEncrypt(key) {
    return this.encryptionEnabled && this.isSensitiveKey(key);
  }

  /**
   * Store secure item
   */
  async setSecureItem(key, data) {
    if (Platform.OS === 'web') {
      // Fallback to AsyncStorage on web
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } else {
      await SecureStore.setItemAsync(key, JSON.stringify(data));
    }
  }

  /**
   * Get secure item
   */
  async getSecureItem(key) {
    try {
      let rawData;
      
      if (Platform.OS === 'web') {
        rawData = await AsyncStorage.getItem(key);
      } else {
        rawData = await SecureStore.getItemAsync(key);
      }
      
      return rawData ? JSON.parse(rawData) : null;
      
    } catch (error) {
      LoggingService.warn('[LocalStorageService] Failed to get secure item', {
        key,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Serialize value
   */
  serializeValue(value) {
    return JSON.stringify(value);
  }

  /**
   * Deserialize value
   */
  deserializeValue(serializedValue) {
    return JSON.parse(serializedValue);
  }

  /**
   * Update cache
   */
  updateCache(key, value, ttl) {
    // Limit cache size
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Check if cache is expired
   */
  isCacheExpired(cachedItem) {
    if (!cachedItem.ttl) {
      return Date.now() - cachedItem.timestamp > this.cacheTimeout;
    }
    
    return Date.now() > cachedItem.timestamp + cachedItem.ttl;
  }

  /**
   * Cleanup expired cache
   */
  cleanupExpiredCache() {
    const now = Date.now();
    
    for (const [key, cachedItem] of this.cache) {
      if (this.isCacheExpired(cachedItem)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Validate import data
   */
  validateImportData(exportedData) {
    return (
      exportedData &&
      typeof exportedData === 'object' &&
      exportedData.data &&
      typeof exportedData.data === 'object' &&
      exportedData.metadata &&
      typeof exportedData.metadata === 'object'
    );
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.cache.clear();
    this.initialized = false;
  }
}

// Create singleton instance
const localStorageService = new LocalStorageService();

export default localStorageService;