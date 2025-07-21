/**
 * バッジコンポーネント
 * やさしいピンクデザインシステムベースのバッジ
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../design-system/colors-soft-pink';
import { spacingSystem } from '../../design-system/spacing-comfortable';
import { borderRadiusSystem } from '../../design-system/borders-rounded';
import { shadowSystem } from '../../design-system/shadows-soft-pink';
import Text from './Text';

const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  outlined = false,
  dot = false,
  count,
  maxCount = 99,
  showZero = false,
  neonGlow = false,
  style,
  textStyle,
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
      primary: {
        backgroundColor: outlined ? 'transparent' : theme.colors.brand,
        borderColor: theme.colors.brand,
        textColor: outlined ? theme.colors.brand : theme.colors.white,
        shadowColor: theme.colors.brand,
      },
      secondary: {
        backgroundColor: outlined ? 'transparent' : theme.colors.secondary[500],
        borderColor: theme.colors.secondary[500],
        textColor: outlined ? theme.colors.secondary[500] : theme.colors.white,
        shadowColor: theme.colors.secondary[500],
      },
      accent: {
        backgroundColor: outlined ? 'transparent' : theme.colors.accent[500],
        borderColor: theme.colors.accent[500],
        textColor: outlined ? theme.colors.accent[500] : theme.colors.white,
        shadowColor: theme.colors.accent[500],
      },
      success: {
        backgroundColor: outlined ? 'transparent' : theme.colors.success[500],
        borderColor: theme.colors.success[500],
        textColor: outlined ? theme.colors.success[500] : theme.colors.white,
        shadowColor: theme.colors.success[500],
      },
      warning: {
        backgroundColor: outlined ? 'transparent' : theme.colors.warning[500],
        borderColor: theme.colors.warning[500],
        textColor: outlined ? theme.colors.warning[500] : theme.colors.black,
        shadowColor: theme.colors.warning[500],
      },
      error: {
        backgroundColor: outlined ? 'transparent' : theme.colors.error[500],
        borderColor: theme.colors.error[500],
        textColor: outlined ? theme.colors.error[500] : theme.colors.white,
        shadowColor: theme.colors.error[500],
      },
      gray: {
        backgroundColor: outlined ? 'transparent' : theme.colors.gray[600],
        borderColor: theme.colors.gray[600],
        textColor: outlined ? theme.colors.gray[600] : theme.colors.white,
        shadowColor: theme.colors.gray[600],
      },
      soft: {
        backgroundColor: outlined ? 'transparent' : theme.colors.background.pinkLight,
        borderColor: theme.colors.border.pink,
        textColor: theme.colors.brand,
        shadowColor: theme.colors.brand,
      },
    };
    
    return variants[variant] || variants.primary;
  };

  const getSizeStyles = () => {
    const sizes = {
      sm: {
        paddingHorizontal: theme.spacing.component.padding.xs,
        paddingVertical: theme.spacing.component.padding.xs / 2,
        fontSize: 11,
        minWidth: 20,
        height: 20,
      },
      md: {
        paddingHorizontal: theme.spacing.component.padding.sm,
        paddingVertical: theme.spacing.component.padding.xs,
        fontSize: 12,
        minWidth: 24,
        height: 24,
      },
      lg: {
        paddingHorizontal: theme.spacing.component.padding.md,
        paddingVertical: theme.spacing.component.padding.sm,
        fontSize: 14,
        minWidth: 28,
        height: 28,
      },
    };
    
    return sizes[size] || sizes.md;
  };

  const getShapeStyles = () => {
    const sizeStyle = getSizeStyles();
    
    const shapes = {
      rounded: {
        borderRadius: theme.borderRadius.component.badge.medium,
      },
      square: {
        borderRadius: theme.borderRadius.component.badge.small,
      },
      circle: {
        borderRadius: theme.borderRadius.component.badge.pill,
        width: sizeStyle.height,
        paddingHorizontal: 0,
      },
    };
    
    return shapes[shape] || shapes.rounded;
  };

  const getNeonGlowStyles = () => {
    if (!neonGlow) return {};
    
    const variantStyle = getVariantStyles();
    
    return {
      shadowColor: variantStyle.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    };
  };

  const formatCount = (num) => {
    if (num === 0 && !showZero) return '';
    if (num > maxCount) return `${maxCount}+`;
    return num.toString();
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const shapeStyles = getShapeStyles();
  const neonGlowStyles = getNeonGlowStyles();

  const badgeStyles = [
    styles.base,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      borderWidth: outlined ? 1 : 0,
      ...sizeStyles,
      ...shapeStyles,
      ...neonGlowStyles,
    },
    dot && styles.dot,
    style,
  ];

  const textStyles = [
    styles.text,
    {
      color: variantStyles.textColor,
      fontSize: sizeStyles.fontSize,
      lineHeight: sizeStyles.fontSize + 2,
    },
    textStyle,
  ];

  // ドットバッジの場合
  if (dot) {
    return <View style={badgeStyles} {...props} />;
  }

  // カウントバッジの場合
  if (typeof count === 'number') {
    const formattedCount = formatCount(count);
    
    if (!formattedCount && !showZero) {
      return null;
    }
    
    return (
      <View style={badgeStyles} {...props}>
        <Text style={textStyles}>{formattedCount}</Text>
      </View>
    );
  }

  // 通常のバッジ
  return (
    <View style={badgeStyles} {...props}>
      <Text style={textStyles}>{children}</Text>
    </View>
  );
};

// 特殊なバッジコンポーネント
export const NotificationBadge = ({ count, maxCount = 99, showZero = false, ...props }) => {
  return (
    <Badge
      {...props}
      count={count}
      maxCount={maxCount}
      showZero={showZero}
      variant="error"
      size="sm"
      shape="circle"
      neonGlow={true}
    />
  );
};

export const StatusBadge = ({ status, ...props }) => {
  const statusConfig = {
    online: { variant: 'success', children: 'オンライン' },
    offline: { variant: 'gray', children: 'オフライン' },
    busy: { variant: 'warning', children: 'ビジー' },
    away: { variant: 'secondary', children: '離席中' },
  };
  
  const config = statusConfig[status] || statusConfig.offline;
  
  return (
    <Badge
      {...props}
      variant={config.variant}
      size="sm"
    >
      {config.children}
    </Badge>
  );
};

export const RatingBadge = ({ rating, ...props }) => {
  let variant = 'gray';
  
  if (rating >= 4.5) variant = 'success';
  else if (rating >= 3.5) variant = 'primary';
  else if (rating >= 2.5) variant = 'warning';
  else if (rating > 0) variant = 'error';
  
  return (
    <Badge
      {...props}
      variant={variant}
      size="sm"
      neonGlow={rating >= 4.0}
    >
      ⭐ {rating?.toFixed(1) || 'N/A'}
    </Badge>
  );
};

export const PriceBadge = ({ price, currency = '円', ...props }) => {
  return (
    <Badge
      {...props}
      variant="accent"
      size="md"
      neonGlow={true}
    >
      {price ? `${price.toLocaleString()}${currency}` : '価格未定'}
    </Badge>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    minWidth: 10,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  
  text: {
    fontWeight: '500',
    textAlign: 'center',
    includeFontPadding: false,
  },
});

// 名前付きエクスポート
export { NotificationBadge, StatusBadge, RatingBadge, PriceBadge };

// デフォルトエクスポート
export default Badge;