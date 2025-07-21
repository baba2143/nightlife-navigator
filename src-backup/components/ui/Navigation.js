/**
 * ナビゲーションコンポーネント
 * やさしいピンクデザインシステムベースのナビゲーション
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors } from '../../design-system/colors-soft-pink';
import { spacingSystem } from '../../design-system/spacing-comfortable';
import { borderRadiusSystem } from '../../design-system/borders-rounded';
import { shadowSystem } from '../../design-system/shadows-soft-pink';
import Text from './Text';

// ヘッダーナビゲーション
const Header = ({
  title,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  subtitle,
  variant = 'default',
  style,
  ...props
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const getVariantStyles = () => {
    const variants = {
      default: {
        backgroundColor: theme.colors.background.surface,
        borderBottomColor: theme.colors.border.light,
      },
      pink: {
        backgroundColor: theme.colors.background.pinkLight,
        borderBottomColor: theme.colors.border.pink,
      },
      transparent: {
        backgroundColor: 'transparent',
        borderBottomColor: 'transparent',
      },
    };

    return variants[variant] || variants.default;
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[
      styles.header,
      {
        backgroundColor: variantStyles.backgroundColor,
        borderBottomColor: variantStyles.borderBottomColor,
        paddingHorizontal: theme.spacing.navigation.header.padding,
        paddingVertical: theme.spacing.navigation.header.padding,
        ...theme.shadows.elevation[1],
      },
      style,
    ]} {...props}>
      <View style={styles.headerContent}>
        {leftIcon && (
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.colors.background.pinkLight }]}
            onPress={onLeftPress}
          >
            {leftIcon}
          </TouchableOpacity>
        )}
        
        <View style={styles.headerTitle}>
          <Text variant="h4" style={{ color: theme.colors.brand, textAlign: 'center' }}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="caption" style={{ color: theme.colors.text.secondary, textAlign: 'center' }}>
              {subtitle}
            </Text>
          )}
        </View>
        
        {rightIcon && (
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.colors.background.pinkLight }]}
            onPress={onRightPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// タブナビゲーション
const TabBar = ({
  tabs = [],
  activeTab = 0,
  onTabChange,
  variant = 'default',
  style,
  ...props
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const getVariantStyles = () => {
    const variants = {
      default: {
        backgroundColor: theme.colors.background.surface,
        borderTopColor: theme.colors.border.light,
      },
      pink: {
        backgroundColor: theme.colors.background.pinkLight,
        borderTopColor: theme.colors.border.pink,
      },
      filled: {
        backgroundColor: theme.colors.background.surface,
        borderTopColor: theme.colors.border.light,
      },
    };

    return variants[variant] || variants.default;
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[
      styles.tabBar,
      {
        backgroundColor: variantStyles.backgroundColor,
        borderTopColor: variantStyles.borderTopColor,
        paddingHorizontal: theme.spacing.navigation.tabBar.padding,
        paddingVertical: theme.spacing.navigation.tabBar.padding,
        ...theme.shadows.elevation[2],
      },
      style,
    ]} {...props}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.tabItem,
            {
              backgroundColor: activeTab === index 
                ? theme.colors.brand 
                : 'transparent',
              borderRadius: theme.borderRadius.component.navigation.tab,
            }
          ]}
          onPress={() => onTabChange?.(index)}
        >
          {tab.icon && (
            <View style={styles.tabIcon}>
              {tab.icon}
            </View>
          )}
          <Text
            variant="caption"
            style={{
              color: activeTab === index 
                ? theme.colors.white 
                : theme.colors.text.secondary,
              fontWeight: activeTab === index ? '600' : '400',
            }}
          >
            {tab.label}
          </Text>
          {tab.badge && (
            <View style={[
              styles.tabBadge,
              { backgroundColor: theme.colors.error[500] }
            ]}>
              <Text
                variant="caption"
                style={{
                  color: theme.colors.white,
                  fontSize: 10,
                  fontWeight: '600',
                }}
              >
                {tab.badge}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

// サイドナビゲーション
const Sidebar = ({
  items = [],
  activeItem = 0,
  onItemChange,
  title,
  variant = 'default',
  style,
  ...props
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const getVariantStyles = () => {
    const variants = {
      default: {
        backgroundColor: theme.colors.background.surface,
        borderRightColor: theme.colors.border.light,
      },
      pink: {
        backgroundColor: theme.colors.background.pinkLight,
        borderRightColor: theme.colors.border.pink,
      },
    };

    return variants[variant] || variants.default;
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[
      styles.sidebar,
      {
        backgroundColor: variantStyles.backgroundColor,
        borderRightColor: variantStyles.borderRightColor,
        paddingHorizontal: theme.spacing.navigation.sidebar.padding,
        paddingVertical: theme.spacing.navigation.sidebar.padding,
        width: theme.spacing.navigation.sidebar.width,
        ...theme.shadows.elevation[2],
      },
      style,
    ]} {...props}>
      {title && (
        <Text
          variant="h4"
          style={{
            color: theme.colors.brand,
            marginBottom: theme.spacing.navigation.sidebar.gap * 2,
          }}
        >
          {title}
        </Text>
      )}
      
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.sidebarItem,
            {
              backgroundColor: activeItem === index 
                ? theme.colors.background.pinkLight 
                : 'transparent',
              borderRadius: theme.borderRadius.component.navigation.tab,
              paddingHorizontal: theme.spacing.navigation.sidebar.itemPadding,
              paddingVertical: theme.spacing.navigation.sidebar.itemPadding,
              marginBottom: theme.spacing.navigation.sidebar.gap,
            }
          ]}
          onPress={() => onItemChange?.(index)}
        >
          {item.icon && (
            <View style={styles.sidebarIcon}>
              {item.icon}
            </View>
          )}
          <Text
            variant="body"
            style={{
              color: activeItem === index 
                ? theme.colors.brand 
                : theme.colors.text.primary,
              fontWeight: activeItem === index ? '600' : '400',
            }}
          >
            {item.label}
          </Text>
          {item.badge && (
            <View style={[
              styles.sidebarBadge,
              { backgroundColor: theme.colors.brand }
            ]}>
              <Text
                variant="caption"
                style={{
                  color: theme.colors.white,
                  fontSize: 10,
                  fontWeight: '600',
                }}
              >
                {item.badge}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ブレッドクラム
const Breadcrumb = ({
  items = [],
  separator = '/',
  onItemPress,
  maxItems = 3,
  style,
  ...props
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const displayItems = items.length > maxItems 
    ? [items[0], '...', ...items.slice(-maxItems + 1)]
    : items;

  return (
    <View style={[
      styles.breadcrumb,
      {
        paddingHorizontal: theme.spacing.navigation.breadcrumb.padding,
        paddingVertical: theme.spacing.navigation.breadcrumb.padding,
      },
      style,
    ]} {...props}>
      {displayItems.map((item, index) => (
        <View key={index} style={styles.breadcrumbItem}>
          {item === '...' ? (
            <Text variant="bodySmall" style={{ color: theme.colors.text.tertiary }}>
              ...
            </Text>
          ) : (
            <TouchableOpacity
              style={[
                styles.breadcrumbLink,
                {
                  paddingHorizontal: theme.spacing.navigation.breadcrumb.itemPadding,
                  paddingVertical: theme.spacing.navigation.breadcrumb.itemPadding,
                }
              ]}
              onPress={() => onItemPress?.(item, index)}
            >
              <Text
                variant="bodySmall"
                style={{
                  color: index === displayItems.length - 1 
                    ? theme.colors.text.primary 
                    : theme.colors.brand,
                  fontWeight: index === displayItems.length - 1 ? '600' : '400',
                }}
              >
                {item.label || item}
              </Text>
            </TouchableOpacity>
          )}
          
          {index < displayItems.length - 1 && (
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.text.tertiary,
                marginHorizontal: theme.spacing.navigation.breadcrumb.gap,
              }}
            >
              {separator}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};

// ナビゲーションボタン
const NavButton = ({
  children,
  icon,
  selected = false,
  onPress,
  variant = 'default',
  size = 'md',
  style,
  ...props
}) => {
  const [pressAnim] = useState(new Animated.Value(1));
  
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getVariantStyles = () => {
    const variants = {
      default: {
        backgroundColor: selected 
          ? theme.colors.background.pinkLight 
          : 'transparent',
        borderColor: selected 
          ? theme.colors.border.pink 
          : 'transparent',
      },
      filled: {
        backgroundColor: selected 
          ? theme.colors.brand 
          : theme.colors.background.surface,
        borderColor: selected 
          ? theme.colors.brand 
          : theme.colors.border.light,
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: selected 
          ? theme.colors.brand 
          : theme.colors.border.medium,
      },
    };

    return variants[variant] || variants.default;
  };

  const getSizeStyles = () => {
    const sizes = {
      sm: {
        paddingHorizontal: theme.spacing.component.padding.sm,
        paddingVertical: theme.spacing.component.padding.xs,
        fontSize: 14,
      },
      md: {
        paddingHorizontal: theme.spacing.component.padding.md,
        paddingVertical: theme.spacing.component.padding.sm,
        fontSize: 16,
      },
      lg: {
        paddingHorizontal: theme.spacing.component.padding.lg,
        paddingVertical: theme.spacing.component.padding.md,
        fontSize: 18,
      },
    };

    return sizes[size] || sizes.md;
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
      <TouchableOpacity
        style={[
          styles.navButton,
          {
            backgroundColor: variantStyles.backgroundColor,
            borderColor: variantStyles.borderColor,
            borderRadius: theme.borderRadius.component.navigation.tab,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            paddingVertical: sizeStyles.paddingVertical,
            ...theme.shadows.navigation.navButton[selected ? 'selected' : 'rest'],
          },
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        {icon && (
          <View style={styles.navButtonIcon}>
            {icon}
          </View>
        )}
        <Text
          variant="bodySmall"
          style={{
            color: variant === 'filled' && selected 
              ? theme.colors.white 
              : selected 
                ? theme.colors.brand 
                : theme.colors.text.primary,
            fontSize: sizeStyles.fontSize,
            fontWeight: selected ? '600' : '400',
          }}
        >
          {children}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // ヘッダー
  header: {
    borderBottomWidth: 1,
  },
  
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  headerButton: {
    padding: 12,
    borderRadius: 12,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  headerTitle: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  
  // タブバー
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
  },
  
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    position: 'relative',
  },
  
  tabIcon: {
    marginBottom: 4,
  },
  
  tabBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // サイドバー
  sidebar: {
    borderRightWidth: 1,
  },
  
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  
  sidebarIcon: {
    marginRight: 12,
  },
  
  sidebarBadge: {
    position: 'absolute',
    right: 8,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // ブレッドクラム
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  breadcrumbLink: {
    borderRadius: 8,
  },
  
  // ナビゲーションボタン
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  
  navButtonIcon: {
    marginRight: 8,
  },
});

// 名前付きエクスポート
export { Header, TabBar, Sidebar, Breadcrumb, NavButton };

// デフォルトエクスポート
export default {
  Header,
  TabBar,
  Sidebar,
  Breadcrumb,
  NavButton,
};