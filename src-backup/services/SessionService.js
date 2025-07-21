import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AUTH_CONFIG } from '../config/auth';
import { TokenManager } from '../utils/authUtils';

/**
 * セッション管理サービス
 */
class SessionService {
  constructor() {
    this.sessionKey = 'user_session';
    this.fingerprintKey = 'device_fingerprint';
    this.lastActivityKey = 'last_activity';
    this.autoLogoutTimer = null;
    this.sessionCheckInterval = null;
    this.isSessionActive = false;
  }

  /**
   * セッションを開始
   */
  async startSession(userData, tokens) {
    try {
      const sessionData = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userData.id,
        user: userData,
        tokens,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        deviceFingerprint: await this.generateDeviceFingerprint(),
        platform: Platform.OS,
        version: Platform.Version,
        expiresAt: this.calculateExpirationTime(),
      };

      await AsyncStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
      await this.updateLastActivity();
      
      this.isSessionActive = true;
      this.startAutoLogoutTimer();
      this.startSessionValidation();
      
      return {
        success: true,
        sessionId: sessionData.id,
      };
    } catch (error) {
      console.error('Start session error:', error);
      return {
        success: false,
        error: 'セッションの開始に失敗しました',
      };
    }
  }

  /**
   * セッションを復元
   */
  async restoreSession() {
    try {
      const sessionData = await this.getSessionData();
      
      if (!sessionData) {
        return {
          success: false,
          error: 'セッションが見つかりません',
        };
      }

      // セッションの有効性をチェック
      const isValid = await this.validateSession(sessionData);
      
      if (!isValid) {
        await this.clearSession();
        return {
          success: false,
          error: 'セッションが無効です',
        };
      }

      // トークンの有効性をチェック
      const isTokenValid = await this.validateTokens(sessionData.tokens);
      
      if (!isTokenValid) {
        // トークンリフレッシュを試行
        const refreshResult = await this.refreshTokens(sessionData.tokens);
        
        if (!refreshResult.success) {
          await this.clearSession();
          return {
            success: false,
            error: 'トークンの更新に失敗しました',
          };
        }
        
        // 新しいトークンでセッションを更新
        sessionData.tokens = refreshResult.tokens;
        await AsyncStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
      }

      await this.updateLastActivity();
      
      this.isSessionActive = true;
      this.startAutoLogoutTimer();
      this.startSessionValidation();
      
      return {
        success: true,
        user: sessionData.user,
        tokens: sessionData.tokens,
        sessionId: sessionData.id,
      };
    } catch (error) {
      console.error('Restore session error:', error);
      return {
        success: false,
        error: 'セッションの復元に失敗しました',
      };
    }
  }

  /**
   * セッションを更新
   */
  async updateSession(updates) {
    try {
      const sessionData = await this.getSessionData();
      
      if (!sessionData) {
        return {
          success: false,
          error: 'セッションが見つかりません',
        };
      }

      const updatedSession = {
        ...sessionData,
        ...updates,
        lastActivity: new Date().toISOString(),
      };

      await AsyncStorage.setItem(this.sessionKey, JSON.stringify(updatedSession));
      await this.updateLastActivity();
      
      return {
        success: true,
        session: updatedSession,
      };
    } catch (error) {
      console.error('Update session error:', error);
      return {
        success: false,
        error: 'セッションの更新に失敗しました',
      };
    }
  }

  /**
   * セッションをクリア
   */
  async clearSession() {
    try {
      await AsyncStorage.multiRemove([
        this.sessionKey,
        this.lastActivityKey,
      ]);
      
      this.isSessionActive = false;
      this.stopAutoLogoutTimer();
      this.stopSessionValidation();
      
      return {
        success: true,
      };
    } catch (error) {
      console.error('Clear session error:', error);
      return {
        success: false,
        error: 'セッションのクリアに失敗しました',
      };
    }
  }

  /**
   * セッションの有効性をチェック
   */
  async validateSession(sessionData) {
    try {
      // セッションの有効期限をチェック
      const expiresAt = new Date(sessionData.expiresAt);
      const now = new Date();
      
      if (now > expiresAt) {
        return false;
      }

      // デバイスフィンガープリントをチェック
      const currentFingerprint = await this.generateDeviceFingerprint();
      
      if (sessionData.deviceFingerprint !== currentFingerprint) {
        return false;
      }

      // 最終アクティビティをチェック
      const lastActivity = new Date(sessionData.lastActivity);
      const timeDiff = now - lastActivity;
      const maxInactivity = AUTH_CONFIG.SESSION.MAX_INACTIVITY_TIME;
      
      if (timeDiff > maxInactivity) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Validate session error:', error);
      return false;
    }
  }

  /**
   * トークンの有効性をチェック
   */
  async validateTokens(tokens) {
    try {
      if (!tokens || !tokens.accessToken) {
        return false;
      }

      return !TokenManager.isTokenExpired(tokens.accessToken);
    } catch (error) {
      console.error('Validate tokens error:', error);
      return false;
    }
  }

  /**
   * トークンをリフレッシュ
   */
  async refreshTokens(tokens) {
    try {
      if (!tokens || !tokens.refreshToken) {
        return {
          success: false,
          error: 'リフレッシュトークンがありません',
        };
      }

      // 実際の実装では API エンドポイントを呼び出し
      // モック実装
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTokens = {
        accessToken: `new_access_token_${Date.now()}`,
        refreshToken: tokens.refreshToken, // リフレッシュトークンは通常変更されない
      };

      await TokenManager.setTokens(newTokens.accessToken, newTokens.refreshToken);
      
      return {
        success: true,
        tokens: newTokens,
      };
    } catch (error) {
      console.error('Refresh tokens error:', error);
      return {
        success: false,
        error: 'トークンのリフレッシュに失敗しました',
      };
    }
  }

  /**
   * デバイスフィンガープリントを生成
   */
  async generateDeviceFingerprint() {
    try {
      const stored = await AsyncStorage.getItem(this.fingerprintKey);
      
      if (stored) {
        return stored;
      }

      const fingerprint = `${Platform.OS}_${Platform.Version}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem(this.fingerprintKey, fingerprint);
      
      return fingerprint;
    } catch (error) {
      console.error('Generate device fingerprint error:', error);
      return `fallback_${Date.now()}`;
    }
  }

  /**
   * 最終アクティビティを更新
   */
  async updateLastActivity() {
    try {
      const now = new Date().toISOString();
      await AsyncStorage.setItem(this.lastActivityKey, now);
      
      // セッションデータも更新
      const sessionData = await this.getSessionData();
      if (sessionData) {
        sessionData.lastActivity = now;
        await AsyncStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
      }
      
      // 自動ログアウトタイマーをリセット
      this.resetAutoLogoutTimer();
    } catch (error) {
      console.error('Update last activity error:', error);
    }
  }

  /**
   * セッションデータを取得
   */
  async getSessionData() {
    try {
      const stored = await AsyncStorage.getItem(this.sessionKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Get session data error:', error);
      return null;
    }
  }

  /**
   * 有効期限を計算
   */
  calculateExpirationTime() {
    const now = new Date();
    const expirationTime = new Date(now.getTime() + AUTH_CONFIG.SESSION.EXPIRATION_TIME);
    return expirationTime.toISOString();
  }

  /**
   * 自動ログアウトタイマーを開始
   */
  startAutoLogoutTimer() {
    if (!AUTH_CONFIG.SESSION.AUTO_LOGOUT) {
      return;
    }

    this.resetAutoLogoutTimer();
  }

  /**
   * 自動ログアウトタイマーをリセット
   */
  resetAutoLogoutTimer() {
    if (this.autoLogoutTimer) {
      clearTimeout(this.autoLogoutTimer);
    }

    if (AUTH_CONFIG.SESSION.AUTO_LOGOUT) {
      this.autoLogoutTimer = setTimeout(() => {
        this.handleAutoLogout();
      }, AUTH_CONFIG.SESSION.AUTO_LOGOUT_TIME);
    }
  }

  /**
   * 自動ログアウトタイマーを停止
   */
  stopAutoLogoutTimer() {
    if (this.autoLogoutTimer) {
      clearTimeout(this.autoLogoutTimer);
      this.autoLogoutTimer = null;
    }
  }

  /**
   * 自動ログアウトを実行
   */
  async handleAutoLogout() {
    try {
      await this.clearSession();
      
      // アプリケーションに自動ログアウトを通知
      if (this.onAutoLogout) {
        this.onAutoLogout();
      }
    } catch (error) {
      console.error('Auto logout error:', error);
    }
  }

  /**
   * セッション検証を開始
   */
  startSessionValidation() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    this.sessionCheckInterval = setInterval(async () => {
      if (this.isSessionActive) {
        const sessionData = await this.getSessionData();
        
        if (sessionData) {
          const isValid = await this.validateSession(sessionData);
          
          if (!isValid) {
            await this.clearSession();
            
            if (this.onSessionInvalid) {
              this.onSessionInvalid();
            }
          }
        }
      }
    }, AUTH_CONFIG.SESSION.VALIDATION_INTERVAL);
  }

  /**
   * セッション検証を停止
   */
  stopSessionValidation() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  /**
   * オフライン状態でのセッション管理
   */
  async handleOfflineMode() {
    try {
      const sessionData = await this.getSessionData();
      
      if (sessionData) {
        // オフライン時は最低限のセッション情報を保持
        const offlineSession = {
          ...sessionData,
          isOffline: true,
          offlineAt: new Date().toISOString(),
        };
        
        await AsyncStorage.setItem(this.sessionKey, JSON.stringify(offlineSession));
        
        return {
          success: true,
          session: offlineSession,
        };
      }
      
      return {
        success: false,
        error: 'オフライン用のセッションが見つかりません',
      };
    } catch (error) {
      console.error('Handle offline mode error:', error);
      return {
        success: false,
        error: 'オフラインモードの処理に失敗しました',
      };
    }
  }

  /**
   * オンライン復帰時のセッション同期
   */
  async syncOnlineSession() {
    try {
      const sessionData = await this.getSessionData();
      
      if (sessionData && sessionData.isOffline) {
        // オフライン時の変更を同期
        delete sessionData.isOffline;
        delete sessionData.offlineAt;
        
        // サーバーとの同期処理
        // 実際の実装では API を呼び出してデータを同期
        
        await AsyncStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        
        return {
          success: true,
          session: sessionData,
        };
      }
      
      return {
        success: true,
        session: sessionData,
      };
    } catch (error) {
      console.error('Sync online session error:', error);
      return {
        success: false,
        error: 'オンライン同期に失敗しました',
      };
    }
  }

  /**
   * マルチデバイス対応のセッション管理
   */
  async handleMultiDeviceSession(deviceId) {
    try {
      const sessionData = await this.getSessionData();
      
      if (sessionData) {
        // 他のデバイスでのログインを検出
        if (sessionData.deviceFingerprint !== await this.generateDeviceFingerprint()) {
          return {
            success: false,
            error: '他のデバイスでログインが検出されました',
            multiDevice: true,
          };
        }
      }
      
      return {
        success: true,
        session: sessionData,
      };
    } catch (error) {
      console.error('Handle multi device session error:', error);
      return {
        success: false,
        error: 'マルチデバイスセッションの処理に失敗しました',
      };
    }
  }

  /**
   * セッション統計を取得
   */
  async getSessionStats() {
    try {
      const sessionData = await this.getSessionData();
      
      if (!sessionData) {
        return {
          success: false,
          error: 'セッションが見つかりません',
        };
      }

      const now = new Date();
      const createdAt = new Date(sessionData.createdAt);
      const lastActivity = new Date(sessionData.lastActivity);
      
      const stats = {
        sessionId: sessionData.id,
        duration: now - createdAt,
        lastActivity: lastActivity.toISOString(),
        timeSinceLastActivity: now - lastActivity,
        isActive: this.isSessionActive,
        platform: sessionData.platform,
        version: sessionData.version,
        expiresAt: sessionData.expiresAt,
        timeUntilExpiration: new Date(sessionData.expiresAt) - now,
      };
      
      return {
        success: true,
        stats,
      };
    } catch (error) {
      console.error('Get session stats error:', error);
      return {
        success: false,
        error: '統計情報の取得に失敗しました',
      };
    }
  }

  /**
   * イベントハンドラーを設定
   */
  setEventHandlers(handlers) {
    this.onAutoLogout = handlers.onAutoLogout;
    this.onSessionInvalid = handlers.onSessionInvalid;
    this.onSessionExpired = handlers.onSessionExpired;
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    this.stopAutoLogoutTimer();
    this.stopSessionValidation();
    this.isSessionActive = false;
    this.onAutoLogout = null;
    this.onSessionInvalid = null;
    this.onSessionExpired = null;
  }
}

// シングルトンインスタンス
const sessionService = new SessionService();

export default sessionService;