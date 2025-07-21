import { Alert } from 'react-native';
import { ADMIN_ROLES, ROLE_PERMISSIONS } from '../constants/admin';
import bcrypt from 'bcrypt';
import securityLogger from '../utils/securityLogger';
import PasswordGenerator from '../utils/passwordGenerator';
import sessionManager from './SessionManager';
import InputValidator from '../utils/inputValidator';
import InputSanitizer from '../utils/inputSanitizer';
import rateLimiter from './RateLimiter';

class AdminAuthService {
  constructor() {
    this.currentAdmin = null;
    this.isAuthenticated = false;
    this.sessionTimeout = null;
    this.saltRounds = 12;
    this.loginAttempts = new Map(); // ユーザー名 -> 試行回数のマップ
    this.blockedUsers = new Map(); // ブロックされたユーザーのマップ
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15分
  }

  // パスワードハッシュ化
  async hashPassword(password) {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      console.error('パスワードハッシュ化エラー:', error);
      throw new Error('パスワードの暗号化に失敗しました');
    }
  }

  // パスワード検証
  async verifyPassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('パスワード検証エラー:', error);
      return false;
    }
  }

  // 管理者アカウント（デモ用 - ハッシュ化されたパスワード）
  adminAccounts = [
    {
      id: 'admin1',
      username: 'admin',
      password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6UY6B3xUy2', // SecureAdmin2024!
      role: ADMIN_ROLES.SUPER_ADMIN,
      name: 'システム管理者',
      email: 'admin@nightlife.com',
      lastLogin: null
    },
    {
      id: 'admin2',
      username: 'moderator',
      password: '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // ModSecure2024!
      role: ADMIN_ROLES.MODERATOR,
      name: 'コンテンツ管理者',
      email: 'moderator@nightlife.com',
      lastLogin: null
    },
    {
      id: 'admin3',
      username: 'support',
      password: '$2b$12$6NoJ8TkZMHEf5x2PSVlqBOK.lwsDbqYHy0g1B0Ln/5t7hAVLvZSb2', // Support2024!
      role: ADMIN_ROLES.SUPPORT,
      name: 'サポート担当',
      email: 'support@nightlife.com',
      lastLogin: null
    }
  ];

  // 管理者ログイン
  async login(username, password, clientIP = '127.0.0.1') {
    try {
      // レート制限チェック
      const rateLimitResult = rateLimiter.checkLimit('login', clientIP);
      if (!rateLimitResult.allowed) {
        throw new Error(rateLimitResult.message);
      }

      // 入力検証とサニタイゼーション
      if (!username || !password) {
        throw new Error('ユーザー名とパスワードを入力してください');
      }

      // 入力をサニタイズ
      const sanitizedUsername = InputSanitizer.sanitizeAll(username, {
        maxLength: 50,
        sql: true,
        xss: true,
        command: true
      });
      
      // 脅威検出
      const usernameThreats = InputSanitizer.detectThreats(username);
      const passwordThreats = InputSanitizer.detectThreats(password);
      
      if (!usernameThreats.isClean || !passwordThreats.isClean) {
        securityLogger.logSecurityViolation(sanitizedUsername, 'MALICIOUS_INPUT_DETECTED', {
          usernameThreats: usernameThreats.threats,
          passwordThreats: passwordThreats.threats
        });
        throw new Error('不正な入力が検出されました');
      }

      // ユーザー名の検証
      const usernameValidation = InputValidator.validateUsername(sanitizedUsername);
      if (!usernameValidation.isValid) {
        throw new Error(usernameValidation.errors[0]);
      }

      if (password.length < 8) {
        throw new Error('パスワードは8文字以上である必要があります');
      }

      // サニタイズされたユーザー名を使用
      const finalUsername = usernameValidation.sanitized;

      // ユーザー名でアカウントを検索
      const admin = this.adminAccounts.find(
        account => account.username === finalUsername
      );

      if (!admin) {
        throw new Error('ユーザー名またはパスワードが正しくありません');
      }

      // ブルートフォース攻撃チェック
      if (this.isUserBlocked(finalUsername)) {
        const blockTime = this.blockedUsers.get(finalUsername);
        const remainingTime = Math.ceil((blockTime - Date.now()) / 1000 / 60);
        securityLogger.logSecurityViolation(finalUsername, 'BLOCKED_LOGIN_ATTEMPT', {
          remainingLockoutTime: remainingTime
        });
        throw new Error(`アカウントがロックされています。${remainingTime}分後に再試行してください。`);
      }

      // パスワード検証
      const isPasswordValid = await this.verifyPassword(password, admin.password);
      
      if (!isPasswordValid) {
        // ログイン失敗をログに記録
        securityLogger.logLoginAttempt(finalUsername, false, {
          reason: 'invalid_credentials',
          timestamp: new Date().toISOString()
        });
        
        // 失敗回数を増やす
        this.incrementLoginAttempts(finalUsername);
        
        // ブルートフォース攻撃検出
        if (securityLogger.detectBruteForce(finalUsername)) {
          this.blockUser(finalUsername);
          throw new Error('複数回の失敗によりアカウントがロックされました。');
        }
        
        // レート制限に失敗を記録
        rateLimiter.checkLimit('login', clientIP, false);
        
        throw new Error('ユーザー名またはパスワードが正しくありません');
      }

      // ログイン成功時の処理
      this.clearLoginAttempts(finalUsername);
      securityLogger.logLoginAttempt(finalUsername, true, {
        role: admin.role,
        loginTime: new Date().toISOString()
      });

      // ログイン成功
      this.currentAdmin = {
        ...admin,
        lastLogin: new Date().toISOString()
      };
      this.isAuthenticated = true;

      // セッションタイムアウト設定（8時間）
      this.setSessionTimeout();

      // セキュリティログ
      securityLogger.logAuth(admin.id, 'LOGIN_SUCCESS', {
        username: admin.username,
        role: admin.role,
        loginTime: new Date().toISOString()
      });

      console.log(`管理者ログイン: ${admin.name} (${admin.role})`);
      
      return {
        success: true,
        admin: {
          ...this.currentAdmin,
          password: undefined // パスワードは返さない
        }
      };
    } catch (error) {
      console.error('管理者ログインエラー:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 管理者ログアウト
  async logout() {
    try {
      const adminId = this.currentAdmin?.id;
      const adminName = this.currentAdmin?.name;
      const sessionId = this.currentSessionId;
      
      if (this.currentAdmin) {
        securityLogger.logAuth(adminId, 'LOGOUT', {
          sessionId,
          logoutTime: new Date().toISOString()
        });
        console.log(`管理者ログアウト: ${adminName}`);
      }
      
      // セッションを破棄
      if (sessionId) {
        await sessionManager.destroySession(sessionId);
      }
      
      this.currentAdmin = null;
      this.isAuthenticated = false;
      this.currentSessionId = null;
      
      if (this.sessionTimeout) {
        clearTimeout(this.sessionTimeout);
        this.sessionTimeout = null;
      }

      return { success: true };
    } catch (error) {
      console.error('管理者ログアウトエラー:', error);
      return { success: false, error: error.message };
    }
  }

  // セッションタイムアウト設定
  setSessionTimeout() {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }

    // 8時間後にセッションタイムアウト
    this.sessionTimeout = setTimeout(() => {
      this.logout();
      Alert.alert(
        'セッションタイムアウト',
        'セッションが期限切れになりました。再度ログインしてください。'
      );
    }, 8 * 60 * 60 * 1000);
  }

  // セッション延長
  extendSession() {
    this.setSessionTimeout();
  }

  // 現在の管理者情報を取得
  getCurrentAdmin() {
    return this.currentAdmin;
  }

  // 認証状態を確認
  isLoggedIn() {
    return this.isAuthenticated && this.currentAdmin !== null;
  }

  // 権限チェック
  hasPermission(permission) {
    if (!this.isLoggedIn()) {
      return false;
    }

    const role = this.currentAdmin.role;
    const permissions = ROLE_PERMISSIONS[role] || [];
    
    return permissions.includes(permission);
  }

  // 複数権限チェック
  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission));
  }

  // 全権限チェック
  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission));
  }

  // 管理者ロールチェック
  hasRole(role) {
    if (!this.isLoggedIn()) {
      return false;
    }

    return this.currentAdmin.role === role;
  }

  // 管理者ロール比較
  hasRoleOrHigher(requiredRole) {
    if (!this.isLoggedIn()) {
      return false;
    }

    const roleHierarchy = {
      [ADMIN_ROLES.SUPPORT]: 1,
      [ADMIN_ROLES.MODERATOR]: 2,
      [ADMIN_ROLES.ADMIN]: 3,
      [ADMIN_ROLES.SUPER_ADMIN]: 4
    };

    const currentLevel = roleHierarchy[this.currentAdmin.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return currentLevel >= requiredLevel;
  }

  // 管理者情報更新
  async updateAdminInfo(adminId, updates) {
    try {
      // 実際のアプリではサーバーAPIを使用
      const adminIndex = this.adminAccounts.findIndex(admin => admin.id === adminId);
      
      if (adminIndex === -1) {
        throw new Error('管理者が見つかりません');
      }

      this.adminAccounts[adminIndex] = {
        ...this.adminAccounts[adminIndex],
        ...updates
      };

      // 現在の管理者情報も更新
      if (this.currentAdmin && this.currentAdmin.id === adminId) {
        this.currentAdmin = {
          ...this.currentAdmin,
          ...updates
        };
      }

      return { success: true };
    } catch (error) {
      console.error('管理者情報更新エラー:', error);
      return { success: false, error: error.message };
    }
  }

  // 管理者アカウント作成（スーパー管理者のみ）
  async createAdminAccount(adminData) {
    try {
      if (!this.hasRole(ADMIN_ROLES.SUPER_ADMIN)) {
        throw new Error('権限がありません');
      }

      // 入力サニタイゼーション
      const sanitizedData = InputSanitizer.sanitizeObject(adminData, {
        maxLength: 255,
        sql: true,
        xss: true,
        command: true
      });

      // 入力検証
      const validationRules = {
        username: { type: 'username', required: true },
        password: { type: 'password', required: true },
        email: { type: 'email', required: true },
        name: { type: 'name', required: true }
      };

      const validation = InputValidator.validateForm(sanitizedData, validationRules);
      if (!validation.isValid) {
        const errors = Object.values(validation.errors).flat();
        throw new Error(errors[0]);
      }

      // ユーザー名の重複チェック
      const existingAdmin = this.adminAccounts.find(admin => admin.username === validation.sanitized.username);
      if (existingAdmin) {
        throw new Error('このユーザー名は既に使用されています');
      }

      // パスワード強度チェック
      if (!this.validatePassword(sanitizedData.password)) {
        throw new Error('パスワードは8文字以上で、大文字・小文字・数字・記号を含む必要があります');
      }

      // パスワードをハッシュ化
      const hashedPassword = await this.hashPassword(sanitizedData.password);

      const newAdmin = {
        id: `admin_${Date.now()}`,
        ...validation.sanitized,
        password: hashedPassword,
        lastLogin: null
      };

      this.adminAccounts.push(newAdmin);
      
      this.logLoginActivity(newAdmin.id, 'account_created', { 
        createdBy: this.currentAdmin?.id,
        role: newAdmin.role 
      });
      
      return { 
        success: true, 
        admin: {
          ...newAdmin,
          password: undefined // パスワードは返さない
        }
      };
    } catch (error) {
      console.error('管理者アカウント作成エラー:', error);
      return { success: false, error: error.message };
    }
  }

  // 管理者アカウント削除（スーパー管理者のみ）
  async deleteAdminAccount(adminId) {
    try {
      if (!this.hasRole(ADMIN_ROLES.SUPER_ADMIN)) {
        throw new Error('権限がありません');
      }

      if (this.currentAdmin && this.currentAdmin.id === adminId) {
        throw new Error('自分自身のアカウントは削除できません');
      }

      // 実際のアプリではサーバーAPIを使用
      const adminIndex = this.adminAccounts.findIndex(admin => admin.id === adminId);
      
      if (adminIndex === -1) {
        throw new Error('管理者が見つかりません');
      }

      this.adminAccounts.splice(adminIndex, 1);
      
      return { success: true };
    } catch (error) {
      console.error('管理者アカウント削除エラー:', error);
      return { success: false, error: error.message };
    }
  }

  // 管理者一覧取得
  getAdminAccounts() {
    return this.adminAccounts.map(admin => ({
      ...admin,
      password: undefined // パスワードは除外
    }));
  }

  // ログイン履歴記録
  logLoginActivity(adminId, action, details = {}) {
    // 実際のアプリではログをデータベースに保存
    console.log('管理者アクティビティ:', {
      adminId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // パスワード変更
  async changePassword(adminId, currentPassword, newPassword) {
    try {
      const admin = this.adminAccounts.find(acc => acc.id === adminId);
      
      if (!admin) {
        throw new Error('管理者が見つかりません');
      }

      // 現在のパスワード検証
      const isCurrentPasswordValid = await this.verifyPassword(currentPassword, admin.password);
      if (!isCurrentPasswordValid) {
        throw new Error('現在のパスワードが正しくありません');
      }

      // 新しいパスワードの検証
      if (!this.validatePassword(newPassword)) {
        throw new Error('新しいパスワードは8文字以上で、大文字・小文字・数字・記号を含む必要があります');
      }

      // 新しいパスワードをハッシュ化
      const hashedNewPassword = await this.hashPassword(newPassword);
      
      // パスワード更新
      admin.password = hashedNewPassword;
      
      if (this.currentAdmin && this.currentAdmin.id === adminId) {
        this.currentAdmin.password = hashedNewPassword;
      }

      this.logLoginActivity(adminId, 'password_change');
      
      return { success: true };
    } catch (error) {
      console.error('パスワード変更エラー:', error);
      return { success: false, error: error.message };
    }
  }

  // パスワード強度検証
  validatePassword(password) {
    if (!password || password.length < 8) {
      return false;
    }

    // パスワード要件: 8文字以上、大文字・小文字・数字・記号を含む
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasLowerCase && hasUpperCase && hasNumbers && hasSpecialChar;
  }
}

// シングルトンインスタンス
const adminAuthService = new AdminAuthService();

export default adminAuthService; 