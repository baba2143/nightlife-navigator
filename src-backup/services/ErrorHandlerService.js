/**
 * Error Handler Service
 * Comprehensive error handling, classification, and recovery system
 */

import { Platform } from 'react-native';
import * as Updates from 'expo-updates';

import ConfigService from './ConfigService';
import LoggingService from './LoggingService';
import LocalStorageService from './LocalStorageService';
import MonitoringManager from './MonitoringManager';

class ErrorHandlerService {
  constructor() {
    this.initialized = false;
    this.errorCategories = new Map();
    this.errorHandlers = new Map();
    this.recoveryStrategies = new Map();
    this.errorQueue = [];
    this.maxQueueSize = 100;
    
    // Error severity levels
    this.severityLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical',
    };
    
    // Error types
    this.errorTypes = {
      NETWORK: 'network',
      AUTHENTICATION: 'authentication',
      VALIDATION: 'validation',
      PERMISSION: 'permission',
      STORAGE: 'storage',
      UI: 'ui',
      BUSINESS_LOGIC: 'business_logic',
      EXTERNAL_SERVICE: 'external_service',
      UNKNOWN: 'unknown',
    };
    
    // Recovery actions
    this.recoveryActions = {
      RETRY: 'retry',
      FALLBACK: 'fallback',
      RELOAD: 'reload',
      LOGOUT: 'logout',
      RESET: 'reset',
      IGNORE: 'ignore',
      ESCALATE: 'escalate',
    };
    
    // Statistics
    this.stats = {
      totalErrors: 0,
      handledErrors: 0,
      unhandledErrors: 0,
      recoveredErrors: 0,
      criticalErrors: 0,
      errorsByType: {},
      errorsBySeverity: {},
      lastError: null,
    };
    
    // Event listeners
    this.errorListeners = new Set();
    
    // Global error tracking
    this.originalErrorHandler = null;
    this.originalConsoleError = null;
    this.originalPromiseRejection = null;
  }

  /**
   * Initialize error handler service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Setup error categories
      this.setupErrorCategories();
      
      // Setup error handlers
      this.setupErrorHandlers();
      
      // Setup recovery strategies
      this.setupRecoveryStrategies();
      
      // Load error statistics
      await this.loadErrorStats();
      
      // Setup global error handlers
      this.setupGlobalErrorHandlers();
      
      this.initialized = true;
      
      LoggingService.info('[ErrorHandlerService] Initialized', {
        errorCategories: this.errorCategories.size,
        errorHandlers: this.errorHandlers.size,
        recoveryStrategies: this.recoveryStrategies.size,
      });

    } catch (error) {
      LoggingService.error('[ErrorHandlerService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Setup error categories
   */
  setupErrorCategories() {
    // Network errors
    this.errorCategories.set(this.errorTypes.NETWORK, {
      patterns: [
        /network/i,
        /connection/i,
        /timeout/i,
        /fetch/i,
        /xhr/i,
        /cors/i,
        /dns/i,
      ],
      severity: this.severityLevels.MEDIUM,
      recoverable: true,
      userFriendly: true,
    });
    
    // Authentication errors
    this.errorCategories.set(this.errorTypes.AUTHENTICATION, {
      patterns: [
        /unauthorized/i,
        /authentication/i,
        /token/i,
        /login/i,
        /session/i,
        /401/,
        /403/,
      ],
      severity: this.severityLevels.HIGH,
      recoverable: true,
      userFriendly: true,
    });
    
    // Validation errors
    this.errorCategories.set(this.errorTypes.VALIDATION, {
      patterns: [
        /validation/i,
        /invalid/i,
        /required/i,
        /format/i,
        /schema/i,
        /400/,
      ],
      severity: this.severityLevels.LOW,
      recoverable: true,
      userFriendly: true,
    });
    
    // Permission errors
    this.errorCategories.set(this.errorTypes.PERMISSION, {
      patterns: [
        /permission/i,
        /denied/i,
        /forbidden/i,
        /access/i,
        /unauthorized/i,
      ],
      severity: this.severityLevels.MEDIUM,
      recoverable: true,
      userFriendly: true,
    });
    
    // Storage errors
    this.errorCategories.set(this.errorTypes.STORAGE, {
      patterns: [
        /storage/i,
        /database/i,
        /sqlite/i,
        /disk/i,
        /quota/i,
        /memory/i,
      ],
      severity: this.severityLevels.HIGH,
      recoverable: true,
      userFriendly: false,
    });
    
    // UI errors
    this.errorCategories.set(this.errorTypes.UI, {
      patterns: [
        /render/i,
        /component/i,
        /view/i,
        /navigation/i,
        /layout/i,
      ],
      severity: this.severityLevels.MEDIUM,
      recoverable: true,
      userFriendly: false,
    });
    
    // Business logic errors
    this.errorCategories.set(this.errorTypes.BUSINESS_LOGIC, {
      patterns: [
        /business/i,
        /logic/i,
        /rule/i,
        /constraint/i,
      ],
      severity: this.severityLevels.MEDIUM,
      recoverable: true,
      userFriendly: true,
    });
    
    // External service errors
    this.errorCategories.set(this.errorTypes.EXTERNAL_SERVICE, {
      patterns: [
        /api/i,
        /service/i,
        /external/i,
        /third.party/i,
        /500/,
        /502/,
        /503/,
        /504/,
      ],
      severity: this.severityLevels.HIGH,
      recoverable: true,
      userFriendly: true,
    });
    
    LoggingService.debug('[ErrorHandlerService] Error categories setup', {
      categories: Array.from(this.errorCategories.keys()),
    });
  }

  /**
   * Setup error handlers
   */
  setupErrorHandlers() {
    // Network error handler
    this.errorHandlers.set(this.errorTypes.NETWORK, async (error, context) => {
      const recovery = {
        canRecover: true,
        strategy: this.recoveryActions.RETRY,
        maxRetries: 3,
        delay: 2000,
        fallback: () => this.showOfflineMessage(),
      };
      
      return recovery;
    });
    
    // Authentication error handler
    this.errorHandlers.set(this.errorTypes.AUTHENTICATION, async (error, context) => {
      const recovery = {
        canRecover: true,
        strategy: this.recoveryActions.LOGOUT,
        message: '認証エラーが発生しました。再度ログインしてください。',
        action: () => this.handleAuthenticationError(),
      };
      
      return recovery;
    });
    
    // Validation error handler
    this.errorHandlers.set(this.errorTypes.VALIDATION, async (error, context) => {
      const recovery = {
        canRecover: true,
        strategy: this.recoveryActions.IGNORE,
        message: this.extractValidationMessage(error),
        userMessage: true,
      };
      
      return recovery;
    });
    
    // Permission error handler
    this.errorHandlers.set(this.errorTypes.PERMISSION, async (error, context) => {
      const recovery = {
        canRecover: true,
        strategy: this.recoveryActions.FALLBACK,
        message: 'アクセス権限がありません。設定を確認してください。',
        action: () => this.handlePermissionError(error),
      };
      
      return recovery;
    });
    
    // Storage error handler
    this.errorHandlers.set(this.errorTypes.STORAGE, async (error, context) => {
      const recovery = {
        canRecover: true,
        strategy: this.recoveryActions.RESET,
        message: 'ストレージエラーが発生しました。',
        action: () => this.handleStorageError(error),
      };
      
      return recovery;
    });
    
    // UI error handler
    this.errorHandlers.set(this.errorTypes.UI, async (error, context) => {
      const recovery = {
        canRecover: true,
        strategy: this.recoveryActions.RELOAD,
        message: '画面の表示に問題が発生しました。',
        action: () => this.handleUIError(error, context),
      };
      
      return recovery;
    });
    
    LoggingService.debug('[ErrorHandlerService] Error handlers setup', {
      handlers: Array.from(this.errorHandlers.keys()),
    });
  }

  /**
   * Setup recovery strategies
   */
  setupRecoveryStrategies() {
    // Retry strategy
    this.recoveryStrategies.set(this.recoveryActions.RETRY, {
      execute: async (originalFunction, options = {}) => {
        const { maxRetries = 3, delay = 1000, backoff = 1.5 } = options;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            return await originalFunction();
          } catch (error) {
            if (attempt === maxRetries) {
              throw error;
            }
            
            const waitTime = delay * Math.pow(backoff, attempt - 1);
            await this.sleep(waitTime);
            
            LoggingService.debug('[ErrorHandlerService] Retry attempt', {
              attempt,
              maxRetries,
              waitTime,
            });
          }
        }
      },
    });
    
    // Fallback strategy
    this.recoveryStrategies.set(this.recoveryActions.FALLBACK, {
      execute: async (originalFunction, fallbackFunction, options = {}) => {
        try {
          return await originalFunction();
        } catch (error) {
          LoggingService.warn('[ErrorHandlerService] Using fallback', {
            error: error.message,
          });
          
          if (fallbackFunction) {
            return await fallbackFunction();
          }
          
          return null;
        }
      },
    });
    
    // Reload strategy
    this.recoveryStrategies.set(this.recoveryActions.RELOAD, {
      execute: async (options = {}) => {
        const { force = false } = options;
        
        try {
          if (Updates.isAvailableAsync && !force) {
            await Updates.reloadAsync();
          } else {
            // Force reload by restarting the app
            this.forceAppRestart();
          }
        } catch (error) {
          LoggingService.error('[ErrorHandlerService] Reload failed', {
            error: error.message,
          });
        }
      },
    });
    
    LoggingService.debug('[ErrorHandlerService] Recovery strategies setup', {
      strategies: Array.from(this.recoveryStrategies.keys()),
    });
  }

  /**
   * Handle error
   */
  async handleError(error, context = {}) {
    try {
      const errorInfo = this.analyzeError(error, context);
      
      // Update statistics
      this.updateErrorStats(errorInfo);
      
      // Add to error queue
      this.addToErrorQueue(errorInfo);
      
      // Log error
      this.logError(errorInfo);
      
      // Notify listeners
      this.notifyErrorListeners('error_occurred', errorInfo);
      
      // Get recovery strategy
      const recovery = await this.getRecoveryStrategy(errorInfo);
      
      if (recovery && recovery.canRecover) {
        try {
          // Execute recovery
          await this.executeRecovery(recovery, errorInfo);
          
          // Update statistics
          this.stats.recoveredErrors++;
          
          // Notify listeners
          this.notifyErrorListeners('error_recovered', { 
            errorInfo, 
            recovery,
          });
          
          LoggingService.info('[ErrorHandlerService] Error recovered', {
            errorType: errorInfo.type,
            strategy: recovery.strategy,
          });
          
          return { recovered: true, recovery };
          
        } catch (recoveryError) {
          LoggingService.error('[ErrorHandlerService] Recovery failed', {
            originalError: error.message,
            recoveryError: recoveryError.message,
          });
          
          // Escalate if recovery fails
          await this.escalateError(errorInfo, recoveryError);
        }
      } else {
        // Mark as unhandled
        this.stats.unhandledErrors++;
        
        // Escalate unhandled errors
        await this.escalateError(errorInfo);
      }
      
      return { recovered: false, errorInfo };

    } catch (handlingError) {
      LoggingService.error('[ErrorHandlerService] Error handling failed', {
        originalError: error.message,
        handlingError: handlingError.message,
      });
      
      // Fallback to basic error handling
      return this.handleCriticalError(error, handlingError);
    }
  }

  /**
   * Analyze error
   */
  analyzeError(error, context = {}) {
    const errorInfo = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      type: this.classifyError(error),
      severity: this.determineSeverity(error),
      context: {
        ...context,
        platform: Platform.OS,
        appVersion: ConfigService.get('version'),
        userAgent: Platform.constants?.systemName,
      },
      recoverable: false,
      userFriendly: false,
    };
    
    // Enhance error info based on category
    const category = this.errorCategories.get(errorInfo.type);
    if (category) {
      errorInfo.severity = category.severity;
      errorInfo.recoverable = category.recoverable;
      errorInfo.userFriendly = category.userFriendly;
    }
    
    return errorInfo;
  }

  /**
   * Classify error
   */
  classifyError(error) {
    const errorMessage = error.message || '';
    const errorStack = error.stack || '';
    const fullText = `${errorMessage} ${errorStack}`.toLowerCase();
    
    for (const [type, category] of this.errorCategories) {
      for (const pattern of category.patterns) {
        if (pattern.test(fullText)) {
          return type;
        }
      }
    }
    
    return this.errorTypes.UNKNOWN;
  }

  /**
   * Determine error severity
   */
  determineSeverity(error) {
    // Check for critical indicators
    if (this.isCriticalError(error)) {
      return this.severityLevels.CRITICAL;
    }
    
    // Check error status codes
    if (error.status >= 500) {
      return this.severityLevels.HIGH;
    }
    
    if (error.status >= 400) {
      return this.severityLevels.MEDIUM;
    }
    
    return this.severityLevels.LOW;
  }

  /**
   * Check if error is critical
   */
  isCriticalError(error) {
    const criticalPatterns = [
      /critical/i,
      /fatal/i,
      /crash/i,
      /memory/i,
      /out of memory/i,
      /stack overflow/i,
      /security/i,
    ];
    
    const errorText = `${error.message} ${error.stack}`.toLowerCase();
    return criticalPatterns.some(pattern => pattern.test(errorText));
  }

  /**
   * Get recovery strategy
   */
  async getRecoveryStrategy(errorInfo) {
    try {
      const handler = this.errorHandlers.get(errorInfo.type);
      
      if (handler) {
        return await handler(errorInfo, errorInfo.context);
      }
      
      // Default recovery strategy
      return {
        canRecover: false,
        strategy: this.recoveryActions.ESCALATE,
        message: 'Unhandled error occurred',
      };

    } catch (error) {
      LoggingService.error('[ErrorHandlerService] Failed to get recovery strategy', {
        error: error.message,
        errorType: errorInfo.type,
      });
      
      return null;
    }
  }

  /**
   * Execute recovery
   */
  async executeRecovery(recovery, errorInfo) {
    try {
      const strategy = this.recoveryStrategies.get(recovery.strategy);
      
      if (strategy && strategy.execute) {
        await strategy.execute(recovery.action, recovery.options);
      } else if (recovery.action) {
        await recovery.action();
      }
      
      LoggingService.info('[ErrorHandlerService] Recovery executed', {
        strategy: recovery.strategy,
        errorId: errorInfo.id,
      });

    } catch (error) {
      LoggingService.error('[ErrorHandlerService] Recovery execution failed', {
        error: error.message,
        strategy: recovery.strategy,
      });
      throw error;
    }
  }

  /**
   * Escalate error
   */
  async escalateError(errorInfo, recoveryError = null) {
    try {
      // Mark as critical if recovery failed
      if (recoveryError) {
        errorInfo.severity = this.severityLevels.CRITICAL;
        this.stats.criticalErrors++;
      }
      
      // Send to monitoring service
      MonitoringManager.trackError?.(errorInfo.message, {
        errorId: errorInfo.id,
        type: errorInfo.type,
        severity: errorInfo.severity,
        context: errorInfo.context,
        recoveryError: recoveryError?.message,
      });
      
      // Store for later analysis
      await this.storeErrorForAnalysis(errorInfo);
      
      // Notify listeners
      this.notifyErrorListeners('error_escalated', { 
        errorInfo, 
        recoveryError,
      });
      
      LoggingService.warn('[ErrorHandlerService] Error escalated', {
        errorId: errorInfo.id,
        type: errorInfo.type,
        severity: errorInfo.severity,
      });

    } catch (error) {
      LoggingService.error('[ErrorHandlerService] Error escalation failed', {
        error: error.message,
      });
    }
  }

  /**
   * Handle critical error
   */
  handleCriticalError(originalError, handlingError) {
    try {
      // Log critical error
      console.error('[CRITICAL ERROR]', {
        original: originalError.message,
        handling: handlingError.message,
        timestamp: new Date().toISOString(),
      });
      
      // Update statistics
      this.stats.criticalErrors++;
      this.stats.unhandledErrors++;
      
      // Attempt to store error
      try {
        LocalStorageService.setItem('critical_error_log', {
          original: originalError.message,
          handling: handlingError.message,
          timestamp: new Date().toISOString(),
        });
      } catch (storageError) {
        // Ignore storage errors in critical handler
      }
      
      return { recovered: false, critical: true };

    } catch (error) {
      // Last resort - do nothing to prevent infinite loops
      return { recovered: false, critical: true };
    }
  }

  /**
   * Setup global error handlers
   */
  setupGlobalErrorHandlers() {
    // Store original handlers
    this.originalErrorHandler = ErrorUtils?.getGlobalHandler?.();
    this.originalConsoleError = console.error;
    
    // React Native global error handler
    if (ErrorUtils?.setGlobalHandler) {
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        this.handleError(error, { 
          source: 'global',
          isFatal,
        });
        
        // Call original handler
        if (this.originalErrorHandler) {
          this.originalErrorHandler(error, isFatal);
        }
      });
    }
    
    // Promise rejection handler
    const originalHandler = console.warn;
    console.warn = (...args) => {
      const message = args.join(' ');
      if (message.includes('Possible Unhandled Promise Rejection')) {
        this.handleError(new Error(message), { 
          source: 'promise_rejection',
        });
      }
      originalHandler.apply(console, args);
    };
    
    LoggingService.debug('[ErrorHandlerService] Global error handlers setup');
  }

  /**
   * Restore original error handlers
   */
  restoreOriginalErrorHandlers() {
    if (this.originalErrorHandler && ErrorUtils?.setGlobalHandler) {
      ErrorUtils.setGlobalHandler(this.originalErrorHandler);
    }
    
    if (this.originalConsoleError) {
      console.error = this.originalConsoleError;
    }
  }

  // Helper methods

  /**
   * Generate error ID
   */
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update error statistics
   */
  updateErrorStats(errorInfo) {
    this.stats.totalErrors++;
    this.stats.handledErrors++;
    this.stats.lastError = errorInfo;
    
    // Update by type
    if (!this.stats.errorsByType[errorInfo.type]) {
      this.stats.errorsByType[errorInfo.type] = 0;
    }
    this.stats.errorsByType[errorInfo.type]++;
    
    // Update by severity
    if (!this.stats.errorsBySeverity[errorInfo.severity]) {
      this.stats.errorsBySeverity[errorInfo.severity] = 0;
    }
    this.stats.errorsBySeverity[errorInfo.severity]++;
    
    // Update critical count
    if (errorInfo.severity === this.severityLevels.CRITICAL) {
      this.stats.criticalErrors++;
    }
  }

  /**
   * Add to error queue
   */
  addToErrorQueue(errorInfo) {
    this.errorQueue.unshift(errorInfo);
    
    // Limit queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(0, this.maxQueueSize);
    }
  }

  /**
   * Log error
   */
  logError(errorInfo) {
    const logLevel = this.getLogLevel(errorInfo.severity);
    
    LoggingService[logLevel]('[ErrorHandlerService] Error handled', {
      errorId: errorInfo.id,
      type: errorInfo.type,
      severity: errorInfo.severity,
      message: errorInfo.message,
      context: errorInfo.context,
    });
  }

  /**
   * Get log level for severity
   */
  getLogLevel(severity) {
    switch (severity) {
      case this.severityLevels.CRITICAL:
        return 'error';
      case this.severityLevels.HIGH:
        return 'error';
      case this.severityLevels.MEDIUM:
        return 'warn';
      case this.severityLevels.LOW:
        return 'info';
      default:
        return 'debug';
    }
  }

  /**
   * Store error for analysis
   */
  async storeErrorForAnalysis(errorInfo) {
    try {
      const errorKey = `error_analysis_${errorInfo.id}`;
      await LocalStorageService.setItem(errorKey, errorInfo, {
        ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

    } catch (error) {
      LoggingService.warn('[ErrorHandlerService] Failed to store error for analysis', {
        error: error.message,
      });
    }
  }

  /**
   * Load error statistics
   */
  async loadErrorStats() {
    try {
      const stats = await LocalStorageService.getItem('error_handler_stats');
      if (stats) {
        this.stats = { ...this.stats, ...stats };
      }

    } catch (error) {
      LoggingService.warn('[ErrorHandlerService] Failed to load error stats', {
        error: error.message,
      });
    }
  }

  /**
   * Save error statistics
   */
  async saveErrorStats() {
    try {
      await LocalStorageService.setItem('error_handler_stats', this.stats);

    } catch (error) {
      LoggingService.warn('[ErrorHandlerService] Failed to save error stats', {
        error: error.message,
      });
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract validation message
   */
  extractValidationMessage(error) {
    // Extract user-friendly validation message
    const message = error.message || '';
    
    // Remove technical details
    const userMessage = message
      .replace(/validation error:/i, '')
      .replace(/invalid/i, '無効な')
      .replace(/required/i, '必須の')
      .replace(/format/i, '形式の')
      .trim();
    
    return userMessage || '入力内容に問題があります。';
  }

  /**
   * Handle specific error types
   */
  async handleAuthenticationError() {
    // Implementation would handle auth logout
    LoggingService.info('[ErrorHandlerService] Handling authentication error');
  }

  async handlePermissionError(error) {
    // Implementation would handle permission requests
    LoggingService.info('[ErrorHandlerService] Handling permission error');
  }

  async handleStorageError(error) {
    // Implementation would handle storage cleanup
    LoggingService.info('[ErrorHandlerService] Handling storage error');
  }

  async handleUIError(error, context) {
    // Implementation would handle UI recovery
    LoggingService.info('[ErrorHandlerService] Handling UI error');
  }

  showOfflineMessage() {
    // Implementation would show offline message
    LoggingService.info('[ErrorHandlerService] Showing offline message');
  }

  forceAppRestart() {
    // Implementation would restart the app
    LoggingService.info('[ErrorHandlerService] Force app restart');
  }

  /**
   * Add error listener
   */
  addErrorListener(listener) {
    this.errorListeners.add(listener);
    
    return () => {
      this.errorListeners.delete(listener);
    };
  }

  /**
   * Notify error listeners
   */
  notifyErrorListeners(event, data) {
    this.errorListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        LoggingService.error('[ErrorHandlerService] Listener error', {
          error: error.message,
          event,
        });
      }
    });
  }

  /**
   * Get error statistics
   */
  getErrorStatistics() {
    return {
      ...this.stats,
      queueSize: this.errorQueue.length,
      initialized: this.initialized,
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 20) {
    return this.errorQueue.slice(0, limit);
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.restoreOriginalErrorHandlers();
    this.errorListeners.clear();
    this.errorQueue = [];
    this.initialized = false;
  }
}

// Create singleton instance
const errorHandlerService = new ErrorHandlerService();

export default errorHandlerService;