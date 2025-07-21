import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

class AuthService {
  constructor() {
    this.initialized = false;
    this.currentUser = null;
    this.listeners = [];
    this.storageKeys = {
      user: '@nightlife_navigator:current_user',
      token: '@nightlife_navigator:auth_token',
      settings: '@nightlife_navigator:user_settings',
    };
  }

  static getInstance() {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await this.loadCurrentUser();
      this.initialized = true;
      console.log('AuthService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AuthService:', error);
      throw error;
    }
  }

  async loadCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem(this.storageKeys.user);
      const token = await AsyncStorage.getItem(this.storageKeys.token);
      
      if (userData && token) {
        this.currentUser = {
          ...JSON.parse(userData),
          token,
          lastLoginAt: new Date(JSON.parse(userData).lastLoginAt),
          createdAt: new Date(JSON.parse(userData).createdAt),
        };
        this.emit('authStateChanged', { user: this.currentUser, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
      this.currentUser = null;
    }
  }

  async saveCurrentUser() {
    try {
      if (this.currentUser) {
        const userData = {
          ...this.currentUser,
          lastLoginAt: this.currentUser.lastLoginAt.toISOString(),
          createdAt: this.currentUser.createdAt.toISOString(),
        };
        delete userData.token;

        await AsyncStorage.setItem(this.storageKeys.user, JSON.stringify(userData));
        await AsyncStorage.setItem(this.storageKeys.token, this.currentUser.token);
      }
    } catch (error) {
      console.error('Failed to save current user:', error);
    }
  }

  // メール形式検証
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // パスワード検証
  validatePassword(password) {
    if (password.length < 8) {
      return { valid: false, message: 'パスワードは8文字以上である必要があります' };
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { 
        valid: false, 
        message: 'パスワードには大文字、小文字、数字を含める必要があります' 
      };
    }
    return { valid: true };
  }

  // 新規登録
  async register(userData) {
    try {
      const { email, password, displayName, phoneNumber } = userData;

      // バリデーション
      if (!email || !password || !displayName) {
        throw new Error('メールアドレス、パスワード、表示名は必須です');
      }

      if (!this.validateEmail(email)) {
        throw new Error('有効なメールアドレスを入力してください');
      }

      const passwordValidation = this.validatePassword(password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message);
      }

      // 既存ユーザーチェック（モック）
      const existingUsers = await this.getStoredUsers();
      if (existingUsers.some(user => user.email === email)) {
        throw new Error('このメールアドレスは既に登録されています');
      }

      // 新規ユーザー作成
      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: email.toLowerCase(),
        displayName,
        phoneNumber: phoneNumber || null,
        profilePicture: null,
        isEmailVerified: false,
        preferences: {
          notifications: true,
          locationSharing: false,
          language: 'ja',
          theme: 'light',
        },
        statistics: {
          favoriteCount: 0,
          reviewCount: 0,
          visitCount: 0,
        },
        createdAt: new Date(),
        lastLoginAt: new Date(),
        token: `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`,
      };

      // ユーザー保存
      await this.saveUserToStorage(newUser);
      
      this.currentUser = newUser;
      await this.saveCurrentUser();

      this.emit('authStateChanged', { user: this.currentUser, isAuthenticated: true });
      this.emit('userRegistered', this.currentUser);

      return { success: true, user: this.currentUser };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: error.message };
    }
  }

  // ログイン
  async login(email, password) {
    try {
      if (!email || !password) {
        throw new Error('メールアドレスとパスワードを入力してください');
      }

      if (!this.validateEmail(email)) {
        throw new Error('有効なメールアドレスを入力してください');
      }

      // ユーザー検索（モック）
      const existingUsers = await this.getStoredUsers();
      const user = existingUsers.find(u => u.email === email.toLowerCase());

      if (!user) {
        throw new Error('メールアドレスまたはパスワードが正しくありません');
      }

      // パスワード検証（本番環境では暗号化された形で比較）
      if (user.password !== password) {
        throw new Error('メールアドレスまたはパスワードが正しくありません');
      }

      // ログイン成功
      user.lastLoginAt = new Date();
      user.token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;

      await this.saveUserToStorage(user);
      this.currentUser = user;
      await this.saveCurrentUser();

      this.emit('authStateChanged', { user: this.currentUser, isAuthenticated: true });
      this.emit('userLoggedIn', this.currentUser);

      return { success: true, user: this.currentUser };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.message };
    }
  }

  // ログアウト
  async logout() {
    try {
      const previousUser = this.currentUser;
      this.currentUser = null;
      
      await AsyncStorage.removeItem(this.storageKeys.user);
      await AsyncStorage.removeItem(this.storageKeys.token);

      this.emit('authStateChanged', { user: null, isAuthenticated: false });
      this.emit('userLoggedOut', previousUser);

      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      return { success: false, error: error.message };
    }
  }

  // プロフィール更新
  async updateProfile(updates) {
    try {
      if (!this.currentUser) {
        throw new Error('ログインが必要です');
      }

      const updatedUser = {
        ...this.currentUser,
        ...updates,
        updatedAt: new Date(),
      };

      // メールアドレス変更の場合は検証
      if (updates.email && updates.email !== this.currentUser.email) {
        if (!this.validateEmail(updates.email)) {
          throw new Error('有効なメールアドレスを入力してください');
        }

        const existingUsers = await this.getStoredUsers();
        if (existingUsers.some(user => user.email === updates.email && user.id !== this.currentUser.id)) {
          throw new Error('このメールアドレスは既に使用されています');
        }

        updatedUser.isEmailVerified = false;
      }

      await this.saveUserToStorage(updatedUser);
      this.currentUser = updatedUser;
      await this.saveCurrentUser();

      this.emit('profileUpdated', this.currentUser);

      return { success: true, user: this.currentUser };
    } catch (error) {
      console.error('Profile update failed:', error);
      return { success: false, error: error.message };
    }
  }

  // パスワード変更
  async changePassword(currentPassword, newPassword) {
    try {
      if (!this.currentUser) {
        throw new Error('ログインが必要です');
      }

      // 現在のパスワード検証
      const existingUsers = await this.getStoredUsers();
      const currentUserData = existingUsers.find(u => u.id === this.currentUser.id);
      
      if (!currentUserData || currentUserData.password !== currentPassword) {
        throw new Error('現在のパスワードが正しくありません');
      }

      // 新しいパスワードの検証
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message);
      }

      // パスワード更新
      const updatedUser = {
        ...currentUserData,
        password: newPassword,
        updatedAt: new Date(),
      };

      await this.saveUserToStorage(updatedUser);
      this.emit('passwordChanged', this.currentUser);

      return { success: true };
    } catch (error) {
      console.error('Password change failed:', error);
      return { success: false, error: error.message };
    }
  }

  // アカウント削除
  async deleteAccount(password) {
    try {
      if (!this.currentUser) {
        throw new Error('ログインが必要です');
      }

      const existingUsers = await this.getStoredUsers();
      const currentUserData = existingUsers.find(u => u.id === this.currentUser.id);
      
      if (!currentUserData || currentUserData.password !== password) {
        throw new Error('パスワードが正しくありません');
      }

      // ユーザーデータ削除
      const filteredUsers = existingUsers.filter(u => u.id !== this.currentUser.id);
      await AsyncStorage.setItem('@nightlife_navigator:users', JSON.stringify(filteredUsers));

      const deletedUser = this.currentUser;
      await this.logout();

      this.emit('accountDeleted', deletedUser);

      return { success: true };
    } catch (error) {
      console.error('Account deletion failed:', error);
      return { success: false, error: error.message };
    }
  }

  // 現在のユーザー取得
  getCurrentUser() {
    return this.currentUser;
  }

  // ログイン状態確認
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // ストレージからユーザー一覧取得（モック用）
  async getStoredUsers() {
    try {
      const usersData = await AsyncStorage.getItem('@nightlife_navigator:users');
      return usersData ? JSON.parse(usersData) : [];
    } catch (error) {
      console.error('Failed to get stored users:', error);
      return [];
    }
  }

  // ユーザーをストレージに保存（モック用）
  async saveUserToStorage(user) {
    try {
      const existingUsers = await this.getStoredUsers();
      const userIndex = existingUsers.findIndex(u => u.id === user.id);
      
      if (userIndex >= 0) {
        existingUsers[userIndex] = user;
      } else {
        existingUsers.push(user);
      }

      await AsyncStorage.setItem('@nightlife_navigator:users', JSON.stringify(existingUsers));
    } catch (error) {
      console.error('Failed to save user to storage:', error);
      throw error;
    }
  }

  // パスワードリセット（モック）
  async requestPasswordReset(email) {
    try {
      if (!this.validateEmail(email)) {
        throw new Error('有効なメールアドレスを入力してください');
      }

      const existingUsers = await this.getStoredUsers();
      const user = existingUsers.find(u => u.email === email.toLowerCase());

      if (!user) {
        // セキュリティのため、ユーザーが存在しない場合でも成功を返す
        return { success: true, message: 'パスワードリセットメールを送信しました' };
      }

      // 実際の実装では、ここでメール送信処理を行う
      console.log(`Password reset requested for: ${email}`);

      return { success: true, message: 'パスワードリセットメールを送信しました' };
    } catch (error) {
      console.error('Password reset request failed:', error);
      return { success: false, error: error.message };
    }
  }

  // イベントシステム
  addEventListener(eventType, callback) {
    this.listeners.push({ eventType, callback });
  }

  removeEventListener(eventType, callback) {
    this.listeners = this.listeners.filter(
      listener => listener.eventType !== eventType || listener.callback !== callback
    );
  }

  emit(eventType, data) {
    this.listeners
      .filter(listener => listener.eventType === eventType)
      .forEach(listener => {
        try {
          listener.callback(data);
        } catch (error) {
          console.error(`Error in auth event listener for ${eventType}:`, error);
        }
      });
  }

  async cleanup() {
    try {
      this.listeners = [];
      this.currentUser = null;
      this.initialized = false;
      console.log('AuthService cleaned up');
    } catch (error) {
      console.error('Failed to cleanup AuthService:', error);
    }
  }
}

export default AuthService.getInstance();