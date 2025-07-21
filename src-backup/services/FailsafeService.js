/**
 * Failsafe Service
 * Implements failsafe mode and graceful degradation for system resilience
 */

import { Alert, Platform } from 'react-native';
import * as Updates from 'expo-updates';

import LoggingService from './LoggingService';
import LocalStorageService from './LocalStorageService';
import ConfigService from './ConfigService';
import MonitoringManager from './MonitoringManager';
import ErrorHandlerService from './ErrorHandlerService';

class FailsafeService {
  constructor() {
    this.initialized = false;
    this.failsafeMode = false;
    this.degradedServices = new Set();
    this.essentialServices = new Set(['LoggingService', 'LocalStorageService', 'ConfigService']);
    this.serviceStatus = new Map();
    
    // Failsafe configuration
    this.config = {
      criticalErrorThreshold: 5,
      degradationTimeout: 300000, // 5 minutes
      recoveryCheckInterval: 60000, // 1 minute
      maxServiceDowntime: 600000, // 10 minutes
      enableAutoRecovery: true,
      enableGracefulDegradation: true,
    };
    
    // Failsafe modes
    this.modes = {
      NORMAL: 'normal',
      DEGRADED: 'degraded',
      FAILSAFE: 'failsafe',
      EMERGENCY: 'emergency',
    };
    
    this.currentMode = this.modes.NORMAL;
    
    // Service priorities
    this.servicePriorities = {
      essential: ['LoggingService', 'LocalStorageService', 'ConfigService'],
      critical: ['DatabaseService', 'AuthService', 'ErrorHandlerService'],
      important: ['DataSyncService', 'PushNotificationService', 'MonitoringManager'],
      optional: ['FileStorageService', 'AnalyticsService'],
    };
    
    // Fallback functions
    this.fallbackFunctions = new Map();
    
    // Statistics
    this.stats = {
      failsafeModeActivations: 0,
      totalDowntime: 0,
      servicesRecovered: 0,
      criticalErrors: 0,
      degradationEvents: 0,
      recoveryAttempts: 0,
    };
    
    // Event listeners
    this.listeners = new Set();
    this.recoveryTimer = null;
  }

  /**
   * Initialize failsafe service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Load failsafe configuration
      await this.loadFailsafeConfig();
      
      // Setup service monitoring
      this.setupServiceMonitoring();
      
      // Register default fallback functions
      this.registerDefaultFallbacks();
      
      // Setup error handler integration
      this.setupErrorHandlerIntegration();
      
      // Start recovery monitoring
      this.startRecoveryMonitoring();
      
      this.initialized = true;
      
      LoggingService.info('[FailsafeService] Initialized', {
        mode: this.currentMode,
        essentialServices: this.essentialServices.size,
        config: this.config,
      });

    } catch (error) {
      LoggingService.error('[FailsafeService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      
      // Enter emergency mode if initialization fails
      this.enterEmergencyMode(error);
    }
  }

  /**
   * Setup service monitoring
   */
  setupServiceMonitoring() {
    // Initialize service status tracking
    for (const priority of Object.values(this.servicePriorities)) {
      for (const service of priority) {
        this.serviceStatus.set(service, {
          status: 'unknown',
          lastCheck: Date.now(),
          errorCount: 0,
          downSince: null,
          isEssential: this.essentialServices.has(service),
        });
      }
    }
  }

  /**
   * Register a service for monitoring
   */
  registerService(serviceName, priority = 'optional', isEssential = false) {
    if (isEssential) {
      this.essentialServices.add(serviceName);
    }
    
    if (!this.servicePriorities[priority]) {
      this.servicePriorities[priority] = [];
    }
    
    if (!this.servicePriorities[priority].includes(serviceName)) {
      this.servicePriorities[priority].push(serviceName);
    }
    
    this.serviceStatus.set(serviceName, {
      status: 'healthy',
      lastCheck: Date.now(),
      errorCount: 0,
      downSince: null,
      isEssential,
    });
    
    LoggingService.debug('[FailsafeService] Service registered', {
      serviceName,
      priority,
      isEssential,
    });
  }

  /**
   * Report service health
   */
  reportServiceHealth(serviceName, isHealthy, errorInfo = null) {
    const serviceInfo = this.serviceStatus.get(serviceName);
    if (!serviceInfo) {
      return;
    }
    
    const previousStatus = serviceInfo.status;
    serviceInfo.lastCheck = Date.now();
    
    if (isHealthy) {
      if (serviceInfo.status !== 'healthy') {
        // Service recovered
        serviceInfo.status = 'healthy';
        serviceInfo.errorCount = 0;
        serviceInfo.downSince = null;
        
        this.handleServiceRecovery(serviceName, previousStatus);
      }
    } else {
      // Service unhealthy
      serviceInfo.errorCount++;
      
      if (serviceInfo.status === 'healthy') {
        serviceInfo.downSince = Date.now();
      }
      
      // Determine new status based on error count and service priority
      if (serviceInfo.errorCount >= this.config.criticalErrorThreshold) {
        serviceInfo.status = 'critical';
      } else if (serviceInfo.errorCount >= 2) {
        serviceInfo.status = 'degraded';
      } else {
        serviceInfo.status = 'unhealthy';
      }
      
      this.handleServiceFailure(serviceName, serviceInfo, errorInfo);
    }
    
    // Check if we need to change failsafe mode
    this.evaluateFailsafeMode();
  }

  /**
   * Handle service failure
   */
  handleServiceFailure(serviceName, serviceInfo, errorInfo) {
    LoggingService.warn('[FailsafeService] Service failure detected', {
      serviceName,
      status: serviceInfo.status,
      errorCount: serviceInfo.errorCount,
      errorInfo,
    });
    
    // Track analytics
    MonitoringManager.trackEvent?.('service_failure', {
      serviceName,
      status: serviceInfo.status,
      errorCount: serviceInfo.errorCount,
    });
    
    // Add to degraded services if not already there
    if (serviceInfo.status === 'degraded' || serviceInfo.status === 'critical') {
      this.degradedServices.add(serviceName);
      this.stats.degradationEvents++;
    }
    
    // Notify listeners
    this.notifyListeners('service_failure', {
      serviceName,
      status: serviceInfo.status,
      errorCount: serviceInfo.errorCount,
      isEssential: serviceInfo.isEssential,
      errorInfo,
    });
  }

  /**
   * Handle service recovery
   */
  handleServiceRecovery(serviceName, previousStatus) {
    LoggingService.info('[FailsafeService] Service recovered', {
      serviceName,
      previousStatus,
    });
    
    // Remove from degraded services
    this.degradedServices.delete(serviceName);
    this.stats.servicesRecovered++;
    
    // Track analytics
    MonitoringManager.trackEvent?.('service_recovery', {
      serviceName,
      previousStatus,
    });
    
    // Notify listeners
    this.notifyListeners('service_recovery', {
      serviceName,
      previousStatus,
    });
  }

  /**
   * Evaluate and potentially change failsafe mode
   */
  evaluateFailsafeMode() {
    const essentialServicesDown = Array.from(this.essentialServices).filter(
      serviceName => {
        const serviceInfo = this.serviceStatus.get(serviceName);
        return serviceInfo && serviceInfo.status === 'critical';
      }
    );
    
    const criticalServicesDown = this.servicePriorities.critical.filter(
      serviceName => {
        const serviceInfo = this.serviceStatus.get(serviceName);
        return serviceInfo && serviceInfo.status === 'critical';
      }
    );
    
    const newMode = this.determineFailsafeMode(essentialServicesDown, criticalServicesDown);
    
    if (newMode !== this.currentMode) {
      this.changeFailsafeMode(newMode, {
        essentialServicesDown,
        criticalServicesDown,
      });
    }
  }

  /**
   * Determine appropriate failsafe mode
   */
  determineFailsafeMode(essentialServicesDown, criticalServicesDown) {
    if (essentialServicesDown.length > 0) {
      return this.modes.EMERGENCY;
    }
    
    if (criticalServicesDown.length >= 2) {
      return this.modes.FAILSAFE;
    }
    
    if (criticalServicesDown.length > 0 || this.degradedServices.size >= 3) {
      return this.modes.DEGRADED;
    }
    
    return this.modes.NORMAL;
  }

  /**
   * Change failsafe mode
   */
  changeFailsafeMode(newMode, context = {}) {
    const oldMode = this.currentMode;
    this.currentMode = newMode;
    
    LoggingService.warn('[FailsafeService] Failsafe mode changed', {
      from: oldMode,
      to: newMode,
      context,
    });
    
    // Execute mode-specific actions
    switch (newMode) {
      case this.modes.DEGRADED:
        this.enterDegradedMode(context);
        break;
        
      case this.modes.FAILSAFE:
        this.enterFailsafeMode(context);
        break;
        
      case this.modes.EMERGENCY:
        this.enterEmergencyMode(context);
        break;
        
      case this.modes.NORMAL:
        this.enterNormalMode(oldMode);
        break;
    }
    
    // Track analytics
    MonitoringManager.trackEvent?.('failsafe_mode_change', {
      from: oldMode,
      to: newMode,
      context,
    });
    
    // Notify listeners
    this.notifyListeners('mode_change', {
      from: oldMode,
      to: newMode,
      context,
    });
  }

  /**
   * Enter degraded mode
   */
  enterDegradedMode(context) {
    LoggingService.warn('[FailsafeService] Entering degraded mode', context);
    
    // Disable non-essential features
    this.disableOptionalServices();
    
    // Show user notification if appropriate
    this.showUserNotification(
      'サービス制限',
      '一部の機能が制限されています。基本機能は引き続きご利用いただけます。',
      'warning'
    );
    
    this.stats.degradationEvents++;
  }

  /**
   * Enter failsafe mode
   */
  enterFailsafeMode(context) {
    LoggingService.error('[FailsafeService] Entering failsafe mode', context);
    
    this.failsafeMode = true;
    this.stats.failsafeModeActivations++;
    
    // Disable all non-critical services
    this.disableNonCriticalServices();
    
    // Enable fallback functions
    this.enableFallbackFunctions();
    
    // Show user notification
    this.showUserNotification(
      'セーフモード',
      'アプリは安全モードで動作しています。基本機能のみ利用可能です。',
      'error'
    );
    
    // Attempt service recovery
    this.attemptServiceRecovery();
  }

  /**
   * Enter emergency mode
   */
  enterEmergencyMode(context) {
    LoggingService.error('[FailsafeService] Entering emergency mode', context);
    
    // Try to save critical data
    this.saveEmergencyState();
    
    // Show critical error message
    this.showUserNotification(
      '緊急モード',
      '重大なエラーが発生しました。アプリを再起動してください。',
      'critical'
    );
    
    // Attempt app restart after delay
    setTimeout(() => {
      this.attemptAppRestart();
    }, 5000);
  }

  /**
   * Enter normal mode
   */
  enterNormalMode(fromMode) {
    LoggingService.info('[FailsafeService] Returning to normal mode', { fromMode });
    
    this.failsafeMode = false;
    
    // Re-enable services
    this.enableAllServices();
    
    // Disable fallback functions
    this.disableFallbackFunctions();
    
    // Show recovery notification
    if (fromMode !== this.modes.NORMAL) {
      this.showUserNotification(
        '復旧完了',
        'すべての機能が正常に動作しています。',
        'success'
      );
    }
  }

  /**
   * Disable optional services
   */
  disableOptionalServices() {
    for (const serviceName of this.servicePriorities.optional || []) {
      this.disableService(serviceName);
    }
  }

  /**
   * Disable non-critical services
   */
  disableNonCriticalServices() {
    for (const serviceName of this.servicePriorities.optional || []) {
      this.disableService(serviceName);
    }
    
    for (const serviceName of this.servicePriorities.important || []) {
      this.disableService(serviceName);
    }
  }

  /**
   * Disable a specific service
   */
  disableService(serviceName) {
    LoggingService.debug('[FailsafeService] Disabling service', { serviceName });
    
    // This would integrate with actual service lifecycle management
    // For now, we just log and track the state
    
    this.notifyListeners('service_disabled', { serviceName });
  }

  /**
   * Enable all services
   */
  enableAllServices() {
    LoggingService.debug('[FailsafeService] Re-enabling all services');
    
    // This would integrate with actual service lifecycle management
    // For now, we just log and notify
    
    this.notifyListeners('services_enabled', {});
  }

  /**
   * Register fallback function
   */
  registerFallback(serviceName, fallbackFunction) {
    this.fallbackFunctions.set(serviceName, fallbackFunction);
    
    LoggingService.debug('[FailsafeService] Fallback registered', {
      serviceName,
    });
  }

  /**
   * Register default fallback functions
   */
  registerDefaultFallbacks() {
    // Database fallback - use local storage
    this.registerFallback('DatabaseService', {
      execute: async (operation, data) => {
        LoggingService.warn('[FailsafeService] Using database fallback');
        return await LocalStorageService.setItem(`fallback_${operation}`, data);
      },
    });
    
    // Network fallback - use cached data
    this.registerFallback('NetworkService', {
      execute: async (url, options) => {
        LoggingService.warn('[FailsafeService] Using network fallback');
        const cacheKey = `network_cache_${url}`;
        return await LocalStorageService.getItem(cacheKey);
      },
    });
    
    // Authentication fallback - use offline mode
    this.registerFallback('AuthService', {
      execute: async () => {
        LoggingService.warn('[FailsafeService] Using auth fallback');
        return { offline: true, user: null };
      },
    });
  }

  /**
   * Enable fallback functions
   */
  enableFallbackFunctions() {
    LoggingService.info('[FailsafeService] Enabling fallback functions');
    
    // This would integrate with service proxies to redirect calls to fallbacks
    // For now, we just notify that fallbacks are active
    
    this.notifyListeners('fallbacks_enabled', {
      fallbacks: Array.from(this.fallbackFunctions.keys()),
    });
  }

  /**
   * Disable fallback functions
   */
  disableFallbackFunctions() {
    LoggingService.info('[FailsafeService] Disabling fallback functions');
    
    this.notifyListeners('fallbacks_disabled', {});
  }

  /**
   * Attempt service recovery
   */
  attemptServiceRecovery() {
    LoggingService.info('[FailsafeService] Attempting service recovery');
    
    this.stats.recoveryAttempts++;
    
    // Try to reinitialize failed services
    for (const [serviceName, serviceInfo] of this.serviceStatus) {
      if (serviceInfo.status === 'critical') {
        this.attemptServiceRestart(serviceName);
      }
    }
  }

  /**
   * Attempt to restart a specific service
   */
  async attemptServiceRestart(serviceName) {
    try {
      LoggingService.info('[FailsafeService] Attempting service restart', {
        serviceName,
      });
      
      // This would integrate with actual service lifecycle management
      // For now, we simulate a restart attempt
      
      await this.sleep(1000); // Simulate restart time
      
      // Report success (this would be determined by actual service health check)
      this.reportServiceHealth(serviceName, true);
      
    } catch (error) {
      LoggingService.error('[FailsafeService] Service restart failed', {
        serviceName,
        error: error.message,
      });
    }
  }

  /**
   * Save emergency state
   */
  async saveEmergencyState() {
    try {
      const emergencyState = {
        timestamp: Date.now(),
        mode: this.currentMode,
        degradedServices: Array.from(this.degradedServices),
        serviceStatus: Object.fromEntries(this.serviceStatus),
        stats: this.stats,
      };
      
      await LocalStorageService.setItem('emergency_state', emergencyState);
      
      LoggingService.info('[FailsafeService] Emergency state saved');
      
    } catch (error) {
      LoggingService.error('[FailsafeService] Failed to save emergency state', {
        error: error.message,
      });
    }
  }

  /**
   * Attempt app restart
   */
  async attemptAppRestart() {
    try {
      LoggingService.warn('[FailsafeService] Attempting app restart');
      
      if (Platform.OS !== 'web' && Updates.reloadAsync) {
        await Updates.reloadAsync();
      } else {
        // Fallback - show restart instruction
        this.showUserNotification(
          'アプリの再起動',
          '手動でアプリを再起動してください。',
          'critical'
        );
      }
      
    } catch (error) {
      LoggingService.error('[FailsafeService] App restart failed', {
        error: error.message,
      });
    }
  }

  /**
   * Show user notification
   */
  showUserNotification(title, message, type = 'info') {
    LoggingService.info('[FailsafeService] Showing user notification', {
      title,
      message,
      type,
    });
    
    // Show native alert
    Alert.alert(title, message, [{ text: 'OK' }]);
    
    // Notify listeners for custom UI handling
    this.notifyListeners('user_notification', {
      title,
      message,
      type,
    });
  }

  /**
   * Setup error handler integration
   */
  setupErrorHandlerIntegration() {
    ErrorHandlerService.addErrorListener((event, data) => {
      if (event === 'error_escalated') {
        this.stats.criticalErrors++;
        
        // Report service failure based on error context
        if (data.errorInfo.context.service) {
          this.reportServiceHealth(data.errorInfo.context.service, false, data.errorInfo);
        }
      }
    });
  }

  /**
   * Start recovery monitoring
   */
  startRecoveryMonitoring() {
    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
    }
    
    this.recoveryTimer = setInterval(() => {
      this.performRecoveryCheck();
    }, this.config.recoveryCheckInterval);
  }

  /**
   * Perform recovery check
   */
  performRecoveryCheck() {
    if (!this.config.enableAutoRecovery) {
      return;
    }
    
    const now = Date.now();
    
    // Check for services that have been down too long
    for (const [serviceName, serviceInfo] of this.serviceStatus) {
      if (serviceInfo.status === 'critical' && serviceInfo.downSince) {
        const downtime = now - serviceInfo.downSince;
        
        if (downtime > this.config.maxServiceDowntime) {
          LoggingService.warn('[FailsafeService] Service exceeded max downtime', {
            serviceName,
            downtime,
          });
          
          // Attempt recovery
          this.attemptServiceRestart(serviceName);
        }
      }
    }
    
    // Check if we can recover from failsafe mode
    if (this.currentMode !== this.modes.NORMAL) {
      this.evaluateFailsafeMode();
    }
  }

  /**
   * Load failsafe configuration
   */
  async loadFailsafeConfig() {
    try {
      const savedConfig = await LocalStorageService.getItem('failsafe_config');
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig };
      }

    } catch (error) {
      LoggingService.warn('[FailsafeService] Failed to load failsafe config', {
        error: error.message,
      });
    }
  }

  /**
   * Update failsafe configuration
   */
  async updateConfig(updates) {
    try {
      this.config = { ...this.config, ...updates };
      
      await LocalStorageService.setItem('failsafe_config', this.config);
      
      LoggingService.info('[FailsafeService] Configuration updated', updates);
      
    } catch (error) {
      LoggingService.error('[FailsafeService] Failed to update config', {
        error: error.message,
      });
    }
  }

  /**
   * Get current status
   */
  getCurrentStatus() {
    const healthyServices = Array.from(this.serviceStatus.values()).filter(
      info => info.status === 'healthy'
    ).length;
    
    const degradedServices = Array.from(this.serviceStatus.values()).filter(
      info => info.status === 'degraded'
    ).length;
    
    const criticalServices = Array.from(this.serviceStatus.values()).filter(
      info => info.status === 'critical'
    ).length;
    
    return {
      mode: this.currentMode,
      failsafeMode: this.failsafeMode,
      services: {
        total: this.serviceStatus.size,
        healthy: healthyServices,
        degraded: degradedServices,
        critical: criticalServices,
      },
      degradedServices: Array.from(this.degradedServices),
      stats: this.stats,
      initialized: this.initialized,
    };
  }

  /**
   * Force failsafe mode
   */
  forceFailsafeMode(reason = 'Manual activation') {
    LoggingService.warn('[FailsafeService] Manually forcing failsafe mode', {
      reason,
    });
    
    this.changeFailsafeMode(this.modes.FAILSAFE, { reason, manual: true });
  }

  /**
   * Force normal mode
   */
  forceNormalMode(reason = 'Manual recovery') {
    LoggingService.info('[FailsafeService] Manually forcing normal mode', {
      reason,
    });
    
    this.changeFailsafeMode(this.modes.NORMAL, { reason, manual: true });
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Add event listener
   */
  addListener(listener) {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify event listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        LoggingService.error('[FailsafeService] Listener error', {
          error: error.message,
          event,
        });
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
      this.recoveryTimer = null;
    }
    
    this.listeners.clear();
    this.fallbackFunctions.clear();
    this.degradedServices.clear();
    this.serviceStatus.clear();
    this.initialized = false;
  }
}

// Create singleton instance
const failsafeService = new FailsafeService();

export default failsafeService;