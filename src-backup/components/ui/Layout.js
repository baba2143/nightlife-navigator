/**
 * レイアウトコンポーネント
 * やさしいピンクデザインシステムベースのレイアウト
 */

import React from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { colors } from '../../design-system/colors-soft-pink';
import { spacingSystem } from '../../design-system/spacing-comfortable';
import { borderRadiusSystem } from '../../design-system/borders-rounded';
import { shadowSystem } from '../../design-system/shadows-soft-pink';
import Text from './Text';

// メインコンテナ
export const Container = ({
  children,
  padding = 'md',
  backgroundColor = 'primary',
  style,
  ...props
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const getPaddingValue = () => {
    const paddingMap = {
      none: 0,
      xs: theme.spacing.layout.container.xs,
      sm: theme.spacing.layout.container.sm,
      md: theme.spacing.layout.container.md,
      lg: theme.spacing.layout.container.lg,
      xl: theme.spacing.layout.container.xl,
    };
    return paddingMap[padding] || paddingMap.md;
  };

  const getBackgroundColor = () => {
    return theme.colors.background[backgroundColor] || theme.colors.background.primary;
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          padding: getPaddingValue(),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

// グリッドレイアウト
export const Grid = ({
  children,
  columns = 2,
  gap = 'md',
  style,
  ...props
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const getGapValue = () => {
    const gapMap = {
      none: 0,
      xs: theme.spacing.layout.grid.gap / 2,
      sm: theme.spacing.layout.grid.gap,
      md: theme.spacing.layout.grid.gap,
      lg: theme.spacing.layout.grid.gapLarge,
      xl: theme.spacing.layout.grid.gapLarge * 1.5,
    };
    return gapMap[gap] || gapMap.md;
  };

  const gapValue = getGapValue();

  return (
    <View
      style={[
        styles.grid,
        {
          gap: gapValue,
        },
        style,
      ]}
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <View
          key={index}
          style={[
            styles.gridItem,
            {
              width: `${(100 / columns) - ((columns - 1) * gapValue) / columns}%`,
            },
          ]}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

// セクション
export const Section = ({
  children,
  title,
  subtitle,
  spacing = 'md',
  backgroundColor = 'transparent',
  style,
  ...props
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const getSpacingValue = () => {
    const spacingMap = {
      none: 0,
      xs: theme.spacing.layout.section.xs,
      sm: theme.spacing.layout.section.sm,
      md: theme.spacing.layout.section.md,
      lg: theme.spacing.layout.section.lg,
      xl: theme.spacing.layout.section.xl,
    };
    return spacingMap[spacing] || spacingMap.md;
  };

  const getBackgroundColor = () => {
    if (backgroundColor === 'transparent') return 'transparent';
    return theme.colors.background[backgroundColor] || theme.colors.background.primary;
  };

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: getBackgroundColor(),
          marginBottom: getSpacingValue(),
        },
        style,
      ]}
      {...props}
    >
      {title && (
        <View style={styles.sectionHeader}>
          <Text
            variant="h3"
            style={{
              color: theme.colors.brand,
              marginBottom: subtitle ? theme.spacing.component.margin.xs : theme.spacing.component.margin.md,
            }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.component.margin.md,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}
      {children}
    </View>
  );
};

// スペーサー
export const Spacer = ({
  size = 'md',
  direction = 'vertical',
  style,
  ...props
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const getSizeValue = () => {
    const sizeMap = {
      xs: theme.spacing.component.margin.xs,
      sm: theme.spacing.component.margin.sm,
      md: theme.spacing.component.margin.md,
      lg: theme.spacing.component.margin.lg,
      xl: theme.spacing.component.margin.xl,
    };
    return sizeMap[size] || sizeMap.md;
  };

  const sizeValue = getSizeValue();

  return (
    <View
      style={[
        {
          width: direction === 'horizontal' ? sizeValue : 'auto',
          height: direction === 'vertical' ? sizeValue : 'auto',
        },
        style,
      ]}
      {...props}
    />
  );
};

// フレックスレイアウト
export const Flex = ({
  children,
  direction = 'row',
  justify = 'flex-start',
  align = 'stretch',
  wrap = 'nowrap',
  gap = 'md',
  style,
  ...props
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const getGapValue = () => {
    const gapMap = {
      none: 0,
      xs: theme.spacing.component.gap.xs,
      sm: theme.spacing.component.gap.sm,
      md: theme.spacing.component.gap.md,
      lg: theme.spacing.component.gap.lg,
      xl: theme.spacing.component.gap.xl,
    };
    return gapMap[gap] || gapMap.md;
  };

  return (
    <View
      style={[
        styles.flex,
        {
          flexDirection: direction,
          justifyContent: justify,
          alignItems: align,
          flexWrap: wrap,
          gap: getGapValue(),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

// セーフエリアコンテナ
export const SafeContainer = ({
  children,
  backgroundColor = 'primary',
  style,
  ...props
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const getBackgroundColor = () => {
    return theme.colors.background[backgroundColor] || theme.colors.background.primary;
  };

  return (
    <SafeAreaView
      style={[
        styles.safeContainer,
        {
          backgroundColor: getBackgroundColor(),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
};

// スクロールコンテナ
export const ScrollContainer = ({
  children,
  padding = 'md',
  backgroundColor = 'primary',
  showsVerticalScrollIndicator = false,
  style,
  contentContainerStyle,
  ...props
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const getPaddingValue = () => {
    const paddingMap = {
      none: 0,
      xs: theme.spacing.layout.container.xs,
      sm: theme.spacing.layout.container.sm,
      md: theme.spacing.layout.container.md,
      lg: theme.spacing.layout.container.lg,
      xl: theme.spacing.layout.container.xl,
    };
    return paddingMap[padding] || paddingMap.md;
  };

  const getBackgroundColor = () => {
    return theme.colors.background[backgroundColor] || theme.colors.background.primary;
  };

  return (
    <ScrollView
      style={[
        styles.scrollContainer,
        {
          backgroundColor: getBackgroundColor(),
        },
        style,
      ]}
      contentContainerStyle={[
        {
          padding: getPaddingValue(),
        },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      {...props}
    >
      {children}
    </ScrollView>
  );
};

// カードレイアウト
export const CardLayout = ({
  children,
  padding = 'lg',
  backgroundColor = 'surface',
  elevated = true,
  style,
  ...props
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const getPaddingValue = () => {
    const paddingMap = {
      none: 0,
      xs: theme.spacing.layout.card.padding / 2,
      sm: theme.spacing.layout.card.padding,
      md: theme.spacing.layout.card.padding,
      lg: theme.spacing.layout.card.paddingLarge,
      xl: theme.spacing.layout.card.paddingLarge * 1.5,
    };
    return paddingMap[padding] || paddingMap.lg;
  };

  const getBackgroundColor = () => {
    return theme.colors.background[backgroundColor] || theme.colors.background.surface;
  };

  return (
    <View
      style={[
        styles.cardLayout,
        {
          backgroundColor: getBackgroundColor(),
          padding: getPaddingValue(),
          borderRadius: theme.borderRadius.component.card.medium,
          borderWidth: 1,
          borderColor: theme.colors.border.default,
          ...(elevated ? theme.shadows.elevation[2] : {}),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

// 区切り線
export const Divider = ({
  orientation = 'horizontal',
  thickness = 1,
  color = 'default',
  style,
  ...props
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const getColor = () => {
    return theme.colors.border[color] || theme.colors.border.default;
  };

  return (
    <View
      style={[
        styles.divider,
        {
          width: orientation === 'horizontal' ? '100%' : thickness,
          height: orientation === 'vertical' ? '100%' : thickness,
          backgroundColor: getColor(),
        },
        style,
      ]}
      {...props}
    />
  );
};

// センタリング
export const Center = ({
  children,
  style,
  ...props
}) => {
  return (
    <View
      style={[
        styles.center,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  safeContainer: {
    flex: 1,
  },
  
  scrollContainer: {
    flex: 1,
  },
  
  section: {
    // marginBottom will be set dynamically
  },
  
  sectionHeader: {
    // marginBottom will be set dynamically
  },
  
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  gridItem: {
    // width will be set dynamically
  },
  
  flex: {
    // flex properties will be set dynamically
  },
  
  divider: {
    // dimensions will be set dynamically
  },
  
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  cardLayout: {
    // styles will be set dynamically
  },
});

// 名前付きエクスポート
export {
  Container,
  SafeContainer,
  ScrollContainer,
  Section,
  Grid,
  Flex,
  Spacer,
  Divider,
  Center,
  CardLayout,
};

// デフォルトエクスポート
export default {
  Container,
  SafeContainer,
  ScrollContainer,
  Section,
  Grid,
  Flex,
  Spacer,
  Divider,
  Center,
  CardLayout,
};