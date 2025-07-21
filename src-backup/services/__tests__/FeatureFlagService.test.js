/**
 * FeatureFlagService Tests
 */

import { jest } from '@jest/globals';

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock ConfigService
const mockConfigService = {
  get: jest.fn(),
  getConfig: jest.fn(() => ({
    environment: 'test',
    features: {
      biometricAuth: true,
      socialLogin: false,
    },
    experimental: {
      venueRecommendations: false,
      arFeatures: true,
    },
  })),
  getApiConfig: jest.fn(() => ({
    baseURL: 'http://localhost:8000',
    version: 'v1',
  })),
  isFeatureEnabled: jest.fn(),
};

jest.mock('../ConfigService', () => mockConfigService);

// Mock fetch
global.fetch = jest.fn();

// Import after mocking
import FeatureFlagService from '../FeatureFlagService';

describe('FeatureFlagService', () => {
  beforeEach(() => {
    // Reset service state
    FeatureFlagService.flags.clear();
    FeatureFlagService.remoteFlags.clear();
    FeatureFlagService.initialized = false;
    FeatureFlagService.listeners.clear();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    FeatureFlagService.cleanup();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('development');
      
      await FeatureFlagService.initialize();
      
      expect(FeatureFlagService.initialized).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      FeatureFlagService.initialized = true;
      const loadLocalFlagsSpy = jest.spyOn(FeatureFlagService, 'loadLocalFlags');
      
      await FeatureFlagService.initialize();
      
      expect(loadLocalFlagsSpy).not.toHaveBeenCalled();
    });

    it('should load local flags during initialization', async () => {
      const storedFlags = {
        test_flag: {
          enabled: true,
          source: 'local',
          lastUpdated: new Date().toISOString(),
        },
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedFlags));
      mockConfigService.get.mockReturnValue('development');
      
      await FeatureFlagService.initialize();
      
      expect(FeatureFlagService.isEnabled('test_flag')).toBe(true);
    });

    it('should load config flags during initialization', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('development');
      
      await FeatureFlagService.initialize();
      
      expect(FeatureFlagService.isEnabled('feature_biometricAuth')).toBe(true);
      expect(FeatureFlagService.isEnabled('feature_socialLogin')).toBe(false);
      expect(FeatureFlagService.isEnabled('experimental_venueRecommendations')).toBe(false);
      expect(FeatureFlagService.isEnabled('experimental_arFeatures')).toBe(true);
    });

    it('should load remote flags in production', async () => {
      const remoteFlags = {
        remote_flag: {
          enabled: true,
          source: 'remote',
        },
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('production');
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(remoteFlags),
      });
      
      await FeatureFlagService.initialize();
      
      expect(FeatureFlagService.isEnabled('remote_flag')).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/config/flags',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-API-Version': 'v1',
          }),
        })
      );
    });
  });

  describe('flag management', () => {
    beforeEach(async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('development');
      await FeatureFlagService.initialize();
    });

    it('should set and get flags', () => {
      FeatureFlagService.setFlag('test_flag', {
        enabled: true,
        source: 'manual',
      });
      
      expect(FeatureFlagService.isEnabled('test_flag')).toBe(true);
      
      const flag = FeatureFlagService.getFlag('test_flag');
      expect(flag.enabled).toBe(true);
      expect(flag.source).toBe('manual');
      expect(flag.lastUpdated).toBeInstanceOf(Date);
    });

    it('should check feature flags with convenience methods', () => {
      expect(FeatureFlagService.isFeatureEnabled('biometricAuth')).toBe(true);
      expect(FeatureFlagService.isFeatureEnabled('socialLogin')).toBe(false);
      
      expect(FeatureFlagService.isExperimentalEnabled('venueRecommendations')).toBe(false);
      expect(FeatureFlagService.isExperimentalEnabled('arFeatures')).toBe(true);
    });

    it('should return false for non-existent flags', () => {
      expect(FeatureFlagService.isEnabled('non_existent')).toBe(false);
      expect(FeatureFlagService.getFlag('non_existent')).toBeNull();
    });

    it('should get all flags', () => {
      FeatureFlagService.setFlag('flag1', { enabled: true });
      FeatureFlagService.setFlag('flag2', { enabled: false });
      
      const allFlags = FeatureFlagService.getAllFlags();
      
      expect(Object.keys(allFlags)).toContain('flag1');
      expect(Object.keys(allFlags)).toContain('flag2');
      expect(allFlags.flag1.enabled).toBe(true);
      expect(allFlags.flag2.enabled).toBe(false);
    });

    it('should get flags by source', () => {
      FeatureFlagService.setFlag('manual_flag', { enabled: true, source: 'manual' });
      FeatureFlagService.setFlag('config_flag', { enabled: true, source: 'config' });
      
      const manualFlags = FeatureFlagService.getFlagsBySource('manual');
      const configFlags = FeatureFlagService.getFlagsBySource('config');
      
      expect(Object.keys(manualFlags)).toContain('manual_flag');
      expect(Object.keys(manualFlags)).not.toContain('config_flag');
      expect(Object.keys(configFlags)).toContain('config_flag');
    });
  });

  describe('flag overrides', () => {
    beforeEach(async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('development');
      await FeatureFlagService.initialize();
    });

    it('should override flags temporarily', () => {
      FeatureFlagService.setFlag('test_flag', { enabled: false, source: 'config' });
      
      FeatureFlagService.override('test_flag', true);
      
      expect(FeatureFlagService.isEnabled('test_flag')).toBe(true);
      
      const flag = FeatureFlagService.getFlag('test_flag');
      expect(flag.source).toBe('override');
      expect(flag.originalValue).toBe(false);
    });

    it('should revert overrides', () => {
      FeatureFlagService.setFlag('test_flag', { enabled: false, source: 'config' });
      FeatureFlagService.override('test_flag', true);
      
      FeatureFlagService.revertOverride('test_flag');
      
      expect(FeatureFlagService.isEnabled('test_flag')).toBe(false);
      
      const flag = FeatureFlagService.getFlag('test_flag');
      expect(flag.source).toBe('config');
      expect(flag.originalValue).toBeUndefined();
    });

    it('should auto-revert overrides with duration', (done) => {
      FeatureFlagService.setFlag('test_flag', { enabled: false, source: 'config' });
      
      FeatureFlagService.override('test_flag', true, 100); // 100ms duration
      
      expect(FeatureFlagService.isEnabled('test_flag')).toBe(true);
      
      setTimeout(() => {
        expect(FeatureFlagService.isEnabled('test_flag')).toBe(false);
        done();
      }, 150);
    });
  });

  describe('listeners', () => {
    beforeEach(async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('development');
      await FeatureFlagService.initialize();
    });

    it('should notify listeners when flags change', () => {
      const listener = jest.fn();
      const removeListener = FeatureFlagService.addListener(listener);
      
      FeatureFlagService.setFlag('test_flag', { enabled: true });
      
      expect(listener).toHaveBeenCalledWith('test_flag', true, undefined);
      
      // Remove listener
      removeListener();
      
      FeatureFlagService.setFlag('test_flag', { enabled: false });
      
      // Should not be called again
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should not notify listeners if flag value unchanged', () => {
      const listener = jest.fn();
      FeatureFlagService.addListener(listener);
      
      FeatureFlagService.setFlag('test_flag', { enabled: true });
      FeatureFlagService.setFlag('test_flag', { enabled: true }); // Same value
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      
      FeatureFlagService.addListener(errorListener);
      
      expect(() => {
        FeatureFlagService.setFlag('test_flag', { enabled: true });
      }).not.toThrow();
    });
  });

  describe('A/B testing', () => {
    beforeEach(async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('development');
      await FeatureFlagService.initialize();
    });

    it('should return consistent variants for same user', () => {
      FeatureFlagService.setFlag('ab_test_homepage', { enabled: true });
      
      const variant1 = FeatureFlagService.getVariant('homepage', ['A', 'B'], 'user123');
      const variant2 = FeatureFlagService.getVariant('homepage', ['A', 'B'], 'user123');
      
      expect(variant1).toBe(variant2);
    });

    it('should return different variants for different users', () => {
      FeatureFlagService.setFlag('ab_test_homepage', { enabled: true });
      
      const variants = new Set();
      
      // Test with many users to ensure we get different variants
      for (let i = 0; i < 100; i++) {
        const variant = FeatureFlagService.getVariant('homepage', ['A', 'B'], `user${i}`);
        variants.add(variant);
      }
      
      expect(variants.size).toBeGreaterThan(1);
      expect(variants.has('A')).toBe(true);
      expect(variants.has('B')).toBe(true);
    });

    it('should return first variant if test is disabled', () => {
      FeatureFlagService.setFlag('ab_test_homepage', { enabled: false });
      
      const variant = FeatureFlagService.getVariant('homepage', ['A', 'B'], 'user123');
      
      expect(variant).toBe('A');
    });

    it('should handle multiple variants', () => {
      FeatureFlagService.setFlag('ab_test_multivariant', { enabled: true });
      
      const variants = ['A', 'B', 'C', 'D'];
      const result = FeatureFlagService.getVariant('multivariant', variants, 'user123');
      
      expect(variants).toContain(result);
    });
  });

  describe('persistence', () => {
    beforeEach(async () => {
      mockConfigService.get.mockReturnValue('development');
    });

    it('should save flags to local storage', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      
      await FeatureFlagService.initialize();
      FeatureFlagService.setFlag('test_flag', { enabled: true, source: 'manual' });
      
      await FeatureFlagService.saveLocalFlags();
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'feature_flags',
        expect.stringContaining('test_flag')
      );
    });

    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      
      await expect(FeatureFlagService.initialize()).resolves.not.toThrow();
    });

    it('should clear all flags', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      
      await FeatureFlagService.initialize();
      FeatureFlagService.setFlag('test_flag', { enabled: true });
      
      await FeatureFlagService.clearFlags();
      
      expect(FeatureFlagService.flags.size).toBe(0);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('feature_flags');
    });
  });

  describe('remote flag loading', () => {
    beforeEach(async () => {
      mockConfigService.get.mockReturnValue('production');
    });

    it('should handle fetch errors gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      global.fetch.mockRejectedValue(new Error('Network error'));
      
      await expect(FeatureFlagService.initialize()).resolves.not.toThrow();
    });

    it('should handle invalid response gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
      });
      
      await expect(FeatureFlagService.initialize()).resolves.not.toThrow();
    });

    it('should update last update timestamp', async () => {
      const remoteFlags = { test_flag: { enabled: true } };
      
      mockAsyncStorage.getItem.mockResolvedValue(null);
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(remoteFlags),
      });
      
      await FeatureFlagService.initialize();
      
      expect(FeatureFlagService.lastUpdate).toBeInstanceOf(Date);
    });
  });

  describe('debug functionality', () => {
    beforeEach(async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('development');
      await FeatureFlagService.initialize();
    });

    it('should provide debug information', () => {
      const debugInfo = FeatureFlagService.getDebugInfo();
      
      expect(debugInfo.initialized).toBe(true);
      expect(typeof debugInfo.flagCount).toBe('number');
      expect(Array.isArray(debugInfo.sources)).toBe(true);
      expect(typeof debugInfo.listeners).toBe('number');
    });

    it('should export flags for debugging', () => {
      FeatureFlagService.setFlag('test_flag', { enabled: true, source: 'manual' });
      
      const exported = FeatureFlagService.exportFlags();
      
      expect(exported.test_flag).toBeDefined();
      expect(exported.test_flag.enabled).toBe(true);
      expect(exported.test_flag.source).toBe('manual');
      expect(typeof exported.test_flag.lastUpdated).toBe('string');
    });
  });

  describe('usage tracking', () => {
    beforeEach(async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('production');
      mockConfigService.isFeatureEnabled.mockReturnValue(true);
      await FeatureFlagService.initialize();
    });

    it('should track flag usage in production with analytics enabled', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      FeatureFlagService.setFlag('test_flag', { enabled: true, source: 'config' });
      FeatureFlagService.trackUsage('test_flag', { context: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Flag usage tracked'),
        expect.objectContaining({
          enabled: true,
          source: 'config',
          context: { context: 'test' },
        })
      );
    });

    it('should not track usage for non-existent flags', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      FeatureFlagService.trackUsage('non_existent_flag');
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Flag usage tracked')
      );
    });
  });
});