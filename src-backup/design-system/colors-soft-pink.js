/**
 * やさしいピンクアクセントのカラーパレット定義
 * 柔らかく親しみやすいデザインテーマ
 */

// ベースカラー - やさしいピンク系
export const baseColors = {
  // プライマリ - やさしいピンク
  primary: {
    50: '#fef7f7',
    100: '#fdeaeb',
    200: '#facdd4',
    300: '#f7a8b4',
    400: '#f27790',
    500: '#ea5a7b', // メインピンク
    600: '#d63c5e',
    700: '#b62f4a',
    800: '#972b41',
    900: '#80293d',
  },

  // セカンダリ - 補完的なローズピンク
  secondary: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e', // ローズピンク
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
  },

  // アクセント - 明るいピンク
  accent: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899', // 明るいピンク
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  },

  // 成功色 - やさしいグリーン
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

  // 警告色 - やさしいオレンジ
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // エラー色 - やさしいレッド
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // 情報色 - やさしいブルー
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
};

// やさしいグレースケール
export const grayColors = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#eeeeee',
  300: '#e0e0e0',
  400: '#bdbdbd',
  500: '#9e9e9e',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121',
};

// 柔らかい背景色
export const backgroundColors = {
  // メイン背景（純白ベース）
  primary: '#ffffff',
  secondary: '#fafafa',
  tertiary: '#f5f5f5',
  
  // カード背景
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  surfaceSoft: '#fefbfb', // 極薄ピンク
  
  // ピンクアクセント背景
  pinkLight: '#fef7f7',
  pinkSoft: '#fdeaeb',
  pinkAccent: baseColors.primary[50],
  
  // オーバーレイ
  overlay: 'rgba(0, 0, 0, 0.15)',
  overlayLight: 'rgba(0, 0, 0, 0.05)',
  modalOverlay: 'rgba(0, 0, 0, 0.3)',
  
  // 微妙なグラデーション
  gradientSoft: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
  gradientPink: 'linear-gradient(135deg, #fef7f7 0%, #fdeaeb 100%)',
  gradientCard: 'linear-gradient(135deg, #ffffff 0%, #fefbfb 100%)',
};

// やさしいテキストカラー
export const textColors = {
  // プライマリテキスト
  primary: '#1a1a1a',
  secondary: '#666666',
  tertiary: '#999999',
  disabled: '#cccccc',
  
  // ピンクテキスト
  pink: baseColors.primary[500],
  pinkLight: baseColors.primary[400],
  pinkDark: baseColors.primary[600],
  
  // ブランドテキスト
  brand: baseColors.primary[500],
  brandLight: baseColors.primary[400],
  brandDark: baseColors.primary[600],
  
  // インタラクティブ
  link: baseColors.primary[500],
  linkHover: baseColors.primary[600],
  
  // 状態テキスト
  success: baseColors.success[600],
  warning: baseColors.warning[600],
  error: baseColors.error[600],
  info: baseColors.info[600],
  
  // 背景上のテキスト
  onPrimary: '#ffffff',
  onSecondary: '#ffffff',
  onSurface: '#1a1a1a',
};

// やさしいボーダーカラー
export const borderColors = {
  // 基本ボーダー
  default: '#f0f0f0',
  light: '#f8f8f8',
  medium: '#e8e8e8',
  strong: '#d0d0d0',
  
  // ピンクボーダー
  pink: baseColors.primary[200],
  pinkLight: baseColors.primary[100],
  pinkMedium: baseColors.primary[300],
  pinkStrong: baseColors.primary[400],
  
  // 状態ボーダー
  focus: baseColors.primary[300],
  focusRing: baseColors.primary[200],
  error: baseColors.error[300],
  success: baseColors.success[300],
  warning: baseColors.warning[300],
  
  // インタラクティブ
  hover: baseColors.primary[200],
  active: baseColors.primary[300],
  pressed: baseColors.primary[400],
};

// セマンティックカラー
export const semanticColors = {
  // ブランドカラー
  brand: {
    primary: baseColors.primary[500],
    secondary: baseColors.secondary[500],
    accent: baseColors.accent[500],
    light: baseColors.primary[100],
    dark: baseColors.primary[700],
  },
  
  // 状態カラー
  status: {
    success: baseColors.success[500],
    warning: baseColors.warning[500],
    error: baseColors.error[500],
    info: baseColors.info[500],
  },
  
  // 評価カラー
  rating: {
    excellent: baseColors.success[500],  // 4.5-5.0
    good: baseColors.info[500],         // 3.5-4.4
    average: baseColors.warning[500],   // 2.5-3.4
    poor: baseColors.error[500],        // 0-2.4
  },
  
  // 会場タイプカラー
  venue: {
    bar: baseColors.primary[500],        // バー
    club: baseColors.secondary[500],     // クラブ
    restaurant: baseColors.accent[500],  // レストラン
    cafe: baseColors.warning[500],       // カフェ
    lounge: baseColors.info[500],        // ラウンジ
  },
  
  // UI要素カラー
  ui: {
    search: baseColors.primary[500],     // 検索
    navigation: baseColors.primary[500], // ナビゲーション
    button: baseColors.primary[500],     // ボタン
    icon: baseColors.primary[500],       // アイコン
    badge: baseColors.primary[500],      // バッジ
  },
};

// インタラクション状態カラー
export const interactionColors = {
  // ホバー状態
  hover: {
    primary: baseColors.primary[50],
    secondary: baseColors.secondary[50],
    surface: '#f8f8f8',
    pink: baseColors.primary[50],
  },
  
  // アクティブ状態
  active: {
    primary: baseColors.primary[100],
    secondary: baseColors.secondary[100],
    surface: '#f0f0f0',
    pink: baseColors.primary[100],
  },
  
  // フォーカス状態
  focus: {
    primary: baseColors.primary[100],
    ring: baseColors.primary[200],
    outline: baseColors.primary[300],
  },
  
  // 選択状態
  selected: {
    primary: baseColors.primary[100],
    secondary: baseColors.secondary[100],
    background: baseColors.primary[50],
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
  interaction: interactionColors,
  
  // よく使用される色の短縮形
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  
  // ブランドカラー簡単アクセス
  brand: baseColors.primary[500],
  brandLight: baseColors.primary[400],
  brandDark: baseColors.primary[600],
  brandSoft: baseColors.primary[50],
  
  // 現在のテーマカラー
  current: {
    primary: baseColors.primary[500],
    secondary: baseColors.secondary[500],
    accent: baseColors.accent[500],
    background: backgroundColors.primary,
    surface: backgroundColors.surface,
    text: textColors.primary,
    border: borderColors.default,
  },
};