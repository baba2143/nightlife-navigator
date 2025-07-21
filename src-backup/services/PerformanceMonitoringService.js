/**
 * Performance Monitoring Service
 * Monitors application performance metrics and reports issues
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Dimensions, InteractionManager } from 'react-native';
import ConfigService from './ConfigService';
import LoggingService from './LoggingService';

class PerformanceMonitoringService {
  constructor() {
    this.initialized = false;
    this.metrics = new Map();
    this.timers = new Map();
    this.metricBuffer = [];
    this.maxBufferSize = 200;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    
    // Performance thresholds
    this.thresholds = {
      jsHeapSizeLimit: 100 * 1024 * 1024, // 100MB
      frameDropThreshold: 16.67, // 60fps = 16.67ms per frame
      memoryWarningThreshold: 0.8, // 80% of available memory
      networkTimeout: 30000, // 30 seconds
      renderTime: 1000, // 1 second
    };
    
    // Metrics collection
    this.frameMetrics = [];
    this.memoryMetrics = [];
    this.networkMetrics = [];
    this.renderMetrics = [];
    
    // Observers
    this.performanceObserver = null;
    this.memoryObserver = null;
  }

  /**
   * Initialize performance monitoring
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      const config = ConfigService.getConfig();
      
      // Only initialize if performance monitoring is enabled
      if (!config.features?.performanceMonitoring) {
        console.log('[PerformanceMonitoringService] Performance monitoring disabled');
        return;
      }

      // Setup performance observers
      this.setupPerformanceObservers();
      
      // Start collecting basic metrics
      this.startBasicMetrics();
      
      // Setup periodic metric collection
      this.startPeriodicCollection();

      this.initialized = true;
      
      LoggingService.info('[PerformanceMonitoringService] Initialized', {
        environment: config.environment,
        platform: Platform.OS,
        sessionId: this.sessionId,
      });

    } catch (error) {
      console.error('[PerformanceMonitoringService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Setup performance observers
   */
  setupPerformanceObservers() {
    // Setup frame metrics observer (iOS/Android specific)
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      this.setupFrameMetrics();
    }

    // Setup memory monitoring
    this.setupMemoryMonitoring();

    // Setup interaction tracking
    this.setupInteractionTracking();
  }

  /**
   * Setup frame metrics monitoring
   */
  setupFrameMetrics() {
    try {
      // This would integrate with platform-specific frame monitoring
      // For now, we'll simulate with InteractionManager
      InteractionManager.setDeadline(16.67); // 60fps target
      
      // Monitor interaction completion times
      const originalRunAfterInteractions = InteractionManager.runAfterInteractions;
      InteractionManager.runAfterInteractions = (callback) => {
        const startTime = Date.now();
        
        return originalRunAfterInteractions(() => {
          const duration = Date.now() - startTime;
          
          this.recordFrameMetric({
            type: 'interaction',
            duration,
            timestamp: new Date().toISOString(),
          });
          
          if (callback) {
            callback();
          }
        });
      };
      
    } catch (error) {
      console.warn('[PerformanceMonitoringService] Failed to setup frame metrics:', error);
    }
  }

  /**
   * Setup memory monitoring
   */
  setupMemoryMonitoring() {
    try {
      // Monitor memory usage periodically
      this.memoryObserver = setInterval(() => {
        const memoryInfo = this.getMemoryInfo();
        this.recordMemoryMetric(memoryInfo);
        
        // Check for memory warnings
        if (memoryInfo.usedPercentage > this.thresholds.memoryWarningThreshold) {
          this.reportPerformanceIssue('high_memory_usage', {
            usedPercentage: memoryInfo.usedPercentage,
            usedBytes: memoryInfo.usedBytes,
          });
        }
        
      }, 10000); // Every 10 seconds
      
    } catch (error) {
      console.warn('[PerformanceMonitoringService] Failed to setup memory monitoring:', error);
    }
  }

  /**
   * Setup interaction tracking
   */
  setupInteractionTracking() {
    try {
      // Track user interactions and their performance impact
      this.trackUserInteractions();
      
    } catch (error) {
      console.warn('[PerformanceMonitoringService] Failed to setup interaction tracking:', error);
    }
  }

  /**
   * Start basic metrics collection
   */
  startBasicMetrics() {
    // Record app start metrics
    this.recordMetric('app_start', {
      startTime: this.startTime,
      platform: Platform.OS,
      platformVersion: Platform.Version,
      screenDimensions: Dimensions.get('screen'),
      windowDimensions: Dimensions.get('window'),
    });
  }

  /**
   * Start periodic metric collection
   */
  startPeriodicCollection() {
    // Collect metrics every 30 seconds
    this.metricsInterval = setInterval(() => {
      this.collectPeriodicMetrics();
    }, 30000);
    
    // Flush metrics every 2 minutes
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
    }, 120000);
  }

  /**
   * Collect periodic metrics
   */
  collectPeriodicMetrics() {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        sessionDuration: Date.now() - this.startTime,
        memory: this.getMemoryInfo(),
        performance: this.getPerformanceInfo(),
      };
      
      this.recordMetric('periodic_collection', metrics);
      
    } catch (error) {
      console.warn('[PerformanceMonitoringService] Failed to collect periodic metrics:', error);
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(name, data, category = 'general') {
    const metric = {
      id: this.generateMetricId(),
      name,
      data,
      category,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      platform: Platform.OS,
    };

    this.metrics.set(metric.id, metric);
    this.metricBuffer.push(metric);

    // Limit buffer size
    if (this.metricBuffer.length > this.maxBufferSize) {
      this.metricBuffer = this.metricBuffer.slice(-this.maxBufferSize);
    }

    // Log performance metric
    LoggingService.logPerformance(name, data.duration || data.value || 0, 'ms', {
      category,
      ...data,
    });
  }

  /**
   * Record frame metric
   */
  recordFrameMetric(frameData) {
    this.frameMetrics.push({
      ...frameData,
      sessionId: this.sessionId,
    });

    // Keep only last 100 frame metrics
    if (this.frameMetrics.length > 100) {
      this.frameMetrics = this.frameMetrics.slice(-100);
    }

    // Check for frame drops
    if (frameData.duration > this.thresholds.frameDropThreshold) {
      this.reportPerformanceIssue('frame_drop', frameData);
    }
  }

  /**
   * Record memory metric
   */
  recordMemoryMetric(memoryData) {
    this.memoryMetrics.push({
      ...memoryData,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 100 memory metrics
    if (this.memoryMetrics.length > 100) {
      this.memoryMetrics = this.memoryMetrics.slice(-100);
    }
  }

  /**
   * Record network metric
   */
  recordNetworkMetric(networkData) {
    this.networkMetrics.push({
      ...networkData,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 100 network metrics
    if (this.networkMetrics.length > 100) {
      this.networkMetrics = this.networkMetrics.slice(-100);
    }

    // Check for slow network requests
    if (networkData.duration > this.thresholds.networkTimeout) {
      this.reportPerformanceIssue('slow_network', networkData);
    }
  }

  /**
   * Start timing operation
   */
  startTiming(label, category = 'timing') {
    this.timers.set(label, {
      startTime: Date.now(),
      category,
    });
    
    LoggingService.startTiming(label);
  }

  /**
   * End timing operation
   */
  endTiming(label, additionalData = {}) {
    const timer = this.timers.get(label);
    
    if (timer) {
      const duration = Date.now() - timer.startTime;
      this.timers.delete(label);
      
      this.recordMetric(`timing_${label}`, {
        duration,
        ...additionalData,
      }, timer.category);
      
      LoggingService.endTiming(label, additionalData);
      
      return duration;
    }
    
    return null;
  }

  /**
   * Time a function execution
   */
  timeFunction(func, label, category = 'function') {
    return async (...args) => {
      this.startTiming(label, category);
      
      try {
        const result = await func(...args);
        this.endTiming(label, { success: true });
        return result;
      } catch (error) {
        this.endTiming(label, { success: false, error: error.message });
        throw error;
      }
    };
  }

  /**
   * Monitor React component render performance
   */
  monitorRender(componentName, renderFunction) {
    return (...args) => {
      const startTime = Date.now();
      
      try {
        const result = renderFunction(...args);
        const renderTime = Date.now() - startTime;
        
        this.recordMetric(`render_${componentName}`, {
          renderTime,
          success: true,
        }, 'render');
        
        // Check for slow renders
        if (renderTime > this.thresholds.renderTime) {
          this.reportPerformanceIssue('slow_render', {
            componentName,
            renderTime,
          });
        }
        
        return result;
      } catch (error) {
        const renderTime = Date.now() - startTime;
        
        this.recordMetric(`render_${componentName}`, {
          renderTime,
          success: false,
          error: error.message,
        }, 'render');
        
        throw error;
      }
    };
  }

  /**
   * Track user interactions
   */
  trackUserInteractions() {
    // This would integrate with user interaction tracking
    // For now, we'll provide a method to manually track interactions
  }

  /**
   * Track user interaction
   */
  trackInteraction(interactionName, startTime = Date.now()) {
    return {
      end: (additionalData = {}) => {
        const duration = Date.now() - startTime;
        
        this.recordMetric(`interaction_${interactionName}`, {
          duration,
          ...additionalData,
        }, 'interaction');
      },
    };
  }

  /**
   * Get memory information
   */
  getMemoryInfo() {
    try {
      // This would use platform-specific memory APIs
      // For now, we'll simulate memory info
      const mockMemoryInfo = {
        usedBytes: Math.floor(Math.random() * 100 * 1024 * 1024), // Random between 0-100MB
        totalBytes: 2 * 1024 * 1024 * 1024, // 2GB total
        usedPercentage: 0,
      };
      
      mockMemoryInfo.usedPercentage = mockMemoryInfo.usedBytes / mockMemoryInfo.totalBytes;
      
      return mockMemoryInfo;
    } catch (error) {
      console.warn('[PerformanceMonitoringService] Failed to get memory info:', error);
      return {
        usedBytes: 0,
        totalBytes: 0,
        usedPercentage: 0,
      };
    }
  }

  /**
   * Get performance information
   */
  getPerformanceInfo() {
    try {
      return {
        frameMetricsCount: this.frameMetrics.length,
        memoryMetricsCount: this.memoryMetrics.length,
        networkMetricsCount: this.networkMetrics.length,
        activeTimers: this.timers.size,
        totalMetrics: this.metrics.size,
      };
    } catch (error) {
      console.warn('[PerformanceMonitoringService] Failed to get performance info:', error);
      return {};
    }
  }

  /**
   * Report performance issue
   */
  reportPerformanceIssue(issueType, data) {
    LoggingService.warn(`Performance Issue: ${issueType}`, data, {
      category: 'performance_issue',
    });

    this.recordMetric(`issue_${issueType}`, data, 'issue');
  }

  /**
   * Get performance statistics
   */
  getPerformanceStatistics() {
    const frameStats = this.calculateFrameStatistics();
    const memoryStats = this.calculateMemoryStatistics();
    const networkStats = this.calculateNetworkStatistics();

    return {
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.startTime,
      frameStats,
      memoryStats,
      networkStats,
      totalMetrics: this.metrics.size,
      bufferedMetrics: this.metricBuffer.length,
    };
  }

  /**
   * Calculate frame statistics
   */
  calculateFrameStatistics() {
    if (this.frameMetrics.length === 0) {
      return { count: 0 };
    }

    const durations = this.frameMetrics.map(f => f.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const droppedFrames = durations.filter(d => d > this.thresholds.frameDropThreshold).length;

    return {
      count: this.frameMetrics.length,
      avgDuration,
      maxDuration,
      droppedFrames,
      dropPercentage: (droppedFrames / this.frameMetrics.length) * 100,
    };
  }

  /**
   * Calculate memory statistics
   */
  calculateMemoryStatistics() {
    if (this.memoryMetrics.length === 0) {
      return { count: 0 };
    }

    const usedBytes = this.memoryMetrics.map(m => m.usedBytes);
    const avgUsed = usedBytes.reduce((a, b) => a + b, 0) / usedBytes.length;
    const maxUsed = Math.max(...usedBytes);
    const currentUsed = usedBytes[usedBytes.length - 1] || 0;

    return {
      count: this.memoryMetrics.length,
      avgUsed,
      maxUsed,
      currentUsed,
    };
  }

  /**
   * Calculate network statistics
   */
  calculateNetworkStatistics() {
    if (this.networkMetrics.length === 0) {
      return { count: 0 };
    }

    const durations = this.networkMetrics.map(n => n.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const slowRequests = durations.filter(d => d > this.thresholds.networkTimeout).length;

    return {
      count: this.networkMetrics.length,
      avgDuration,
      maxDuration,
      slowRequests,
      slowPercentage: (slowRequests / this.networkMetrics.length) * 100,
    };
  }

  /**
   * Flush metrics to server
   */
  async flushMetrics() {
    if (this.metricBuffer.length === 0) {
      return;
    }

    try {
      const apiConfig = ConfigService.getApiConfig();
      const metrics = [...this.metricBuffer];
      this.metricBuffer = [];

      const response = await fetch(`${apiConfig.baseURL}/api/performance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': apiConfig.version,
        },
        body: JSON.stringify({
          metrics,
          statistics: this.getPerformanceStatistics(),
          sessionId: this.sessionId,
        }),
        timeout: 15000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      LoggingService.debug('[PerformanceMonitoringService] Metrics sent to server', {
        count: metrics.length,
      });

    } catch (error) {
      // Re-add metrics to buffer if sending failed
      this.metricBuffer.unshift(...this.metricBuffer);
      
      // Limit buffer size
      if (this.metricBuffer.length > this.maxBufferSize) {
        this.metricBuffer = this.metricBuffer.slice(-this.maxBufferSize);
      }
      
      LoggingService.warn('[PerformanceMonitoringService] Failed to send metrics', {
        error: error.message,
      });
    }
  }

  /**
   * Export performance data
   */
  async exportPerformanceData() {
    try {
      const stats = this.getPerformanceStatistics();
      const metrics = Array.from(this.metrics.values());
      
      return {
        statistics: stats,
        metrics,
        frameMetrics: this.frameMetrics,
        memoryMetrics: this.memoryMetrics,
        networkMetrics: this.networkMetrics,
        thresholds: this.thresholds,
        exportedAt: new Date().toISOString(),
      };
      
    } catch (error) {
      console.error('[PerformanceMonitoringService] Failed to export performance data:', error);
      return null;
    }
  }

  /**
   * Generate unique metric ID
   */
  generateMetricId() {
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
    // Clear intervals
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    if (this.memoryObserver) {
      clearInterval(this.memoryObserver);
    }

    // Flush remaining metrics
    if (this.metricBuffer.length > 0) {
      this.flushMetrics().catch(() => {
        // Ignore errors during cleanup
      });
    }

    this.metrics.clear();
    this.timers.clear();
    this.metricBuffer = [];
    this.frameMetrics = [];
    this.memoryMetrics = [];
    this.networkMetrics = [];
    this.initialized = false;
  }
}

// Create singleton instance
const performanceMonitoringService = new PerformanceMonitoringService();

export default performanceMonitoringService;