import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../styles';

const Badge = ({
  children,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  ...props
}) => {
  const getBadgeStyle = () => {
    const baseStyle = [styles.badge];
    
    // バリアント
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.badgePrimary);
        break;
      case 'secondary':
        baseStyle.push(styles.badgeSecondary);
        break;
      case 'accent':
        baseStyle.push(styles.badgeAccent);
        break;
      case 'success':
        baseStyle.push(styles.badgeSuccess);
        break;
      case 'warning':
        baseStyle.push(styles.badgeWarning);
        break;
      case 'error':
        baseStyle.push(styles.badgeError);
        break;
      default:
        baseStyle.push(styles.badgePrimary);
    }
    
    // サイズ
    switch (size) {
      case 'small':
        baseStyle.push(styles.badgeSmall);
        break;
      case 'large':
        baseStyle.push(styles.badgeLarge);
        break;
      default:
        baseStyle.push(styles.badgeMedium);
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
      case 'success':
        baseStyle.push(styles.textSuccess);
        break;
      case 'warning':
        baseStyle.push(styles.textWarning);
        break;
      case 'error':
        baseStyle.push(styles.textError);
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
    
    return baseStyle;
  };

  return (
    <View style={[getBadgeStyle(), style]} {...props}>
      <Text style={[getTextStyle(), textStyle]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // バッジベース
  badge: {
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  
  // サイズ
  badgeSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 20,
    minHeight: 20
  },
  
  badgeMedium: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    minWidth: 24,
    minHeight: 24
  },
  
  badgeLarge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    minWidth: 32,
    minHeight: 32
  },
  
  // バリアント
  badgePrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4
  },
  
  badgeSecondary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4
  },
  
  badgeAccent: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4
  },
  
  badgeSuccess: {
    backgroundColor: colors.success,
    borderColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4
  },
  
  badgeWarning: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4
  },
  
  badgeError: {
    backgroundColor: colors.error,
    borderColor: colors.error,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4
  },
  
  // テキスト
  text: {
    fontWeight: typography.weights.semibold,
    textAlign: 'center'
  },
  
  textSmall: {
    fontSize: typography.sizes.xs
  },
  
  textMedium: {
    fontSize: typography.sizes.sm
  },
  
  textLarge: {
    fontSize: typography.sizes.base
  },
  
  textPrimary: {
    color: colors.secondaryDark,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3
  },
  
  textSecondary: {
    color: colors.surfaceDark,
    textShadowColor: colors.secondary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3
  },
  
  textAccent: {
    color: colors.surfaceDark,
    textShadowColor: colors.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3
  },
  
  textSuccess: {
    color: colors.text,
    textShadowColor: colors.success,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3
  },
  
  textWarning: {
    color: colors.text,
    textShadowColor: colors.warning,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3
  },
  
  textError: {
    color: colors.text,
    textShadowColor: colors.error,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3
  }
});

export default Badge; 