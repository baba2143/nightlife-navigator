/**
 * アクセシビリティユーティリティ
 * WCAG 2.1準拠のアクセシビリティ機能
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccessibilityInfo, Platform, Dimensions } from 'react-native';
import { defaultTheme } from '../../design-system/theme';

// アクセシビリティコンテキスト
const AccessibilityContext = createContext({
  isScreenReaderEnabled: false,
  isReduceMotionEnabled: false,
  isHighContrastEnabled: false,
  fontSize: 'normal',
  touchTargetSize: 44,
  setAccessibilityPreferences: () => {},
});

export const AccessibilityProvider = ({ children }) => {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(false);
  const [fontSize, setFontSize] = useState('normal');
  const [touchTargetSize, setTouchTargetSize] = useState(44);

  useEffect(() => {
    // スクリーンリーダーの状態を確認
    const checkScreenReader = async () => {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const enabled = await AccessibilityInfo.isScreenReaderEnabled();
        setIsScreenReaderEnabled(enabled);
      }
    };

    checkScreenReader();

    // スクリーンリーダーの状態変更を監視
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    return () => {
      subscription?.remove?.();
    };
  }, []);

  const setAccessibilityPreferences = (preferences) => {
    if (preferences.reduceMotion !== undefined) {
      setIsReduceMotionEnabled(preferences.reduceMotion);
    }
    if (preferences.highContrast !== undefined) {
      setIsHighContrastEnabled(preferences.highContrast);
    }
    if (preferences.fontSize !== undefined) {
      setFontSize(preferences.fontSize);
    }
    if (preferences.touchTargetSize !== undefined) {
      setTouchTargetSize(preferences.touchTargetSize);
    }
  };

  const value = {
    isScreenReaderEnabled,
    isReduceMotionEnabled,
    isHighContrastEnabled,
    fontSize,
    touchTargetSize,
    setAccessibilityPreferences,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

// アクセシビリティ準拠のプロパティを生成
export const getAccessibilityProps = ({
  label,
  hint,
  role = 'button',
  state = {},
  actions = [],
  labelledBy,
  describedBy,
  ...props
}) => {
  const accessibilityProps = {
    accessible: true,
    accessibilityRole: role,
    ...props,
  };

  // ラベル設定
  if (label) {
    accessibilityProps.accessibilityLabel = label;
  }

  // ヒント設定
  if (hint) {
    accessibilityProps.accessibilityHint = hint;
  }

  // 状態設定
  if (Object.keys(state).length > 0) {
    accessibilityProps.accessibilityState = state;
  }

  // アクション設定
  if (actions.length > 0) {
    accessibilityProps.accessibilityActions = actions;
  }

  // 関連付け
  if (labelledBy) {
    accessibilityProps.accessibilityLabelledBy = labelledBy;
  }

  if (describedBy) {
    accessibilityProps.accessibilityDescribedBy = describedBy;
  }

  return accessibilityProps;
};

// フォーカス管理
export const useFocusManagement = () => {
  const [focusedElement, setFocusedElement] = useState(null);

  const setFocus = (elementRef) => {
    if (elementRef?.current) {
      if (Platform.OS === 'web') {
        elementRef.current.focus();
      } else {
        AccessibilityInfo.setAccessibilityFocus(elementRef.current);
      }
      setFocusedElement(elementRef.current);
    }
  };

  const announceForScreenReader = (message) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      AccessibilityInfo.announceForAccessibility(message);
    }
  };

  return {
    focusedElement,
    setFocus,
    announceForScreenReader,
  };
};

// コントラスト比計算
export const calculateContrastRatio = (color1, color2) => {
  const getLuminance = (color) => {
    // RGB値を取得
    const rgb = color.replace('#', '');
    const r = parseInt(rgb.substr(0, 2), 16) / 255;
    const g = parseInt(rgb.substr(2, 2), 16) / 255;
    const b = parseInt(rgb.substr(4, 2), 16) / 255;

    // 相対輝度を計算
    const getRelativeLuminance = (c) => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };

    return 0.2126 * getRelativeLuminance(r) + 
           0.7152 * getRelativeLuminance(g) + 
           0.0722 * getRelativeLuminance(b);
  };

  const luminance1 = getLuminance(color1);
  const luminance2 = getLuminance(color2);
  
  const brightest = Math.max(luminance1, luminance2);
  const darkest = Math.min(luminance1, luminance2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

// WCAG準拠チェック
export const checkWCAGCompliance = (contrastRatio, level = 'AA', isLargeText = false) => {
  const requirements = {
    AA: {
      normal: 4.5,
      large: 3.0,
    },
    AAA: {
      normal: 7.0,
      large: 4.5,
    },
  };

  const required = requirements[level][isLargeText ? 'large' : 'normal'];
  return contrastRatio >= required;
};

// レスポンシブフォントサイズ
export const getResponsiveFontSize = (baseSize, accessibility) => {
  const { fontSize: fontSizePreference } = accessibility;
  
  const scalingFactors = {
    small: 0.85,
    normal: 1,
    large: 1.15,
    extraLarge: 1.3,
  };
  
  const factor = scalingFactors[fontSizePreference] || 1;
  return Math.round(baseSize * factor);
};

// アクセシブルなタッチターゲット
export const getAccessibleTouchTarget = (size, accessibility) => {
  const { touchTargetSize } = accessibility;
  const minSize = Math.max(touchTargetSize, 44); // iOS/Android推奨最小サイズ
  
  return {
    width: Math.max(size.width || size, minSize),
    height: Math.max(size.height || size, minSize),
  };
};

// セマンティックカラー（高コントラスト対応）
export const getSemanticColor = (color, accessibility, theme = defaultTheme) => {
  const { isHighContrastEnabled } = accessibility;
  
  if (!isHighContrastEnabled) {
    return color;
  }
  
  // 高コントラストモード用のカラーマッピング
  const highContrastColors = {
    [theme.colors.primary[500]]: '#0066cc',
    [theme.colors.secondary[500]]: '#cc0066',
    [theme.colors.accent[500]]: '#00cc66',
    [theme.colors.error[500]]: '#cc0000',
    [theme.colors.warning[500]]: '#cc6600',
    [theme.colors.success[500]]: '#00cc00',
    [theme.colors.text.primary]: '#ffffff',
    [theme.colors.text.secondary]: '#cccccc',
    [theme.colors.background.primary]: '#000000',
    [theme.colors.background.surface]: '#111111',
  };
  
  return highContrastColors[color] || color;
};

// アニメーション制御
export const getAccessibleAnimation = (animation, accessibility) => {
  const { isReduceMotionEnabled } = accessibility;
  
  if (isReduceMotionEnabled) {
    return {
      ...animation,
      duration: 0.01, // ほぼ瞬時
      useNativeDriver: true,
    };
  }
  
  return animation;
};

// キーボードナビゲーション
export const useKeyboardNavigation = (items = []) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const navigateNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };
  
  const navigatePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };
  
  const selectCurrent = () => {
    const currentItem = items[currentIndex];
    if (currentItem?.onPress) {
      currentItem.onPress();
    }
  };
  
  return {
    currentIndex,
    navigateNext,
    navigatePrevious,
    selectCurrent,
    setCurrentIndex,
  };
};

// アクセシビリティテスト用ユーティリティ
export const testAccessibility = (component) => {
  const issues = [];
  
  // 基本的なアクセシビリティチェック
  if (!component.props.accessible && !component.props.accessibilityRole) {
    issues.push('要素にaccessibleまたはaccessibilityRoleが設定されていません');
  }
  
  if (!component.props.accessibilityLabel && !component.props.children) {
    issues.push('アクセシビリティラベルまたはテキストコンテンツが不足しています');
  }
  
  return {
    isAccessible: issues.length === 0,
    issues,
  };
};

// 高コントラストテーマ
export const createHighContrastTheme = (baseTheme) => {
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: {
        ...baseTheme.colors.primary,
        500: '#0066cc',
      },
      secondary: {
        ...baseTheme.colors.secondary,
        500: '#cc0066',
      },
      accent: {
        ...baseTheme.colors.accent,
        500: '#00cc66',
      },
      text: {
        ...baseTheme.colors.text,
        primary: '#ffffff',
        secondary: '#cccccc',
      },
      background: {
        ...baseTheme.colors.background,
        primary: '#000000',
        surface: '#111111',
      },
      border: {
        ...baseTheme.colors.border,
        default: '#ffffff',
      },
    },
  };
};

// エクスポート
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
};