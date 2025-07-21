import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import securityLogger from '../utils/securityLogger';

/**
 * セキュアなセッション管理システム
 */
class SessionManager {
  constructor() {
    this.activeSessions = new Map();
    this.sessionTimeout = 8 * 60 * 60 * 1000; // 8時間
    this.refreshTokenTimeout = 30 * 24 * 60 * 60 * 1000; // 30日
    this.maxConcurrentSessions = 3; // 同時セッション数制限
    this.sessionCleanupInterval = null;
    
    this.initializeSessionCleanup();
  }

  /**
   * セッションIDを生成
   */
  generateSessionId() {
    const array = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // フォールバック
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * リフレッシュトークンを生成
   */
  generateRefreshToken() {
    return this.generateSessionId() + '-' + Date.now().toString(36);
  }

  /**
   * セッションを作成
   */
  async createSession(userId, userInfo, deviceInfo = {}) {
    try {
      // 既存セッション数をチェック
      await this.enforceSessionLimit(userId);

      const sessionId = this.generateSessionId();
      const refreshToken = this.generateRefreshToken();
      const now = Date.now();

      const sessionData = {
        sessionId,
        userId,
        userInfo: {
          ...userInfo,
          password: undefined // パスワードは保存しない
        },
        refreshToken,
        createdAt: now,
        lastActivity: now,
        expiresAt: now + this.sessionTimeout,
        refreshExpiresAt: now + this.refreshTokenTimeout,
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
          ...deviceInfo
        },
        ipAddress: this.getClientIP(),
        userAgent: this.getUserAgent(),
        isActive: true
      };

      // メモリに保存
      this.activeSessions.set(sessionId, sessionData);

      // 永続化ストレージに保存
      await this.saveSessionToStorage(sessionId, sessionData);

      // セキュリティログ
      securityLogger.logSession(userId, 'SESSION_CREATED', {
        sessionId,
        deviceInfo: sessionData.deviceInfo,
        expiresAt: new Date(sessionData.expiresAt).toISOString()
      });

      return {
        success: true,
        sessionId,
        refreshToken,
        expiresAt: sessionData.expiresAt
      };

    } catch (error) {
      console.error('セッション作成エラー:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * セッションを検証
   */
  async validateSession(sessionId) {
    try {
      let sessionData = this.activeSessions.get(sessionId);

      // メモリになければストレージから読み込み
      if (!sessionData) {
        sessionData = await this.loadSessionFromStorage(sessionId);
        if (sessionData) {
          this.activeSessions.set(sessionId, sessionData);
        }
      }

      if (!sessionData) {
        return { valid: false, reason: 'SESSION_NOT_FOUND' };
      }

      const now = Date.now();

      // セッション有効期限チェック
      if (now > sessionData.expiresAt) {
        await this.destroySession(sessionId);
        return { valid: false, reason: 'SESSION_EXPIRED' };
      }

      // アクティブ状態チェック
      if (!sessionData.isActive) {
        return { valid: false, reason: 'SESSION_INACTIVE' };
      }

      // 最終活動時間を更新
      sessionData.lastActivity = now;
      this.activeSessions.set(sessionId, sessionData);
      await this.saveSessionToStorage(sessionId, sessionData);

      return {
        valid: true,
        sessionData,
        userInfo: sessionData.userInfo
      };

    } catch (error) {
      console.error('セッション検証エラー:', error);
      return { valid: false, reason: 'VALIDATION_ERROR' };
    }
  }

  /**
   * セッションを更新（延長）
   */
  async refreshSession(sessionId) {
    try {
      const sessionData = this.activeSessions.get(sessionId) || 
                         await this.loadSessionFromStorage(sessionId);

      if (!sessionData) {
        return { success: false, error: 'セッションが見つかりません' };
      }

      const now = Date.now();

      // リフレッシュトークンの有効期限チェック
      if (now > sessionData.refreshExpiresAt) {
        await this.destroySession(sessionId);
        return { success: false, error: 'リフレッシュトークンが期限切れです' };
      }

      // セッションを延長
      sessionData.expiresAt = now + this.sessionTimeout;
      sessionData.lastActivity = now;
      
      this.activeSessions.set(sessionId, sessionData);
      await this.saveSessionToStorage(sessionId, sessionData);

      securityLogger.logSession(sessionData.userId, 'SESSION_REFRESHED', {
        sessionId,
        newExpiresAt: new Date(sessionData.expiresAt).toISOString()
      });

      return {
        success: true,
        expiresAt: sessionData.expiresAt
      };

    } catch (error) {
      console.error('セッション更新エラー:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * セッションを破棄
   */
  async destroySession(sessionId) {
    try {
      const sessionData = this.activeSessions.get(sessionId);
      
      if (sessionData) {
        securityLogger.logSession(sessionData.userId, 'SESSION_DESTROYED', {
          sessionId,
          reason: 'manual_logout'
        });
      }

      // メモリから削除
      this.activeSessions.delete(sessionId);

      // ストレージから削除
      await this.removeSessionFromStorage(sessionId);

      return { success: true };

    } catch (error) {
      console.error('セッション破棄エラー:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ユーザーの全セッションを破棄
   */
  async destroyAllUserSessions(userId) {
    try {
      const userSessions = Array.from(this.activeSessions.entries())
        .filter(([_, sessionData]) => sessionData.userId === userId);

      for (const [sessionId, _] of userSessions) {
        await this.destroySession(sessionId);
      }

      securityLogger.logSession(userId, 'ALL_SESSIONS_DESTROYED', {
        sessionCount: userSessions.length
      });

      return { success: true, destroyedCount: userSessions.length };

    } catch (error) {
      console.error('全セッション破棄エラー:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * セッション数制限の実施
   */
  async enforceSessionLimit(userId) {
    const userSessions = Array.from(this.activeSessions.entries())
      .filter(([_, sessionData]) => sessionData.userId === userId)
      .sort((a, b) => b[1].lastActivity - a[1].lastActivity);

    if (userSessions.length >= this.maxConcurrentSessions) {
      // 最も古いセッションを削除
      const oldestSession = userSessions[userSessions.length - 1];
      await this.destroySession(oldestSession[0]);

      securityLogger.logSession(userId, 'SESSION_LIMIT_ENFORCED', {
        destroyedSessionId: oldestSession[0],
        maxSessions: this.maxConcurrentSessions
      });
    }
  }

  /**
   * 期限切れセッションのクリーンアップ
   */
  async cleanupExpiredSessions() {
    const now = Date.now();
    const expiredSessions = [];

    for (const [sessionId, sessionData] of this.activeSessions.entries()) {
      if (now > sessionData.expiresAt) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      await this.destroySession(sessionId);
    }

    if (expiredSessions.length > 0) {
      securityLogger.logSession('system', 'EXPIRED_SESSIONS_CLEANED', {
        cleanedCount: expiredSessions.length
      });
    }

    return expiredSessions.length;
  }

  /**
   * セッションクリーンアップの初期化
   */
  initializeSessionCleanup() {
    // 1時間ごとにクリーンアップ実行
    this.sessionCleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000);
  }

  /**
   * アクティブセッション一覧を取得
   */
  getActiveSessions(userId) {
    return Array.from(this.activeSessions.entries())
      .filter(([_, sessionData]) => sessionData.userId === userId)
      .map(([sessionId, sessionData]) => ({
        sessionId,
        createdAt: new Date(sessionData.createdAt).toISOString(),
        lastActivity: new Date(sessionData.lastActivity).toISOString(),
        expiresAt: new Date(sessionData.expiresAt).toISOString(),
        deviceInfo: sessionData.deviceInfo,
        ipAddress: sessionData.ipAddress,
        isCurrent: sessionId === this.currentSessionId
      }));
  }

  /**
   * セッションをストレージに保存
   */
  async saveSessionToStorage(sessionId, sessionData) {
    try {
      const key = `session_${sessionId}`;
      const data = JSON.stringify(sessionData);

      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, data);
      } else {
        await SecureStore.setItemAsync(key, data);
      }
    } catch (error) {
      console.error('セッション保存エラー:', error);
    }
  }

  /**
   * ストレージからセッションを読み込み
   */
  async loadSessionFromStorage(sessionId) {
    try {
      const key = `session_${sessionId}`;
      let data;

      if (Platform.OS === 'web') {
        data = await AsyncStorage.getItem(key);
      } else {
        data = await SecureStore.getItemAsync(key);
      }

      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('セッション読み込みエラー:', error);
      return null;
    }
  }

  /**
   * ストレージからセッションを削除
   */
  async removeSessionFromStorage(sessionId) {
    try {
      const key = `session_${sessionId}`;

      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('セッション削除エラー:', error);
    }
  }

  /**
   * クライアントIPアドレスを取得
   */
  getClientIP() {
    // 本番環境では実際のIPアドレスを取得
    return '127.0.0.1';
  }

  /**
   * ユーザーエージェントを取得
   */
  getUserAgent() {
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      return navigator.userAgent;
    }
    return `React Native ${Platform.OS} ${Platform.Version}`;
  }

  /**
   * セッション統計情報を取得
   */
  getSessionStats() {
    const now = Date.now();
    const sessions = Array.from(this.activeSessions.values());

    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.isActive).length,
      expiredSessions: sessions.filter(s => now > s.expiresAt).length,
      sessionsByUser: sessions.reduce((acc, session) => {
        acc[session.userId] = (acc[session.userId] || 0) + 1;
        return acc;
      }, {}),
      averageSessionDuration: sessions.length > 0 ? 
        sessions.reduce((sum, s) => sum + (s.lastActivity - s.createdAt), 0) / sessions.length : 0
    };
  }

  /**
   * クリーンアップ（アプリ終了時）
   */
  cleanup() {
    if (this.sessionCleanupInterval) {
      clearInterval(this.sessionCleanupInterval);
    }
  }
}

// シングルトンインスタンス
const sessionManager = new SessionManager();

export default sessionManager;