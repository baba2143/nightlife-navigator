import apiClient from '../ApiClient';

/**
 * ユーザー関連のAPI
 */
export class UserApi {
  /**
   * 現在のユーザー情報を取得
   */
  static async getCurrentUser() {
    try {
      const response = await apiClient.get('/user/profile');

      return {
        success: true,
        data: {
          user: response.user,
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
   * ユーザー情報を更新
   */
  static async updateProfile(userData) {
    try {
      const response = await apiClient.put('/user/profile', userData);

      return {
        success: true,
        data: {
          user: response.user,
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
   * プロフィール画像をアップロード
   */
  static async uploadAvatar(imageFile) {
    try {
      const formData = new FormData();
      formData.append('avatar', imageFile);

      const response = await apiClient.post('/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: {
          avatarUrl: response.avatarUrl,
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
   * プロフィール画像を削除
   */
  static async deleteAvatar() {
    try {
      await apiClient.delete('/user/avatar');

      return {
        success: true,
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
   * ユーザー設定を取得
   */
  static async getSettings() {
    try {
      const response = await apiClient.get('/user/settings');

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
   * ユーザー設定を更新
   */
  static async updateSettings(settings) {
    try {
      const response = await apiClient.put('/user/settings', settings);

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
   * アカウントを削除
   */
  static async deleteAccount(password) {
    try {
      const response = await apiClient.delete('/user/account', {
        body: { password },
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
   * アカウントを一時停止
   */
  static async suspendAccount(password) {
    try {
      const response = await apiClient.post('/user/suspend', {
        password,
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
   * データをエクスポート
   */
  static async exportData() {
    try {
      const response = await apiClient.get('/user/export');

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
   * アカウント統計を取得
   */
  static async getAccountStats() {
    try {
      const response = await apiClient.get('/user/stats');

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

export default UserApi;