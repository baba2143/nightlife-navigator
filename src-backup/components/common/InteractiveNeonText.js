import React, { useState, useRef } from 'react';
import { Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors, typography } from '../../styles';

const InteractiveNeonText = ({
  children,
  variant = 'primary',
  size = 'base',
  weight = 'normal',
  interactive = false,
  onPress,
  style,
  textStyle,
  glow = true,
  pulse = false,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(glow ? 1 : 0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (interactive) {
      setIsPressed(true);
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (interactive) {
      setIsPressed(false);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text];
    
    // バリアント
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primary);
        break;
      case 'secondary':
        baseStyle.push(styles.secondary);
        break;
      case 'accent':
        baseStyle.push(styles.accent);
        break;
      case 'success':
        baseStyle.push(styles.success);
        break;
      case 'warning':
        baseStyle.push(styles.warning);
        break;
      case 'error':
        baseStyle.push(styles.error);
        break;
      case 'muted':
        baseStyle.push(styles.muted);
        break;
      default:
        baseStyle.push(styles.primary);
    }
    
    // サイズ
    switch (size) {
      case 'xs':
        baseStyle.push(styles.xs);
        break;
      case 'sm':
        baseStyle.push(styles.sm);
        break;
      case 'lg':
        baseStyle.push(styles.lg);
        break;
      case 'xl':
        baseStyle.push(styles.xl);
        break;
      case '2xl':
        baseStyle.push(styles['2xl']);
        break;
      case '3xl':
        baseStyle.push(styles['3xl']);
        break;
      default:
        baseStyle.push(styles.base);
    }
    
    // ウェイト
    switch (weight) {
      case 'light':
        baseStyle.push(styles.light);
        break;
      case 'semibold':
        baseStyle.push(styles.semibold);
        break;
      case 'bold':
        baseStyle.push(styles.bold);
        break;
      case 'extrabold':
        baseStyle.push(styles.extrabold);
        break;
      default:
        baseStyle.push(styles.normal);
    }
    
    return baseStyle;
  };

  const getGlowStyle = () => {
    if (!glow) return {};
    
    const glowColor = (() => {
      switch (variant) {
        case 'primary':
          return colors.primary;
        case 'secondary':
          return colors.secondary;
        case 'accent':
          return colors.accent;
        case 'success':
          return colors.success;
        case 'warning':
          return colors.warning;
        case 'error':
          return colors.error;
        default:
          return colors.primary;
      }
    })();

    return {
      textShadowColor: glowColor,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 8],
      }),
    };
  };

  const TextComponent = interactive ? TouchableOpacity : Text;

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TextComponent
        style={[getTextStyle(), getGlowStyle(), textStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={interactive ? 0.7 : 1}
        {...props}
      >
        {children}
      </TextComponent>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  text: {
    textAlign: 'left',
  },
  
  // バリアント
  primary: {
    color: colors.primary,
  },
  
  secondary: {
    color: colors.secondary,
  },
  
  accent: {
    color: colors.accent,
  },
  
  success: {
    color: colors.success,
  },
  
  warning: {
    color: colors.warning,
  },
  
  error: {
    color: colors.error,
  },
  
  muted: {
    color: colors.textSecondary,
  },
  
  // サイズ
  xs: {
    fontSize: typography.sizes.xs,
  },
  
  sm: {
    fontSize: typography.sizes.sm,
  },
  
  base: {
    fontSize: typography.sizes.base,
  },
  
  lg: {
    fontSize: typography.sizes.lg,
  },
  
  xl: {
    fontSize: typography.sizes.xl,
  },
  
  '2xl': {
    fontSize: typography.sizes['2xl'],
  },
  
  '3xl': {
    fontSize: typography.sizes['3xl'],
  },
  
  // ウェイト
  light: {
    fontWeight: typography.weights.light,
  },
  
  normal: {
    fontWeight: typography.weights.normal,
  },
  
  semibold: {
    fontWeight: typography.weights.semibold,
  },
  
  bold: {
    fontWeight: typography.weights.bold,
  },
  
  extrabold: {
    fontWeight: typography.weights.extrabold,
  },
});

export default InteractiveNeonText; 