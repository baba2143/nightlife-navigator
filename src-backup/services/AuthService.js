import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import securityManager from '../utils/security';
import errorHandler from '../utils/errorHandler';
import jwtService from './JWTService';
import apiService from './ApiService';

class AuthService {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.authToken = null;
    this.refreshToken = null;
    this.biometricEnabled = false;
  }

  // 認証サービスの初期化
  async initialize() {
    try {
      // セキュリティマネージャーの初期化
      await securityManager.initialize();
      
      // JWTサービスの初期化
      await jwtService.initialize();
      
      // APIサービスの初期化
      await apiService.initialize();
      
      // 既存の認証情報をチェック
      await this.checkExistingAuth();
      
      // 生体認証の可用性をチェック
      await this.checkBiometricAvailability();
      
      return true;
    } catch (error) {
      errorHandler.handleError(error, { type: 'auth_initialization' });
      return false;
    }
  }

  // 既存の認証情報をチェック
  async checkExistingAuth() {
    try {
      const authToken = await this.getStoredAuthToken();
      const refreshToken = await this.getStoredRefreshToken();
      
      if (authToken && refreshToken) {
        // JWTトークンの有効性を検証
        const validation = await jwtService.validateToken(authToken);
        
        if (validation.valid) {
          this.authToken = authToken;
          this.refreshToken = refreshToken;
          this.isAuthenticated = true;
          
          // JWTペイロードからユーザー情報を取得
          this.currentUser = {
            id: validation.payload.sub,
            email: validation.payload.email,
            role: validation.payload.role,
            permissions: validation.payload.permissions
          };
          
          // APIサービスにトークンを設定
          await apiService.storeTokens(authToken, refreshToken);
        } else {
          // トークンが無効な場合はリフレッシュを試行
          await this.refreshAuthToken();
        }
      }
    } catch (error) {
      errorHandler.handleError(error, { type: 'check_existing_auth' });
      await this.logout();
    }
  }

  // 生体認証の可用性をチェック
  async checkBiometricAvailability() {
    try {
      if (Platform.OS !== 'web') {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        
        this.biometricEnabled = hasHardware && isEnrolled && supportedTypes.length > 0;
        
        // 設定を保存
        await AsyncStorage.setItem('biometric_available', JSON.stringify({
          hasHardware,
          isEnrolled,
          supportedTypes,
          enabled: this.biometricEnabled
        }));
      }
    } catch (error) {
      errorHandler.handleError(error, { type: 'biometric_check' });
      this.biometricEnabled = false;
    }
  }

  // ログイン
  async login(credentials) {
    try {
      // レート制限をチェック
      const canAttempt = await securityManager.checkRateLimit('login', 5, 300000); // 5分間に5回まで
      if (!canAttempt) {
        throw new Error('ログイン試行回数が上限に達しました。しばらく待ってから再試行してください。');
      }

      // 入力値を検証・サニタイズ
      const validationResult = this.validateLoginCredentials(credentials);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }

      // APIサービスでログインを実行
      const authResponse = await apiService.login({
        email: validationResult.sanitizedValues.email,
        password: credentials.password
      });

      if (authResponse.accessToken && authResponse.refreshToken) {
        // JWTトークンを検証
        const validation = await jwtService.validateToken(authResponse.accessToken);
        
        if (validation.valid) {
          // 認証情報を設定
          this.authToken = authResponse.accessToken;
          this.refreshToken = authResponse.refreshToken;
          this.isAuthenticated = true;
          
          // JWTペイロードからユーザー情報を取得
          this.currentUser = {
            id: validation.payload.sub,
            email: validation.payload.email,
            role: validation.payload.role,
            permissions: validation.payload.permissions
          };

          // 生体認証の設定
          if (this.biometricEnabled && credentials.enableBiometric) {
            await this.setupBiometricAuth(credentials);
          }

          return {
            success: true,
            user: this.currentUser,
            token: this.authToken
          };
        } else {
          throw new Error('受信したJWTトークンが無効です');
        }
      } else {
        throw new Error('認証レスポンスが不正です');
      }
    } catch (error) {
      errorHandler.handleError(error, { type: 'login_attempt' });
      throw error;
    }
  }

  // 生体認証によるログイン
  async loginWithBiometric() {
    try {
      if (!this.biometricEnabled) {
        throw new Error('生体認証が利用できません');
      }

      // 生体認証を実行
      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'アプリにログインするために認証してください',
        cancelLabel: 'キャンセル',
        fallbackLabel: 'パスワードを使用',
        disableDeviceFallback: false
      });

      if (biometricResult.success) {
        // 保存された認証情報を取得
        const storedCredentials = await this.getBiometricCredentials();
        
        if (storedCredentials) {
          return await this.login(storedCredentials);
        } else {
          throw new Error('生体認証用の認証情報が見つかりません');
        }
      } else {
        throw new Error('生体認証がキャンセルされました');
      }
    } catch (error) {
      errorHandler.handleError(error, { type: 'biometric_login' });
      throw error;
    }
  }

  // ログアウト
  async logout() {
    try {
      // JWTトークンを無効化
      if (this.authToken) {
        await jwtService.invalidateToken(this.authToken);
      }
      
      if (this.refreshToken) {
        await jwtService.invalidateToken(this.refreshToken);
      }

      // APIサービスでログアウトを実行
      await apiService.logout();

      // ローカルの認証情報をクリア
      await this.clearAuthTokens();
      await this.clearBiometricCredentials();
      
      // セッションをクリア
      await securityManager.clearSession();

      this.isAuthenticated = false;
      this.currentUser = null;
      this.authToken = null;
      this.refreshToken = null;

      return { success: true };
    } catch (error) {
      errorHandler.handleError(error, { type: 'logout' });
      throw error;
    }
  }

  // トークンの更新
  async refreshAuthToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('リフレッシュトークンがありません');
      }

      // JWTサービスでトークンをリフレッシュ
      const refreshResponse = await jwtService.refreshAccessToken(this.refreshToken);
      
      // 新しいトークンを保存
      this.authToken = refreshResponse.accessToken;
      await this.storeAuthTokens(this.authToken, this.refreshToken);
      
      // APIサービスのトークンも更新
      await apiService.storeTokens(this.authToken, this.refreshToken);
      
      return { success: true, token: this.authToken };
    } catch (error) {
      errorHandler.handleError(error, { type: 'token_refresh' });
      // リフレッシュに失敗した場合はログアウト
      await this.logout();
      throw new Error('セッションの更新に失敗しました。再ログインしてください。');
    }
  }

  // 認証トークンを安全に保存
  async storeAuthTokens(authToken, refreshToken) {
    try {
      const encryptedAuthToken = await securityManager.encrypt(authToken);
      const encryptedRefreshToken = await securityManager.encrypt(refreshToken);

      if (Platform.OS === 'web') {
        await AsyncStorage.setItem('auth_token', encryptedAuthToken);
        await AsyncStorage.setItem('refresh_token', encryptedRefreshToken);
      } else {
        await SecureStore.setItemAsync('auth_token', encryptedAuthToken, {
          requireAuthentication: false // ログイン時は認証不要
        });
        await SecureStore.setItemAsync('refresh_token', encryptedRefreshToken, {
          requireAuthentication: false
        });
      }
    } catch (error) {
      errorHandler.handleError(error, { type: 'store_auth_tokens' });
      throw error;
    }
  }

  // 保存された認証トークンを取得
  async getStoredAuthToken() {
    try {
      let encryptedToken = null;
      
      if (Platform.OS === 'web') {
        encryptedToken = await AsyncStorage.getItem('auth_token');
      } else {
        encryptedToken = await SecureStore.getItemAsync('auth_token');
      }
      
      if (encryptedToken) {
        return await securityManager.decrypt(encryptedToken);
      }
      
      return null;
    } catch (error) {
      errorHandler.handleError(error, { type: 'get_stored_auth_token' });
      return null;
    }
  }

  // 保存されたリフレッシュトークンを取得
  async getStoredRefreshToken() {
    try {
      let encryptedToken = null;
      
      if (Platform.OS === 'web') {
        encryptedToken = await AsyncStorage.getItem('refresh_token');
      } else {
        encryptedToken = await SecureStore.getItemAsync('refresh_token');
      }
      
      if (encryptedToken) {
        return await securityManager.decrypt(encryptedToken);
      }
      
      return null;
    } catch (error) {
      errorHandler.handleError(error, { type: 'get_stored_refresh_token' });
      return null;
    }
  }

  // 認証トークンをクリア
  async clearAuthTokens() {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
      } else {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('refresh_token');
      }
    } catch (error) {
      errorHandler.handleError(error, { type: 'clear_auth_tokens' });
    }
  }

  // 生体認証用の認証情報を設定
  async setupBiometricAuth(credentials) {
    try {
      if (!this.biometricEnabled) {
        throw new Error('生体認証が利用できません');
      }

      const encryptedCredentials = await securityManager.encrypt({
        email: credentials.email,
        // パスワードは保存せず、代わりにハッシュを保存
        passwordHash: await securityManager.generateHash(credentials.password),
        timestamp: Date.now()
      });

      await SecureStore.setItemAsync('biometric_credentials', encryptedCredentials, {
        requireAuthentication: true,
        authenticationPrompt: '生体認証用の認証情報にアクセスしています'
      });

      return { success: true };
    } catch (error) {
      errorHandler.handleError(error, { type: 'setup_biometric' });
      throw error;
    }
  }

  // 生体認証用の認証情報を取得
  async getBiometricCredentials() {
    try {
      const encryptedCredentials = await SecureStore.getItemAsync('biometric_credentials', {
        requireAuthentication: true,
        authenticationPrompt: '生体認証用の認証情報にアクセスしています'
      });

      if (encryptedCredentials) {
        return await securityManager.decrypt(encryptedCredentials);
      }

      return null;
    } catch (error) {
      errorHandler.handleError(error, { type: 'get_biometric_credentials' });
      return null;
    }
  }

  // 生体認証用の認証情報をクリア
  async clearBiometricCredentials() {
    try {
      await SecureStore.deleteItemAsync('biometric_credentials');
    } catch (error) {
      errorHandler.handleError(error, { type: 'clear_biometric_credentials' });
    }
  }

  // ログイン認証情報の検証
  validateLoginCredentials(credentials) {
    const errors = [];
    const sanitizedValues = {};

    // メールアドレスの検証
    const emailValidation = securityManager.validateInput(credentials.email, {
      type: 'email',
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      patternMessage: '有効なメールアドレスを入力してください'
    });

    if (!emailValidation.isValid) {
      errors.push(...emailValidation.errors);
    } else {
      sanitizedValues.email = emailValidation.sanitizedValue;
    }

    // パスワードの検証
    const passwordValidation = securityManager.validatePassword(credentials.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValues
    };
  }

  // トークンの有効性を検証
  async validateToken(token) {
    try {
      // JWTサービスでトークンを検証
      const validation = await jwtService.validateToken(token);
      return validation.valid;
    } catch (error) {
      errorHandler.handleError(error, { type: 'token_validation' });
      return false;
    }
  }

  // 現在のユーザー情報を取得
  async getCurrentUserInfo() {
    try {
      if (!this.authToken) {
        return null;
      }

      // APIサービスからユーザー情報を取得
      return await apiService.getCurrentUser();
    } catch (error) {
      // APIエラーの場合はJWTペイロードから取得
      try {
        const tokenInfo = jwtService.getJWTInfo(this.authToken);
        if (tokenInfo) {
          return {
            id: tokenInfo.userId,
            email: tokenInfo.email,
            role: tokenInfo.role,
            permissions: tokenInfo.permissions
          };
        }
      } catch (jwtError) {
        errorHandler.handleError(jwtError, { type: 'get_user_from_jwt' });
      }
      
      errorHandler.handleError(error, { type: 'get_current_user' });
      return null;
    }
  }

  // 実際のログイン処理（APIコール）
  async performLogin(credentials) {
    try {
      // 実際の実装では、サーバーAPIにリクエストを送信
      // ここではダミーレスポンスを返す
      
      // シミュレーション: サーバー応答時間
      await new Promise(resolve => setTimeout(resolve, 1000));

      // ダミーの成功レスポンス
      return {
        success: true,
        authToken: await securityManager.generateSecureRandom(64),
        refreshToken: await securityManager.generateSecureRandom(64),
        user: {
          id: 'user_123',
          email: credentials.email,
          name: 'テストユーザー',
          role: 'user'
        }
      };
    } catch (error) {
      errorHandler.handleError(error, { type: 'perform_login' });
      return {
        success: false,
        message: 'ログインに失敗しました'
      };
    }
  }

  // 実際のログアウト処理（APIコール）
  async performLogout(token) {
    try {
      // 実際の実装では、サーバーAPIにログアウトリクエストを送信
      // ここではダミー処理
      console.log('ログアウト処理完了');
      return { success: true };
    } catch (error) {
      errorHandler.handleError(error, { type: 'perform_logout' });
      return { success: false };
    }
  }

  // 実際のトークンリフレッシュ処理（APIコール）
  async performTokenRefresh(refreshToken) {
    try {
      // 実際の実装では、サーバーAPIにリフレッシュリクエストを送信
      // ここではダミーレスポンスを返す
      
      return {
        success: true,
        authToken: await securityManager.generateSecureRandom(64),
        refreshToken: await securityManager.generateSecureRandom(64)
      };
    } catch (error) {
      errorHandler.handleError(error, { type: 'perform_token_refresh' });
      return {
        success: false,
        message: 'トークンの更新に失敗しました'
      };
    }
  }

  // 認証状態の取得
  getAuthState() {
    const tokenInfo = this.authToken ? jwtService.getJWTInfo(this.authToken) : null;
    
    return {
      isAuthenticated: this.isAuthenticated,
      user: this.currentUser,
      token: this.authToken,
      biometricEnabled: this.biometricEnabled,
      tokenInfo: tokenInfo,
      tokenTimeToExpiry: tokenInfo ? tokenInfo.timeToExpiry : 0,
      isTokenExpired: tokenInfo ? tokenInfo.isExpired : true
    };
  }

  // クリーンアップ
  cleanup() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.authToken = null;
    this.refreshToken = null;
    this.biometricEnabled = false;
  }
}

export default new AuthService();