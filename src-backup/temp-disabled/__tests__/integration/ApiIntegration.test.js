import { jest } from '@jest/globals';

// テスト対象のサービス
import ApiService from '../../services/ApiService';
import AuthService from '../../services/AuthService';
import JWTService from '../../services/JWTService';
import securityManager from '../../utils/security';
import errorHandler from '../../utils/errorHandler';
import performanceMonitor from '../../utils/performanceMonitor';

// モックの設定
jest.mock('../../utils/security');
jest.mock('../../utils/errorHandler');
jest.mock('../../utils/performanceMonitor');

// fetch APIのモック
global.fetch = jest.fn();

// テストデータ
const mockApiResponses = {
  bars: [
    {
      id: 'bar-1',
      name: 'テストバー1',
      genre: 'スナック／パブ',
      rating: 4.5,
      address: '東京都渋谷区'
    },
    {
      id: 'bar-2',
      name: 'テストバー2',
      genre: 'クラブ／ラウンジ',
      rating: 4.2,
      address: '東京都新宿区'
    }
  ],
  user: {
    id: 'user123',
    email: 'test@example.com',
    name: 'テストユーザー',
    favorites: ['bar-1']
  },
  coupons: [
    {
      id: 'coupon-1',
      title: 'ドリンク1杯無料',
      barId: 'bar-1',
      isActive: true
    }
  ]
};

const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token'
};

describe('API統合テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // APIサービスの状態をリセット
    ApiService.cleanup();
    
    // セキュリティマネージャーのモック
    securityManager.checkRateLimit.mockResolvedValue(true);
    securityManager.generateCSRFToken.mockResolvedValue('csrf-token-123');
    securityManager.secureStore.mockResolvedValue(true);
    securityManager.secureRetrieve.mockResolvedValue(null);
    
    // エラーハンドラーのモック
    errorHandler.handleError.mockImplementation((error) => {
      console.error('Mocked error:', error);
    });
    
    // パフォーマンスモニターのモック
    performanceMonitor.startTimer.mockReturnValue('timer-123');
    performanceMonitor.endTimer.mockReturnValue({ duration: 100 });
    
    // JWTサービスのモック
    JWTService.initialize = jest.fn().mockResolvedValue(true);
    JWTService.refreshAccessToken = jest.fn().mockResolvedValue({
      accessToken: 'new-access-token'
    });
    
    // fetchのデフォルトモック
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({}),
      text: async () => 'success',
      headers: {
        get: jest.fn(() => 'application/json')
      }
    });
  });

  describe('API初期化と設定', () => {
    it('APIサービスが正常に初期化される', async () => {
      const result = await ApiService.initialize();
      
      expect(result).toBe(true);
      expect(JWTService.initialize).toHaveBeenCalled();
    });

    it('APIベースURLが正しく設定される', () => {
      expect(ApiService.baseURL).toBeDefined();
      expect(typeof ApiService.baseURL).toBe('string');
    });

    it('セキュリティヘッダーが正しく構築される', async () => {
      const headers = await ApiService.buildHeaders();
      
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Accept']).toBe('application/json');
      expect(headers['X-CSRF-Token']).toBe('csrf-token-123');
      expect(headers['X-API-Version']).toBe('1.0');
    });
  });

  describe('認証トークン管理の統合', () => {
    it('ログイン時にトークンが正しく保存される', async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          accessToken: mockTokens.accessToken,
          refreshToken: mockTokens.refreshToken,
          user: mockApiResponses.user
        }),
        headers: {
          get: jest.fn(() => 'application/json')
        }
      });

      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await ApiService.login(credentials);

      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
      expect(ApiService.accessToken).toBe(mockTokens.accessToken);
      expect(ApiService.refreshToken).toBe(mockTokens.refreshToken);
      expect(securityManager.secureStore).toHaveBeenCalledWith('access_token', mockTokens.accessToken);
      expect(securityManager.secureStore).toHaveBeenCalledWith('refresh_token', mockTokens.refreshToken);
    });

    it('401エラー時の自動トークンリフレッシュ', async () => {
      // 初期状態でトークンを設定
      ApiService.accessToken = 'expired-token';
      ApiService.refreshToken = 'valid-refresh-token';

      // 最初のリクエストで401、リフレッシュ後に成功
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
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockApiResponses.bars,
          headers: {
            get: jest.fn(() => 'application/json')
          }
        });

      const result = await ApiService.get('/bars');

      expect(JWTService.refreshAccessToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(result).toEqual(mockApiResponses.bars);
      expect(fetch).toHaveBeenCalledTimes(2); // 元のリクエスト + リトライ
    });

    it('リフレッシュトークンも無効な場合の処理', async () => {
      ApiService.accessToken = 'expired-token';
      ApiService.refreshToken = 'expired-refresh-token';

      JWTService.refreshAccessToken.mockRejectedValue(new Error('Refresh failed'));

      fetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Token expired' }),
        headers: {
          get: jest.fn(() => 'application/json')
        }
      });

      await expect(ApiService.get('/bars')).rejects.toThrow('認証が必要です');
      expect(ApiService.accessToken).toBeNull();
      expect(ApiService.refreshToken).toBeNull();
    });
  });

  describe('レート制限との統合', () => {
    it('レート制限に達した場合のログイン拒否', async () => {
      securityManager.checkRateLimit.mockResolvedValue(false);

      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      await expect(ApiService.login(credentials)).rejects.toThrow('ログイン試行回数が上限に達しました');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('レート制限チェック後の正常なAPI呼び出し', async () => {
      securityManager.checkRateLimit.mockResolvedValue(true);
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApiResponses.bars,
        headers: {
          get: jest.fn(() => 'application/json')
        }
      });

      const result = await ApiService.get('/bars');

      expect(securityManager.checkRateLimit).toHaveBeenCalled();
      expect(result).toEqual(mockApiResponses.bars);
    });
  });

  describe('エラーハンドリングの統合', () => {
    it('ネットワークエラーの適切な処理', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      await expect(ApiService.get('/bars')).rejects.toThrow('ネットワークエラーが発生しました');
      expect(errorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          type: 'network_error'
        })
      );
    });

    it('HTTPエラーステータスの処理', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'サーバーエラー' }),
        headers: {
          get: jest.fn(() => 'application/json')
        }
      });

      await expect(ApiService.get('/bars')).rejects.toThrow('サーバーエラー');
      expect(errorHandler.handleError).toHaveBeenCalled();
    });

    it('タイムアウトエラーの処理', async () => {
      fetch.mockImplementation(() => 
        new Promise((resolve, reject) => {
          setTimeout(() => reject({ name: 'AbortError' }), 100);
        })
      );

      await expect(ApiService.get('/bars')).rejects.toThrow('リクエストがタイムアウトしました');
    });
  });

  describe('パフォーマンス監視の統合', () => {
    it('API呼び出しのパフォーマンス測定', async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApiResponses.bars,
        headers: {
          get: jest.fn(() => 'application/json')
        }
      });

      await ApiService.get('/bars');

      expect(performanceMonitor.startTimer).toHaveBeenCalledWith('api_call');
      expect(performanceMonitor.endTimer).toHaveBeenCalledWith('timer-123', 'success');
    });

    it('API呼び出し失敗時のパフォーマンス記録', async () => {
      fetch.mockRejectedValue(new Error('API Error'));

      await expect(ApiService.get('/bars')).rejects.toThrow();

      expect(performanceMonitor.startTimer).toHaveBeenCalled();
      expect(performanceMonitor.endTimer).toHaveBeenCalledWith('timer-123', 'error');
    });
  });

  describe('データ操作の統合テスト', () => {
    beforeEach(() => {
      ApiService.accessToken = 'valid-token';
    });

    it('バー一覧取得からお気に入り追加までの統合フロー', async () => {
      // バー一覧取得
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockApiResponses.bars,
        headers: {
          get: jest.fn(() => 'application/json')
        }
      });

      const bars = await ApiService.getBars();
      expect(bars).toEqual(mockApiResponses.bars);

      // お気に入り追加
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, favoriteId: 'fav-123' }),
        headers: {
          get: jest.fn(() => 'application/json')
        }
      });

      const favoriteResult = await ApiService.addToFavorites(bars[0].id);
      expect(favoriteResult.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/favorites'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ barId: bars[0].id })
        })
      );
    });

    it('クーポン取得から利用までの統合フロー', async () => {
      // クーポン一覧取得
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockApiResponses.coupons,
        headers: {
          get: jest.fn(() => 'application/json')
        }
      });

      const coupons = await ApiService.getCoupons();
      expect(coupons).toEqual(mockApiResponses.coupons);

      // クーポン利用
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, usageId: 'usage-123' }),
        headers: {
          get: jest.fn(() => 'application/json')
        }
      });

      const usageResult = await ApiService.useCoupon(coupons[0].id);
      expect(usageResult.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/coupons/coupon-1/use'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('ユーザー情報更新の統合フロー', async () => {
      const updatedUserData = {
        name: '更新されたユーザー名',
        preferences: {
          notifications: true,
          theme: 'dark'
        }
      };

      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ...mockApiResponses.user, ...updatedUserData }),
        headers: {
          get: jest.fn(() => 'application/json')
        }
      });

      const result = await ApiService.updateUserProfile(updatedUserData);

      expect(result.name).toBe(updatedUserData.name);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/user/profile'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updatedUserData)
        })
      );
    });
  });

  describe('ファイルアップロードの統合', () => {
    it('FormDataでのファイルアップロード', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const additionalData = { description: 'テスト画像' };

      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, fileId: 'file-123' }),
        headers: {
          get: jest.fn(() => 'application/json')
        }
      });

      const result = await ApiService.uploadFile('/upload', mockFile, additionalData);

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/upload'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      );
    });
  });

  describe('接続テストの統合', () => {
    it('正常な接続テスト', async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy', timestamp: Date.now() }),
        headers: {
          get: jest.fn(() => 'application/json')
        }
      });

      const result = await ApiService.testConnection();

      expect(result.connected).toBe(true);
      expect(result.response.status).toBe('healthy');
    });

    it('接続テストの失敗', async () => {
      fetch.mockRejectedValue(new Error('Connection failed'));

      const result = await ApiService.testConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toBe('Connection failed');
    });
  });

  describe('同時リクエストの処理', () => {
    it('複数の同時APIリクエストが正しく処理される', async () => {
      ApiService.accessToken = 'valid-token';

      // 複数のAPIレスポンスを設定
      fetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockApiResponses.bars,
          headers: { get: jest.fn(() => 'application/json') }
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockApiResponses.coupons,
          headers: { get: jest.fn(() => 'application/json') }
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockApiResponses.user,
          headers: { get: jest.fn(() => 'application/json') }
        });

      // 同時リクエスト実行
      const promises = [
        ApiService.getBars(),
        ApiService.getCoupons(),
        ApiService.getCurrentUser()
      ];

      const results = await Promise.all(promises);

      expect(results[0]).toEqual(mockApiResponses.bars);
      expect(results[1]).toEqual(mockApiResponses.coupons);
      expect(results[2]).toEqual(mockApiResponses.user);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('同時リクエスト中の401エラーハンドリング', async () => {
      ApiService.accessToken = 'expired-token';
      ApiService.refreshToken = 'valid-refresh-token';

      // 全て401を返すように設定
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
        ApiService.getBars(),
        ApiService.getCoupons(),
        ApiService.getCurrentUser()
      ];

      await expect(Promise.all(promises)).rejects.toThrow();

      // リフレッシュは一度だけ実行される（同時リクエストの競合状態を回避）
      expect(JWTService.refreshAccessToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('クリーンアップとリセット', () => {
    it('APIサービスの状態が正しくクリーンアップされる', () => {
      ApiService.accessToken = 'test-token';
      ApiService.refreshToken = 'test-refresh-token';
      ApiService.isRefreshing = true;

      ApiService.cleanup();

      expect(ApiService.accessToken).toBeNull();
      expect(ApiService.refreshToken).toBeNull();
      expect(ApiService.isRefreshing).toBe(false);
    });
  });
});