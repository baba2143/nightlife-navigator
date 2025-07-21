/**
 * ブレークポイント定義
 * レスポンシブデザイン用の画面サイズ定義
 */

// ブレークポイント値（ピクセル）
export const breakpointValues = {
  xs: 0,     // Extra small devices (phones)
  sm: 576,   // Small devices (landscape phones)
  md: 768,   // Medium devices (tablets)
  lg: 992,   // Large devices (desktops)
  xl: 1200,  // Extra large devices (large desktops)
  '2xl': 1400, // Extra extra large devices
};

// ブレークポイント名の配列
export const breakpointKeys = Object.keys(breakpointValues);

// メディアクエリ生成関数
export const up = (breakpoint) => {
  const value = breakpointValues[breakpoint];
  return `@media (min-width: ${value}px)`;
};

export const down = (breakpoint) => {
  const breakpointIndex = breakpointKeys.indexOf(breakpoint);
  const nextBreakpoint = breakpointKeys[breakpointIndex + 1];
  
  if (!nextBreakpoint) {
    // 最大のブレークポイントの場合
    return '@media (min-width: 0px)';
  }
  
  const value = breakpointValues[nextBreakpoint] - 1;
  return `@media (max-width: ${value}px)`;
};

export const between = (start, end) => {
  const startValue = breakpointValues[start];
  const endIndex = breakpointKeys.indexOf(end);
  const nextBreakpoint = breakpointKeys[endIndex + 1];
  
  if (!nextBreakpoint) {
    return up(start);
  }
  
  const endValue = breakpointValues[nextBreakpoint] - 1;
  return `@media (min-width: ${startValue}px) and (max-width: ${endValue}px)`;
};

export const only = (breakpoint) => {
  const currentIndex = breakpointKeys.indexOf(breakpoint);
  const nextBreakpoint = breakpointKeys[currentIndex + 1];
  
  if (!nextBreakpoint) {
    return up(breakpoint);
  }
  
  return between(breakpoint, breakpoint);
};

// よく使用されるメディアクエリ
export const mediaQueries = {
  // モバイルファースト
  mobile: up('xs'),
  tablet: up('md'),
  desktop: up('lg'),
  widescreen: up('xl'),
  ultrawide: up('2xl'),
  
  // デスクトップファースト
  mobileOnly: down('sm'),
  tabletOnly: between('sm', 'lg'),
  desktopOnly: up('lg'),
  
  // 特定デバイス
  phone: down('md'),
  tabletAndUp: up('md'),
  desktopAndUp: up('lg'),
  
  // カスタム
  smallScreen: '@media (max-width: 767px)',
  mediumScreen: '@media (min-width: 768px) and (max-width: 1023px)',
  largeScreen: '@media (min-width: 1024px)',
  
  // 高解像度ディスプレイ
  retina: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
  
  // オリエンテーション
  landscape: '@media (orientation: landscape)',
  portrait: '@media (orientation: portrait)',
  
  // プリント
  print: '@media print',
  
  // ダークモード
  darkMode: '@media (prefers-color-scheme: dark)',
  lightMode: '@media (prefers-color-scheme: light)',
  
  // モーション設定
  reduceMotion: '@media (prefers-reduced-motion: reduce)',
  noReduceMotion: '@media (prefers-reduced-motion: no-preference)',
  
  // ホバー可能デバイス
  hover: '@media (hover: hover)',
  noHover: '@media (hover: none)',
};

// React Native用ブレークポイント
export const reactNativeBreakpoints = {
  // Dimensions APIで使用する値
  small: 576,
  medium: 768,
  large: 992,
  extraLarge: 1200,
  
  // デバイスタイプ判定用
  isSmallDevice: (width) => width < reactNativeBreakpoints.small,
  isMediumDevice: (width) => width >= reactNativeBreakpoints.small && width < reactNativeBreakpoints.large,
  isLargeDevice: (width) => width >= reactNativeBreakpoints.large,
  
  // タブレット判定
  isTablet: (width, height) => {
    const minDimension = Math.min(width, height);
    const maxDimension = Math.max(width, height);
    return minDimension >= 768 && maxDimension >= 1024;
  },
};

// コンテナ最大幅
export const containerMaxWidths = {
  xs: '100%',
  sm: '540px',
  md: '720px',
  lg: '960px',
  xl: '1140px',
  '2xl': '1320px',
};

// グリッドシステム用設定
export const gridSettings = {
  // カラム数
  columns: 12,
  
  // ガター幅（ブレークポイント別）
  gutters: {
    xs: 16,
    sm: 16,
    md: 24,
    lg: 24,
    xl: 32,
    '2xl': 32,
  },
  
  // コンテナパディング
  containerPadding: {
    xs: 16,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 32,
    '2xl': 32,
  },
};

// レスポンシブ値の型定義用
export const responsiveValueKeys = breakpointKeys;

// レスポンシブ値処理用ヘルパー
export const getResponsiveValue = (values, currentBreakpoint) => {
  if (typeof values === 'string' || typeof values === 'number') {
    return values;
  }
  
  if (typeof values === 'object') {
    // 現在のブレークポイント以下で最も近い値を取得
    let result = values.xs || values[breakpointKeys[0]];
    
    for (const bp of breakpointKeys) {
      if (values[bp] !== undefined) {
        result = values[bp];
      }
      if (bp === currentBreakpoint) {
        break;
      }
    }
    
    return result;
  }
  
  return values;
};

// CSS-in-JS用のブレークポイントヘルパー
export const styled = {
  // styled-components等で使用
  up: (breakpoint) => `@media (min-width: ${breakpointValues[breakpoint]}px)`,
  down: (breakpoint) => {
    const breakpointIndex = breakpointKeys.indexOf(breakpoint);
    const nextBreakpoint = breakpointKeys[breakpointIndex + 1];
    
    if (!nextBreakpoint) {
      return '@media (min-width: 0px)';
    }
    
    const value = breakpointValues[nextBreakpoint] - 1;
    return `@media (max-width: ${value}px)`;
  },
  between: (start, end) => {
    const startValue = breakpointValues[start];
    const endIndex = breakpointKeys.indexOf(end);
    const nextBreakpoint = breakpointKeys[endIndex + 1];
    
    if (!nextBreakpoint) {
      return `@media (min-width: ${startValue}px)`;
    }
    
    const endValue = breakpointValues[nextBreakpoint] - 1;
    return `@media (min-width: ${startValue}px) and (max-width: ${endValue}px)`;
  },
};

// よく使用されるレスポンシブパターン
export const responsivePatterns = {
  // フォントサイズ
  fontSize: {
    small: { xs: 14, md: 16 },
    base: { xs: 16, md: 18 },
    large: { xs: 18, md: 20 },
    xl: { xs: 20, md: 24 },
    '2xl': { xs: 24, md: 30 },
    '3xl': { xs: 30, md: 36 },
  },
  
  // スペーシング
  spacing: {
    small: { xs: 8, md: 12 },
    base: { xs: 16, md: 24 },
    large: { xs: 24, md: 32 },
    xl: { xs: 32, md: 48 },
  },
  
  // グリッドカラム
  columns: {
    auto: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
    cards: { xs: 1, sm: 2, lg: 3, xl: 4 },
    list: { xs: 1, md: 2, xl: 3 },
  },
};

// エクスポート用の統合ブレークポイントオブジェクト
export const breakpointSystem = {
  values: breakpointValues,
  keys: breakpointKeys,
  up,
  down,
  between,
  only,
  mediaQueries,
  reactNative: reactNativeBreakpoints,
  containers: containerMaxWidths,
  grid: gridSettings,
  patterns: responsivePatterns,
  styled,
  getResponsiveValue,
};