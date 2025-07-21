import ApiClient from '../ApiClient';

// モック設定
global.fetch = jest.fn();

// ExpoSecureStoreのモック
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// AsyncStorageのモック
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('ApiClient', () => {
  let apiClient;

  beforeEach(() => {
    apiClient = new ApiClient();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('デフォルト設定で初期化される', () => {
      expect(apiClient.baseURL).toBe('https://api.nightlife-navigator.com');
      expect(apiClient.timeout).toBe(10000);
      expect(apiClient.maxRetries).toBe(3);
    });

    it('カスタム設定で初期化される', () => {
      const customApiClient = new ApiClient({
        baseURL: 'https://custom.api.com',
        timeout: 5000,
        maxRetries: 2
      });

      expect(customApiClient.baseURL).toBe('https://custom.api.com');
      expect(customApiClient.timeout).toBe(5000);
      expect(customApiClient.maxRetries).toBe(2);
    });
  });

  describe('request', () => {
    it('成功時に正しいレスポンスを返す', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({ data: 'test' })
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await apiClient.request('/test');

      expect(result).toEqual({ data: 'test' });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.nightlife-navigator.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          })
        })
      );
    });

    it('認証トークンがある場合、Authorizationヘッダーを含む', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({ data: 'test' })
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      // トークンを設定
      apiClient.authToken = 'test_token';

      await apiClient.request('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.nightlife-navigator.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test_token'
          })
        })
      );
    });

    it('4xx エラーの場合、適切なエラーを投げる', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce({ error: 'Bad Request' })
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      await expect(apiClient.request('/test')).rejects.toThrow('Bad Request');
    });

    it('5xx エラーの場合、適切なエラーを投げる', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValueOnce({ error: 'Internal Server Error' })
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      await expect(apiClient.request('/test')).rejects.toThrow('Internal Server Error');
    });

    it('ネットワークエラーの場合、適切なエラーを投げる', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network Error'));

      await expect(apiClient.request('/test')).rejects.toThrow('Network Error');
    });

    it('タイムアウトの場合、適切なエラーを投げる', async () => {
      global.fetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const shortTimeoutClient = new ApiClient({ timeout: 50 });

      await expect(shortTimeoutClient.request('/test')).rejects.toThrow();
    });
  });

  describe('retry mechanism', () => {
    it('失敗時にリトライを行う', async () => {
      const mockFailResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValueOnce({ error: 'Server Error' })
      };

      const mockSuccessResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({ data: 'success' })
      };

      global.fetch
        .mockResolvedValueOnce(mockFailResponse)
        .mockResolvedValueOnce(mockSuccessResponse);

      const result = await apiClient.request('/test');

      expect(result).toEqual({ data: 'success' });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('最大リトライ回数に達した場合、エラーを投げる', async () => {
      const mockFailResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValueOnce({ error: 'Server Error' })
      };

      global.fetch.mockResolvedValue(mockFailResponse);

      await expect(apiClient.request('/test')).rejects.toThrow('Server Error');
      expect(global.fetch).toHaveBeenCalledTimes(4); // 初回 + 3回のリトライ
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({ data: 'test' })
      };
      global.fetch.mockResolvedValueOnce(mockResponse);
    });

    it('GET リクエストを実行する', async () => {
      await apiClient.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.nightlife-navigator.com/test',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('POST リクエストを実行する', async () => {
      const data = { test: 'data' };
      await apiClient.post('/test', data);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.nightlife-navigator.com/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data)
        })
      );
    });

    it('PUT リクエストを実行する', async () => {
      const data = { test: 'data' };
      await apiClient.put('/test', data);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.nightlife-navigator.com/test',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(data)
        })
      );
    });

    it('DELETE リクエストを実行する', async () => {
      await apiClient.delete('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.nightlife-navigator.com/test',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

  describe('token management', () => {
    it('認証トークンを設定する', () => {
      apiClient.setAuthToken('test_token');
      expect(apiClient.authToken).toBe('test_token');
    });

    it('認証トークンをクリアする', () => {
      apiClient.setAuthToken('test_token');
      apiClient.clearAuthToken();
      expect(apiClient.authToken).toBeNull();
    });
  });

  describe('request interceptors', () => {
    it('リクエストインターセプターを追加する', () => {
      const interceptor = jest.fn().mockImplementation((config) => config);
      apiClient.addRequestInterceptor(interceptor);

      expect(apiClient.requestInterceptors).toContain(interceptor);
    });

    it('リクエストインターセプターを削除する', () => {
      const interceptor = jest.fn();
      apiClient.addRequestInterceptor(interceptor);
      apiClient.removeRequestInterceptor(interceptor);

      expect(apiClient.requestInterceptors).not.toContain(interceptor);
    });
  });

  describe('response interceptors', () => {
    it('レスポンスインターセプターを追加する', () => {
      const interceptor = jest.fn().mockImplementation((response) => response);
      apiClient.addResponseInterceptor(interceptor);

      expect(apiClient.responseInterceptors).toContain(interceptor);
    });

    it('レスポンスインターセプターを削除する', () => {
      const interceptor = jest.fn();
      apiClient.addResponseInterceptor(interceptor);
      apiClient.removeResponseInterceptor(interceptor);

      expect(apiClient.responseInterceptors).not.toContain(interceptor);
    });
  });

  describe('error handling', () => {
    it('401 エラーでトークンをクリアする', async () => {
      apiClient.setAuthToken('test_token');

      const mockResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValueOnce({ error: 'Unauthorized' })
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      await expect(apiClient.request('/test')).rejects.toThrow('Unauthorized');
      expect(apiClient.authToken).toBeNull();
    });

    it('レスポンスが JSON でない場合、テキストエラーを返す', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockRejectedValueOnce(new Error('Invalid JSON')),
        text: jest.fn().mockResolvedValueOnce('Bad Request')
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      await expect(apiClient.request('/test')).rejects.toThrow('Bad Request');
    });
  });
});