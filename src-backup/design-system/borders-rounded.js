/**
 * 角丸統一ボーダーシステム定義
 * 全要素を角丸で統一した柔らかいデザイン
 */

// 角丸の基本サイズ
export const borderRadius = {
  // 基本的な角丸
  none: 0,
  xs: 4,      // 小さな角丸
  sm: 8,      // 小さめの角丸
  md: 12,     // 標準の角丸
  lg: 16,     // 大きめの角丸
  xl: 20,     // 大きな角丸
  '2xl': 24,  // より大きな角丸
  '3xl': 28,  // 非常に大きな角丸
  full: 9999, // 完全な丸
  
  // 特別なサイズ
  button: 12,    // ボタン用
  card: 16,      // カード用
  input: 12,     // インプット用
  modal: 20,     // モーダル用
  badge: 20,     // バッジ用（pill型）
  avatar: 9999,  // アバター用（円形）
  image: 12,     // 画像用
  container: 16, // コンテナ用
};

// コンポーネント別の角丸設定
export const componentBorderRadius = {
  // ボタン
  button: {
    small: borderRadius.sm,     // 8px
    medium: borderRadius.md,    // 12px
    large: borderRadius.lg,     // 16px
    pill: borderRadius.full,    // 完全な丸
  },
  
  // カード
  card: {
    small: borderRadius.md,     // 12px
    medium: borderRadius.lg,    // 16px
    large: borderRadius.xl,     // 20px
    featured: borderRadius['2xl'], // 24px
  },
  
  // インプット
  input: {
    small: borderRadius.sm,     // 8px
    medium: borderRadius.md,    // 12px
    large: borderRadius.lg,     // 16px
    search: borderRadius.xl,    // 20px（検索バー）
  },
  
  // バッジ
  badge: {
    small: borderRadius.sm,     // 8px
    medium: borderRadius.md,    // 12px
    large: borderRadius.lg,     // 16px
    pill: borderRadius.full,    // 完全な丸
  },
  
  // モーダル・ダイアログ
  modal: {
    small: borderRadius.lg,     // 16px
    medium: borderRadius.xl,    // 20px
    large: borderRadius['2xl'], // 24px
  },
  
  // ナビゲーション
  navigation: {
    tab: borderRadius.md,       // 12px
    pill: borderRadius.full,    // 完全な丸
    segment: borderRadius.sm,   // 8px
  },
  
  // 画像・メディア
  image: {
    small: borderRadius.sm,     // 8px
    medium: borderRadius.md,    // 12px
    large: borderRadius.lg,     // 16px
    hero: borderRadius.xl,      // 20px
  },
  
  // アバター
  avatar: {
    square: borderRadius.md,    // 12px
    rounded: borderRadius.lg,   // 16px
    circle: borderRadius.full,  // 完全な丸
  },
  
  // アイコン
  icon: {
    background: borderRadius.sm, // 8px
    button: borderRadius.md,     // 12px
    large: borderRadius.lg,      // 16px
  },
  
  // コンテナ
  container: {
    section: borderRadius.lg,    // 16px
    panel: borderRadius.xl,      // 20px
    overlay: borderRadius['2xl'], // 24px
  },
  
  // 通知・アラート
  notification: {
    toast: borderRadius.md,      // 12px
    alert: borderRadius.lg,      // 16px
    banner: borderRadius.sm,     // 8px
  },
  
  // フォーム要素
  form: {
    field: borderRadius.md,      // 12px
    fieldset: borderRadius.lg,   // 16px
    checkbox: borderRadius.xs,   // 4px
    radio: borderRadius.full,    // 完全な丸
    switch: borderRadius.full,   // 完全な丸
  },
  
  // データ表示
  table: {
    cell: borderRadius.xs,       // 4px
    row: borderRadius.sm,        // 8px
    container: borderRadius.lg,  // 16px
  },
  
  // プログレス・ローディング
  progress: {
    bar: borderRadius.full,      // 完全な丸
    circle: borderRadius.full,   // 完全な丸
    container: borderRadius.sm,  // 8px
  },
};

// レスポンシブ角丸
export const responsiveBorderRadius = {
  // 画面サイズに応じた角丸
  card: {
    xs: borderRadius.md,         // モバイル: 12px
    sm: borderRadius.lg,         // タブレット: 16px
    md: borderRadius.xl,         // デスクトップ: 20px
    lg: borderRadius['2xl'],     // 大画面: 24px
  },
  
  modal: {
    xs: borderRadius.lg,         // モバイル: 16px
    sm: borderRadius.xl,         // タブレット: 20px
    md: borderRadius['2xl'],     // デスクトップ: 24px
    lg: borderRadius['3xl'],     // 大画面: 28px
  },
  
  button: {
    xs: borderRadius.sm,         // モバイル: 8px
    sm: borderRadius.md,         // タブレット: 12px
    md: borderRadius.lg,         // デスクトップ: 16px
  },
  
  container: {
    xs: borderRadius.sm,         // モバイル: 8px
    sm: borderRadius.md,         // タブレット: 12px
    md: borderRadius.lg,         // デスクトップ: 16px
    lg: borderRadius.xl,         // 大画面: 20px
  },
};

// 特別な角丸パターン
export const specialBorderRadius = {
  // 非対称の角丸
  topRounded: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  
  bottomRounded: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
  
  leftRounded: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: 0,
  },
  
  rightRounded: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: borderRadius.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: borderRadius.lg,
  },
  
  // グラデーション角丸
  gradientRounded: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  
  // 内側の角丸
  innerRounded: {
    borderRadius: borderRadius.md,
    margin: 2,
  },
  
  // 外側の角丸
  outerRounded: {
    borderRadius: borderRadius.xl,
    padding: 2,
  },
};

// 角丸ユーティリティ
export const borderRadiusUtils = {
  // 角丸の生成
  create: (size) => ({
    borderRadius: typeof size === 'string' ? borderRadius[size] : size,
  }),
  
  // 個別の角丸設定
  top: (size) => ({
    borderTopLeftRadius: typeof size === 'string' ? borderRadius[size] : size,
    borderTopRightRadius: typeof size === 'string' ? borderRadius[size] : size,
  }),
  
  bottom: (size) => ({
    borderBottomLeftRadius: typeof size === 'string' ? borderRadius[size] : size,
    borderBottomRightRadius: typeof size === 'string' ? borderRadius[size] : size,
  }),
  
  left: (size) => ({
    borderTopLeftRadius: typeof size === 'string' ? borderRadius[size] : size,
    borderBottomLeftRadius: typeof size === 'string' ? borderRadius[size] : size,
  }),
  
  right: (size) => ({
    borderTopRightRadius: typeof size === 'string' ? borderRadius[size] : size,
    borderBottomRightRadius: typeof size === 'string' ? borderRadius[size] : size,
  }),
  
  // カスタム角丸
  custom: (topLeft, topRight, bottomRight, bottomLeft) => ({
    borderTopLeftRadius: topLeft,
    borderTopRightRadius: topRight,
    borderBottomRightRadius: bottomRight,
    borderBottomLeftRadius: bottomLeft,
  }),
  
  // 角丸のスケール
  scale: (baseSize, scale) => {
    const base = typeof baseSize === 'string' ? borderRadius[baseSize] : baseSize;
    return base * scale;
  },
};

// 角丸のアニメーション
export const borderRadiusAnimations = {
  // ホバー時の角丸変化
  hover: {
    from: borderRadius.md,
    to: borderRadius.lg,
    duration: 200,
    easing: 'ease-in-out',
  },
  
  // フォーカス時の角丸変化
  focus: {
    from: borderRadius.md,
    to: borderRadius.xl,
    duration: 150,
    easing: 'ease-out',
  },
  
  // アクティブ時の角丸変化
  active: {
    from: borderRadius.md,
    to: borderRadius.sm,
    duration: 100,
    easing: 'ease-in',
  },
};

// テーマ別の角丸設定
export const themeBorderRadius = {
  // 柔らかいテーマ
  soft: {
    card: borderRadius.xl,      // 20px
    button: borderRadius.lg,    // 16px
    input: borderRadius.md,     // 12px
    modal: borderRadius['2xl'], // 24px
  },
  
  // 標準テーマ
  standard: {
    card: borderRadius.lg,      // 16px
    button: borderRadius.md,    // 12px
    input: borderRadius.md,     // 12px
    modal: borderRadius.xl,     // 20px
  },
  
  // シャープテーマ
  sharp: {
    card: borderRadius.sm,      // 8px
    button: borderRadius.sm,    // 8px
    input: borderRadius.sm,     // 8px
    modal: borderRadius.md,     // 12px
  },
};

// エクスポート用の統合角丸オブジェクト
export const borderRadiusSystem = {
  borderRadius,
  component: componentBorderRadius,
  responsive: responsiveBorderRadius,
  special: specialBorderRadius,
  utils: borderRadiusUtils,
  animations: borderRadiusAnimations,
  theme: themeBorderRadius,
};