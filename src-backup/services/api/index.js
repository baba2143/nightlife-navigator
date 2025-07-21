/**
 * API エンドポイントのインデックス
 * すべてのAPI関連のエクスポートを一元管理
 */

export { default as ApiClient } from '../ApiClient';
export { default as AuthApi } from './AuthApi';
export { default as UserApi } from './UserApi';
export { default as SessionApi } from './SessionApi';
export { default as VenueApi } from './VenueApi';
export { default as ActivityApi } from './ActivityApi';
export { default as NotificationApi } from './NotificationApi';

/**
 * API エンドポイントの設定
 */
export const API_ENDPOINTS = {
  // 認証
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    CHECK_USERNAME: '/auth/check-username',
    CHECK_EMAIL: '/auth/check-email',
    TWO_FACTOR: {
      SETUP: '/auth/2fa/setup',
      ENABLE: '/auth/2fa/enable',
      DISABLE: '/auth/2fa/disable',
      LOGIN: '/auth/login-2fa',
    },
  },

  // ユーザー
  USER: {
    PROFILE: '/user/profile',
    AVATAR: '/user/avatar',
    SETTINGS: '/user/settings',
    ACCOUNT: '/user/account',
    SUSPEND: '/user/suspend',
    EXPORT: '/user/export',
    STATS: '/user/stats',
  },

  // セッション
  SESSION: {
    CURRENT: '/session/current',
    ACTIVE: '/session/active',
    HISTORY: '/session/history',
    DEVICES: '/session/devices',
    STATS: '/session/stats',
  },

  // 店舗
  VENUES: {
    LIST: '/venues',
    DETAIL: '/venues/:id',
    SEARCH: '/venues/search',
    NEARBY: '/venues/nearby',
    CATEGORIES: '/venues/categories',
    POPULAR: '/venues/popular',
    NEW: '/venues/new',
    FAVORITES: '/venues/favorites',
    FAVORITE: '/venues/:id/favorite',
    CHECKIN: '/venues/:id/checkin',
    CHECKOUT: '/venues/:id/checkout',
    REVIEWS: '/venues/:id/reviews',
  },

  // アクティビティ
  ACTIVITIES: {
    LIST: '/activities',
    RECORD: '/activities',
    DELETE: '/activities/:id',
    STATS: '/activities/stats',
    RANGE: '/activities/range',
    EXPORT: '/activities/export',
    VISITS: '/activities/visits',
    REVIEWS: '/activities/reviews',
    FAVORITES: '/activities/favorites',
  },

  // 通知
  NOTIFICATIONS: {
    LIST: '/notifications',
    READ: '/notifications/:id/read',
    READ_ALL: '/notifications/read-all',
    DELETE: '/notifications/:id',
    DELETE_ALL: '/notifications/all',
    SETTINGS: '/notifications/settings',
    PUSH_TOKEN: '/notifications/push-token',
    TEST: '/notifications/test',
    STATS: '/notifications/stats',
  },
};

/**
 * HTTP ステータスコード
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * API エラーのタイプ
 */
export const API_ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

/**
 * エラータイプを判定する関数
 */
export const getErrorType = (error) => {
  if (!error.status) {
    return API_ERROR_TYPES.NETWORK_ERROR;
  }

  switch (error.status) {
    case HTTP_STATUS.UNAUTHORIZED:
    case HTTP_STATUS.FORBIDDEN:
      return API_ERROR_TYPES.AUTH_ERROR;
    case HTTP_STATUS.BAD_REQUEST:
    case HTTP_STATUS.UNPROCESSABLE_ENTITY:
      return API_ERROR_TYPES.VALIDATION_ERROR;
    case HTTP_STATUS.TOO_MANY_REQUESTS:
      return API_ERROR_TYPES.RATE_LIMIT_ERROR;
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
    case HTTP_STATUS.SERVICE_UNAVAILABLE:
      return API_ERROR_TYPES.SERVER_ERROR;
    default:
      return API_ERROR_TYPES.UNKNOWN_ERROR;
  }
};

/**
 * エラーメッセージを生成する関数
 */
export const getErrorMessage = (error) => {
  const errorType = getErrorType(error);
  
  switch (errorType) {
    case API_ERROR_TYPES.NETWORK_ERROR:
      return 'ネットワークエラーが発生しました。接続を確認してください。';
    case API_ERROR_TYPES.TIMEOUT_ERROR:
      return 'リクエストがタイムアウトしました。しばらく待ってから再試行してください。';
    case API_ERROR_TYPES.AUTH_ERROR:
      return '認証に失敗しました。再度ログインしてください。';
    case API_ERROR_TYPES.VALIDATION_ERROR:
      return '入力データに問題があります。内容を確認してください。';
    case API_ERROR_TYPES.SERVER_ERROR:
      return 'サーバーエラーが発生しました。しばらく待ってから再試行してください。';
    case API_ERROR_TYPES.RATE_LIMIT_ERROR:
      return 'リクエストが多すぎます。しばらく待ってから再試行してください。';
    default:
      return error.message || '予期しないエラーが発生しました。';
  }
};

export default {
  AuthApi,
  UserApi,
  SessionApi,
  VenueApi,
  ActivityApi,
  NotificationApi,
  API_ENDPOINTS,
  HTTP_STATUS,
  API_ERROR_TYPES,
  getErrorType,
  getErrorMessage,
};