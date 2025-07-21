/**
 * カードコンポーネント
 * やさしいピンクデザインシステムベースのカード
 */

import React, { useState } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors } from '../../design-system/colors-soft-pink';
import { spacingSystem } from '../../design-system/spacing-comfortable';
import { borderRadiusSystem } from '../../design-system/borders-rounded';
import { shadowSystem } from '../../design-system/shadows-soft-pink';

const Card = ({
  children,
  variant = 'default',
  elevated = false,
  interactive = false,
  neonGlow = false,
  onPress,
  style,
  ...props
}) => {
  const [hoverAnim] = useState(new Animated.Value(0));
  const [pressAnim] = useState(new Animated.Value(1));

  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };
  const cardStyle = {
    baseStyle: {
      borderRadius: theme.borderRadius.component.card.medium,
      borderWidth: 1,
      overflow: 'hidden',
    },
  };

  const handlePressIn = () => {
    if (!interactive) return;
    
    Animated.parallel([
      Animated.spring(pressAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }),
      Animated.timing(hoverAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (!interactive) return;
    
    Animated.parallel([
      Animated.spring(pressAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(hoverAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const getVariantStyles = () => {
    const variants = {
      default: {
        backgroundColor: theme.colors.background.surface,
        borderColor: theme.colors.border.default,
        ...theme.shadows.elevation[1],
      },
      elevated: {
        backgroundColor: theme.colors.background.surfaceElevated,
        borderColor: theme.colors.border.light,
        ...theme.shadows.elevation[3],
      },
      soft: {
        backgroundColor: theme.colors.background.surfaceSoft,
        borderColor: theme.colors.border.light,
        ...theme.shadows.elevation[1],
      },
      outlined: {
        backgroundColor: theme.colors.background.surface,
        borderColor: theme.colors.border.medium,
        borderWidth: 1,
        ...theme.shadows.elevation[0],
      },
      filled: {
        backgroundColor: theme.colors.background.pinkLight,
        borderColor: theme.colors.border.pink,
        ...theme.shadows.elevation[1],
      },
    };
    
    let selectedVariant = variants.default;
    
    if (elevated) {
      selectedVariant = { ...selectedVariant, ...variants.elevated };
    }
    
    if (variant === 'soft') {
      selectedVariant = { ...selectedVariant, ...variants.soft };
    }
    
    if (variant === 'outlined') {
      selectedVariant = { ...selectedVariant, ...variants.outlined };
    }
    
    if (variant === 'filled') {
      selectedVariant = { ...selectedVariant, ...variants.filled };
    }
    
    return selectedVariant;
  };

  const variantStyles = getVariantStyles();

  const animatedStyle = {
    transform: [{ scale: pressAnim }],
    shadowOpacity: interactive 
      ? hoverAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [variantStyles.shadowOpacity || 0.07, 0.15],
        })
      : variantStyles.shadowOpacity,
    elevation: interactive
      ? hoverAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [variantStyles.elevation || 1, 4],
        })
      : variantStyles.elevation,
  };

  const cardStyles = [
    styles.base,
    cardStyle.baseStyle,
    variantStyles,
    style,
  ];

  const CardComponent = interactive || onPress ? TouchableOpacity : View;

  return (
    <Animated.View style={[animatedStyle]}>
      <CardComponent
        style={cardStyles}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={interactive ? 0.9 : 1}
        {...props}
      >
        {children}
      </CardComponent>
    </Animated.View>
  );
};

// カードヘッダーコンポーネント
export const CardHeader = ({ children, style, ...props }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };
  
  return (
    <View style={[styles.header, style]} {...props}>
      {children}
    </View>
  );
};

// カードボディコンポーネント
export const CardBody = ({ children, style, ...props }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };
  
  return (
    <View style={[styles.body, style]} {...props}>
      {children}
    </View>
  );
};

// カードフッターコンポーネント
export const CardFooter = ({ children, style, ...props }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };
  
  return (
    <View style={[styles.footer, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  
  body: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(234, 90, 123, 0.1)',
  },
});

// 名前付きエクスポート
export { CardHeader, CardBody, CardFooter };

// デフォルトエクスポート
export default Card;