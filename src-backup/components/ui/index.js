/**
 * UIコンポーネント統合エクスポートファイル
 * デザインシステムベースのUIコンポーネントライブラリ
 */

// 基本コンポーネント
export { default as Button } from './Button';
export { default as Card, CardHeader, CardBody, CardFooter } from './Card';
export { default as Input } from './Input';
export { default as Text, NeonText, GradientText, CodeText, DataText } from './Text';
export { default as Badge, NotificationBadge, StatusBadge, RatingBadge, PriceBadge } from './Badge';
export { default as Modal, ConfirmModal, AlertModal, LoadingModal } from './Modal';
export { default as Icon, NeonIcon, InteractiveIcon, StatusIcon, RatingStars, IconButton, ICON_NAMES } from './Icon';
export { Container, Row, Col, Spacer, Flex, SafeLayout, ScrollLayout, Show, Hide, AspectRatio } from './Layout';
export { default as ThemeSelector, ThemePreview, ThemeToggleButton, THEME_OPTIONS } from './ThemeSelector';

// アクセシビリティ
export {
  AccessibilityProvider,
  useAccessibility,
  getAccessibilityProps,
  useFocusManagement,
  calculateContrastRatio,
  checkWCAGCompliance,
  getResponsiveFontSize,
  getAccessibleTouchTarget,
  getSemanticColor,
  getAccessibleAnimation,
  useKeyboardNavigation,
  testAccessibility,
  createHighContrastTheme,
} from './AccessibilityUtils';

// アニメーションコンポーネント
export {
  NeonPulse,
  GlitchEffect,
  FadeInOut,
  ScaleAnimation,
  SlideAnimation,
  RotateAnimation,
  StaggeredAnimation,
  FlickerEffect,
  ParallaxEffect,
  useCustomAnimation,
} from './AnimatedComponents';

// デザインシステム
export { defaultTheme, neonBlueTheme, neonPinkTheme, cyberpunkGreenTheme } from '../../design-system/theme';
export { designTokens } from '../../design-system/tokens';
export * from '../../design-system/colors';
export * from '../../design-system/typography';
export * from '../../design-system/spacing';
export * from '../../design-system/shadows';
export * from '../../design-system/animations';
export * from '../../design-system/breakpoints';

// ユーティリティ関数
export const createStyledComponent = (Component, defaultProps = {}) => {
  const StyledComponent = (props) => {
    return <Component {...defaultProps} {...props} />;
  };
  
  StyledComponent.displayName = `Styled${Component.displayName || Component.name}`;
  return StyledComponent;
};

// テーマプロバイダー用のコンテキスト
import React, { createContext, useContext, useState } from 'react';
import { defaultTheme } from '../../design-system/theme';

const ThemeContext = createContext({
  theme: defaultTheme,
  setTheme: () => {},
});

export const ThemeProvider = ({ children, initialTheme = defaultTheme }) => {
  const [theme, setTheme] = useState(initialTheme);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// レスポンシブフック
import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;

  const breakpoints = {
    xs: width >= 0,
    sm: width >= 576,
    md: width >= 768,
    lg: width >= 992,
    xl: width >= 1200,
    '2xl': width >= 1400,
  };

  const isPhone = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  return {
    width,
    height,
    breakpoints,
    isPhone,
    isTablet,
    isDesktop,
    currentBreakpoint: Object.keys(breakpoints)
      .reverse()
      .find(bp => breakpoints[bp]) || 'xs',
  };
};

// アニメーションフック
import { Animated } from 'react-native';

export const useNeonGlow = (isActive = false, color = 'blue') => {
  const [glowAnim] = useState(new Animated.Value(0));
  const theme = useTheme().theme;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const glowStyle = {
    shadowOpacity: isActive
      ? glowAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 0.9],
        })
      : 0,
    shadowRadius: isActive
      ? glowAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [5, 20],
        })
      : 0,
    shadowColor: theme.colors[color]?.[400] || theme.colors.primary[400],
    elevation: isActive
      ? glowAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [2, 8],
        })
      : 0,
  };

  return { glowStyle, glowAnim };
};

// スタイルユーティリティ
export const createResponsiveStyle = (styles, breakpoint = 'md') => {
  const responsive = useResponsive();
  
  if (typeof styles === 'object' && !Array.isArray(styles)) {
    return Object.keys(styles).reduce((acc, key) => {
      if (responsive.breakpoints[key]) {
        return { ...acc, ...styles[key] };
      }
      return acc;
    }, styles.base || {});
  }
  
  return styles;
};

// カラーユーティリティ
export const getColorWithOpacity = (color, opacity) => {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
  }
  
  return color;
};

// スペーシングユーティリティ
export const getSpacing = (value, theme = defaultTheme) => {
  if (typeof value === 'number') {
    return theme.spacing.spacing[value] || value;
  }
  
  if (typeof value === 'string') {
    return theme.spacing.spacing[value] || parseInt(value) || 0;
  }
  
  return 0;
};

// タイポグラフィユーティリティ
export const getTextStyle = (variant, theme = defaultTheme) => {
  return theme.typography.textStyles[variant] || theme.typography.textStyles.body;
};

// 定数エクスポート
export const UI_CONSTANTS = {
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  
  TOUCH_TARGET_SIZE: 44,
  
  BORDER_RADIUS: {
    SMALL: 4,
    MEDIUM: 8,
    LARGE: 12,
    ROUND: 9999,
  },
  
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
  },
};