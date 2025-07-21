import { jest } from '@jest/globals';
import securityManager from '../security';
import errorHandler from '../errorHandler';

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

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(),
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios'
  },
  AppState: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    currentState: 'active'
  }
}));

// crypto-jsのモック
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn(() => ({ toString: () => 'encrypted-data' })),
    decrypt: jest.fn(() => ({ toString: () => '{"test":"data"}' }))
  },
  enc: {
    Base64: {
      stringify: jest.fn(() => 'base64-encoded'),
      parse: jest.fn(() => ({ toString: () => 'encrypted-data' }))
    },
    Utf8: {
      parse: jest.fn(() => 'utf8-parsed'),
      toString: () => 'utf8-string'
    }
  },
  SHA256: jest.fn(() => ({ toString: () => 'hashed-value' }))
}));

// 設定ファイルのモック
jest.mock('../../config', () => ({
  config: {
    ENV: 'test',
    APP_CONFIG: {
      security: {
        sessionTimeout: 1800000, // 30分
        passwordMinLength: 8,
        requireSpecialChars: true,
        enableSSL: true,
        enableCertificatePinning: false
      }
    }
  }
}));

// 依存関係のモック
jest.mock('../errorHandler');

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

// グローバルオブジェクトのモック
global.crypto = {
  getRandomValues: jest.fn(arr => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
  subtle: {
    digest: jest.fn(() => Promise.resolve(new ArrayBuffer(32)))
  }
};

global.btoa = jest.fn(str => Buffer.from(str).toString('base64'));
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

global.sessionStorage = {
  clear: jest.fn()
};

global.window = {
  location: {
    protocol: 'https:',
    href: ''
  }
};

global.document = {
  addEventListener: jest.fn()
};

describe('SecurityManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // SecurityManagerの状態をリセット
    securityManager.cleanup();
    
    // デフォルトのモック実装
    Crypto.getRandomBytesAsync.mockResolvedValue(new Uint8Array(32).fill(42));
    SecureStore.setItemAsync.mockResolvedValue();
    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.deleteItemAsync.mockResolvedValue();
    
    AsyncStorage.setItem.mockResolvedValue();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.multiRemove.mockResolvedValue();
    
    errorHandler.handleError.mockImplementation((error) => {
      console.error('Mocked error:', error);
    });
    
    localStorage.getItem.mockReturnValue(null);
    localStorage.setItem.mockImplementation();
    localStorage.removeItem.mockImplementation();
  });

  describe('初期化', () => {
    it('正常に初期化される', async () => {
      const result = await securityManager.initialize();
      
      expect(result).toBe(true);
      expect(securityManager.isInitialized).toBe(true);
      expect(securityManager.encryptionKey).toBeDefined();
    });

    it('初期化エラーが適切に処理される', async () => {
      Crypto.getRandomBytesAsync.mockRejectedValue(new Error('Crypto error'));
      
      const result = await securityManager.initialize();
      
      expect(result).toBe(false);
      expect(errorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('暗号化キー管理', () => {
    it('暗号化キーが正しく生成される', async () => {
      const key = await securityManager.generateEncryptionKey();
      
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key.length).toBe(64); // 32バイト * 2文字/バイト
      expect(Crypto.getRandomBytesAsync).toHaveBeenCalledWith(32);
    });

    it('モバイル環境で暗号化キーがセキュアに保存される', async () => {
      await securityManager.storeEncryptionKey('test-key');
      
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'encryption_key',
        'test-key',
        {
          requireAuthentication: true,
          authenticationPrompt: 'アプリの暗号化キーにアクセスしています'
        }
      );
    });

    it('Web環境で暗号化キーハッシュが保存される', async () => {
      const { Platform } = require('react-native');
      Platform.OS = 'web';
      
      await securityManager.storeEncryptionKey('test-key');
      
      expect(CryptoJS.SHA256).toHaveBeenCalledWith('test-key');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'encryption_key_hash',
        'hashed-value'
      );
    });

    it('暗号化キーが正しく取得される', async () => {
      SecureStore.getItemAsync.mockResolvedValue('stored-key');
      
      const key = await securityManager.retrieveEncryptionKey();
      
      expect(key).toBe('stored-key');
      expect(securityManager.encryptionKey).toBe('stored-key');
    });

    it('キーが存在しない場合は新しく生成される', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);
      
      const key = await securityManager.retrieveEncryptionKey();
      
      expect(key).toBeDefined();
      expect(Crypto.getRandomBytesAsync).toHaveBeenCalled();
    });
  });

  describe('セッション管理', () => {
    it('セッション監視が開始される', () => {
      securityManager.startSessionMonitoring();
      
      expect(securityManager.sessionInterval).toBeDefined();
    });

    it('セッション監視が停止される', () => {
      securityManager.startSessionMonitoring();
      const intervalId = securityManager.sessionInterval;
      
      securityManager.stopSessionMonitoring();
      
      expect(securityManager.sessionInterval).toBeNull();
    });

    it('最後のアクティビティが更新される', () => {
      const beforeTime = securityManager.lastActivity;
      
      securityManager.updateLastActivity();
      
      expect(securityManager.lastActivity).toBeGreaterThan(beforeTime);
    });

    it('セッションタイムアウトが検出される', async () => {
      securityManager.lastActivity = Date.now() - 2000000; // 古いタイムスタンプ
      const clearSessionSpy = jest.spyOn(securityManager, 'clearSession');
      
      await securityManager.checkSessionTimeout();
      
      expect(clearSessionSpy).toHaveBeenCalled();
    });

    it('セッションがクリアされる', async () => {
      await securityManager.clearSession();
      
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['auth_token', 'user_data']);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user_data');
    });
  });

  describe('暗号化・復号化', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });

    it('データが正しく暗号化される', async () => {
      const testData = { test: 'data' };
      
      const encrypted = await securityManager.encrypt(testData);
      
      expect(encrypted).toBe('base64-encoded');
      expect(CryptoJS.AES.encrypt).toHaveBeenCalled();
      expect(CryptoJS.enc.Base64.stringify).toHaveBeenCalled();
    });

    it('データが正しく復号化される', async () => {
      const encryptedData = 'encrypted-data';
      
      const decrypted = await securityManager.decrypt(encryptedData);
      
      expect(decrypted).toEqual({ test: 'data' });
      expect(CryptoJS.enc.Base64.parse).toHaveBeenCalled();
      expect(CryptoJS.AES.decrypt).toHaveBeenCalled();
    });

    it('暗号化キーがない場合はnullを返す', async () => {
      securityManager.encryptionKey = null;
      Crypto.getRandomBytesAsync.mockRejectedValue(new Error('No key'));
      
      const result = await securityManager.encrypt('test');
      
      expect(result).toBeNull();
      expect(errorHandler.handleError).toHaveBeenCalled();
    });

    it('復号化に失敗した場合はnullを返す', async () => {
      CryptoJS.AES.decrypt.mockReturnValue({ toString: () => '' });
      
      const result = await securityManager.decrypt('invalid-data');
      
      expect(result).toBeNull();
      expect(errorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('セキュアストレージ', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });

    it('機密データがSecureStoreに保存される', async () => {
      const result = await securityManager.secureStore('auth_token', 'token-data');
      
      expect(result).toBe(true);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth_token',
        'base64-encoded',
        {
          requireAuthentication: true,
          authenticationPrompt: 'auth_tokenのデータにアクセスしています'
        }
      );
    });

    it('一般データがAsyncStorageに保存される', async () => {
      const result = await securityManager.secureStore('general_data', 'data');
      
      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('general_data', 'base64-encoded');
    });

    it('機密データがSecureStoreから取得される', async () => {
      SecureStore.getItemAsync.mockResolvedValue('encrypted-data');
      
      const result = await securityManager.secureRetrieve('auth_token');
      
      expect(result).toEqual({ test: 'data' });
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith(
        'auth_token',
        {
          requireAuthentication: true,
          authenticationPrompt: 'auth_tokenのデータにアクセスしています'
        }
      );
    });

    it('データが存在しない場合はnullを返す', async () => {
      const result = await securityManager.secureRetrieve('nonexistent');
      
      expect(result).toBeNull();
    });

    it('機密データの判定が正しく行われる', () => {
      expect(securityManager.isSensitiveData('auth_token')).toBe(true);
      expect(securityManager.isSensitiveData('user_credentials')).toBe(true);
      expect(securityManager.isSensitiveData('general_data')).toBe(false);
    });
  });

  describe('パスワード検証', () => {
    it('強力なパスワードが有効と判定される', () => {
      const result = securityManager.validatePassword('StrongPass123!');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('短すぎるパスワードがエラーになる', () => {
      const result = securityManager.validatePassword('Short1!');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスワードは8文字以上である必要があります');
    });

    it('特殊文字がないパスワードがエラーになる', () => {
      const result = securityManager.validatePassword('Password123');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスワードには特殊文字を含める必要があります');
    });

    it('大文字がないパスワードがエラーになる', () => {
      const result = securityManager.validatePassword('password123!');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスワードには大文字を含める必要があります');
    });

    it('小文字がないパスワードがエラーになる', () => {
      const result = securityManager.validatePassword('PASSWORD123!');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスワードには小文字を含める必要があります');
    });

    it('数字がないパスワードがエラーになる', () => {
      const result = securityManager.validatePassword('Password!');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスワードには数字を含める必要があります');
    });
  });

  describe('入力のサニタイゼーション', () => {
    it('HTML特殊文字が正しくエスケープされる', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      
      const sanitized = securityManager.sanitizeInput(maliciousInput);
      
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });

    it('文字列以外の入力はそのまま返される', () => {
      const numberInput = 123;
      
      const result = securityManager.sanitizeInput(numberInput);
      
      expect(result).toBe(123);
    });
  });

  describe('入力検証', () => {
    it('有効な入力が正しく検証される', () => {
      const result = securityManager.validateInput('test@example.com', {
        type: 'email',
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('必須フィールドが空の場合エラーになる', () => {
      const result = securityManager.validateInput('', {
        required: true
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('このフィールドは必須です');
    });

    it('最小長チェックが正しく動作する', () => {
      const result = securityManager.validateInput('abc', {
        minLength: 5
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('最低5文字以上で入力してください');
    });

    it('最大長チェックが正しく動作する', () => {
      const result = securityManager.validateInput('very long input', {
        maxLength: 5
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('最大5文字以下で入力してください');
    });

    it('パターンチェックが正しく動作する', () => {
      const result = securityManager.validateInput('invalid-email', {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        patternMessage: 'メールアドレスの形式が正しくありません'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('メールアドレスの形式が正しくありません');
    });

    it('禁止文字チェックが正しく動作する', () => {
      const result = securityManager.validateInput('This contains spam', {
        forbidden: ['spam', 'scam']
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('禁止された文字列が含まれています: spam');
    });
  });

  describe('CSRFトークン', () => {
    it('CSRFトークンが生成される', () => {
      const token = securityManager.generateCSRFToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('CSRFトークンの検証が正しく動作する', () => {
      const token = 'test-token';
      
      expect(securityManager.validateCSRFToken(token, token)).toBe(true);
      expect(securityManager.validateCSRFToken(token, 'different-token')).toBe(false);
    });
  });

  describe('レート制限', () => {
    beforeEach(() => {
      localStorage.getItem.mockReturnValue('[]');
    });

    it('制限内の場合はtrueを返す', () => {
      const result = securityManager.checkRateLimit('test_action', 5, 60000);
      
      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('制限を超えた場合はfalseを返す', () => {
      const now = Date.now();
      const attempts = Array(5).fill(now - 30000); // 5回の試行
      localStorage.getItem.mockReturnValue(JSON.stringify(attempts));
      
      const result = securityManager.checkRateLimit('test_action', 5, 60000);
      
      expect(result).toBe(false);
    });

    it('古い試行は除外される', () => {
      const now = Date.now();
      const oldAttempts = [now - 120000]; // 古い試行
      const recentAttempts = [now - 30000]; // 最近の試行
      localStorage.getItem.mockReturnValue(JSON.stringify([...oldAttempts, ...recentAttempts]));
      
      const result = securityManager.checkRateLimit('test_action', 5, 60000);
      
      expect(result).toBe(true);
    });
  });

  describe('セキュアランダム生成', () => {
    it('セキュアなランダム値が生成される', () => {
      const random = securityManager.generateSecureRandom(16);
      
      expect(random).toBeDefined();
      expect(typeof random).toBe('string');
      expect(random.length).toBe(32); // 16バイト * 2文字/バイト
    });

    it('デフォルト長のランダム値が生成される', () => {
      const random = securityManager.generateSecureRandom();
      
      expect(random.length).toBe(64); // 32バイト * 2文字/バイト
    });
  });

  describe('ハッシュ生成', () => {
    it('データのハッシュが生成される', async () => {
      const hash = await securityManager.generateHash('test data');
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(crypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(ArrayBuffer));
    });

    it('ハッシュ生成エラーが適切に処理される', async () => {
      crypto.subtle.digest.mockRejectedValue(new Error('Hash error'));
      
      const hash = await securityManager.generateHash('test data');
      
      expect(hash).toBeNull();
      expect(errorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('セキュリティ監査', () => {
    it('セキュリティ監査が実行される', async () => {
      await securityManager.initialize();
      
      const audit = await securityManager.runSecurityAudit();
      
      expect(audit.timestamp).toBeDefined();
      expect(audit.environment).toBe('test');
      expect(audit.checks.https).toBe(true);
      expect(audit.checks.secureStorage).toBe(true);
      expect(audit.checks.sessionManagement).toBe(true);
      expect(audit.checks.encryption).toBe(true);
    });
  });

  describe('セキュリティヘッダー', () => {
    it('セキュリティヘッダーが正しく返される', () => {
      const headers = securityManager.getSecurityHeaders();
      
      expect(headers['Content-Security-Policy']).toBeDefined();
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('設定取得', () => {
    it('セキュリティ設定が正しく返される', () => {
      const config = securityManager.getSecurityConfig();
      
      expect(config.sessionTimeout).toBe(1800000);
      expect(config.passwordMinLength).toBe(8);
      expect(config.requireSpecialChars).toBe(true);
      expect(config.enableSSL).toBe(true);
      expect(config.enableCertificatePinning).toBe(false);
    });
  });

  describe('クリーンアップ', () => {
    it('状態が正しくクリアされる', () => {
      securityManager.startSessionMonitoring();
      securityManager.encryptionKey = 'test-key';
      securityManager.isInitialized = true;
      
      securityManager.cleanup();
      
      expect(securityManager.sessionInterval).toBeNull();
      expect(securityManager.encryptionKey).toBeNull();
      expect(securityManager.isInitialized).toBe(false);
    });
  });

  describe('エラーハンドリング', () => {
    it('ストレージエラーが適切に処理される', async () => {
      AsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));
      
      const result = await securityManager.secureStore('test_key', 'test_data');
      
      expect(result).toBe(false);
      expect(errorHandler.handleError).toHaveBeenCalled();
    });

    it('暗号化エラーが適切に処理される', async () => {
      CryptoJS.AES.encrypt.mockImplementation(() => {
        throw new Error('Encryption error');
      });
      
      const result = await securityManager.encrypt('test');
      
      expect(result).toBeNull();
      expect(errorHandler.handleError).toHaveBeenCalled();
    });

    it('復号化エラーが適切に処理される', async () => {
      CryptoJS.AES.decrypt.mockImplementation(() => {
        throw new Error('Decryption error');
      });
      
      const result = await securityManager.decrypt('test');
      
      expect(result).toBeNull();
      expect(errorHandler.handleError).toHaveBeenCalled();
    });
  });
});