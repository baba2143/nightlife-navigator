/**
 * 洗練されたタイポグラフィ定義
 * シンプルでモダンなフォントシステム
 */

// フォントファミリー - よりシンプルで洗練された選択
export const fontFamilies = {
  // メインフォント - システムフォント優先
  primary: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif'
  ].join(', '),
  
  // ヘッドライン用 - モダンでクリーンなフォント
  heading: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif'
  ].join(', '),
  
  // モノスペースフォント - より洗練された選択
  mono: [
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace'
  ].join(', '),
  
  // ディスプレイフォント - システムフォントベース
  display: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif'
  ].join(', '),
};

// 洗練されたフォントサイズ（モジュラースケール）
export const fontSizes = {
  // 基本サイズ
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  
  // ヘッダーサイズ（1.25倍のモジュラースケール）
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
  
  // 特別なサイズ
  tiny: 10,
  display: 72,
};

// 洗練されたフォントウェイト
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

// 最適化された行の高さ
export const lineHeights = {
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 1.875,
  none: 1,
};

// 洗練された文字間隔
export const letterSpacings = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
};

// 洗練されたテキストスタイル定義
export const textStyles = {
  // ヘッダースタイル - よりシンプルで洗練された
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
    letterSpacing: letterSpacings.normal,
  },
  
  h5: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  
  h6: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  
  // ボディテキスト - 読みやすさを重視
  bodyXL: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacings.normal,
  },
  
  bodyLarge: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacings.normal,
  },
  
  body: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  
  bodySmall: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  
  // UI要素用テキスト
  button: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacings.wide,
  },
  
  buttonSmall: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacings.wide,
  },
  
  buttonLarge: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacings.wide,
  },
  
  // キャプション・ラベル
  caption: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  
  label: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  
  // 洗練されたディスプレイスタイル
  displayLarge: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes.display,
    fontWeight: fontWeights.extraBold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.tight,
  },
  
  displayMedium: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['6xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.tight,
  },
  
  displaySmall: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['5xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.normal,
  },
  
  // コード・データ表示
  code: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  
  codeBlock: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacings.normal,
  },
  
  // 数値表示用
  numeric: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacings.normal,
    fontVariantNumeric: 'tabular-nums',
  },
  
  numericLarge: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacings.normal,
    fontVariantNumeric: 'tabular-nums',
  },
};

// レスポンシブタイポグラフィ
export const responsiveTextStyles = {
  hero: {
    base: {
      ...textStyles.displaySmall,
      fontSize: fontSizes['4xl'],
    },
    md: {
      fontSize: fontSizes['5xl'],
    },
    lg: {
      fontSize: fontSizes['6xl'],
    },
    xl: {
      fontSize: fontSizes.display,
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
    lg: {
      fontSize: fontSizes['4xl'],
    },
  },
  
  cardTitle: {
    base: {
      ...textStyles.h3,
      fontSize: fontSizes.xl,
    },
    md: {
      fontSize: fontSizes['2xl'],
    },
  },
  
  body: {
    base: {
      ...textStyles.body,
      fontSize: fontSizes.sm,
    },
    md: {
      fontSize: fontSizes.base,
    },
    lg: {
      fontSize: fontSizes.lg,
    },
  },
};

// タイポグラフィユーティリティ
export const typographyUtils = {
  // 読みやすさのための最適化
  readability: {
    maxWidth: '65ch', // 最適な行長
    hyphens: 'auto',
    wordBreak: 'break-word',
  },
  
  // アンチエイリアス
  antialiasing: {
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
  
  // 数値表示の最適化
  numericOptimization: {
    fontVariantNumeric: 'tabular-nums',
    fontFeatureSettings: '"tnum"',
  },
  
  // 省略記号
  ellipsis: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  
  // マルチライン省略
  ellipsisMultiline: (lines = 3) => ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }),
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
  utils: typographyUtils,
};