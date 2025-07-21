/**
 * ConfigService Tests
 */

import { jest } from '@jest/globals';

// Mock Constants
const mockConstants = {
  expoConfig: {
    version: '1.0.0',
    extra: {
      environment: 'test',
      EXPO_PUBLIC_ENV: 'test',
      EXPO_PUBLIC_API_URL: 'http://localhost:8000',
      EXPO_PUBLIC_FEATURE_BIOMETRIC_AUTH: true,
      EXPO_PUBLIC_FEATURE_SOCIAL_LOGIN: false,
      buildNumber: 1,
    },
  },
};

jest.mock('expo-constants', () => mockConstants);

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '14.0',
  },
}));

// Import after mocking
import ConfigService from '../ConfigService';

describe('ConfigService', () => {
  beforeEach(async () => {
    // Reset service state
    ConfigService.config = null;
    ConfigService.initialized = false;
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const config = await ConfigService.initialize();
      
      expect(ConfigService.initialized).toBe(true);
      expect(config).toBeDefined();
      expect(config.environment).toBe('test');
    });

    it('should not reinitialize if already initialized', async () => {
      await ConfigService.initialize();
      const firstConfig = ConfigService.config;
      
      await ConfigService.initialize();
      const secondConfig = ConfigService.config;
      
      expect(firstConfig).toBe(secondConfig);
    });

    it('should throw error if initialization fails', async () => {
      // Mock a scenario that would cause initialization to fail
      const originalGetEnvironment = ConfigService.getEnvironment;
      ConfigService.getEnvironment = jest.fn(() => {
        throw new Error('Test error');
      });

      await expect(ConfigService.initialize()).rejects.toThrow('Configuration initialization failed');
      
      // Restore original method
      ConfigService.getEnvironment = originalGetEnvironment;
    });
  });

  describe('environment detection', () => {
    it('should detect environment from expo config', () => {
      const environment = ConfigService.getEnvironment();
      expect(environment).toBe('test');
    });

    it('should fallback to public env variable', () => {
      // Temporarily remove environment from extra
      const originalEnvironment = mockConstants.expoConfig.extra.environment;
      delete mockConstants.expoConfig.extra.environment;
      
      const environment = ConfigService.getEnvironment();
      expect(environment).toBe('test');
      
      // Restore
      mockConstants.expoConfig.extra.environment = originalEnvironment;
    });

    it('should fallback to development in __DEV__ mode', () => {
      // Mock __DEV__ global
      global.__DEV__ = true;
      
      // Remove environment variables
      const originalExtra = mockConstants.expoConfig.extra;
      mockConstants.expoConfig.extra = {};
      
      const environment = ConfigService.getEnvironment();
      expect(environment).toBe('development');
      
      // Restore
      mockConstants.expoConfig.extra = originalExtra;
      global.__DEV__ = false;
    });

    it('should default to production', () => {
      // Remove all environment indicators
      const originalExtra = mockConstants.expoConfig.extra;
      mockConstants.expoConfig.extra = {};
      global.__DEV__ = false;
      
      const environment = ConfigService.getEnvironment();
      expect(environment).toBe('production');
      
      // Restore
      mockConstants.expoConfig.extra = originalExtra;
    });
  });

  describe('configuration loading', () => {
    beforeEach(async () => {
      await ConfigService.initialize();
    });

    it('should load base configuration', () => {
      const config = ConfigService.getConfig();
      
      expect(config.appName).toBe('Nightlife Navigator');
      expect(config.version).toBe('1.0.0');
      expect(config.platform).toBe('ios');
      expect(config.environment).toBe('test');
      expect(config.isDevelopment).toBe(false);
      expect(config.isProduction).toBe(false);
    });

    it('should load environment-specific configuration', () => {
      const config = ConfigService.getConfig();
      
      expect(config.apiUrl).toBe('http://localhost:8000');
      expect(config.features.biometricAuth).toBe(true);
      expect(config.features.socialLogin).toBe(false);
    });

    it('should merge base and environment configurations', () => {
      const config = ConfigService.getConfig();
      
      // Should have both base and environment properties
      expect(config.appName).toBeDefined(); // from base
      expect(config.apiUrl).toBeDefined(); // from environment
      expect(config.features).toBeDefined(); // from environment
    });
  });

  describe('configuration validation', () => {
    it('should validate required configuration', () => {
      const validConfig = {
        apiUrl: 'http://localhost:8000',
        environment: 'test',
      };
      
      expect(() => ConfigService.validateConfiguration(validConfig)).not.toThrow();
    });

    it('should throw error for missing required keys', () => {
      const invalidConfig = {
        environment: 'test',
        // missing apiUrl
      };
      
      expect(() => ConfigService.validateConfiguration(invalidConfig)).toThrow('Missing required configuration');
    });

    it('should throw error for invalid URL format', () => {
      const invalidConfig = {
        apiUrl: 'invalid-url',
        environment: 'test',
      };
      
      expect(() => ConfigService.validateConfiguration(invalidConfig)).toThrow('Invalid API URL format');
    });
  });

  describe('configuration getters', () => {
    beforeEach(async () => {
      await ConfigService.initialize();
    });

    it('should get specific configuration values', () => {
      expect(ConfigService.get('environment')).toBe('test');
      expect(ConfigService.get('apiUrl')).toBe('http://localhost:8000');
      expect(ConfigService.get('nonexistent', 'default')).toBe('default');
    });

    it('should get nested configuration values', () => {
      expect(ConfigService.get('features.biometricAuth')).toBe(true);
      expect(ConfigService.get('features.socialLogin')).toBe(false);
    });

    it('should check if features are enabled', () => {
      expect(ConfigService.isFeatureEnabled('biometricAuth')).toBe(true);
      expect(ConfigService.isFeatureEnabled('socialLogin')).toBe(false);
      expect(ConfigService.isFeatureEnabled('nonexistent')).toBe(false);
    });

    it('should get API configuration', () => {
      const apiConfig = ConfigService.getApiConfig();
      
      expect(apiConfig.baseURL).toBe('http://localhost:8000');
      expect(apiConfig.timeout).toBeDefined();
      expect(apiConfig.version).toBeDefined();
    });

    it('should throw error when not initialized', () => {
      ConfigService.initialized = false;
      
      expect(() => ConfigService.getConfig()).toThrow('ConfigService not initialized');
      expect(() => ConfigService.get('test')).toThrow('ConfigService not initialized');
    });
  });

  describe('configuration helpers', () => {
    beforeEach(async () => {
      await ConfigService.initialize();
    });

    it('should get configuration value with fallback', () => {
      expect(ConfigService.getConfigValue('EXPO_PUBLIC_API_URL')).toBe('http://localhost:8000');
      expect(ConfigService.getConfigValue('NONEXISTENT', 'fallback')).toBe('fallback');
    });

    it('should get boolean configuration values', () => {
      expect(ConfigService.getBooleanConfig('EXPO_PUBLIC_FEATURE_BIOMETRIC_AUTH')).toBe(true);
      expect(ConfigService.getBooleanConfig('EXPO_PUBLIC_FEATURE_SOCIAL_LOGIN')).toBe(false);
      expect(ConfigService.getBooleanConfig('NONEXISTENT', true)).toBe(true);
    });

    it('should handle string boolean values', () => {
      mockConstants.expoConfig.extra.TEST_STRING_TRUE = 'true';
      mockConstants.expoConfig.extra.TEST_STRING_FALSE = 'false';
      mockConstants.expoConfig.extra.TEST_STRING_ONE = '1';
      
      expect(ConfigService.getBooleanConfig('TEST_STRING_TRUE')).toBe(true);
      expect(ConfigService.getBooleanConfig('TEST_STRING_FALSE')).toBe(false);
      expect(ConfigService.getBooleanConfig('TEST_STRING_ONE')).toBe(true);
    });

    it('should get nested values from objects', () => {
      const testObj = {
        level1: {
          level2: {
            value: 'test',
          },
        },
      };
      
      expect(ConfigService.getNestedValue(testObj, 'level1.level2.value')).toBe('test');
      expect(ConfigService.getNestedValue(testObj, 'level1.nonexistent')).toBeUndefined();
    });

    it('should validate URL format', () => {
      expect(ConfigService.isValidUrl('http://localhost:8000')).toBe(true);
      expect(ConfigService.isValidUrl('https://api.example.com')).toBe(true);
      expect(ConfigService.isValidUrl('invalid-url')).toBe(false);
      expect(ConfigService.isValidUrl('')).toBe(false);
    });
  });

  describe('runtime configuration updates', () => {
    beforeEach(async () => {
      await ConfigService.initialize();
    });

    it('should update configuration at runtime', () => {
      const updates = {
        newKey: 'newValue',
        apiUrl: 'http://updated.com',
      };
      
      ConfigService.updateConfig(updates);
      
      expect(ConfigService.get('newKey')).toBe('newValue');
      expect(ConfigService.get('apiUrl')).toBe('http://updated.com');
    });

    it('should reset configuration', async () => {
      ConfigService.updateConfig({ testKey: 'testValue' });
      expect(ConfigService.get('testKey')).toBe('testValue');
      
      await ConfigService.reset();
      
      expect(ConfigService.get('testKey')).toBeNull();
      expect(ConfigService.initialized).toBe(true);
    });
  });

  describe('debug functionality', () => {
    beforeEach(async () => {
      await ConfigService.initialize();
    });

    it('should provide debug information', () => {
      const debugInfo = ConfigService.getDebugInfo();
      
      expect(debugInfo.environment).toBe('test');
      expect(debugInfo.initialized).toBe(true);
      expect(debugInfo.platform).toBe('ios');
      expect(debugInfo.version).toBe('1.0.0');
      expect(Array.isArray(debugInfo.configKeys)).toBe(true);
    });
  });
});