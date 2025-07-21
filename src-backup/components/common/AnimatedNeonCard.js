import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../../styles';

const AnimatedNeonCard = ({
  children,
  variant = 'default',
  elevation = 'medium',
  interactive = false,
  onPress,
  style,
  ...props
}) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;
  const [isPressed, setIsPressed] = useState(false);

  // フェードインアニメーション
  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    if (interactive) {
      setIsPressed(true);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.98,
          useNativeDriver: true,
        }),
        Animated.timing(shadowAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  const handlePressOut = () => {
    if (interactive) {
      setIsPressed(false);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(shadowAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  const getCardStyle = () => {
    const baseStyle = [styles.card];
    
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
      case 'glass':
        baseStyle.push(styles.glass);
        break;
      default:
        baseStyle.push(styles.default);
    }
    
    // エレベーション
    switch (elevation) {
      case 'low':
        baseStyle.push(styles.elevationLow);
        break;
      case 'high':
        baseStyle.push(styles.elevationHigh);
        break;
      default:
        baseStyle.push(styles.elevationMedium);
    }
    
    return baseStyle;
  };

  const getShadowStyle = () => {
    const baseShadow = {
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseShadow,
          shadowColor: colors.primary,
          shadowOpacity: shadowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.6],
          }),
          shadowRadius: shadowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [8, 12],
          }),
          elevation: shadowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [6, 10],
          }),
        };
      case 'secondary':
        return {
          ...baseShadow,
          shadowColor: colors.secondary,
          shadowOpacity: shadowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 0.5],
          }),
          shadowRadius: shadowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [6, 10],
          }),
          elevation: shadowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [4, 8],
          }),
        };
      case 'accent':
        return {
          ...baseShadow,
          shadowColor: colors.accent,
          shadowOpacity: shadowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.6],
          }),
          shadowRadius: shadowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [8, 12],
          }),
          elevation: shadowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [6, 10],
          }),
        };
      default:
        return {
          ...baseShadow,
          shadowColor: colors.primary,
          shadowOpacity: shadowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 0.4],
          }),
          shadowRadius: shadowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [6, 8],
          }),
          elevation: shadowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [4, 6],
          }),
        };
    }
  };

  const CardComponent = interactive ? TouchableOpacity : View;

  return (
    <Animated.View
      style={[
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
        getShadowStyle(),
      ]}
    >
      <CardComponent
        style={[getCardStyle(), style]}
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: spacing.base,
  },
  
  // バリアント
  default: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  
  primary: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  accent: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  success: {
    backgroundColor: colors.surface,
    borderColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  warning: {
    backgroundColor: colors.surface,
    borderColor: colors.warning,
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  error: {
    backgroundColor: colors.surface,
    borderColor: colors.error,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  glass: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  
  // エレベーション
  elevationLow: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  
  elevationMedium: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  
  elevationHigh: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
});

export default AnimatedNeonCard; 