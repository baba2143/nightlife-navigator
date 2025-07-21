/**
 * Error Report Service
 * Handles error reporting, crash analytics, and user feedback collection
 */

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';

import LoggingService from './LoggingService';
import LocalStorageService from './LocalStorageService';
import ConfigService from './ConfigService';
import MonitoringManager from './MonitoringManager';

class ErrorReportService {
  constructor() {
    this.initialized = false;
    this.reportQueue = [];
    this.isSubmitting = false;
    this.maxQueueSize = 50;
    this.maxRetries = 3;
    
    // Report configuration
    this.config = {
      enableAutoReporting: true,
      enableUserFeedback: true,
      enableCrashReports: true,
      enablePerformanceReports: true,
      enablePrivacyMode: false,
      reportingEndpoint: null,
      batchSize: 10,
      submitInterval: 300000, // 5 minutes
      includeDeviceInfo: true,
      includeAppInfo: true,
      includeLogs: true,
      logHistoryLimit: 100,
    };
    
    // Report types
    this.reportTypes = {
      CRASH: 'crash',
      ERROR: 'error',
      PERFORMANCE: 'performance',
      USER_FEEDBACK: 'user_feedback',
      MANUAL: 'manual',
    };
    
    // Privacy levels
    this.privacyLevels = {
      FULL: 'full', // Include all data
      MINIMAL: 'minimal', // Only essential data
      ANONYMOUS: 'anonymous', // No user-identifiable data
    };
    
    // Statistics
    this.stats = {
      reportsGenerated: 0,
      reportsSubmitted: 0,
      reportsFailed: 0,
      userFeedbackReports: 0,
      crashReports: 0,
      errorReports: 0,
      performanceReports: 0,
    };
    
    // Event listeners
    this.listeners = new Set();
    this.submitTimer = null;
  }

  /**
   * Initialize error report service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Load configuration
      await this.loadConfiguration();
      
      // Get reporting endpoint from config
      const apiConfig = ConfigService.getApiConfig();
      this.config.reportingEndpoint = `${apiConfig.baseURL}/api/error-reports`;
      
      // Load pending reports
      await this.loadPendingReports();
      
      // Setup automatic submission
      this.setupAutoSubmission();
      
      // Setup global error handling
      this.setupGlobalErrorHandling();
      
      this.initialized = true;
      
      LoggingService.info('[ErrorReportService] Initialized', {
        endpoint: this.config.reportingEndpoint,
        autoReporting: this.config.enableAutoReporting,
        pendingReports: this.reportQueue.length,
      });

    } catch (error) {
      LoggingService.error('[ErrorReportService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Generate error report
   */
  async generateErrorReport(error, context = {}, type = this.reportTypes.ERROR) {
    try {
      const reportId = this.generateReportId();
      const timestamp = new Date().toISOString();
      
      const report = {
        id: reportId,
        type,
        timestamp,
        error: this.sanitizeError(error),
        context: this.sanitizeContext(context),
        device: await this.getDeviceInfo(),
        app: await this.getAppInfo(),
        user: await this.getUserInfo(),
        environment: this.getEnvironmentInfo(),
        logs: await this.getRecentLogs(),
        stackTrace: this.formatStackTrace(error),
        breadcrumbs: this.getBreadcrumbs(),
        metadata: {
          reportId,
          version: '1.0.0',
          privacyLevel: this.getPrivacyLevel(),
        },
      };
      
      // Apply privacy filtering
      const sanitizedReport = this.applyPrivacyFilter(report);
      
      // Add to queue
      this.addToQueue(sanitizedReport);
      
      // Update statistics
      this.updateStatistics(type);
      
      LoggingService.debug('[ErrorReportService] Error report generated', {
        reportId,
        type,
        errorMessage: error.message,
      });
      
      // Notify listeners
      this.notifyListeners('report_generated', {
        reportId,
        type,
        error: error.message,
      });
      
      return reportId;

    } catch (reportError) {
      LoggingService.error('[ErrorReportService] Failed to generate report', {
        error: reportError.message,
        originalError: error.message,
      });
      throw reportError;
    }
  }

  /**
   * Report crash
   */
  async reportCrash(error, context = {}) {
    return await this.generateErrorReport(error, {
      ...context,
      severity: 'critical',
      isCrash: true,
    }, this.reportTypes.CRASH);
  }

  /**
   * Report performance issue
   */
  async reportPerformance(metrics, context = {}) {
    const performanceError = new Error('Performance issue detected');
    performanceError.metrics = metrics;
    
    return await this.generateErrorReport(performanceError, {
      ...context,
      severity: 'warning',
      isPerformance: true,
    }, this.reportTypes.PERFORMANCE);
  }

  /**
   * Report user feedback
   */
  async reportUserFeedback(feedback, attachments = []) {
    const feedbackError = new Error('User feedback report');
    feedbackError.feedback = feedback;
    feedbackError.attachments = attachments;
    
    return await this.generateErrorReport(feedbackError, {
      severity: 'info',
      isUserFeedback: true,
      userInitiated: true,
    }, this.reportTypes.USER_FEEDBACK);
  }

  /**
   * Manual error report
   */
  async reportManual(description, data = {}) {
    const manualError = new Error(description);
    manualError.data = data;
    
    return await this.generateErrorReport(manualError, {
      severity: 'info',
      isManual: true,
      userInitiated: true,
    }, this.reportTypes.MANUAL);
  }

  /**
   * Sanitize error object
   */
  sanitizeError(error) {
    return {
      name: error.name || 'Error',
      message: error.message || 'Unknown error',
      stack: error.stack || '',
      code: error.code,
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      line: error.lineno,
      column: error.colno,
      source: error.filename,
      // Custom properties
      feedback: error.feedback,
      attachments: error.attachments,
      metrics: error.metrics,
      data: error.data,
    };
  }

  /**
   * Sanitize context object
   */
  sanitizeContext(context) {
    // Remove sensitive data
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...context };
    
    const removeSensitiveData = (obj) => {
      for (const key in obj) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          removeSensitiveData(obj[key]);
        }
      }
    };
    
    removeSensitiveData(sanitized);
    return sanitized;
  }

  /**
   * Get device information
   */
  async getDeviceInfo() {
    if (!this.config.includeDeviceInfo) {
      return { included: false };
    }
    
    try {
      return {
        platform: Platform.OS,
        version: Platform.Version,
        model: Device.modelName || 'Unknown',
        brand: Device.brand || 'Unknown',
        manufacturer: Device.manufacturer || 'Unknown',
        deviceType: Device.deviceType,
        isDevice: Device.isDevice,
        osVersion: Device.osVersion,
        memory: Device.totalMemory,
        year: Device.deviceYearClass,
        supportedCpuArchitectures: Device.supportedCpuArchitectures,
      };
    } catch (error) {
      LoggingService.warn('[ErrorReportService] Failed to get device info', {
        error: error.message,
      });
      return { error: 'Failed to retrieve device info' };
    }
  }

  /**
   * Get application information
   */
  async getAppInfo() {
    if (!this.config.includeAppInfo) {
      return { included: false };
    }
    
    try {
      return {
        name: Application.applicationName || 'Unknown',
        version: Application.nativeApplicationVersion || '1.0.0',
        buildVersion: Application.nativeBuildVersion || '1',
        bundleId: Application.applicationId || 'unknown.bundle.id',
        installTime: Application.getInstallationTimeAsync ? 
          await Application.getInstallationTimeAsync() : null,
        lastUpdate: Application.getLastUpdateTimeAsync ? 
          await Application.getLastUpdateTimeAsync() : null,
      };
    } catch (error) {
      LoggingService.warn('[ErrorReportService] Failed to get app info', {
        error: error.message,
      });
      return { error: 'Failed to retrieve app info' };
    }
  }

  /**
   * Get user information
   */
  async getUserInfo() {
    try {
      // Get user data without sensitive information
      const userData = await LocalStorageService.getItem('user_profile');
      
      if (!userData) {
        return { anonymous: true };
      }
      
      return {
        id: userData.id,
        preferences: userData.preferences,
        locale: userData.locale,
        timezone: userData.timezone,
        // Don't include email, name, or other PII
      };
    } catch (error) {
      LoggingService.warn('[ErrorReportService] Failed to get user info', {
        error: error.message,
      });
      return { error: 'Failed to retrieve user info' };
    }
  }

  /**
   * Get environment information
   */
  getEnvironmentInfo() {
    const config = ConfigService.getConfig();
    
    return {
      environment: config.environment || 'production',
      apiVersion: config.api?.version || '1.0',
      features: config.features || {},
      buildTime: config.buildTime,
      gitCommit: config.gitCommit,
    };
  }

  /**
   * Get recent logs
   */
  async getRecentLogs() {
    if (!this.config.includeLogs) {
      return { included: false };
    }
    
    try {
      // This would integrate with the LoggingService to get recent logs
      // For now, return a placeholder
      return {
        entries: [],
        count: 0,
        truncated: false,
      };
    } catch (error) {
      LoggingService.warn('[ErrorReportService] Failed to get recent logs', {
        error: error.message,
      });
      return { error: 'Failed to retrieve logs' };
    }
  }

  /**
   * Format stack trace
   */
  formatStackTrace(error) {
    if (!error.stack) {
      return null;
    }
    
    const lines = error.stack.split('\n');
    return lines.map((line, index) => ({
      line: index + 1,
      content: line.trim(),
      file: this.extractFileName(line),
      lineNumber: this.extractLineNumber(line),
      columnNumber: this.extractColumnNumber(line),
    }));
  }

  /**
   * Extract file name from stack trace line
   */
  extractFileName(line) {
    const match = line.match(/\(([^:]+):/);
    return match ? match[1] : null;
  }

  /**
   * Extract line number from stack trace line
   */
  extractLineNumber(line) {
    const match = line.match(/:(\d+):\d+\)/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Extract column number from stack trace line
   */
  extractColumnNumber(line) {
    const match = line.match(/:(\d+)\)/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Get breadcrumbs (navigation history, user actions)
   */
  getBreadcrumbs() {
    // This would integrate with navigation and user action tracking
    // For now, return a placeholder
    return [];
  }

  /**
   * Get privacy level
   */
  getPrivacyLevel() {
    if (this.config.enablePrivacyMode) {
      return this.privacyLevels.MINIMAL;
    }
    return this.privacyLevels.FULL;
  }

  /**
   * Apply privacy filter to report
   */
  applyPrivacyFilter(report) {
    const privacyLevel = this.getPrivacyLevel();
    
    if (privacyLevel === this.privacyLevels.FULL) {
      return report;
    }
    
    const filtered = { ...report };
    
    if (privacyLevel === this.privacyLevels.MINIMAL) {
      // Remove detailed user info
      filtered.user = { anonymous: true };
      filtered.device = { platform: filtered.device.platform };
      
      // Limit logs
      if (filtered.logs && filtered.logs.entries) {
        filtered.logs.entries = filtered.logs.entries.slice(-10); // Last 10 entries only
      }
    }
    
    if (privacyLevel === this.privacyLevels.ANONYMOUS) {
      // Remove all user-identifiable data
      filtered.user = { anonymous: true };
      filtered.device = { platform: filtered.device.platform };
      filtered.logs = { included: false };
      filtered.breadcrumbs = [];
    }
    
    return filtered;
  }

  /**
   * Add report to queue
   */
  addToQueue(report) {
    this.reportQueue.unshift(report);
    
    // Limit queue size
    if (this.reportQueue.length > this.maxQueueSize) {
      this.reportQueue = this.reportQueue.slice(0, this.maxQueueSize);
    }
    
    // Save to storage
    this.savePendingReports();
    
    // Try immediate submission if enabled
    if (this.config.enableAutoReporting) {
      this.submitReports();
    }
  }

  /**
   * Submit reports to server
   */
  async submitReports() {
    if (this.isSubmitting || this.reportQueue.length === 0) {
      return;
    }
    
    this.isSubmitting = true;
    
    try {
      const batch = this.reportQueue.splice(0, this.config.batchSize);
      
      LoggingService.info('[ErrorReportService] Submitting reports', {
        count: batch.length,
        endpoint: this.config.reportingEndpoint,
      });
      
      const response = await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reports: batch,
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (response.ok) {
        this.stats.reportsSubmitted += batch.length;
        
        LoggingService.info('[ErrorReportService] Reports submitted successfully', {
          count: batch.length,
        });
        
        // Notify listeners
        this.notifyListeners('reports_submitted', {
          count: batch.length,
          success: true,
        });
        
      } else {
        // Put reports back in queue for retry
        this.reportQueue.unshift(...batch);
        this.stats.reportsFailed += batch.length;
        
        LoggingService.error('[ErrorReportService] Failed to submit reports', {
          status: response.status,
          statusText: response.statusText,
        });
        
        // Notify listeners
        this.notifyListeners('reports_submitted', {
          count: batch.length,
          success: false,
          error: `HTTP ${response.status}`,
        });
      }
      
      // Save updated queue
      await this.savePendingReports();

    } catch (error) {
      this.stats.reportsFailed += this.config.batchSize;
      
      LoggingService.error('[ErrorReportService] Error submitting reports', {
        error: error.message,
      });
      
      // Notify listeners
      this.notifyListeners('reports_submitted', {
        count: 0,
        success: false,
        error: error.message,
      });

    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Setup automatic report submission
   */
  setupAutoSubmission() {
    if (this.submitTimer) {
      clearInterval(this.submitTimer);
    }
    
    if (this.config.enableAutoReporting) {
      this.submitTimer = setInterval(() => {
        this.submitReports();
      }, this.config.submitInterval);
    }
  }

  /**
   * Setup global error handling
   */
  setupGlobalErrorHandling() {
    // This would integrate with ErrorHandlerService
    // For now, just log that it's set up
    LoggingService.debug('[ErrorReportService] Global error handling setup');
  }

  /**
   * Load pending reports from storage
   */
  async loadPendingReports() {
    try {
      const pendingReports = await LocalStorageService.getItem('pending_error_reports');
      if (pendingReports && Array.isArray(pendingReports)) {
        this.reportQueue = pendingReports;
        LoggingService.debug('[ErrorReportService] Loaded pending reports', {
          count: this.reportQueue.length,
        });
      }
    } catch (error) {
      LoggingService.warn('[ErrorReportService] Failed to load pending reports', {
        error: error.message,
      });
    }
  }

  /**
   * Save pending reports to storage
   */
  async savePendingReports() {
    try {
      await LocalStorageService.setItem('pending_error_reports', this.reportQueue);
    } catch (error) {
      LoggingService.warn('[ErrorReportService] Failed to save pending reports', {
        error: error.message,
      });
    }
  }

  /**
   * Load configuration from storage
   */
  async loadConfiguration() {
    try {
      const savedConfig = await LocalStorageService.getItem('error_report_config');
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      LoggingService.warn('[ErrorReportService] Failed to load configuration', {
        error: error.message,
      });
    }
  }

  /**
   * Update configuration
   */
  async updateConfiguration(updates) {
    try {
      this.config = { ...this.config, ...updates };
      
      await LocalStorageService.setItem('error_report_config', this.config);
      
      // Restart auto submission with new config
      this.setupAutoSubmission();
      
      LoggingService.info('[ErrorReportService] Configuration updated', updates);
      
    } catch (error) {
      LoggingService.error('[ErrorReportService] Failed to update configuration', {
        error: error.message,
      });
    }
  }

  /**
   * Update statistics
   */
  updateStatistics(type) {
    this.stats.reportsGenerated++;
    
    switch (type) {
      case this.reportTypes.CRASH:
        this.stats.crashReports++;
        break;
      case this.reportTypes.ERROR:
        this.stats.errorReports++;
        break;
      case this.reportTypes.PERFORMANCE:
        this.stats.performanceReports++;
        break;
      case this.reportTypes.USER_FEEDBACK:
        this.stats.userFeedbackReports++;
        break;
    }
  }

  /**
   * Generate report ID
   */
  generateReportId() {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      queueSize: this.reportQueue.length,
      isSubmitting: this.isSubmitting,
      autoReporting: this.config.enableAutoReporting,
      initialized: this.initialized,
    };
  }

  /**
   * Get pending reports count
   */
  getPendingReportsCount() {
    return this.reportQueue.length;
  }

  /**
   * Clear pending reports
   */
  async clearPendingReports() {
    this.reportQueue = [];
    await this.savePendingReports();
    
    LoggingService.info('[ErrorReportService] Pending reports cleared');
  }

  /**
   * Force submit all pending reports
   */
  async forceSubmitAll() {
    LoggingService.info('[ErrorReportService] Force submitting all reports');
    
    while (this.reportQueue.length > 0) {
      await this.submitReports();
      
      // Small delay between batches
      await this.sleep(1000);
    }
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
        LoggingService.error('[ErrorReportService] Listener error', {
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
    if (this.submitTimer) {
      clearInterval(this.submitTimer);
      this.submitTimer = null;
    }
    
    this.listeners.clear();
    this.reportQueue = [];
    this.isSubmitting = false;
    this.initialized = false;
  }
}

// Create singleton instance
const errorReportService = new ErrorReportService();

export default errorReportService;