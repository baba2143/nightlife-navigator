import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from './ThemeProvider';

const Card = ({
  children,
  style,
  elevation = 'md',
  variant = 'default',
  onPress,
  disabled = false,
  ...props
}) => {
  const { colors, borderRadius, shadows, spacing } = useTheme();

  const getCardStyle = () => {
    const baseStyle = {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      ...shadows[elevation],
    };

    const variantStyles = {
      default: {},
      outlined: {
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.sm, // Reduce shadow for outlined variant
      },
      elevated: {
        ...shadows.lg,
      },
      flat: {
        elevation: 0,
        shadowOpacity: 0,
      },
    };

    return [baseStyle, variantStyles[variant]];
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[getCardStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={onPress ? 0.7 : 1}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;