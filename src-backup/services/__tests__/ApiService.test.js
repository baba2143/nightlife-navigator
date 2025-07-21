import { jest } from '@jest/globals';
import apiService from '../ApiService';
import jwtService from '../JWTService';
import securityManager from '../../utils/security';

// 依存関係のモック
jest.mock('../JWTService');
jest.mock('../../utils/security');

// fetch のモック
global.fetch = jest.fn();

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // デフォルトのモック実装
    jwtService.initialize.mockResolvedValue(true);
    securityManager.secureRetrieve.mockResolvedValue(null);
    securityManager.secureStore.mockResolvedValue(true);
    securityManager.generateCSRFToken.mockResolvedValue('csrf-token-123');
    securityManager.checkRateLimit.mockResolvedValue(true);
    
    // デフォルトの fetch レスポンス
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ success: true }),
      text: async () => 'success',
      headers: {
        get: jest.fn(() => 'application/json')
      }
    });
    
    // APIサービスの状態をリセット
    apiService.accessToken = null;
    apiService.refreshToken = null;
    apiService.isRefreshing = false;
    apiService.refreshPromise = null;
  });

  describe('初期化', () => {
    it('正常に初期化される', async () => {
      const result = await apiService.initialize();
      
      expect(result).toBe(true);
      expect(jwtService.initialize).toHaveBeenCalled();
      expect(securityManager.secureRetrieve).toHaveBeenCalledWith('access_token');
      expect(securityManager.secureRetrieve).toHaveBeenCalledWith('refresh_token');
    });

    it('保存されたトークンが正しく読み込まれる', async () => {
      securityManager.secureRetrieve
        .mockResolvedValueOnce('stored-access-token')
        .mockResolvedValueOnce('stored-refresh-token');
      
      await apiService.initialize();
      
      expect(apiService.accessToken).toBe('stored-access-token');
      expect(apiService.refreshToken).toBe('stored-refresh-token');
    });

    it('初期化エラーでもfalseを返す', async () => {
      jwtService.initialize.mockRejectedValue(new Error('Init error'));
      
      const result = await apiService.initialize();
      
      expect(result).toBe(false);
    });
  });

  describe('トークン管理', () => {
    it('トークンが正しく保存される', async () => {
      await apiService.storeTokens('new-access-token', 'new-refresh-token');
      
      expect(apiService.accessToken).toBe('new-access-token');
      expect(apiService.refreshToken).toBe('new-refresh-token');
      expect(securityManager.secureStore).toHaveBeenCalledWith('access_token', 'new-access-token');
      expect(securityManager.secureStore).toHaveBeenCalledWith('refresh_token', 'new-refresh-token');
    });

    it('トークンが正しくクリアされる', async () => {
      apiService.accessToken = 'some-token';
      apiService.refreshToken = 'some-refresh-token';
      
      await apiService.clearTokens();
      
      expect(apiService.accessToken).toBeNull();
      expect(apiService.refreshToken).toBeNull();
      expect(securityManager.secureStore).toHaveBeenCalledWith('access_token', null);
      expect(securityManager.secureStore).toHaveBeenCalledWith('refresh_token', null);
    });
  });

  describe('ヘッダー構築', () => {
    it('基本ヘッダーが正しく設定される', async () => {
      const headers = await apiService.buildHeaders();
      
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Accept']).toBe('application/json');
      expect(headers['X-Requested-With']).toBe('XMLHttpRequest');
      expect(headers['X-CSRF-Token']).toBe('csrf-token-123');
      expect(headers['X-API-Version']).toBe('1.0');
      expect(headers['X-Client-Type']).toBe('mobile-app');
    });

    it('認証ヘッダーが含まれる', async () => {
      apiService.accessToken = 'test-access-token';
      
      const headers = await apiService.buildHeaders();
      
      expect(headers['Authorization']).toBe('Bearer test-access-token');
    });

    it('追加ヘッダーが正しくマージされる', async () => {
      const additionalHeaders = {
        'Custom-Header': 'custom-value',
        'Content-Type': 'text/plain'
      };
      
      const headers = await apiService.buildHeaders(additionalHeaders);
      
      expect(headers['Custom-Header']).toBe('custom-value');
      expect(headers['Content-Type']).toBe('text/plain'); // 上書き
    });
  });

  describe('HTTPリクエスト', () => {
    it('GETリクエストが正しく実行される', async () => {
      const response = await apiService.get('/test');
      
      expect(fetch).toHaveBeenCalledWith(
        `${apiService.baseURL}/test`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Object)
        })
      );
      expect(response).toEqual({ success: true });
    });

    it('クエリパラメータが正しく処理される', async () => {
      await apiService.get('/test', { param1: 'value1', param2: 'value2' });
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('param1=value1&param2=value2'),
        expect.any(Object)
      );
    });

    it('POSTリクエストでボディが正しく送信される', async () => {
      const data = { key: 'value' };
      
      await apiService.post('/test', data);
      
      expect(fetch).toHaveBeenCalledWith(
        `${apiService.baseURL}/test`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('FormDataが正しく処理される', async () => {
      const formData = new FormData();
      formData.append('file', 'test-file');
      
      await apiService.post('/upload', formData, { isFormData: true });
      
      expect(fetch).toHaveBeenCalledWith(
        `${apiService.baseURL}/upload`,
        expect.objectContaining({
          method: 'POST',
          body: formData,
          headers: expect.not.objectContaining({
            'Content-Type': expect.any(String)
          })
        })
      );
    });
  });

  describe('エラーハンドリング', () => {
    it('HTTPエラーが適切に処理される', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'リソースが見つかりません' }),
        headers: {
          get: jest.fn(() => 'application/json')
        }
      });
      
      await expect(apiService.get('/nonexistent')).rejects.toThrow('リソースが見つかりません');
    });

    it('ネットワークエラーが適切に処理される', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(apiService.get('/test')).rejects.toThrow('ネットワークエラーが発生しました');
    });

    it('タイムアウトエラーが適切に処理される', async () => {
      fetch.mockImplementationOnce(() => 
        new Promise((resolve, reject) => {
          setTimeout(() => reject({ name: 'AbortError' }), 100);
        })
      );
      
      await expect(apiService.get('/test')).rejects.toThrow('リクエストがタイムアウトしました');
    });

    it('デフォルトエラーメッセージが使用される', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
        headers: {
          get: jest.fn(() => 'application/json')
        }
      });
      
      await expect(apiService.get('/test')).rejects.toThrow('サーバーエラーが発生しました');
    });
  });

  describe('認証とトークンリフレッシュ', () => {
    beforeEach(() => {
      apiService.refreshToken = 'valid-refresh-token';
      jwtService.refreshAccessToken.mockResolvedValue({
        accessToken: 'new-access-token'
      });
    });

    it('401エラー時に自動的にトークンリフレッシュが実行される', async () => {
      // 最初の401レスポンス
      fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ message: 'Token expired' }),
          headers: {
            get: jest.fn(() => 'application/json')
          }
        })
        // リフレッシュ後の成功レスポンス
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ success: true }),
          headers: {
            get: jest.fn(() => 'application/json')
          }
        });
      
      const response = await apiService.get('/protected');
      
      expect(jwtService.refreshAccessToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(securityManager.secureStore).toHaveBeenCalledWith('access_token', 'new-access-token');
      expect(response).toEqual({ success: true });
      expect(fetch).toHaveBeenCalledTimes(2); // 元のリクエスト + リトライ
    });

    it('リフレッシュトークンがない場合は401エラーをそのまま返す', async () => {
      apiService.refreshToken = null;
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Unauthorized' }),
        headers: {
          get: jest.fn(() => 'application/json')
        }
      });
      
      await expect(apiService.get('/protected')).rejects.toThrow('Unauthorized');
      expect(jwtService.refreshAccessToken).not.toHaveBeenCalled();
    });

    it('リフレッシュに失敗した場合はトークンがクリアされる', async () => {
      jwtService.refreshAccessToken.mockRejectedValue(new Error('Refresh failed'));
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Token expired' }),
        headers: {
          get: jest.fn(() => 'application/json')
        }
      });
      
      await expect(apiService.get('/protected')).rejects.toThrow('認証が必要です');
      expect(apiService.accessToken).toBeNull();
      expect(apiService.refreshToken).toBeNull();
    });

    it('同時リフレッシュが適切に処理される', async () => {
      // 複数のリクエストが同時に401を受けた場合のテスト
      fetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Token expired' }),
        headers: {
          get: jest.fn(() => 'application/json')
        }
      });
      
      const promises = [
        apiService.get('/protected1'),
        apiService.get('/protected2'),
        apiService.get('/protected3')
      ];
      
      await expect(Promise.all(promises)).rejects.toThrow();
      
      // リフレッシュは一度だけ実行される
      expect(jwtService.refreshAccessToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('認証API', () => {
    it('ログインが正常に実行される', async () => {
      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: { id: 'user123', email: 'test@example.com' }
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
        headers: {
          get: jest.fn(() => 'application/json')
        }
      });
      
      const credentials = { email: 'test@example.com', password: 'password' };
      const response = await apiService.login(credentials);
      
      expect(response).toEqual(mockResponse);
      expect(apiService.accessToken).toBe('new-access-token');
      expect(apiService.refreshToken).toBe('new-refresh-token');
      expect(securityManager.checkRateLimit).toHaveBeenCalledWith('api_login', 5, 300000);
    });

    it('レート制限に達した場合はエラー', async () => {
      securityManager.checkRateLimit.mockResolvedValue(false);
      
      await expect(
        apiService.login({ email: 'test@example.com', password: 'password' })
      ).rejects.toThrow('ログイン試行回数が上限に達しました');
      
      expect(fetch).not.toHaveBeenCalled();
    });

    it('ログアウトが正常に実行される', async () => {
      apiService.accessToken = 'test-token';
      apiService.refreshToken = 'test-refresh-token';
      
      const response = await apiService.logout();
      
      expect(response).toEqual({ success: true });
      expect(apiService.accessToken).toBeNull();
      expect(apiService.refreshToken).toBeNull();
      expect(fetch).toHaveBeenCalledWith(
        `${apiService.baseURL}/auth/logout`,
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('ログアウトAPIエラーでもローカルクリアは実行される', async () => {
      apiService.accessToken = 'test-token';
      fetch.mockRejectedValueOnce(new Error('Logout API error'));
      
      const response = await apiService.logout();
      
      expect(response).toEqual({ success: true });
      expect(apiService.accessToken).toBeNull();
    });
  });

  describe('ファイルアップロード', () => {
    it('ファイルアップロードが正常に実行される', async () => {
      const mockFile = { name: 'test.jpg', type: 'image/jpeg' };
      const additionalData = { description: 'Test image' };
      
      await apiService.uploadFile('/upload', mockFile, additionalData);
      
      expect(fetch).toHaveBeenCalledWith(
        `${apiService.baseURL}/upload`,
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      );
    });
  });

  describe('API情報取得', () => {
    it('API情報が正しく返される', () => {
      apiService.accessToken = 'test-token';
      apiService.refreshToken = 'test-refresh-token';
      apiService.isRefreshing = true;
      
      const info = apiService.getApiInfo();
      
      expect(info).toEqual({
        baseURL: apiService.baseURL,
        hasAccessToken: true,
        hasRefreshToken: true,
        isRefreshing: true
      });
    });
  });

  describe('接続テスト', () => {
    it('接続テストが成功する', async () => {
      const result = await apiService.testConnection();
      
      expect(result.connected).toBe(true);
      expect(result.response).toEqual({ success: true });
    });

    it('接続テストが失敗する', async () => {
      fetch.mockRejectedValueOnce(new Error('Connection failed'));
      
      const result = await apiService.testConnection();
      
      expect(result.connected).toBe(false);
      expect(result.error).toBe('Connection failed');
    });
  });

  describe('クリーンアップ', () => {
    it('状態が正しくクリアされる', () => {
      apiService.accessToken = 'test-token';
      apiService.refreshToken = 'test-refresh-token';
      apiService.isRefreshing = true;
      apiService.refreshPromise = Promise.resolve();
      
      apiService.cleanup();
      
      expect(apiService.accessToken).toBeNull();
      expect(apiService.refreshToken).toBeNull();
      expect(apiService.isRefreshing).toBe(false);
      expect(apiService.refreshPromise).toBeNull();
    });
  });
});