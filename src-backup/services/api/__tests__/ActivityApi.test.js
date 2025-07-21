import { ActivityApi } from '../ActivityApi';
import apiClient from '../../ApiClient';

// ApiClientのモック
jest.mock('../../ApiClient', () => ({
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
}));

describe('ActivityApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActivities', () => {
    it('アクティビティ一覧取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        activities: [
          {
            id: 1,
            type: 'visit',
            venueId: 1,
            venueName: 'Test Venue',
            timestamp: '2024-01-01T10:30:00.000Z'
          }
        ],
        total: 1,
        hasMore: false
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await ActivityApi.getActivities({ limit: 10, offset: 0 });

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/activities?limit=10&offset=0');
    });

    it('パラメータなしでアクティビティ一覧を取得する', async () => {
      const mockResponse = {
        activities: [],
        total: 0,
        hasMore: false
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await ActivityApi.getActivities();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/activities?');
    });

    it('アクティビティ一覧取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Unauthorized');
      mockError.status = 401;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await ActivityApi.getActivities();

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized',
        status: 401
      });
    });
  });

  describe('recordActivity', () => {
    it('アクティビティ記録成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        activity: {
          id: 1,
          type: 'visit',
          venueId: 1,
          venueName: 'Test Venue',
          timestamp: '2024-01-01T10:30:00.000Z',
          userId: 1
        }
      };
      
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const activityData = {
        type: 'visit',
        venueId: 1,
        timestamp: '2024-01-01T10:30:00.000Z'
      };

      const result = await ActivityApi.recordActivity(activityData);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.post).toHaveBeenCalledWith('/activities', activityData);
    });

    it('アクティビティ記録失敗時にエラーを返す', async () => {
      const mockError = new Error('Invalid activity data');
      mockError.status = 400;
      
      apiClient.post.mockRejectedValueOnce(mockError);

      const activityData = {
        type: 'invalid_type',
        venueId: 1
      };

      const result = await ActivityApi.recordActivity(activityData);

      expect(result).toEqual({
        success: false,
        error: 'Invalid activity data',
        status: 400
      });
    });
  });

  describe('deleteActivity', () => {
    it('アクティビティ削除成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'Activity deleted successfully'
      };
      
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await ActivityApi.deleteActivity(1);

      expect(result).toEqual({
        success: true,
        message: 'Activity deleted successfully'
      });
      expect(apiClient.delete).toHaveBeenCalledWith('/activities/1');
    });

    it('アクティビティ削除失敗時にエラーを返す', async () => {
      const mockError = new Error('Activity not found');
      mockError.status = 404;
      
      apiClient.delete.mockRejectedValueOnce(mockError);

      const result = await ActivityApi.deleteActivity(999);

      expect(result).toEqual({
        success: false,
        error: 'Activity not found',
        status: 404
      });
    });
  });

  describe('getActivityStats', () => {
    it('アクティビティ統計取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        stats: {
          totalActivities: 100,
          totalVisits: 85,
          totalReviews: 12,
          totalFavorites: 8,
          mostVisitedVenue: {
            id: 1,
            name: 'Popular Venue',
            visitCount: 15
          },
          thisWeekActivities: 7,
          thisMonthActivities: 25
        }
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await ActivityApi.getActivityStats();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/activities/stats');
    });

    it('アクティビティ統計取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Stats not available');
      mockError.status = 404;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await ActivityApi.getActivityStats();

      expect(result).toEqual({
        success: false,
        error: 'Stats not available',
        status: 404
      });
    });
  });

  describe('getActivitiesByDateRange', () => {
    it('期間別アクティビティ取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        activities: [
          {
            id: 1,
            type: 'visit',
            venueId: 1,
            venueName: 'Test Venue',
            timestamp: '2024-01-01T10:30:00.000Z'
          }
        ],
        total: 1
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await ActivityApi.getActivitiesByDateRange(startDate, endDate);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith(
        `/activities/range?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
    });

    it('期間別アクティビティ取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Invalid date range');
      mockError.status = 400;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const startDate = new Date('2024-01-31');
      const endDate = new Date('2024-01-01');

      const result = await ActivityApi.getActivitiesByDateRange(startDate, endDate);

      expect(result).toEqual({
        success: false,
        error: 'Invalid date range',
        status: 400
      });
    });
  });

  describe('exportActivities', () => {
    it('アクティビティエクスポート成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        data: {
          activities: [
            {
              id: 1,
              type: 'visit',
              venueId: 1,
              venueName: 'Test Venue',
              timestamp: '2024-01-01T10:30:00.000Z'
            }
          ],
          exportedAt: '2024-01-15T10:30:00.000Z',
          format: 'json'
        }
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await ActivityApi.exportActivities();

      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      });
      expect(apiClient.get).toHaveBeenCalledWith('/activities/export');
    });

    it('アクティビティエクスポート失敗時にエラーを返す', async () => {
      const mockError = new Error('Export service unavailable');
      mockError.status = 503;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await ActivityApi.exportActivities();

      expect(result).toEqual({
        success: false,
        error: 'Export service unavailable',
        status: 503
      });
    });
  });

  describe('getVisitHistory', () => {
    it('訪問履歴取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        visits: [
          {
            id: 1,
            venueId: 1,
            venueName: 'Test Venue',
            timestamp: '2024-01-01T10:30:00.000Z',
            duration: 7200
          }
        ],
        total: 1
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await ActivityApi.getVisitHistory(10, 0);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/activities/visits?limit=10&offset=0');
    });

    it('デフォルトパラメータで訪問履歴を取得する', async () => {
      const mockResponse = {
        visits: [],
        total: 0
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await ActivityApi.getVisitHistory();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/activities/visits?limit=20&offset=0');
    });

    it('訪問履歴取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Unauthorized');
      mockError.status = 401;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await ActivityApi.getVisitHistory();

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized',
        status: 401
      });
    });
  });

  describe('getReviewHistory', () => {
    it('レビュー履歴取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        reviews: [
          {
            id: 1,
            venueId: 1,
            venueName: 'Test Venue',
            rating: 5,
            comment: 'Great venue!',
            timestamp: '2024-01-01T10:30:00.000Z'
          }
        ],
        total: 1
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await ActivityApi.getReviewHistory(10, 0);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/activities/reviews?limit=10&offset=0');
    });

    it('デフォルトパラメータでレビュー履歴を取得する', async () => {
      const mockResponse = {
        reviews: [],
        total: 0
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await ActivityApi.getReviewHistory();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/activities/reviews?limit=20&offset=0');
    });

    it('レビュー履歴取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Unauthorized');
      mockError.status = 401;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await ActivityApi.getReviewHistory();

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized',
        status: 401
      });
    });
  });

  describe('getFavoriteHistory', () => {
    it('お気に入り履歴取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        favorites: [
          {
            id: 1,
            venueId: 1,
            venueName: 'Test Venue',
            addedAt: '2024-01-01T10:30:00.000Z',
            removedAt: null
          }
        ],
        total: 1
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await ActivityApi.getFavoriteHistory(10, 0);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/activities/favorites?limit=10&offset=0');
    });

    it('デフォルトパラメータでお気に入り履歴を取得する', async () => {
      const mockResponse = {
        favorites: [],
        total: 0
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await ActivityApi.getFavoriteHistory();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/activities/favorites?limit=20&offset=0');
    });

    it('お気に入り履歴取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Unauthorized');
      mockError.status = 401;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await ActivityApi.getFavoriteHistory();

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized',
        status: 401
      });
    });
  });
});