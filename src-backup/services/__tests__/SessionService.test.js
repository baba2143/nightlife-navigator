import SessionService from '../SessionService';

// モック設定
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '15.0'
  },
  AppState: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    currentState: 'active'
  }
}));

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('SessionService', () => {
  let sessionService;

  beforeEach(() => {
    sessionService = new SessionService();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('デフォルト設定で初期化される', () => {
      expect(sessionService.maxSessionDuration).toBe(24 * 60 * 60 * 1000); // 24時間
      expect(sessionService.sessionCheckInterval).toBe(5 * 60 * 1000); // 5分
      expect(sessionService.currentSession).toBeNull();
    });

    it('カスタム設定で初期化される', () => {
      const customSessionService = new SessionService({
        maxSessionDuration: 2 * 60 * 60 * 1000, // 2時間
        sessionCheckInterval: 1 * 60 * 1000, // 1分
        autoLogout: false
      });

      expect(customSessionService.maxSessionDuration).toBe(2 * 60 * 60 * 1000);
      expect(customSessionService.sessionCheckInterval).toBe(1 * 60 * 1000);
      expect(customSessionService.autoLogout).toBe(false);
    });
  });

  describe('startSession', () => {
    it('セッションを開始する', async () => {
      const userData = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      };

      const tokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token'
      };

      SecureStore.setItemAsync.mockResolvedValueOnce(undefined);

      const result = await sessionService.startSession(userData, tokens);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBeDefined();
      expect(sessionService.currentSession).toBeDefined();
      expect(sessionService.currentSession.user).toEqual(userData);
      expect(sessionService.currentSession.tokens).toEqual(tokens);
    });

    it('セッション開始時にタイマーを設定する', async () => {
      const userData = { id: 1 };
      const tokens = { accessToken: 'token' };

      SecureStore.setItemAsync.mockResolvedValueOnce(undefined);

      await sessionService.startSession(userData, tokens);

      expect(sessionService.sessionTimer).toBeDefined();
    });

    it('セッション保存エラーの場合、エラーを返す', async () => {
      const userData = { id: 1 };
      const tokens = { accessToken: 'token' };

      SecureStore.setItemAsync.mockRejectedValueOnce(new Error('Storage error'));

      const result = await sessionService.startSession(userData, tokens);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage error');
    });
  });

  describe('endSession', () => {
    it('セッションを終了する', async () => {
      // セッションを開始
      const userData = { id: 1 };
      const tokens = { accessToken: 'token' };
      
      SecureStore.setItemAsync.mockResolvedValueOnce(undefined);
      await sessionService.startSession(userData, tokens);

      // セッション終了
      SecureStore.deleteItemAsync.mockResolvedValueOnce(undefined);
      
      const result = await sessionService.endSession();

      expect(result.success).toBe(true);
      expect(sessionService.currentSession).toBeNull();
      expect(sessionService.sessionTimer).toBeNull();
    });

    it('セッションがない場合、エラーを返す', async () => {
      const result = await sessionService.endSession();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active session');
    });

    it('セッション削除エラーの場合、エラーを返す', async () => {
      // セッションを開始
      const userData = { id: 1 };
      const tokens = { accessToken: 'token' };
      
      SecureStore.setItemAsync.mockResolvedValueOnce(undefined);
      await sessionService.startSession(userData, tokens);

      // セッション削除エラー
      SecureStore.deleteItemAsync.mockRejectedValueOnce(new Error('Delete error'));
      
      const result = await sessionService.endSession();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete error');
    });
  });

  describe('getCurrentSession', () => {
    it('現在のセッションを取得する', async () => {
      // セッションを開始
      const userData = { id: 1, name: 'Test User' };
      const tokens = { accessToken: 'token' };
      
      SecureStore.setItemAsync.mockResolvedValueOnce(undefined);
      await sessionService.startSession(userData, tokens);

      const result = await sessionService.getCurrentSession();

      expect(result.success).toBe(true);
      expect(result.user).toEqual(userData);
      expect(result.sessionId).toBeDefined();
    });

    it('セッションがない場合、エラーを返す', async () => {
      const result = await sessionService.getCurrentSession();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active session');
    });
  });

  describe('restoreSession', () => {
    it('保存されたセッションを復元する', async () => {
      const sessionData = {
        id: 'session_123',
        user: { id: 1, name: 'Test User' },
        tokens: { accessToken: 'token' },
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };

      SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(sessionData));

      const result = await sessionService.restoreSession();

      expect(result.success).toBe(true);
      expect(result.user).toEqual(sessionData.user);
      expect(result.sessionId).toBe(sessionData.id);
      expect(sessionService.currentSession).toBeDefined();
    });

    it('保存されたセッションがない場合、エラーを返す', async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce(null);

      const result = await sessionService.restoreSession();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No saved session');
    });

    it('セッションが期限切れの場合、エラーを返す', async () => {
      const sessionData = {
        id: 'session_123',
        user: { id: 1, name: 'Test User' },
        tokens: { accessToken: 'token' },
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        expiresAt: new Date(Date.now() - 1000).toISOString() // 期限切れ
      };

      SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(sessionData));
      SecureStore.deleteItemAsync.mockResolvedValueOnce(undefined);

      const result = await sessionService.restoreSession();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Session expired');
    });

    it('セッションデータが無効な場合、エラーを返す', async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce('invalid_json');

      const result = await sessionService.restoreSession();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid session data');
    });
  });

  describe('validateSession', () => {
    it('有効なセッションを検証する', async () => {
      // セッションを開始
      const userData = { id: 1 };
      const tokens = { accessToken: 'token' };
      
      SecureStore.setItemAsync.mockResolvedValueOnce(undefined);
      await sessionService.startSession(userData, tokens);

      const result = await sessionService.validateSession();

      expect(result.isValid).toBe(true);
      expect(result.user).toEqual(userData);
    });

    it('セッションがない場合、無効を返す', async () => {
      const result = await sessionService.validateSession();

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('No active session');
    });

    it('期限切れセッションを検証する', async () => {
      // セッションを開始
      const userData = { id: 1 };
      const tokens = { accessToken: 'token' };
      
      SecureStore.setItemAsync.mockResolvedValueOnce(undefined);
      await sessionService.startSession(userData, tokens);

      // セッションの期限を過去に設定
      sessionService.currentSession.expiresAt = new Date(Date.now() - 1000).toISOString();

      const result = await sessionService.validateSession();

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Session expired');
    });
  });

  describe('updateActivity', () => {
    it('セッションのアクティビティを更新する', async () => {
      // セッションを開始
      const userData = { id: 1 };
      const tokens = { accessToken: 'token' };
      
      SecureStore.setItemAsync.mockResolvedValueOnce(undefined);
      await sessionService.startSession(userData, tokens);

      const originalActivity = sessionService.currentSession.lastActivity;
      
      // 少し待ってからアクティビティを更新
      await new Promise(resolve => setTimeout(resolve, 10));
      
      SecureStore.setItemAsync.mockResolvedValueOnce(undefined);
      
      const result = await sessionService.updateActivity();

      expect(result.success).toBe(true);
      expect(sessionService.currentSession.lastActivity).not.toBe(originalActivity);
    });

    it('セッションがない場合、エラーを返す', async () => {
      const result = await sessionService.updateActivity();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active session');
    });
  });

  describe('generateDeviceFingerprint', () => {
    it('デバイスフィンガープリントを生成する', async () => {
      const fingerprint = await sessionService.generateDeviceFingerprint();

      expect(fingerprint).toBeDefined();
      expect(typeof fingerprint).toBe('string');
      expect(fingerprint.length).toBeGreaterThan(0);
    });

    it('同じデバイスで同じフィンガープリントを生成する', async () => {
      const fingerprint1 = await sessionService.generateDeviceFingerprint();
      const fingerprint2 = await sessionService.generateDeviceFingerprint();

      expect(fingerprint1).toBe(fingerprint2);
    });
  });

  describe('cleanup', () => {
    it('期限切れセッションを削除する', async () => {
      const expiredSessionData = {
        id: 'session_123',
        user: { id: 1 },
        tokens: { accessToken: 'token' },
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        expiresAt: new Date(Date.now() - 1000).toISOString()
      };

      SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(expiredSessionData));
      SecureStore.deleteItemAsync.mockResolvedValueOnce(undefined);

      const result = await sessionService.cleanup();

      expect(result.success).toBe(true);
      expect(result.cleaned).toBe(true);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
    });

    it('有効なセッションは削除しない', async () => {
      const validSessionData = {
        id: 'session_123',
        user: { id: 1 },
        tokens: { accessToken: 'token' },
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };

      SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(validSessionData));

      const result = await sessionService.cleanup();

      expect(result.success).toBe(true);
      expect(result.cleaned).toBe(false);
      expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    });

    it('保存されたセッションがない場合、何もしない', async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce(null);

      const result = await sessionService.cleanup();

      expect(result.success).toBe(true);
      expect(result.cleaned).toBe(false);
      expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    });
  });

  describe('session timer', () => {
    it('セッションタイマーが設定される', async () => {
      const userData = { id: 1 };
      const tokens = { accessToken: 'token' };
      
      SecureStore.setItemAsync.mockResolvedValueOnce(undefined);
      await sessionService.startSession(userData, tokens);

      expect(sessionService.sessionTimer).toBeDefined();
    });

    it('セッション終了時にタイマーがクリアされる', async () => {
      const userData = { id: 1 };
      const tokens = { accessToken: 'token' };
      
      SecureStore.setItemAsync.mockResolvedValueOnce(undefined);
      await sessionService.startSession(userData, tokens);

      expect(sessionService.sessionTimer).toBeDefined();

      SecureStore.deleteItemAsync.mockResolvedValueOnce(undefined);
      await sessionService.endSession();

      expect(sessionService.sessionTimer).toBeNull();
    });
  });
});