/**
 * インプットコンポーネント
 * やさしいピンクデザインシステムベースのインプット
 */

import React, { useState, useRef } from 'react';
import { View, TextInput, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors } from '../../design-system/colors-soft-pink';
import { spacingSystem } from '../../design-system/spacing-comfortable';
import { borderRadiusSystem } from '../../design-system/borders-rounded';
import { shadowSystem } from '../../design-system/shadows-soft-pink';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  onFocus,
  onBlur,
  error,
  success,
  disabled = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  multiline = false,
  numberOfLines = 1,
  maxLength,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  labelStyle,
  errorStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };
  const inputStyles = {
    baseStyle: {
      borderRadius: theme.borderRadius.component.input.medium,
      borderWidth: 1,
      paddingHorizontal: theme.spacing.interactive.input.horizontal,
      paddingVertical: theme.spacing.interactive.input.vertical,
      backgroundColor: theme.colors.background.surface,
    },
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    
    Animated.parallel([
      Animated.timing(focusAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(labelAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    if (!value) {
      Animated.timing(labelAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const getStatusStyles = () => {
    if (error) {
      return {
        borderColor: theme.colors.error[500],
        shadowColor: theme.colors.error[500],
      };
    }
    
    if (success) {
      return {
        borderColor: theme.colors.success[500],
        shadowColor: theme.colors.success[500],
      };
    }
    
    if (isFocused) {
      return {
        borderColor: theme.colors.brand,
        shadowColor: theme.colors.brand,
      };
    }
    
    return {
      borderColor: theme.colors.border.default,
      shadowColor: 'transparent',
    };
  };

  const statusStyles = getStatusStyles();

  const animatedContainerStyle = {
    borderColor: statusStyles.borderColor,
    shadowColor: statusStyles.shadowColor,
    shadowOpacity: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.2],
    }),
    shadowRadius: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 6],
    }),
    elevation: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 3],
    }),
  };

  const animatedLabelStyle = {
    transform: [
      {
        translateY: labelAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -12],
        }),
      },
      {
        scale: labelAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.85],
        }),
      },
    ],
  };

  const containerStyles = [
    styles.container,
    style,
  ];

  const inputContainerStyles = [
    styles.inputContainer,
    inputStyles.baseStyle,
    disabled && styles.disabled,
  ];

  const textInputStyles = [
    styles.input,
    {
      color: theme.colors.text.primary,
      fontSize: 16,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    multiline && { height: numberOfLines * 20 + 20 },
    inputStyle,
  ];

  const labelStyles = [
    styles.label,
    {
      color: isFocused 
        ? (error ? theme.colors.error[500] : theme.colors.brand)
        : theme.colors.text.secondary,
      fontSize: 14,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    labelStyle,
  ];

  return (
    <View style={containerStyles}>
      {label && (
        <Animated.Text style={[labelStyles, animatedLabelStyle]}>
          {label}
        </Animated.Text>
      )}
      
      <Animated.View style={[inputContainerStyles, animatedContainerStyle]}>
        {leftIcon && (
          <View style={styles.leftIcon}>{leftIcon}</View>
        )}
        
        <TextInput
          style={textInputStyles}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.tertiary}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={!disabled}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={togglePasswordVisibility}
          >
            <Text style={styles.passwordToggleText}>
              {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
            </Text>
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </Animated.View>
      
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error[500] }, errorStyle]}>
          {error}
        </Text>
      )}
      
      {success && typeof success === 'string' && (
        <Text style={[styles.successText, { color: theme.colors.success[500] }]}>
          {success}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  
  input: {
    flex: 1,
    paddingVertical: 0,
    textAlignVertical: 'top',
  },
  
  label: {
    marginBottom: 4,
    fontWeight: '500',
  },
  
  leftIcon: {
    marginRight: 12,
  },
  
  rightIcon: {
    marginLeft: 12,
  },
  
  passwordToggle: {
    marginLeft: 12,
    padding: 8,
  },
  
  passwordToggleText: {
    fontSize: 16,
  },
  
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  
  successText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  
  disabled: {
    opacity: 0.6,
  },
});

export default Input;