// 店舗データ
export const BARS = [
  {
    id: 1,
    name: 'Moon Light',
    genre: 'スナック／パブ',
    rating: 4.8,
    reviewCount: 156,
    area: '銀座',
    address: '東京都中央区銀座8-10-3 B1F',
    phone: '03-1234-5678',
    averagePrice: 3500,
    priceRange: '¥¥¥',
    distance: 120,
    latitude: 35.6719,
    longitude: 139.7658,
    isOpenNow: true,
    ownerId: 'owner1',
    status: 'approved',
    description: '銀座の隠れ家的スナック。ママの人柄と常連客の温かい雰囲気が自慢です。',
    features: ['カウンター席', 'カラオケ', '喫煙可', '深夜営業'],
    drinkMenu: 'ビール、ウイスキー、焼酎、カクテル',
    website: 'https://moonlight-snack.com',
    email: 'info@moonlight-snack.com',
    capacity: 25,
    dressCode: 'なし',
    music: 'カラオケ',
    atmosphere: 'アットホーム',
    createdAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Fairy Tale Cafe',
    genre: 'コンカフェ',
    rating: 4.6,
    reviewCount: 203,
    area: '秋葉原',
    address: '東京都千代田区外神田1-15-16 4F',
    phone: '03-2345-6789',
    averagePrice: 2800,
    priceRange: '¥¥',
    distance: 280,
    latitude: 35.6996,
    longitude: 139.7711,
    isOpenNow: true,
    ownerId: 'owner2',
    status: 'approved',
    description: 'メイドカフェの進化系。ファンタジーの世界観で非日常を体験できるコンセプトカフェです。',
    features: ['テーブル席', 'コスプレ', '撮影OK', 'イベント開催'],
    drinkMenu: 'オリジナルドリンク、ソフトドリンク、軽食',
    capacity: 30,
    dressCode: 'なし',
    music: 'アニソン・ゲーム音楽',
    atmosphere: 'ファンタジー'
  },
  {
    id: 3,
    name: 'Velvet Lounge',
    genre: 'クラブ／ラウンジ',
    rating: 4.7,
    reviewCount: 124,
    area: '六本木',
    address: '東京都港区六本木3-12-5 7F',
    phone: '03-3456-7890',
    averagePrice: 5000,
    priceRange: '¥¥¥¥',
    distance: 450,
    latitude: 35.6641,
    longitude: 139.7340,
    isOpenNow: false,
    ownerId: 'owner3',
    status: 'approved',
    description: '大人の社交場。上質な空間で優雅なひとときをお過ごしください。',
    features: ['VIP席', '個室', 'ドレスコード有', 'DJ在籍'],
    drinkMenu: 'シャンパン、ワイン、プレミアムウイスキー',
    capacity: 100,
    dressCode: 'スマートカジュアル',
    music: 'ハウス・R&B',
    atmosphere: 'ラグジュアリー'
  }
];

// キャストデータ
export const CASTS = [
  {
    id: 'cast1',
    barId: 1,
    name: 'ママ',
    role: 'ママ',
    photo: '👩‍💼',
    profile: '20年の経験を持つベテランママ。お客様一人ひとりとの会話を大切にしています。',
    experience: '20年',
    bloodType: 'A型',
    hobby: 'カラオケ、料理'
  },
  {
    id: 'cast2',
    barId: 1,
    name: 'ゆき',
    role: 'キャスト',
    photo: '👩',
    profile: '明るく元気な性格で、楽しい時間をお約束します！',
    experience: '3年',
    bloodType: 'O型',
    hobby: 'ダンス、映画鑑賞'
  },
  {
    id: 'cast3',
    barId: 2,
    name: 'みく',
    role: 'メイド長',
    photo: '👩‍🎤',
    profile: 'ファンタジーの世界へようこそ！一緒に楽しい時間を過ごしましょう♪',
    experience: '5年',
    bloodType: 'B型',
    hobby: 'アニメ、ゲーム'
  }
];

// レビューデータ
export const REVIEWS = [
  {
    id: 'r1',
    barId: 1,
    userId: 'user1',
    userName: 'ナイトライフ愛好家',
    rating: 5,
    comment: 'ママさんが最高！常連さんも優しくて、初めてでも楽しめました。カラオケも盛り上がって楽しい夜でした。',
    visitDate: '2024-01-15',
    drinkPrice: '3500',
    occasion: '友人との飲み',
    withWhom: '友人',
    photos: ['🍺', '🎤'],
    createdAt: '2024-01-16T22:30:00Z',
    helpfulCount: 18,
    isHelpful: false,
    ownerReply: null
  },
  {
    id: 'r2',
    barId: 2,
    userId: 'user2',
    userName: '秋葉原通い',
    rating: 4,
    comment: 'コンセプトが面白い！スタッフさんのパフォーマンスも素晴らしく、非日常を楽しめました。',
    visitDate: '2024-01-10',
    drinkPrice: '2800',
    occasion: '観光',
    withWhom: '一人',
    photos: ['☕', '🎭'],
    createdAt: '2024-01-11T15:20:00Z',
    helpfulCount: 12,
    isHelpful: false,
    ownerReply: {
      content: 'ご来店ありがとうございます！楽しんでいただけて嬉しいです。またのご来店をお待ちしております♪',
      createdAt: '2024-01-12T12:00:00Z',
      isPublic: true
    }
  }
];

// 出勤スケジュール
export const SCHEDULES = [
  {
    id: 'sch1',
    castId: 'cast1',
    barId: 1,
    date: new Date().toISOString().split('T')[0],
    startTime: '20:00',
    endTime: '02:00'
  },
  {
    id: 'sch2',
    castId: 'cast2',
    barId: 1,
    date: new Date().toISOString().split('T')[0],
    startTime: '21:00',
    endTime: '03:00'
  },
  {
    id: 'sch3',
    castId: 'cast3',
    barId: 2,
    date: new Date().toISOString().split('T')[0],
    startTime: '17:00',
    endTime: '23:00'
  }
];

// ジャンル一覧
export const GENRES = [
  { id: 'snack', name: 'スナック／パブ', icon: '🍺', description: 'カラオケ・ママのいる店' },
  { id: 'concept', name: 'コンカフェ', icon: '☕', description: 'コンセプトカフェ' },
  { id: 'club', name: 'クラブ／ラウンジ', icon: '🍸', description: '高級・会員制' }
];

// 価格帯
export const PRICE_RANGES = ['¥', '¥¥', '¥¥¥', '¥¥¥¥'];

// 設備・サービス
export const FEATURES = [
  'カウンター席', '個室', 'テーブル席', 'VIP席', 'カラオケ', 'ダーツ', 
  'ビリヤード', 'DJ設備', '撮影OK', 'コスプレ', 'イベント開催', '深夜営業'
];

// ドレスコード
export const DRESS_CODES = ['なし', 'カジュアル', 'スマートカジュアル', 'フォーマル']; 

// クーポン・特典の種類
export const COUPON_TYPES = {
  STORE_COUPON: 'store_coupon',      // 店舗クーポン
  RAINY_DAY: 'rainy_day',            // 雨の日クーポン
  TIME_SALE: 'time_sale',            // タイムセール
  FIRST_TIME: 'first_time',          // 初回割引
  BIRTHDAY: 'birthday',              // 誕生日特典
  REPEATER: 'repeater'               // リピーター特典
};

// クーポンアイコン
export const COUPON_ICONS = {
  [COUPON_TYPES.STORE_COUPON]: '🎫',
  [COUPON_TYPES.RAINY_DAY]: '🌧️',
  [COUPON_TYPES.TIME_SALE]: '⏰',
  [COUPON_TYPES.FIRST_TIME]: '🎉',
  [COUPON_TYPES.BIRTHDAY]: '🎂',
  [COUPON_TYPES.REPEATER]: '🔄'
};

// クーポンカラー
export const COUPON_COLORS = {
  [COUPON_TYPES.STORE_COUPON]: '#4CAF50',
  [COUPON_TYPES.RAINY_DAY]: '#2196F3',
  [COUPON_TYPES.TIME_SALE]: '#FF9800',
  [COUPON_TYPES.FIRST_TIME]: '#9C27B0',
  [COUPON_TYPES.BIRTHDAY]: '#E91E63',
  [COUPON_TYPES.REPEATER]: '#607D8B'
};

// クーポン・特典のデータ
export const COUPONS = [
  // 店舗クーポン
  {
    id: 'coupon_1',
    type: COUPON_TYPES.STORE_COUPON,
    barId: 1,
    title: 'ドリンク1杯サービス',
    description: 'ビール、カクテル、ソフトドリンクから1杯無料',
    discount: '100%OFF',
    discountAmount: 800,
    conditions: ['要予約', '1人1回限り'],
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    isActive: true,
    usageLimit: 100,
    usedCount: 45
  },
  {
    id: 'coupon_2',
    type: COUPON_TYPES.STORE_COUPON,
    barId: 2,
    title: 'フードメニュー20%OFF',
    description: 'おつまみ、軽食メニューが20%割引',
    discount: '20%OFF',
    discountAmount: null,
    conditions: ['ドリンク注文必須'],
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    isActive: true,
    usageLimit: 200,
    usedCount: 78
  },
  {
    id: 'coupon_3',
    type: COUPON_TYPES.STORE_COUPON,
    barId: 3,
    title: '2時間飲み放題',
    description: '2時間限定でドリンク飲み放題',
    discount: '50%OFF',
    discountAmount: 2000,
    conditions: ['要予約', '2時間限定'],
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    isActive: true,
    usageLimit: 50,
    usedCount: 12
  },

  // 雨の日クーポン
  {
    id: 'rainy_1',
    type: COUPON_TYPES.RAINY_DAY,
    barId: 1,
    title: '雨の日限定 ホットドリンクサービス',
    description: '雨の日限定でホットドリンク1杯無料',
    discount: '100%OFF',
    discountAmount: 600,
    conditions: ['雨の日限定', '要予約'],
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    isActive: true,
    usageLimit: 30,
    usedCount: 8
  },
  {
    id: 'rainy_2',
    type: COUPON_TYPES.RAINY_DAY,
    barId: 2,
    title: '雨の日 タクシー代補助',
    description: '雨の日のタクシー代を500円補助',
    discount: '500円補助',
    discountAmount: 500,
    conditions: ['雨の日限定', 'タクシー利用時'],
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    isActive: true,
    usageLimit: 20,
    usedCount: 3
  },

  // タイムセール
  {
    id: 'time_1',
    type: COUPON_TYPES.TIME_SALE,
    barId: 1,
    title: 'ハッピーアワー 17:00-19:00',
    description: '17:00-19:00限定でドリンク半額',
    discount: '50%OFF',
    discountAmount: null,
    conditions: ['17:00-19:00限定', 'ドリンクのみ'],
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    isActive: true,
    usageLimit: 1000,
    usedCount: 234
  },
  {
    id: 'time_2',
    type: COUPON_TYPES.TIME_SALE,
    barId: 3,
    title: '深夜割引 23:00-02:00',
    description: '23:00-02:00限定で全メニュー30%OFF',
    discount: '30%OFF',
    discountAmount: null,
    conditions: ['23:00-02:00限定'],
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    isActive: true,
    usageLimit: 500,
    usedCount: 156
  },

  // 初回割引
  {
    id: 'first_1',
    type: COUPON_TYPES.FIRST_TIME,
    barId: 1,
    title: '初回限定 全メニュー20%OFF',
    description: '初回来店限定で全メニュー20%割引',
    discount: '20%OFF',
    discountAmount: null,
    conditions: ['初回来店限定', '要予約'],
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    isActive: true,
    usageLimit: 1000,
    usedCount: 89
  },
  {
    id: 'first_2',
    type: COUPON_TYPES.FIRST_TIME,
    barId: 2,
    title: '初回限定 ドリンク1杯無料',
    description: '初回来店限定でドリンク1杯無料',
    discount: '100%OFF',
    discountAmount: 800,
    conditions: ['初回来店限定'],
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    isActive: true,
    usageLimit: 1000,
    usedCount: 67
  },

  // 誕生日特典
  {
    id: 'birthday_1',
    type: COUPON_TYPES.BIRTHDAY,
    barId: 1,
    title: '誕生日限定 ケーキサービス',
    description: '誕生日限定でケーキ1個無料',
    discount: '100%OFF',
    discountAmount: 500,
    conditions: ['誕生日限定', '要予約'],
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    isActive: true,
    usageLimit: 1000,
    usedCount: 23
  },
  {
    id: 'birthday_2',
    type: COUPON_TYPES.BIRTHDAY,
    barId: 3,
    title: '誕生日限定 全メニュー30%OFF',
    description: '誕生日限定で全メニュー30%割引',
    discount: '30%OFF',
    discountAmount: null,
    conditions: ['誕生日限定', '要予約'],
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    isActive: true,
    usageLimit: 1000,
    usedCount: 45
  },

  // リピーター特典
  {
    id: 'repeater_1',
    type: COUPON_TYPES.REPEATER,
    barId: 1,
    title: 'リピーター限定 ドリンク1杯無料',
    description: '2回目以降の来店でドリンク1杯無料',
    discount: '100%OFF',
    discountAmount: 800,
    conditions: ['2回目以降限定'],
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    isActive: true,
    usageLimit: 1000,
    usedCount: 123
  },
  {
    id: 'repeater_2',
    type: COUPON_TYPES.REPEATER,
    barId: 2,
    title: 'リピーター限定 フードメニュー無料',
    description: '3回目以降の来店でフードメニュー1品無料',
    discount: '100%OFF',
    discountAmount: 600,
    conditions: ['3回目以降限定'],
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    isActive: true,
    usageLimit: 1000,
    usedCount: 78
  }
];

// ユーザーのクーポン利用履歴
export const USER_COUPONS = [
  {
    id: 'user_coupon_1',
    couponId: 'coupon_1',
    userId: 'user1',
    barId: 1,
    usedAt: '2024-01-15T20:30:00Z',
    isUsed: true
  },
  {
    id: 'user_coupon_2',
    couponId: 'time_1',
    userId: 'user1',
    barId: 1,
    usedAt: null,
    isUsed: false
  },
  {
    id: 'user_coupon_3',
    couponId: 'first_1',
    userId: 'user1',
    barId: 1,
    usedAt: '2024-01-10T19:00:00Z',
    isUsed: true
  }
];

 