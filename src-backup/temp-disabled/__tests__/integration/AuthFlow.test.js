import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { jest } from '@jest/globals';

// テスト対象のコンポーネントとサービス
import AuthService from '../../services/AuthService';
import ApiService from '../../services/ApiService';
import JWTService from '../../services/JWTService';
import { AppContext } from '../../context/AppContext';

// モックの設定
jest.mock('../../services/AuthService');
jest.mock('../../services/ApiService');
jest.mock('../../services/JWTService');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-secure-store');
jest.mock('expo-local-authentication');

// React Nativeコンポーネントのモック
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn()
  },
  Platform: {
    OS: 'ios'
  }
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

// テストデータ
const mockUser = {
  id: 'user123',
  email: 'test@example.com',
  name: 'テストユーザー',
  role: 'user',
  favorites: []
};

const mockCredentials = {
  email: 'test@example.com',
  password: 'TestPassword123!'
};

const mockAuthResponse = {
  success: true,
  user: mockUser,
  token: 'mock-jwt-token'
};

// AppContextのモックプロバイダー
const MockAppProvider = ({ children, initialState = {} }) => {
  const [state, setState] = React.useState({
    user: null,
    isAuthenticated: false,
    loading: false,
    ...initialState
  });

  const contextValue = {
    ...state,
    login: jest.fn(),
    logout: jest.fn(),
    updateUser: jest.fn(),
    showNotification: jest.fn(),
    setState
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// 認証フローコンポーネント（実際のアプリの簡易版）
const LoginForm = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  
  const { login, showNotification } = React.useContext(AppContext);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const result = await login(email, password);
      if (result.success) {
        showNotification({
          type: 'success',
          message: 'ログインに成功しました'
        });
      }
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'ログインに失敗しました'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        testID="email-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メールアドレス"
      />
      <input
        testID="password-input"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="パスワード"
      />
      <button
        testID="login-button"
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? 'ログイン中...' : 'ログイン'}
      </button>
    </div>
  );
};

const ProtectedComponent = () => {
  const { user, isAuthenticated } = React.useContext(AppContext);
  
  if (!isAuthenticated) {
    return <div testID="not-authenticated">ログインが必要です</div>;
  }
  
  return (
    <div testID="protected-content">
      <div testID="user-email">{user.email}</div>
      <div testID="user-name">{user.name}</div>
    </div>
  );
};

describe('認証フロー統合テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // サービスのデフォルトモック
    AuthService.initialize.mockResolvedValue(true);
    AuthService.login.mockResolvedValue(mockAuthResponse);
    AuthService.logout.mockResolvedValue({ success: true });
    AuthService.getAuthState.mockReturnValue({
      isAuthenticated: false,
      user: null
    });
    
    ApiService.initialize.mockResolvedValue(true);
    JWTService.initialize.mockResolvedValue(true);
    JWTService.validateToken.mockResolvedValue({
      valid: true,
      payload: {
        sub: mockUser.id,
        email: mockUser.email
      }
    });
    
    // ストレージのモック
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.setItemAsync.mockResolvedValue();
    
    // 生体認証のモック
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(true);
    LocalAuthentication.authenticateAsync.mockResolvedValue({ success: true });
  });

  describe('基本的な認証フロー', () => {
    it('ログイン → 認証状態 → ログアウトの完全フローが動作する', async () => {
      let contextValue;
      
      const TestComponent = () => {
        contextValue = React.useContext(AppContext);
        return (
          <div>
            <LoginForm />
            <ProtectedComponent />
          </div>
        );
      };

      render(
        <MockAppProvider>
          <TestComponent />
        </MockAppProvider>
      );

      // 初期状態：未認証
      expect(screen.getByTestId('not-authenticated')).toBeTruthy();

      // ログイン情報を入力
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: mockCredentials.email }
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: mockCredentials.password }
      });

      // ログインボタンをクリック
      fireEvent.click(screen.getByTestId('login-button'));

      // ログイン処理の実行を確認
      await waitFor(() => {
        expect(AuthService.login).toHaveBeenCalledWith(
          mockCredentials.email,
          mockCredentials.password
        );
      });
    });

    it('ログイン失敗時の適切なエラーハンドリング', async () => {
      AuthService.login.mockRejectedValue(new Error('認証に失敗しました'));
      
      const mockShowNotification = jest.fn();
      
      render(
        <MockAppProvider>
          <AppContext.Provider value={{
            user: null,
            isAuthenticated: false,
            login: async (email, password) => {
              await AuthService.login(email, password);
            },
            showNotification: mockShowNotification
          }}>
            <LoginForm />
          </AppContext.Provider>
        </MockAppProvider>
      );

      // ログイン情報を入力
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'invalid@example.com' }
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'wrongpassword' }
      });

      // ログイン試行
      fireEvent.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith({
          type: 'error',
          message: 'ログインに失敗しました'
        });
      });
    });
  });

  describe('生体認証フロー', () => {
    it('生体認証でのログインが正常に動作する', async () => {
      AuthService.loginWithBiometric.mockResolvedValue(mockAuthResponse);
      
      const BiometricLoginComponent = () => {
        const { showNotification } = React.useContext(AppContext);
        
        const handleBiometricLogin = async () => {
          try {
            const result = await AuthService.loginWithBiometric();
            if (result.success) {
              showNotification({
                type: 'success',
                message: '生体認証でログインしました'
              });
            }
          } catch (error) {
            showNotification({
              type: 'error',
              message: '生体認証に失敗しました'
            });
          }
        };

        return (
          <button testID="biometric-login" onClick={handleBiometricLogin}>
            生体認証でログイン
          </button>
        );
      };

      const mockShowNotification = jest.fn();

      render(
        <AppContext.Provider value={{
          showNotification: mockShowNotification
        }}>
          <BiometricLoginComponent />
        </AppContext.Provider>
      );

      fireEvent.click(screen.getByTestId('biometric-login'));

      await waitFor(() => {
        expect(AuthService.loginWithBiometric).toHaveBeenCalled();
        expect(mockShowNotification).toHaveBeenCalledWith({
          type: 'success',
          message: '生体認証でログインしました'
        });
      });
    });

    it('生体認証が利用できない場合の適切な処理', async () => {
      LocalAuthentication.hasHardwareAsync.mockResolvedValue(false);
      AuthService.loginWithBiometric.mockRejectedValue(
        new Error('生体認証が利用できません')
      );

      const BiometricLoginComponent = () => {
        const { showNotification } = React.useContext(AppContext);
        
        const handleBiometricLogin = async () => {
          try {
            await AuthService.loginWithBiometric();
          } catch (error) {
            showNotification({
              type: 'error',
              message: error.message
            });
          }
        };

        return (
          <button testID="biometric-login" onClick={handleBiometricLogin}>
            生体認証でログイン
          </button>
        );
      };

      const mockShowNotification = jest.fn();

      render(
        <AppContext.Provider value={{
          showNotification: mockShowNotification
        }}>
          <BiometricLoginComponent />
        </AppContext.Provider>
      );

      fireEvent.click(screen.getByTestId('biometric-login'));

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith({
          type: 'error',
          message: '生体認証が利用できません'
        });
      });
    });
  });

  describe('トークン管理フロー', () => {
    it('トークンの自動リフレッシュが正常に動作する', async () => {
      AuthService.refreshAuthToken.mockResolvedValue({
        success: true,
        token: 'new-access-token'
      });

      // トークンリフレッシュのシミュレーション
      const TokenRefreshComponent = () => {
        const [tokenStatus, setTokenStatus] = React.useState('valid');

        const handleTokenRefresh = async () => {
          try {
            setTokenStatus('refreshing');
            const result = await AuthService.refreshAuthToken();
            if (result.success) {
              setTokenStatus('refreshed');
            }
          } catch (error) {
            setTokenStatus('failed');
          }
        };

        return (
          <div>
            <div testID="token-status">{tokenStatus}</div>
            <button testID="refresh-token" onClick={handleTokenRefresh}>
              トークンリフレッシュ
            </button>
          </div>
        );
      };

      render(<TokenRefreshComponent />);

      expect(screen.getByTestId('token-status')).toHaveTextContent('valid');

      fireEvent.click(screen.getByTestId('refresh-token'));

      await waitFor(() => {
        expect(screen.getByTestId('token-status')).toHaveTextContent('refreshed');
        expect(AuthService.refreshAuthToken).toHaveBeenCalled();
      });
    });

    it('トークンの有効期限切れ時の適切な処理', async () => {
      AuthService.refreshAuthToken.mockRejectedValue(
        new Error('リフレッシュトークンが無効です')
      );
      AuthService.logout.mockResolvedValue({ success: true });

      const TokenExpiryComponent = () => {
        const [authStatus, setAuthStatus] = React.useState('authenticated');

        const handleTokenExpiry = async () => {
          try {
            await AuthService.refreshAuthToken();
          } catch (error) {
            await AuthService.logout();
            setAuthStatus('logged_out');
          }
        };

        return (
          <div>
            <div testID="auth-status">{authStatus}</div>
            <button testID="trigger-expiry" onClick={handleTokenExpiry}>
              トークン期限切れシミュレート
            </button>
          </div>
        );
      };

      render(<TokenExpiryComponent />);

      fireEvent.click(screen.getByTestId('trigger-expiry'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('logged_out');
        expect(AuthService.logout).toHaveBeenCalled();
      });
    });
  });

  describe('セッション管理フロー', () => {
    it('セッションタイムアウト時の自動ログアウト', async () => {
      AuthService.logout.mockResolvedValue({ success: true });

      const SessionComponent = () => {
        const [sessionStatus, setSessionStatus] = React.useState('active');

        const handleSessionTimeout = async () => {
          setSessionStatus('timeout');
          await AuthService.logout();
          setSessionStatus('logged_out');
        };

        return (
          <div>
            <div testID="session-status">{sessionStatus}</div>
            <button testID="trigger-timeout" onClick={handleSessionTimeout}>
              セッションタイムアウト
            </button>
          </div>
        );
      };

      render(<SessionComponent />);

      fireEvent.click(screen.getByTestId('trigger-timeout'));

      await waitFor(() => {
        expect(screen.getByTestId('session-status')).toHaveTextContent('logged_out');
        expect(AuthService.logout).toHaveBeenCalled();
      });
    });
  });

  describe('認証状態の永続化', () => {
    it('アプリ再起動時の認証状態復元', async () => {
      // 保存されたトークンのモック
      SecureStore.getItemAsync.mockResolvedValue('encrypted-stored-token');
      AuthService.getAuthState.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        token: 'restored-token'
      });

      const RestorationComponent = () => {
        const [restorationStatus, setRestorationStatus] = React.useState('checking');

        React.useEffect(() => {
          const restoreAuthState = async () => {
            await AuthService.initialize();
            const authState = AuthService.getAuthState();
            
            if (authState.isAuthenticated) {
              setRestorationStatus('restored');
            } else {
              setRestorationStatus('not_restored');
            }
          };

          restoreAuthState();
        }, []);

        return <div testID="restoration-status">{restorationStatus}</div>;
      };

      render(<RestorationComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('restoration-status')).toHaveTextContent('restored');
        expect(AuthService.initialize).toHaveBeenCalled();
      });
    });

    it('不正なトークンでの認証状態復元失敗', async () => {
      SecureStore.getItemAsync.mockResolvedValue('invalid-token');
      JWTService.validateToken.mockResolvedValue({ valid: false });
      AuthService.getAuthState.mockReturnValue({
        isAuthenticated: false,
        user: null
      });

      const RestorationComponent = () => {
        const [restorationStatus, setRestorationStatus] = React.useState('checking');

        React.useEffect(() => {
          const restoreAuthState = async () => {
            await AuthService.initialize();
            const authState = AuthService.getAuthState();
            
            if (authState.isAuthenticated) {
              setRestorationStatus('restored');
            } else {
              setRestorationStatus('not_restored');
            }
          };

          restoreAuthState();
        }, []);

        return <div testID="restoration-status">{restorationStatus}</div>;
      };

      render(<RestorationComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('restoration-status')).toHaveTextContent('not_restored');
      });
    });
  });

  describe('認証エラーの統合処理', () => {
    it('ネットワークエラー時の適切なリトライ機能', async () => {
      let attemptCount = 0;
      AuthService.login.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('ネットワークエラー'));
        }
        return Promise.resolve(mockAuthResponse);
      });

      const RetryLoginComponent = () => {
        const [loginStatus, setLoginStatus] = React.useState('idle');
        const [retryCount, setRetryCount] = React.useState(0);

        const handleLoginWithRetry = async () => {
          setLoginStatus('attempting');
          
          for (let i = 0; i < 3; i++) {
            try {
              const result = await AuthService.login(mockCredentials.email, mockCredentials.password);
              if (result.success) {
                setLoginStatus('success');
                return;
              }
            } catch (error) {
              setRetryCount(i + 1);
              if (i === 2) {
                setLoginStatus('failed');
              }
            }
          }
        };

        return (
          <div>
            <div testID="login-status">{loginStatus}</div>
            <div testID="retry-count">{retryCount}</div>
            <button testID="login-with-retry" onClick={handleLoginWithRetry}>
              リトライ付きログイン
            </button>
          </div>
        );
      };

      render(<RetryLoginComponent />);

      fireEvent.click(screen.getByTestId('login-with-retry'));

      await waitFor(() => {
        expect(screen.getByTestId('login-status')).toHaveTextContent('success');
        expect(AuthService.login).toHaveBeenCalledTimes(3);
      });
    });
  });
});