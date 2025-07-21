import {
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  clearSecureStorage,
  setItem,
  getItem,
  removeItem,
  clearStorage,
  setSessionData,
  getSessionData,
  removeSessionData,
  clearSessionData,
  setUserPreferences,
  getUserPreferences,
  removeUserPreferences,
  clearUserPreferences,
  secureStorageAvailable,
  migrateStorageData,
  validateStorageData,
  compressData,
  decompressData,
  encryptData,
  decryptData,
  createBackup,
  restoreBackup,
  isStorageQuotaExceeded,
  getStorageUsage,
  optimizeStorage
} from '../persistenceUtils';

// モック設定
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  isAvailableAsync: jest.fn()
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn()
}));

jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn().mockReturnValue({ toString: jest.fn().mockReturnValue('encrypted') }),
    decrypt: jest.fn().mockReturnValue({ toString: jest.fn().mockReturnValue('decrypted') })
  },
  enc: {
    Utf8: 'utf8'
  }
}));

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

describe('persistenceUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SecureStore operations', () => {
    describe('setSecureItem', () => {
      it('セキュアストレージにアイテムを保存する', async () => {
        SecureStore.setItemAsync.mockResolvedValueOnce(undefined);

        const result = await setSecureItem('test_key', 'test_value');

        expect(result.success).toBe(true);
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('test_key', 'test_value');
      });

      it('オブジェクトをJSON文字列として保存する', async () => {
        SecureStore.setItemAsync.mockResolvedValueOnce(undefined);

        const testObject = { id: 1, name: 'test' };
        const result = await setSecureItem('test_key', testObject);

        expect(result.success).toBe(true);
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('test_key', JSON.stringify(testObject));
      });

      it('保存エラーの場合、エラーを返す', async () => {
        SecureStore.setItemAsync.mockRejectedValueOnce(new Error('Storage error'));

        const result = await setSecureItem('test_key', 'test_value');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Storage error');
      });
    });

    describe('getSecureItem', () => {
      it('セキュアストレージからアイテムを取得する', async () => {
        SecureStore.getItemAsync.mockResolvedValueOnce('test_value');

        const result = await getSecureItem('test_key');

        expect(result.success).toBe(true);
        expect(result.data).toBe('test_value');
        expect(SecureStore.getItemAsync).toHaveBeenCalledWith('test_key');
      });

      it('JSONオブジェクトを適切にパースする', async () => {
        const testObject = { id: 1, name: 'test' };
        SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(testObject));

        const result = await getSecureItem('test_key');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(testObject);
      });

      it('存在しないキーの場合、nullを返す', async () => {
        SecureStore.getItemAsync.mockResolvedValueOnce(null);

        const result = await getSecureItem('nonexistent_key');

        expect(result.success).toBe(true);
        expect(result.data).toBeNull();
      });

      it('取得エラーの場合、エラーを返す', async () => {
        SecureStore.getItemAsync.mockRejectedValueOnce(new Error('Get error'));

        const result = await getSecureItem('test_key');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Get error');
      });
    });

    describe('removeSecureItem', () => {
      it('セキュアストレージからアイテムを削除する', async () => {
        SecureStore.deleteItemAsync.mockResolvedValueOnce(undefined);

        const result = await removeSecureItem('test_key');

        expect(result.success).toBe(true);
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('test_key');
      });

      it('削除エラーの場合、エラーを返す', async () => {
        SecureStore.deleteItemAsync.mockRejectedValueOnce(new Error('Delete error'));

        const result = await removeSecureItem('test_key');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Delete error');
      });
    });

    describe('clearSecureStorage', () => {
      it('セキュアストレージをクリアする', async () => {
        // セキュアストレージには一括クリア機能がないため、個別削除をモック
        SecureStore.getItemAsync.mockResolvedValueOnce('session_data');
        SecureStore.deleteItemAsync.mockResolvedValueOnce(undefined);

        const result = await clearSecureStorage();

        expect(result.success).toBe(true);
      });

      it('クリアエラーの場合、エラーを返す', async () => {
        SecureStore.deleteItemAsync.mockRejectedValueOnce(new Error('Clear error'));

        const result = await clearSecureStorage();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Clear error');
      });
    });
  });

  describe('AsyncStorage operations', () => {
    describe('setItem', () => {
      it('AsyncStorageにアイテムを保存する', async () => {
        AsyncStorage.setItem.mockResolvedValueOnce(undefined);

        const result = await setItem('test_key', 'test_value');

        expect(result.success).toBe(true);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('test_key', 'test_value');
      });

      it('オブジェクトをJSON文字列として保存する', async () => {
        AsyncStorage.setItem.mockResolvedValueOnce(undefined);

        const testObject = { id: 1, name: 'test' };
        const result = await setItem('test_key', testObject);

        expect(result.success).toBe(true);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('test_key', JSON.stringify(testObject));
      });

      it('保存エラーの場合、エラーを返す', async () => {
        AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

        const result = await setItem('test_key', 'test_value');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Storage error');
      });
    });

    describe('getItem', () => {
      it('AsyncStorageからアイテムを取得する', async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('test_value');

        const result = await getItem('test_key');

        expect(result.success).toBe(true);
        expect(result.data).toBe('test_value');
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('test_key');
      });

      it('JSONオブジェクトを適切にパースする', async () => {
        const testObject = { id: 1, name: 'test' };
        AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(testObject));

        const result = await getItem('test_key');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(testObject);
      });

      it('存在しないキーの場合、nullを返す', async () => {
        AsyncStorage.getItem.mockResolvedValueOnce(null);

        const result = await getItem('nonexistent_key');

        expect(result.success).toBe(true);
        expect(result.data).toBeNull();
      });

      it('取得エラーの場合、エラーを返す', async () => {
        AsyncStorage.getItem.mockRejectedValueOnce(new Error('Get error'));

        const result = await getItem('test_key');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Get error');
      });
    });

    describe('removeItem', () => {
      it('AsyncStorageからアイテムを削除する', async () => {
        AsyncStorage.removeItem.mockResolvedValueOnce(undefined);

        const result = await removeItem('test_key');

        expect(result.success).toBe(true);
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test_key');
      });

      it('削除エラーの場合、エラーを返す', async () => {
        AsyncStorage.removeItem.mockRejectedValueOnce(new Error('Delete error'));

        const result = await removeItem('test_key');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Delete error');
      });
    });

    describe('clearStorage', () => {
      it('AsyncStorageをクリアする', async () => {
        AsyncStorage.clear.mockResolvedValueOnce(undefined);

        const result = await clearStorage();

        expect(result.success).toBe(true);
        expect(AsyncStorage.clear).toHaveBeenCalled();
      });

      it('クリアエラーの場合、エラーを返す', async () => {
        AsyncStorage.clear.mockRejectedValueOnce(new Error('Clear error'));

        const result = await clearStorage();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Clear error');
      });
    });
  });

  describe('Session data operations', () => {
    describe('setSessionData', () => {
      it('セッションデータを保存する', async () => {
        SecureStore.setItemAsync.mockResolvedValueOnce(undefined);

        const sessionData = { id: 'session_123', userId: 1 };
        const result = await setSessionData(sessionData);

        expect(result.success).toBe(true);
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
          'session_data',
          JSON.stringify(sessionData)
        );
      });

      it('保存エラーの場合、エラーを返す', async () => {
        SecureStore.setItemAsync.mockRejectedValueOnce(new Error('Session save error'));

        const sessionData = { id: 'session_123', userId: 1 };
        const result = await setSessionData(sessionData);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Session save error');
      });
    });

    describe('getSessionData', () => {
      it('セッションデータを取得する', async () => {
        const sessionData = { id: 'session_123', userId: 1 };
        SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(sessionData));

        const result = await getSessionData();

        expect(result.success).toBe(true);
        expect(result.data).toEqual(sessionData);
        expect(SecureStore.getItemAsync).toHaveBeenCalledWith('session_data');
      });

      it('セッションデータが存在しない場合、nullを返す', async () => {
        SecureStore.getItemAsync.mockResolvedValueOnce(null);

        const result = await getSessionData();

        expect(result.success).toBe(true);
        expect(result.data).toBeNull();
      });

      it('取得エラーの場合、エラーを返す', async () => {
        SecureStore.getItemAsync.mockRejectedValueOnce(new Error('Session get error'));

        const result = await getSessionData();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Session get error');
      });
    });

    describe('removeSessionData', () => {
      it('セッションデータを削除する', async () => {
        SecureStore.deleteItemAsync.mockResolvedValueOnce(undefined);

        const result = await removeSessionData();

        expect(result.success).toBe(true);
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('session_data');
      });

      it('削除エラーの場合、エラーを返す', async () => {
        SecureStore.deleteItemAsync.mockRejectedValueOnce(new Error('Session delete error'));

        const result = await removeSessionData();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Session delete error');
      });
    });

    describe('clearSessionData', () => {
      it('全てのセッションデータをクリアする', async () => {
        SecureStore.deleteItemAsync.mockResolvedValueOnce(undefined);

        const result = await clearSessionData();

        expect(result.success).toBe(true);
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('session_data');
      });

      it('クリアエラーの場合、エラーを返す', async () => {
        SecureStore.deleteItemAsync.mockRejectedValueOnce(new Error('Session clear error'));

        const result = await clearSessionData();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Session clear error');
      });
    });
  });

  describe('User preferences operations', () => {
    describe('setUserPreferences', () => {
      it('ユーザー設定を保存する', async () => {
        AsyncStorage.setItem.mockResolvedValueOnce(undefined);

        const preferences = { theme: 'dark', notifications: true };
        const result = await setUserPreferences(preferences);

        expect(result.success).toBe(true);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'user_preferences',
          JSON.stringify(preferences)
        );
      });

      it('保存エラーの場合、エラーを返す', async () => {
        AsyncStorage.setItem.mockRejectedValueOnce(new Error('Preferences save error'));

        const preferences = { theme: 'dark', notifications: true };
        const result = await setUserPreferences(preferences);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Preferences save error');
      });
    });

    describe('getUserPreferences', () => {
      it('ユーザー設定を取得する', async () => {
        const preferences = { theme: 'dark', notifications: true };
        AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(preferences));

        const result = await getUserPreferences();

        expect(result.success).toBe(true);
        expect(result.data).toEqual(preferences);
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('user_preferences');
      });

      it('ユーザー設定が存在しない場合、デフォルト値を返す', async () => {
        AsyncStorage.getItem.mockResolvedValueOnce(null);

        const result = await getUserPreferences();

        expect(result.success).toBe(true);
        expect(result.data).toEqual({
          theme: 'light',
          notifications: true,
          location: true,
          privacy: {
            shareLocation: false,
            publicProfile: false
          }
        });
      });

      it('取得エラーの場合、エラーを返す', async () => {
        AsyncStorage.getItem.mockRejectedValueOnce(new Error('Preferences get error'));

        const result = await getUserPreferences();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Preferences get error');
      });
    });

    describe('removeUserPreferences', () => {
      it('ユーザー設定を削除する', async () => {
        AsyncStorage.removeItem.mockResolvedValueOnce(undefined);

        const result = await removeUserPreferences();

        expect(result.success).toBe(true);
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user_preferences');
      });

      it('削除エラーの場合、エラーを返す', async () => {
        AsyncStorage.removeItem.mockRejectedValueOnce(new Error('Preferences delete error'));

        const result = await removeUserPreferences();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Preferences delete error');
      });
    });

    describe('clearUserPreferences', () => {
      it('全てのユーザー設定をクリアする', async () => {
        AsyncStorage.removeItem.mockResolvedValueOnce(undefined);

        const result = await clearUserPreferences();

        expect(result.success).toBe(true);
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user_preferences');
      });

      it('クリアエラーの場合、エラーを返す', async () => {
        AsyncStorage.removeItem.mockRejectedValueOnce(new Error('Preferences clear error'));

        const result = await clearUserPreferences();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Preferences clear error');
      });
    });
  });

  describe('Utility functions', () => {
    describe('secureStorageAvailable', () => {
      it('セキュアストレージが利用可能な場合、trueを返す', async () => {
        SecureStore.isAvailableAsync.mockResolvedValueOnce(true);

        const result = await secureStorageAvailable();

        expect(result).toBe(true);
        expect(SecureStore.isAvailableAsync).toHaveBeenCalled();
      });

      it('セキュアストレージが利用不可な場合、falseを返す', async () => {
        SecureStore.isAvailableAsync.mockResolvedValueOnce(false);

        const result = await secureStorageAvailable();

        expect(result).toBe(false);
        expect(SecureStore.isAvailableAsync).toHaveBeenCalled();
      });
    });

    describe('validateStorageData', () => {
      it('有効なデータの場合、trueを返す', () => {
        const validData = { id: 1, name: 'test' };
        const result = validateStorageData(validData);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('無効なデータの場合、falseを返す', () => {
        const invalidData = null;
        const result = validateStorageData(invalidData);

        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(['Data is null or undefined']);
      });

      it('循環参照がある場合、falseを返す', () => {
        const circularData = { name: 'test' };
        circularData.self = circularData;
        
        const result = validateStorageData(circularData);

        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(['Data contains circular references']);
      });
    });

    describe('compressData', () => {
      it('データを圧縮する', () => {
        const data = 'test data for compression';
        const compressed = compressData(data);

        expect(compressed).toBeDefined();
        expect(typeof compressed).toBe('string');
      });

      it('空データを適切に処理する', () => {
        const compressed = compressData('');
        expect(compressed).toBe('');
      });
    });

    describe('decompressData', () => {
      it('データを解凍する', () => {
        const data = 'test data for compression';
        const compressed = compressData(data);
        const decompressed = decompressData(compressed);

        expect(decompressed).toBe(data);
      });

      it('空データを適切に処理する', () => {
        const decompressed = decompressData('');
        expect(decompressed).toBe('');
      });
    });

    describe('encryptData', () => {
      it('データを暗号化する', () => {
        const data = 'sensitive data';
        const encrypted = encryptData(data, 'secret_key');

        expect(encrypted).toBe('encrypted');
        expect(CryptoJS.AES.encrypt).toHaveBeenCalledWith(data, 'secret_key');
      });

      it('空データを適切に処理する', () => {
        const encrypted = encryptData('', 'secret_key');
        expect(encrypted).toBe('');
      });
    });

    describe('decryptData', () => {
      it('データを復号化する', () => {
        const decrypted = decryptData('encrypted', 'secret_key');

        expect(decrypted).toBe('decrypted');
        expect(CryptoJS.AES.decrypt).toHaveBeenCalledWith('encrypted', 'secret_key');
      });

      it('空データを適切に処理する', () => {
        const decrypted = decryptData('', 'secret_key');
        expect(decrypted).toBe('');
      });
    });

    describe('isStorageQuotaExceeded', () => {
      it('ストレージ容量が不足している場合、trueを返す', async () => {
        AsyncStorage.setItem.mockRejectedValueOnce(new Error('QuotaExceededError'));

        const result = await isStorageQuotaExceeded();

        expect(result).toBe(true);
      });

      it('ストレージ容量が十分な場合、falseを返す', async () => {
        AsyncStorage.setItem.mockResolvedValueOnce(undefined);
        AsyncStorage.removeItem.mockResolvedValueOnce(undefined);

        const result = await isStorageQuotaExceeded();

        expect(result).toBe(false);
      });
    });

    describe('getStorageUsage', () => {
      it('ストレージ使用量を取得する', async () => {
        AsyncStorage.getAllKeys.mockResolvedValueOnce(['key1', 'key2']);
        AsyncStorage.multiGet.mockResolvedValueOnce([
          ['key1', 'value1'],
          ['key2', 'value2']
        ]);

        const result = await getStorageUsage();

        expect(result.success).toBe(true);
        expect(result.data).toEqual({
          totalKeys: 2,
          totalSize: expect.any(Number),
          keys: ['key1', 'key2']
        });
      });

      it('使用量取得エラーの場合、エラーを返す', async () => {
        AsyncStorage.getAllKeys.mockRejectedValueOnce(new Error('Get keys error'));

        const result = await getStorageUsage();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Get keys error');
      });
    });

    describe('optimizeStorage', () => {
      it('ストレージを最適化する', async () => {
        AsyncStorage.getAllKeys.mockResolvedValueOnce(['key1', 'expired_key']);
        AsyncStorage.multiGet.mockResolvedValueOnce([
          ['key1', JSON.stringify({ data: 'value1', timestamp: Date.now() })],
          ['expired_key', JSON.stringify({ data: 'value2', timestamp: Date.now() - 1000000 })]
        ]);
        AsyncStorage.removeItem.mockResolvedValueOnce(undefined);

        const result = await optimizeStorage();

        expect(result.success).toBe(true);
        expect(result.data.removedKeys).toEqual(['expired_key']);
        expect(result.data.totalRemoved).toBe(1);
      });

      it('最適化エラーの場合、エラーを返す', async () => {
        AsyncStorage.getAllKeys.mockRejectedValueOnce(new Error('Optimize error'));

        const result = await optimizeStorage();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Optimize error');
      });
    });
  });
});