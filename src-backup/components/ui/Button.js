/**
 * ボタンコンポーネント
 * やさしいピンクデザインシステムベースのボタン
 */

import React, { useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Animated } from 'react-native';
import { colors } from '../../design-system/colors-soft-pink';
import { spacingSystem } from '../../design-system/spacing-comfortable';
import { borderRadiusSystem } from '../../design-system/borders-rounded';
import { shadowSystem } from '../../design-system/shadows-soft-pink';
import { useAccessibility, getAccessibilityProps, getAccessibleTouchTarget, getSemanticColor } from './AccessibilityUtils';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  onPress,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  ...props
}) => {
  const [pressAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));

  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };
  const buttonStyle = {
    sizes: {
      sm: {
        paddingX: theme.spacing.interactive.button.sm.horizontal,
        paddingY: theme.spacing.interactive.button.sm.vertical,
        fontSize: 14,
        minHeight: theme.spacing.interactive.touchTarget.minSize,
        borderRadius: theme.borderRadius.component.button.small,
      },
      md: {
        paddingX: theme.spacing.interactive.button.md.horizontal,
        paddingY: theme.spacing.interactive.button.md.vertical,
        fontSize: 16,
        minHeight: theme.spacing.interactive.touchTarget.comfortable,
        borderRadius: theme.borderRadius.component.button.medium,
      },
      lg: {
        paddingX: theme.spacing.interactive.button.lg.horizontal,
        paddingY: theme.spacing.interactive.button.lg.vertical,
        fontSize: 18,
        minHeight: theme.spacing.interactive.touchTarget.large,
        borderRadius: theme.borderRadius.component.button.large,
      },
    },
    baseStyle: {
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  };
  const accessibility = useAccessibility();

  const handlePressIn = () => {
    if (disabled || loading) return;
    
    Animated.parallel([
      Animated.spring(pressAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    
    Animated.parallel([
      Animated.spring(pressAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const getVariantStyles = () => {
    const variants = {
      primary: {
        backgroundColor: getSemanticColor(theme.colors.brand, accessibility, theme),
        borderColor: getSemanticColor(theme.colors.brand, accessibility, theme),
        shadowColor: getSemanticColor(theme.colors.brand, accessibility, theme),
      },
      secondary: {
        backgroundColor: getSemanticColor(theme.colors.secondary[500], accessibility, theme),
        borderColor: getSemanticColor(theme.colors.secondary[500], accessibility, theme),
        shadowColor: getSemanticColor(theme.colors.secondary[500], accessibility, theme),
      },
      accent: {
        backgroundColor: getSemanticColor(theme.colors.accent[500], accessibility, theme),
        borderColor: getSemanticColor(theme.colors.accent[500], accessibility, theme),
        shadowColor: getSemanticColor(theme.colors.accent[500], accessibility, theme),
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: getSemanticColor(theme.colors.brand, accessibility, theme),
        shadowColor: 'transparent',
      },
      ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        shadowColor: 'transparent',
      },
      subtle: {
        backgroundColor: getSemanticColor(theme.colors.background.surfaceSoft, accessibility, theme),
        borderColor: getSemanticColor(theme.colors.border.light, accessibility, theme),
        shadowColor: 'rgba(0, 0, 0, 0.05)',
      },
    };
    
    return variants[variant] || variants.primary;
  };

  const getSizeStyles = () => {
    const sizes = buttonStyle.sizes;
    const baseSize = sizes[size] || sizes.md;
    
    // アクセシブルなタッチターゲットサイズを適用
    const accessibleSize = getAccessibleTouchTarget(
      { width: baseSize.paddingX * 2 + baseSize.fontSize, height: baseSize.minHeight },
      accessibility
    );
    
    return {
      ...baseSize,
      minWidth: accessibleSize.width,
      minHeight: accessibleSize.height,
    };
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const animatedStyle = {
    transform: [{ scale: pressAnim }],
    shadowOpacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.07, 0.15],
    }),
    elevation: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [2, 4],
    }),
  };

  const buttonStyles = [
    styles.base,
    buttonStyle.baseStyle,
    variantStyles,
    sizeStyles,
    disabled && styles.disabled,
    style,
  ];

  const getTextColor = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return getSemanticColor(theme.colors.brand, accessibility, theme);
      case 'subtle':
        return getSemanticColor(theme.colors.text.primary, accessibility, theme);
      default:
        return getSemanticColor(theme.colors.white, accessibility, theme);
    }
  };

  const textStyles = [
    styles.text,
    {
      color: getTextColor(),
      fontSize: sizeStyles.fontSize,
    },
    disabled && styles.disabledText,
    textStyle,
  ];

  // アクセシビリティプロパティを生成
  const accessibilityProps = getAccessibilityProps({
    label: accessibilityLabel || (typeof children === 'string' ? children : 'ボタン'),
    hint: accessibilityHint || (loading ? '読み込み中です' : ''),
    role: 'button',
    state: {
      disabled: disabled || loading,
      busy: loading,
    },
  });

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        style={buttonStyles}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        {...accessibilityProps}
        {...props}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={textStyles}>読み込み中...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            {icon && iconPosition === 'left' && (
              <View style={styles.iconLeft}>{icon}</View>
            )}
            <Text style={textStyles}>{children}</Text>
            {icon && iconPosition === 'right' && (
              <View style={styles.iconRight}>{icon}</View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  text: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  iconLeft: {
    marginRight: 12,
  },
  
  iconRight: {
    marginLeft: 12,
  },
  
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  disabled: {
    opacity: 0.5,
  },
  
  disabledText: {
    color: '#888',
  },
});

export default Button;