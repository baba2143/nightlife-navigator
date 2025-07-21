import { config } from '../config';

class ErrorHandler {
  constructor() {
    this.isInitialized = false;
    this.errorCount = 0;
    this.maxErrors = 100;
  }

  // エラーハンドラーを初期化
  async initialize() {
    try {
      // Sentryの初期化（本番環境のみ）
      if (config.ENV === 'production' && config.APP_CONFIG.errorReporting.enabled) {
        // Sentry.init({
        //   dsn: config.APP_CONFIG.errorReporting.dsn,
        //   environment: config.ENV,
        //   release: config.APP_CONFIG.errorReporting.release,
        //   enableAutoSessionTracking: true,
        //   debug: false
        // });
        console.log('Error reporting initialized');
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize error handler:', error);
      return false;
    }
  }

  // エラーをキャッチして処理
  handleError(error, context = {}) {
    try {
      this.errorCount++;

      // エラー情報を構築
      const errorInfo = {
        message: error.message || 'Unknown error',
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        environment: config.ENV,
        version: config.APP_CONFIG.version,
        buildNumber: config.APP_CONFIG.buildNumber
      };

      // 開発環境ではコンソールに出力
      if (config.DEBUG) {
        console.error('Error occurred:', errorInfo);
      }

      // 本番環境ではエラー報告サービスに送信
      if (config.ENV === 'production' && this.isInitialized) {
        this.reportError(errorInfo);
      }

      // エラー数が上限に達した場合の処理
      if (this.errorCount >= this.maxErrors) {
        console.warn('Maximum error count reached, stopping error reporting');
      }

      return errorInfo;
    } catch (reportingError) {
      console.error('Error in error handler:', reportingError);
      return null;
    }
  }

  // エラーを報告サービスに送信
  async reportError(errorInfo) {
    try {
      // Sentryにエラーを送信
      // Sentry.captureException(new Error(errorInfo.message), {
      //   extra: errorInfo.context,
      //   tags: {
      //     environment: errorInfo.environment,
      //     version: errorInfo.version
      //   }
      // });

      // カスタムエラー報告APIに送信
      await this.sendToCustomErrorAPI(errorInfo);
    } catch (error) {
      console.error('Failed to report error:', error);
    }
  }

  // カスタムエラー報告APIに送信
  async sendToCustomErrorAPI(errorInfo) {
    try {
      const response = await fetch(`${config.API_CONFIG.baseURL}/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(errorInfo)
      });

      if (!response.ok) {
        throw new Error(`Error reporting failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send error to custom API:', error);
    }
  }

  // 認証トークンを取得
  getAuthToken() {
    // 実際の実装では認証トークンを取得
    return null;
  }

  // 非同期エラーをハンドル
  handleAsyncError(promise) {
    return promise.catch(error => {
      this.handleError(error, { type: 'async' });
      throw error;
    });
  }

  // ネットワークエラーをハンドル
  handleNetworkError(error, requestInfo = {}) {
    const context = {
      type: 'network',
      url: requestInfo.url,
      method: requestInfo.method,
      statusCode: error.status,
      responseText: error.responseText
    };

    return this.handleError(error, context);
  }

  // バリデーションエラーをハンドル
  handleValidationError(error, field = null) {
    const context = {
      type: 'validation',
      field,
      value: error.value
    };

    return this.handleError(error, context);
  }

  // 認証エラーをハンドル
  handleAuthError(error) {
    const context = {
      type: 'authentication',
      action: error.action || 'unknown'
    };

    return this.handleError(error, context);
  }

  // パフォーマンスエラーをハンドル
  handlePerformanceError(operation, duration, threshold = 5000) {
    if (duration > threshold) {
      const error = new Error(`Performance issue: ${operation} took ${duration}ms`);
      const context = {
        type: 'performance',
        operation,
        duration,
        threshold
      };

      return this.handleError(error, context);
    }
  }

  // メモリ使用量エラーをハンドル
  handleMemoryError(usage, limit) {
    if (usage > limit) {
      const error = new Error(`Memory usage exceeded: ${usage}MB > ${limit}MB`);
      const context = {
        type: 'memory',
        usage,
        limit
      };

      return this.handleError(error, context);
    }
  }

  // エラー統計を取得
  getErrorStats() {
    return {
      totalErrors: this.errorCount,
      maxErrors: this.maxErrors,
      isReportingEnabled: config.ENV === 'production' && this.isInitialized
    };
  }

  // エラーハンドラーをリセット
  reset() {
    this.errorCount = 0;
  }
}

// グローバルエラーハンドラーを設定
const errorHandler = new ErrorHandler();

// 未処理のPromiseエラーをキャッチ
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', event => {
    errorHandler.handleError(event.reason, { type: 'unhandledrejection' });
  });
}

// 未処理のエラーをキャッチ
if (typeof window !== 'undefined') {
  window.addEventListener('error', event => {
    errorHandler.handleError(event.error, { type: 'unhandlederror' });
  });
}

export default errorHandler; 