import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';

class LogManagementService {
  constructor() {
    this.initialized = false;
    this.storageService = null;
    this.auditService = null;
    this.logBuffers = {
      application: [],
      system: [],
      security: [],
      performance: [],
      user: []
    };
    this.logConfiguration = {
      maxBufferSize: 1000,
      rotationSize: 10000000, // 10MB
      retentionDays: 30,
      compressionEnabled: true,
      remoteLoggingEnabled: true,
      logLevels: {
        application: ['error', 'warn', 'info', 'debug'],
        system: ['error', 'warn', 'info'],
        security: ['error', 'warn', 'info'],
        performance: ['info', 'debug'],
        user: ['info']
      }
    };
    this.logRotation = {
      enabled: true,
      maxFiles: 10,
      interval: 24 * 60 * 60 * 1000, // 24 hours
      lastRotation: null
    };
    this.logFilters = new Map();
    this.logAnalytics = {
      totalLogs: 0,
      logsByLevel: {},
      logsByCategory: {},
      errorPatterns: [],
      topErrors: []
    };
    this.listeners = [];
    this.rotationTimer = null;
  }

  static getInstance() {
    if (!LogManagementService.instance) {
      LogManagementService.instance = new LogManagementService();
    }
    return LogManagementService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();
      
      await this.loadLogConfiguration();
      await this.loadLogBuffers();
      await this.loadLogFilters();
      await this.loadLogAnalytics();
      await this.startLogRotation();
      
      this.initialized = true;
      
      await this.auditService.logEvent('log_management_service_initialized', {
        timestamp: new Date().toISOString(),
        buffer_categories: Object.keys(this.logBuffers).length,
        rotation_enabled: this.logRotation.enabled
      });
      
      this.emit('serviceInitialized');
    } catch (error) {
      console.error('Failed to initialize LogManagementService:', error);
      throw error;
    }
  }

  async loadLogConfiguration() {
    try {
      const config = await this.storageService.getItem('log_configuration');
      if (config) {
        this.logConfiguration = { ...this.logConfiguration, ...config };
      }
    } catch (error) {
      console.error('Failed to load log configuration:', error);
    }
  }

  async loadLogBuffers() {
    try {
      for (const category of Object.keys(this.logBuffers)) {
        const logs = await this.storageService.getItem(`log_buffer_${category}`);
        this.logBuffers[category] = logs || [];
      }
    } catch (error) {
      console.error('Failed to load log buffers:', error);
    }
  }

  async loadLogFilters() {
    try {
      const filters = await this.storageService.getItem('log_filters');
      const filterList = filters || [
        {
          id: 'error_filter',
          name: 'Error Logs Only',
          category: 'all',
          level: 'error',
          enabled: true
        },
        {
          id: 'security_filter',
          name: 'Security Events',
          category: 'security',
          level: 'all',
          enabled: true
        },
        {
          id: 'performance_filter',
          name: 'Performance Issues',
          category: 'performance',
          level: 'warn',
          enabled: true
        },
        {
          id: 'user_activity_filter',
          name: 'User Activity',
          category: 'user',
          level: 'info',
          enabled: false
        }
      ];

      this.logFilters.clear();
      filterList.forEach(filter => {
        this.logFilters.set(filter.id, filter);
      });

      await this.storageService.setItem('log_filters', filterList);
    } catch (error) {
      console.error('Failed to load log filters:', error);
      this.logFilters.clear();
    }
  }

  async loadLogAnalytics() {
    try {
      const analytics = await this.storageService.getItem('log_analytics');
      if (analytics) {
        this.logAnalytics = { ...this.logAnalytics, ...analytics };
      }
    } catch (error) {
      console.error('Failed to load log analytics:', error);
    }
  }

  async startLogRotation() {
    if (!this.logRotation.enabled) return;

    // Initial rotation check
    await this.checkRotationNeeded();

    // Schedule periodic rotation
    this.rotationTimer = setInterval(async () => {
      try {
        await this.checkRotationNeeded();
      } catch (error) {
        console.error('Log rotation error:', error);
      }
    }, this.logRotation.interval);

    await this.auditService.logEvent('log_rotation_started', {
      interval: this.logRotation.interval,
      max_files: this.logRotation.maxFiles,
      timestamp: new Date().toISOString()
    });
  }

  async log(category, level, message, metadata = {}) {
    try {
      // Validate category and level
      if (!this.logBuffers[category]) {
        category = 'application';
      }

      const allowedLevels = this.logConfiguration.logLevels[category] || ['error', 'warn', 'info'];
      if (!allowedLevels.includes(level)) {
        return;
      }

      const logEntry = {
        id: this.generateLogId(),
        timestamp: new Date().toISOString(),
        category: category,
        level: level,
        message: message,
        metadata: metadata,
        source: metadata.source || 'application',
        userId: metadata.userId || null,
        sessionId: metadata.sessionId || null,
        requestId: metadata.requestId || null,
        stackTrace: metadata.stackTrace || null
      };

      // Add to buffer
      this.logBuffers[category].push(logEntry);

      // Check buffer size and rotate if needed
      if (this.logBuffers[category].length > this.logConfiguration.maxBufferSize) {
        await this.flushBuffer(category);
      }

      // Update analytics
      await this.updateAnalytics(logEntry);

      // Emit log event
      this.emit('logAdded', logEntry);

      // Check for critical errors
      if (level === 'error' && category === 'application') {
        await this.handleCriticalError(logEntry);
      }

      return logEntry;
    } catch (error) {
      console.error('Failed to log message:', error);
    }
  }

  async flushBuffer(category) {
    try {
      if (!this.logBuffers[category] || this.logBuffers[category].length === 0) {
        return;
      }

      const logs = [...this.logBuffers[category]];
      this.logBuffers[category] = [];

      // Save to storage
      await this.saveLogs(category, logs);

      // Send to remote logging if enabled
      if (this.logConfiguration.remoteLoggingEnabled) {
        await this.sendToRemoteLogging(category, logs);
      }

      await this.auditService.logEvent('log_buffer_flushed', {
        category: category,
        log_count: logs.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to flush buffer:', error);
    }
  }

  async saveLogs(category, logs) {
    try {
      const filename = `logs_${category}_${new Date().toISOString().split('T')[0]}.json`;
      const existingLogs = await this.storageService.getItem(filename) || [];
      
      const allLogs = [...existingLogs, ...logs];
      await this.storageService.setItem(filename, allLogs);

      // Check if rotation is needed
      if (this.shouldRotateFile(allLogs)) {
        await this.rotateLogFile(category, filename);
      }
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  async sendToRemoteLogging(category, logs) {
    try {
      // Simulate remote logging
      const remoteEndpoint = process.env.EXPO_PUBLIC_REMOTE_LOGGING_URL || 'https://logs.nightlife-navigator.com/api/logs';
      
      const logData = {
        category: category,
        logs: logs,
        timestamp: new Date().toISOString(),
        source: 'mobile_app',
        version: '1.0.0'
      };

      // In a real implementation, this would make an HTTP request
      console.log(`Sending ${logs.length} logs to remote endpoint:`, remoteEndpoint);
      
      await this.auditService.logEvent('logs_sent_to_remote', {
        category: category,
        log_count: logs.length,
        endpoint: remoteEndpoint,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to send logs to remote:', error);
    }
  }

  async updateAnalytics(logEntry) {
    try {
      this.logAnalytics.totalLogs++;

      // Update logs by level
      if (!this.logAnalytics.logsByLevel[logEntry.level]) {
        this.logAnalytics.logsByLevel[logEntry.level] = 0;
      }
      this.logAnalytics.logsByLevel[logEntry.level]++;

      // Update logs by category
      if (!this.logAnalytics.logsByCategory[logEntry.category]) {
        this.logAnalytics.logsByCategory[logEntry.category] = 0;
      }
      this.logAnalytics.logsByCategory[logEntry.category]++;

      // Track error patterns
      if (logEntry.level === 'error') {
        await this.trackErrorPattern(logEntry);
      }

      // Save analytics
      await this.storageService.setItem('log_analytics', this.logAnalytics);
    } catch (error) {
      console.error('Failed to update analytics:', error);
    }
  }

  async trackErrorPattern(logEntry) {
    try {
      const errorSignature = this.generateErrorSignature(logEntry);
      
      const existingPattern = this.logAnalytics.errorPatterns.find(
        pattern => pattern.signature === errorSignature
      );

      if (existingPattern) {
        existingPattern.count++;
        existingPattern.lastSeen = logEntry.timestamp;
      } else {
        this.logAnalytics.errorPatterns.push({
          signature: errorSignature,
          message: logEntry.message,
          count: 1,
          firstSeen: logEntry.timestamp,
          lastSeen: logEntry.timestamp,
          category: logEntry.category,
          source: logEntry.source
        });
      }

      // Update top errors
      this.logAnalytics.topErrors = this.logAnalytics.errorPatterns
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    } catch (error) {
      console.error('Failed to track error pattern:', error);
    }
  }

  generateErrorSignature(logEntry) {
    // Create a signature based on message content and stack trace
    const message = logEntry.message.toLowerCase();
    const stackTrace = logEntry.stackTrace || '';
    
    // Extract key parts for signature
    const messageHash = this.simpleHash(message);
    const stackHash = this.simpleHash(stackTrace);
    
    return `${messageHash}_${stackHash}`;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  async handleCriticalError(logEntry) {
    try {
      const criticalAlert = {
        id: this.generateLogId(),
        type: 'critical_error',
        logEntry: logEntry,
        timestamp: new Date().toISOString(),
        acknowledged: false
      };

      await this.auditService.logEvent('critical_error_detected', {
        log_id: logEntry.id,
        message: logEntry.message,
        source: logEntry.source,
        timestamp: new Date().toISOString()
      });

      this.emit('criticalError', criticalAlert);
    } catch (error) {
      console.error('Failed to handle critical error:', error);
    }
  }

  async checkRotationNeeded() {
    try {
      const now = new Date();
      const lastRotation = this.logRotation.lastRotation ? new Date(this.logRotation.lastRotation) : null;
      
      if (!lastRotation || (now - lastRotation) > this.logRotation.interval) {
        await this.performLogRotation();
      }
    } catch (error) {
      console.error('Failed to check rotation:', error);
    }
  }

  async performLogRotation() {
    try {
      for (const category of Object.keys(this.logBuffers)) {
        await this.rotateCategory(category);
      }

      this.logRotation.lastRotation = new Date().toISOString();
      await this.storageService.setItem('log_rotation', this.logRotation);

      await this.auditService.logEvent('log_rotation_performed', {
        timestamp: new Date().toISOString(),
        categories: Object.keys(this.logBuffers).length
      });

      this.emit('logRotationCompleted');
    } catch (error) {
      console.error('Failed to perform log rotation:', error);
    }
  }

  async rotateCategory(category) {
    try {
      // Flush current buffer
      await this.flushBuffer(category);

      // Get existing log files for this category
      const logFiles = await this.getLogFiles(category);
      
      // Remove old files if we exceed max files
      if (logFiles.length > this.logRotation.maxFiles) {
        const filesToRemove = logFiles.slice(this.logRotation.maxFiles);
        for (const file of filesToRemove) {
          await this.storageService.removeItem(file);
        }
      }

      // Compress old files if enabled
      if (this.logConfiguration.compressionEnabled) {
        await this.compressOldFiles(category);
      }
    } catch (error) {
      console.error('Failed to rotate category:', error);
    }
  }

  async getLogFiles(category) {
    try {
      // In a real implementation, this would scan the storage for log files
      // For now, we'll simulate with a list of files
      const files = [];
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const filename = `logs_${category}_${date.toISOString().split('T')[0]}.json`;
        files.push(filename);
      }
      
      return files;
    } catch (error) {
      console.error('Failed to get log files:', error);
      return [];
    }
  }

  async compressOldFiles(category) {
    try {
      // Simulate compression
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7); // Compress files older than 7 days
      
      console.log(`Compressing old log files for category: ${category}`);
      
      await this.auditService.logEvent('log_files_compressed', {
        category: category,
        cutoff_date: cutoffDate.toISOString(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to compress old files:', error);
    }
  }

  shouldRotateFile(logs) {
    const size = JSON.stringify(logs).length;
    return size > this.logConfiguration.rotationSize;
  }

  async rotateLogFile(category, filename) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const newFilename = `${filename}_${timestamp}`;
      
      // In a real implementation, this would rename the file
      console.log(`Rotating log file: ${filename} -> ${newFilename}`);
      
      await this.auditService.logEvent('log_file_rotated', {
        category: category,
        old_filename: filename,
        new_filename: newFilename,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  async searchLogs(query) {
    try {
      const results = [];
      
      for (const [category, logs] of Object.entries(this.logBuffers)) {
        const matchingLogs = logs.filter(log => 
          log.message.toLowerCase().includes(query.toLowerCase()) ||
          (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(query.toLowerCase()))
        );
        
        results.push(...matchingLogs);
      }
      
      // Sort by timestamp (newest first)
      results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return results;
    } catch (error) {
      console.error('Failed to search logs:', error);
      return [];
    }
  }

  async getLogsByFilter(filterId) {
    try {
      const filter = this.logFilters.get(filterId);
      if (!filter || !filter.enabled) {
        return [];
      }

      const results = [];
      
      for (const [category, logs] of Object.entries(this.logBuffers)) {
        if (filter.category !== 'all' && filter.category !== category) {
          continue;
        }
        
        const matchingLogs = logs.filter(log => {
          if (filter.level !== 'all' && log.level !== filter.level) {
            return false;
          }
          return true;
        });
        
        results.push(...matchingLogs);
      }
      
      return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Failed to get logs by filter:', error);
      return [];
    }
  }

  async exportLogs(options = {}) {
    try {
      const {
        category = 'all',
        level = 'all',
        startDate = null,
        endDate = null,
        format = 'json'
      } = options;

      let logs = [];
      
      if (category === 'all') {
        for (const categoryLogs of Object.values(this.logBuffers)) {
          logs.push(...categoryLogs);
        }
      } else {
        logs = [...(this.logBuffers[category] || [])];
      }

      // Apply filters
      if (level !== 'all') {
        logs = logs.filter(log => log.level === level);
      }
      
      if (startDate) {
        logs = logs.filter(log => new Date(log.timestamp) >= new Date(startDate));
      }
      
      if (endDate) {
        logs = logs.filter(log => new Date(log.timestamp) <= new Date(endDate));
      }

      // Format output
      if (format === 'csv') {
        return this.formatLogsAsCsv(logs);
      } else if (format === 'txt') {
        return this.formatLogsAsText(logs);
      } else {
        return JSON.stringify(logs, null, 2);
      }
    } catch (error) {
      console.error('Failed to export logs:', error);
      throw error;
    }
  }

  formatLogsAsCsv(logs) {
    const headers = ['Timestamp', 'Category', 'Level', 'Message', 'Source', 'User ID'];
    const rows = logs.map(log => [
      log.timestamp,
      log.category,
      log.level,
      log.message,
      log.source,
      log.userId || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  formatLogsAsText(logs) {
    return logs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}`
    ).join('\n');
  }

  async updateConfiguration(config) {
    try {
      this.logConfiguration = { ...this.logConfiguration, ...config };
      await this.storageService.setItem('log_configuration', this.logConfiguration);

      await this.auditService.logEvent('log_configuration_updated', {
        config: this.logConfiguration,
        timestamp: new Date().toISOString()
      });

      this.emit('configurationUpdated', this.logConfiguration);
      return this.logConfiguration;
    } catch (error) {
      console.error('Failed to update configuration:', error);
      throw error;
    }
  }

  async addLogFilter(filter) {
    try {
      filter.id = filter.id || this.generateLogId();
      this.logFilters.set(filter.id, filter);
      
      const filterList = Array.from(this.logFilters.values());
      await this.storageService.setItem('log_filters', filterList);

      await this.auditService.logEvent('log_filter_added', {
        filter_id: filter.id,
        filter_name: filter.name,
        timestamp: new Date().toISOString()
      });

      this.emit('filterAdded', filter);
      return filter;
    } catch (error) {
      console.error('Failed to add log filter:', error);
      throw error;
    }
  }

  getLogAnalytics() {
    return this.logAnalytics;
  }

  getLogConfiguration() {
    return this.logConfiguration;
  }

  getLogFilters() {
    return Array.from(this.logFilters.values());
  }

  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addEventListener(eventType, callback) {
    this.listeners.push({ eventType, callback });
  }

  removeEventListener(eventType, callback) {
    this.listeners = this.listeners.filter(
      listener => listener.eventType !== eventType || listener.callback !== callback
    );
  }

  emit(eventType, data) {
    this.listeners
      .filter(listener => listener.eventType === eventType)
      .forEach(listener => listener.callback(data));
  }

  async cleanup() {
    try {
      // Flush all buffers
      for (const category of Object.keys(this.logBuffers)) {
        await this.flushBuffer(category);
      }

      // Clear rotation timer
      if (this.rotationTimer) {
        clearInterval(this.rotationTimer);
        this.rotationTimer = null;
      }

      this.listeners = [];
      this.logBuffers = { application: [], system: [], security: [], performance: [], user: [] };
      this.logFilters.clear();
      this.initialized = false;
      
      await this.auditService.logEvent('log_management_service_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup LogManagementService:', error);
    }
  }
}

export { LogManagementService };