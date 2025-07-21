import apiClient from '../ApiClient';

/**
 * アクティビティ関連のAPI
 */
export class ActivityApi {
  /**
   * アクティビティ一覧を取得
   */
  static async getActivities(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/activities?${queryParams}`);

      return {
        success: true,
        data: {
          activities: response.activities,
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
   * アクティビティを記録
   */
  static async recordActivity(activityData) {
    try {
      const response = await apiClient.post('/activities', activityData);

      return {
        success: true,
        data: {
          activity: response.activity,
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
   * アクティビティを削除
   */
  static async deleteActivity(activityId) {
    try {
      const response = await apiClient.delete(`/activities/${activityId}`);

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
   * アクティビティ統計を取得
   */
  static async getActivityStats() {
    try {
      const response = await apiClient.get('/activities/stats');

      return {
        success: true,
        data: {
          stats: response.stats,
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
   * 期間別アクティビティを取得
   */
  static async getActivitiesByDateRange(startDate, endDate) {
    try {
      const params = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      
      const queryParams = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/activities/range?${queryParams}`);

      return {
        success: true,
        data: {
          activities: response.activities,
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
   * アクティビティをエクスポート
   */
  static async exportActivities() {
    try {
      const response = await apiClient.get('/activities/export');

      return {
        success: true,
        data: response.data,
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
   * 訪問履歴を取得
   */
  static async getVisitHistory(limit = 20, offset = 0) {
    try {
      const response = await apiClient.get(`/activities/visits?limit=${limit}&offset=${offset}`);

      return {
        success: true,
        data: {
          visits: response.visits,
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
   * レビュー履歴を取得
   */
  static async getReviewHistory(limit = 20, offset = 0) {
    try {
      const response = await apiClient.get(`/activities/reviews?limit=${limit}&offset=${offset}`);

      return {
        success: true,
        data: {
          reviews: response.reviews,
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
   * お気に入り履歴を取得
   */
  static async getFavoriteHistory(limit = 20, offset = 0) {
    try {
      const response = await apiClient.get(`/activities/favorites?limit=${limit}&offset=${offset}`);

      return {
        success: true,
        data: {
          favorites: response.favorites,
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
}

export default ActivityApi;