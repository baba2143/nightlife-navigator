/**
 * Configuration Service
 * Manages application configuration across different environments
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

class ConfigService {
  constructor() {
    this.config = null;
    this.environment = null;
    this.initialized = false;
  }

  /**
   * Initialize the configuration service
   */
  async initialize() {
    if (this.initialized) {
      return this.config;
    }

    try {
      this.environment = this.getEnvironment();
      this.config = await this.loadConfiguration();
      this.initialized = true;
      
      console.log(`[ConfigService] Initialized for environment: ${this.environment}`);
      return this.config;
    } catch (error) {
      console.error('[ConfigService] Failed to initialize:', error);
      throw new Error(`Configuration initialization failed: ${error.message}`);
    }
  }

  /**
   * Get the current environment
   */
  getEnvironment() {
    // Check for explicit environment setting
    if (Constants.expoConfig?.extra?.environment) {
      return Constants.expoConfig.extra.environment;
    }

    // Check public environment variable
    if (Constants.expoConfig?.extra?.EXPO_PUBLIC_ENV) {
      return Constants.expoConfig.extra.EXPO_PUBLIC_ENV;
    }

    // Fallback to development mode detection
    if (__DEV__) {
      return 'development';
    }

    // Default to production if no environment is specified
    return 'production';
  }

  /**
   * Load configuration based on current environment
   */
  async loadConfiguration() {
    const baseConfig = this.getBaseConfiguration();
    const environmentConfig = this.getEnvironmentConfiguration();
    
    // Merge configurations with environment-specific overrides
    const mergedConfig = {
      ...baseConfig,
      ...environmentConfig,
    };

    // Validate required configuration
    this.validateConfiguration(mergedConfig);

    return mergedConfig;
  }

  /**
   * Get base configuration that applies to all environments
   */
  getBaseConfiguration() {
    return {
      // Application info
      appName: 'Nightlife Navigator',
      version: Constants.expoConfig?.version || '1.0.0',
      buildNumber: Constants.expoConfig?.extra?.buildNumber || 1,
      
      // Platform info
      platform: Platform.OS,
      isIOS: Platform.OS === 'ios',
      isAndroid: Platform.OS === 'android',
      isWeb: Platform.OS === 'web',
      
      // Environment info
      environment: this.environment,
      isDevelopment: this.environment === 'development',
      isStaging: this.environment === 'staging',
      isProduction: this.environment === 'production',
      
      // Default timeouts
      defaultTimeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    };
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfiguration() {
    const extra = Constants.expoConfig?.extra || {};
    
    const config = {
      // API Configuration
      apiUrl: this.getConfigValue('EXPO_PUBLIC_API_URL', 'http://localhost:8000'),
      apiTimeout: parseInt(this.getConfigValue('EXPO_PUBLIC_API_TIMEOUT', '30000')),
      apiVersion: this.getConfigValue('EXPO_PUBLIC_API_VERSION', 'v1'),
      
      // Feature Flags
      features: {
        biometricAuth: this.getBooleanConfig('EXPO_PUBLIC_FEATURE_BIOMETRIC_AUTH', true),
        socialLogin: this.getBooleanConfig('EXPO_PUBLIC_FEATURE_SOCIAL_LOGIN', true),
        pushNotifications: this.getBooleanConfig('EXPO_PUBLIC_FEATURE_PUSH_NOTIFICATIONS', false),
        analytics: this.getBooleanConfig('EXPO_PUBLIC_FEATURE_ANALYTICS', false),
        crashReporting: this.getBooleanConfig('EXPO_PUBLIC_FEATURE_CRASH_REPORTING', false),
        performanceMonitoring: this.getBooleanConfig('EXPO_PUBLIC_FEATURE_PERFORMANCE_MONITORING', false),
      },
      
      // Experimental Features
      experimental: {
        venueRecommendations: this.getBooleanConfig('EXPO_PUBLIC_EXPERIMENTAL_VENUE_RECOMMENDATIONS', false),
        arFeatures: this.getBooleanConfig('EXPO_PUBLIC_EXPERIMENTAL_AR_FEATURES', false),
        voiceSearch: this.getBooleanConfig('EXPO_PUBLIC_EXPERIMENTAL_VOICE_SEARCH', false),
      },
      
      // Development Tools
      devTools: {
        enableFlipper: this.getBooleanConfig('EXPO_PUBLIC_ENABLE_FLIPPER', false),
        enableReactotron: this.getBooleanConfig('EXPO_PUBLIC_ENABLE_REACTOTRON', false),
        enableDevMenu: this.getBooleanConfig('EXPO_PUBLIC_ENABLE_DEV_MENU', false),
        useMockData: this.getBooleanConfig('EXPO_PUBLIC_USE_MOCK_DATA', false),
        mockDelay: parseInt(this.getConfigValue('EXPO_PUBLIC_MOCK_DELAY_MS', '0')),
      },
      
      // Performance Settings
      performance: {
        bundleAnalyzer: this.getBooleanConfig('EXPO_PUBLIC_BUNDLE_ANALYZER', false),
        sourceMaps: this.getBooleanConfig('EXPO_PUBLIC_SOURCE_MAPS', true),
        cacheDuration: parseInt(this.getConfigValue('EXPO_PUBLIC_CACHE_DURATION', '3600000')),
        offlineCacheSize: parseInt(this.getConfigValue('EXPO_PUBLIC_OFFLINE_CACHE_SIZE', '50')),
        enablePerformanceMonitoring: this.getBooleanConfig('EXPO_PUBLIC_ENABLE_PERFORMANCE_MONITORING', false),
        enableErrorBoundary: this.getBooleanConfig('EXPO_PUBLIC_ENABLE_ERROR_BOUNDARY', true),
      },
      
      // Legal and Compliance
      legal: {
        privacyPolicyUrl: this.getConfigValue('EXPO_PUBLIC_PRIVACY_POLICY_URL', ''),
        termsOfServiceUrl: this.getConfigValue('EXPO_PUBLIC_TERMS_OF_SERVICE_URL', ''),
        supportUrl: this.getConfigValue('EXPO_PUBLIC_SUPPORT_URL', ''),
      },
      
      // Logging
      logging: {
        level: this.getConfigValue('LOG_LEVEL', 'info'),
        enableConsole: this.environment !== 'production',
        enableRemoteLogging: this.environment === 'production',
      },
    };

    return config;
  }

  /**
   * Get configuration value with fallback
   */
  getConfigValue(key, defaultValue = null) {
    const extra = Constants.expoConfig?.extra || {};
    return extra[key] || process.env[key] || defaultValue;
  }

  /**
   * Get boolean configuration value
   */
  getBooleanConfig(key, defaultValue = false) {
    const value = this.getConfigValue(key, defaultValue.toString());
    if (typeof value === 'boolean') {
      return value;
    }
    return value === 'true' || value === '1';
  }

  /**
   * Validate required configuration
   */
  validateConfiguration(config) {
    const requiredKeys = [
      'apiUrl',
      'environment',
    ];

    const missingKeys = requiredKeys.filter(key => {
      const value = this.getNestedValue(config, key);
      return value === null || value === undefined || value === '';
    });

    if (missingKeys.length > 0) {
      throw new Error(`Missing required configuration: ${missingKeys.join(', ')}`);
    }

    // Validate API URL format
    if (config.apiUrl && !this.isValidUrl(config.apiUrl)) {
      throw new Error(`Invalid API URL format: ${config.apiUrl}`);
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Validate URL format
   */
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Get current configuration
   */
  getConfig() {
    if (!this.initialized) {
      throw new Error('ConfigService not initialized. Call initialize() first.');
    }
    return this.config;
  }

  /**
   * Get specific configuration value
   */
  get(key, defaultValue = null) {
    const config = this.getConfig();
    return this.getNestedValue(config, key) ?? defaultValue;
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(featureName) {
    return this.get(`features.${featureName}`, false);
  }

  /**
   * Check if experimental feature is enabled
   */
  isExperimentalFeatureEnabled(featureName) {
    return this.get(`experimental.${featureName}`, false);
  }

  /**
   * Get API configuration
   */
  getApiConfig() {
    return {
      baseURL: this.get('apiUrl'),
      timeout: this.get('apiTimeout'),
      version: this.get('apiVersion'),
    };
  }

  /**
   * Get performance configuration
   */
  getPerformanceConfig() {
    return this.get('performance', {});
  }

  /**
   * Get logging configuration
   */
  getLoggingConfig() {
    return this.get('logging', {});
  }

  /**
   * Get legal URLs
   */
  getLegalUrls() {
    return this.get('legal', {});
  }

  /**
   * Update configuration at runtime (for dynamic config)
   */
  updateConfig(updates) {
    if (!this.initialized) {
      throw new Error('ConfigService not initialized. Call initialize() first.');
    }

    this.config = {
      ...this.config,
      ...updates,
    };

    console.log('[ConfigService] Configuration updated:', Object.keys(updates));
  }

  /**
   * Reset configuration
   */
  async reset() {
    this.config = null;
    this.initialized = false;
    await this.initialize();
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    return {
      environment: this.environment,
      initialized: this.initialized,
      platform: Platform.OS,
      version: Constants.expoConfig?.version,
      buildNumber: Constants.expoConfig?.extra?.buildNumber,
      configKeys: this.config ? Object.keys(this.config) : [],
    };
  }
}

// Create singleton instance
const configService = new ConfigService();

export default configService;