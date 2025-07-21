/**
 * Monitoring Manager
 * Centralized manager for all monitoring services
 */

import ConfigService from './ConfigService';
import LoggingService from './LoggingService';
import ErrorTrackingService from './ErrorTrackingService';
import PerformanceMonitoringService from './PerformanceMonitoringService';
import CrashReportingService from './CrashReportingService';

class MonitoringManager {
  constructor() {
    this.initialized = false;
    this.services = new Map();
    this.initializationOrder = [
      'logging',
      'errorTracking',
      'performance',
      'crashReporting',
    ];
  }

  /**
   * Initialize all monitoring services
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      const config = ConfigService.getConfig();
      
      console.log('[MonitoringManager] Initializing monitoring services...');

      // Register services
      this.registerServices();

      // Initialize services in order
      for (const serviceName of this.initializationOrder) {
        await this.initializeService(serviceName, config);
      }

      // Setup service integrations
      this.setupServiceIntegrations();

      this.initialized = true;
      
      LoggingService.info('[MonitoringManager] All monitoring services initialized', {
        environment: config.environment,
        enabledServices: Array.from(this.services.keys()).filter(
          name => this.services.get(name).enabled
        ),
      });

    } catch (error) {
      console.error('[MonitoringManager] Failed to initialize monitoring services:', error);
      throw error;
    }
  }

  /**
   * Register all monitoring services
   */
  registerServices() {
    this.services.set('logging', {
      service: LoggingService,
      enabled: false,
      configKey: null, // Always enabled
    });

    this.services.set('errorTracking', {
      service: ErrorTrackingService,
      enabled: false,
      configKey: 'features.crashReporting',
    });

    this.services.set('performance', {
      service: PerformanceMonitoringService,
      enabled: false,
      configKey: 'features.performanceMonitoring',
    });

    this.services.set('crashReporting', {
      service: CrashReportingService,
      enabled: false,
      configKey: 'features.crashReporting',
    });
  }

  /**
   * Initialize a specific service
   */
  async initializeService(serviceName, config) {
    const serviceInfo = this.services.get(serviceName);
    
    if (!serviceInfo) {
      console.warn(`[MonitoringManager] Unknown service: ${serviceName}`);
      return;
    }

    try {
      // Check if service should be enabled
      const shouldEnable = serviceInfo.configKey 
        ? ConfigService.get(serviceInfo.configKey, false)
        : true; // Logging is always enabled

      if (!shouldEnable) {
        console.log(`[MonitoringManager] Service ${serviceName} is disabled`);
        return;
      }

      // Initialize the service
      await serviceInfo.service.initialize();
      serviceInfo.enabled = true;

      console.log(`[MonitoringManager] Service ${serviceName} initialized successfully`);

    } catch (error) {
      console.error(`[MonitoringManager] Failed to initialize ${serviceName}:`, error);
      
      // Don't fail the entire initialization for individual service failures
      serviceInfo.enabled = false;
    }
  }

  /**
   * Setup integrations between services
   */
  setupServiceIntegrations() {
    try {
      // Setup user context propagation
      this.setupUserContextPropagation();
      
      // Setup cross-service event handling
      this.setupCrossServiceEvents();
      
      // Setup performance monitoring integrations
      this.setupPerformanceIntegrations();
      
    } catch (error) {
      console.warn('[MonitoringManager] Failed to setup service integrations:', error);
    }
  }

  /**
   * Setup user context propagation across services
   */
  setupUserContextPropagation() {
    const originalSetUser = LoggingService.setUser?.bind(LoggingService);
    
    if (originalSetUser) {
      LoggingService.setUser = (userId, userInfo) => {
        // Propagate to all monitoring services
        originalSetUser(userId, userInfo);
        
        if (this.services.get('errorTracking')?.enabled) {
          ErrorTrackingService.setUser?.(userId, userInfo);
        }
        
        if (this.services.get('crashReporting')?.enabled) {
          CrashReportingService.setUser?.(userId, userInfo);
        }
      };
    }
  }

  /**
   * Setup cross-service event handling
   */
  setupCrossServiceEvents() {
    // Error tracking integration with crash reporting
    if (this.services.get('errorTracking')?.enabled && this.services.get('crashReporting')?.enabled) {
      const originalCaptureError = ErrorTrackingService.captureError?.bind(ErrorTrackingService);
      
      if (originalCaptureError) {
        ErrorTrackingService.captureError = (error, context) => {
          const result = originalCaptureError(error, context);
          
          // Notify crash reporting of fatal errors
          if (context?.level === 'fatal' || context?.isFatal) {
            CrashReportingService.handleJavaScriptCrash?.(error, context);
          }
          
          return result;
        };
      }
    }
  }

  /**
   * Setup performance monitoring integrations
   */
  setupPerformanceIntegrations() {
    if (!this.services.get('performance')?.enabled) {
      return;
    }

    // Integrate API call monitoring
    this.setupApiCallMonitoring();
    
    // Integrate render monitoring
    this.setupRenderMonitoring();
  }

  /**
   * Setup API call monitoring
   */
  setupApiCallMonitoring() {
    // This would integrate with your HTTP client
    // For now, we'll provide a method to manually track API calls
  }

  /**
   * Setup render monitoring
   */
  setupRenderMonitoring() {
    // This would integrate with React's profiler
    // For now, we'll provide a method to manually track renders
  }

  /**
   * Set user context across all services
   */
  setUser(userId, userInfo = {}) {
    if (this.services.get('logging')?.enabled) {
      LoggingService.setUser?.(userId, userInfo);
    }
    
    if (this.services.get('errorTracking')?.enabled) {
      ErrorTrackingService.setUser?.(userId, userInfo);
    }
    
    if (this.services.get('crashReporting')?.enabled) {
      CrashReportingService.setUser?.(userId, userInfo);
    }
  }

  /**
   * Set context across relevant services
   */
  setContext(key, context) {
    if (this.services.get('errorTracking')?.enabled) {
      ErrorTrackingService.setContext?.(key, context);
    }
  }

  /**
   * Add breadcrumb across relevant services
   */
  addBreadcrumb(message, category = 'default', level = 'info', data = {}) {
    if (this.services.get('errorTracking')?.enabled) {
      ErrorTrackingService.addBreadcrumb?.(message, category, level, data);
    }
  }

  /**
   * Track API call across relevant services
   */
  trackApiCall(method, url, requestData, responseData, duration, error = null) {
    // Log the API call
    if (this.services.get('logging')?.enabled) {
      LoggingService.logApiCall?.(method, url, requestData, responseData, duration, error);
    }
    
    // Record performance metric
    if (this.services.get('performance')?.enabled) {
      PerformanceMonitoringService.recordNetworkMetric?.({
        method,
        url,
        duration,
        success: !error,
        error: error?.message,
      });
    }
    
    // Add breadcrumb
    this.addBreadcrumb(`API ${method} ${url}`, 'api', error ? 'error' : 'info', {
      method,
      url,
      duration,
      success: !error,
    });
  }

  /**
   * Track user action across relevant services
   */
  trackUserAction(action, screen, data = {}) {
    // Log user action
    if (this.services.get('logging')?.enabled) {
      LoggingService.logUserAction?.(action, screen, data);
    }
    
    // Add breadcrumb
    this.addBreadcrumb(`User ${action}`, 'user', 'info', {
      action,
      screen,
      ...data,
    });
    
    // Track interaction performance
    if (this.services.get('performance')?.enabled) {
      return PerformanceMonitoringService.trackInteraction?.(action);
    }
  }

  /**
   * Track navigation across relevant services
   */
  trackNavigation(from, to, params = {}) {
    // Log navigation
    if (this.services.get('logging')?.enabled) {
      LoggingService.logNavigation?.(from, to, params);
    }
    
    // Add breadcrumb
    this.addBreadcrumb(`Navigate ${from} -> ${to}`, 'navigation', 'info', {
      from,
      to,
      params,
    });
  }

  /**
   * Capture error across relevant services
   */
  captureError(error, context = {}) {
    if (this.services.get('errorTracking')?.enabled) {
      ErrorTrackingService.captureError?.(error, context);
    } else {
      // Fallback to logging
      LoggingService.error?.(error.message || String(error), {
        stack: error.stack,
        ...context,
      });
    }
  }

  /**
   * Capture exception across relevant services
   */
  captureException(error, options = {}) {
    if (this.services.get('errorTracking')?.enabled) {
      ErrorTrackingService.captureException?.(error, options);
    } else {
      // Fallback to logging
      LoggingService.error?.(error.message || String(error), {
        stack: error.stack,
        ...options,
      });
    }
  }

  /**
   * Start performance timing
   */
  startTiming(label, category = 'timing') {
    if (this.services.get('performance')?.enabled) {
      PerformanceMonitoringService.startTiming?.(label, category);
    }
    
    if (this.services.get('logging')?.enabled) {
      LoggingService.startTiming?.(label);
    }
  }

  /**
   * End performance timing
   */
  endTiming(label, additionalData = {}) {
    let duration = null;
    
    if (this.services.get('performance')?.enabled) {
      duration = PerformanceMonitoringService.endTiming?.(label, additionalData);
    }
    
    if (this.services.get('logging')?.enabled) {
      LoggingService.endTiming?.(label, additionalData);
    }
    
    return duration;
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStatistics() {
    const stats = {
      initialized: this.initialized,
      services: {},
    };

    this.services.forEach((serviceInfo, serviceName) => {
      stats.services[serviceName] = {
        enabled: serviceInfo.enabled,
        statistics: serviceInfo.enabled && serviceInfo.service.getStatistics 
          ? serviceInfo.service.getStatistics()
          : null,
      };
    });

    return stats;
  }

  /**
   * Export all monitoring data
   */
  async exportMonitoringData() {
    const exportData = {
      exportedAt: new Date().toISOString(),
      statistics: this.getMonitoringStatistics(),
      data: {},
    };

    // Export data from each enabled service
    for (const [serviceName, serviceInfo] of this.services) {
      if (serviceInfo.enabled && serviceInfo.service.exportData) {
        try {
          exportData.data[serviceName] = await serviceInfo.service.exportData();
        } catch (error) {
          console.warn(`[MonitoringManager] Failed to export data from ${serviceName}:`, error);
          exportData.data[serviceName] = null;
        }
      }
    }

    return exportData;
  }

  /**
   * Flush all pending data
   */
  async flushAllData() {
    const promises = [];

    this.services.forEach((serviceInfo, serviceName) => {
      if (serviceInfo.enabled && serviceInfo.service.flush) {
        promises.push(
          serviceInfo.service.flush().catch(error => {
            console.warn(`[MonitoringManager] Failed to flush ${serviceName}:`, error);
          })
        );
      }
    });

    await Promise.all(promises);
  }

  /**
   * Check health of all services
   */
  async checkHealth() {
    const health = {
      overall: 'healthy',
      services: {},
    };

    let hasIssues = false;

    for (const [serviceName, serviceInfo] of this.services) {
      if (serviceInfo.enabled) {
        try {
          const serviceHealth = serviceInfo.service.checkHealth 
            ? await serviceInfo.service.checkHealth()
            : { status: 'unknown' };

          health.services[serviceName] = serviceHealth;

          if (serviceHealth.status !== 'healthy') {
            hasIssues = true;
          }
        } catch (error) {
          health.services[serviceName] = {
            status: 'error',
            error: error.message,
          };
          hasIssues = true;
        }
      } else {
        health.services[serviceName] = {
          status: 'disabled',
        };
      }
    }

    if (hasIssues) {
      health.overall = 'degraded';
    }

    return health;
  }

  /**
   * Cleanup all services
   */
  async cleanup() {
    try {
      // Flush all pending data first
      await this.flushAllData();

      // Cleanup each service
      for (const [serviceName, serviceInfo] of this.services) {
        if (serviceInfo.enabled && serviceInfo.service.cleanup) {
          try {
            await serviceInfo.service.cleanup();
          } catch (error) {
            console.warn(`[MonitoringManager] Failed to cleanup ${serviceName}:`, error);
          }
        }
      }

      this.services.clear();
      this.initialized = false;

    } catch (error) {
      console.error('[MonitoringManager] Failed to cleanup monitoring services:', error);
    }
  }
}

// Create singleton instance
const monitoringManager = new MonitoringManager();

export default monitoringManager;