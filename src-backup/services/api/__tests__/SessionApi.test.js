import { SessionApi } from '../SessionApi';
import apiClient from '../../ApiClient';

// ApiClientのモック
jest.mock('../../ApiClient', () => ({
  get: jest.fn(),
  delete: jest.fn(),
  put: jest.fn(),
}));

describe('SessionApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentSession', () => {
    it('現在のセッション取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        session: {
          id: 'session_123',
          userId: 1,
          deviceInfo: 'iPhone',
          createdAt: '2024-01-01T00:00:00.000Z',
          lastActivity: '2024-01-01T10:30:00.000Z'
        }
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await SessionApi.getCurrentSession();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/session/current');
    });

    it('現在のセッション取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Session not found');
      mockError.status = 404;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await SessionApi.getCurrentSession();

      expect(result).toEqual({
        success: false,
        error: 'Session not found',
        status: 404
      });
    });
  });

  describe('getActiveSessions', () => {
    it('アクティブセッション一覧取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        sessions: [
          {
            id: 'session_123',
            deviceInfo: 'iPhone',
            createdAt: '2024-01-01T00:00:00.000Z',
            lastActivity: '2024-01-01T10:30:00.000Z'
          },
          {
            id: 'session_456',
            deviceInfo: 'Android',
            createdAt: '2024-01-02T00:00:00.000Z',
            lastActivity: '2024-01-02T11:15:00.000Z'
          }
        ]
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await SessionApi.getActiveSessions();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/session/active');
    });

    it('アクティブセッション一覧取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Unauthorized');
      mockError.status = 401;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await SessionApi.getActiveSessions();

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized',
        status: 401
      });
    });
  });

  describe('terminateSession', () => {
    it('セッション終了成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'Session terminated successfully'
      };
      
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await SessionApi.terminateSession('session_123');

      expect(result).toEqual({
        success: true,
        message: 'Session terminated successfully'
      });
      expect(apiClient.delete).toHaveBeenCalledWith('/session/session_123');
    });

    it('セッション終了失敗時にエラーを返す', async () => {
      const mockError = new Error('Session not found');
      mockError.status = 404;
      
      apiClient.delete.mockRejectedValueOnce(mockError);

      const result = await SessionApi.terminateSession('invalid_session');

      expect(result).toEqual({
        success: false,
        error: 'Session not found',
        status: 404
      });
    });
  });

  describe('terminateAllSessions', () => {
    it('全セッション終了成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'All sessions terminated successfully'
      };
      
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await SessionApi.terminateAllSessions();

      expect(result).toEqual({
        success: true,
        message: 'All sessions terminated successfully'
      });
      expect(apiClient.delete).toHaveBeenCalledWith('/session/all');
    });

    it('全セッション終了失敗時にエラーを返す', async () => {
      const mockError = new Error('Unauthorized');
      mockError.status = 401;
      
      apiClient.delete.mockRejectedValueOnce(mockError);

      const result = await SessionApi.terminateAllSessions();

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized',
        status: 401
      });
    });
  });

  describe('getAccessHistory', () => {
    it('アクセス履歴取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        history: [
          {
            id: 'access_1',
            timestamp: '2024-01-01T10:30:00.000Z',
            action: 'login',
            deviceInfo: 'iPhone',
            ipAddress: '192.168.1.1'
          },
          {
            id: 'access_2',
            timestamp: '2024-01-01T11:00:00.000Z',
            action: 'logout',
            deviceInfo: 'iPhone',
            ipAddress: '192.168.1.1'
          }
        ],
        total: 2
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await SessionApi.getAccessHistory(10, 0);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/session/history?limit=10&offset=0');
    });

    it('デフォルトパラメータでアクセス履歴を取得する', async () => {
      const mockResponse = {
        history: [],
        total: 0
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await SessionApi.getAccessHistory();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/session/history?limit=50&offset=0');
    });

    it('アクセス履歴取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Access denied');
      mockError.status = 403;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await SessionApi.getAccessHistory();

      expect(result).toEqual({
        success: false,
        error: 'Access denied',
        status: 403
      });
    });
  });

  describe('getDevices', () => {
    it('デバイス一覧取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        devices: [
          {
            id: 'device_1',
            name: 'iPhone 14',
            type: 'mobile',
            lastActivity: '2024-01-01T10:30:00.000Z',
            current: true
          },
          {
            id: 'device_2',
            name: 'MacBook Pro',
            type: 'desktop',
            lastActivity: '2024-01-01T09:15:00.000Z',
            current: false
          }
        ]
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await SessionApi.getDevices();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/session/devices');
    });

    it('デバイス一覧取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Unauthorized');
      mockError.status = 401;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await SessionApi.getDevices();

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized',
        status: 401
      });
    });
  });

  describe('removeDevice', () => {
    it('デバイス削除成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'Device removed successfully'
      };
      
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await SessionApi.removeDevice('device_123');

      expect(result).toEqual({
        success: true,
        message: 'Device removed successfully'
      });
      expect(apiClient.delete).toHaveBeenCalledWith('/session/devices/device_123');
    });

    it('デバイス削除失敗時にエラーを返す', async () => {
      const mockError = new Error('Device not found');
      mockError.status = 404;
      
      apiClient.delete.mockRejectedValueOnce(mockError);

      const result = await SessionApi.removeDevice('invalid_device');

      expect(result).toEqual({
        success: false,
        error: 'Device not found',
        status: 404
      });
    });
  });

  describe('updateDeviceName', () => {
    it('デバイス名更新成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        device: {
          id: 'device_123',
          name: 'My iPhone',
          type: 'mobile',
          lastActivity: '2024-01-01T10:30:00.000Z'
        }
      };
      
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await SessionApi.updateDeviceName('device_123', 'My iPhone');

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.put).toHaveBeenCalledWith('/session/devices/device_123', {
        name: 'My iPhone'
      });
    });

    it('デバイス名更新失敗時にエラーを返す', async () => {
      const mockError = new Error('Device not found');
      mockError.status = 404;
      
      apiClient.put.mockRejectedValueOnce(mockError);

      const result = await SessionApi.updateDeviceName('invalid_device', 'My iPhone');

      expect(result).toEqual({
        success: false,
        error: 'Device not found',
        status: 404
      });
    });
  });

  describe('getSessionStats', () => {
    it('セッション統計取得成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        stats: {
          totalSessions: 45,
          activeSessions: 2,
          averageSessionDuration: 3600,
          lastLogin: '2024-01-01T10:30:00.000Z'
        }
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await SessionApi.getSessionStats();

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/session/stats');
    });

    it('セッション統計取得失敗時にエラーを返す', async () => {
      const mockError = new Error('Stats not available');
      mockError.status = 404;
      
      apiClient.get.mockRejectedValueOnce(mockError);

      const result = await SessionApi.getSessionStats();

      expect(result).toEqual({
        success: false,
        error: 'Stats not available',
        status: 404
      });
    });
  });
});