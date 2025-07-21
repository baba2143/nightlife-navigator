/**
 * カラーパレット定義
 * サイバーパンク/ネオン風のナイトライフテーマ
 */

// ベースカラー
export const baseColors = {
  // プライマリ - エレクトリックブルー/サイアン
  primary: {
    50: '#e0f4ff',
    100: '#b3e5ff',
    200: '#80d6ff',
    300: '#4dc7ff',
    400: '#26baff',
    500: '#00adff', // メインカラー
    600: '#009ceb',
    700: '#0088cc',
    800: '#0074ad',
    900: '#005580',
  },

  // セカンダリ - ネオンピンク/マゼンタ
  secondary: {
    50: '#fde8ff',
    100: '#f9c2ff',
    200: '#f598ff',
    300: '#f06eff',
    400: '#ec4fff',
    500: '#e834ff', // メインカラー
    600: '#d129eb',
    700: '#b61dd1',
    800: '#9b15b7',
    900: '#7a0d91',
  },

  // アクセント - エレクトリックグリーン
  accent: {
    50: '#e8fff0',
    100: '#c2ffd6',
    200: '#98ffba',
    300: '#6eff9e',
    400: '#4fff89',
    500: '#34ff74', // メインカラー
    600: '#29eb66',
    700: '#1dd154',
    800: '#15b743',
    900: '#0d912a',
  },

  // 警告色 - エレクトリックオレンジ
  warning: {
    50: '#fff4e0',
    100: '#ffe0b3',
    200: '#ffcc80',
    300: '#ffb74d',
    400: '#ffa726',
    500: '#ff9800', // メインカラー
    600: '#f57c00',
    700: '#ef6c00',
    800: '#e65100',
    900: '#bf360c',
  },

  // エラー色 - エレクトリックレッド
  error: {
    50: '#ffe8e8',
    100: '#ffc2c2',
    200: '#ff9898',
    300: '#ff6e6e',
    400: '#ff4f4f',
    500: '#ff3434', // メインカラー
    600: '#eb2929',
    700: '#d11d1d',
    800: '#b71515',
    900: '#910d0d',
  },

  // 成功色 - 上記アクセントグリーンを使用
  success: {
    50: '#e8fff0',
    100: '#c2ffd6',
    200: '#98ffba',
    300: '#6eff9e',
    400: '#4fff89',
    500: '#34ff74',
    600: '#29eb66',
    700: '#1dd154',
    800: '#15b743',
    900: '#0d912a',
  },

  // 情報色 - プライマリブルーを使用
  info: {
    50: '#e0f4ff',
    100: '#b3e5ff',
    200: '#80d6ff',
    300: '#4dc7ff',
    400: '#26baff',
    500: '#00adff',
    600: '#009ceb',
    700: '#0088cc',
    800: '#0074ad',
    900: '#005580',
  },
};

// グレースケール（ダーク基調）
export const grayColors = {
  50: '#f7f7f7',
  100: '#e1e1e1',
  200: '#cfcfcf',
  300: '#b1b1b1',
  400: '#9e9e9e',
  500: '#7e7e7e',
  600: '#626262',
  700: '#515151',
  800: '#3b3b3b',
  900: '#222222',
  950: '#0a0a0a', // 最も暗い背景
};

// サイバーパンク特有の背景色
export const backgroundColors = {
  // メイン背景（超ダーク）
  primary: grayColors[950],
  secondary: grayColors[900],
  tertiary: grayColors[800],
  
  // カード/コンテナ背景
  surface: grayColors[900],
  surfaceElevated: grayColors[800],
  
  // オーバーレイ
  overlay: 'rgba(0, 0, 0, 0.85)',
  modalOverlay: 'rgba(0, 0, 0, 0.9)',
  
  // グラデーション背景
  gradientPrimary: `linear-gradient(135deg, ${baseColors.primary[900]} 0%, ${grayColors[950]} 100%)`,
  gradientSecondary: `linear-gradient(135deg, ${baseColors.secondary[900]} 0%, ${grayColors[950]} 100%)`,
  gradientNeon: `linear-gradient(135deg, ${baseColors.primary[500]} 0%, ${baseColors.secondary[500]} 50%, ${baseColors.accent[500]} 100%)`,
};

// テキストカラー
export const textColors = {
  primary: '#ffffff',
  secondary: grayColors[300],
  tertiary: grayColors[500],
  disabled: grayColors[600],
  
  // ネオンテキスト
  neonBlue: baseColors.primary[400],
  neonPink: baseColors.secondary[400],
  neonGreen: baseColors.accent[400],
  
  // インタラクティブ
  link: baseColors.primary[400],
  linkHover: baseColors.primary[300],
};

// ボーダーカラー
export const borderColors = {
  default: grayColors[700],
  light: grayColors[600],
  dark: grayColors[800],
  
  // ネオンボーダー
  neonBlue: baseColors.primary[500],
  neonPink: baseColors.secondary[500],
  neonGreen: baseColors.accent[500],
  
  // 状態別
  focus: baseColors.primary[400],
  error: baseColors.error[500],
  success: baseColors.success[500],
  warning: baseColors.warning[500],
};

// ネオンエフェクトカラー
export const neonColors = {
  blue: {
    color: baseColors.primary[400],
    glow: `0 0 5px ${baseColors.primary[400]}, 0 0 10px ${baseColors.primary[400]}, 0 0 15px ${baseColors.primary[400]}`,
    strongGlow: `0 0 5px ${baseColors.primary[400]}, 0 0 10px ${baseColors.primary[400]}, 0 0 15px ${baseColors.primary[400]}, 0 0 20px ${baseColors.primary[400]}`,
  },
  pink: {
    color: baseColors.secondary[400],
    glow: `0 0 5px ${baseColors.secondary[400]}, 0 0 10px ${baseColors.secondary[400]}, 0 0 15px ${baseColors.secondary[400]}`,
    strongGlow: `0 0 5px ${baseColors.secondary[400]}, 0 0 10px ${baseColors.secondary[400]}, 0 0 15px ${baseColors.secondary[400]}, 0 0 20px ${baseColors.secondary[400]}`,
  },
  green: {
    color: baseColors.accent[400],
    glow: `0 0 5px ${baseColors.accent[400]}, 0 0 10px ${baseColors.accent[400]}, 0 0 15px ${baseColors.accent[400]}`,
    strongGlow: `0 0 5px ${baseColors.accent[400]}, 0 0 10px ${baseColors.accent[400]}, 0 0 15px ${baseColors.accent[400]}, 0 0 20px ${baseColors.accent[400]}`,
  },
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
    info: baseColors.info[500],
  },
  
  rating: {
    excellent: baseColors.accent[400], // 4.5-5.0
    good: baseColors.primary[400],     // 3.5-4.4
    average: baseColors.warning[400],  // 2.5-3.4
    poor: baseColors.error[400],       // 0-2.4
  },
  
  genre: {
    snackPub: baseColors.warning[400],
    club: baseColors.secondary[400],
    conceptCafe: baseColors.accent[400],
    bar: baseColors.primary[400],
  },
};

// エクスポート用の統合カラーオブジェクト
export const colors = {
  ...baseColors,
  gray: grayColors,
  background: backgroundColors,
  text: textColors,
  border: borderColors,
  neon: neonColors,
  semantic: semanticColors,
  
  // よく使用される色の短縮形
  white: '#ffffff',
  black: grayColors[950],
  transparent: 'transparent',
};