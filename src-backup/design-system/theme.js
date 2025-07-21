/**
 * テーマ定義
 * デザインシステムの統合テーマ設定
 */

import { designTokens } from './tokens';
import { colors } from './colors';
import { typography } from './typography';
import { spacingSystem } from './spacing';
import { shadowSystem } from './shadows';
import { animationSystem } from './animations';
import { breakpointSystem } from './breakpoints';

// ベーステーマ定義
const createTheme = (overrides = {}) => {
  const baseTheme = {
    // メタ情報
    name: 'NightLife Navigator',
    version: '1.0.0',
    description: 'サイバーパンク/ネオン風ナイトライフアプリテーマ',
    
    // カラーシステム
    colors: {
      ...colors,
      ...overrides.colors,
    },
    
    // タイポグラフィシステム
    typography: {
      ...typography,
      ...overrides.typography,
    },
    
    // スペーシングシステム
    spacing: {
      ...spacingSystem,
      ...overrides.spacing,
    },
    
    // シャドウシステム
    shadows: {
      ...shadowSystem,
      ...overrides.shadows,
    },
    
    // アニメーションシステム
    animations: {
      ...animationSystem,
      ...overrides.animations,
    },
    
    // ブレークポイントシステム
    breakpoints: {
      ...breakpointSystem,
      ...overrides.breakpoints,
    },
    
    // コンポーネントテーマ
    components: {
      // ボタンコンポーネント
      Button: {
        baseStyle: {
          fontFamily: typography.fontFamilies.primary,
          fontWeight: typography.fontWeights.semiBold,
          borderRadius: 8,
          cursor: 'pointer',
          transition: animationSystem.transitions.common.fade,
          userSelect: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        },
        
        sizes: {
          sm: {
            fontSize: typography.fontSizes.sm,
            paddingX: spacingSystem.spacing[3],
            paddingY: spacingSystem.spacing[2],
            minHeight: 32,
          },
          md: {
            fontSize: typography.fontSizes.base,
            paddingX: spacingSystem.spacing[4],
            paddingY: spacingSystem.spacing[3],
            minHeight: 40,
          },
          lg: {
            fontSize: typography.fontSizes.lg,
            paddingX: spacingSystem.spacing[6],
            paddingY: spacingSystem.spacing[4],
            minHeight: 48,
          },
        },
        
        variants: {
          primary: {
            backgroundColor: colors.primary[500],
            color: colors.white,
            border: `1px solid ${colors.primary[500]}`,
            boxShadow: shadowSystem.neon.blue.glow,
            '&:hover': {
              backgroundColor: colors.primary[400],
              boxShadow: shadowSystem.neon.blue.strongGlow,
              transform: 'translateY(-2px)',
            },
            '&:active': {
              backgroundColor: colors.primary[600],
              transform: 'translateY(0)',
            },
          },
          
          secondary: {
            backgroundColor: colors.secondary[500],
            color: colors.white,
            border: `1px solid ${colors.secondary[500]}`,
            boxShadow: shadowSystem.neon.pink.glow,
            '&:hover': {
              backgroundColor: colors.secondary[400],
              boxShadow: shadowSystem.neon.pink.strongGlow,
              transform: 'translateY(-2px)',
            },
            '&:active': {
              backgroundColor: colors.secondary[600],
              transform: 'translateY(0)',
            },
          },
          
          accent: {
            backgroundColor: colors.accent[500],
            color: colors.white,
            border: `1px solid ${colors.accent[500]}`,
            boxShadow: shadowSystem.neon.green.glow,
            '&:hover': {
              backgroundColor: colors.accent[400],
              boxShadow: shadowSystem.neon.green.strongGlow,
              transform: 'translateY(-2px)',
            },
            '&:active': {
              backgroundColor: colors.accent[600],
              transform: 'translateY(0)',
            },
          },
          
          outline: {
            backgroundColor: 'transparent',
            color: colors.primary[400],
            border: `1px solid ${colors.primary[500]}`,
            '&:hover': {
              backgroundColor: colors.primary[500],
              color: colors.white,
              boxShadow: shadowSystem.neon.blue.glow,
            },
          },
          
          ghost: {
            backgroundColor: 'transparent',
            color: colors.text.primary,
            border: 'none',
            '&:hover': {
              backgroundColor: colors.gray[800],
              color: colors.primary[400],
            },
          },
        },
      },
      
      // カードコンポーネント
      Card: {
        baseStyle: {
          backgroundColor: colors.background.surface,
          border: `1px solid ${colors.border.default}`,
          borderRadius: 12,
          padding: spacingSystem.layout.card.padding,
          boxShadow: shadowSystem.shadows.md,
          transition: animationSystem.transitions.common.fade,
          overflow: 'hidden',
          position: 'relative',
        },
        
        variants: {
          elevated: {
            backgroundColor: colors.background.surfaceElevated,
            boxShadow: shadowSystem.shadows.lg,
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: shadowSystem.shadows.xl,
            },
          },
          
          neon: {
            border: `1px solid ${colors.primary[500]}`,
            boxShadow: shadowSystem.neon.blue.glow,
            '&:hover': {
              boxShadow: shadowSystem.neon.blue.strongGlow,
            },
          },
          
          glass: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            border: `1px solid rgba(255, 255, 255, 0.1)`,
          },
        },
      },
      
      // インプットコンポーネント
      Input: {
        baseStyle: {
          fontFamily: typography.fontFamilies.primary,
          fontSize: typography.fontSizes.base,
          color: colors.text.primary,
          backgroundColor: colors.background.surface,
          border: `1px solid ${colors.border.default}`,
          borderRadius: 8,
          padding: `${spacingSystem.spacing[3]}px ${spacingSystem.spacing[4]}px`,
          transition: animationSystem.transitions.common.border,
          outline: 'none',
          
          '&:focus': {
            borderColor: colors.border.focus,
            boxShadow: shadowSystem.neon.blue.sm,
          },
          
          '&:disabled': {
            backgroundColor: colors.gray[800],
            color: colors.text.disabled,
            cursor: 'not-allowed',
          },
          
          '&::placeholder': {
            color: colors.text.tertiary,
          },
        },
        
        variants: {
          error: {
            borderColor: colors.border.error,
            '&:focus': {
              borderColor: colors.border.error,
              boxShadow: shadowSystem.neon.pink.sm,
            },
          },
          
          success: {
            borderColor: colors.border.success,
            '&:focus': {
              borderColor: colors.border.success,
              boxShadow: shadowSystem.neon.green.sm,
            },
          },
        },
      },
      
      // テキストコンポーネント
      Text: {
        baseStyle: {
          margin: 0,
          padding: 0,
        },
        
        variants: {
          ...typography.textStyles,
          
          neonTitle: {
            ...typography.neonTextEffects.pulseBlue,
          },
          
          gradient: {
            background: colors.background.gradientNeon,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          },
        },
      },
    },
    
    // グローバルスタイル
    global: {
      '*': {
        boxSizing: 'border-box',
      },
      
      'html, body': {
        margin: 0,
        padding: 0,
        fontFamily: typography.fontFamilies.primary,
        backgroundColor: colors.background.primary,
        color: colors.text.primary,
        lineHeight: typography.lineHeights.normal,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
      
      body: {
        overflowX: 'hidden',
      },
      
      'h1, h2, h3, h4, h5, h6': {
        fontFamily: typography.fontFamilies.heading,
        margin: 0,
        padding: 0,
      },
      
      'a': {
        color: colors.text.link,
        textDecoration: 'none',
        transition: animationSystem.transitions.common.color,
        
        '&:hover': {
          color: colors.text.linkHover,
        },
      },
      
      button: {
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        padding: 0,
        margin: 0,
      },
      
      // スクロールバーのカスタマイズ
      '::-webkit-scrollbar': {
        width: 8,
        height: 8,
      },
      
      '::-webkit-scrollbar-track': {
        backgroundColor: colors.gray[900],
      },
      
      '::-webkit-scrollbar-thumb': {
        backgroundColor: colors.gray[600],
        borderRadius: 4,
        '&:hover': {
          backgroundColor: colors.gray[500],
        },
      },
      
      // セレクションのカスタマイズ
      '::selection': {
        backgroundColor: colors.primary[500],
        color: colors.white,
      },
      
      // フォーカス可視性
      ':focus-visible': {
        outline: `2px solid ${colors.primary[400]}`,
        outlineOffset: 2,
      },
    },
    
    // レスポンシブ設定
    responsive: {
      ...breakpointSystem,
    },
    
    // アクセシビリティ設定
    accessibility: {
      ...designTokens.accessibility,
    },
    
    // パフォーマンス設定
    performance: {
      ...designTokens.performance,
    },
    
    // デバッグ設定
    debug: {
      showGrid: false,
      showBreakpoints: false,
      logThemeChanges: false,
    },
  };
  
  return baseTheme;
};

// デフォルトテーマ
export const defaultTheme = createTheme();

// テーマバリアント
export const neonBlueTheme = createTheme({
  colors: {
    primary: colors.primary,
    secondary: colors.info,
    accent: colors.accent,
  },
});

export const neonPinkTheme = createTheme({
  colors: {
    primary: colors.secondary,
    secondary: colors.primary,
    accent: colors.accent,
  },
});

export const cyberpunkGreenTheme = createTheme({
  colors: {
    primary: colors.accent,
    secondary: colors.primary,
    accent: colors.secondary,
  },
});

// テーマユーティリティ
export const themeUtils = {
  // テーマの切り替え
  switchTheme: (themeName) => {
    const themes = {
      default: defaultTheme,
      neonBlue: neonBlueTheme,
      neonPink: neonPinkTheme,
      cyberpunkGreen: cyberpunkGreenTheme,
    };
    
    return themes[themeName] || defaultTheme;
  },
  
  // カスタムテーマの作成
  createCustomTheme: (overrides) => createTheme(overrides),
  
  // ダークモード判定
  isDarkTheme: (theme) => theme.colors.background.primary === colors.background.primary,
  
  // コントラスト計算
  getContrastRatio: (color1, color2) => {
    // 簡易的なコントラスト比計算
    // 実際の実装では、より正確な計算が必要
    return Math.random() * 10 + 1; // プレースホルダー
  },
  
  // アクセシビリティチェック
  checkAccessibility: (theme) => {
    const checks = {
      colorContrast: true, // プレースホルダー
      touchTargets: true,  // プレースホルダー
      focusVisibility: true, // プレースホルダー
    };
    
    return checks;
  },
};

// React Native用テーマ
export const reactNativeTheme = {
  ...defaultTheme,
  // React Native固有の設定
  shadows: shadowSystem.elevation,
  animations: animationSystem.reactNative,
  breakpoints: breakpointSystem.reactNative,
};

// エクスポート
export {
  createTheme,
  designTokens,
};

export default defaultTheme;