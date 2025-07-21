import { config } from '../config';
import errorHandler from './errorHandler';

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.isEnabled = config.APP_CONFIG.features.analytics;
    this.maxMetrics = 1000;
  }

  // パフォーマンス測定を開始
  startTimer(operation) {
    if (!this.isEnabled) return null;

    const startTime = performance.now();
    const timerId = `${operation}_${Date.now()}_${Math.random()}`;

    this.metrics.set(timerId, {
      operation,
      startTime,
      endTime: null,
      duration: null,
      status: 'running'
    });

    return timerId;
  }

  // パフォーマンス測定を終了
  endTimer(timerId, status = 'completed') {
    if (!this.isEnabled || !timerId) return null;

    const metric = this.metrics.get(timerId);
    if (!metric) return null;

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;
    metric.status = status;

    // パフォーマンス問題をチェック
    this.checkPerformanceThreshold(operation, duration);

    // メトリクスが上限に達した場合、古いものを削除
    if (this.metrics.size > this.maxMetrics) {
      this.cleanupOldMetrics();
    }

    return metric;
  }

  // パフォーマンス閾値をチェック
  checkPerformanceThreshold(operation, duration) {
    const thresholds = {
      api_call: 5000,      // 5秒
      screen_load: 3000,   // 3秒
      image_load: 2000,    // 2秒
      animation: 1000,     // 1秒
      default: 5000        // デフォルト5秒
    };

    const threshold = thresholds[operation] || thresholds.default;
    
    if (duration > threshold) {
      errorHandler.handlePerformanceError(operation, duration, threshold);
    }
  }

  // 古いメトリクスをクリーンアップ
  cleanupOldMetrics() {
    const sortedMetrics = Array.from(this.metrics.entries())
      .sort((a, b) => b[1].startTime - a[1].startTime)
      .slice(0, this.maxMetrics / 2);

    this.metrics.clear();
    sortedMetrics.forEach(([key, value]) => {
      this.metrics.set(key, value);
    });
  }

  // API呼び出しのパフォーマンスを測定
  async measureApiCall(apiCall, operation = 'api_call') {
    const timerId = this.startTimer(operation);
    
    try {
      const startTime = Date.now();
      const result = await apiCall();
      const endTime = Date.now();
      
      this.endTimer(timerId, 'success');
      
      return {
        result,
        performance: {
          duration: endTime - startTime,
          operation
        }
      };
    } catch (error) {
      this.endTimer(timerId, 'error');
      throw error;
    }
  }

  // 画面読み込みのパフォーマンスを測定
  measureScreenLoad(screenName) {
    const timerId = this.startTimer(`screen_load_${screenName}`);
    
    return {
      end: () => this.endTimer(timerId, 'completed'),
      cancel: () => this.endTimer(timerId, 'cancelled')
    };
  }

  // 画像読み込みのパフォーマンスを測定
  measureImageLoad(imageUrl) {
    const timerId = this.startTimer('image_load');
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.endTimer(timerId, 'success');
        resolve(img);
      };
      
      img.onerror = () => {
        this.endTimer(timerId, 'error');
        reject(new Error(`Failed to load image: ${imageUrl}`));
      };
      
      img.src = imageUrl;
    });
  }

  // メモリ使用量を監視
  measureMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      const memory = performance.memory;
      const usage = {
        used: memory.usedJSHeapSize / 1024 / 1024, // MB
        total: memory.totalJSHeapSize / 1024 / 1024, // MB
        limit: memory.jsHeapSizeLimit / 1024 / 1024 // MB
      };

      // メモリ使用量が80%を超えた場合に警告
      if (usage.used / usage.limit > 0.8) {
        errorHandler.handleMemoryError(usage.used, usage.limit * 0.8);
      }

      return usage;
    }
    
    return null;
  }

  // ネットワーク接続を監視
  measureNetworkConnectivity() {
    if (typeof navigator !== 'undefined' && navigator.connection) {
      const connection = navigator.connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    
    return null;
  }

  // パフォーマンス統計を取得
  getPerformanceStats() {
    const completedMetrics = Array.from(this.metrics.values())
      .filter(metric => metric.status === 'completed');

    if (completedMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowestOperation: null,
        fastestOperation: null
      };
    }

    const durations = completedMetrics.map(m => m.duration);
    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
    const averageDuration = totalDuration / completedMetrics.length;

    const slowest = completedMetrics.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest
    );

    const fastest = completedMetrics.reduce((fastest, current) => 
      current.duration < fastest.duration ? current : fastest
    );

    return {
      totalOperations: completedMetrics.length,
      averageDuration,
      slowestOperation: {
        operation: slowest.operation,
        duration: slowest.duration
      },
      fastestOperation: {
        operation: fastest.operation,
        duration: fastest.duration
      }
    };
  }

  // 操作別のパフォーマンス統計を取得
  getOperationStats(operation) {
    const operationMetrics = Array.from(this.metrics.values())
      .filter(metric => metric.operation === operation && metric.status === 'completed');

    if (operationMetrics.length === 0) {
      return {
        operation,
        count: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0
      };
    }

    const durations = operationMetrics.map(m => m.duration);
    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);

    return {
      operation,
      count: operationMetrics.length,
      averageDuration: totalDuration / operationMetrics.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations)
    };
  }

  // パフォーマンスデータをリセット
  reset() {
    this.metrics.clear();
  }

  // パフォーマンス監視を有効/無効化
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  // パフォーマンスデータをエクスポート
  exportData() {
    return {
      metrics: Array.from(this.metrics.values()),
      stats: this.getPerformanceStats(),
      timestamp: new Date().toISOString(),
      environment: config.ENV,
      version: config.APP_CONFIG.version
    };
  }
}

export default new PerformanceMonitor(); 