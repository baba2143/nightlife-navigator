/**
 * Feature Flag Service
 * Manages feature flags and A/B testing capabilities
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfigService from './ConfigService';

class FeatureFlagService {
  constructor() {
    this.flags = new Map();
    this.remoteFlags = new Map();
    this.initialized = false;
    this.updateInterval = null;
    this.lastUpdate = null;
    this.listeners = new Set();
  }

  /**
   * Initialize the feature flag service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Load flags from local storage first
      await this.loadLocalFlags();
      
      // Load flags from configuration
      await this.loadConfigFlags();
      
      // Load remote flags if in production
      if (ConfigService.get('environment') === 'production') {
        await this.loadRemoteFlags();
        this.startPeriodicUpdate();
      }

      this.initialized = true;
      console.log('[FeatureFlagService] Initialized with', this.flags.size, 'flags');
    } catch (error) {
      console.error('[FeatureFlagService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Load flags from local storage
   */
  async loadLocalFlags() {
    try {
      const storedFlags = await AsyncStorage.getItem('feature_flags');
      if (storedFlags) {
        const parsedFlags = JSON.parse(storedFlags);
        Object.entries(parsedFlags).forEach(([key, value]) => {
          this.flags.set(key, {
            ...value,
            source: 'local',
            lastUpdated: new Date(value.lastUpdated || Date.now()),
          });
        });
      }
    } catch (error) {
      console.warn('[FeatureFlagService] Failed to load local flags:', error);
    }
  }

  /**
   * Load flags from application configuration
   */
  async loadConfigFlags() {
    try {
      const config = ConfigService.getConfig();
      
      // Load standard features
      if (config.features) {
        Object.entries(config.features).forEach(([key, enabled]) => {
          this.setFlag(`feature_${key}`, {
            enabled,
            source: 'config',
            lastUpdated: new Date(),
          });
        });
      }

      // Load experimental features
      if (config.experimental) {
        Object.entries(config.experimental).forEach(([key, enabled]) => {
          this.setFlag(`experimental_${key}`, {
            enabled,
            source: 'config',
            lastUpdated: new Date(),
          });
        });
      }

    } catch (error) {
      console.warn('[FeatureFlagService] Failed to load config flags:', error);
    }
  }

  /**
   * Load flags from remote service
   */
  async loadRemoteFlags() {
    try {
      const apiConfig = ConfigService.getApiConfig();
      const response = await fetch(`${apiConfig.baseURL}/api/config/flags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': apiConfig.version,
        },
        timeout: 10000,
      });

      if (response.ok) {
        const remoteFlags = await response.json();
        
        // Process remote flags
        Object.entries(remoteFlags).forEach(([key, flagData]) => {
          this.setFlag(key, {
            ...flagData,
            source: 'remote',
            lastUpdated: new Date(),
          });
        });

        this.lastUpdate = new Date();
        await this.saveLocalFlags();
        
        console.log('[FeatureFlagService] Loaded', Object.keys(remoteFlags).length, 'remote flags');
      }
    } catch (error) {
      console.warn('[FeatureFlagService] Failed to load remote flags:', error);
    }
  }

  /**
   * Save flags to local storage
   */
  async saveLocalFlags() {
    try {
      const flagsObject = {};
      this.flags.forEach((value, key) => {
        flagsObject[key] = {
          ...value,
          lastUpdated: value.lastUpdated.toISOString(),
        };
      });

      await AsyncStorage.setItem('feature_flags', JSON.stringify(flagsObject));
    } catch (error) {
      console.warn('[FeatureFlagService] Failed to save local flags:', error);
    }
  }

  /**
   * Set a feature flag
   */
  setFlag(key, flagData) {
    const previousFlag = this.flags.get(key);
    const newFlag = {
      enabled: false,
      source: 'manual',
      lastUpdated: new Date(),
      ...flagData,
    };

    this.flags.set(key, newFlag);

    // Notify listeners if flag value changed
    if (!previousFlag || previousFlag.enabled !== newFlag.enabled) {
      this.notifyListeners(key, newFlag.enabled, previousFlag?.enabled);
    }
  }

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flagKey) {
    if (!this.initialized) {
      console.warn('[FeatureFlagService] Service not initialized, returning default value');
      return false;
    }

    const flag = this.flags.get(flagKey);
    return flag ? flag.enabled : false;
  }

  /**
   * Check if a feature is enabled (convenience method)
   */
  isFeatureEnabled(featureName) {
    return this.isEnabled(`feature_${featureName}`);
  }

  /**
   * Check if an experimental feature is enabled
   */
  isExperimentalEnabled(featureName) {
    return this.isEnabled(`experimental_${featureName}`);
  }

  /**
   * Get flag details
   */
  getFlag(flagKey) {
    return this.flags.get(flagKey) || null;
  }

  /**
   * Get all flags
   */
  getAllFlags() {
    const result = {};
    this.flags.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Get flags by source
   */
  getFlagsBySource(source) {
    const result = {};
    this.flags.forEach((value, key) => {
      if (value.source === source) {
        result[key] = value;
      }
    });
    return result;
  }

  /**
   * Override a flag (for testing)
   */
  override(flagKey, enabled, duration = null) {
    const currentFlag = this.flags.get(flagKey) || {};
    
    this.setFlag(flagKey, {
      ...currentFlag,
      enabled,
      source: 'override',
      originalValue: currentFlag.enabled,
      overrideExpiry: duration ? new Date(Date.now() + duration) : null,
    });

    // Auto-revert after duration
    if (duration) {
      setTimeout(() => {
        this.revertOverride(flagKey);
      }, duration);
    }

    console.log(`[FeatureFlagService] Flag ${flagKey} overridden to ${enabled}${duration ? ` for ${duration}ms` : ''}`);
  }

  /**
   * Revert flag override
   */
  revertOverride(flagKey) {
    const flag = this.flags.get(flagKey);
    if (flag && flag.source === 'override' && flag.originalValue !== undefined) {
      this.setFlag(flagKey, {
        ...flag,
        enabled: flag.originalValue,
        source: 'config', // Reset to config source
        originalValue: undefined,
        overrideExpiry: undefined,
      });

      console.log(`[FeatureFlagService] Flag ${flagKey} override reverted`);
    }
  }

  /**
   * Add a flag change listener
   */
  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of flag changes
   */
  notifyListeners(flagKey, newValue, oldValue) {
    this.listeners.forEach(listener => {
      try {
        listener(flagKey, newValue, oldValue);
      } catch (error) {
        console.error('[FeatureFlagService] Listener error:', error);
      }
    });
  }

  /**
   * Start periodic updates for remote flags
   */
  startPeriodicUpdate() {
    if (this.updateInterval) {
      return;
    }

    // Update every 5 minutes
    this.updateInterval = setInterval(() => {
      this.loadRemoteFlags();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop periodic updates
   */
  stopPeriodicUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Manually refresh flags
   */
  async refresh() {
    if (ConfigService.get('environment') === 'production') {
      await this.loadRemoteFlags();
    } else {
      await this.loadConfigFlags();
    }
  }

  /**
   * A/B Testing functionality
   */
  getVariant(testKey, variants = ['A', 'B'], userId = null) {
    if (!this.isEnabled(`ab_test_${testKey}`)) {
      return variants[0]; // Default to first variant if test is disabled
    }

    // Use consistent hashing for variant assignment
    const hashInput = `${testKey}_${userId || 'anonymous'}`;
    const hash = this.simpleHash(hashInput);
    const variantIndex = hash % variants.length;
    
    return variants[variantIndex];
  }

  /**
   * Simple hash function for consistent A/B testing
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Track feature flag usage (for analytics)
   */
  trackUsage(flagKey, context = {}) {
    const flag = this.flags.get(flagKey);
    if (!flag) {
      return;
    }

    // Send usage analytics in production
    if (ConfigService.get('environment') === 'production' && ConfigService.isFeatureEnabled('analytics')) {
      // Analytics implementation would go here
      console.log(`[FeatureFlagService] Flag usage tracked: ${flagKey}`, {
        enabled: flag.enabled,
        source: flag.source,
        context,
      });
    }
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    return {
      initialized: this.initialized,
      flagCount: this.flags.size,
      lastUpdate: this.lastUpdate,
      updateInterval: !!this.updateInterval,
      sources: [...new Set([...this.flags.values()].map(f => f.source))],
      listeners: this.listeners.size,
    };
  }

  /**
   * Export flags for debugging
   */
  exportFlags() {
    const flags = {};
    this.flags.forEach((value, key) => {
      flags[key] = {
        enabled: value.enabled,
        source: value.source,
        lastUpdated: value.lastUpdated.toISOString(),
      };
    });
    return flags;
  }

  /**
   * Clear all flags
   */
  async clearFlags() {
    this.flags.clear();
    await AsyncStorage.removeItem('feature_flags');
    console.log('[FeatureFlagService] All flags cleared');
  }

  /**
   * Cleanup on service destruction
   */
  cleanup() {
    this.stopPeriodicUpdate();
    this.listeners.clear();
    this.flags.clear();
    this.initialized = false;
  }
}

// Create singleton instance
const featureFlagService = new FeatureFlagService();

export default featureFlagService;