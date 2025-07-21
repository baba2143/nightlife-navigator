import { jest } from '@jest/globals';
import ErrorHandler from '../errorHandler';

// 設定ファイルのモック
jest.mock('../../config', () => ({
  config: {
    ENV: 'test',
    DEBUG: true,
    API_CONFIG: {
      baseURL: 'https://api.test.com'
    },
    APP_CONFIG: {
      version: '1.0.0',
      buildNumber: '100',
      errorReporting: {
        enabled: true,
        dsn: 'test-dsn',
        release: '1.0.0'
      }
    }
  }
}));

// fetch APIのモック
global.fetch = jest.fn();

// windowイベントのモック
global.window = {
  addEventListener: jest.fn()
};

describe('ErrorHandler', () => {
  let errorHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    errorHandler = new ErrorHandler();
    
    // fetchのデフォルトモック
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true })
    });
    
    // console.errorをモック
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('初期化', () => {
    it('正常に初期化される', async () => {
      const result = await errorHandler.initialize();
      
      expect(result).toBe(true);
      expect(errorHandler.isInitialized).toBe(true);
    });

    it('本番環境で初期化される', async () => {
      const { config } = require('../../config');
      config.ENV = 'production';
      
      const result = await errorHandler.initialize();
      
      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith('Error reporting initialized');
    });

    it('初期化エラーが適切に処理される', async () => {
      const originalConsoleError = console.error;
      console.error = jest.fn(() => {
        throw new Error('Console error');
      });
      
      const result = await errorHandler.initialize();
      
      expect(result).toBe(false);
      
      console.error = originalConsoleError;
    });
  });

  describe('エラーハンドリング', () => {
    it('基本的なエラーが正しく処理される', () => {
      const testError = new Error('Test error');
      const context = { type: 'test' };
      
      const result = errorHandler.handleError(testError, context);
      
      expect(result).toBeDefined();
      expect(result.message).toBe('Test error');
      expect(result.context).toEqual(context);
      expect(result.timestamp).toBeDefined();
      expect(result.environment).toBe('test');
      expect(errorHandler.errorCount).toBe(1);
    });

    it('エラーメッセージがない場合はデフォルトメッセージが使用される', () => {
      const testError = {};
      
      const result = errorHandler.handleError(testError);
      
      expect(result.message).toBe('Unknown error');
    });

    it('開発環境でコンソールにエラーが出力される', () => {
      const testError = new Error('Test error');
      
      errorHandler.handleError(testError);
      
      expect(console.error).toHaveBeenCalledWith('Error occurred:', expect.any(Object));
    });

    it('本番環境でエラーレポートが送信される', async () => {
      const { config } = require('../../config');
      config.ENV = 'production';
      await errorHandler.initialize();
      
      const testError = new Error('Test error');
      const reportSpy = jest.spyOn(errorHandler, 'reportError').mockResolvedValue();
      
      errorHandler.handleError(testError);
      
      expect(reportSpy).toHaveBeenCalled();
    });

    it('最大エラー数に達した場合警告が出力される', () => {
      errorHandler.maxErrors = 2;
      
      errorHandler.handleError(new Error('Error 1'));
      errorHandler.handleError(new Error('Error 2'));
      
      expect(console.warn).toHaveBeenCalledWith('Maximum error count reached, stopping error reporting');
    });

    it('エラーハンドラー内でエラーが発生した場合の処理', () => {
      const originalConsoleError = console.error;
      console.error = jest.fn(() => {
        throw new Error('Handler error');
      });
      
      const result = errorHandler.handleError(new Error('Test error'));
      
      expect(result).toBeNull();
      
      console.error = originalConsoleError;
    });
  });

  describe('エラーレポート', () => {
    beforeEach(async () => {
      await errorHandler.initialize();
    });

    it('カスタムAPIにエラーが送信される', async () => {
      const errorInfo = {
        message: 'Test error',
        context: { type: 'test' },
        timestamp: new Date().toISOString()
      };
      
      await errorHandler.reportError(errorInfo);
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/errors',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer null'
          },
          body: JSON.stringify(errorInfo)
        })
      );
    });

    it('APIエラーが適切に処理される', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500
      });
      
      const errorInfo = { message: 'Test error' };
      
      await expect(errorHandler.reportError(errorInfo)).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to send error to custom API:',
        expect.any(Error)
      );
    });

    it('ネットワークエラーが適切に処理される', async () => {
      fetch.mockRejectedValue(new Error('Network error'));
      
      const errorInfo = { message: 'Test error' };
      
      await expect(errorHandler.reportError(errorInfo)).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to send error to custom API:',
        expect.any(Error)
      );
    });
  });

  describe('非同期エラーハンドリング', () => {
    it('成功したPromiseはそのまま返される', async () => {
      const successPromise = Promise.resolve('success');
      
      const result = await errorHandler.handleAsyncError(successPromise);
      
      expect(result).toBe('success');
    });

    it('失敗したPromiseでエラーハンドリングが実行される', async () => {
      const failPromise = Promise.reject(new Error('Async error'));
      const handleSpy = jest.spyOn(errorHandler, 'handleError');
      
      await expect(errorHandler.handleAsyncError(failPromise)).rejects.toThrow('Async error');
      expect(handleSpy).toHaveBeenCalledWith(
        expect.any(Error),
        { type: 'async' }
      );
    });
  });

  describe('特定のエラータイプ', () => {
    it('ネットワークエラーが正しく処理される', () => {
      const networkError = new Error('Network failed');
      networkError.status = 500;
      networkError.responseText = 'Internal server error';
      
      const requestInfo = {
        url: 'https://api.test.com/test',
        method: 'GET'
      };
      
      const result = errorHandler.handleNetworkError(networkError, requestInfo);
      
      expect(result.context.type).toBe('network');
      expect(result.context.url).toBe('https://api.test.com/test');
      expect(result.context.method).toBe('GET');
      expect(result.context.statusCode).toBe(500);
    });

    it('バリデーションエラーが正しく処理される', () => {
      const validationError = new Error('Validation failed');
      validationError.value = 'invalid-email';
      
      const result = errorHandler.handleValidationError(validationError, 'email');
      
      expect(result.context.type).toBe('validation');
      expect(result.context.field).toBe('email');
      expect(result.context.value).toBe('invalid-email');
    });

    it('認証エラーが正しく処理される', () => {
      const authError = new Error('Authentication failed');
      authError.action = 'login';
      
      const result = errorHandler.handleAuthError(authError);
      
      expect(result.context.type).toBe('authentication');
      expect(result.context.action).toBe('login');
    });

    it('パフォーマンスエラーが閾値を超えた場合に処理される', () => {
      const result = errorHandler.handlePerformanceError('api_call', 6000, 5000);
      
      expect(result).toBeDefined();
      expect(result.message).toContain('Performance issue: api_call took 6000ms');
      expect(result.context.type).toBe('performance');
      expect(result.context.operation).toBe('api_call');
      expect(result.context.duration).toBe(6000);
      expect(result.context.threshold).toBe(5000);
    });

    it('パフォーマンスエラーが閾値以下の場合は処理されない', () => {
      const result = errorHandler.handlePerformanceError('api_call', 3000, 5000);
      
      expect(result).toBeUndefined();
    });

    it('メモリ使用量エラーが制限を超えた場合に処理される', () => {
      const result = errorHandler.handleMemoryError(512, 256);
      
      expect(result).toBeDefined();
      expect(result.message).toContain('Memory usage exceeded: 512MB > 256MB');
      expect(result.context.type).toBe('memory');
      expect(result.context.usage).toBe(512);
      expect(result.context.limit).toBe(256);
    });

    it('メモリ使用量が制限以下の場合は処理されない', () => {
      const result = errorHandler.handleMemoryError(128, 256);
      
      expect(result).toBeUndefined();
    });
  });

  describe('エラー統計', () => {
    it('エラー統計が正しく取得される', () => {
      errorHandler.handleError(new Error('Error 1'));
      errorHandler.handleError(new Error('Error 2'));
      
      const stats = errorHandler.getErrorStats();
      
      expect(stats.totalErrors).toBe(2);
      expect(stats.maxErrors).toBe(100);
      expect(stats.isReportingEnabled).toBe(false); // test環境
    });

    it('本番環境で初期化済みの場合レポートが有効になる', async () => {
      const { config } = require('../../config');
      config.ENV = 'production';
      await errorHandler.initialize();
      
      const stats = errorHandler.getErrorStats();
      
      expect(stats.isReportingEnabled).toBe(true);
    });
  });

  describe('リセット機能', () => {
    it('エラーカウントがリセットされる', () => {
      errorHandler.handleError(new Error('Error 1'));
      errorHandler.handleError(new Error('Error 2'));
      
      expect(errorHandler.errorCount).toBe(2);
      
      errorHandler.reset();
      
      expect(errorHandler.errorCount).toBe(0);
    });
  });

  describe('認証トークン取得', () => {
    it('認証トークンが取得される（現在はnullを返す）', () => {
      const token = errorHandler.getAuthToken();
      
      expect(token).toBeNull();
    });
  });

  describe('グローバルエラーハンドラー', () => {
    it('未処理のPromiseエラーがキャッチされる', () => {
      // windowイベントリスナーが登録されることを確認
      expect(window.addEventListener).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function)
      );
    });

    it('未処理のエラーがキャッチされる', () => {
      // windowイベントリスナーが登録されることを確認
      expect(window.addEventListener).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
    });
  });

  describe('エラー情報の構築', () => {
    it('完全なエラー情報が構築される', () => {
      const testError = new Error('Test error with stack');
      testError.stack = 'Error stack trace';
      
      const context = { userId: 'user123', action: 'test' };
      
      const result = errorHandler.handleError(testError, context);
      
      expect(result.message).toBe('Test error with stack');
      expect(result.stack).toBe('Error stack trace');
      expect(result.context).toEqual(context);
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(result.environment).toBe('test');
      expect(result.version).toBe('1.0.0');
      expect(result.buildNumber).toBe('100');
    });
  });

  describe('エラーレポート送信の詳細', () => {
    beforeEach(async () => {
      await errorHandler.initialize();
    });

    it('カスタムAPIエラーレポートで認証ヘッダーが含まれる', async () => {
      jest.spyOn(errorHandler, 'getAuthToken').mockReturnValue('test-token');
      
      const errorInfo = { message: 'Test error' };
      await errorHandler.sendToCustomErrorAPI(errorInfo);
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/errors',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('APIレスポンスが失敗した場合エラーがログされる', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 400
      });
      
      const errorInfo = { message: 'Test error' };
      
      await expect(errorHandler.sendToCustomErrorAPI(errorInfo)).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to send error to custom API:',
        expect.any(Error)
      );
    });
  });
});