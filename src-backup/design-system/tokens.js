/**
 * デザイントークン統合ファイル
 * 全てのデザイントークンを統合し、一貫性のあるデザインシステムを提供
 */

import { colors, baseColors, grayColors, backgroundColors, textColors, borderColors, neonColors, semanticColors } from './colors';
import { typography, fontFamilies, fontSizes, fontWeights, lineHeights, letterSpacings, textStyles, responsiveTextStyles, neonTextEffects } from './typography';
import { spacingSystem, spacing, componentSpacing, layoutSpacing, interactiveSpacing, effectSpacing, responsiveSpacing, spacingPatterns, negativeSpacing } from './spacing';
import { shadowSystem, shadows, neonShadows, componentShadows, elevations, neonElevations, effectShadows } from './shadows';
import { animationSystem, transitions, keyframes, animations, reactNativeAnimations, microInteractions, responsiveAnimations, performanceSettings } from './animations';
import { breakpointSystem, breakpointValues, mediaQueries, reactNativeBreakpoints, containerMaxWidths, gridSettings, responsivePatterns } from './breakpoints';

// プライマリトークン（基本要素）
export const primitiveTokens = {
  colors: {
    base: baseColors,
    gray: grayColors,
    semantic: semanticColors,
  },
  typography: {
    fontFamilies,
    fontSizes,
    fontWeights,
    lineHeights,
    letterSpacings,
  },
  spacing: spacing,
  shadows: shadows,
  transitions: transitions.duration,
  breakpoints: breakpointValues,
};

// セマンティックトークン（意味のある要素）
export const semanticTokens = {
  colors: {
    background: backgroundColors,
    text: textColors,
    border: borderColors,
    neon: neonColors,
  },
  typography: {
    styles: textStyles,
    responsive: responsiveTextStyles,
    effects: neonTextEffects,
  },
  spacing: {
    component: componentSpacing,
    layout: layoutSpacing,
    interactive: interactiveSpacing,
    effect: effectSpacing,
    responsive: responsiveSpacing,
    patterns: spacingPatterns,
    negative: negativeSpacing,
  },
  shadows: {
    neon: neonShadows,
    component: componentShadows,
    effect: effectShadows,
  },
  animations: {
    keyframes,
    animations,
    microInteractions,
    responsive: responsiveAnimations,
  },
  layout: {
    containers: containerMaxWidths,
    grid: gridSettings,
    patterns: responsivePatterns,
  },
};

// コンポーネントトークン（特定コンポーネント用）
export const componentTokens = {
  button: {
    colors: {
      primary: {
        background: baseColors.primary[500],
        backgroundHover: baseColors.primary[400],
        backgroundActive: baseColors.primary[600],
        text: textColors.primary,
        border: borderColors.neonBlue,
      },
      secondary: {
        background: baseColors.secondary[500],
        backgroundHover: baseColors.secondary[400],
        backgroundActive: baseColors.secondary[600],
        text: textColors.primary,
        border: borderColors.neonPink,
      },
      accent: {
        background: baseColors.accent[500],
        backgroundHover: baseColors.accent[400],
        backgroundActive: baseColors.accent[600],
        text: textColors.primary,
        border: borderColors.neonGreen,
      },
    },
    typography: {
      small: textStyles.buttonSmall,
      medium: textStyles.button,
      large: textStyles.buttonLarge,
    },
    spacing: interactiveSpacing.button,
    shadows: componentShadows.button,
    animations: {
      hover: microInteractions.buttonHover,
      glow: animations.glow,
    },
  },
  
  card: {
    colors: {
      background: backgroundColors.surface,
      backgroundElevated: backgroundColors.surfaceElevated,
      border: borderColors.default,
      shadow: 'rgba(0, 0, 0, 0.6)',
    },
    spacing: layoutSpacing.card,
    shadows: componentShadows.card,
    animations: {
      hover: microInteractions.cardHover,
    },
  },
  
  input: {
    colors: {
      background: backgroundColors.surface,
      border: borderColors.default,
      borderFocus: borderColors.focus,
      borderError: borderColors.error,
      text: textColors.primary,
      placeholder: textColors.tertiary,
    },
    typography: textStyles.body,
    spacing: interactiveSpacing.input,
    shadows: componentShadows.input,
    animations: {
      focus: microInteractions.inputFocus,
    },
  },
  
  navigation: {
    colors: {
      background: backgroundColors.surface,
      border: borderColors.light,
      text: textColors.primary,
      textActive: textColors.neonBlue,
    },
    spacing: spacingPatterns.navigation,
    shadows: componentShadows.navigation,
  },
  
  modal: {
    colors: {
      background: backgroundColors.surface,
      overlay: backgroundColors.modalOverlay,
      border: borderColors.default,
    },
    shadows: componentShadows.modal,
    animations: {
      enter: animations.scaleIn,
      exit: animations.scaleOut,
    },
  },
};

// プラットフォーム固有トークン
export const platformTokens = {
  web: {
    shadows: shadows,
    animations: animations,
    transitions: transitions,
    mediaQueries: mediaQueries,
  },
  
  reactNative: {
    elevations: elevations,
    neonElevations: neonElevations,
    animations: reactNativeAnimations,
    breakpoints: reactNativeBreakpoints,
  },
};

// テーマバリアント
export const themeVariants = {
  default: {
    name: 'NightLife Navigator Default',
    description: 'メインサイバーパンクテーマ',
    colors: colors,
    isDark: true,
    primary: baseColors.primary[500],
    secondary: baseColors.secondary[500],
    accent: baseColors.accent[500],
  },
  
  neonBlue: {
    name: 'Neon Blue',
    description: 'ブルー中心のネオンテーマ',
    colors: {
      ...colors,
      primary: baseColors.primary,
      secondary: baseColors.info,
      accent: baseColors.accent,
    },
    isDark: true,
    primary: baseColors.primary[500],
    secondary: baseColors.info[500],
    accent: baseColors.accent[500],
  },
  
  neonPink: {
    name: 'Neon Pink',
    description: 'ピンク中心のネオンテーマ',
    colors: {
      ...colors,
      primary: baseColors.secondary,
      secondary: baseColors.primary,
      accent: baseColors.accent,
    },
    isDark: true,
    primary: baseColors.secondary[500],
    secondary: baseColors.primary[500],
    accent: baseColors.accent[500],
  },
  
  cyberpunkGreen: {
    name: 'Cyberpunk Green',
    description: 'グリーン中心のサイバーパンクテーマ',
    colors: {
      ...colors,
      primary: baseColors.accent,
      secondary: baseColors.primary,
      accent: baseColors.secondary,
    },
    isDark: true,
    primary: baseColors.accent[500],
    secondary: baseColors.primary[500],
    accent: baseColors.secondary[500],
  },
};

// アクセシビリティトークン
export const accessibilityTokens = {
  // WCAG 2.1準拠のコントラスト比
  contrast: {
    minimum: 4.5,   // AA準拠
    enhanced: 7,    // AAA準拠
  },
  
  // タッチターゲットサイズ
  touchTarget: {
    minimum: 44,    // iOS/Android推奨
    comfortable: 48, // より快適なサイズ
  },
  
  // フォーカス可視性
  focus: {
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineColor: baseColors.primary[400],
    outlineOffset: 2,
  },
  
  // アニメーション制御
  reducedMotion: {
    duration: '0.01ms',
    easing: 'linear',
  },
  
  // 高コントラストモード対応
  highContrast: {
    background: '#000000',
    text: '#ffffff',
    border: '#ffffff',
  },
};

// パフォーマンストークン
export const performanceTokens = {
  // アニメーション最適化
  animations: {
    duration: {
      micro: 150,
      short: 300,
      medium: 500,
      long: 800,
    },
    easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    willChange: ['transform', 'opacity'],
  },
  
  // 画像最適化
  images: {
    lazyLoadThreshold: '200px',
    placeholder: grayColors[800],
    blur: 'blur(8px)',
  },
  
  // キャッシュ設定
  cache: {
    staticAssets: '1y',
    fonts: '1y',
    images: '30d',
  },
};

// 統合デザイントークン
export const designTokens = {
  primitive: primitiveTokens,
  semantic: semanticTokens,
  component: componentTokens,
  platform: platformTokens,
  themes: themeVariants,
  accessibility: accessibilityTokens,
  performance: performanceTokens,
  
  // システム全体
  spacing: spacingSystem,
  typography: typography,
  colors: colors,
  shadows: shadowSystem,
  animations: animationSystem,
  breakpoints: breakpointSystem,
};

// デフォルトエクスポート
export default designTokens;