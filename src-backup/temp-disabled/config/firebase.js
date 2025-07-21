/**
 * Firebase Configuration
 * Firebase Cloud Messaging and other Firebase services setup
 */

import { Platform } from 'react-native';
import ConfigService from '../services/ConfigService';
import LoggingService from '../services/LoggingService';

// Firebase configuration object
let firebaseConfig = null;

/**
 * Get Firebase configuration based on environment
 */
const getFirebaseConfig = () => {
  if (firebaseConfig) {
    return firebaseConfig;
  }

  const environment = ConfigService.get('environment', 'development');
  
  // Environment-specific Firebase configurations
  const configs = {
    development: {
      apiKey: ConfigService.getConfigValue('FIREBASE_API_KEY', 'your-dev-api-key'),
      authDomain: ConfigService.getConfigValue('FIREBASE_AUTH_DOMAIN', 'nightlife-navigator-dev.firebaseapp.com'),
      projectId: ConfigService.getConfigValue('FIREBASE_PROJECT_ID', 'nightlife-navigator-dev'),
      storageBucket: ConfigService.getConfigValue('FIREBASE_STORAGE_BUCKET', 'nightlife-navigator-dev.appspot.com'),
      messagingSenderId: ConfigService.getConfigValue('FIREBASE_MESSAGING_SENDER_ID', '123456789'),
      appId: ConfigService.getConfigValue('FIREBASE_APP_ID', '1:123456789:web:dev'),
      measurementId: ConfigService.getConfigValue('FIREBASE_MEASUREMENT_ID', 'G-DEV123456'),
    },
    staging: {
      apiKey: ConfigService.getConfigValue('FIREBASE_API_KEY', 'your-staging-api-key'),
      authDomain: ConfigService.getConfigValue('FIREBASE_AUTH_DOMAIN', 'nightlife-navigator-staging.firebaseapp.com'),
      projectId: ConfigService.getConfigValue('FIREBASE_PROJECT_ID', 'nightlife-navigator-staging'),
      storageBucket: ConfigService.getConfigValue('FIREBASE_STORAGE_BUCKET', 'nightlife-navigator-staging.appspot.com'),
      messagingSenderId: ConfigService.getConfigValue('FIREBASE_MESSAGING_SENDER_ID', '123456789'),
      appId: ConfigService.getConfigValue('FIREBASE_APP_ID', '1:123456789:web:staging'),
      measurementId: ConfigService.getConfigValue('FIREBASE_MEASUREMENT_ID', 'G-STAGING123456'),
    },
    production: {
      apiKey: ConfigService.getConfigValue('FIREBASE_API_KEY', 'your-production-api-key'),
      authDomain: ConfigService.getConfigValue('FIREBASE_AUTH_DOMAIN', 'nightlife-navigator.firebaseapp.com'),
      projectId: ConfigService.getConfigValue('FIREBASE_PROJECT_ID', 'nightlife-navigator'),
      storageBucket: ConfigService.getConfigValue('FIREBASE_STORAGE_BUCKET', 'nightlife-navigator.appspot.com'),
      messagingSenderId: ConfigService.getConfigValue('FIREBASE_MESSAGING_SENDER_ID', '123456789'),
      appId: ConfigService.getConfigValue('FIREBASE_APP_ID', '1:123456789:web:prod'),
      measurementId: ConfigService.getConfigValue('FIREBASE_MEASUREMENT_ID', 'G-PROD123456'),
    },
  };

  firebaseConfig = configs[environment] || configs.development;
  
  LoggingService.info('[Firebase] Configuration loaded', {
    environment,
    projectId: firebaseConfig.projectId,
  });

  return firebaseConfig;
};

/**
 * Initialize Firebase services
 */
const initializeFirebase = async () => {
  try {
    const config = getFirebaseConfig();
    
    // Note: In a real React Native app, you would use:
    // import { initializeApp } from 'firebase/app';
    // import { getMessaging } from 'firebase/messaging/sw';
    // 
    // For Expo managed workflow, Firebase is handled differently
    // This is a configuration template
    
    LoggingService.info('[Firebase] Services initialized', {
      projectId: config.projectId,
      platform: Platform.OS,
    });

    return config;
    
  } catch (error) {
    LoggingService.error('[Firebase] Failed to initialize', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Firebase Cloud Messaging configuration
 */
const getFCMConfig = () => {
  return {
    // Notification channels (Android)
    channels: [
      {
        id: 'venue_recommendations',
        name: '店舗のおすすめ',
        description: 'お気に入りの店舗やイベント情報',
        importance: 4, // HIGH
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#D4AF37',
      },
      {
        id: 'social_interactions',
        name: '友達からの通知',
        description: 'フォローやメッセージなどの通知',
        importance: 4, // HIGH
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#2196F3',
      },
      {
        id: 'promotional',
        name: 'プロモーション',
        description: '特別オファーやイベント情報',
        importance: 3, // DEFAULT
        sound: 'notification',
        vibration: [0, 250, 250, 250],
        lights: true,
        lightColor: '#FF9800',
      },
      {
        id: 'system_updates',
        name: 'システム更新',
        description: 'アプリの重要なお知らせ',
        importance: 4, // HIGH
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#4CAF50',
      },
      {
        id: 'weekly_digest',
        name: '週次レポート',
        description: '週間の活動サマリー',
        importance: 2, // LOW
        sound: null,
        vibration: false,
        lights: false,
      },
    ],
    
    // Default notification settings
    defaultSettings: {
      sound: 'default',
      priority: 'high',
      visibility: 'public',
      autoCancel: true,
      largeIcon: 'ic_notification_large',
      smallIcon: 'ic_notification_small',
      color: '#D4AF37',
    },
    
    // Topic configuration
    topics: {
      venue_recommendations: {
        name: 'venue_recommendations',
        description: '店舗のおすすめ通知',
        defaultSubscribed: true,
      },
      social_interactions: {
        name: 'social_interactions',
        description: '友達からの通知',
        defaultSubscribed: true,
      },
      promotional: {
        name: 'promotional',
        description: 'プロモーション通知',
        defaultSubscribed: false,
      },
      system_updates: {
        name: 'system_updates',
        description: 'システム更新通知',
        defaultSubscribed: true,
      },
      weekly_digest: {
        name: 'weekly_digest',
        description: '週次レポート',
        defaultSubscribed: true,
      },
    },
  };
};

/**
 * Get notification template
 */
const getNotificationTemplate = (type) => {
  const templates = {
    venue_recommendation: {
      title: '新しい店舗のおすすめ',
      body: 'あなたの好みに合った店舗を見つけました',
      icon: 'venue_icon',
      color: '#D4AF37',
      channelId: 'venue_recommendations',
      categoryId: 'venue_recommendation',
      actions: [
        {
          id: 'view_venue',
          title: '詳細を見る',
          icon: 'ic_view',
        },
        {
          id: 'save_for_later',
          title: 'あとで見る',
          icon: 'ic_bookmark',
        },
      ],
    },
    social_interaction: {
      title: '友達からの通知',
      body: '新しい通知があります',
      icon: 'social_icon',
      color: '#2196F3',
      channelId: 'social_interactions',
      categoryId: 'social_interaction',
      actions: [
        {
          id: 'reply',
          title: '返信',
          icon: 'ic_reply',
        },
        {
          id: 'ignore',
          title: '無視',
          icon: 'ic_ignore',
        },
      ],
    },
    promotional: {
      title: '特別オファー',
      body: '限定プロモーションをチェック',
      icon: 'promo_icon',
      color: '#FF9800',
      channelId: 'promotional',
      categoryId: 'promotional',
      actions: [
        {
          id: 'view_offer',
          title: 'オファーを見る',
          icon: 'ic_offer',
        },
        {
          id: 'unsubscribe',
          title: '配信停止',
          icon: 'ic_unsubscribe',
        },
      ],
    },
    system_update: {
      title: 'システム更新',
      body: 'アプリの重要なお知らせ',
      icon: 'system_icon',
      color: '#4CAF50',
      channelId: 'system_updates',
      categoryId: 'system_update',
      actions: [
        {
          id: 'view_update',
          title: '詳細を見る',
          icon: 'ic_info',
        },
      ],
    },
    weekly_digest: {
      title: '週次レポート',
      body: 'この週の活動をまとめました',
      icon: 'digest_icon',
      color: '#9C27B0',
      channelId: 'weekly_digest',
      categoryId: 'weekly_digest',
      actions: [
        {
          id: 'view_digest',
          title: 'レポートを見る',
          icon: 'ic_report',
        },
      ],
    },
  };

  return templates[type] || templates.system_update;
};

/**
 * Validate Firebase configuration
 */
const validateFirebaseConfig = (config) => {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  const missingFields = requiredFields.filter(field => !config[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing Firebase configuration fields: ${missingFields.join(', ')}`);
  }

  // Validate format
  if (!config.projectId.match(/^[a-z0-9-]+$/)) {
    throw new Error('Invalid Firebase project ID format');
  }

  if (!config.appId.match(/^1:\d+:(web|ios|android):[a-f0-9]+$/)) {
    throw new Error('Invalid Firebase app ID format');
  }

  return true;
};

/**
 * Get environment-specific messaging configuration
 */
const getMessagingConfig = () => {
  const environment = ConfigService.get('environment', 'development');
  
  return {
    // Service worker configuration (for web)
    serviceWorker: {
      scope: '/',
      updateViaCache: 'imports',
    },
    
    // Vapid key for web push
    vapidKey: ConfigService.getConfigValue('FIREBASE_VAPID_KEY', 'your-vapid-key'),
    
    // Background message handler
    backgroundMessageHandler: (payload) => {
      LoggingService.info('[Firebase] Background message received', {
        messageId: payload.messageId,
        from: payload.from,
        notification: payload.notification,
      });
    },
    
    // Foreground message handler
    foregroundMessageHandler: (payload) => {
      LoggingService.info('[Firebase] Foreground message received', {
        messageId: payload.messageId,
        from: payload.from,
        notification: payload.notification,
      });
    },
    
    // Token refresh handler
    tokenRefreshHandler: (token) => {
      LoggingService.info('[Firebase] Token refreshed', {
        token: token.substring(0, 20) + '...',
      });
    },
    
    // Retry configuration
    retryConfig: {
      maxRetries: 3,
      backoffFactor: 2,
      initialDelay: 1000,
    },
  };
};

/**
 * Create notification payload
 */
const createNotificationPayload = (type, data = {}) => {
  const template = getNotificationTemplate(type);
  
  return {
    notification: {
      title: data.title || template.title,
      body: data.body || template.body,
      icon: template.icon,
      badge: data.badge || 1,
      tag: data.tag || type,
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      timestamp: Date.now(),
    },
    data: {
      type,
      ...data,
      clickAction: data.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
    },
    android: {
      channelId: template.channelId,
      color: template.color,
      icon: template.icon,
      priority: 'high',
      notification: {
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        channelId: template.channelId,
        color: template.color,
        icon: template.icon,
        tag: data.tag || type,
      },
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title: data.title || template.title,
            body: data.body || template.body,
          },
          badge: data.badge || 1,
          sound: 'default',
          category: template.categoryId,
        },
      },
      fcm_options: {
        image: data.image,
      },
    },
    webpush: {
      headers: {
        Urgency: 'high',
      },
      notification: {
        title: data.title || template.title,
        body: data.body || template.body,
        icon: template.icon,
        badge: '/assets/badge.png',
        tag: data.tag || type,
        requireInteraction: data.requireInteraction || false,
        actions: template.actions,
      },
      fcm_options: {
        link: data.link,
      },
    },
  };
};

/**
 * Get debug configuration
 */
const getDebugConfig = () => {
  return {
    enabled: ConfigService.get('isDevelopment', false),
    logLevel: 'debug',
    logPrefix: '[Firebase]',
    
    // Mock configuration for development
    mockConfig: {
      projectId: 'mock-project',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:mock',
    },
    
    // Test tokens for development
    testTokens: {
      ios: 'test-ios-token',
      android: 'test-android-token',
      web: 'test-web-token',
    },
  };
};

export {
  getFirebaseConfig,
  initializeFirebase,
  getFCMConfig,
  getNotificationTemplate,
  validateFirebaseConfig,
  getMessagingConfig,
  createNotificationPayload,
  getDebugConfig,
};

export default {
  getFirebaseConfig,
  initializeFirebase,
  getFCMConfig,
  getNotificationTemplate,
  validateFirebaseConfig,
  getMessagingConfig,
  createNotificationPayload,
  getDebugConfig,
};