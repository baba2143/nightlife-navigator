/**
 * 検索バーコンポーネント
 * やさしいピンクデザインシステムベースの検索バー
 */

import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors } from '../../design-system/colors-soft-pink';
import { spacingSystem } from '../../design-system/spacing-comfortable';
import { borderRadiusSystem } from '../../design-system/borders-rounded';
import { shadowSystem } from '../../design-system/shadows-soft-pink';
import Text from './Text';

const SearchBar = ({
  placeholder = "やさしく検索してください...",
  value,
  onChangeText,
  onSubmit,
  onFocus,
  onBlur,
  onClear,
  leftIcon,
  rightIcon,
  showClearButton = true,
  showSearchButton = true,
  disabled = false,
  variant = 'default',
  size = 'md',
  style,
  inputStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [focusAnim] = useState(new Animated.Value(0));

  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();

    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    onBlur?.(e);
  };

  const handleClear = () => {
    onChangeText?.('');
    onClear?.();
  };

  const handleSubmit = () => {
    onSubmit?.(value);
  };

  const getVariantStyles = () => {
    const variants = {
      default: {
        backgroundColor: theme.colors.background.surface,
        borderColor: theme.colors.border.default,
      },
      filled: {
        backgroundColor: theme.colors.background.pinkLight,
        borderColor: theme.colors.border.pink,
      },
      outlined: {
        backgroundColor: theme.colors.background.surface,
        borderColor: theme.colors.border.medium,
      },
      minimal: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      },
    };

    return variants[variant] || variants.default;
  };

  const getSizeStyles = () => {
    const sizes = {
      sm: {
        paddingHorizontal: theme.spacing.interactive.input.horizontal,
        paddingVertical: theme.spacing.interactive.input.vertical - 4,
        fontSize: 14,
        borderRadius: theme.borderRadius.component.input.small,
      },
      md: {
        paddingHorizontal: theme.spacing.interactive.input.horizontal,
        paddingVertical: theme.spacing.interactive.input.vertical,
        fontSize: 16,
        borderRadius: theme.borderRadius.component.input.medium,
      },
      lg: {
        paddingHorizontal: theme.spacing.interactive.input.large.horizontal,
        paddingVertical: theme.spacing.interactive.input.large.vertical,
        fontSize: 18,
        borderRadius: theme.borderRadius.component.input.large,
      },
    };

    return sizes[size] || sizes.md;
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const animatedStyles = {
    borderColor: isFocused ? theme.colors.brand : variantStyles.borderColor,
    shadowColor: theme.colors.brand,
    shadowOpacity: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.07, 0.2],
    }),
    shadowRadius: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [3, 6],
    }),
    elevation: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [2, 4],
    }),
  };

  const containerStyles = [
    styles.container,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      borderRadius: sizeStyles.borderRadius,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      paddingVertical: sizeStyles.paddingVertical,
      ...theme.shadows.elevation[2],
    },
    disabled && styles.disabled,
    style,
  ];

  const inputStyles = [
    styles.input,
    {
      fontSize: sizeStyles.fontSize,
      color: theme.colors.text.primary,
    },
    inputStyle,
  ];

  return (
    <Animated.View style={[containerStyles, animatedStyles]}>
      {leftIcon && (
        <View style={styles.leftIcon}>
          {leftIcon}
        </View>
      )}
      
      <TextInput
        style={inputStyles}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.tertiary}
        editable={!disabled}
        returnKeyType="search"
        onSubmitEditing={handleSubmit}
        {...props}
      />
      
      {showClearButton && value && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.clearButtonText, { color: theme.colors.text.tertiary }]}>
            ✕
          </Text>
        </TouchableOpacity>
      )}
      
      {rightIcon && (
        <View style={styles.rightIcon}>
          {rightIcon}
        </View>
      )}
      
      {showSearchButton && (
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: theme.colors.brand }]}
          onPress={handleSubmit}
          disabled={disabled}
        >
          <Text style={[styles.searchButtonText, { color: theme.colors.white }]}>
            🔍
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

// 高度な検索バー
export const AdvancedSearchBar = ({
  filters = [],
  selectedFilters = [],
  onFilterChange,
  showFilters = true,
  ...props
}) => {
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  const handleFilterSelect = (filter) => {
    const newFilters = selectedFilters.includes(filter)
      ? selectedFilters.filter(f => f !== filter)
      : [...selectedFilters, filter];
    
    onFilterChange?.(newFilters);
  };

  return (
    <View style={styles.advancedContainer}>
      <SearchBar
        {...props}
        rightIcon={
          showFilters && (
            <TouchableOpacity
              style={styles.filterToggle}
              onPress={toggleFilters}
            >
              <Text style={[styles.filterToggleText, { color: theme.colors.brand }]}>
                ⚙️
              </Text>
            </TouchableOpacity>
          )
        }
      />
      
      {filtersVisible && (
        <View style={[styles.filtersContainer, { backgroundColor: theme.colors.background.pinkLight }]}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedFilters.includes(filter)
                    ? theme.colors.brand
                    : theme.colors.background.surface,
                  borderColor: selectedFilters.includes(filter)
                    ? theme.colors.brand
                    : theme.colors.border.pink,
                }
              ]}
              onPress={() => handleFilterSelect(filter)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: selectedFilters.includes(filter)
                      ? theme.colors.white
                      : theme.colors.brand,
                  }
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// 検索候補付き検索バー
export const AutocompleteSearchBar = ({
  suggestions = [],
  onSuggestionSelect,
  showSuggestions = true,
  maxSuggestions = 5,
  ...props
}) => {
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const filteredSuggestions = suggestions
    .filter(suggestion => 
      suggestion.toLowerCase().includes(props.value?.toLowerCase() || '')
    )
    .slice(0, maxSuggestions);

  const handleSuggestionPress = (suggestion) => {
    onSuggestionSelect?.(suggestion);
    setShowSuggestionsList(false);
  };

  const handleFocus = (e) => {
    setShowSuggestionsList(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e) => {
    // 少し遅延させて、候補選択を可能にする
    setTimeout(() => setShowSuggestionsList(false), 200);
    props.onBlur?.(e);
  };

  return (
    <View style={styles.autocompleteContainer}>
      <SearchBar
        {...props}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      
      {showSuggestionsList && filteredSuggestions.length > 0 && (
        <View style={[
          styles.suggestionsContainer,
          {
            backgroundColor: theme.colors.background.surface,
            borderColor: theme.colors.border.light,
            ...theme.shadows.elevation[3],
          }
        ]}>
          {filteredSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.suggestionItem,
                {
                  borderBottomColor: theme.colors.border.light,
                  borderBottomWidth: index < filteredSuggestions.length - 1 ? 1 : 0,
                }
              ]}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <Text style={[styles.suggestionText, { color: theme.colors.text.primary }]}>
                {suggestion}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
  },
  
  input: {
    flex: 1,
    paddingVertical: 0,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  
  leftIcon: {
    marginRight: 12,
  },
  
  rightIcon: {
    marginLeft: 12,
  },
  
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  searchButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  
  searchButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  disabled: {
    opacity: 0.6,
  },
  
  // 高度な検索バー
  advancedContainer: {
    position: 'relative',
  },
  
  filterToggle: {
    padding: 8,
  },
  
  filterToggleText: {
    fontSize: 16,
  },
  
  filtersContainer: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // オートコンプリート検索バー
  autocompleteContainer: {
    position: 'relative',
  },
  
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
  },
  
  suggestionItem: {
    padding: 16,
  },
  
  suggestionText: {
    fontSize: 16,
  },
});

// 名前付きエクスポート
export { AdvancedSearchBar, AutocompleteSearchBar };

// デフォルトエクスポート
export default SearchBar;