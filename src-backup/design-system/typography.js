/**
 * タイポグラフィ定義
 * サイバーパンク/未来的なフォントシステム
 */

// フォントファミリー
export const fontFamilies = {
  // メインフォント - モダンでクリーンな Sans-serif
  primary: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Oxygen',
    'Ubuntu',
    'Cantarell',
    'sans-serif'
  ].join(', '),
  
  // ヘッドライン用 - 未来的でインパクトのあるフォント
  heading: [
    'Orbitron',
    'Rajdhani',
    'Exo 2',
    'Arial Black',
    'sans-serif'
  ].join(', '),
  
  // モノスペースフォント - コード・データ表示用
  mono: [
    'Fira Code',
    'SF Mono',
    'Monaco',
    'Inconsolata',
    'Roboto Mono',
    'Consolas',
    'monospace'
  ].join(', '),
  
  // ディスプレイフォント - 特別な表示用
  display: [
    'Orbitron',
    'Electrolize',
    'Audiowide',
    'Arial Black',
    'sans-serif'
  ].join(', '),
};

// フォントサイズ（レスポンシブ対応）
export const fontSizes = {
  // 基本テキストサイズ
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  
  // ヘッダーサイズ
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 64,
  
  // 特別なサイズ
  tiny: 10,
  huge: 72,
  display: 96,
};

// フォントウェイト
export const fontWeights = {
  thin: 100,
  extraLight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semiBold: 600,
  bold: 700,
  extraBold: 800,
  black: 900,
};

// 行の高さ
export const lineHeights = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
};

// 文字間隔
export const letterSpacings = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
  
  // ネオン効果用の広めのスペーシング
  neon: '0.05em',
  display: '0.1em',
};

// テキストスタイル定義
export const textStyles = {
  // ヘッダースタイル
  h1: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['5xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.tight,
  },
  
  h2: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.tight,
  },
  
  h3: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacings.normal,
  },
  
  h4: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.snug,
  },
  
  h5: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
  },
  
  h6: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
  },
  
  // ボディテキスト
  bodyLarge: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
  },
  
  body: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
  },
  
  bodySmall: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
  },
  
  // UI要素用テキスト
  button: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacings.wide,
  },
  
  buttonSmall: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacings.wide,
  },
  
  buttonLarge: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacings.wide,
  },
  
  // キャプション・ラベル
  caption: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
  },
  
  label: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
  },
  
  // 特別なスタイル
  neonTitle: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.neon,
    textTransform: 'uppercase',
  },
  
  neonSubtitle: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacings.neon,
    textTransform: 'uppercase',
  },
  
  code: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
  },
  
  // データ表示用
  dataLarge: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.none,
  },
  
  data: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.none,
  },
  
  dataSmall: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
  },
};

// レスポンシブタイポグラフィ
export const responsiveTextStyles = {
  heroTitle: {
    base: {
      ...textStyles.neonTitle,
      fontSize: fontSizes['4xl'],
    },
    md: {
      fontSize: fontSizes['5xl'],
    },
    lg: {
      fontSize: fontSizes['6xl'],
    },
  },
  
  pageTitle: {
    base: {
      ...textStyles.h1,
      fontSize: fontSizes['3xl'],
    },
    md: {
      fontSize: fontSizes['4xl'],
    },
    lg: {
      fontSize: fontSizes['5xl'],
    },
  },
  
  sectionTitle: {
    base: {
      ...textStyles.h2,
      fontSize: fontSizes['2xl'],
    },
    md: {
      fontSize: fontSizes['3xl'],
    },
  },
};

// ネオンテキストエフェクト
export const neonTextEffects = {
  blue: {
    textShadow: '0 0 5px #00adff, 0 0 10px #00adff, 0 0 15px #00adff',
    color: '#4dc7ff',
  },
  
  pink: {
    textShadow: '0 0 5px #e834ff, 0 0 10px #e834ff, 0 0 15px #e834ff',
    color: '#f06eff',
  },
  
  green: {
    textShadow: '0 0 5px #34ff74, 0 0 10px #34ff74, 0 0 15px #34ff74',
    color: '#6eff9e',
  },
  
  // アニメーション付きネオンエフェクト
  pulseBlue: {
    ...textStyles.neonTitle,
    color: '#4dc7ff',
    animation: 'neonPulseBlue 2s ease-in-out infinite alternate',
  },
  
  pulsePink: {
    ...textStyles.neonTitle,
    color: '#f06eff',
    animation: 'neonPulsePink 2s ease-in-out infinite alternate',
  },
};

// エクスポート用の統合タイポグラフィオブジェクト
export const typography = {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
  textStyles,
  responsiveTextStyles,
  neonTextEffects,
};