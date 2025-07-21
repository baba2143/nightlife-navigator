import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import { AUTH_CONFIG, VALIDATION_RULES } from '../config/auth';

/**
 * 認証関連のユーティリティ関数
 */

// セキュアストレージの抽象化
export const SecureStorage = {
  // セキュアにデータを保存
  async setItem(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (Platform.OS === 'web') {
        // Web環境では暗号化してlocalStorageに保存
        const encrypted = CryptoJS.AES.encrypt(stringValue, AUTH_CONFIG.JWT.SECRET_KEY).toString();
        localStorage.setItem(key, encrypted);
      } else {
        // ネイティブ環境ではSecureStoreを使用
        await SecureStore.setItemAsync(key, stringValue);
      }
    } catch (error) {
      console.error('SecureStorage setItem error:', error);
      // フォールバックとしてAsyncStorageを使用
      await AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  },

  // セキュアにデータを取得
  async getItem(key) {
    try {
      let value;
      
      if (Platform.OS === 'web') {
        // Web環境では復号化
        const encrypted = localStorage.getItem(key);
        if (encrypted) {
          const decrypted = CryptoJS.AES.decrypt(encrypted, AUTH_CONFIG.JWT.SECRET_KEY);
          value = decrypted.toString(CryptoJS.enc.Utf8);
        }
      } else {
        // ネイティブ環境ではSecureStoreから取得
        value = await SecureStore.getItemAsync(key);
      }
      
      return value;
    } catch (error) {
      console.error('SecureStorage getItem error:', error);
      // フォールバックとしてAsyncStorageを使用
      return await AsyncStorage.getItem(key);
    }
  },

  // セキュアにデータを削除
  async removeItem(key) {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('SecureStorage removeItem error:', error);
      // フォールバック
      await AsyncStorage.removeItem(key);
    }
  },

  // すべてのアイテムをクリア
  async clear() {
    try {
      const keys = Object.values(AUTH_CONFIG.STORAGE_KEYS);
      
      if (Platform.OS === 'web') {
        keys.forEach(key => localStorage.removeItem(key));
      } else {
        await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key).catch(() => {})));
      }
    } catch (error) {
      console.error('SecureStorage clear error:', error);
    }
  }
};

// トークン管理
export const TokenManager = {
  // アクセストークンを保存
  async setAccessToken(token) {
    await SecureStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  // アクセストークンを取得
  async getAccessToken() {
    return await SecureStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  },

  // リフレッシュトークンを保存
  async setRefreshToken(token) {
    await SecureStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  // リフレッシュトークンを取得
  async getRefreshToken() {
    return await SecureStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
  },

  // 両方のトークンを保存
  async setTokens(accessToken, refreshToken) {
    await Promise.all([
      this.setAccessToken(accessToken),
      this.setRefreshToken(refreshToken),
    ]);
  },

  // すべてのトークンを削除
  async clearTokens() {
    await Promise.all([
      SecureStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN),
      SecureStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  },

  // トークンの有効期限をチェック
  isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = this.decodeJWT(token);
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  },

  // JWTトークンをデコード
  decodeJWT(token) {
    try {
      const base64Payload = token.split('.')[1];
      const payload = JSON.parse(atob(base64Payload));
      return payload;
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  },

  // トークンからユーザー情報を取得
  getUserFromToken(token) {
    try {
      const payload = this.decodeJWT(token);
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions || [],
      };
    } catch (error) {
      return null;
    }
  },
};

// バリデーション
export const ValidationUtils = {
  // メールアドレスの検証
  validateEmail(email) {
    if (!email) {
      return { isValid: false, message: 'メールアドレスを入力してください' };
    }
    
    if (!VALIDATION_RULES.email.pattern.test(email)) {
      return { isValid: false, message: VALIDATION_RULES.email.message };
    }
    
    return { isValid: true };
  },

  // パスワードの検証
  validatePassword(password) {
    if (!password) {
      return { isValid: false, message: 'パスワードを入力してください' };
    }
    
    if (password.length < AUTH_CONFIG.PASSWORD.MIN_LENGTH) {
      return { 
        isValid: false, 
        message: `パスワードは${AUTH_CONFIG.PASSWORD.MIN_LENGTH}文字以上である必要があります` 
      };
    }
    
    if (password.length > AUTH_CONFIG.PASSWORD.MAX_LENGTH) {
      return { 
        isValid: false, 
        message: `パスワードは${AUTH_CONFIG.PASSWORD.MAX_LENGTH}文字以下である必要があります` 
      };
    }
    
    if (AUTH_CONFIG.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      return { isValid: false, message: 'パスワードには大文字を含める必要があります' };
    }
    
    if (AUTH_CONFIG.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      return { isValid: false, message: 'パスワードには小文字を含める必要があります' };
    }
    
    if (AUTH_CONFIG.PASSWORD.REQUIRE_NUMBERS && !/\d/.test(password)) {
      return { isValid: false, message: 'パスワードには数字を含める必要があります' };
    }
    
    if (AUTH_CONFIG.PASSWORD.REQUIRE_SYMBOLS && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
      return { isValid: false, message: 'パスワードには記号を含める必要があります' };
    }
    
    return { isValid: true };
  },

  // ユーザー名の検証
  validateUsername(username) {
    if (!username) {
      return { isValid: false, message: 'ユーザー名を入力してください' };
    }
    
    if (!VALIDATION_RULES.username.pattern.test(username)) {
      return { isValid: false, message: VALIDATION_RULES.username.message };
    }
    
    return { isValid: true };
  },

  // 電話番号の検証
  validatePhoneNumber(phoneNumber) {
    if (!phoneNumber) {
      return { isValid: true }; // 電話番号は任意項目
    }
    
    if (!VALIDATION_RULES.phoneNumber.pattern.test(phoneNumber)) {
      return { isValid: false, message: VALIDATION_RULES.phoneNumber.message };
    }
    
    return { isValid: true };
  },

  // 登録フォームの検証
  validateRegistrationForm(formData) {
    const errors = {};
    
    const emailValidation = this.validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message;
    }
    
    const passwordValidation = this.validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message;
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'パスワードが一致しません';
    }
    
    if (formData.username) {
      const usernameValidation = this.validateUsername(formData.username);
      if (!usernameValidation.isValid) {
        errors.username = usernameValidation.message;
      }
    }
    
    if (formData.phoneNumber) {
      const phoneValidation = this.validatePhoneNumber(formData.phoneNumber);
      if (!phoneValidation.isValid) {
        errors.phoneNumber = phoneValidation.message;
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

// 生体認証
export const BiometricAuth = {
  // 生体認証の利用可能性をチェック
  async isAvailable() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      return {
        isAvailable: hasHardware && isEnrolled,
        hasHardware,
        isEnrolled,
        supportedTypes,
      };
    } catch (error) {
      console.error('Biometric availability check failed:', error);
      return { isAvailable: false };
    }
  },

  // 生体認証を実行
  async authenticate(reason = AUTH_CONFIG.BIOMETRIC.REASON) {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: AUTH_CONFIG.BIOMETRIC.FALLBACK_TITLE,
        cancelLabel: 'キャンセル',
        disableDeviceFallback: false,
      });
      
      return result;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return { success: false, error: error.message };
    }
  },

  // 生体認証の有効/無効状態を保存
  async setBiometricEnabled(enabled) {
    await SecureStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.BIOMETRIC_ENABLED, enabled.toString());
  },

  // 生体認証の有効/無効状態を取得
  async isBiometricEnabled() {
    const enabled = await SecureStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.BIOMETRIC_ENABLED);
    return enabled === 'true';
  },
};

// セッション管理
export const SessionManager = {
  // セッション情報を保存
  async saveSession(sessionData) {
    const session = {
      ...sessionData,
      timestamp: Date.now(),
      deviceInfo: await this.getDeviceInfo(),
    };
    
    await SecureStorage.setItem('current_session', JSON.stringify(session));
  },

  // セッション情報を取得
  async getSession() {
    try {
      const sessionData = await SecureStorage.getItem('current_session');
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      return null;
    }
  },

  // セッションを削除
  async clearSession() {
    await SecureStorage.removeItem('current_session');
  },

  // デバイス情報を取得
  async getDeviceInfo() {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      timestamp: Date.now(),
    };
  },

  // セッションの有効性をチェック
  async isSessionValid() {
    const session = await this.getSession();
    if (!session) return false;
    
    const now = Date.now();
    const sessionAge = now - session.timestamp;
    
    return sessionAge < AUTH_CONFIG.SESSION.SESSION_TIMEOUT;
  },
};

// ユーザーデータ管理
export const UserDataManager = {
  // ユーザーデータを保存
  async saveUserData(userData) {
    await SecureStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  },

  // ユーザーデータを取得
  async getUserData() {
    try {
      const userData = await SecureStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  },

  // ユーザーデータを削除
  async clearUserData() {
    await SecureStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.USER_DATA);
  },

  // 最終ログイン時刻を保存
  async setLastLogin() {
    await SecureStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.LAST_LOGIN, Date.now().toString());
  },

  // 最終ログイン時刻を取得
  async getLastLogin() {
    const timestamp = await SecureStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.LAST_LOGIN);
    return timestamp ? parseInt(timestamp) : null;
  },
};

// エラーハンドリング
export const AuthErrorHandler = {
  // エラーを分析して適切なメッセージを返す
  handleError(error) {
    if (error.response) {
      // サーバーからのエラーレスポンス
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          return data.message || AUTH_CONFIG.ERROR_MESSAGES.INVALID_CREDENTIALS;
        case 401:
          return AUTH_CONFIG.ERROR_MESSAGES.INVALID_CREDENTIALS;
        case 403:
          return AUTH_CONFIG.ERROR_MESSAGES.ACCOUNT_LOCKED;
        case 422:
          return data.message || '入力内容に誤りがあります';
        case 429:
          return 'リクエストが多すぎます。しばらく待ってから再試行してください';
        case 500:
          return AUTH_CONFIG.ERROR_MESSAGES.SERVER_ERROR;
        default:
          return AUTH_CONFIG.ERROR_MESSAGES.NETWORK_ERROR;
      }
    } else if (error.request) {
      // ネットワークエラー
      return AUTH_CONFIG.ERROR_MESSAGES.NETWORK_ERROR;
    } else {
      // その他のエラー
      return error.message || '予期しないエラーが発生しました';
    }
  },

  // ネットワークエラーかどうかを判定
  isNetworkError(error) {
    return !error.response && error.request;
  },

  // 認証エラーかどうかを判定
  isAuthError(error) {
    return error.response && [401, 403].includes(error.response.status);
  },
};

// パスワード強度チェック
export const PasswordStrengthChecker = {
  // パスワードの強度を計算
  calculateStrength(password) {
    let score = 0;
    const feedback = [];
    
    // 長さのチェック
    if (password.length >= 8) score += 1;
    else feedback.push('8文字以上にしてください');
    
    if (password.length >= 12) score += 1;
    
    // 文字種類のチェック
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('小文字を含めてください');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('大文字を含めてください');
    
    if (/\d/.test(password)) score += 1;
    else feedback.push('数字を含めてください');
    
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) score += 1;
    else feedback.push('記号を含めるとより安全です');
    
    // 共通パスワードのチェック
    const commonPasswords = ['123456', 'password', 'qwerty', 'abc123'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      score -= 2;
      feedback.push('一般的なパスワードは避けてください');
    }
    
    // 強度の判定
    let strength;
    if (score < 2) strength = 'weak';
    else if (score < 4) strength = 'medium';
    else strength = 'strong';
    
    return {
      score: Math.max(0, score),
      strength,
      feedback,
    };
  },
};

export default {
  SecureStorage,
  TokenManager,
  ValidationUtils,
  BiometricAuth,
  SessionManager,
  UserDataManager,
  AuthErrorHandler,
  PasswordStrengthChecker,
};