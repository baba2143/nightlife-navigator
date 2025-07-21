// 管理者権限レベル
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  SUPPORT: 'support'
};

// 管理者権限
export const ADMIN_PERMISSIONS = {
  // ユーザー管理
  MANAGE_USERS: 'manage_users',
  VIEW_USER_STATS: 'view_user_stats',
  SUSPEND_USERS: 'suspend_users',
  
  // 店舗管理
  MANAGE_BARS: 'manage_bars',
  APPROVE_BARS: 'approve_bars',
  VIEW_BAR_STATS: 'view_bar_stats',
  
  // コンテンツ管理
  MANAGE_REVIEWS: 'manage_reviews',
  MANAGE_COUPONS: 'manage_coupons',
  MANAGE_NOTIFICATIONS: 'manage_notifications',
  
  // 課金管理
  VIEW_BILLING: 'view_billing',
  MANAGE_SUBSCRIPTIONS: 'manage_subscriptions',
  MANAGE_BILLING: 'manage_billing',
  PROCESS_REFUNDS: 'process_refunds',
  
  // システム管理
  MANAGE_SYSTEM: 'manage_system',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_SETTINGS: 'manage_settings'
};

// 権限マッピング
export const ROLE_PERMISSIONS = {
  [ADMIN_ROLES.SUPER_ADMIN]: Object.values(ADMIN_PERMISSIONS),
  [ADMIN_ROLES.ADMIN]: [
    ADMIN_PERMISSIONS.MANAGE_USERS,
    ADMIN_PERMISSIONS.VIEW_USER_STATS,
    ADMIN_PERMISSIONS.SUSPEND_USERS,
    ADMIN_PERMISSIONS.MANAGE_BARS,
    ADMIN_PERMISSIONS.APPROVE_BARS,
    ADMIN_PERMISSIONS.VIEW_BAR_STATS,
    ADMIN_PERMISSIONS.MANAGE_REVIEWS,
    ADMIN_PERMISSIONS.MANAGE_COUPONS,
    ADMIN_PERMISSIONS.MANAGE_NOTIFICATIONS,
    ADMIN_PERMISSIONS.VIEW_BILLING,
    ADMIN_PERMISSIONS.MANAGE_BILLING,
    ADMIN_PERMISSIONS.VIEW_ANALYTICS
  ],
  [ADMIN_ROLES.MODERATOR]: [
    ADMIN_PERMISSIONS.MANAGE_REVIEWS,
    ADMIN_PERMISSIONS.MANAGE_COUPONS,
    ADMIN_PERMISSIONS.MANAGE_NOTIFICATIONS,
    ADMIN_PERMISSIONS.VIEW_USER_STATS,
    ADMIN_PERMISSIONS.VIEW_BAR_STATS
  ],
  [ADMIN_ROLES.SUPPORT]: [
    ADMIN_PERMISSIONS.VIEW_USER_STATS,
    ADMIN_PERMISSIONS.VIEW_BAR_STATS,
    ADMIN_PERMISSIONS.MANAGE_NOTIFICATIONS
  ]
};

// 店舗審査ステータス
export const BAR_APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended'
};

// ユーザーステータス
export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
  INACTIVE: 'inactive'
};

// 管理者アクション
export const ADMIN_ACTIONS = {
  // 店舗関連
  APPROVE_BAR: 'approve_bar',
  REJECT_BAR: 'reject_bar',
  SUSPEND_BAR: 'suspend_bar',
  UPDATE_BAR: 'update_bar',
  
  // ユーザー関連
  SUSPEND_USER: 'suspend_user',
  UNSUSPEND_USER: 'unsuspend_user',
  BAN_USER: 'ban_user',
  UPDATE_USER: 'update_user',
  
  // コンテンツ関連
  DELETE_REVIEW: 'delete_review',
  HIDE_REVIEW: 'hide_review',
  DELETE_COUPON: 'delete_coupon',
  APPROVE_COUPON: 'approve_coupon',
  
  // 課金関連
  CANCEL_SUBSCRIPTION: 'cancel_subscription',
  PROCESS_REFUND: 'process_refund',
  UPDATE_BILLING: 'update_billing'
};

// 管理者通知タイプ
export const ADMIN_NOTIFICATION_TYPES = {
  NEW_BAR_REGISTRATION: 'new_bar_registration',
  BAR_APPROVAL_REQUEST: 'bar_approval_request',
  USER_REPORT: 'user_report',
  SYSTEM_ALERT: 'system_alert',
  BILLING_ISSUE: 'billing_issue',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity'
};

// 管理者ダッシュボード統計
export const ADMIN_STATS_TYPES = {
  TOTAL_USERS: 'total_users',
  ACTIVE_USERS: 'active_users',
  TOTAL_BARS: 'total_bars',
  PENDING_BARS: 'pending_bars',
  TOTAL_REVENUE: 'total_revenue',
  MONTHLY_REVENUE: 'monthly_revenue',
  ACTIVE_SUBSCRIPTIONS: 'active_subscriptions',
  TOTAL_REVIEWS: 'total_reviews',
  TOTAL_COUPONS: 'total_coupons'
}; 