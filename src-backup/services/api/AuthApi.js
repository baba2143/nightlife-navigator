import apiClient from '../ApiClient';

/**
 * 認証関連のAPI
 */
export class AuthApi {
  /**
   * ユーザー登録
   */
  static async register(userData) {
    try {
      const response = await apiClient.post('/auth/register', {
        email: userData.email,
        username: userData.username,
        displayName: userData.displayName,
        password: userData.password,
      });

      return {
        success: true,
        data: {
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          sessionInfo: response.sessionInfo,
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
   * ログイン
   */
  static async login(credentials) {
    try {
      const response = await apiClient.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      return {
        success: true,
        data: {
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          sessionInfo: response.sessionInfo,
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
   * ログアウト
   */
  static async logout() {
    try {
      await apiClient.post('/auth/logout');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * トークンリフレッシュ
   */
  static async refreshToken(refreshToken) {
    try {
      const response = await apiClient.post('/auth/refresh', {
        refreshToken,
      });

      return {
        success: true,
        data: {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          sessionInfo: response.sessionInfo,
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
   * メール確認
   */
  static async verifyEmail(token) {
    try {
      const response = await apiClient.post('/auth/verify-email', {
        token,
      });

      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * メール確認再送信
   */
  static async resendVerificationEmail(email) {
    try {
      const response = await apiClient.post('/auth/resend-verification', {
        email,
      });

      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * パスワードリセット要求
   */
  static async requestPasswordReset(email) {
    try {
      const response = await apiClient.post('/auth/forgot-password', {
        email,
      });

      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * パスワードリセット実行
   */
  static async resetPassword(token, newPassword) {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        token,
        newPassword,
      });

      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * パスワード変更
   */
  static async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * ユーザー名の利用可能性チェック
   */
  static async checkUsernameAvailability(username) {
    try {
      const response = await apiClient.get(`/auth/check-username?username=${encodeURIComponent(username)}`);

      return {
        success: true,
        available: response.available,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * メールアドレスの利用可能性チェック
   */
  static async checkEmailAvailability(email) {
    try {
      const response = await apiClient.get(`/auth/check-email?email=${encodeURIComponent(email)}`);

      return {
        success: true,
        available: response.available,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 二段階認証の設定
   */
  static async setupTwoFactor() {
    try {
      const response = await apiClient.post('/auth/2fa/setup');

      return {
        success: true,
        data: {
          secret: response.secret,
          qrCode: response.qrCode,
          backupCodes: response.backupCodes,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 二段階認証の有効化
   */
  static async enableTwoFactor(token) {
    try {
      const response = await apiClient.post('/auth/2fa/enable', {
        token,
      });

      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 二段階認証の無効化
   */
  static async disableTwoFactor(token) {
    try {
      const response = await apiClient.post('/auth/2fa/disable', {
        token,
      });

      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 二段階認証でのログイン
   */
  static async loginWithTwoFactor(email, password, token) {
    try {
      const response = await apiClient.post('/auth/login-2fa', {
        email,
        password,
        token,
      });

      return {
        success: true,
        data: {
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          sessionInfo: response.sessionInfo,
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

export default AuthApi;