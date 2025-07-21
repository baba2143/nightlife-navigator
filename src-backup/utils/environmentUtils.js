/**
 * Environment Utilities
 * Helper functions for environment detection and configuration management
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Get the current environment
 */
export const getEnvironment = () => {
  // Check for explicit environment setting in app config
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
};

/**
 * Check if running in development environment
 */
export const isDevelopment = () => {
  return getEnvironment() === 'development';
};

/**
 * Check if running in staging environment
 */
export const isStaging = () => {
  return getEnvironment() === 'staging';
};

/**
 * Check if running in production environment
 */
export const isProduction = () => {
  return getEnvironment() === 'production';
};

/**
 * Get environment-specific configuration value
 */
export const getEnvValue = (key, defaultValue = null) => {
  const extra = Constants.expoConfig?.extra || {};
  return extra[key] || process.env[key] || defaultValue;
};

/**
 * Get boolean environment value
 */
export const getEnvBoolean = (key, defaultValue = false) => {
  const value = getEnvValue(key, defaultValue.toString());
  if (typeof value === 'boolean') {
    return value;
  }
  return value === 'true' || value === '1';
};

/**
 * Get numeric environment value
 */
export const getEnvNumber = (key, defaultValue = 0) => {
  const value = getEnvValue(key, defaultValue.toString());
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Get API base URL for current environment
 */
export const getApiUrl = () => {
  const environment = getEnvironment();
  
  switch (environment) {
    case 'production':
      return getEnvValue('EXPO_PUBLIC_API_URL', 'https://api.nightlife-navigator.com');
    case 'staging':
      return getEnvValue('EXPO_PUBLIC_API_URL', 'https://api-staging.nightlife-navigator.com');
    case 'development':
    default:
      return getEnvValue('EXPO_PUBLIC_API_URL', 'http://localhost:8000');
  }
};

/**
 * Get build information
 */
export const getBuildInfo = () => {
  return {
    version: Constants.expoConfig?.version || '1.0.0',
    buildNumber: getEnvNumber('buildNumber', 1),
    environment: getEnvironment(),
    platform: Platform.OS,
    platformVersion: Platform.Version,
  };
};

/**
 * Check if feature is enabled
 */
export const isFeatureEnabled = (featureName) => {
  const key = `EXPO_PUBLIC_FEATURE_${featureName.toUpperCase()}`;
  return getEnvBoolean(key, false);
};

/**
 * Check if experimental feature is enabled
 */
export const isExperimentalFeatureEnabled = (featureName) => {
  const key = `EXPO_PUBLIC_EXPERIMENTAL_${featureName.toUpperCase()}`;
  return getEnvBoolean(key, false);
};

/**
 * Get all feature flags
 */
export const getFeatureFlags = () => {
  const extra = Constants.expoConfig?.extra || {};
  const features = {};
  
  Object.keys(extra).forEach(key => {
    if (key.startsWith('EXPO_PUBLIC_FEATURE_')) {
      const featureName = key.replace('EXPO_PUBLIC_FEATURE_', '').toLowerCase();
      features[featureName] = getEnvBoolean(key, false);
    }
  });
  
  return features;
};

/**
 * Get all experimental feature flags
 */
export const getExperimentalFeatures = () => {
  const extra = Constants.expoConfig?.extra || {};
  const features = {};
  
  Object.keys(extra).forEach(key => {
    if (key.startsWith('EXPO_PUBLIC_EXPERIMENTAL_')) {
      const featureName = key.replace('EXPO_PUBLIC_EXPERIMENTAL_', '').toLowerCase();
      features[featureName] = getEnvBoolean(key, false);
    }
  });
  
  return features;
};

/**
 * Get development tools configuration
 */
export const getDevToolsConfig = () => {
  return {
    enableFlipper: getEnvBoolean('EXPO_PUBLIC_ENABLE_FLIPPER', isDevelopment()),
    enableReactotron: getEnvBoolean('EXPO_PUBLIC_ENABLE_REACTOTRON', isDevelopment()),
    enableDevMenu: getEnvBoolean('EXPO_PUBLIC_ENABLE_DEV_MENU', isDevelopment()),
    useMockData: getEnvBoolean('EXPO_PUBLIC_USE_MOCK_DATA', isDevelopment()),
    mockDelay: getEnvNumber('EXPO_PUBLIC_MOCK_DELAY_MS', isDevelopment() ? 500 : 0),
  };
};

/**
 * Get performance configuration
 */
export const getPerformanceConfig = () => {
  return {
    enablePerformanceMonitoring: getEnvBoolean('EXPO_PUBLIC_ENABLE_PERFORMANCE_MONITORING', isProduction()),
    enableErrorBoundary: getEnvBoolean('EXPO_PUBLIC_ENABLE_ERROR_BOUNDARY', true),
    cacheDuration: getEnvNumber('EXPO_PUBLIC_CACHE_DURATION', 3600000),
    offlineCacheSize: getEnvNumber('EXPO_PUBLIC_OFFLINE_CACHE_SIZE', 50),
    bundleAnalyzer: getEnvBoolean('EXPO_PUBLIC_BUNDLE_ANALYZER', false),
    sourceMaps: getEnvBoolean('EXPO_PUBLIC_SOURCE_MAPS', !isProduction()),
  };
};

/**
 * Get legal URLs
 */
export const getLegalUrls = () => {
  const baseUrl = isProduction() 
    ? 'https://nightlife-navigator.com'
    : isStaging()
    ? 'https://staging.nightlife-navigator.com'
    : 'http://localhost:8000';

  return {
    privacyPolicy: getEnvValue('EXPO_PUBLIC_PRIVACY_POLICY_URL', `${baseUrl}/privacy`),
    termsOfService: getEnvValue('EXPO_PUBLIC_TERMS_OF_SERVICE_URL', `${baseUrl}/terms`),
    support: getEnvValue('EXPO_PUBLIC_SUPPORT_URL', `${baseUrl}/support`),
  };
};

/**
 * Load environment-specific configuration file
 */
export const loadEnvironmentConfig = async () => {
  const environment = getEnvironment();
  
  try {
    let config;
    
    switch (environment) {
      case 'production':
        config = await import('../../.env.production');
        break;
      case 'staging':
        config = await import('../../.env.staging');
        break;
      case 'development':
      default:
        config = await import('../../.env.development');
        break;
    }
    
    return config.default || config;
  } catch (error) {
    console.warn(`[EnvironmentUtils] Failed to load ${environment} config:`, error);
    return {};
  }
};

/**
 * Validate environment configuration
 */
export const validateEnvironmentConfig = () => {
  const errors = [];
  const warnings = [];
  
  // Required configuration
  const requiredKeys = [
    'EXPO_PUBLIC_API_URL',
    'EXPO_PUBLIC_ENV',
  ];
  
  requiredKeys.forEach(key => {
    if (!getEnvValue(key)) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  });
  
  // Validate API URL format
  const apiUrl = getApiUrl();
  if (apiUrl && !isValidUrl(apiUrl)) {
    errors.push(`Invalid API URL format: ${apiUrl}`);
  }
  
  // Environment-specific validations
  const environment = getEnvironment();
  
  if (environment === 'production') {
    // Production should not have dev tools enabled
    if (getEnvBoolean('EXPO_PUBLIC_ENABLE_DEV_MENU', false)) {
      warnings.push('Development menu is enabled in production');
    }
    
    if (getEnvBoolean('EXPO_PUBLIC_USE_MOCK_DATA', false)) {
      warnings.push('Mock data is enabled in production');
    }
    
    // Production should have monitoring enabled
    if (!getEnvBoolean('EXPO_PUBLIC_FEATURE_ANALYTICS', false)) {
      warnings.push('Analytics is disabled in production');
    }
    
    if (!getEnvBoolean('EXPO_PUBLIC_FEATURE_CRASH_REPORTING', false)) {
      warnings.push('Crash reporting is disabled in production');
    }
  }
  
  if (environment === 'development') {
    // Development should have dev tools
    if (!getEnvBoolean('EXPO_PUBLIC_ENABLE_DEV_MENU', true)) {
      warnings.push('Development menu is disabled in development');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate URL format
 */
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Get debug information about current environment
 */
export const getEnvironmentDebugInfo = () => {
  const validation = validateEnvironmentConfig();
  
  return {
    environment: getEnvironment(),
    apiUrl: getApiUrl(),
    buildInfo: getBuildInfo(),
    features: getFeatureFlags(),
    experimental: getExperimentalFeatures(),
    devTools: getDevToolsConfig(),
    performance: getPerformanceConfig(),
    legal: getLegalUrls(),
    validation,
    constants: {
      __DEV__,
      platform: Platform.OS,
      platformVersion: Platform.Version,
    },
  };
};

/**
 * Switch environment (for development/testing)
 */
export const switchEnvironment = async (newEnvironment) => {
  if (!['development', 'staging', 'production'].includes(newEnvironment)) {
    throw new Error(`Invalid environment: ${newEnvironment}`);
  }
  
  console.warn(`[EnvironmentUtils] Environment switching not supported in runtime`);
  console.warn(`Please rebuild the app with the appropriate environment configuration`);
  
  return false;
};