import { VenueApi } from '../VenueApi';
import apiClient from '../../ApiClient';

// ApiClientのモック
jest.mock('../../ApiClient', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('VenueApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVenues', () => {
    it('店舗一覧取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        venues: [
          {
            id: 1,
            name: 'Test Venue',
            category: 'bar',
            location: { lat: 35.6762, lng: 139.6503 },
            rating: 4.5
          }
        ],
        total: 1,
        hasMore: false
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await VenueApi.getVenues({ limit: 10, offset: 0 });

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/venues?limit=10&offset=0');
    });

    it('パラメータなしで店舗一覧を取得する', async () => {
      const mockResponse = {
        venues: [],
        total: 0,
        hasMore: false
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await VenueApi.getVenues();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/venues?');
    });

    it('店舗一覧取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Network error');
      mockError.status = 500;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await VenueApi.getVenues();

      expect(result).toEqual({
        success: false,
        error: 'Network error',
        status: 500
      });
    });
  });

  describe('getVenueDetails', () => {
    it('店舗詳細取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        venue: {
          id: 1,
          name: 'Test Venue',
          category: 'bar',
          location: { lat: 35.6762, lng: 139.6503 },
          rating: 4.5,
          description: 'Great venue',
          photos: ['photo1.jpg', 'photo2.jpg']
        }
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await VenueApi.getVenueDetails(1);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/venues/1');
    });

    it('店舗詳細取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Venue not found');
      mockError.status = 404;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await VenueApi.getVenueDetails(999);

      expect(result).toEqual({
        success: false,
        error: 'Venue not found',
        status: 404
      });
    });
  });

  describe('searchNearbyVenues', () => {
    it('近くの店舗検索成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        venues: [
          {
            id: 1,
            name: 'Nearby Venue',
            category: 'bar',
            location: { lat: 35.6762, lng: 139.6503 },
            distance: 150
          }
        ],
        total: 1
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await VenueApi.searchNearbyVenues(35.6762, 139.6503, 1000, 'bar');

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/venues/nearby?lat=35.6762&lng=139.6503&radius=1000&category=bar');
    });

    it('カテゴリなしで近くの店舗を検索する', async () => {
      const mockResponse = {
        venues: [],
        total: 0
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await VenueApi.searchNearbyVenues(35.6762, 139.6503);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/venues/nearby?lat=35.6762&lng=139.6503&radius=1000');
    });

    it('近くの店舗検索失敗時にエラーを返す', async () => {
      const mockError = new Error('Location service unavailable');
      mockError.status = 503;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await VenueApi.searchNearbyVenues(35.6762, 139.6503);

      expect(result).toEqual({
        success: false,
        error: 'Location service unavailable',
        status: 503
      });
    });
  });

  describe('searchVenues', () => {
    it('店舗検索成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        venues: [
          {
            id: 1,
            name: 'Search Result Venue',
            category: 'bar',
            location: { lat: 35.6762, lng: 139.6503 },
            rating: 4.2
          }
        ],
        total: 1,
        suggestions: ['similar venue', 'another venue']
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await VenueApi.searchVenues('test venue', { category: 'bar' });

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/venues/search?q=test+venue&category=bar');
    });

    it('フィルタなしで店舗を検索する', async () => {
      const mockResponse = {
        venues: [],
        total: 0,
        suggestions: []
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await VenueApi.searchVenues('test venue');

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/venues/search?q=test+venue');
    });

    it('店舗検索失敗時にエラーを返す', async () => {
      const mockError = new Error('Search service unavailable');
      mockError.status = 503;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await VenueApi.searchVenues('test venue');

      expect(result).toEqual({
        success: false,
        error: 'Search service unavailable',
        status: 503
      });
    });
  });

  describe('getFavoriteVenues', () => {
    it('お気に入り店舗一覧取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        venues: [
          {
            id: 1,
            name: 'Favorite Venue',
            category: 'bar',
            location: { lat: 35.6762, lng: 139.6503 },
            rating: 4.8
          }
        ],
        total: 1
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await VenueApi.getFavoriteVenues();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/venues/favorites');
    });

    it('お気に入り店舗一覧取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Unauthorized');
      mockError.status = 401;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await VenueApi.getFavoriteVenues();

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized',
        status: 401
      });
    });
  });

  describe('addToFavorites', () => {
    it('お気に入り追加成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'Added to favorites successfully'
      };
      
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await VenueApi.addToFavorites(1);

      expect(result).toEqual({
        success: true,
        message: 'Added to favorites successfully'
      });
      expect(apiClient.post).toHaveBeenCalledWith('/venues/1/favorite');
    });

    it('お気に入り追加失敗時にエラーを返す', async () => {
      const mockError = new Error('Already in favorites');
      mockError.status = 409;
      
      apiClient.post.mockRejectedValueOnce(mockError);

      const result = await VenueApi.addToFavorites(1);

      expect(result).toEqual({
        success: false,
        error: 'Already in favorites',
        status: 409
      });
    });
  });

  describe('removeFromFavorites', () => {
    it('お気に入り削除成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'Removed from favorites successfully'
      };
      
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await VenueApi.removeFromFavorites(1);

      expect(result).toEqual({
        success: true,
        message: 'Removed from favorites successfully'
      });
      expect(apiClient.delete).toHaveBeenCalledWith('/venues/1/favorite');
    });

    it('お気に入り削除失敗時にエラーを返す', async () => {
      const mockError = new Error('Not in favorites');
      mockError.status = 404;
      
      apiClient.delete.mockRejectedValueOnce(mockError);

      const result = await VenueApi.removeFromFavorites(1);

      expect(result).toEqual({
        success: false,
        error: 'Not in favorites',
        status: 404
      });
    });
  });

  describe('checkIn', () => {
    it('チェックイン成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        checkin: {
          id: 'checkin_123',
          venueId: 1,
          userId: 1,
          timestamp: '2024-01-01T10:30:00.000Z'
        }
      };
      
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await VenueApi.checkIn(1);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.post).toHaveBeenCalledWith('/venues/1/checkin');
    });

    it('チェックイン失敗時にエラーを返す', async () => {
      const mockError = new Error('Already checked in');
      mockError.status = 409;
      
      apiClient.post.mockRejectedValueOnce(mockError);

      const result = await VenueApi.checkIn(1);

      expect(result).toEqual({
        success: false,
        error: 'Already checked in',
        status: 409
      });
    });
  });

  describe('checkOut', () => {
    it('チェックアウト成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        checkout: {
          id: 'checkout_123',
          venueId: 1,
          userId: 1,
          timestamp: '2024-01-01T12:00:00.000Z'
        }
      };
      
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await VenueApi.checkOut(1);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.post).toHaveBeenCalledWith('/venues/1/checkout');
    });

    it('チェックアウト失敗時にエラーを返す', async () => {
      const mockError = new Error('Not checked in');
      mockError.status = 409;
      
      apiClient.post.mockRejectedValueOnce(mockError);

      const result = await VenueApi.checkOut(1);

      expect(result).toEqual({
        success: false,
        error: 'Not checked in',
        status: 409
      });
    });
  });

  describe('getVenueReviews', () => {
    it('店舗レビュー取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        reviews: [
          {
            id: 1,
            userId: 1,
            rating: 5,
            comment: 'Great venue!',
            createdAt: '2024-01-01T10:30:00.000Z'
          }
        ],
        total: 1,
        average: 5.0
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await VenueApi.getVenueReviews(1, 10, 0);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/venues/1/reviews?limit=10&offset=0');
    });

    it('デフォルトパラメータで店舗レビューを取得する', async () => {
      const mockResponse = {
        reviews: [],
        total: 0,
        average: 0
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await VenueApi.getVenueReviews(1);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/venues/1/reviews?limit=20&offset=0');
    });

    it('店舗レビュー取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Venue not found');
      mockError.status = 404;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await VenueApi.getVenueReviews(999);

      expect(result).toEqual({
        success: false,
        error: 'Venue not found',
        status: 404
      });
    });
  });

  describe('postReview', () => {
    it('レビュー投稿成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        review: {
          id: 1,
          userId: 1,
          venueId: 1,
          rating: 5,
          comment: 'Great venue!',
          createdAt: '2024-01-01T10:30:00.000Z'
        }
      };
      
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const reviewData = {
        rating: 5,
        comment: 'Great venue!'
      };

      const result = await VenueApi.postReview(1, reviewData);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.post).toHaveBeenCalledWith('/venues/1/reviews', reviewData);
    });

    it('レビュー投稿失敗時にエラーを返す', async () => {
      const mockError = new Error('Review already exists');
      mockError.status = 409;
      
      apiClient.post.mockRejectedValueOnce(mockError);

      const reviewData = {
        rating: 5,
        comment: 'Great venue!'
      };

      const result = await VenueApi.postReview(1, reviewData);

      expect(result).toEqual({
        success: false,
        error: 'Review already exists',
        status: 409
      });
    });
  });

  describe('getCategories', () => {
    it('カテゴリ一覧取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        categories: [
          { id: 1, name: 'Bar', slug: 'bar' },
          { id: 2, name: 'Club', slug: 'club' },
          { id: 3, name: 'Restaurant', slug: 'restaurant' }
        ]
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await VenueApi.getCategories();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/venues/categories');
    });

    it('カテゴリ一覧取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Service unavailable');
      mockError.status = 503;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await VenueApi.getCategories();

      expect(result).toEqual({
        success: false,
        error: 'Service unavailable',
        status: 503
      });
    });
  });

  describe('getPopularVenues', () => {
    it('人気店舗取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        venues: [
          {
            id: 1,
            name: 'Popular Venue',
            category: 'bar',
            rating: 4.8,
            visitCount: 1000
          }
        ]
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await VenueApi.getPopularVenues(5);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/venues/popular?limit=5');
    });

    it('デフォルトパラメータで人気店舗を取得する', async () => {
      const mockResponse = {
        venues: []
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await VenueApi.getPopularVenues();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/venues/popular?limit=10');
    });

    it('人気店舗取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Service unavailable');
      mockError.status = 503;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await VenueApi.getPopularVenues();

      expect(result).toEqual({
        success: false,
        error: 'Service unavailable',
        status: 503
      });
    });
  });

  describe('getNewVenues', () => {
    it('新着店舗取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        venues: [
          {
            id: 1,
            name: 'New Venue',
            category: 'club',
            createdAt: '2024-01-01T00:00:00.000Z'
          }
        ]
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await VenueApi.getNewVenues(5);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/venues/new?limit=5');
    });

    it('デフォルトパラメータで新着店舗を取得する', async () => {
      const mockResponse = {
        venues: []
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await VenueApi.getNewVenues();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/venues/new?limit=10');
    });

    it('新着店舗取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Service unavailable');
      mockError.status = 503;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await VenueApi.getNewVenues();

      expect(result).toEqual({
        success: false,
        error: 'Service unavailable',
        status: 503
      });
    });
  });
});