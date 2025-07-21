/**
 * 洗練されたカラーパレット定義
 * シンプルでモダンなナイトライフテーマ
 */

// ベースカラー - より洗練されたトーン
export const baseColors = {
  // プライマリ - 落ち着いたブルー
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // メインカラー
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // セカンダリ - エレガントなパープル
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7', // メインカラー
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },

  // アクセント - 洗練されたグリーン
  accent: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // メインカラー
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // 警告色 - 洗練されたオレンジ
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // メインカラー
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // エラー色 - 洗練されたレッド
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // メインカラー
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // 成功色 - アクセントグリーンを使用
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
};

// 洗練されたグレースケール
export const grayColors = {
  50: '#fafafa',
  100: '#f4f4f5',
  200: '#e4e4e7',
  300: '#d4d4d8',
  400: '#a1a1aa',
  500: '#71717a',
  600: '#52525b',
  700: '#3f3f46',
  800: '#27272a',
  900: '#18181b',
  950: '#09090b',
};

// 洗練された背景色
export const backgroundColors = {
  // メイン背景（ソフトダーク）
  primary: '#fafafa',
  secondary: '#f4f4f5',
  tertiary: '#e4e4e7',
  
  // ダークモード背景
  primaryDark: '#18181b',
  secondaryDark: '#27272a',
  tertiaryDark: '#3f3f46',
  
  // カード/コンテナ背景
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  surfaceDark: '#27272a',
  surfaceElevatedDark: '#3f3f46',
  
  // オーバーレイ
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',
  modalOverlay: 'rgba(0, 0, 0, 0.75)',
  
  // 微妙なグラデーション
  gradientSubtle: 'linear-gradient(135deg, #fafafa 0%, #f4f4f5 100%)',
  gradientCard: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
};

// 洗練されたテキストカラー
export const textColors = {
  // ライトモード
  primary: '#18181b',
  secondary: '#52525b',
  tertiary: '#71717a',
  disabled: '#a1a1aa',
  
  // ダークモード
  primaryDark: '#fafafa',
  secondaryDark: '#d4d4d8',
  tertiaryDark: '#a1a1aa',
  disabledDark: '#52525b',
  
  // インタラクティブ
  link: baseColors.primary[600],
  linkHover: baseColors.primary[700],
  linkDark: baseColors.primary[400],
  linkHoverDark: baseColors.primary[300],
};

// 洗練されたボーダーカラー
export const borderColors = {
  // ライトモード
  default: '#e4e4e7',
  light: '#f4f4f5',
  medium: '#d4d4d8',
  strong: '#a1a1aa',
  
  // ダークモード
  defaultDark: '#3f3f46',
  lightDark: '#27272a',
  mediumDark: '#52525b',
  strongDark: '#71717a',
  
  // 状態別
  focus: baseColors.primary[500],
  error: baseColors.error[500],
  success: baseColors.success[500],
  warning: baseColors.warning[500],
  
  // フォーカス時（ライトボックスシャドウ用）
  focusRing: baseColors.primary[500] + '40', // 25% opacity
};

// セマンティックカラー
export const semanticColors = {
  brand: {
    primary: baseColors.primary[500],
    secondary: baseColors.secondary[500],
    accent: baseColors.accent[500],
  },
  
  status: {
    success: baseColors.success[500],
    warning: baseColors.warning[500],
    error: baseColors.error[500],
    info: baseColors.primary[500],
  },
  
  rating: {
    excellent: baseColors.success[500],  // 4.5-5.0
    good: baseColors.primary[500],       // 3.5-4.4
    average: baseColors.warning[500],    // 2.5-3.4
    poor: baseColors.error[500],         // 0-2.4
  },
  
  venue: {
    bar: baseColors.primary[500],
    club: baseColors.secondary[500],
    restaurant: baseColors.accent[500],
    cafe: baseColors.warning[500],
  },
};

// エクスポート用の統合カラーオブジェクト
export const colors = {
  ...baseColors,
  gray: grayColors,
  background: backgroundColors,
  text: textColors,
  border: borderColors,
  semantic: semanticColors,
  
  // よく使用される色の短縮形
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  
  // 現在のテーマ（ライトモード）
  current: {
    background: {
      primary: backgroundColors.primary,
      secondary: backgroundColors.secondary,
      surface: backgroundColors.surface,
      surfaceElevated: backgroundColors.surfaceElevated,
    },
    text: {
      primary: textColors.primary,
      secondary: textColors.secondary,
      tertiary: textColors.tertiary,
    },
    border: {
      default: borderColors.default,
      light: borderColors.light,
      focus: borderColors.focus,
    },
  },
};