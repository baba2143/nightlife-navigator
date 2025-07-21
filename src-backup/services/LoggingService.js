/**
 * Logging Service
 * Centralized logging system with multiple output targets and log levels
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import ConfigService from './ConfigService';

// Log levels with numeric values for comparison
const LOG_LEVELS = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5,
};

// Log level names
const LOG_LEVEL_NAMES = Object.keys(LOG_LEVELS);

class LoggingService {
  constructor() {
    this.logLevel = LOG_LEVELS.INFO;
    this.loggers = new Map();
    this.logBuffer = [];
    this.maxBufferSize = 1000;
    this.initialized = false;
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.metadata = {};
    
    // Performance tracking
    this.performanceMarks = new Map();
    this.performanceMeasures = [];
  }

  /**
   * Initialize the logging service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Get configuration
      const config = ConfigService.getConfig();
      const loggingConfig = config.logging || {};
      
      // Set log level
      this.setLogLevel(loggingConfig.level || 'info');
      
      // Setup loggers based on environment
      this.setupLoggers(config);
      
      // Load persisted logs if needed
      if (config.isProduction) {
        await this.loadPersistedLogs();
      }
      
      this.initialized = true;
      this.info('[LoggingService] Initialized', { 
        level: this.getCurrentLogLevel(),
        environment: config.environment,
        platform: Platform.OS,
      });
      
    } catch (error) {
      console.error('[LoggingService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Setup loggers based on configuration
   */
  setupLoggers(config) {
    // Always add console logger for development
    if (config.isDevelopment || config.logging?.enableConsole !== false) {
      this.addLogger('console', this.createConsoleLogger());
    }
    
    // Add remote logger for staging/production
    if (config.isStaging || config.isProduction) {
      this.addLogger('remote', this.createRemoteLogger());
    }
    
    // Add local storage logger for persistence
    if (config.logging?.enablePersistence !== false) {
      this.addLogger('storage', this.createStorageLogger());
    }
    
    // Add performance logger
    this.addLogger('performance', this.createPerformanceLogger());
  }

  /**
   * Create console logger
   */
  createConsoleLogger() {
    return {
      log: (level, message, data, context) => {
        const logEntry = this.formatLogEntry(level, message, data, context);
        const consoleMethod = this.getConsoleMethod(level);
        
        if (data && Object.keys(data).length > 0) {
          consoleMethod(`[${logEntry.timestamp}] ${logEntry.level} ${logEntry.message}`, data);
        } else {
          consoleMethod(`[${logEntry.timestamp}] ${logEntry.level} ${logEntry.message}`);
        }
      },
    };
  }

  /**
   * Create remote logger for sending logs to server
   */
  createRemoteLogger() {
    return {
      log: async (level, message, data, context) => {
        try {
          const logEntry = this.formatLogEntry(level, message, data, context);
          
          // Add to buffer for batch sending
          this.logBuffer.push(logEntry);
          
          // Send immediately for errors and fatal logs
          if (level >= LOG_LEVELS.ERROR) {
            await this.flushRemoteLogs();
          }
          
          // Send when buffer is full
          if (this.logBuffer.length >= 100) {
            await this.flushRemoteLogs();
          }
          
        } catch (error) {
          console.warn('[LoggingService] Remote logging failed:', error);
        }
      },
    };
  }

  /**
   * Create storage logger for local persistence
   */
  createStorageLogger() {
    return {
      log: async (level, message, data, context) => {
        try {
          // Only store warnings and errors locally
          if (level >= LOG_LEVELS.WARN) {
            const logEntry = this.formatLogEntry(level, message, data, context);
            await this.persistLogEntry(logEntry);
          }
        } catch (error) {
          console.warn('[LoggingService] Storage logging failed:', error);
        }
      },
    };
  }

  /**
   * Create performance logger
   */
  createPerformanceLogger() {
    return {
      log: (level, message, data, context) => {
        if (message.includes('Performance:') || context?.category === 'performance') {
          this.performanceMeasures.push({
            timestamp: new Date().toISOString(),
            message,
            data,
            context,
          });
          
          // Keep only last 500 performance logs
          if (this.performanceMeasures.length > 500) {
            this.performanceMeasures = this.performanceMeasures.slice(-500);
          }
        }
      },
    };
  }

  /**
   * Set logging level
   */
  setLogLevel(level) {
    const upperLevel = level.toUpperCase();
    if (LOG_LEVELS.hasOwnProperty(upperLevel)) {
      this.logLevel = LOG_LEVELS[upperLevel];
    } else {
      console.warn(`[LoggingService] Invalid log level: ${level}, using INFO`);
      this.logLevel = LOG_LEVELS.INFO;
    }
  }

  /**
   * Get current log level name
   */
  getCurrentLogLevel() {
    return LOG_LEVEL_NAMES.find(name => LOG_LEVELS[name] === this.logLevel) || 'INFO';
  }

  /**
   * Add a logger
   */
  addLogger(name, logger) {
    this.loggers.set(name, logger);
  }

  /**
   * Remove a logger
   */
  removeLogger(name) {
    this.loggers.delete(name);
  }

  /**
   * Set user context
   */
  setUser(userId, userInfo = {}) {
    this.userId = userId;
    this.metadata.user = {
      id: userId,
      ...userInfo,
    };
  }

  /**
   * Set additional metadata
   */
  setMetadata(key, value) {
    this.metadata[key] = value;
  }

  /**
   * Generic log method
   */
  log(level, message, data = {}, context = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    // Add session and user context
    const enrichedContext = {
      ...context,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      ...this.metadata,
    };

    // Send to all loggers
    this.loggers.forEach((logger, name) => {
      try {
        logger.log(level, message, data, enrichedContext);
      } catch (error) {
        console.error(`[LoggingService] Logger ${name} failed:`, error);
      }
    });
  }

  /**
   * Convenience methods for different log levels
   */
  trace(message, data, context) {
    this.log(LOG_LEVELS.TRACE, message, data, context);
  }

  debug(message, data, context) {
    this.log(LOG_LEVELS.DEBUG, message, data, context);
  }

  info(message, data, context) {
    this.log(LOG_LEVELS.INFO, message, data, context);
  }

  warn(message, data, context) {
    this.log(LOG_LEVELS.WARN, message, data, context);
  }

  error(message, data, context) {
    this.log(LOG_LEVELS.ERROR, message, data, context);
  }

  fatal(message, data, context) {
    this.log(LOG_LEVELS.FATAL, message, data, context);
  }

  /**
   * Log API requests and responses
   */
  logApiCall(method, url, requestData, responseData, duration, error = null) {
    const logData = {
      method,
      url,
      duration,
      requestSize: JSON.stringify(requestData || {}).length,
      responseSize: JSON.stringify(responseData || {}).length,
      ...(error && { error: error.message }),
    };

    if (error) {
      this.error(`API Error: ${method} ${url}`, logData, { category: 'api' });
    } else {
      this.info(`API Call: ${method} ${url}`, logData, { category: 'api' });
    }
  }

  /**
   * Log user actions
   */
  logUserAction(action, screen, data = {}) {
    this.info(`User Action: ${action}`, {
      action,
      screen,
      ...data,
    }, { 
      category: 'user_action',
      userId: this.userId,
    });
  }

  /**
   * Log navigation events
   */
  logNavigation(from, to, params = {}) {
    this.info(`Navigation: ${from} -> ${to}`, {
      from,
      to,
      params,
    }, { category: 'navigation' });
  }

  /**
   * Log performance metrics
   */
  logPerformance(metric, value, unit = 'ms', context = {}) {
    this.info(`Performance: ${metric}`, {
      metric,
      value,
      unit,
      ...context,
    }, { category: 'performance' });
  }

  /**
   * Start performance timing
   */
  startTiming(label) {
    this.performanceMarks.set(label, Date.now());
  }

  /**
   * End performance timing and log result
   */
  endTiming(label, context = {}) {
    const startTime = this.performanceMarks.get(label);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.performanceMarks.delete(label);
      this.logPerformance(label, duration, 'ms', context);
      return duration;
    }
    return null;
  }

  /**
   * Check if we should log at this level
   */
  shouldLog(level) {
    return level >= this.logLevel;
  }

  /**
   * Format log entry
   */
  formatLogEntry(level, message, data, context) {
    return {
      timestamp: new Date().toISOString(),
      level: this.getLevelName(level),
      message,
      data: data || {},
      context: context || {},
      sessionId: this.sessionId,
      userId: this.userId,
      platform: Platform.OS,
    };
  }

  /**
   * Get level name from numeric level
   */
  getLevelName(level) {
    return LOG_LEVEL_NAMES.find(name => LOG_LEVELS[name] === level) || 'UNKNOWN';
  }

  /**
   * Get appropriate console method for log level
   */
  getConsoleMethod(level) {
    switch (level) {
      case LOG_LEVELS.TRACE:
      case LOG_LEVELS.DEBUG:
        return console.debug;
      case LOG_LEVELS.INFO:
        return console.info;
      case LOG_LEVELS.WARN:
        return console.warn;
      case LOG_LEVELS.ERROR:
      case LOG_LEVELS.FATAL:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Flush remote logs to server
   */
  async flushRemoteLogs() {
    if (this.logBuffer.length === 0) {
      return;
    }

    try {
      const apiConfig = ConfigService.getApiConfig();
      const logs = [...this.logBuffer];
      this.logBuffer = [];

      const response = await fetch(`${apiConfig.baseURL}/api/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': apiConfig.version,
        },
        body: JSON.stringify({
          logs,
          sessionId: this.sessionId,
          userId: this.userId,
          metadata: this.metadata,
        }),
        timeout: 10000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

    } catch (error) {
      // Re-add logs to buffer if sending failed
      this.logBuffer.unshift(...this.logBuffer);
      
      // Limit buffer size to prevent memory issues
      if (this.logBuffer.length > this.maxBufferSize) {
        this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
      }
      
      console.warn('[LoggingService] Failed to flush logs:', error);
    }
  }

  /**
   * Persist log entry to local storage
   */
  async persistLogEntry(logEntry) {
    try {
      const key = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem(key, JSON.stringify(logEntry));
      
      // Clean up old logs (keep only last 100)
      await this.cleanupOldLogs();
      
    } catch (error) {
      console.warn('[LoggingService] Failed to persist log:', error);
    }
  }

  /**
   * Load persisted logs from storage
   */
  async loadPersistedLogs() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const logKeys = keys.filter(key => key.startsWith('log_'));
      
      if (logKeys.length > 0) {
        const logs = await AsyncStorage.multiGet(logKeys);
        const parsedLogs = logs
          .map(([key, value]) => {
            try {
              return JSON.parse(value);
            } catch {
              return null;
            }
          })
          .filter(Boolean);
        
        // Add to buffer for sending
        this.logBuffer.push(...parsedLogs);
        
        // Remove from storage after loading
        await AsyncStorage.multiRemove(logKeys);
      }
      
    } catch (error) {
      console.warn('[LoggingService] Failed to load persisted logs:', error);
    }
  }

  /**
   * Clean up old logs from storage
   */
  async cleanupOldLogs() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const logKeys = keys.filter(key => key.startsWith('log_')).sort();
      
      if (logKeys.length > 100) {
        const keysToRemove = logKeys.slice(0, logKeys.length - 100);
        await AsyncStorage.multiRemove(keysToRemove);
      }
      
    } catch (error) {
      console.warn('[LoggingService] Failed to cleanup old logs:', error);
    }
  }

  /**
   * Get log statistics
   */
  getLogStatistics() {
    return {
      sessionId: this.sessionId,
      currentLogLevel: this.getCurrentLogLevel(),
      bufferedLogs: this.logBuffer.length,
      performanceMeasures: this.performanceMeasures.length,
      activeLoggers: Array.from(this.loggers.keys()),
    };
  }

  /**
   * Export logs for debugging
   */
  async exportLogs() {
    try {
      const stats = this.getLogStatistics();
      const bufferedLogs = [...this.logBuffer];
      const performanceLogs = [...this.performanceMeasures];
      
      // Get persisted logs
      const keys = await AsyncStorage.getAllKeys();
      const logKeys = keys.filter(key => key.startsWith('log_'));
      const persistedLogs = [];
      
      if (logKeys.length > 0) {
        const logs = await AsyncStorage.multiGet(logKeys);
        logs.forEach(([key, value]) => {
          try {
            persistedLogs.push(JSON.parse(value));
          } catch (error) {
            // Ignore invalid logs
          }
        });
      }
      
      return {
        statistics: stats,
        bufferedLogs,
        persistedLogs,
        performanceLogs,
        metadata: this.metadata,
        exportedAt: new Date().toISOString(),
      };
      
    } catch (error) {
      console.error('[LoggingService] Failed to export logs:', error);
      return null;
    }
  }

  /**
   * Clear all logs
   */
  async clearLogs() {
    try {
      // Clear buffer
      this.logBuffer = [];
      this.performanceMeasures = [];
      this.performanceMarks.clear();
      
      // Clear persisted logs
      const keys = await AsyncStorage.getAllKeys();
      const logKeys = keys.filter(key => key.startsWith('log_'));
      if (logKeys.length > 0) {
        await AsyncStorage.multiRemove(logKeys);
      }
      
      this.info('[LoggingService] All logs cleared');
      
    } catch (error) {
      console.error('[LoggingService] Failed to clear logs:', error);
    }
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
    // Flush any remaining logs
    if (this.logBuffer.length > 0) {
      this.flushRemoteLogs().catch(() => {
        // Ignore errors during cleanup
      });
    }
    
    this.loggers.clear();
    this.logBuffer = [];
    this.performanceMeasures = [];
    this.performanceMarks.clear();
    this.initialized = false;
  }
}

// Create singleton instance
const loggingService = new LoggingService();

export default loggingService;