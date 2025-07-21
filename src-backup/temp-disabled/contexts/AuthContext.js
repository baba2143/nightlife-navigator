import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Alert, AppState } from 'react-native';
import { AUTH_CONFIG } from '../config/auth';
import { 
  TokenManager, 
  UserDataManager, 
  SessionManager, 
  BiometricAuth,
  AuthErrorHandler 
} from '../utils/authUtils';
import sessionService from '../services/SessionService';
import PersistenceUtils from '../utils/persistenceUtils';

// 認証状態の初期値
const initialState = {
  // ユーザー情報
  user: null,
  isAuthenticated: false,
  
  // 読み込み状態
  isLoading: true,
  isAuthenticating: false,
  isRegistering: false,
  
  // エラー状態
  error: null,
  
  // セッション情報
  sessionInfo: null,
  
  // 設定
  biometricEnabled: false,
  rememberMe: false,
  
  // 最終ログイン
  lastLogin: null,
};

// アクションタイプ
const ActionTypes = {
  // 初期化
  INIT_START: 'INIT_START',
  INIT_SUCCESS: 'INIT_SUCCESS',
  INIT_FAILURE: 'INIT_FAILURE',
  
  // ログイン
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  
  // 登録
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  
  // ログアウト
  LOGOUT: 'LOGOUT',
  
  // ユーザー情報更新
  UPDATE_USER: 'UPDATE_USER',
  
  // トークン更新
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  
  // エラークリア
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // 設定更新
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
};

// レデューサー
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.INIT_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
      
    case ActionTypes.INIT_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: !!action.payload.user,
        user: action.payload.user,
        sessionInfo: action.payload.sessionInfo,
        biometricEnabled: action.payload.biometricEnabled,
        lastLogin: action.payload.lastLogin,
        error: null,
      };
      
    case ActionTypes.INIT_FAILURE:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload,
      };
      
    case ActionTypes.LOGIN_START:
      return {
        ...state,
        isAuthenticating: true,
        error: null,
      };
      
    case ActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticating: false,
        isAuthenticated: true,
        user: action.payload.user,
        sessionInfo: action.payload.sessionInfo,
        lastLogin: Date.now(),
        error: null,
      };
      
    case ActionTypes.LOGIN_FAILURE:
      return {
        ...state,
        isAuthenticating: false,
        isAuthenticated: false,
        user: null,
        error: action.payload,
      };
      
    case ActionTypes.REGISTER_START:
      return {
        ...state,
        isRegistering: true,
        error: null,
      };
      
    case ActionTypes.REGISTER_SUCCESS:
      return {
        ...state,
        isRegistering: false,
        isAuthenticated: true,
        user: action.payload.user,
        sessionInfo: action.payload.sessionInfo,
        error: null,
      };
      
    case ActionTypes.REGISTER_FAILURE:
      return {
        ...state,
        isRegistering: false,
        isAuthenticated: false,
        user: null,
        error: action.payload,
      };
      
    case ActionTypes.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        sessionInfo: null,
        error: null,
      };
      
    case ActionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
      
    case ActionTypes.TOKEN_REFRESH:
      return {
        ...state,
        sessionInfo: action.payload.sessionInfo,
      };
      
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
      
    case ActionTypes.UPDATE_SETTINGS:
      return {
        ...state,
        ...action.payload,
      };
      
    default:
      return state;
  }
};

// AuthContextの作成
const AuthContext = createContext();

// AuthProviderコンポーネント
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 初期化
  const initialize = useCallback(async () => {
    dispatch({ type: ActionTypes.INIT_START });
    
    try {
      // セッションサービスのイベントハンドラーを設定
      sessionService.setEventHandlers({
        onAutoLogout: () => {
          dispatch({ type: ActionTypes.LOGOUT });
          Alert.alert('自動ログアウト', '非アクティブのため自動的にログアウトしました');
        },
        onSessionInvalid: () => {
          dispatch({ type: ActionTypes.LOGOUT });
          Alert.alert('セッション無効', 'セッションが無効になりました。再度ログインしてください');
        },
        onSessionExpired: () => {
          dispatch({ type: ActionTypes.LOGOUT });
          Alert.alert('セッション期限切れ', 'セッションの期限が切れました。再度ログインしてください');
        },
      });

      // セッションの復元を試行
      const sessionResult = await sessionService.restoreSession();
      
      if (sessionResult.success) {
        // セッションが有効な場合
        const biometricEnabled = await BiometricAuth.isBiometricEnabled();
        
        dispatch({
          type: ActionTypes.INIT_SUCCESS,
          payload: {
            user: sessionResult.user,
            sessionInfo: { id: sessionResult.sessionId },
            biometricEnabled,
            lastLogin: sessionResult.user.lastLogin,
          },
        });
        return;
      }

      // セッションが無効または存在しない場合
      await clearStoredData();
      const biometricEnabled = await BiometricAuth.isBiometricEnabled();
      
      dispatch({
        type: ActionTypes.INIT_SUCCESS,
        payload: {
          user: null,
          sessionInfo: null,
          biometricEnabled,
          lastLogin: null,
        },
      });
    } catch (error) {
      console.error('Authentication initialization failed:', error);
      dispatch({
        type: ActionTypes.INIT_FAILURE,
        payload: AuthErrorHandler.handleError(error),
      });
    }
  }, []);

  // ストレージのデータをクリア
  const clearStoredData = useCallback(async () => {
    await Promise.all([
      TokenManager.clearTokens(),
      UserDataManager.clearUserData(),
      SessionManager.clearSession(),
      sessionService.clearSession(),
    ]);
  }, []);

  // ログイン
  const login = useCallback(async (credentials, options = {}) => {
    dispatch({ type: ActionTypes.LOGIN_START });
    
    try {
      // モック実装 - 実際のAPIエンドポイントに置き換える
      const response = await mockLoginAPI(credentials);
      
      if (response.success) {
        const { user, accessToken, refreshToken, sessionInfo } = response.data;
        
        // トークンとユーザーデータを保存
        await Promise.all([
          TokenManager.setTokens(accessToken, refreshToken),
          UserDataManager.saveUserData(user),
          SessionManager.saveSession(sessionInfo),
          UserDataManager.setLastLogin(),
        ]);
        
        // セッションサービスでセッションを開始
        const sessionResult = await sessionService.startSession(user, {
          accessToken,
          refreshToken,
        });
        
        if (!sessionResult.success) {
          console.warn('Session start failed:', sessionResult.error);
        }
        
        // remember meが有効な場合の処理
        if (options.rememberMe) {
          // 追加の永続化処理
          await PersistenceUtils.setSecureItem('remember_me', true);
        }
        
        dispatch({
          type: ActionTypes.LOGIN_SUCCESS,
          payload: { user, sessionInfo },
        });
        
        return { success: true };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage = AuthErrorHandler.handleError(error);
      dispatch({
        type: ActionTypes.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  // 生体認証ログイン
  const loginWithBiometric = useCallback(async () => {
    try {
      const biometricResult = await BiometricAuth.authenticate();
      
      if (biometricResult.success) {
        // 保存されたトークンでログイン
        const accessToken = await TokenManager.getAccessToken();
        const userData = await UserDataManager.getUserData();
        
        if (accessToken && userData && !TokenManager.isTokenExpired(accessToken)) {
          dispatch({
            type: ActionTypes.LOGIN_SUCCESS,
            payload: {
              user: userData,
              sessionInfo: await SessionManager.getSession(),
            },
          });
          return { success: true };
        } else {
          throw new Error('保存された認証情報が無効です');
        }
      } else {
        throw new Error('生体認証に失敗しました');
      }
    } catch (error) {
      const errorMessage = AuthErrorHandler.handleError(error);
      dispatch({
        type: ActionTypes.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  // 登録
  const register = useCallback(async (userData) => {
    dispatch({ type: ActionTypes.REGISTER_START });
    
    try {
      // モック実装 - 実際のAPIエンドポイントに置き換える
      const response = await mockRegisterAPI(userData);
      
      if (response.success) {
        const { user, accessToken, refreshToken, sessionInfo } = response.data;
        
        // トークンとユーザーデータを保存
        await Promise.all([
          TokenManager.setTokens(accessToken, refreshToken),
          UserDataManager.saveUserData(user),
          SessionManager.saveSession(sessionInfo),
        ]);
        
        dispatch({
          type: ActionTypes.REGISTER_SUCCESS,
          payload: { user, sessionInfo },
        });
        
        return { success: true };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage = AuthErrorHandler.handleError(error);
      dispatch({
        type: ActionTypes.REGISTER_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  // ログアウト
  const logout = useCallback(async () => {
    try {
      // サーバーにログアウト通知（必要に応じて）
      // await apiClient.post('/auth/logout');
      
      // ローカルデータをクリア
      await clearStoredData();
      
      dispatch({ type: ActionTypes.LOGOUT });
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // エラーが発生してもローカルデータはクリアする
      await clearStoredData();
      dispatch({ type: ActionTypes.LOGOUT });
      return { success: true };
    }
  }, [clearStoredData]);

  // アプリ状態の変更を監視
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // バックグラウンドに移行する際の処理
        await sessionService.updateLastActivity();
      } else if (nextAppState === 'active') {
        // フォアグラウンドに復帰する際の処理
        if (state.isAuthenticated) {
          await sessionService.updateLastActivity();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [state.isAuthenticated]);

  // ユーザー情報の更新
  const updateUser = useCallback(async (updates) => {
    try {
      // モック実装 - 実際のAPIエンドポイントに置き換える
      const response = await mockUpdateUserAPI(updates);
      
      if (response.success) {
        const updatedUser = response.data.user;
        
        // ローカルストレージを更新
        await UserDataManager.saveUserData(updatedUser);
        
        dispatch({
          type: ActionTypes.UPDATE_USER,
          payload: updatedUser,
        });
        
        return { success: true, user: updatedUser };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage = AuthErrorHandler.handleError(error);
      return { success: false, error: errorMessage };
    }
  }, []);

  // トークンのリフレッシュ
  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = await TokenManager.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      // モック実装 - 実際のAPIエンドポイントに置き換える
      const response = await mockRefreshTokenAPI(refreshToken);
      
      if (response.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        await TokenManager.setTokens(accessToken, newRefreshToken);
        
        dispatch({
          type: ActionTypes.TOKEN_REFRESH,
          payload: { sessionInfo: response.data.sessionInfo },
        });
        
        return { success: true };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // リフレッシュに失敗した場合はログアウト
      await logout();
      return { success: false };
    }
  }, [logout]);

  // エラーをクリア
  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  }, []);

  // 設定の更新
  const updateSettings = useCallback(async (settings) => {
    try {
      if (settings.biometricEnabled !== undefined) {
        await BiometricAuth.setBiometricEnabled(settings.biometricEnabled);
      }
      
      dispatch({
        type: ActionTypes.UPDATE_SETTINGS,
        payload: settings,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Settings update failed:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // 初期化実行
  useEffect(() => {
    initialize();
    
    // コンポーネントのアンマウント時にクリーンアップ
    return () => {
      sessionService.cleanup();
    };
  }, [initialize]);

  // トークンの自動リフレッシュ
  useEffect(() => {
    if (!state.isAuthenticated || !AUTH_CONFIG.SESSION.AUTO_REFRESH) {
      return;
    }

    const interval = setInterval(async () => {
      const accessToken = await TokenManager.getAccessToken();
      
      if (accessToken) {
        const payload = TokenManager.decodeJWT(accessToken);
        const currentTime = Date.now() / 1000;
        const timeUntilExpiry = payload.exp - currentTime;
        
        // 有効期限の5分前にリフレッシュ
        if (timeUntilExpiry < AUTH_CONFIG.SESSION.REFRESH_THRESHOLD / 1000) {
          await refreshToken();
        }
      }
    }, 60000); // 1分ごとにチェック

    return () => clearInterval(interval);
  }, [state.isAuthenticated, refreshToken]);

  const value = {
    // 状態
    ...state,
    
    // アクション
    login,
    loginWithBiometric,
    register,
    logout,
    updateUser,
    refreshToken,
    clearError,
    updateSettings,
    
    // ユーティリティ
    initialize,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// カスタムフック
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// モックAPI関数（実際の実装では削除）
const mockLoginAPI = async (credentials) => {
  // 模擬的な遅延
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 簡単な認証チェック
  if (credentials.email === 'test@example.com' && credentials.password === 'password123') {
    return {
      success: true,
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          displayName: 'テストユーザー',
          avatar: null,
          role: 'user',
          emailVerified: true,
          createdAt: new Date().toISOString(),
        },
        accessToken: 'mock_access_token_12345',
        refreshToken: 'mock_refresh_token_12345',
        sessionInfo: {
          id: 'session_12345',
          createdAt: new Date().toISOString(),
        },
      },
    };
  } else {
    return {
      success: false,
      message: AUTH_CONFIG.ERROR_MESSAGES.INVALID_CREDENTIALS,
    };
  }
};

const mockRegisterAPI = async (userData) => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    success: true,
    data: {
      user: {
        id: '2',
        email: userData.email,
        username: userData.username,
        displayName: userData.displayName || userData.username,
        avatar: null,
        role: 'user',
        emailVerified: false,
        createdAt: new Date().toISOString(),
      },
      accessToken: 'mock_access_token_67890',
      refreshToken: 'mock_refresh_token_67890',
      sessionInfo: {
        id: 'session_67890',
        createdAt: new Date().toISOString(),
      },
    },
  };
};

const mockUpdateUserAPI = async (updates) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return {
    success: true,
    data: {
      user: updates,
    },
  };
};

const mockRefreshTokenAPI = async (refreshToken) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    data: {
      accessToken: 'new_mock_access_token_12345',
      refreshToken: 'new_mock_refresh_token_12345',
      sessionInfo: {
        id: 'new_session_12345',
        refreshedAt: new Date().toISOString(),
      },
    },
  };
};

export default AuthContext;