import { AUTH_CONFIG } from '../config/auth';
import { TokenManager, AuthErrorHandler, ValidationUtils } from '../utils/authUtils';
import authService from './AuthService'; // 既存のAuthService

/**
 * 拡張認証APIサービス
 * 既存のAuthServiceと新しい認証システムを統合
 */
class EnhancedAuthService {
  constructor() {
    this.baseURL = AUTH_CONFIG.API.BASE_URL;
    this.timeout = AUTH_CONFIG.API.TIMEOUT;
    this.retryAttempts = AUTH_CONFIG.API.RETRY_ATTEMPTS;
    this.retryDelay = AUTH_CONFIG.API.RETRY_DELAY;
    this.initialized = false;
  }

  /**
   * サービスの初期化
   */
  async initialize() {
    try {
      // 既存のAuthServiceを初期化
      await authService.initialize();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Enhanced Auth Service initialization failed:', error);
      return false;
    }
  }

  /**
   * HTTPリクエストを実行（リトライ機能付き）
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: this.timeout,
    };

    // アクセストークンがある場合は認証ヘッダーを追加
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
          console.log(`API Request [${requestOptions.method}] ${url}`, {
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
          console.log(`API Response [${response.status}] ${url}`, responseData);
        }

        return responseData;
        
      } catch (error) {
        lastError = error;
        
        if (AUTH_CONFIG.DEBUG.ENABLE_LOGS) {
          console.error(`API Error [Attempt ${attempt + 1}] ${url}:`, error);
        }

        // 最後の試行でない場合はリトライ
        if (attempt < this.retryAttempts) {
          // トークンエラーの場合はリフレッシュを試行
          if (this.isTokenError(error)) {
            await this.attemptTokenRefresh();
          }
          
          // 遅延後にリトライ
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
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
   * トークンエラーかどうかを判定
   */
  isTokenError(error) {
    return error.response && [401, 403].includes(error.response.status);
  }

  /**
   * トークンリフレッシュを試行
   */
  async attemptTokenRefresh() {
    try {
      const refreshToken = await TokenManager.getRefreshToken();
      if (refreshToken) {
        await this.refreshToken(refreshToken);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  }

  // === 認証関連APIメソッド ===

  /**
   * ユーザー登録
   */
  async register(userData) {
    try {
      // バリデーション
      const validation = ValidationUtils.validateRegistrationForm(userData);
      if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(', '));
      }

      // モック実装（本番では実際のAPIを呼び出し）
      if (AUTH_CONFIG.DEBUG.ENABLE_LOGS) {
        console.log('Enhanced Auth Service - Register:', userData);
      }

      // 模擬API遅延
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 成功レスポンス
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: `user_${Date.now()}`,
            email: userData.email,
            username: userData.username,
            displayName: userData.displayName,
            avatar: null,
            role: 'user',
            emailVerified: false,
            createdAt: new Date().toISOString(),
          },
          accessToken: `access_token_${Date.now()}`,
          refreshToken: `refresh_token_${Date.now()}`,
          sessionInfo: {
            id: `session_${Date.now()}`,
            createdAt: new Date().toISOString(),
          },
        },
      };

      return mockResponse;

    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * ログイン（既存サービスと統合）
   */
  async login(credentials) {
    try {
      // 既存のログイン処理を使用
      const result = await authService.login(credentials);
      
      if (result.success) {
        // 新しい形式でレスポンスを返す
        return {
          success: true,
          data: {
            user: result.user,
            accessToken: result.token,
            refreshToken: await authService.getStoredRefreshToken(),
            sessionInfo: {
              id: `session_${Date.now()}`,
              createdAt: new Date().toISOString(),
            },
          },
        };
      } else {
        throw new Error('ログインに失敗しました');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * ログアウト（既存サービスと統合）
   */
  async logout() {
    try {
      await authService.logout();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * トークンリフレッシュ
   */
  async refreshToken(refreshToken) {
    try {
      const response = await authService.refreshAuthToken();
      
      if (response.success) {
        return {
          success: true,
          data: {
            accessToken: response.token,
            refreshToken: refreshToken, // 既存のリフレッシュトークンを使用
            sessionInfo: {
              id: `session_${Date.now()}`,
              refreshedAt: new Date().toISOString(),
            },
          },
        };
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * 現在のユーザー情報を取得
   */
  async getCurrentUser() {
    try {
      const userInfo = await authService.getCurrentUserInfo();
      return {
        success: true,
        data: { user: userInfo },
      };
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  /**
   * ユーザー情報を更新
   */
  async updateUser(userData) {
    try {
      // モック実装（本番では実際のAPIを呼び出し）
      if (AUTH_CONFIG.DEBUG.ENABLE_LOGS) {
        console.log('Enhanced Auth Service - Update User:', userData);
      }

      await new Promise(resolve => setTimeout(resolve, 800));

      return {
        success: true,
        data: {
          user: userData,
        },
      };
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  /**
   * メール確認
   */
  async verifyEmail(token) {
    try {
      // モック実装
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: AUTH_CONFIG.SUCCESS_MESSAGES.EMAIL_VERIFIED,
      };
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  /**
   * メール確認再送信
   */
  async resendVerificationEmail(email) {
    try {
      // バリデーション
      const validation = ValidationUtils.validateEmail(email);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // モック実装
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        message: AUTH_CONFIG.SUCCESS_MESSAGES.VERIFICATION_EMAIL_SENT,
      };
    } catch (error) {
      console.error('Resend verification email error:', error);
      throw error;
    }
  }

  /**
   * パスワードリセット要求
   */
  async requestPasswordReset(email) {
    try {
      // バリデーション
      const validation = ValidationUtils.validateEmail(email);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // モック実装
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'パスワードリセットメールを送信しました',
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  /**
   * パスワードリセット実行
   */
  async resetPassword(token, newPassword) {
    try {
      // パスワードバリデーション
      const validation = ValidationUtils.validatePassword(newPassword);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // モック実装
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: AUTH_CONFIG.SUCCESS_MESSAGES.PASSWORD_CHANGED,
      };
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  /**
   * パスワード変更
   */
  async changePassword(currentPassword, newPassword) {
    try {
      // パスワードバリデーション
      const validation = ValidationUtils.validatePassword(newPassword);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // モック実装
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: AUTH_CONFIG.SUCCESS_MESSAGES.PASSWORD_CHANGED,
      };
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }

  /**
   * 生体認証ログイン（既存サービスと統合）
   */
  async loginWithBiometric() {
    try {
      const result = await authService.loginWithBiometric();
      
      if (result.success) {
        return {
          success: true,
          data: {
            user: result.user,
            accessToken: result.token,
            refreshToken: await authService.getStoredRefreshToken(),
            sessionInfo: {
              id: `session_${Date.now()}`,
              createdAt: new Date().toISOString(),
            },
          },
        };
      } else {
        throw new Error('生体認証ログインに失敗しました');
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      throw error;
    }
  }

  // === ユーティリティメソッド ===

  /**
   * APIの健全性をチェック
   */
  async healthCheck() {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }

  /**
   * ユーザー名の利用可能性をチェック
   */
  async checkUsernameAvailability(username) {
    try {
      // バリデーション
      const validation = ValidationUtils.validateUsername(username);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // モック実装
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 簡単なチェック（実際の実装ではAPIを呼び出し）
      const unavailable = ['admin', 'test', 'user', 'root'];
      const isAvailable = !unavailable.includes(username.toLowerCase());
      
      return {
        success: true,
        available: isAvailable,
        message: isAvailable ? 'ユーザー名は利用可能です' : 'ユーザー名は既に使用されています',
      };
    } catch (error) {
      console.error('Username availability check error:', error);
      throw error;
    }
  }

  /**
   * メールアドレスの利用可能性をチェック
   */
  async checkEmailAvailability(email) {
    try {
      // バリデーション
      const validation = ValidationUtils.validateEmail(email);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // モック実装
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 簡単なチェック（実際の実装ではAPIを呼び出し）
      const unavailable = ['test@example.com', 'admin@example.com'];
      const isAvailable = !unavailable.includes(email.toLowerCase());
      
      return {
        success: true,
        available: isAvailable,
        message: isAvailable ? 'メールアドレスは利用可能です' : 'メールアドレスは既に使用されています',
      };
    } catch (error) {
      console.error('Email availability check error:', error);
      throw error;
    }
  }

  /**
   * 認証状態を取得（既存サービスと統合）
   */
  getAuthState() {
    return authService.getAuthState();
  }

  /**
   * 初期化状態を取得
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    authService.cleanup();
    this.initialized = false;
  }
}

// シングルトンインスタンス
const enhancedAuthService = new EnhancedAuthService();

export default enhancedAuthService;