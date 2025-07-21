import { UserApi } from '../UserApi';
import apiClient from '../../ApiClient';

// ApiClientのモック
jest.mock('../../ApiClient', () => ({
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  post: jest.fn(),
}));

describe('UserApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('プロフィール取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          avatar: 'avatar.jpg',
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await UserApi.getProfile();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/user/profile');
    });

    it('プロフィール取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Profile not found');
      mockError.status = 404;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await UserApi.getProfile();

      expect(result).toEqual({
        success: false,
        error: 'Profile not found',
        status: 404
      });
    });
  });

  describe('updateProfile', () => {
    it('プロフィール更新成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Updated Name',
          avatar: 'avatar.jpg'
        }
      };
      
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const userData = {
        name: 'Updated Name',
        bio: 'Updated bio'
      };

      const result = await UserApi.updateProfile(userData);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.put).toHaveBeenCalledWith('/user/profile', userData);
    });

    it('プロフィール更新失敗時にエラーを返す', async () => {
      const mockError = new Error('Validation error');
      mockError.status = 400;
      
      apiClient.put.mockRejectedValueOnce(mockError);

      const userData = {
        name: '',
        bio: 'Updated bio'
      };

      const result = await UserApi.updateProfile(userData);

      expect(result).toEqual({
        success: false,
        error: 'Validation error',
        status: 400
      });
    });
  });

  describe('uploadAvatar', () => {
    it('アバターアップロード成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          avatar: 'new_avatar.jpg'
        }
      };
      
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const avatarData = {
        uri: 'file://avatar.jpg',
        type: 'image/jpeg',
        name: 'avatar.jpg'
      };

      const result = await UserApi.uploadAvatar(avatarData);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.post).toHaveBeenCalledWith('/user/avatar', avatarData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    });

    it('アバターアップロード失敗時にエラーを返す', async () => {
      const mockError = new Error('File too large');
      mockError.status = 413;
      
      apiClient.post.mockRejectedValueOnce(mockError);

      const avatarData = {
        uri: 'file://large_avatar.jpg',
        type: 'image/jpeg',
        name: 'large_avatar.jpg'
      };

      const result = await UserApi.uploadAvatar(avatarData);

      expect(result).toEqual({
        success: false,
        error: 'File too large',
        status: 413
      });
    });
  });

  describe('deleteAvatar', () => {
    it('アバター削除成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'Avatar deleted successfully'
      };
      
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await UserApi.deleteAvatar();

      expect(result).toEqual({
        success: true,
        message: 'Avatar deleted successfully'
      });
      expect(apiClient.delete).toHaveBeenCalledWith('/user/avatar');
    });

    it('アバター削除失敗時にエラーを返す', async () => {
      const mockError = new Error('No avatar to delete');
      mockError.status = 404;
      
      apiClient.delete.mockRejectedValueOnce(mockError);

      const result = await UserApi.deleteAvatar();

      expect(result).toEqual({
        success: false,
        error: 'No avatar to delete',
        status: 404
      });
    });
  });

  describe('getSettings', () => {
    it('設定取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        settings: {
          notifications: true,
          privacy: {
            shareLocation: false,
            publicProfile: true
          },
          theme: 'dark'
        }
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await UserApi.getSettings();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/user/settings');
    });
  });

  describe('updateSettings', () => {
    it('設定更新成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        settings: {
          notifications: false,
          privacy: {
            shareLocation: true,
            publicProfile: false
          },
          theme: 'light'
        }
      };
      
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const settings = {
        notifications: false,
        privacy: {
          shareLocation: true,
          publicProfile: false
        },
        theme: 'light'
      };

      const result = await UserApi.updateSettings(settings);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.put).toHaveBeenCalledWith('/user/settings', settings);
    });
  });

  describe('deleteAccount', () => {
    it('アカウント削除成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'Account deleted successfully'
      };
      
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await UserApi.deleteAccount('password123');

      expect(result).toEqual({
        success: true,
        message: 'Account deleted successfully'
      });
      expect(apiClient.delete).toHaveBeenCalledWith('/user/account', {
        body: { password: 'password123' }
      });
    });

    it('アカウント削除失敗時にエラーを返す', async () => {
      const mockError = new Error('Invalid password');
      mockError.status = 400;
      
      apiClient.delete.mockRejectedValueOnce(mockError);

      const result = await UserApi.deleteAccount('wrongpassword');

      expect(result).toEqual({
        success: false,
        error: 'Invalid password',
        status: 400
      });
    });
  });

  describe('suspendAccount', () => {
    it('アカウント停止成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'Account suspended successfully'
      };
      
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await UserApi.suspendAccount('password123');

      expect(result).toEqual({
        success: true,
        message: 'Account suspended successfully'
      });
      expect(apiClient.put).toHaveBeenCalledWith('/user/suspend', {
        password: 'password123'
      });
    });

    it('アカウント停止失敗時にエラーを返す', async () => {
      const mockError = new Error('Invalid password');
      mockError.status = 400;
      
      apiClient.put.mockRejectedValueOnce(mockError);

      const result = await UserApi.suspendAccount('wrongpassword');

      expect(result).toEqual({
        success: false,
        error: 'Invalid password',
        status: 400
      });
    });
  });

  describe('exportData', () => {
    it('データエクスポート成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        data: {
          user: { id: 1, email: 'test@example.com' },
          activities: [],
          favorites: []
        }
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await UserApi.exportData();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/user/export');
    });

    it('データエクスポート失敗時にエラーを返す', async () => {
      const mockError = new Error('Export failed');
      mockError.status = 500;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await UserApi.exportData();

      expect(result).toEqual({
        success: false,
        error: 'Export failed',
        status: 500
      });
    });
  });

  describe('getUserStats', () => {
    it('ユーザー統計取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        stats: {
          totalVisits: 45,
          totalReviews: 12,
          totalFavorites: 8,
          joinDate: '2024-01-01T00:00:00.000Z'
        }
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await UserApi.getUserStats();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/user/stats');
    });

    it('ユーザー統計取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Stats not available');
      mockError.status = 404;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await UserApi.getUserStats();

      expect(result).toEqual({
        success: false,
        error: 'Stats not available',
        status: 404
      });
    });
  });
});