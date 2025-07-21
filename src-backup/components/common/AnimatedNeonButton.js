import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../styles';

const AnimatedNeonButton = ({
  title,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onPress,
  style,
  textStyle,
  pulse = false,
  children,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // フェードインアニメーション
  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // パルス効果
  useEffect(() => {
    if (pulse && !disabled && !loading) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [pulse, disabled, loading]);

  const handlePressIn = () => {
    if (!disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
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
      case 'outline':
        baseStyle.push(styles.outline);
        break;
      case 'danger':
        baseStyle.push(styles.danger);
        break;
      case 'ghost':
        baseStyle.push(styles.ghost);
        break;
      default:
        baseStyle.push(styles.primary);
    }
    
    // サイズ
    switch (size) {
      case 'small':
        baseStyle.push(styles.small);
        break;
      case 'large':
        baseStyle.push(styles.large);
        break;
      default:
        baseStyle.push(styles.medium);
    }
    
    // 無効状態
    if (disabled || loading) {
      baseStyle.push(styles.disabled);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text];
    
    // バリアント
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.textPrimary);
        break;
      case 'secondary':
        baseStyle.push(styles.textSecondary);
        break;
      case 'accent':
        baseStyle.push(styles.textAccent);
        break;
      case 'outline':
        baseStyle.push(styles.textOutline);
        break;
      case 'danger':
        baseStyle.push(styles.textDanger);
        break;
      case 'ghost':
        baseStyle.push(styles.textGhost);
        break;
      default:
        baseStyle.push(styles.textPrimary);
    }
    
    // サイズ
    switch (size) {
      case 'small':
        baseStyle.push(styles.textSmall);
        break;
      case 'large':
        baseStyle.push(styles.textLarge);
        break;
      default:
        baseStyle.push(styles.textMedium);
    }
    
    // 無効状態
    if (disabled || loading) {
      baseStyle.push(styles.textDisabled);
    }
    
    return baseStyle;
  };

  return (
    <Animated.View
      style={[
        {
          opacity: opacityAnim,
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) }
          ]
        }
      ]}
    >
      <TouchableOpacity
        style={[getButtonStyle(), style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        {...props}
      >
        {loading ? (
          <Animated.View style={styles.loadingContainer}>
            <Text style={[getTextStyle(), textStyle]}>...</Text>
          </Animated.View>
        ) : (
          <>
            {title && <Text style={[getTextStyle(), textStyle]}>{title}</Text>}
            {children}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.base,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  
  // バリアント
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8
  },
  
  secondary: {
    backgroundColor: 'transparent',
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6
  },
  
  accent: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8
  },
  
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3
  },
  
  danger: {
    backgroundColor: colors.error,
    borderColor: colors.error,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8
  },
  
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent'
  },
  
  // サイズ
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    minHeight: 36,
  },
  
  medium: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    minHeight: 48,
  },
  
  large: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    minHeight: 56,
  },
  
  // 状態
  disabled: {
    opacity: 0.6,
    shadowOpacity: 0
  },
  
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  // テキスト
  text: {
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  
  textSmall: {
    fontSize: typography.sizes.sm,
  },
  
  textMedium: {
    fontSize: typography.sizes.base,
  },
  
  textLarge: {
    fontSize: typography.sizes.lg,
  },
  
  textPrimary: {
    color: colors.secondaryDark,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5
  },
  
  textSecondary: {
    color: colors.secondary,
    textShadowColor: colors.secondary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5
  },
  
  textAccent: {
    color: colors.surfaceDark,
    textShadowColor: colors.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5
  },
  
  textOutline: {
    color: colors.text,
    fontWeight: typography.weights.semibold
  },
  
  textDanger: {
    color: colors.text,
    textShadowColor: colors.error,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5
  },
  
  textGhost: {
    color: colors.primary,
    fontWeight: typography.weights.semibold
  },
  
  textDisabled: {
    color: colors.textDisabled,
  },
});

export default AnimatedNeonButton; 