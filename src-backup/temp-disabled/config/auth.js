/**
 * 認証関連の設定ファイル
 */

// 認証設定
export const AUTH_CONFIG = {
  // JWT設定
  JWT: {
    SECRET_KEY: process.env.JWT_SECRET || 'nightlife-navigator-secret-key-change-in-production',
    ACCESS_TOKEN_EXPIRY: '15m',        // アクセストークンの有効期限
    REFRESH_TOKEN_EXPIRY: '7d',        // リフレッシュトークンの有効期限
    ISSUER: 'nightlife-navigator',
    AUDIENCE: 'nightlife-navigator-users',
  },

  // セッション設定
  SESSION: {
    MAX_CONCURRENT_SESSIONS: 3,       // 同時ログイン可能数
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24時間（ミリ秒）
    REFRESH_THRESHOLD: 5 * 60 * 1000,  // 5分前にリフレッシュ
    AUTO_REFRESH: true,                // 自動リフレッシュ
  },

  // パスワード設定
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: false,
    BCRYPT_ROUNDS: 12,
  },

  // アカウントロック設定
  ACCOUNT_LOCKOUT: {
    MAX_ATTEMPTS: 5,                   // 最大試行回数
    LOCKOUT_DURATION: 15 * 60 * 1000,  // ロック時間（15分）
    RESET_TIME: 60 * 60 * 1000,       // 試行回数リセット時間（1時間）
  },

  // OAuth設定
  OAUTH: {
    GOOGLE: {
      CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      SCOPES: ['email', 'profile'],
    },
    APPLE: {
      CLIENT_ID: process.env.APPLE_CLIENT_ID,
      KEY_ID: process.env.APPLE_KEY_ID,
      TEAM_ID: process.env.APPLE_TEAM_ID,
      SCOPES: ['email', 'name'],
    },
    LINE: {
      CHANNEL_ID: process.env.LINE_CHANNEL_ID,
      CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
      SCOPES: ['profile', 'openid', 'email'],
    },
  },

  // ストレージキー
  STORAGE_KEYS: {
    ACCESS_TOKEN: '@nightlife_navigator:access_token',
    REFRESH_TOKEN: '@nightlife_navigator:refresh_token',
    USER_DATA: '@nightlife_navigator:user_data',
    BIOMETRIC_ENABLED: '@nightlife_navigator:biometric_enabled',
    REMEMBER_ME: '@nightlife_navigator:remember_me',
    LAST_LOGIN: '@nightlife_navigator:last_login',
  },

  // 生体認証設定
  BIOMETRIC: {
    ENABLED: true,
    FALLBACK_TITLE: 'パスコードを使用',
    REASON: 'アプリにアクセスするために認証が必要です',
    POLICY: 'biometryAny', // iOS: biometryAny, biometryCurrentSet
  },

  // メール認証設定
  EMAIL_VERIFICATION: {
    REQUIRED: true,
    TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24時間
    RESEND_COOLDOWN: 60 * 1000,        // 1分
    MAX_RESEND_ATTEMPTS: 5,
  },

  // ユーザー設定
  USER: {
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 30,
    DISPLAY_NAME_MAX_LENGTH: 50,
    BIO_MAX_LENGTH: 160,
    DEFAULT_AVATAR: '/assets/default-avatar.png',
    ALLOWED_AVATAR_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    MAX_AVATAR_SIZE: 2 * 1024 * 1024, // 2MB
  },

  // API設定
  API: {
    BASE_URL: process.env.API_BASE_URL || 'http://localhost:8000/api',
    TIMEOUT: 10000, // 10秒
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1秒
  },

  // セキュリティ設定
  SECURITY: {
    ENABLE_CAPTCHA: false,
    CAPTCHA_THRESHOLD: 3,              // 試行回数でCAPTCHA表示
    FORCE_PASSWORD_CHANGE_DAYS: 90,    // パスワード変更強制日数
    SESSION_FINGERPRINTING: true,      // セッションフィンガープリンティング
    DEVICE_TRACKING: true,             // デバイス追跡
    IP_WHITELIST: [],                  // IP制限（空の場合は制限なし）
  },

  // ログ設定
  LOGGING: {
    ENABLE_AUTH_LOGS: true,
    LOG_FAILED_ATTEMPTS: true,
    LOG_SUCCESSFUL_LOGINS: true,
    LOG_LOGOUT_EVENTS: true,
    LOG_TOKEN_REFRESH: false,
    SENSITIVE_DATA_MASKING: true,
  },

  // エラーメッセージ
  ERROR_MESSAGES: {
    INVALID_CREDENTIALS: 'メールアドレスまたはパスワードが正しくありません',
    ACCOUNT_LOCKED: 'アカウントがロックされています。しばらく待ってから再試行してください',
    EMAIL_NOT_VERIFIED: 'メールアドレスの確認が完了していません',
    TOKEN_EXPIRED: 'セッションの有効期限が切れました。再度ログインしてください',
    INVALID_TOKEN: '無効なトークンです',
    PASSWORD_TOO_WEAK: 'パスワードが脆弱です。より強力なパスワードを設定してください',
    EMAIL_ALREADY_EXISTS: 'このメールアドレスは既に使用されています',
    USERNAME_ALREADY_EXISTS: 'このユーザー名は既に使用されています',
    INVALID_EMAIL_FORMAT: 'メールアドレスの形式が正しくありません',
    NETWORK_ERROR: 'ネットワークエラーが発生しました',
    SERVER_ERROR: 'サーバーエラーが発生しました',
    BIOMETRIC_NOT_AVAILABLE: '生体認証が利用できません',
    BIOMETRIC_ENROLLMENT_REQUIRED: '生体認証の設定が必要です',
  },

  // 成功メッセージ
  SUCCESS_MESSAGES: {
    REGISTRATION_COMPLETE: 'アカウントの作成が完了しました',
    LOGIN_SUCCESS: 'ログインしました',
    LOGOUT_SUCCESS: 'ログアウトしました',
    PASSWORD_CHANGED: 'パスワードを変更しました',
    EMAIL_VERIFIED: 'メールアドレスの確認が完了しました',
    PROFILE_UPDATED: 'プロフィールを更新しました',
    VERIFICATION_EMAIL_SENT: '確認メールを送信しました',
  },

  // 開発・デバッグ設定
  DEBUG: {
    ENABLE_LOGS: process.env.NODE_ENV === 'development',
    MOCK_OAUTH: process.env.NODE_ENV === 'development',
    SKIP_EMAIL_VERIFICATION: process.env.NODE_ENV === 'development',
    SHOW_TOKEN_IN_LOGS: false, // セキュリティ上、本番では絶対にfalse
  },
};

// 認証プロバイダーの設定
export const AUTH_PROVIDERS = {
  EMAIL: {
    id: 'email',
    name: 'メールアドレス',
    icon: '📧',
    enabled: true,
  },
  GOOGLE: {
    id: 'google',
    name: 'Google',
    icon: '🔍',
    enabled: !!AUTH_CONFIG.OAUTH.GOOGLE.CLIENT_ID,
  },
  APPLE: {
    id: 'apple',
    name: 'Apple',
    icon: '🍎',
    enabled: !!AUTH_CONFIG.OAUTH.APPLE.CLIENT_ID,
  },
  LINE: {
    id: 'line',
    name: 'LINE',
    icon: '💬',
    enabled: !!AUTH_CONFIG.OAUTH.LINE.CHANNEL_ID,
  },
};

// ユーザーロール・権限設定
export const USER_ROLES = {
  USER: {
    id: 'user',
    name: 'ユーザー',
    permissions: [
      'venues.view',
      'venues.favorite',
      'coupons.view',
      'coupons.use',
      'profile.edit',
      'reviews.create',
      'reviews.edit_own',
    ],
  },
  PREMIUM: {
    id: 'premium',
    name: 'プレミアムユーザー',
    permissions: [
      'venues.view',
      'venues.favorite',
      'venues.advanced_search',
      'coupons.view',
      'coupons.use',
      'coupons.premium',
      'profile.edit',
      'reviews.create',
      'reviews.edit_own',
      'analytics.view_own',
    ],
  },
  VENUE_OWNER: {
    id: 'venue_owner',
    name: '店舗オーナー',
    permissions: [
      'venues.view',
      'venues.manage_own',
      'coupons.create',
      'coupons.manage_own',
      'analytics.view_own',
      'customers.view_own',
      'profile.edit',
      'reviews.respond',
    ],
  },
  ADMIN: {
    id: 'admin',
    name: '管理者',
    permissions: [
      'venues.manage_all',
      'users.manage',
      'coupons.manage_all',
      'analytics.view_all',
      'system.configure',
      'reviews.moderate',
    ],
  },
};

// バリデーション設定
export const VALIDATION_RULES = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'メールアドレスの形式が正しくありません',
  },
  password: {
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    message: 'パスワードは8文字以上で、大文字・小文字・数字を含む必要があります',
  },
  username: {
    pattern: /^[a-zA-Z0-9_]{3,30}$/,
    message: 'ユーザー名は3-30文字の英数字とアンダースコアのみ使用可能です',
  },
  phoneNumber: {
    pattern: /^(\+81|0)[0-9]{10,11}$/,
    message: '電話番号の形式が正しくありません',
  },
};

export default AUTH_CONFIG;