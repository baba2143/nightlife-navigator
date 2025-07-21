import { jest } from '@jest/globals';
import performanceMonitor from '../performanceMonitor';
import errorHandler from '../errorHandler';

// 設定ファイルのモック
jest.mock('../../config', () => ({
  config: {
    ENV: 'test',
    APP_CONFIG: {
      features: {
        analytics: true
      },
      version: '1.0.0'
    }
  }
}));

// 依存関係のモック
jest.mock('../errorHandler', () => ({
  handlePerformanceError: jest.fn(),
  handleMemoryError: jest.fn()
}));

// performance APIのモック
global.performance = {
  now: jest.fn(),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024,  // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 200 * 1024 * 1024  // 200MB
  }
};

// navigator APIのモック
global.navigator = {
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false
  }
};

// Image APIのモック
global.Image = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = '';
  }
  
  set src(value) {
    this._src = value;
    // シミュレート: 成功の場合
    setTimeout(() => {
      if (this.onload && !value.includes('error')) {
        this.onload();
      } else if (this.onerror && value.includes('error')) {
        this.onerror();
      }
    }, 10);
  }
  
  get src() {
    return this._src;
  }
};

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor.reset();
    performanceMonitor.setEnabled(true);
    
    // performance.nowの連続した値を設定
    let currentTime = 1000;
    performance.now.mockImplementation(() => {
      currentTime += 100;
      return currentTime;
    });
  });

  describe('基本的なタイマー機能', () => {
    it('タイマーが正常に開始される', () => {
      const timerId = performanceMonitor.startTimer('test_operation');
      
      expect(timerId).toBeDefined();
      expect(timerId).toContain('test_operation');
      expect(performanceMonitor.metrics.has(timerId)).toBe(true);
    });

    it('無効化されている場合はnullを返す', () => {
      performanceMonitor.setEnabled(false);
      
      const timerId = performanceMonitor.startTimer('test_operation');
      
      expect(timerId).toBeNull();
    });

    it('タイマーが正常に終了される', () => {
      const timerId = performanceMonitor.startTimer('test_operation');
      const metric = performanceMonitor.endTimer(timerId);
      
      expect(metric).toBeDefined();
      expect(metric.operation).toBe('test_operation');
      expect(metric.duration).toBeGreaterThan(0);
      expect(metric.status).toBe('completed');
    });

    it('無効なタイマーIDの場合はnullを返す', () => {
      const result = performanceMonitor.endTimer('invalid_id');
      
      expect(result).toBeNull();
    });

    it('無効化されている場合はnullを返す', () => {
      performanceMonitor.setEnabled(false);
      
      const result = performanceMonitor.endTimer('any_id');
      
      expect(result).toBeNull();
    });
  });

  describe('パフォーマンス閾値チェック', () => {
    it('API呼び出しの閾値超過でエラーハンドラーが呼ばれる', () => {
      performanceMonitor.checkPerformanceThreshold('api_call', 6000);
      
      expect(errorHandler.handlePerformanceError).toHaveBeenCalledWith(
        'api_call',
        6000,
        5000
      );
    });

    it('画面読み込みの閾値超過でエラーハンドラーが呼ばれる', () => {
      performanceMonitor.checkPerformanceThreshold('screen_load', 4000);
      
      expect(errorHandler.handlePerformanceError).toHaveBeenCalledWith(
        'screen_load',
        4000,
        3000
      );
    });

    it('閾値以下の場合はエラーハンドラーが呼ばれない', () => {
      performanceMonitor.checkPerformanceThreshold('api_call', 3000);
      
      expect(errorHandler.handlePerformanceError).not.toHaveBeenCalled();
    });

    it('未定義の操作にはデフォルト閾値が使用される', () => {
      performanceMonitor.checkPerformanceThreshold('unknown_operation', 6000);
      
      expect(errorHandler.handlePerformanceError).toHaveBeenCalledWith(
        'unknown_operation',
        6000,
        5000
      );
    });
  });

  describe('メトリクスのクリーンアップ', () => {
    it('上限に達した場合古いメトリクスが削除される', () => {
      performanceMonitor.maxMetrics = 5;
      
      // 6個のメトリクスを作成
      for (let i = 0; i < 6; i++) {
        const timerId = performanceMonitor.startTimer(`operation_${i}`);
        performanceMonitor.endTimer(timerId);
      }
      
      expect(performanceMonitor.metrics.size).toBe(2); // maxMetrics / 2
    });
  });

  describe('API呼び出し測定', () => {
    it('成功したAPI呼び出しが正しく測定される', async () => {
      const mockApiCall = jest.fn().mockResolvedValue('success');
      
      const result = await performanceMonitor.measureApiCall(mockApiCall, 'test_api');
      
      expect(result.result).toBe('success');
      expect(result.performance.operation).toBe('test_api');
      expect(result.performance.duration).toBeGreaterThan(0);
      expect(mockApiCall).toHaveBeenCalled();
    });

    it('失敗したAPI呼び出しでもタイマーが終了される', async () => {
      const mockApiCall = jest.fn().mockRejectedValue(new Error('API Error'));
      
      await expect(
        performanceMonitor.measureApiCall(mockApiCall, 'test_api')
      ).rejects.toThrow('API Error');
      
      expect(mockApiCall).toHaveBeenCalled();
    });
  });

  describe('画面読み込み測定', () => {
    it('画面読み込み測定が正しく動作する', () => {
      const measurement = performanceMonitor.measureScreenLoad('HomeScreen');
      
      expect(measurement.end).toBeInstanceOf(Function);
      expect(measurement.cancel).toBeInstanceOf(Function);
      
      const result = measurement.end();
      expect(result.operation).toBe('screen_load_HomeScreen');
      expect(result.status).toBe('completed');
    });

    it('画面読み込みがキャンセルされる', () => {
      const measurement = performanceMonitor.measureScreenLoad('HomeScreen');
      
      const result = measurement.cancel();
      expect(result.status).toBe('cancelled');
    });
  });

  describe('画像読み込み測定', () => {
    it('画像読み込みが成功する', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      
      const img = await performanceMonitor.measureImageLoad(imageUrl);
      
      expect(img).toBeInstanceOf(Image);
      expect(img.src).toBe(imageUrl);
    });

    it('画像読み込みが失敗する', async () => {
      const imageUrl = 'https://example.com/error-image.jpg';
      
      await expect(
        performanceMonitor.measureImageLoad(imageUrl)
      ).rejects.toThrow('Failed to load image: https://example.com/error-image.jpg');
    });
  });

  describe('メモリ使用量監視', () => {
    it('メモリ使用量が正しく測定される', () => {
      const usage = performanceMonitor.measureMemoryUsage();
      
      expect(usage).toBeDefined();
      expect(usage.used).toBe(50); // 50MB
      expect(usage.total).toBe(100); // 100MB
      expect(usage.limit).toBe(200); // 200MB
    });

    it('メモリ使用量が80%を超えた場合警告される', () => {
      // メモリ使用量を90%に設定
      performance.memory.usedJSHeapSize = 180 * 1024 * 1024; // 180MB
      
      performanceMonitor.measureMemoryUsage();
      
      expect(errorHandler.handleMemoryError).toHaveBeenCalledWith(
        180,
        160 // 200MB * 0.8
      );
    });

    it('performance.memoryが利用できない場合はnullを返す', () => {
      const originalMemory = performance.memory;
      delete performance.memory;
      
      const usage = performanceMonitor.measureMemoryUsage();
      
      expect(usage).toBeNull();
      
      performance.memory = originalMemory;
    });
  });

  describe('ネットワーク接続監視', () => {
    it('ネットワーク情報が正しく取得される', () => {
      const connectivity = performanceMonitor.measureNetworkConnectivity();
      
      expect(connectivity).toBeDefined();
      expect(connectivity.effectiveType).toBe('4g');
      expect(connectivity.downlink).toBe(10);
      expect(connectivity.rtt).toBe(100);
      expect(connectivity.saveData).toBe(false);
    });

    it('navigator.connectionが利用できない場合はnullを返す', () => {
      const originalConnection = navigator.connection;
      delete navigator.connection;
      
      const connectivity = performanceMonitor.measureNetworkConnectivity();
      
      expect(connectivity).toBeNull();
      
      navigator.connection = originalConnection;
    });
  });

  describe('パフォーマンス統計', () => {
    beforeEach(() => {
      // テスト用のメトリクスを作成
      const timerId1 = performanceMonitor.startTimer('api_call');
      performanceMonitor.endTimer(timerId1);
      
      const timerId2 = performanceMonitor.startTimer('screen_load');
      performanceMonitor.endTimer(timerId2);
      
      const timerId3 = performanceMonitor.startTimer('api_call');
      performanceMonitor.endTimer(timerId3);
    });

    it('全体のパフォーマンス統計が正しく取得される', () => {
      const stats = performanceMonitor.getPerformanceStats();
      
      expect(stats.totalOperations).toBe(3);
      expect(stats.averageDuration).toBeGreaterThan(0);
      expect(stats.slowestOperation).toBeDefined();
      expect(stats.fastestOperation).toBeDefined();
    });

    it('完了したメトリクスがない場合の統計', () => {
      performanceMonitor.reset();
      
      const stats = performanceMonitor.getPerformanceStats();
      
      expect(stats.totalOperations).toBe(0);
      expect(stats.averageDuration).toBe(0);
      expect(stats.slowestOperation).toBeNull();
      expect(stats.fastestOperation).toBeNull();
    });

    it('操作別の統計が正しく取得される', () => {
      const apiStats = performanceMonitor.getOperationStats('api_call');
      
      expect(apiStats.operation).toBe('api_call');
      expect(apiStats.count).toBe(2);
      expect(apiStats.averageDuration).toBeGreaterThan(0);
      expect(apiStats.minDuration).toBeGreaterThan(0);
      expect(apiStats.maxDuration).toBeGreaterThan(0);
    });

    it('存在しない操作の統計', () => {
      const stats = performanceMonitor.getOperationStats('nonexistent');
      
      expect(stats.operation).toBe('nonexistent');
      expect(stats.count).toBe(0);
      expect(stats.averageDuration).toBe(0);
      expect(stats.minDuration).toBe(0);
      expect(stats.maxDuration).toBe(0);
    });
  });

  describe('データ管理', () => {
    it('パフォーマンスデータがリセットされる', () => {
      const timerId = performanceMonitor.startTimer('test');
      performanceMonitor.endTimer(timerId);
      
      expect(performanceMonitor.metrics.size).toBe(1);
      
      performanceMonitor.reset();
      
      expect(performanceMonitor.metrics.size).toBe(0);
    });

    it('有効/無効化が正しく動作する', () => {
      performanceMonitor.setEnabled(false);
      expect(performanceMonitor.isEnabled).toBe(false);
      
      performanceMonitor.setEnabled(true);
      expect(performanceMonitor.isEnabled).toBe(true);
    });

    it('データエクスポートが正しく動作する', () => {
      const timerId = performanceMonitor.startTimer('test');
      performanceMonitor.endTimer(timerId);
      
      const exportedData = performanceMonitor.exportData();
      
      expect(exportedData.metrics).toHaveLength(1);
      expect(exportedData.stats).toBeDefined();
      expect(exportedData.timestamp).toBeDefined();
      expect(exportedData.environment).toBe('test');
      expect(exportedData.version).toBe('1.0.0');
    });
  });

  describe('エラーケース', () => {
    it('nullのタイマーIDで終了を試行してもエラーにならない', () => {
      const result = performanceMonitor.endTimer(null);
      
      expect(result).toBeNull();
    });

    it('存在しないタイマーIDで終了を試行してもエラーにならない', () => {
      const result = performanceMonitor.endTimer('nonexistent');
      
      expect(result).toBeNull();
    });

    it('performanceが未定義の場合でもクラッシュしない', () => {
      const originalPerformance = global.performance;
      global.performance = undefined;
      
      expect(() => {
        performanceMonitor.measureMemoryUsage();
      }).not.toThrow();
      
      global.performance = originalPerformance;
    });

    it('navigatorが未定義の場合でもクラッシュしない', () => {
      const originalNavigator = global.navigator;
      global.navigator = undefined;
      
      expect(() => {
        performanceMonitor.measureNetworkConnectivity();
      }).not.toThrow();
      
      global.navigator = originalNavigator;
    });
  });

  describe('設定による動作制御', () => {
    it('analytics機能が無効の場合タイマーが動作しない', () => {
      const { config } = require('../../config');
      config.APP_CONFIG.features.analytics = false;
      
      // 新しいインスタンスを作成（設定変更を反映）
      const PerformanceMonitor = require('../performanceMonitor').default.constructor;
      const testMonitor = new PerformanceMonitor();
      
      const timerId = testMonitor.startTimer('test');
      
      expect(timerId).toBeNull();
    });
  });
});