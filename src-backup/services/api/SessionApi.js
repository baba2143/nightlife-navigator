import apiClient from '../ApiClient';

/**
 * セッション関連のAPI
 */
export class SessionApi {
  /**
   * セッション情報を取得
   */
  static async getCurrentSession() {
    try {
      const response = await apiClient.get('/session/current');

      return {
        success: true,
        data: {
          session: response.session,
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
   * アクティブなセッション一覧を取得
   */
  static async getActiveSessions() {
    try {
      const response = await apiClient.get('/session/active');

      return {
        success: true,
        data: {
          sessions: response.sessions,
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
   * セッションを終了
   */
  static async terminateSession(sessionId) {
    try {
      const response = await apiClient.delete(`/session/${sessionId}`);

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
   * すべてのセッションを終了（現在のセッション以外）
   */
  static async terminateAllSessions() {
    try {
      const response = await apiClient.delete('/session/all');

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
   * アクセス履歴を取得
   */
  static async getAccessHistory(limit = 50, offset = 0) {
    try {
      const response = await apiClient.get(`/session/history?limit=${limit}&offset=${offset}`);

      return {
        success: true,
        data: {
          history: response.history,
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
   * デバイス一覧を取得
   */
  static async getDevices() {
    try {
      const response = await apiClient.get('/session/devices');

      return {
        success: true,
        data: {
          devices: response.devices,
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
   * デバイスを削除
   */
  static async removeDevice(deviceId) {
    try {
      const response = await apiClient.delete(`/session/devices/${deviceId}`);

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
   * デバイス名を更新
   */
  static async updateDeviceName(deviceId, name) {
    try {
      const response = await apiClient.put(`/session/devices/${deviceId}`, {
        name,
      });

      return {
        success: true,
        data: {
          device: response.device,
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
   * セッション統計を取得
   */
  static async getSessionStats() {
    try {
      const response = await apiClient.get('/session/stats');

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

export default SessionApi;