import { AUTH_CONFIG } from '../config/auth';
import { TokenManager } from '../utils/authUtils';

/**
 * API クライアント
 * 実際のバックエンドAPIとの通信を担当
 */
class ApiClient {
  constructor() {
    this.baseURL = AUTH_CONFIG.API.BASE_URL;
    this.timeout = AUTH_CONFIG.API.TIMEOUT;
    this.retryAttempts = AUTH_CONFIG.API.RETRY_ATTEMPTS;
    this.retryDelay = AUTH_CONFIG.API.RETRY_DELAY;
  }

  /**
   * HTTP リクエストを実行
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-App-Version': AUTH_CONFIG.VERSION || '1.0.0',
        'X-Platform': 'react-native',
      },
      timeout: this.timeout,
    };

    // アクセストークンを取得して認証ヘッダーに追加
    const accessToken = await TokenManager.getAccessToken();
    if (accessToken) {
      defaultOptions.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const requestOptions = { ...defaultOptions, ...options };
    
    // リクエストボディがある場合はJSON文字列に変換
    if (requestOptions.body && typeof requestOptions.body === 'object') {
      requestOptions.body = JSON.stringify(requestOptions.body);
    }

    let lastError;
    
    // リトライ処理
    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        if (AUTH_CONFIG.DEBUG.ENABLE_LOGS) {
          console.log(`[API] ${requestOptions.method} ${url}`, {
            attempt: attempt + 1,
            headers: requestOptions.headers,
            body: requestOptions.body,
          });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        // レスポンスの処理
        const responseData = await this.handleResponse(response);
        
        if (AUTH_CONFIG.DEBUG.ENABLE_LOGS) {
          console.log(`[API] ${response.status} ${url}`, responseData);
        }

        return responseData;
        
      } catch (error) {
        lastError = error;
        
        if (AUTH_CONFIG.DEBUG.ENABLE_LOGS) {
          console.error(`[API] Error [Attempt ${attempt + 1}] ${url}:`, error);
        }

        // 最後の試行でない場合はリトライ
        if (attempt < this.retryAttempts) {
          // 認証エラーの場合はトークンリフレッシュを試行
          if (this.isAuthError(error)) {
            await this.attemptTokenRefresh();
          }
          
          // 指数バックオフで遅延
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError;
  }

  /**
   * レスポンスを処理
   */
  async handleResponse(response) {
    let data;
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch (error) {
      data = null;
    }

    if (!response.ok) {
      const error = new Error(data?.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.response = {
        status: response.status,
        statusText: response.statusText,
        data: data,
      };
      throw error;
    }

    return data;
  }

  /**
   * 認証エラーかどうかを判定
   */
  isAuthError(error) {
    return error.status === 401 || error.status === 403;
  }

  /**
   * トークンリフレッシュを試行
   */
  async attemptTokenRefresh() {
    try {
      const refreshToken = await TokenManager.getRefreshToken();
      if (refreshToken) {
        const response = await this.post('/auth/refresh', {
          refreshToken,
        });
        
        if (response.accessToken) {
          await TokenManager.setTokens(response.accessToken, refreshToken);
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  }

  /**
   * 遅延ユーティリティ
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // HTTP メソッドのヘルパー
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  async post(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
      ...options,
    });
  }

  async put(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
      ...options,
    });
  }

  async patch(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data,
      ...options,
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }
}

// シングルトンインスタンス
const apiClient = new ApiClient();

export default apiClient;