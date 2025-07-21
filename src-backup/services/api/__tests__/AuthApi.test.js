import { AuthApi } from '../AuthApi';
import apiClient from '../../ApiClient';

// ApiClientのモック
jest.mock('../../ApiClient', () => ({
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  get: jest.fn(),
}));

describe('AuthApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('ログイン成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        user: { id: 1, email: 'test@example.com', name: 'Test User' },
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        sessionInfo: { id: 'session_123' }
      };
      
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await AuthApi.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('ログイン失敗時にエラーを返す', async () => {
      const mockError = new Error('Invalid credentials');
      mockError.status = 401;
      
      apiClient.post.mockRejectedValueOnce(mockError);

      const result = await AuthApi.login({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

      expect(result).toEqual({
        success: false,
        error: 'Invalid credentials',
        status: 401
      });
    });
  });

  describe('register', () => {
    it('ユーザー登録成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        user: { id: 1, email: 'test@example.com', name: 'Test User' },
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        sessionInfo: { id: 'session_123' }
      };
      
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await AuthApi.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    });

    it('ユーザー登録失敗時にエラーを返す', async () => {
      const mockError = new Error('Email already exists');
      mockError.status = 409;
      
      apiClient.post.mockRejectedValueOnce(mockError);

      const result = await AuthApi.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      expect(result).toEqual({
        success: false,
        error: 'Email already exists',
        status: 409
      });
    });
  });

  describe('logout', () => {
    it('ログアウト成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'Logout successful'
      };
      
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await AuthApi.logout();

      expect(result).toEqual({
        success: true,
        message: 'Logout successful'
      });
      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
    });
  });

  describe('refreshToken', () => {
    it('トークン更新成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        sessionInfo: { id: 'session_456' }
      };
      
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await AuthApi.refreshToken('old_refresh_token');

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'old_refresh_token'
      });
    });

    it('トークン更新失敗時にエラーを返す', async () => {
      const mockError = new Error('Invalid refresh token');
      mockError.status = 401;
      
      apiClient.post.mockRejectedValueOnce(mockError);

      const result = await AuthApi.refreshToken('invalid_token');

      expect(result).toEqual({
        success: false,
        error: 'Invalid refresh token',
        status: 401
      });
    });
  });

  describe('forgotPassword', () => {
    it('パスワード再設定メール送信成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'Password reset email sent'
      };
      
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await AuthApi.forgotPassword('test@example.com');

      expect(result).toEqual({
        success: true,
        message: 'Password reset email sent'
      });
      expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'test@example.com'
      });
    });

    it('パスワード再設定メール送信失敗時にエラーを返す', async () => {
      const mockError = new Error('Email not found');
      mockError.status = 404;
      
      apiClient.post.mockRejectedValueOnce(mockError);

      const result = await AuthApi.forgotPassword('nonexistent@example.com');

      expect(result).toEqual({
        success: false,
        error: 'Email not found',
        status: 404
      });
    });
  });

  describe('resetPassword', () => {
    it('パスワード再設定成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'Password reset successful'
      };
      
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await AuthApi.resetPassword('reset_token', 'newpassword123');

      expect(result).toEqual({
        success: true,
        message: 'Password reset successful'
      });
      expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'reset_token',
        newPassword: 'newpassword123'
      });
    });

    it('パスワード再設定失敗時にエラーを返す', async () => {
      const mockError = new Error('Invalid reset token');
      mockError.status = 400;
      
      apiClient.post.mockRejectedValueOnce(mockError);

      const result = await AuthApi.resetPassword('invalid_token', 'newpassword123');

      expect(result).toEqual({
        success: false,
        error: 'Invalid reset token',
        status: 400
      });
    });
  });

  describe('verifyEmail', () => {
    it('メール認証成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'Email verified successfully'
      };
      
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await AuthApi.verifyEmail('verify_token');

      expect(result).toEqual({
        success: true,
        message: 'Email verified successfully'
      });
      expect(apiClient.post).toHaveBeenCalledWith('/auth/verify-email', {
        token: 'verify_token'
      });
    });

    it('メール認証失敗時にエラーを返す', async () => {
      const mockError = new Error('Invalid verification token');
      mockError.status = 400;
      
      apiClient.post.mockRejectedValueOnce(mockError);

      const result = await AuthApi.verifyEmail('invalid_token');

      expect(result).toEqual({
        success: false,
        error: 'Invalid verification token',
        status: 400
      });
    });
  });

  describe('checkUsername', () => {
    it('ユーザー名が利用可能な場合', async () => {
      const mockResponse = {
        available: true
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await AuthApi.checkUsername('available_username');

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/auth/check-username?username=available_username');
    });

    it('ユーザー名が利用不可の場合', async () => {
      const mockResponse = {
        available: false
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await AuthApi.checkUsername('taken_username');

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
    });
  });

  describe('checkEmail', () => {
    it('メールアドレスが利用可能な場合', async () => {
      const mockResponse = {
        available: true
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await AuthApi.checkEmail('available@example.com');

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
      expect(apiClient.get).toHaveBeenCalledWith('/auth/check-email?email=available%40example.com');
    });

    it('メールアドレスが利用不可の場合', async () => {
      const mockResponse = {
        available: false
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await AuthApi.checkEmail('taken@example.com');

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });
    });
  });

  describe('changePassword', () => {
    it('パスワード変更成功時に正しい形式のデータを返す', async () => {
      const mockResponse = {
        message: 'Password changed successfully'
      };
      
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await AuthApi.changePassword('oldpassword', 'newpassword123');

      expect(result).toEqual({
        success: true,
        message: 'Password changed successfully'
      });
      expect(apiClient.put).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      });
    });

    it('パスワード変更失敗時にエラーを返す', async () => {
      const mockError = new Error('Current password is incorrect');
      mockError.status = 400;
      
      apiClient.put.mockRejectedValueOnce(mockError);

      const result = await AuthApi.changePassword('wrongpassword', 'newpassword123');

      expect(result).toEqual({
        success: false,
        error: 'Current password is incorrect',
        status: 400
      });
    });
  });
});