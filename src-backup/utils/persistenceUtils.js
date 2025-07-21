import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AUTH_CONFIG } from '../config/auth';

/**
 * 永続化ユーティリティ
 */
export class PersistenceUtils {
  /**
   * セキュアストレージにデータを保存
   */
  static async setSecureItem(key, value, options = {}) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (Platform.OS === 'web') {
        // Web環境では AsyncStorage を使用
        await AsyncStorage.setItem(key, stringValue);
      } else {
        // ネイティブ環境では SecureStore を使用
        const secureOptions = {
          requireAuthentication: options.requireAuthentication || false,
          authenticationPrompt: options.authenticationPrompt || 'アプリにアクセスするため認証が必要です',
          ...options,
        };
        
        await SecureStore.setItemAsync(key, stringValue, secureOptions);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Set secure item error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * セキュアストレージからデータを取得
   */
  static async getSecureItem(key, options = {}) {
    try {
      let value = null;
      
      if (Platform.OS === 'web') {
        value = await AsyncStorage.getItem(key);
      } else {
        const secureOptions = {
          requireAuthentication: options.requireAuthentication || false,
          authenticationPrompt: options.authenticationPrompt || 'アプリにアクセスするため認証が必要です',
          ...options,
        };
        
        value = await SecureStore.getItemAsync(key, secureOptions);
      }
      
      if (value === null) {
        return { success: true, value: null };
      }
      
      // JSON パースを試行
      try {
        const parsedValue = JSON.parse(value);
        return { success: true, value: parsedValue };
      } catch {
        // JSON でない場合は文字列として返す
        return { success: true, value };
      }
    } catch (error) {
      console.error('Get secure item error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * セキュアストレージからデータを削除
   */
  static async removeSecureItem(key) {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Remove secure item error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 通常のストレージにデータを保存
   */
  static async setItem(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
      return { success: true };
    } catch (error) {
      console.error('Set item error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 通常のストレージからデータを取得
   */
  static async getItem(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      
      if (value === null) {
        return { success: true, value: null };
      }
      
      // JSON パースを試行
      try {
        const parsedValue = JSON.parse(value);
        return { success: true, value: parsedValue };
      } catch {
        // JSON でない場合は文字列として返す
        return { success: true, value };
      }
    } catch (error) {
      console.error('Get item error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 通常のストレージからデータを削除
   */
  static async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      console.error('Remove item error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 複数のアイテムを一括で保存
   */
  static async multiSet(keyValuePairs) {
    try {
      const stringPairs = keyValuePairs.map(([key, value]) => [
        key,
        typeof value === 'string' ? value : JSON.stringify(value),
      ]);
      
      await AsyncStorage.multiSet(stringPairs);
      return { success: true };
    } catch (error) {
      console.error('Multi set error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 複数のアイテムを一括で取得
   */
  static async multiGet(keys) {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      const result = {};
      
      pairs.forEach(([key, value]) => {
        if (value !== null) {
          try {
            result[key] = JSON.parse(value);
          } catch {
            result[key] = value;
          }
        } else {
          result[key] = null;
        }
      });
      
      return { success: true, values: result };
    } catch (error) {
      console.error('Multi get error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 複数のアイテムを一括で削除
   */
  static async multiRemove(keys) {
    try {
      await AsyncStorage.multiRemove(keys);
      return { success: true };
    } catch (error) {
      console.error('Multi remove error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * すべてのキーを取得
   */
  static async getAllKeys() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return { success: true, keys };
    } catch (error) {
      console.error('Get all keys error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ストレージをクリア
   */
  static async clear() {
    try {
      await AsyncStorage.clear();
      return { success: true };
    } catch (error) {
      console.error('Clear storage error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * データの暗号化
   */
  static async encrypt(data, key = null) {
    try {
      // 実際の実装では適切な暗号化ライブラリを使用
      // ここでは簡単な Base64 エンコーディング
      const stringData = typeof data === 'string' ? data : JSON.stringify(data);
      const encodedData = btoa(stringData);
      return { success: true, encryptedData: encodedData };
    } catch (error) {
      console.error('Encrypt error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * データの復号化
   */
  static async decrypt(encryptedData, key = null) {
    try {
      // 実際の実装では適切な暗号化ライブラリを使用
      // ここでは簡単な Base64 デコーディング
      const decodedData = atob(encryptedData);
      
      try {
        const parsedData = JSON.parse(decodedData);
        return { success: true, decryptedData: parsedData };
      } catch {
        return { success: true, decryptedData: decodedData };
      }
    } catch (error) {
      console.error('Decrypt error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * データの圧縮
   */
  static async compress(data) {
    try {
      // 実際の実装では適切な圧縮ライブラリを使用
      // ここでは簡単な JSON 最小化
      const stringData = typeof data === 'string' ? data : JSON.stringify(data);
      const compressedData = stringData.replace(/\s+/g, '');
      return { success: true, compressedData };
    } catch (error) {
      console.error('Compress error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * データの展開
   */
  static async decompress(compressedData) {
    try {
      // 実際の実装では適切な圧縮ライブラリを使用
      // ここでは簡単な JSON パース
      try {
        const parsedData = JSON.parse(compressedData);
        return { success: true, decompressedData: parsedData };
      } catch {
        return { success: true, decompressedData: compressedData };
      }
    } catch (error) {
      console.error('Decompress error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * バックアップの作成
   */
  static async createBackup(keys = null) {
    try {
      const allKeys = keys || (await AsyncStorage.getAllKeys());
      const backupData = {};
      
      for (const key of allKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value !== null) {
            backupData[key] = value;
          }
        } catch (error) {
          console.warn(`Failed to backup key ${key}:`, error);
        }
      }
      
      const backup = {
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        version: AUTH_CONFIG.VERSION || '1.0.0',
        data: backupData,
      };
      
      return { success: true, backup };
    } catch (error) {
      console.error('Create backup error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * バックアップの復元
   */
  static async restoreBackup(backup) {
    try {
      if (!backup || !backup.data) {
        return { success: false, error: 'Invalid backup data' };
      }
      
      const keyValuePairs = Object.entries(backup.data);
      await AsyncStorage.multiSet(keyValuePairs);
      
      return { success: true };
    } catch (error) {
      console.error('Restore backup error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * データの整合性チェック
   */
  static async checkIntegrity(key, expectedChecksum = null) {
    try {
      const value = await AsyncStorage.getItem(key);
      
      if (value === null) {
        return { success: true, isValid: false, reason: 'Data not found' };
      }
      
      // 実際の実装では適切なチェックサム計算を使用
      const checksum = this.calculateChecksum(value);
      
      if (expectedChecksum && checksum !== expectedChecksum) {
        return { success: true, isValid: false, reason: 'Checksum mismatch' };
      }
      
      return { success: true, isValid: true, checksum };
    } catch (error) {
      console.error('Check integrity error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * チェックサムの計算
   */
  static calculateChecksum(data) {
    // 実際の実装では適切なハッシュ関数を使用
    // ここでは簡単な文字列長ベースのチェックサム
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    let checksum = 0;
    
    for (let i = 0; i < stringData.length; i++) {
      checksum += stringData.charCodeAt(i);
    }
    
    return checksum.toString(16);
  }

  /**
   * ストレージの使用量を取得
   */
  static async getStorageUsage() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      const itemSizes = {};
      
      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value !== null) {
            const size = new Blob([value]).size;
            itemSizes[key] = size;
            totalSize += size;
          }
        } catch (error) {
          console.warn(`Failed to get size for key ${key}:`, error);
        }
      }
      
      return {
        success: true,
        totalSize,
        itemCount: keys.length,
        itemSizes,
      };
    } catch (error) {
      console.error('Get storage usage error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 期限切れデータの削除
   */
  static async cleanupExpiredData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const now = new Date();
      let cleanedCount = 0;
      
      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value !== null) {
            const parsedValue = JSON.parse(value);
            
            // expiresAt フィールドがある場合はチェック
            if (parsedValue.expiresAt) {
              const expiresAt = new Date(parsedValue.expiresAt);
              if (now > expiresAt) {
                await AsyncStorage.removeItem(key);
                cleanedCount++;
              }
            }
          }
        } catch (error) {
          // JSON でない場合は無視
        }
      }
      
      return { success: true, cleanedCount };
    } catch (error) {
      console.error('Cleanup expired data error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * データの移行
   */
  static async migrateData(fromVersion, toVersion) {
    try {
      // バージョン固有の移行処理
      const migrations = {
        '1.0.0': {
          '1.1.0': (data) => {
            // 1.0.0 から 1.1.0 への移行処理
            return data;
          },
        },
      };
      
      const migrationPath = migrations[fromVersion]?.[toVersion];
      
      if (!migrationPath) {
        return { success: true, migrated: false, reason: 'No migration needed' };
      }
      
      const keys = await AsyncStorage.getAllKeys();
      let migratedCount = 0;
      
      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value !== null) {
            const parsedValue = JSON.parse(value);
            const migratedValue = migrationPath(parsedValue);
            
            if (migratedValue !== parsedValue) {
              await AsyncStorage.setItem(key, JSON.stringify(migratedValue));
              migratedCount++;
            }
          }
        } catch (error) {
          console.warn(`Failed to migrate key ${key}:`, error);
        }
      }
      
      return { success: true, migrated: true, migratedCount };
    } catch (error) {
      console.error('Migrate data error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default PersistenceUtils;