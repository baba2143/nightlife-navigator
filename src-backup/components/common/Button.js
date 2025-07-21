import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { borderRadius, colors, shadows, spacing, typography } from '../../styles';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  children,
  ...props
}) => {
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
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? colors.surface : colors.secondary} 
        />
      ) : (
        <>
          {icon && icon}
          {title && <Text style={[getTextStyle(), textStyle]}>{title}</Text>}
          {children}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.base,
    ...shadows.sm
  },
  
  // バリアント
  primary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  
  secondary: {
    backgroundColor: 'transparent',
    borderColor: colors.secondary,
    borderWidth: 1,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  
  accent: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  
  danger: {
    backgroundColor: colors.error,
    borderColor: colors.error,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
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
    color: colors.surface,
    fontWeight: typography.weights.bold
  },
  
  textSecondary: {
    color: colors.secondary,
    fontWeight: typography.weights.bold
  },
  
  textOutline: {
    color: colors.text,
    fontWeight: typography.weights.semibold
  },
  
  textDanger: {
    color: colors.surface,
    fontWeight: typography.weights.bold
  },
  
  textGhost: {
    color: colors.secondary,
    fontWeight: typography.weights.semibold
  },
  
  textDisabled: {
    color: colors.textDisabled,
  },
});

export default Button; 