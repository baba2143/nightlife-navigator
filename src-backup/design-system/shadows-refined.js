/**
 * 洗練されたシャドウとエレベーション定義
 * 微妙で上品な影効果システム
 */

// 洗練されたシャドウ（より微妙で上品）
export const shadows = {
  none: 'none',
  
  // 基本シャドウ - より微妙で洗練された
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // インナーシャドウ - より微妙
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  innerLg: 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.1)',
  
  // カラードシャドウ - ブランドカラー
  coloredSm: '0 1px 3px 0 rgba(14, 165, 233, 0.15), 0 1px 2px 0 rgba(14, 165, 233, 0.1)',
  coloredMd: '0 4px 6px -1px rgba(14, 165, 233, 0.15), 0 2px 4px -1px rgba(14, 165, 233, 0.1)',
  coloredLg: '0 10px 15px -3px rgba(14, 165, 233, 0.15), 0 4px 6px -2px rgba(14, 165, 233, 0.1)',
};

// ダークモード用シャドウ
export const darkShadows = {
  none: 'none',
  
  // ダークモード基本シャドウ
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
  
  // ダークモード インナーシャドウ
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
  innerLg: 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.3)',
  
  // ダークモード カラードシャドウ
  coloredSm: '0 1px 3px 0 rgba(14, 165, 233, 0.3), 0 1px 2px 0 rgba(14, 165, 233, 0.2)',
  coloredMd: '0 4px 6px -1px rgba(14, 165, 233, 0.3), 0 2px 4px -1px rgba(14, 165, 233, 0.2)',
  coloredLg: '0 10px 15px -3px rgba(14, 165, 233, 0.3), 0 4px 6px -2px rgba(14, 165, 233, 0.2)',
};

// フォーカスリング - アクセシビリティ重視
export const focusRings = {
  // 基本フォーカスリング
  default: '0 0 0 3px rgba(14, 165, 233, 0.2)',
  tight: '0 0 0 2px rgba(14, 165, 233, 0.2)',
  wide: '0 0 0 4px rgba(14, 165, 233, 0.2)',
  
  // 状態別フォーカスリング
  primary: '0 0 0 3px rgba(14, 165, 233, 0.2)',
  secondary: '0 0 0 3px rgba(168, 85, 247, 0.2)',
  success: '0 0 0 3px rgba(34, 197, 94, 0.2)',
  warning: '0 0 0 3px rgba(245, 158, 11, 0.2)',
  error: '0 0 0 3px rgba(239, 68, 68, 0.2)',
  
  // 高コントラスト用フォーカスリング
  highContrast: '0 0 0 2px #000000, 0 0 0 4px #ffffff',
  highContrastDark: '0 0 0 2px #ffffff, 0 0 0 4px #000000',
};

// コンポーネント特化型シャドウ
export const componentShadows = {
  // カードシャドウ
  card: {
    rest: shadows.sm,
    hover: shadows.md,
    active: shadows.xs,
    elevated: shadows.lg,
    floating: shadows.xl,
  },
  
  // ボタンシャドウ
  button: {
    rest: shadows.xs,
    hover: shadows.sm,
    active: 'none',
    primary: shadows.sm,
    secondary: shadows.xs,
  },
  
  // モーダル・ドロップダウン
  modal: shadows['2xl'],
  dropdown: shadows.lg,
  popover: shadows.md,
  tooltip: shadows.sm,
  
  // 入力フィールド
  input: {
    rest: shadows.xs,
    focus: `${shadows.sm}, ${focusRings.default}`,
    error: `${shadows.sm}, 0 0 0 3px rgba(239, 68, 68, 0.2)`,
    success: `${shadows.sm}, 0 0 0 3px rgba(34, 197, 94, 0.2)`,
  },
  
  // ナビゲーション
  navigation: {
    header: shadows.sm,
    sidebar: shadows.md,
    bottomBar: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  
  // 画像・メディア
  image: shadows.md,
  avatar: shadows.sm,
  
  // 通知・アラート
  notification: shadows.lg,
  alert: shadows.md,
  
  // データ表示
  table: shadows.xs,
  tableRow: {
    hover: shadows.sm,
  },
};

// React Native用エレベーション
export const elevations = {
  0: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  4: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  5: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  6: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 6,
  },
};

// カラードエレベーション（React Native用）
export const coloredElevations = {
  primary: {
    sm: {
      shadowColor: '#0ea5e9',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
    md: {
      shadowColor: '#0ea5e9',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 4,
    },
    lg: {
      shadowColor: '#0ea5e9',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 15,
      elevation: 5,
    },
  },
  
  secondary: {
    sm: {
      shadowColor: '#a855f7',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
    md: {
      shadowColor: '#a855f7',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 4,
    },
    lg: {
      shadowColor: '#a855f7',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 15,
      elevation: 5,
    },
  },
};

// シャドウユーティリティ
export const shadowUtils = {
  // シャドウの組み合わせ
  combine: (...shadowValues) => shadowValues.join(', '),
  
  // 動的シャドウ生成
  createShadow: (
    offsetX = 0,
    offsetY = 4,
    blur = 6,
    spread = -1,
    color = 'rgba(0, 0, 0, 0.1)'
  ) => `${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`,
  
  // レイヤードシャドウ
  layered: {
    subtle: [shadows.xs, shadows.sm].join(', '),
    medium: [shadows.sm, shadows.md].join(', '),
    strong: [shadows.md, shadows.lg].join(', '),
  },
};

// エクスポート用の統合シャドウオブジェクト
export const shadowSystem = {
  shadows,
  darkShadows,
  focusRings,
  component: componentShadows,
  elevation: elevations,
  coloredElevation: coloredElevations,
  utils: shadowUtils,
};