// 環境設定
export const ENV = {
  development: {
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
    WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000',
    DEBUG: true,
    LOG_LEVEL: 'debug'
  },
  staging: {
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://staging-api.nightlife.com/api',
    WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'wss://staging-api.nightlife.com',
    DEBUG: true,
    LOG_LEVEL: 'info'
  },
  production: {
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.nightlife.com/api',
    WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'wss://api.nightlife.com',
    DEBUG: false,
    LOG_LEVEL: 'error'
  }
};

// 現在の環境を取得
export const getCurrentEnv = () => {
  if (__DEV__) return 'development';
  // 本番環境では環境変数から取得
  return process.env.EXPO_PUBLIC_ENV || 'production';
};

// 現在の環境設定を取得
export const config = ENV[getCurrentEnv()];

// API設定
export const API_CONFIG = {
  baseURL: config.API_BASE_URL,
  timeout: 15000, // 本番環境ではタイムアウトを長めに
  retries: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'NightLife-Navigator/1.0.0'
  }
};

// アプリ設定
export const APP_CONFIG = {
  name: 'NightLife Navigator',
  version: '1.0.0',
  buildNumber: process.env.EXPO_PUBLIC_BUILD_NUMBER || '1',
  
  // 機能フラグ
  features: {
    pushNotifications: true,
    inAppPurchases: true,
    adminFeatures: process.env.EXPO_PUBLIC_ENV !== 'production', // 本番環境では管理者機能を無効化
    analytics: true,
    crashReporting: true
  },
  
  // 制限
  limits: {
    maxImageSize: 5 * 1024 * 1024, // 5MB
    maxReviewLength: 1000,
    maxCouponTitleLength: 100,
    maxCouponDescriptionLength: 500,
    maxBarNameLength: 100,
    maxBarDescriptionLength: 1000
  },
  
  // キャッシュ設定
  cache: {
    defaultTTL: 5 * 60 * 1000, // 5分
    maxSize: 50 * 1024 * 1024, // 50MB
    enableOffline: true
  },
  
  // アニメーション設定
  animations: {
    duration: {
      fast: 200,
      normal: 300,
      slow: 500
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out'
    }
  },
  
  // 通知設定
  notifications: {
    defaultChannel: 'general',
    channels: {
      general: {
        name: '一般',
        description: '一般的な通知',
        importance: 'default'
      },
      coupons: {
        name: 'クーポン',
        description: 'クーポン関連の通知',
        importance: 'high'
      },
      promotions: {
        name: 'プロモーション',
        description: 'プロモーション関連の通知',
        importance: 'default'
      }
    }
  },
  
  // 地図設定
  map: {
    defaultRegion: {
      latitude: 35.6762,
      longitude: 139.6503,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421
    },
    maxZoom: 20,
    minZoom: 10,
    clusterEnabled: true,
    clusterRadius: 50
  },
  
  // 課金設定
  billing: {
    currency: 'JPY',
    plans: {
      basic: {
        id: 'basic_plan',
        name: 'ベーシック',
        price: 0,
        features: ['basic_features']
      },
      premium: {
        id: 'premium_plan',
        name: 'プレミアム',
        price: 980,
        features: ['basic_features', 'coupon_management', 'push_notifications']
      },
      business: {
        id: 'business_plan',
        name: 'ビジネス',
        price: 2980,
        features: ['basic_features', 'coupon_management', 'push_notifications', 'advanced_analytics', 'marketing_tools']
      }
    }
  },
  
  // セキュリティ設定
  security: {
    sessionTimeout: 8 * 60 * 60 * 1000, // 8時間
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15分
    passwordMinLength: 8,
    requireSpecialChars: false,
    enableSSL: true,
    enableCertificatePinning: process.env.EXPO_PUBLIC_ENV === 'production'
  },
  
  // 分析設定
  analytics: {
    enabled: true,
    trackingId: process.env.EXPO_PUBLIC_GA_TRACKING_ID || 'GA_TRACKING_ID',
    events: {
      app_open: 'app_open',
      screen_view: 'screen_view',
      button_click: 'button_click',
      bar_view: 'bar_view',
      coupon_use: 'coupon_use',
      review_submit: 'review_submit',
      purchase: 'purchase'
    }
  },
  
  // エラー報告設定
  errorReporting: {
    enabled: true,
    service: 'sentry',
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || 'SENTRY_DSN',
    environment: getCurrentEnv(),
    release: `${APP_CONFIG.version}-${APP_CONFIG.buildNumber}`
  }
};

// デバッグ設定
export const DEBUG_CONFIG = {
  enabled: config.DEBUG,
  logLevel: config.LOG_LEVEL,
  showPerformance: config.DEBUG,
  showNetworkRequests: config.DEBUG,
  showStateChanges: false,
  showErrors: true
};

// ローカライゼーション設定
export const LOCALE_CONFIG = {
  default: 'ja',
  supported: ['ja', 'en'],
  fallback: 'ja',
  dateFormat: 'YYYY/MM/DD',
  timeFormat: 'HH:mm',
  currency: 'JPY',
  timezone: 'Asia/Tokyo'
};

// テーマ設定
export const THEME_CONFIG = {
  default: 'dark',
  supported: ['light', 'dark'],
  colors: {
    light: {
      primary: '#1976D2',
      secondary: '#424242',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      text: '#212121',
      textSecondary: '#757575'
    },
    dark: {
      primary: '#D4AF37',
      secondary: '#1a1a1a',
      background: '#0a0a0a',
      surface: '#1a1a1a',
      text: '#ffffff',
      textSecondary: '#cccccc'
    }
  }
};

// エクスポート
export default {
  config,
  API_CONFIG,
  APP_CONFIG,
  DEBUG_CONFIG,
  LOCALE_CONFIG,
  THEME_CONFIG
}; 