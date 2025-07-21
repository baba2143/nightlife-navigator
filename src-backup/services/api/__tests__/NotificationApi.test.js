import { NotificationApi } from '../NotificationApi';
import apiClient from '../../ApiClient';

// ApiClientのモック
jest.mock('../../ApiClient', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('NotificationApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('通知一覧取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        notifications: [
          {
            id: 1,
            title: 'New Venue Added',
            message: 'A new venue has been added near you',
            type: 'venue_added',
            read: false,
            timestamp: '2024-01-01T10:30:00.000Z'
          }
        ],
        total: 1,
        unreadCount: 1
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await NotificationApi.getNotifications({ limit: 10, offset: 0 });

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/notifications?limit=10&offset=0');
    });

    it('パラメータなしで通知一覧を取得する', async () => {
      const mockResponse = {
        notifications: [],
        total: 0,
        unreadCount: 0
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await NotificationApi.getNotifications();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/notifications?');
    });

    it('通知一覧取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Unauthorized');
      mockError.status = 401;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await NotificationApi.getNotifications();

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized',
        status: 401
      });
    });
  });

  describe('markAsRead', () => {
    it('通知既読成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'Notification marked as read'
      };
      
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await NotificationApi.markAsRead(1);

      expect(result).toEqual({
        success: true,
        message: 'Notification marked as read'
      });
      expect(apiClient.put).toHaveBeenCalledWith('/notifications/1/read');
    });

    it('通知既読失敗時にエラーを返す', async () => {
      const mockError = new Error('Notification not found');
      mockError.status = 404;
      
      apiClient.put.mockRejectedValueOnce(mockError);

      const result = await NotificationApi.markAsRead(999);

      expect(result).toEqual({
        success: false,
        error: 'Notification not found',
        status: 404
      });
    });
  });

  describe('markAllAsRead', () => {
    it('全通知既読成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'All notifications marked as read'
      };
      
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await NotificationApi.markAllAsRead();

      expect(result).toEqual({
        success: true,
        message: 'All notifications marked as read'
      });
      expect(apiClient.put).toHaveBeenCalledWith('/notifications/read-all');
    });

    it('全通知既読失敗時にエラーを返す', async () => {
      const mockError = new Error('Unauthorized');
      mockError.status = 401;
      
      apiClient.put.mockRejectedValueOnce(mockError);

      const result = await NotificationApi.markAllAsRead();

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized',
        status: 401
      });
    });
  });

  describe('deleteNotification', () => {
    it('通知削除成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'Notification deleted successfully'
      };
      
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await NotificationApi.deleteNotification(1);

      expect(result).toEqual({
        success: true,
        message: 'Notification deleted successfully'
      });
      expect(apiClient.delete).toHaveBeenCalledWith('/notifications/1');
    });

    it('通知削除失敗時にエラーを返す', async () => {
      const mockError = new Error('Notification not found');
      mockError.status = 404;
      
      apiClient.delete.mockRejectedValueOnce(mockError);

      const result = await NotificationApi.deleteNotification(999);

      expect(result).toEqual({
        success: false,
        error: 'Notification not found',
        status: 404
      });
    });
  });

  describe('deleteAllNotifications', () => {
    it('全通知削除成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'All notifications deleted successfully'
      };
      
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await NotificationApi.deleteAllNotifications();

      expect(result).toEqual({
        success: true,
        message: 'All notifications deleted successfully'
      });
      expect(apiClient.delete).toHaveBeenCalledWith('/notifications/all');
    });

    it('全通知削除失敗時にエラーを返す', async () => {
      const mockError = new Error('Unauthorized');
      mockError.status = 401;
      
      apiClient.delete.mockRejectedValueOnce(mockError);

      const result = await NotificationApi.deleteAllNotifications();

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized',
        status: 401
      });
    });
  });

  describe('getNotificationSettings', () => {
    it('通知設定取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        settings: {
          pushEnabled: true,
          emailEnabled: false,
          categories: {
            venues: true,
            favorites: true,
            reviews: false,
            security: true
          }
        }
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await NotificationApi.getNotificationSettings();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/notifications/settings');
    });

    it('通知設定取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Settings not found');
      mockError.status = 404;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await NotificationApi.getNotificationSettings();

      expect(result).toEqual({
        success: false,
        error: 'Settings not found',
        status: 404
      });
    });
  });

  describe('updateNotificationSettings', () => {
    it('通知設定更新成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        settings: {
          pushEnabled: false,
          emailEnabled: true,
          categories: {
            venues: false,
            favorites: true,
            reviews: true,
            security: true
          }
        }
      };
      
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const settings = {
        pushEnabled: false,
        emailEnabled: true,
        categories: {
          venues: false,
          favorites: true,
          reviews: true,
          security: true
        }
      };

      const result = await NotificationApi.updateNotificationSettings(settings);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.put).toHaveBeenCalledWith('/notifications/settings', settings);
    });

    it('通知設定更新失敗時にエラーを返す', async () => {
      const mockError = new Error('Invalid settings');
      mockError.status = 400;
      
      apiClient.put.mockRejectedValueOnce(mockError);

      const settings = {
        pushEnabled: 'invalid'
      };

      const result = await NotificationApi.updateNotificationSettings(settings);

      expect(result).toEqual({
        success: false,
        error: 'Invalid settings',
        status: 400
      });
    });
  });

  describe('registerPushToken', () => {
    it('プッシュ通知トークン登録成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'Push token registered successfully'
      };
      
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await NotificationApi.registerPushToken('token123', 'ios');

      expect(result).toEqual({
        success: true,
        message: 'Push token registered successfully'
      });
      expect(apiClient.post).toHaveBeenCalledWith('/notifications/push-token', {
        token: 'token123',
        deviceType: 'ios'
      });
    });

    it('プッシュ通知トークン登録失敗時にエラーを返す', async () => {
      const mockError = new Error('Invalid token');
      mockError.status = 400;
      
      apiClient.post.mockRejectedValueOnce(mockError);

      const result = await NotificationApi.registerPushToken('invalid_token', 'ios');

      expect(result).toEqual({
        success: false,
        error: 'Invalid token',
        status: 400
      });
    });
  });

  describe('unregisterPushToken', () => {
    it('プッシュ通知トークン削除成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'Push token unregistered successfully'
      };
      
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await NotificationApi.unregisterPushToken('token123');

      expect(result).toEqual({
        success: true,
        message: 'Push token unregistered successfully'
      });
      expect(apiClient.delete).toHaveBeenCalledWith('/notifications/push-token', {
        body: { token: 'token123' }
      });
    });

    it('プッシュ通知トークン削除失敗時にエラーを返す', async () => {
      const mockError = new Error('Token not found');
      mockError.status = 404;
      
      apiClient.delete.mockRejectedValueOnce(mockError);

      const result = await NotificationApi.unregisterPushToken('nonexistent_token');

      expect(result).toEqual({
        success: false,
        error: 'Token not found',
        status: 404
      });
    });
  });

  describe('sendTestNotification', () => {
    it('テスト通知送信成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'Test notification sent successfully'
      };
      
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await NotificationApi.sendTestNotification();

      expect(result).toEqual({
        success: true,
        message: 'Test notification sent successfully'
      });
      expect(apiClient.post).toHaveBeenCalledWith('/notifications/test');
    });

    it('テスト通知送信失敗時にエラーを返す', async () => {
      const mockError = new Error('Push service unavailable');
      mockError.status = 503;
      
      apiClient.post.mockRejectedValueOnce(mockError);

      const result = await NotificationApi.sendTestNotification();

      expect(result).toEqual({
        success: false,
        error: 'Push service unavailable',
        status: 503
      });
    });
  });

  describe('getNotificationStats', () => {
    it('通知統計取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        stats: {
          totalNotifications: 150,
          unreadCount: 5,
          readCount: 145,
          lastNotification: '2024-01-01T10:30:00.000Z',
          categoryCounts: {
            venues: 50,
            favorites: 30,
            reviews: 20,
            security: 50
          }
        }
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await NotificationApi.getNotificationStats();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/notifications/stats');
    });

    it('通知統計取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Stats not available');
      mockError.status = 404;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await NotificationApi.getNotificationStats();

      expect(result).toEqual({
        success: false,
        error: 'Stats not available',
        status: 404
      });
    });
  });
});