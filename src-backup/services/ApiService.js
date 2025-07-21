import { config } from '../config';
import jwtService from './JWTService';
import securityManager from '../utils/security';
import errorHandler from '../utils/errorHandler';

class ApiService {
  constructor() {
    this.baseURL = config.APP_CONFIG.api.baseURL;
    this.timeout = config.APP_CONFIG.api.timeout || 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    // 認証状態
    this.accessToken = null;
    this.refreshToken = null;
    this.isRefreshing = false;
    this.refreshPromise = null;
  }

  // APIサービスの初期化
  async initialize() {
    try {
      await jwtService.initialize();
      
      // 保存された認証トークンを読み込み
      await this.loadStoredTokens();
      
      return true;
    } catch (error) {
      errorHandler.handleError(error, { type: 'api_service_initialization' });
      return false;
    }
  }

  // 保存されたトークンを読み込み
  async loadStoredTokens() {
    try {
      this.accessToken = await securityManager.secureRetrieve('access_token');
      this.refreshToken = await securityManager.secureRetrieve('refresh_token');
    } catch (error) {
      errorHandler.handleError(error, { type: 'load_stored_tokens' });
    }
  }

  // トークンを保存
  async storeTokens(accessToken, refreshToken) {
    try {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      
      await securityManager.secureStore('access_token', accessToken);
      await securityManager.secureStore('refresh_token', refreshToken);
    } catch (error) {
      errorHandler.handleError(error, { type: 'store_tokens' });
      throw error;
    }
  }

  // トークンをクリア
  async clearTokens() {
    try {
      this.accessToken = null;
      this.refreshToken = null;
      
      // ストレージからも削除
      await securityManager.secureStore('access_token', null);
      await securityManager.secureStore('refresh_token', null);
    } catch (error) {
      errorHandler.handleError(error, { type: 'clear_tokens' });
    }
  }

  // リクエストヘッダーを構築
  async buildHeaders(additionalHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...additionalHeaders };
    
    // 認証ヘッダーを追加
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    
    // CSRFトークンを追加
    const csrfToken = await securityManager.generateCSRFToken();
    headers['X-CSRF-Token'] = csrfToken;
    
    // セキュリティヘッダーを追加
    headers['X-API-Version'] = '1.0';
    headers['X-Client-Type'] = 'mobile-app';
    
    return headers;
  }

  // HTTPリクエストを実行
  async makeRequest(method, endpoint, data = null, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.buildHeaders(options.headers);
    
    const requestConfig = {
      method: method.toUpperCase(),
      headers,
      ...options
    };

    // リクエストボディを設定
    if (data && ['POST', 'PUT', 'PATCH'].includes(requestConfig.method)) {
      if (options.isFormData) {
        requestConfig.body = data; // FormDataの場合はそのまま
        delete headers['Content-Type']; // FormDataの場合はContent-Typeを削除
      } else {
        requestConfig.body = JSON.stringify(data);
      }
    }

    // タイムアウトを設定
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    requestConfig.signal = controller.signal;

    try {
      console.log(`🌐 API Request: ${method.toUpperCase()} ${url}`);
      
      const response = await fetch(url, requestConfig);
      clearTimeout(timeoutId);

      // レスポンスを処理
      return await this.handleResponse(response, method, endpoint, data, options);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('リクエストがタイムアウトしました');
      }
      
      errorHandler.handleError(error, { 
        type: 'api_request_error',
        method,
        endpoint,
        url
      });
      
      throw new Error('ネットワークエラーが発生しました');
    }
  }

  // レスポンスを処理
  async handleResponse(response, method, endpoint, originalData, options) {
    const { status, statusText } = response;
    
    console.log(`📡 API Response: ${status} ${statusText}`);
    
    // 401 Unauthorized - トークンが無効
    if (status === 401 && this.refreshToken && !options.skipAuth) {
      console.log('🔄 Access token expired, attempting refresh...');
      
      try {
        await this.refreshAccessToken();
        // 元のリクエストを再試行
        return await this.makeRequest(method, endpoint, originalData, {
          ...options,
          skipAuth: true // 無限ループを防ぐ
        });
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        await this.clearTokens();
        throw new Error('認証が必要です。再ログインしてください。');
      }
    }

    // レスポンスボディを取得
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // エラーレスポンスの処理
    if (!response.ok) {
      const errorMessage = this.extractErrorMessage(responseData, status);
      
      const apiError = new Error(errorMessage);
      apiError.status = status;
      apiError.data = responseData;
      
      errorHandler.handleError(apiError, {
        type: 'api_response_error',
        method,
        endpoint,
        status,
        statusText
      });
      
      throw apiError;
    }

    return responseData;
  }

  // エラーメッセージを抽出
  extractErrorMessage(responseData, status) {
    if (typeof responseData === 'object' && responseData.message) {
      return responseData.message;
    }
    
    if (typeof responseData === 'object' && responseData.error) {
      return responseData.error;
    }
    
    // HTTPステータスに基づくデフォルトメッセージ
    const statusMessages = {
      400: 'リクエストが無効です',
      401: '認証が必要です',
      403: 'アクセスが拒否されました',
      404: 'リソースが見つかりません',
      429: 'リクエスト数が上限に達しました',
      500: 'サーバーエラーが発生しました',
      502: 'ゲートウェイエラーです',
      503: 'サービスが利用できません'
    };
    
    return statusMessages[status] || `APIエラーが発生しました (${status})`;
  }

  // アクセストークンを更新
  async refreshAccessToken() {
    // 既に更新処理が実行中の場合は待機
    if (this.isRefreshing) {
      return await this.refreshPromise;
    }

    this.isRefreshing = true;
    
    this.refreshPromise = (async () => {
      try {
        if (!this.refreshToken) {
          throw new Error('リフレッシュトークンがありません');
        }

        console.log('🔄 Refreshing access token...');
        
        const response = await jwtService.refreshAccessToken(this.refreshToken);
        
        this.accessToken = response.accessToken;
        
        // 新しいトークンを保存
        await securityManager.secureStore('access_token', this.accessToken);
        
        console.log('✅ Access token refreshed successfully');
        
        return response;
      } catch (error) {
        console.error('❌ Failed to refresh access token:', error);
        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return await this.refreshPromise;
  }

  // GET リクエスト
  async get(endpoint, params = {}, options = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return await this.makeRequest('GET', url, null, options);
  }

  // POST リクエスト
  async post(endpoint, data, options = {}) {
    return await this.makeRequest('POST', endpoint, data, options);
  }

  // PUT リクエスト
  async put(endpoint, data, options = {}) {
    return await this.makeRequest('PUT', endpoint, data, options);
  }

  // PATCH リクエスト
  async patch(endpoint, data, options = {}) {
    return await this.makeRequest('PATCH', endpoint, data, options);
  }

  // DELETE リクエスト
  async delete(endpoint, options = {}) {
    return await this.makeRequest('DELETE', endpoint, null, options);
  }

  // ファイルアップロード
  async uploadFile(endpoint, file, additionalData = {}, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    // 追加データを FormData に追加
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    return await this.makeRequest('POST', endpoint, formData, {
      ...options,
      isFormData: true
    });
  }

  // 認証API
  async login(credentials) {
    try {
      console.log('🔐 Attempting login...');
      
      // レート制限をチェック
      const canAttempt = await securityManager.checkRateLimit('api_login', 5, 300000);
      if (!canAttempt) {
        throw new Error('ログイン試行回数が上限に達しました。しばらく待ってから再試行してください。');
      }

      const response = await this.post('/auth/login', credentials, {
        skipAuth: true // ログイン時は認証ヘッダー不要
      });

      if (response.accessToken && response.refreshToken) {
        await this.storeTokens(response.accessToken, response.refreshToken);
        console.log('✅ Login successful');
      }

      return response;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  // ログアウト
  async logout() {
    try {
      console.log('👋 Logging out...');
      
      if (this.accessToken) {
        // サーバーにログアウト通知
        try {
          await this.post('/auth/logout');
        } catch (error) {
          // ログアウトAPIのエラーは無視（トークンクリアは実行）
          console.warn('Logout API call failed, but continuing with local cleanup');
        }
      }

      // ローカルのトークンをクリア
      await this.clearTokens();
      
      console.log('✅ Logout completed');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      // エラーでもローカルクリアは実行
      await this.clearTokens();
      throw error;
    }
  }

  // ユーザー情報取得
  async getCurrentUser() {
    return await this.get('/auth/me');
  }

  // バー一覧取得
  async getBars(params = {}) {
    return await this.get('/bars', params);
  }

  // バー詳細取得
  async getBar(barId) {
    return await this.get(`/bars/${barId}`);
  }

  // クーポン一覧取得
  async getCoupons(params = {}) {
    return await this.get('/coupons', params);
  }

  // クーポン使用
  async useCoupon(couponId, barId) {
    return await this.post('/coupons/use', { couponId, barId });
  }

  // レビュー投稿
  async submitReview(barId, reviewData) {
    return await this.post(`/bars/${barId}/reviews`, reviewData);
  }

  // お気に入り追加/削除
  async toggleFavorite(barId) {
    return await this.post(`/bars/${barId}/favorite`);
  }

  // 通知一覧取得
  async getNotifications(params = {}) {
    return await this.get('/notifications', params);
  }

  // 通知を既読にする
  async markNotificationAsRead(notificationId) {
    return await this.patch(`/notifications/${notificationId}/read`);
  }

  // プロフィール更新
  async updateProfile(profileData) {
    return await this.put('/auth/profile', profileData);
  }

  // パスワード変更
  async changePassword(passwordData) {
    return await this.post('/auth/change-password', passwordData);
  }

  // 接続テスト
  async testConnection() {
    try {
      const response = await this.get('/health', {}, { skipAuth: true });
      return { connected: true, response };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }

  // API統計情報
  getApiInfo() {
    return {
      baseURL: this.baseURL,
      hasAccessToken: !!this.accessToken,
      hasRefreshToken: !!this.refreshToken,
      isRefreshing: this.isRefreshing
    };
  }

  // クリーンアップ
  cleanup() {
    this.accessToken = null;
    this.refreshToken = null;
    this.isRefreshing = false;
    this.refreshPromise = null;
  }
}

export default new ApiService();