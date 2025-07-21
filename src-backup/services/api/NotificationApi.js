import apiClient from '../ApiClient';

/**
 * 通知関連のAPI
 */
export class NotificationApi {
  /**
   * 通知一覧を取得
   */
  static async getNotifications(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/notifications?${queryParams}`);

      return {
        success: true,
        data: {
          notifications: response.notifications,
          total: response.total,
          unreadCount: response.unreadCount,
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
   * 通知を既読にする
   */
  static async markAsRead(notificationId) {
    try {
      const response = await apiClient.put(`/notifications/${notificationId}/read`);

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
   * すべての通知を既読にする
   */
  static async markAllAsRead() {
    try {
      const response = await apiClient.put('/notifications/read-all');

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
   * 通知を削除
   */
  static async deleteNotification(notificationId) {
    try {
      const response = await apiClient.delete(`/notifications/${notificationId}`);

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
   * すべての通知を削除
   */
  static async deleteAllNotifications() {
    try {
      const response = await apiClient.delete('/notifications/all');

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
   * 通知設定を取得
   */
  static async getNotificationSettings() {
    try {
      const response = await apiClient.get('/notifications/settings');

      return {
        success: true,
        data: {
          settings: response.settings,
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
   * 通知設定を更新
   */
  static async updateNotificationSettings(settings) {
    try {
      const response = await apiClient.put('/notifications/settings', settings);

      return {
        success: true,
        data: {
          settings: response.settings,
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
   * プッシュ通知トークンを登録
   */
  static async registerPushToken(token, deviceType) {
    try {
      const response = await apiClient.post('/notifications/push-token', {
        token,
        deviceType,
      });

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
   * プッシュ通知トークンを削除
   */
  static async unregisterPushToken(token) {
    try {
      const response = await apiClient.delete('/notifications/push-token', {
        body: { token },
      });

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
   * テスト通知を送信
   */
  static async sendTestNotification() {
    try {
      const response = await apiClient.post('/notifications/test');

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
   * 通知統計を取得
   */
  static async getNotificationStats() {
    try {
      const response = await apiClient.get('/notifications/stats');

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
}

export default NotificationApi;