import { config } from '../config';
import errorHandler from './errorHandler';
import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class SecurityManager {
  constructor() {
    this.isInitialized = false;
    this.encryptionKey = null;
    this.sessionTimeout = config.APP_CONFIG.security.sessionTimeout;
    this.lastActivity = Date.now();
  }

  // セキュリティマネージャーを初期化
  async initialize() {
    try {
      // 暗号化キーの生成
      await this.generateEncryptionKey();
      
      // セッション監視の開始
      this.startSessionMonitoring();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      errorHandler.handleError(error, { type: 'security_initialization' });
      return false;
    }
  }

  // 暗号化キーを生成
  async generateEncryptionKey() {
    try {
      // セキュアな暗号化キーを生成
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      this.encryptionKey = Array.from(randomBytes, byte => 
        byte.toString(16).padStart(2, '0')
      ).join('');
      
      // キーをセキュアストレージに保存
      await this.storeEncryptionKey(this.encryptionKey);
      return this.encryptionKey;
    } catch (error) {
      throw new Error('Failed to generate encryption key: ' + error.message);
    }
  }

  // 暗号化キーをセキュアに保存
  async storeEncryptionKey(key) {
    try {
      if (Platform.OS === 'web') {
        // Web環境では制限があるため、警告を表示
        console.warn('Web環境では完全なセキュアストレージが利用できません');
        await AsyncStorage.setItem('encryption_key_hash', 
          CryptoJS.SHA256(key).toString()
        );
      } else {
        // モバイル環境ではExpo SecureStoreを使用
        await SecureStore.setItemAsync('encryption_key', key, {
          requireAuthentication: true,
          authenticationPrompt: 'アプリの暗号化キーにアクセスしています'
        });
      }
    } catch (error) {
      throw new Error('Failed to store encryption key: ' + error.message);
    }
  }

  // 暗号化キーを取得
  async retrieveEncryptionKey() {
    try {
      if (Platform.OS === 'web') {
        // Web環境では新しいキーを生成
        if (!this.encryptionKey) {
          await this.generateEncryptionKey();
        }
        return this.encryptionKey;
      } else {
        // モバイル環境からキーを取得
        const key = await SecureStore.getItemAsync('encryption_key', {
          requireAuthentication: true,
          authenticationPrompt: 'アプリの暗号化キーにアクセスしています'
        });
        
        if (!key) {
          // キーが存在しない場合は新しく生成
          return await this.generateEncryptionKey();
        }
        
        this.encryptionKey = key;
        return key;
      }
    } catch (error) {
      throw new Error('Failed to retrieve encryption key: ' + error.message);
    }
  }

  // セッション監視を開始
  startSessionMonitoring() {
    // モバイル環境でのセッション監視
    if (Platform.OS === 'web') {
      // Web環境でのイベント監視
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      events.forEach(event => {
        if (typeof document !== 'undefined') {
          document.addEventListener(event, () => {
            this.updateLastActivity();
          }, true);
        }
      });
    } else {
      // React Nativeでのアプリ状態監視
      const { AppState } = require('react-native');
      
      AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          this.updateLastActivity();
        }
      });
    }

    // 定期的にセッションタイムアウトをチェック
    this.sessionInterval = setInterval(() => {
      this.checkSessionTimeout();
    }, 60000); // 1分ごとにチェック
  }

  // セッション監視を停止
  stopSessionMonitoring() {
    if (this.sessionInterval) {
      clearInterval(this.sessionInterval);
      this.sessionInterval = null;
    }
  }

  // 最後のアクティビティを更新
  updateLastActivity() {
    this.lastActivity = Date.now();
  }

  // セッションタイムアウトをチェック
  checkSessionTimeout() {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;
    
    if (timeSinceLastActivity > this.sessionTimeout) {
      this.handleSessionTimeout();
    }
  }

  // セッションタイムアウトを処理
  async handleSessionTimeout() {
    console.warn('Session timeout detected');
    await this.clearSession();
    
    // 環境に応じたリダイレクト処理
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.location.href = '/login?timeout=true';
      }
    } else {
      // React Native環境でのナビゲーション
      // 注意: この部分は実際のナビゲーションライブラリと連携が必要
      console.log('セッションタイムアウト: ログイン画面に遷移してください');
    }
  }

  // セッションをクリア
  async clearSession() {
    try {
      if (Platform.OS === 'web') {
        // Web環境
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear();
        }
      } else {
        // React Native環境
        await AsyncStorage.multiRemove(['auth_token', 'user_data']);
        
        // セキュアストレージからも削除
        try {
          await SecureStore.deleteItemAsync('auth_token');
          await SecureStore.deleteItemAsync('user_data');
        } catch (secureStoreError) {
          // セキュアストレージにデータがない場合のエラーは無視
          console.log('SecureStore clear completed');
        }
      }
      
      this.lastActivity = Date.now();
    } catch (error) {
      errorHandler.handleError(error, { type: 'session_clear' });
    }
  }

  // データを暗号化
  async encrypt(data) {
    try {
      if (!this.encryptionKey) {
        await this.retrieveEncryptionKey();
      }
      
      if (!this.encryptionKey) {
        throw new Error('Encryption key not available');
      }
      
      const jsonString = JSON.stringify(data);
      
      // AES暗号化を使用
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
      
      // 追加のエンコード（Base64）
      const encoded = CryptoJS.enc.Base64.stringify(
        CryptoJS.enc.Utf8.parse(encrypted)
      );
      
      return encoded;
    } catch (error) {
      errorHandler.handleError(error, { type: 'encryption' });
      return null;
    }
  }

  // データを復号化
  async decrypt(encryptedData) {
    try {
      if (!this.encryptionKey) {
        await this.retrieveEncryptionKey();
      }
      
      if (!this.encryptionKey) {
        throw new Error('Encryption key not available');
      }
      
      // Base64デコード
      const decoded = CryptoJS.enc.Base64.parse(encryptedData).toString(
        CryptoJS.enc.Utf8
      );
      
      // AES復号化
      const decrypted = CryptoJS.AES.decrypt(decoded, this.encryptionKey);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!jsonString) {
        throw new Error('Decryption failed - invalid data or key');
      }
      
      return JSON.parse(jsonString);
    } catch (error) {
      errorHandler.handleError(error, { type: 'decryption' });
      return null;
    }
  }

  // 安全なストレージにデータを保存
  async secureStore(key, data) {
    try {
      const encryptedData = await this.encrypt(data);
      if (!encryptedData) {
        return false;
      }
      
      if (Platform.OS === 'web') {
        // Web環境ではlocalStorageを使用
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, encryptedData);
          return true;
        }
        return false;
      } else {
        // モバイル環境では機密性に応じてストレージを選択
        const isSensitive = this.isSensitiveData(key);
        
        if (isSensitive) {
          // 機密データはSecureStoreを使用
          await SecureStore.setItemAsync(key, encryptedData, {
            requireAuthentication: true,
            authenticationPrompt: `${key}のデータにアクセスしています`
          });
        } else {
          // 一般データはAsyncStorageを使用
          await AsyncStorage.setItem(key, encryptedData);
        }
        return true;
      }
    } catch (error) {
      errorHandler.handleError(error, { type: 'secure_store' });
      return false;
    }
  }

  // 機密データかどうかを判定
  isSensitiveData(key) {
    const sensitiveKeys = [
      'auth_token', 'user_credentials', 'payment_info', 
      'biometric_data', 'encryption_key'
    ];
    return sensitiveKeys.some(sensitiveKey => key.includes(sensitiveKey));
  }

  // 安全なストレージからデータを取得
  async secureRetrieve(key) {
    try {
      let encryptedData = null;
      
      if (Platform.OS === 'web') {
        // Web環境
        if (typeof localStorage !== 'undefined') {
          encryptedData = localStorage.getItem(key);
        }
      } else {
        // モバイル環境
        const isSensitive = this.isSensitiveData(key);
        
        if (isSensitive) {
          // 機密データはSecureStoreから取得
          encryptedData = await SecureStore.getItemAsync(key, {
            requireAuthentication: true,
            authenticationPrompt: `${key}のデータにアクセスしています`
          });
        } else {
          // 一般データはAsyncStorageから取得
          encryptedData = await AsyncStorage.getItem(key);
        }
      }
      
      if (encryptedData) {
        return await this.decrypt(encryptedData);
      }
      return null;
    } catch (error) {
      errorHandler.handleError(error, { type: 'secure_retrieve' });
      return null;
    }
  }

  // パスワードの強度をチェック
  validatePassword(password) {
    const minLength = config.APP_CONFIG.security.passwordMinLength;
    const requireSpecialChars = config.APP_CONFIG.security.requireSpecialChars;
    
    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`パスワードは${minLength}文字以上である必要があります`);
    }
    
    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('パスワードには特殊文字を含める必要があります');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('パスワードには大文字を含める必要があります');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('パスワードには小文字を含める必要があります');
    }
    
    if (!/\d/.test(password)) {
      errors.push('パスワードには数字を含める必要があります');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // XSS攻撃を防ぐためのサニタイゼーション
  sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // CSRFトークンを生成
  generateCSRFToken() {
    return btoa(Math.random().toString(36) + Date.now().toString(36));
  }

  // CSRFトークンを検証
  validateCSRFToken(token, storedToken) {
    return token === storedToken;
  }

  // レート制限をチェック
  checkRateLimit(action, limit = 5, windowMs = 60000) {
    const key = `rate_limit_${action}`;
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem(key) || '[]');
    
    // 時間枠外の試行を削除
    const validAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
    
    if (validAttempts.length >= limit) {
      return false;
    }
    
    // 新しい試行を追加
    validAttempts.push(now);
    localStorage.setItem(key, JSON.stringify(validAttempts));
    
    return true;
  }

  // セキュアなランダム値を生成
  generateSecureRandom(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // ハッシュを生成
  async generateHash(data) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      errorHandler.handleError(error, { type: 'hash_generation' });
      return null;
    }
  }

  // セキュリティヘッダーを設定
  setSecurityHeaders() {
    // Content Security Policy
    const csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;";
    
    // 実際の実装では、サーバーサイドでヘッダーを設定
    console.log('Security headers should be set:', { csp });
  }

  // セキュリティ監査を実行
  async runSecurityAudit() {
    const audit = {
      timestamp: new Date().toISOString(),
      environment: config.ENV,
      checks: {}
    };

    // HTTPS接続のチェック
    audit.checks.https = window.location.protocol === 'https:';
    
    // セキュアなストレージのチェック
    audit.checks.secureStorage = this.isInitialized;
    
    // セッション管理のチェック
    audit.checks.sessionManagement = this.lastActivity > 0;
    
    // 暗号化のチェック
    audit.checks.encryption = this.encryptionKey !== null;

    return audit;
  }

  // 入力検証の包括的メソッド
  validateInput(input, rules = {}) {
    const errors = [];
    const sanitizedInput = this.sanitizeInput(input, rules.type || 'html');
    
    // 必須チェック
    if (rules.required && (!input || input.trim() === '')) {
      errors.push('このフィールドは必須です');
    }
    
    // 長さチェック
    if (rules.minLength && input.length < rules.minLength) {
      errors.push(`最低${rules.minLength}文字以上で入力してください`);
    }
    
    if (rules.maxLength && input.length > rules.maxLength) {
      errors.push(`最大${rules.maxLength}文字以下で入力してください`);
    }
    
    // パターンチェック
    if (rules.pattern && !rules.pattern.test(input)) {
      errors.push(rules.patternMessage || '入力形式が正しくありません');
    }
    
    // 禁止文字チェック
    if (rules.forbidden) {
      const forbiddenWords = Array.isArray(rules.forbidden) ? rules.forbidden : [rules.forbidden];
      const lowerInput = input.toLowerCase();
      
      for (const word of forbiddenWords) {
        if (lowerInput.includes(word.toLowerCase())) {
          errors.push(`禁止された文字列が含まれています: ${word}`);
          break;
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitizedInput
    };
  }

  // セキュリティヘッダーを設定（サーバーサイドで使用）
  getSecurityHeaders() {
    return {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
  }

  // クリーンアップメソッド
  cleanup() {
    this.stopSessionMonitoring();
    this.encryptionKey = null;
    this.isInitialized = false;
  }

  // セキュリティ設定を取得
  getSecurityConfig() {
    return {
      sessionTimeout: this.sessionTimeout,
      passwordMinLength: config.APP_CONFIG.security.passwordMinLength,
      requireSpecialChars: config.APP_CONFIG.security.requireSpecialChars,
      enableSSL: config.APP_CONFIG.security.enableSSL,
      enableCertificatePinning: config.APP_CONFIG.security.enableCertificatePinning
    };
  }
}

export default new SecurityManager(); 