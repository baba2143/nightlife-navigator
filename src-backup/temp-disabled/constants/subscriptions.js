// アプリ内課金プラン定義
export const SUBSCRIPTION_PLANS = {
  BASIC: {
    id: 'basic_plan',
    name: 'ベーシックプラン',
    price: 980,
    currency: 'JPY',
    period: 'monthly',
    description: '基本的な店舗管理機能',
    features: [
      '店舗情報の登録・編集',
      'レビューの確認・返信',
      '基本的な統計情報'
    ],
    limitations: [
      'クーポン機能は利用不可',
      'プッシュ通知は利用不可',
      '詳細分析は利用不可'
    ]
  },
  PREMIUM: {
    id: 'premium_plan',
    name: 'プレミアムプラン',
    price: 2980,
    currency: 'JPY',
    period: 'monthly',
    description: 'クーポン機能付きプラン',
    features: [
      'ベーシックプランの全機能',
      'クーポン登録・編集機能',
      'クーポン配信機能',
      'お気に入りユーザーへの通知',
      'クーポン利用状況の分析'
    ],
    limitations: [
      '詳細分析は利用不可',
      '高度なマーケティング機能は利用不可'
    ]
  },
  BUSINESS: {
    id: 'business_plan',
    name: 'ビジネスプラン',
    price: 5980,
    currency: 'JPY',
    period: 'monthly',
    description: '全機能付きプラン',
    features: [
      'プレミアムプランの全機能',
      '詳細な分析・レポート',
      '高度なマーケティング機能',
      'カスタム通知設定',
      '優先サポート'
    ],
    limitations: []
  }
};

// 機能別の課金要件
export const FEATURE_REQUIREMENTS = {
  COUPON_MANAGEMENT: {
    requiredPlan: 'premium_plan',
    featureName: 'クーポン管理機能',
    description: 'クーポンの登録・編集・配信が可能'
  },
  PUSH_NOTIFICATIONS: {
    requiredPlan: 'premium_plan',
    featureName: 'プッシュ通知機能',
    description: 'お気に入りユーザーへの通知配信が可能'
  },
  ADVANCED_ANALYTICS: {
    requiredPlan: 'business_plan',
    featureName: '詳細分析機能',
    description: '詳細な利用状況分析とレポート'
  },
  MARKETING_TOOLS: {
    requiredPlan: 'business_plan',
    featureName: 'マーケティング機能',
    description: '高度なマーケティングツール'
  }
};

// 課金状態
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  PENDING: 'pending',
  NONE: 'none'
};

// 課金履歴の型定義
export const SUBSCRIPTION_HISTORY = {
  id: '',
  planId: '',
  status: SUBSCRIPTION_STATUS.NONE,
  startDate: null,
  endDate: null,
  autoRenew: false,
  price: 0,
  currency: 'JPY'
}; 