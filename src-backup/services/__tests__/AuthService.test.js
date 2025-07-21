import { jest } from '@jest/globals';
import AuthService from '../AuthService';
import securityManager from '../../utils/security';
import errorHandler from '../../utils/errorHandler';
import jwtService from '../JWTService';
import apiService from '../ApiService';

// React Nativeモジュールのモック
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  multiRemove: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios'
  }
}));

// 依存関係のモック
jest.mock('../../utils/security');
jest.mock('../../utils/errorHandler');
jest.mock('../JWTService');
jest.mock('../ApiService');

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // AuthServiceの状態をリセット
    AuthService.cleanup();
    
    // デフォルトのモック実装
    securityManager.initialize.mockResolvedValue(true);
    securityManager.checkRateLimit.mockResolvedValue(true);
    securityManager.encrypt.mockResolvedValue('encrypted-data');
    securityManager.decrypt.mockResolvedValue('decrypted-data');
    securityManager.generateSecureRandom.mockResolvedValue('random-key');
    securityManager.generateHash.mockResolvedValue('password-hash');
    securityManager.clearSession.mockResolvedValue(true);
    securityManager.validateInput.mockReturnValue({
      isValid: true,
      sanitizedValue: 'test@example.com',
      errors: []
    });
    securityManager.validatePassword.mockReturnValue({
      isValid: true,
      errors: []
    });
    
    jwtService.initialize.mockResolvedValue(true);
    jwtService.validateToken.mockResolvedValue({
      valid: true,
      payload: {
        sub: 'user123',
        email: 'test@example.com',
        role: 'user',
        permissions: ['read']
      }
    });
    jwtService.invalidateToken.mockResolvedValue(true);
    jwtService.refreshAccessToken.mockResolvedValue({
      accessToken: 'new-access-token'
    });
    jwtService.getJWTInfo.mockReturnValue({
      userId: 'user123',
      email: 'test@example.com',
      role: 'user',
      permissions: ['read'],
      timeToExpiry: 3600,
      isExpired: false
    });
    
    apiService.initialize.mockResolvedValue(true);
    apiService.login.mockResolvedValue({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token'
    });
    apiService.logout.mockResolvedValue({ success: true });
    apiService.storeTokens.mockResolvedValue(true);
    apiService.getCurrentUser.mockResolvedValue({
      id: 'user123',
      email: 'test@example.com',
      role: 'user'
    });
    
    errorHandler.handleError.mockImplementation((error) => {
      console.error('Mocked error:', error);
    });
    
    // 生体認証のデフォルトモック
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(true);
    LocalAuthentication.supportedAuthenticationTypesAsync.mockResolvedValue([1, 2]);
    LocalAuthentication.authenticateAsync.mockResolvedValue({ success: true });
    
    // ストレージのデフォルトモック
    AsyncStorage.setItem.mockResolvedValue();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.multiRemove.mockResolvedValue();
    
    SecureStore.setItemAsync.mockResolvedValue();
    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.deleteItemAsync.mockResolvedValue();
  });

  describe('初期化', () => {
    it('正常に初期化される', async () => {
      const result = await AuthService.initialize();
      
      expect(result).toBe(true);
      expect(securityManager.initialize).toHaveBeenCalled();
      expect(jwtService.initialize).toHaveBeenCalled();
      expect(apiService.initialize).toHaveBeenCalled();
    });

    it('初期化エラーが適切に処理される', async () => {
      securityManager.initialize.mockRejectedValue(new Error('Init error'));
      
      const result = await AuthService.initialize();
      
      expect(result).toBe(false);
      expect(errorHandler.handleError).toHaveBeenCalled();
    });

    it('既存の認証情報が正しく復元される', async () => {
      securityManager.decrypt
        .mockResolvedValueOnce('stored-auth-token')
        .mockResolvedValueOnce('stored-refresh-token');
      SecureStore.getItemAsync
        .mockResolvedValueOnce('encrypted-auth-token')
        .mockResolvedValueOnce('encrypted-refresh-token');
      
      await AuthService.initialize();
      
      expect(AuthService.isAuthenticated).toBe(true);
      expect(AuthService.authToken).toBe('stored-auth-token');
      expect(AuthService.refreshToken).toBe('stored-refresh-token');
    });
  });

  describe('生体認証', () => {
    it('生体認証の可用性が正しくチェックされる', async () => {
      await AuthService.checkBiometricAvailability();
      
      expect(LocalAuthentication.hasHardwareAsync).toHaveBeenCalled();
      expect(LocalAuthentication.isEnrolledAsync).toHaveBeenCalled();
      expect(LocalAuthentication.supportedAuthenticationTypesAsync).toHaveBeenCalled();
      expect(AuthService.biometricEnabled).toBe(true);
    });

    it('生体認証が利用できない場合は無効に設定される', async () => {
      LocalAuthentication.hasHardwareAsync.mockResolvedValue(false);
      
      await AuthService.checkBiometricAvailability();
      
      expect(AuthService.biometricEnabled).toBe(false);
    });

    it('生体認証でのログインが正常に実行される', async () => {
      AuthService.biometricEnabled = true;
      securityManager.decrypt.mockResolvedValue({
        email: 'test@example.com',
        passwordHash: 'hash'
      });
      SecureStore.getItemAsync.mockResolvedValue('encrypted-credentials');
      
      const result = await AuthService.loginWithBiometric();
      
      expect(LocalAuthentication.authenticateAsync).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('生体認証が利用できない場合はエラー', async () => {
      AuthService.biometricEnabled = false;
      
      await expect(AuthService.loginWithBiometric()).rejects.toThrow('生体認証が利用できません');
    });
  });

  describe('ログイン', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'ValidPassword123!',
      enableBiometric: false
    };

    it('有効な認証情報でログインが成功する', async () => {
      const result = await AuthService.login(validCredentials);
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBe('test-access-token');
      expect(AuthService.isAuthenticated).toBe(true);
      expect(AuthService.currentUser.id).toBe('user123');
    });

    it('レート制限に達した場合はエラー', async () => {
      securityManager.checkRateLimit.mockResolvedValue(false);
      
      await expect(AuthService.login(validCredentials)).rejects.toThrow('ログイン試行回数が上限に達しました');
      expect(apiService.login).not.toHaveBeenCalled();
    });

    it('無効な認証情報の場合はエラー', async () => {
      securityManager.validateInput.mockReturnValue({
        isValid: false,
        errors: ['無効なメールアドレス'],
        sanitizedValue: null
      });
      
      await expect(AuthService.login({
        email: 'invalid-email',
        password: 'password'
      })).rejects.toThrow('無効なメールアドレス');
    });

    it('APIログインが失敗した場合はエラー', async () => {
      apiService.login.mockRejectedValue(new Error('Login failed'));
      
      await expect(AuthService.login(validCredentials)).rejects.toThrow('Login failed');
    });

    it('無効なJWTトークンの場合はエラー', async () => {
      jwtService.validateToken.mockResolvedValue({ valid: false });
      
      await expect(AuthService.login(validCredentials)).rejects.toThrow('受信したJWTトークンが無効です');
    });

    it('生体認証が有効化される', async () => {
      AuthService.biometricEnabled = true;
      const credentialsWithBiometric = { ...validCredentials, enableBiometric: true };
      
      const result = await AuthService.login(credentialsWithBiometric);
      
      expect(result.success).toBe(true);
      expect(securityManager.generateHash).toHaveBeenCalledWith('ValidPassword123!');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'biometric_credentials',
        'encrypted-data',
        expect.any(Object)
      );
    });
  });

  describe('ログアウト', () => {
    beforeEach(async () => {
      // ログイン状態を設定
      AuthService.isAuthenticated = true;
      AuthService.authToken = 'test-token';
      AuthService.refreshToken = 'test-refresh-token';
      AuthService.currentUser = { id: 'user123' };
    });

    it('正常にログアウトされる', async () => {
      const result = await AuthService.logout();
      
      expect(result.success).toBe(true);
      expect(jwtService.invalidateToken).toHaveBeenCalledWith('test-token');
      expect(jwtService.invalidateToken).toHaveBeenCalledWith('test-refresh-token');
      expect(apiService.logout).toHaveBeenCalled();
      expect(securityManager.clearSession).toHaveBeenCalled();
      expect(AuthService.isAuthenticated).toBe(false);
      expect(AuthService.currentUser).toBeNull();
    });

    it('ログアウトAPIエラーでもローカルクリアは実行される', async () => {
      apiService.logout.mockRejectedValue(new Error('Logout failed'));
      
      await expect(AuthService.logout()).rejects.toThrow('Logout failed');
      expect(jwtService.invalidateToken).toHaveBeenCalled();
      expect(securityManager.clearSession).toHaveBeenCalled();
    });
  });

  describe('トークンリフレッシュ', () => {
    beforeEach(() => {
      AuthService.refreshToken = 'valid-refresh-token';
    });

    it('トークンが正常にリフレッシュされる', async () => {
      const result = await AuthService.refreshAuthToken();
      
      expect(result.success).toBe(true);
      expect(result.token).toBe('new-access-token');
      expect(jwtService.refreshAccessToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(AuthService.authToken).toBe('new-access-token');
    });

    it('リフレッシュトークンがない場合はエラー', async () => {
      AuthService.refreshToken = null;
      
      await expect(AuthService.refreshAuthToken()).rejects.toThrow('リフレッシュトークンがありません');
    });

    it('リフレッシュに失敗した場合は自動ログアウト', async () => {
      jwtService.refreshAccessToken.mockRejectedValue(new Error('Refresh failed'));
      
      await expect(AuthService.refreshAuthToken()).rejects.toThrow('セッションの更新に失敗しました');
      expect(AuthService.isAuthenticated).toBe(false);
    });
  });

  describe('トークン管理', () => {
    it('認証トークンが安全に保存される', async () => {
      await AuthService.storeAuthTokens('auth-token', 'refresh-token');
      
      expect(securityManager.encrypt).toHaveBeenCalledWith('auth-token');
      expect(securityManager.encrypt).toHaveBeenCalledWith('refresh-token');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth_token',
        'encrypted-data',
        { requireAuthentication: false }
      );
    });

    it('保存されたトークンが正しく取得される', async () => {
      SecureStore.getItemAsync.mockResolvedValue('encrypted-token');
      securityManager.decrypt.mockResolvedValue('decrypted-token');
      
      const token = await AuthService.getStoredAuthToken();
      
      expect(token).toBe('decrypted-token');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth_token');
      expect(securityManager.decrypt).toHaveBeenCalledWith('encrypted-token');
    });

    it('トークンがない場合はnullを返す', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);
      
      const token = await AuthService.getStoredAuthToken();
      
      expect(token).toBeNull();
    });

    it('認証トークンが正しくクリアされる', async () => {
      await AuthService.clearAuthTokens();
      
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('認証情報の検証', () => {
    it('有効な認証情報が正しく検証される', () => {
      const result = AuthService.validateLoginCredentials({
        email: 'test@example.com',
        password: 'ValidPassword123!'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValues.email).toBe('test@example.com');
    });

    it('無効なメールアドレスがエラーになる', () => {
      securityManager.validateInput.mockReturnValue({
        isValid: false,
        errors: ['無効なメールアドレス'],
        sanitizedValue: null
      });
      
      const result = AuthService.validateLoginCredentials({
        email: 'invalid-email',
        password: 'password'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('無効なメールアドレス');
    });

    it('無効なパスワードがエラーになる', () => {
      securityManager.validatePassword.mockReturnValue({
        isValid: false,
        errors: ['パスワードが弱すぎます']
      });
      
      const result = AuthService.validateLoginCredentials({
        email: 'test@example.com',
        password: 'weak'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスワードが弱すぎます');
    });
  });

  describe('トークンの有効性検証', () => {
    it('有効なトークンはtrueを返す', async () => {
      const result = await AuthService.validateToken('valid-token');
      
      expect(result).toBe(true);
      expect(jwtService.validateToken).toHaveBeenCalledWith('valid-token');
    });

    it('無効なトークンはfalseを返す', async () => {
      jwtService.validateToken.mockResolvedValue({ valid: false });
      
      const result = await AuthService.validateToken('invalid-token');
      
      expect(result).toBe(false);
    });

    it('検証エラーはfalseを返す', async () => {
      jwtService.validateToken.mockRejectedValue(new Error('Validation error'));
      
      const result = await AuthService.validateToken('error-token');
      
      expect(result).toBe(false);
      expect(errorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('ユーザー情報取得', () => {
    beforeEach(() => {
      AuthService.authToken = 'valid-token';
    });

    it('APIからユーザー情報が取得される', async () => {
      const userInfo = await AuthService.getCurrentUserInfo();
      
      expect(userInfo).toEqual({
        id: 'user123',
        email: 'test@example.com',
        role: 'user'
      });
      expect(apiService.getCurrentUser).toHaveBeenCalled();
    });

    it('APIエラー時はJWTペイロードから取得される', async () => {
      apiService.getCurrentUser.mockRejectedValue(new Error('API error'));
      
      const userInfo = await AuthService.getCurrentUserInfo();
      
      expect(userInfo).toEqual({
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
        permissions: ['read']
      });
      expect(jwtService.getJWTInfo).toHaveBeenCalledWith('valid-token');
    });

    it('トークンがない場合はnullを返す', async () => {
      AuthService.authToken = null;
      
      const userInfo = await AuthService.getCurrentUserInfo();
      
      expect(userInfo).toBeNull();
    });
  });

  describe('認証状態', () => {
    it('認証状態が正しく取得される', () => {
      AuthService.isAuthenticated = true;
      AuthService.currentUser = { id: 'user123' };
      AuthService.authToken = 'test-token';
      AuthService.biometricEnabled = true;
      
      const state = AuthService.getAuthState();
      
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual({ id: 'user123' });
      expect(state.token).toBe('test-token');
      expect(state.biometricEnabled).toBe(true);
      expect(state.tokenInfo).toBeDefined();
    });

    it('未認証状態が正しく返される', () => {
      AuthService.authToken = null;
      
      const state = AuthService.getAuthState();
      
      expect(state.isAuthenticated).toBe(false);
      expect(state.isTokenExpired).toBe(true);
      expect(state.tokenTimeToExpiry).toBe(0);
    });
  });

  describe('クリーンアップ', () => {
    it('状態が正しくクリアされる', () => {
      AuthService.isAuthenticated = true;
      AuthService.currentUser = { id: 'user123' };
      AuthService.authToken = 'test-token';
      AuthService.refreshToken = 'test-refresh-token';
      AuthService.biometricEnabled = true;
      
      AuthService.cleanup();
      
      expect(AuthService.isAuthenticated).toBe(false);
      expect(AuthService.currentUser).toBeNull();
      expect(AuthService.authToken).toBeNull();
      expect(AuthService.refreshToken).toBeNull();
      expect(AuthService.biometricEnabled).toBe(false);
    });
  });

  describe('プラットフォーム固有の処理', () => {
    it('Webプラットフォームでは適切なストレージが使用される', async () => {
      const { Platform } = require('react-native');
      Platform.OS = 'web';
      
      await AuthService.storeAuthTokens('auth-token', 'refresh-token');
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('auth_token', 'encrypted-data');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('refresh_token', 'encrypted-data');
    });

    it('モバイルプラットフォームではSecureStoreが使用される', async () => {
      const { Platform } = require('react-native');
      Platform.OS = 'ios';
      
      await AuthService.storeAuthTokens('auth-token', 'refresh-token');
      
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth_token',
        'encrypted-data',
        { requireAuthentication: false }
      );
    });
  });

  describe('エラーハンドリング', () => {
    it('ストレージエラーが適切に処理される', async () => {
      SecureStore.setItemAsync.mockRejectedValue(new Error('Storage error'));
      
      await expect(AuthService.storeAuthTokens('token', 'refresh')).rejects.toThrow('Storage error');
      expect(errorHandler.handleError).toHaveBeenCalled();
    });

    it('生体認証エラーが適切に処理される', async () => {
      LocalAuthentication.hasHardwareAsync.mockRejectedValue(new Error('Biometric error'));
      
      await AuthService.checkBiometricAvailability();
      
      expect(AuthService.biometricEnabled).toBe(false);
      expect(errorHandler.handleError).toHaveBeenCalled();
    });

    it('JWTエラーが適切に処理される', async () => {
      jwtService.getJWTInfo.mockImplementation(() => {
        throw new Error('JWT error');
      });
      apiService.getCurrentUser.mockRejectedValue(new Error('API error'));
      
      const userInfo = await AuthService.getCurrentUserInfo();
      
      expect(userInfo).toBeNull();
      expect(errorHandler.handleError).toHaveBeenCalledTimes(2);
    });
  });
});