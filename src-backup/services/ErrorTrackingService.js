/**
 * Error Tracking Service
 * Centralized error tracking and reporting system
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import ConfigService from './ConfigService';
import LoggingService from './LoggingService';

class ErrorTrackingService {
  constructor() {
    this.initialized = false;
    this.errorBuffer = [];
    this.maxBufferSize = 100;
    this.userId = null;
    this.userContext = {};
    this.tags = new Map();
    this.breadcrumbs = [];
    this.maxBreadcrumbs = 50;
    this.sessionId = this.generateSessionId();
    
    // Error handlers
    this.originalErrorHandler = null;
    this.originalRejectionHandler = null;
  }

  /**
   * Initialize error tracking
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      const config = ConfigService.getConfig();
      
      // Only initialize if crash reporting is enabled
      if (!config.features?.crashReporting) {
        console.log('[ErrorTrackingService] Crash reporting disabled');
        return;
      }

      // Setup error handlers
      this.setupErrorHandlers();
      
      // Load persisted errors if in production
      if (config.isProduction) {
        await this.loadPersistedErrors();
      }

      // Set initial context
      this.setContext('app', {
        version: config.version,
        buildNumber: config.buildNumber,
        environment: config.environment,
        platform: Platform.OS,
        platformVersion: Platform.Version,
      });

      this.initialized = true;
      
      LoggingService.info('[ErrorTrackingService] Initialized', {
        crashReporting: config.features?.crashReporting,
        environment: config.environment,
      });

    } catch (error) {
      console.error('[ErrorTrackingService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Setup global error handlers
   */
  setupErrorHandlers() {
    // Handle JavaScript errors
    if (typeof ErrorUtils !== 'undefined') {
      this.originalErrorHandler = ErrorUtils.getGlobalHandler();
      ErrorUtils.setGlobalHandler(this.handleGlobalError.bind(this));
    }

    // Handle unhandled promise rejections
    if (typeof global !== 'undefined' && global.HermesInternal) {
      // For Hermes engine
      this.originalRejectionHandler = global.HermesInternal.getPromiseRejectionTracker();
      global.HermesInternal.enablePromiseRejectionTracker({
        allRejections: true,
        onUnhandled: this.handleUnhandledRejection.bind(this),
        onHandled: () => {
          // Optional: handle when a rejection is handled
        },
      });
    }

    // React Native specific error boundary setup would go here
    // This is typically done at the component level
  }

  /**
   * Handle global JavaScript errors
   */
  handleGlobalError(error, isFatal = false) {
    this.captureError(error, {
      level: isFatal ? 'fatal' : 'error',
      handled: false,
      type: 'javascript',
    });

    // Call original handler if it exists
    if (this.originalErrorHandler) {
      this.originalErrorHandler(error, isFatal);
    }
  }

  /**
   * Handle unhandled promise rejections
   */
  handleUnhandledRejection(id, rejection) {
    const error = rejection instanceof Error ? rejection : new Error(String(rejection));
    
    this.captureError(error, {
      level: 'error',
      handled: false,
      type: 'unhandled_promise',
      rejectionId: id,
    });
  }

  /**
   * Capture an error
   */
  captureError(error, context = {}) {
    if (!this.initialized) {
      console.warn('[ErrorTrackingService] Service not initialized');
      return;
    }

    try {
      const errorData = this.processError(error, context);
      
      // Add to buffer
      this.errorBuffer.push(errorData);
      
      // Limit buffer size
      if (this.errorBuffer.length > this.maxBufferSize) {
        this.errorBuffer = this.errorBuffer.slice(-this.maxBufferSize);
      }

      // Log the error
      LoggingService.error('Error captured', {
        message: errorData.message,
        stack: errorData.stack,
        ...context,
      });

      // Send immediately for fatal errors
      if (context.level === 'fatal' || context.isFatal) {
        this.flushErrors();
      }

      // Persist error locally
      this.persistError(errorData);

    } catch (processingError) {
      console.error('[ErrorTrackingService] Failed to capture error:', processingError);
    }
  }

  /**
   * Process error into standardized format
   */
  processError(error, context = {}) {
    const timestamp = new Date().toISOString();
    
    // Extract error information
    let message = 'Unknown error';
    let stack = '';
    let name = 'Error';

    if (error instanceof Error) {
      message = error.message || 'Unknown error';
      stack = error.stack || '';
      name = error.name || 'Error';
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object') {
      message = error.message || JSON.stringify(error);
      stack = error.stack || '';
      name = error.name || 'Error';
    }

    return {
      id: this.generateErrorId(),
      timestamp,
      message,
      stack,
      name,
      level: context.level || 'error',
      handled: context.handled !== false,
      type: context.type || 'manual',
      
      // Context information
      userId: this.userId,
      sessionId: this.sessionId,
      userContext: { ...this.userContext },
      tags: Object.fromEntries(this.tags),
      breadcrumbs: [...this.breadcrumbs],
      
      // App context
      app: {
        version: ConfigService.get('version'),
        buildNumber: ConfigService.get('buildNumber'),
        environment: ConfigService.get('environment'),
      },
      
      // Device context
      device: {
        platform: Platform.OS,
        platformVersion: Platform.Version,
      },
      
      // Additional context
      extra: context.extra || {},
    };
  }

  /**
   * Capture exception with additional context
   */
  captureException(error, options = {}) {
    this.captureError(error, {
      level: 'error',
      handled: true,
      type: 'exception',
      ...options,
    });
  }

  /**
   * Capture message as error
   */
  captureMessage(message, level = 'info', context = {}) {
    const error = new Error(message);
    this.captureError(error, {
      level,
      handled: true,
      type: 'message',
      ...context,
    });
  }

  /**
   * Set user context
   */
  setUser(userId, userInfo = {}) {
    this.userId = userId;
    this.userContext = {
      id: userId,
      ...userInfo,
    };
    
    LoggingService.setUser(userId, userInfo);
  }

  /**
   * Set tag
   */
  setTag(key, value) {
    this.tags.set(key, value);
  }

  /**
   * Set multiple tags
   */
  setTags(tags) {
    Object.entries(tags).forEach(([key, value]) => {
      this.setTag(key, value);
    });
  }

  /**
   * Set context
   */
  setContext(key, context) {
    this.tags.set(`context.${key}`, context);
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(message, category = 'default', level = 'info', data = {}) {
    const breadcrumb = {
      timestamp: new Date().toISOString(),
      message,
      category,
      level,
      data,
    };

    this.breadcrumbs.push(breadcrumb);

    // Limit breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  /**
   * Clear breadcrumbs
   */
  clearBreadcrumbs() {
    this.breadcrumbs = [];
  }

  /**
   * Wrap function to automatically capture errors
   */
  wrap(func, context = {}) {
    return async (...args) => {
      try {
        return await func(...args);
      } catch (error) {
        this.captureError(error, {
          level: 'error',
          handled: true,
          type: 'wrapped_function',
          ...context,
        });
        throw error;
      }
    };
  }

  /**
   * Create error boundary HOC for React components
   */
  createErrorBoundary(WrappedComponent, errorFallback = null) {
    return class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }

      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }

      componentDidCatch(error, errorInfo) {
        this.captureError(error, {
          level: 'error',
          handled: true,
          type: 'react_error_boundary',
          extra: {
            componentStack: errorInfo.componentStack,
          },
        });
      }

      render() {
        if (this.state.hasError) {
          if (errorFallback) {
            return errorFallback(this.state.error);
          }
          return null;
        }

        return React.createElement(WrappedComponent, this.props);
      }
    };
  }

  /**
   * Flush errors to remote server
   */
  async flushErrors() {
    if (this.errorBuffer.length === 0) {
      return;
    }

    try {
      const apiConfig = ConfigService.getApiConfig();
      const errors = [...this.errorBuffer];
      this.errorBuffer = [];

      const response = await fetch(`${apiConfig.baseURL}/api/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': apiConfig.version,
        },
        body: JSON.stringify({
          errors,
          sessionId: this.sessionId,
          userId: this.userId,
        }),
        timeout: 15000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      LoggingService.debug('[ErrorTrackingService] Errors sent to server', {
        count: errors.length,
      });

    } catch (error) {
      // Re-add errors to buffer if sending failed
      this.errorBuffer.unshift(...this.errorBuffer);
      
      // Limit buffer size
      if (this.errorBuffer.length > this.maxBufferSize) {
        this.errorBuffer = this.errorBuffer.slice(-this.maxBufferSize);
      }
      
      LoggingService.warn('[ErrorTrackingService] Failed to send errors', {
        error: error.message,
      });
    }
  }

  /**
   * Persist error to local storage
   */
  async persistError(errorData) {
    try {
      const key = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem(key, JSON.stringify(errorData));
      
      // Clean up old errors
      await this.cleanupOldErrors();
      
    } catch (error) {
      console.warn('[ErrorTrackingService] Failed to persist error:', error);
    }
  }

  /**
   * Load persisted errors
   */
  async loadPersistedErrors() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const errorKeys = keys.filter(key => key.startsWith('error_'));
      
      if (errorKeys.length > 0) {
        const errors = await AsyncStorage.multiGet(errorKeys);
        const parsedErrors = errors
          .map(([key, value]) => {
            try {
              return JSON.parse(value);
            } catch {
              return null;
            }
          })
          .filter(Boolean);
        
        // Add to buffer
        this.errorBuffer.push(...parsedErrors);
        
        // Remove from storage
        await AsyncStorage.multiRemove(errorKeys);
        
        LoggingService.info('[ErrorTrackingService] Loaded persisted errors', {
          count: parsedErrors.length,
        });
      }
      
    } catch (error) {
      console.warn('[ErrorTrackingService] Failed to load persisted errors:', error);
    }
  }

  /**
   * Clean up old errors from storage
   */
  async cleanupOldErrors() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const errorKeys = keys.filter(key => key.startsWith('error_')).sort();
      
      if (errorKeys.length > 50) {
        const keysToRemove = errorKeys.slice(0, errorKeys.length - 50);
        await AsyncStorage.multiRemove(keysToRemove);
      }
      
    } catch (error) {
      console.warn('[ErrorTrackingService] Failed to cleanup old errors:', error);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStatistics() {
    return {
      sessionId: this.sessionId,
      bufferedErrors: this.errorBuffer.length,
      breadcrumbs: this.breadcrumbs.length,
      tags: this.tags.size,
      userId: this.userId,
    };
  }

  /**
   * Export errors for debugging
   */
  async exportErrors() {
    try {
      const stats = this.getErrorStatistics();
      const bufferedErrors = [...this.errorBuffer];
      const breadcrumbs = [...this.breadcrumbs];
      const tags = Object.fromEntries(this.tags);
      
      return {
        statistics: stats,
        errors: bufferedErrors,
        breadcrumbs,
        tags,
        userContext: this.userContext,
        exportedAt: new Date().toISOString(),
      };
      
    } catch (error) {
      console.error('[ErrorTrackingService] Failed to export errors:', error);
      return null;
    }
  }

  /**
   * Clear all errors
   */
  async clearErrors() {
    try {
      this.errorBuffer = [];
      this.breadcrumbs = [];
      
      // Clear persisted errors
      const keys = await AsyncStorage.getAllKeys();
      const errorKeys = keys.filter(key => key.startsWith('error_'));
      if (errorKeys.length > 0) {
        await AsyncStorage.multiRemove(errorKeys);
      }
      
      LoggingService.info('[ErrorTrackingService] All errors cleared');
      
    } catch (error) {
      console.error('[ErrorTrackingService] Failed to clear errors:', error);
    }
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Restore original error handlers
    if (this.originalErrorHandler && typeof ErrorUtils !== 'undefined') {
      ErrorUtils.setGlobalHandler(this.originalErrorHandler);
    }

    // Flush remaining errors
    if (this.errorBuffer.length > 0) {
      this.flushErrors().catch(() => {
        // Ignore errors during cleanup
      });
    }

    this.errorBuffer = [];
    this.breadcrumbs = [];
    this.tags.clear();
    this.initialized = false;
  }
}

// Create singleton instance
const errorTrackingService = new ErrorTrackingService();

export default errorTrackingService;