/**
 * テキストコンポーネント
 * デザインシステムベースのネオン効果付きテキスト
 */

import React from 'react';
import { Text as RNText, StyleSheet, Animated } from 'react-native';
import { defaultTheme } from '../../design-system/theme';

const Text = ({
  children,
  variant = 'body',
  color,
  size,
  weight,
  align = 'left',
  neonGlow = false,
  neonColor = 'blue',
  gradient = false,
  uppercase = false,
  numberOfLines,
  ellipsizeMode = 'tail',
  style,
  animated = false,
  ...props
}) => {
  const theme = defaultTheme;
  const textStyles = theme.components.Text;

  const getVariantStyle = () => {
    const variants = {
      // ヘッダー
      h1: theme.typography.textStyles.h1,
      h2: theme.typography.textStyles.h2,
      h3: theme.typography.textStyles.h3,
      h4: theme.typography.textStyles.h4,
      h5: theme.typography.textStyles.h5,
      h6: theme.typography.textStyles.h6,
      
      // ボディテキスト
      body: theme.typography.textStyles.body,
      bodyLarge: theme.typography.textStyles.bodyLarge,
      bodySmall: theme.typography.textStyles.bodySmall,
      
      // UI要素
      button: theme.typography.textStyles.button,
      buttonSmall: theme.typography.textStyles.buttonSmall,
      buttonLarge: theme.typography.textStyles.buttonLarge,
      caption: theme.typography.textStyles.caption,
      label: theme.typography.textStyles.label,
      
      // 特殊スタイル
      neonTitle: theme.typography.textStyles.neonTitle,
      neonSubtitle: theme.typography.textStyles.neonSubtitle,
      code: theme.typography.textStyles.code,
      data: theme.typography.textStyles.data,
      dataLarge: theme.typography.textStyles.dataLarge,
      dataSmall: theme.typography.textStyles.dataSmall,
    };
    
    return variants[variant] || variants.body;
  };

  const getColorStyle = () => {
    if (color) {
      // カスタムカラーが指定された場合
      if (color.startsWith('#') || color.startsWith('rgb')) {
        return { color };
      }
      
      // テーマカラーが指定された場合
      const themeColors = {
        primary: theme.colors.text.primary,
        secondary: theme.colors.text.secondary,
        tertiary: theme.colors.text.tertiary,
        disabled: theme.colors.text.disabled,
        neonBlue: theme.colors.text.neonBlue,
        neonPink: theme.colors.text.neonPink,
        neonGreen: theme.colors.text.neonGreen,
        link: theme.colors.text.link,
        linkHover: theme.colors.text.linkHover,
        white: theme.colors.white,
        error: theme.colors.error[400],
        success: theme.colors.success[400],
        warning: theme.colors.warning[400],
      };
      
      return { color: themeColors[color] || color };
    }
    
    return {};
  };

  const getSizeStyle = () => {
    if (size) {
      const fontSize = typeof size === 'number' 
        ? size 
        : theme.typography.fontSizes[size] || theme.typography.fontSizes.base;
      
      return { fontSize };
    }
    
    return {};
  };

  const getWeightStyle = () => {
    if (weight) {
      const fontWeight = typeof weight === 'number' || typeof weight === 'string'
        ? weight
        : theme.typography.fontWeights[weight] || theme.typography.fontWeights.normal;
      
      return { fontWeight };
    }
    
    return {};
  };

  const getNeonGlowStyle = () => {
    if (!neonGlow) return {};
    
    const neonEffects = {
      blue: theme.typography.neonTextEffects.blue,
      pink: theme.typography.neonTextEffects.pink,
      green: theme.typography.neonTextEffects.green,
    };
    
    return neonEffects[neonColor] || neonEffects.blue;
  };

  const getGradientStyle = () => {
    if (!gradient) return {};
    
    return {
      background: theme.colors.background.gradientNeon,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    };
  };

  const getAlignStyle = () => {
    return { textAlign: align };
  };

  const getTransformStyle = () => {
    return uppercase ? { textTransform: 'uppercase' } : {};
  };

  const variantStyle = getVariantStyle();
  const colorStyle = getColorStyle();
  const sizeStyle = getSizeStyle();
  const weightStyle = getWeightStyle();
  const neonGlowStyle = getNeonGlowStyle();
  const gradientStyle = getGradientStyle();
  const alignStyle = getAlignStyle();
  const transformStyle = getTransformStyle();

  const combinedStyle = [
    styles.base,
    variantStyle,
    colorStyle,
    sizeStyle,
    weightStyle,
    neonGlowStyle,
    gradientStyle,
    alignStyle,
    transformStyle,
    style,
  ];

  const TextComponent = animated ? Animated.Text : RNText;

  return (
    <TextComponent
      style={combinedStyle}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      {...props}
    >
      {children}
    </TextComponent>
  );
};

// 特殊なテキストコンポーネント
export const NeonText = ({ children, color = 'blue', animated = true, ...props }) => {
  return (
    <Text
      {...props}
      neonGlow={true}
      neonColor={color}
      animated={animated}
    >
      {children}
    </Text>
  );
};

export const GradientText = ({ children, ...props }) => {
  return (
    <Text
      {...props}
      gradient={true}
    >
      {children}
    </Text>
  );
};

export const CodeText = ({ children, ...props }) => {
  return (
    <Text
      {...props}
      variant="code"
      style={[styles.code, props.style]}
    >
      {children}
    </Text>
  );
};

export const DataText = ({ children, size = 'data', ...props }) => {
  return (
    <Text
      {...props}
      variant={size}
      style={[styles.data, props.style]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false, // Android
    textAlignVertical: 'center', // Android
  },
  
  code: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  
  data: {
    fontVariant: ['tabular-nums'], // Web
  },
});

// 名前付きエクスポート
export { NeonText, GradientText, CodeText, DataText };

// デフォルトエクスポート
export default Text;