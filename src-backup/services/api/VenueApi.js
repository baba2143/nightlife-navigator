import apiClient from '../ApiClient';

/**
 * 店舗関連のAPI
 */
export class VenueApi {
  /**
   * 店舗一覧を取得
   */
  static async getVenues(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/venues?${queryParams}`);

      return {
        success: true,
        data: {
          venues: response.venues,
          total: response.total,
          hasMore: response.hasMore,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.status,
      };
    }
  }

  /**
   * 店舗詳細を取得
   */
  static async getVenueDetails(venueId) {
    try {
      const response = await apiClient.get(`/venues/${venueId}`);

      return {
        success: true,
        data: {
          venue: response.venue,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.status,
      };
    }
  }

  /**
   * 近くの店舗を検索
   */
  static async searchNearbyVenues(latitude, longitude, radius = 1000, category = null) {
    try {
      const params = {
        lat: latitude,
        lng: longitude,
        radius,
        ...(category && { category }),
      };
      
      const queryParams = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/venues/nearby?${queryParams}`);

      return {
        success: true,
        data: {
          venues: response.venues,
          total: response.total,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.status,
      };
    }
  }

  /**
   * 店舗を検索
   */
  static async searchVenues(query, filters = {}) {
    try {
      const params = {
        q: query,
        ...filters,
      };
      
      const queryParams = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/venues/search?${queryParams}`);

      return {
        success: true,
        data: {
          venues: response.venues,
          total: response.total,
          suggestions: response.suggestions,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.status,
      };
    }
  }

  /**
   * お気に入り店舗一覧を取得
   */
  static async getFavoriteVenues() {
    try {
      const response = await apiClient.get('/venues/favorites');

      return {
        success: true,
        data: {
          venues: response.venues,
          total: response.total,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.status,
      };
    }
  }

  /**
   * お気に入りに追加
   */
  static async addToFavorites(venueId) {
    try {
      const response = await apiClient.post(`/venues/${venueId}/favorite`);

      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.status,
      };
    }
  }

  /**
   * お気に入りから削除
   */
  static async removeFromFavorites(venueId) {
    try {
      const response = await apiClient.delete(`/venues/${venueId}/favorite`);

      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.status,
      };
    }
  }

  /**
   * 店舗へのチェックイン
   */
  static async checkIn(venueId) {
    try {
      const response = await apiClient.post(`/venues/${venueId}/checkin`);

      return {
        success: true,
        data: {
          checkin: response.checkin,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.status,
      };
    }
  }

  /**
   * 店舗からのチェックアウト
   */
  static async checkOut(venueId) {
    try {
      const response = await apiClient.post(`/venues/${venueId}/checkout`);

      return {
        success: true,
        data: {
          checkout: response.checkout,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.status,
      };
    }
  }

  /**
   * 店舗のレビューを取得
   */
  static async getVenueReviews(venueId, limit = 20, offset = 0) {
    try {
      const response = await apiClient.get(`/venues/${venueId}/reviews?limit=${limit}&offset=${offset}`);

      return {
        success: true,
        data: {
          reviews: response.reviews,
          total: response.total,
          average: response.average,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.status,
      };
    }
  }

  /**
   * 店舗にレビューを投稿
   */
  static async postReview(venueId, reviewData) {
    try {
      const response = await apiClient.post(`/venues/${venueId}/reviews`, reviewData);

      return {
        success: true,
        data: {
          review: response.review,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.status,
      };
    }
  }

  /**
   * レビューを更新
   */
  static async updateReview(venueId, reviewId, reviewData) {
    try {
      const response = await apiClient.put(`/venues/${venueId}/reviews/${reviewId}`, reviewData);

      return {
        success: true,
        data: {
          review: response.review,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.status,
      };
    }
  }

  /**
   * レビューを削除
   */
  static async deleteReview(venueId, reviewId) {
    try {
      const response = await apiClient.delete(`/venues/${venueId}/reviews/${reviewId}`);

      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.status,
      };
    }
  }

  /**
   * 店舗カテゴリ一覧を取得
   */
  static async getCategories() {
    try {
      const response = await apiClient.get('/venues/categories');

      return {
        success: true,
        data: {
          categories: response.categories,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.status,
      };
    }
  }

  /**
   * 人気の店舗を取得
   */
  static async getPopularVenues(limit = 10) {
    try {
      const response = await apiClient.get(`/venues/popular?limit=${limit}`);

      return {
        success: true,
        data: {
          venues: response.venues,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.status,
      };
    }
  }

  /**
   * 新着店舗を取得
   */
  static async getNewVenues(limit = 10) {
    try {
      const response = await apiClient.get(`/venues/new?limit=${limit}`);

      return {
        success: true,
        data: {
          venues: response.venues,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.status,
      };
    }
  }
}

export default VenueApi;