import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeProvider';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  ...props
}) => {
  const { colors, typography, borderRadius, spacing } = useTheme();

  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: iconPosition === 'right' ? 'row-reverse' : 'row',
    };

    // Size variants
    const sizeStyles = {
      small: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        minHeight: 36,
      },
      medium: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        minHeight: 48,
      },
      large: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        minHeight: 56,
      },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: disabled ? colors.border : colors.primary,
      },
      secondary: {
        backgroundColor: disabled ? colors.border : colors.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled ? colors.border : colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      danger: {
        backgroundColor: disabled ? colors.border : colors.error,
      },
      success: {
        backgroundColor: disabled ? colors.border : colors.success,
      },
    };

    return [
      baseStyle,
      sizeStyles[size],
      variantStyles[variant],
    ];
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      ...typography.button,
      textAlign: 'center',
    };

    const sizeTextStyles = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
    };

    const variantTextStyles = {
      primary: {
        color: disabled ? colors.textSecondary : '#FFFFFF',
      },
      secondary: {
        color: disabled ? colors.textSecondary : '#FFFFFF',
      },
      outline: {
        color: disabled ? colors.textSecondary : colors.primary,
      },
      ghost: {
        color: disabled ? colors.textSecondary : colors.primary,
      },
      danger: {
        color: disabled ? colors.textSecondary : '#FFFFFF',
      },
      success: {
        color: disabled ? colors.textSecondary : '#FFFFFF',
      },
    };

    return [
      baseTextStyle,
      sizeTextStyles[size],
      variantTextStyles[variant],
      textStyle,
    ];
  };

  const getIconSize = () => {
    const iconSizes = {
      small: 16,
      medium: 20,
      large: 24,
    };
    return iconSizes[size];
  };

  const getIconColor = () => {
    if (disabled) return colors.textSecondary;
    
    const iconColors = {
      primary: '#FFFFFF',
      secondary: '#FFFFFF',
      outline: colors.primary,
      ghost: colors.primary,
      danger: '#FFFFFF',
      success: '#FFFFFF',
    };
    
    return iconColors[variant];
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          size="small" 
          color={getIconColor()} 
          style={styles.loader}
        />
      );
    }

    return (
      <View style={styles.content}>
        {icon && (
          <Ionicons
            name={icon}
            size={getIconSize()}
            color={getIconColor()}
            style={[
              styles.icon,
              iconPosition === 'right' ? styles.iconRight : styles.iconLeft,
            ]}
          />
        )}
        <Text style={getTextStyle()}>{title}</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    // Base icon styles
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  loader: {
    // Loader styles
  },
});

export default Button;