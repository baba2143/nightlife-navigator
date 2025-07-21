import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';

// モック設定
jest.mock('../services/SessionService', () => {
  return jest.fn().mockImplementation(() => ({
    startSession: jest.fn(),
    endSession: jest.fn(),
    getCurrentSession: jest.fn(),
    restoreSession: jest.fn(),
    validateSession: jest.fn(),
    updateActivity: jest.fn(),
    cleanup: jest.fn()
  }));
});

jest.mock('../services/EnhancedAuthService', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  getCurrentUser: jest.fn(),
  updateProfile: jest.fn(),
  changePassword: jest.fn(),
  validateToken: jest.fn(),
  refreshToken: jest.fn()
}));

jest.mock('../utils/authUtils', () => ({
  isStrongPassword: jest.fn(),
  sanitizeInput: jest.fn(),
  generateSecureId: jest.fn(),
  hashPassword: jest.fn(),
  validateEmailFormat: jest.fn()
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3
  }
}));

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn()
  },
  AppState: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    currentState: 'active'
  }
}));

import SessionService from '../services/SessionService';
import EnhancedAuthService from '../services/EnhancedAuthService';
import * as LocalAuthentication from 'expo-local-authentication';

// テスト用コンポーネント
const TestComponent = () => {
  const { state, login, logout, register } = useAuth();
  
  return (
    <>
      <div testID="isAuthenticated">{state.isAuthenticated ? 'true' : 'false'}</div>
      <div testID="user">{state.user ? state.user.name : 'null'}</div>
      <div testID="loading">{state.loading ? 'true' : 'false'}</div>
      <div testID="error">{state.error || 'null'}</div>
      <button testID="loginButton" onPress={() => login('test@example.com', 'password')} />
      <button testID="logoutButton" onPress={() => logout()} />
      <button testID="registerButton" onPress={() => register('test@example.com', 'password', 'Test User')} />
    </>
  );
};

describe('AuthContext', () => {
  let mockSessionService;
  
  beforeEach(() => {
    mockSessionService = new SessionService();
    jest.clearAllMocks();
  });

  describe('AuthProvider', () => {
    it('初期状態が正しく設定される', () => {
      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(getByTestId('isAuthenticated').props.children).toBe('false');
      expect(getByTestId('user').props.children).toBe('null');
      expect(getByTestId('loading').props.children).toBe('true');
      expect(getByTestId('error').props.children).toBe('null');
    });

    it('セッション復元成功時に認証状態が更新される', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
      
      mockSessionService.restoreSession.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        sessionId: 'session_123'
      });
      
      LocalAuthentication.hasHardwareAsync.mockResolvedValueOnce(true);
      LocalAuthentication.isEnrolledAsync.mockResolvedValueOnce(true);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('isAuthenticated').props.children).toBe('true');
        expect(getByTestId('user').props.children).toBe('Test User');
        expect(getByTestId('loading').props.children).toBe('false');
      });
    });

    it('セッション復元失敗時に未認証状態が維持される', async () => {
      mockSessionService.restoreSession.mockResolvedValueOnce({
        success: false,
        error: 'No saved session'
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('isAuthenticated').props.children).toBe('false');
        expect(getByTestId('user').props.children).toBe('null');
        expect(getByTestId('loading').props.children).toBe('false');
      });
    });
  });

  describe('login', () => {
    it('ログイン成功時に認証状態が更新される', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
      const mockTokens = { accessToken: 'access_token', refreshToken: 'refresh_token' };
      
      EnhancedAuthService.login.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        tokens: mockTokens
      });
      
      mockSessionService.startSession.mockResolvedValueOnce({
        success: true,
        sessionId: 'session_123'
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        getByTestId('loginButton').props.onPress();
      });

      await waitFor(() => {
        expect(getByTestId('isAuthenticated').props.children).toBe('true');
        expect(getByTestId('user').props.children).toBe('Test User');
        expect(getByTestId('error').props.children).toBe('null');
      });
    });

    it('ログイン失敗時にエラーが設定される', async () => {
      EnhancedAuthService.login.mockResolvedValueOnce({
        success: false,
        error: 'Invalid credentials'
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        getByTestId('loginButton').props.onPress();
      });

      await waitFor(() => {
        expect(getByTestId('isAuthenticated').props.children).toBe('false');
        expect(getByTestId('error').props.children).toBe('Invalid credentials');
      });
    });

    it('セッション開始失敗時にエラーが設定される', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
      const mockTokens = { accessToken: 'access_token', refreshToken: 'refresh_token' };
      
      EnhancedAuthService.login.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        tokens: mockTokens
      });
      
      mockSessionService.startSession.mockResolvedValueOnce({
        success: false,
        error: 'Session start failed'
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        getByTestId('loginButton').props.onPress();
      });

      await waitFor(() => {
        expect(getByTestId('isAuthenticated').props.children).toBe('false');
        expect(getByTestId('error').props.children).toBe('Session start failed');
      });
    });
  });

  describe('logout', () => {
    it('ログアウト成功時に認証状態がクリアされる', async () => {
      // 最初にログイン状態を設定
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
      const mockTokens = { accessToken: 'access_token', refreshToken: 'refresh_token' };
      
      EnhancedAuthService.login.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        tokens: mockTokens
      });
      
      mockSessionService.startSession.mockResolvedValueOnce({
        success: true,
        sessionId: 'session_123'
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        getByTestId('loginButton').props.onPress();
      });

      // ログアウト
      EnhancedAuthService.logout.mockResolvedValueOnce({
        success: true
      });
      
      mockSessionService.endSession.mockResolvedValueOnce({
        success: true
      });

      await act(async () => {
        getByTestId('logoutButton').props.onPress();
      });

      await waitFor(() => {
        expect(getByTestId('isAuthenticated').props.children).toBe('false');
        expect(getByTestId('user').props.children).toBe('null');
        expect(getByTestId('error').props.children).toBe('null');
      });
    });

    it('ログアウト失敗時にエラーが設定される', async () => {
      // 最初にログイン状態を設定
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
      const mockTokens = { accessToken: 'access_token', refreshToken: 'refresh_token' };
      
      EnhancedAuthService.login.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        tokens: mockTokens
      });
      
      mockSessionService.startSession.mockResolvedValueOnce({
        success: true,
        sessionId: 'session_123'
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        getByTestId('loginButton').props.onPress();
      });

      // ログアウト失敗
      EnhancedAuthService.logout.mockResolvedValueOnce({
        success: false,
        error: 'Logout failed'
      });

      await act(async () => {
        getByTestId('logoutButton').props.onPress();
      });

      await waitFor(() => {
        expect(getByTestId('error').props.children).toBe('Logout failed');
      });
    });
  });

  describe('register', () => {
    it('登録成功時に認証状態が更新される', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
      const mockTokens = { accessToken: 'access_token', refreshToken: 'refresh_token' };
      
      EnhancedAuthService.register.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        tokens: mockTokens
      });
      
      mockSessionService.startSession.mockResolvedValueOnce({
        success: true,
        sessionId: 'session_123'
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        getByTestId('registerButton').props.onPress();
      });

      await waitFor(() => {
        expect(getByTestId('isAuthenticated').props.children).toBe('true');
        expect(getByTestId('user').props.children).toBe('Test User');
        expect(getByTestId('error').props.children).toBe('null');
      });
    });

    it('登録失敗時にエラーが設定される', async () => {
      EnhancedAuthService.register.mockResolvedValueOnce({
        success: false,
        error: 'Email already exists'
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        getByTestId('registerButton').props.onPress();
      });

      await waitFor(() => {
        expect(getByTestId('isAuthenticated').props.children).toBe('false');
        expect(getByTestId('error').props.children).toBe('Email already exists');
      });
    });
  });

  describe('biometric authentication', () => {
    it('バイオメトリック認証が利用可能な場合、フラグが設定される', async () => {
      LocalAuthentication.hasHardwareAsync.mockResolvedValueOnce(true);
      LocalAuthentication.isEnrolledAsync.mockResolvedValueOnce(true);

      mockSessionService.restoreSession.mockResolvedValueOnce({
        success: false,
        error: 'No saved session'
      });

      const TestBiometricComponent = () => {
        const { state } = useAuth();
        return <div testID="biometric">{state.biometricEnabled ? 'true' : 'false'}</div>;
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestBiometricComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('biometric').props.children).toBe('true');
      });
    });

    it('バイオメトリック認証が利用不可な場合、フラグが設定されない', async () => {
      LocalAuthentication.hasHardwareAsync.mockResolvedValueOnce(false);

      mockSessionService.restoreSession.mockResolvedValueOnce({
        success: false,
        error: 'No saved session'
      });

      const TestBiometricComponent = () => {
        const { state } = useAuth();
        return <div testID="biometric">{state.biometricEnabled ? 'true' : 'false'}</div>;
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestBiometricComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('biometric').props.children).toBe('false');
      });
    });
  });

  describe('error handling', () => {
    it('ネットワークエラーを適切に処理する', async () => {
      EnhancedAuthService.login.mockRejectedValueOnce(new Error('Network error'));

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        getByTestId('loginButton').props.onPress();
      });

      await waitFor(() => {
        expect(getByTestId('error').props.children).toBe('Network error');
      });
    });

    it('セッションサービスエラーを適切に処理する', async () => {
      mockSessionService.restoreSession.mockRejectedValueOnce(new Error('Session service error'));

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('error').props.children).toBe('Session service error');
      });
    });
  });
});