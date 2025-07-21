/**
 * アイコンコンポーネント
 * デザインシステムベースの統一アイコンシステム
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons, Feather, AntDesign, FontAwesome5 } from '@expo/vector-icons';
import { defaultTheme } from '../../design-system/theme';

// アイコンライブラリマッピング
const IconLibraries = {
  Ionicons,
  MaterialIcons,
  Feather,
  AntDesign,
  FontAwesome5,
};

// サイバーパンク/ナイトライフ用のアイコンマッピング
const ICON_MAP = {
  // ナビゲーション
  home: { library: 'Ionicons', name: 'home' },
  search: { library: 'Ionicons', name: 'search' },
  map: { library: 'Ionicons', name: 'map' },
  favorites: { library: 'Ionicons', name: 'heart' },
  profile: { library: 'Ionicons', name: 'person' },
  
  // ナイトライフ関連
  bar: { library: 'MaterialIcons', name: 'local-bar' },
  club: { library: 'MaterialIcons', name: 'nightlife' },
  restaurant: { library: 'MaterialIcons', name: 'restaurant' },
  cafe: { library: 'MaterialIcons', name: 'local-cafe' },
  karaoke: { library: 'MaterialIcons', name: 'mic' },
  
  // 評価・レビュー
  star: { library: 'Ionicons', name: 'star' },
  starOutline: { library: 'Ionicons', name: 'star-outline' },
  thumbsUp: { library: 'Ionicons', name: 'thumbs-up' },
  thumbsDown: { library: 'Ionicons', name: 'thumbs-down' },
  
  // ソーシャル
  share: { library: 'Ionicons', name: 'share-social' },
  bookmark: { library: 'Ionicons', name: 'bookmark' },
  bookmarkOutline: { library: 'Ionicons', name: 'bookmark-outline' },
  comment: { library: 'Ionicons', name: 'chatbubble' },
  like: { library: 'Ionicons', name: 'heart' },
  likeOutline: { library: 'Ionicons', name: 'heart-outline' },
  
  // 機能
  filter: { library: 'Ionicons', name: 'filter' },
  sort: { library: 'MaterialIcons', name: 'sort' },
  notification: { library: 'Ionicons', name: 'notifications' },
  settings: { library: 'Ionicons', name: 'settings' },
  menu: { library: 'Ionicons', name: 'menu' },
  
  // アクション
  add: { library: 'Ionicons', name: 'add' },
  edit: { library: 'Ionicons', name: 'create' },
  delete: { library: 'Ionicons', name: 'trash' },
  save: { library: 'Ionicons', name: 'save' },
  download: { library: 'Ionicons', name: 'download' },
  upload: { library: 'Ionicons', name: 'cloud-upload' },
  
  // ナビゲーション
  back: { library: 'Ionicons', name: 'arrow-back' },
  forward: { library: 'Ionicons', name: 'arrow-forward' },
  up: { library: 'Ionicons', name: 'arrow-up' },
  down: { library: 'Ionicons', name: 'arrow-down' },
  close: { library: 'Ionicons', name: 'close' },
  
  // 状態
  check: { library: 'Ionicons', name: 'checkmark' },
  error: { library: 'Ionicons', name: 'alert-circle' },
  warning: { library: 'Ionicons', name: 'warning' },
  info: { library: 'Ionicons', name: 'information-circle' },
  success: { library: 'Ionicons', name: 'checkmark-circle' },
  
  // メディア
  play: { library: 'Ionicons', name: 'play' },
  pause: { library: 'Ionicons', name: 'pause' },
  stop: { library: 'Ionicons', name: 'stop' },
  volume: { library: 'Ionicons', name: 'volume-high' },
  volumeMute: { library: 'Ionicons', name: 'volume-mute' },
  
  // 通信
  phone: { library: 'Ionicons', name: 'call' },
  email: { library: 'Ionicons', name: 'mail' },
  web: { library: 'Ionicons', name: 'globe' },
  location: { library: 'Ionicons', name: 'location' },
  
  // サイバーパンク特有
  neon: { library: 'MaterialIcons', name: 'flash-on' },
  cyber: { library: 'MaterialIcons', name: 'memory' },
  matrix: { library: 'MaterialIcons', name: 'grid-on' },
  hologram: { library: 'MaterialIcons', name: 'scatter-plot' },
  
  // ナイトライフ特有
  cocktail: { library: 'MaterialIcons', name: 'local-drink' },
  beer: { library: 'MaterialIcons', name: 'sports-bar' },
  wine: { library: 'MaterialIcons', name: 'wine-bar' },
  champagne: { library: 'MaterialIcons', name: 'celebration' },
  dj: { library: 'MaterialIcons', name: 'queue-music' },
  dance: { library: 'MaterialIcons', name: 'music-note' },
  party: { library: 'MaterialIcons', name: 'party-mode' },
  vip: { library: 'MaterialIcons', name: 'star-rate' },
};

const Icon = ({
  name,
  size = 24,
  color,
  variant = 'default',
  neonGlow = false,
  interactive = false,
  onPress,
  style,
  containerStyle,
  library,
  iconName,
  ...props
}) => {
  const theme = defaultTheme;

  // アイコンの設定を取得
  const getIconConfig = () => {
    if (library && iconName) {
      return { library, name: iconName };
    }
    
    return ICON_MAP[name] || { library: 'Ionicons', name: 'help-circle' };
  };

  // カラーバリアントを取得
  const getColorVariant = () => {
    if (color) return color;
    
    const variants = {
      default: theme.colors.text.primary,
      primary: theme.colors.primary[400],
      secondary: theme.colors.secondary[400],
      accent: theme.colors.accent[400],
      success: theme.colors.success[400],
      warning: theme.colors.warning[400],
      error: theme.colors.error[400],
      muted: theme.colors.text.secondary,
      disabled: theme.colors.text.disabled,
      neonBlue: theme.colors.text.neonBlue,
      neonPink: theme.colors.text.neonPink,
      neonGreen: theme.colors.text.neonGreen,
    };
    
    return variants[variant] || variants.default;
  };

  // ネオングローのスタイルを取得
  const getNeonGlowStyle = () => {
    if (!neonGlow) return {};
    
    const glowColor = getColorVariant();
    
    return {
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 8,
      elevation: 5,
    };
  };

  const iconConfig = getIconConfig();
  const iconColor = getColorVariant();
  const neonGlowStyle = getNeonGlowStyle();
  
  const IconComponent = IconLibraries[iconConfig.library];
  
  if (!IconComponent) {
    console.warn(`Icon library ${iconConfig.library} not found`);
    return null;
  }

  const iconElement = (
    <View style={[styles.iconContainer, neonGlowStyle, containerStyle]}>
      <IconComponent
        name={iconConfig.name}
        size={size}
        color={iconColor}
        style={[styles.icon, style]}
        {...props}
      />
    </View>
  );

  if (interactive || onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.touchable, { width: size + 16, height: size + 16 }]}
        activeOpacity={0.7}
      >
        {iconElement}
      </TouchableOpacity>
    );
  }

  return iconElement;
};

// 特殊なアイコンコンポーネント
export const NeonIcon = ({ name, color = 'primary', size = 24, ...props }) => {
  return (
    <Icon
      {...props}
      name={name}
      size={size}
      variant={color}
      neonGlow={true}
    />
  );
};

export const InteractiveIcon = ({ name, onPress, size = 24, ...props }) => {
  return (
    <Icon
      {...props}
      name={name}
      size={size}
      onPress={onPress}
      interactive={true}
    />
  );
};

export const StatusIcon = ({ status, size = 16, ...props }) => {
  const statusConfig = {
    online: { name: 'success', variant: 'success' },
    offline: { name: 'close', variant: 'muted' },
    busy: { name: 'warning', variant: 'warning' },
    away: { name: 'info', variant: 'secondary' },
    error: { name: 'error', variant: 'error' },
  };
  
  const config = statusConfig[status] || statusConfig.offline;
  
  return (
    <Icon
      {...props}
      name={config.name}
      variant={config.variant}
      size={size}
    />
  );
};

export const RatingStars = ({ rating = 0, maxRating = 5, size = 16, interactive = false, onRatingChange, ...props }) => {
  const stars = Array.from({ length: maxRating }, (_, index) => {
    const isFullStar = index < Math.floor(rating);
    const isHalfStar = index === Math.floor(rating) && rating % 1 !== 0;
    
    return (
      <Icon
        key={index}
        name={isFullStar || isHalfStar ? 'star' : 'starOutline'}
        variant={isFullStar || isHalfStar ? 'warning' : 'muted'}
        size={size}
        interactive={interactive}
        onPress={interactive ? () => onRatingChange?.(index + 1) : undefined}
        style={props.style}
      />
    );
  });
  
  return <View style={styles.starsContainer}>{stars}</View>;
};

export const IconButton = ({ 
  icon, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  neonGlow = false,
  onPress,
  style,
  ...props 
}) => {
  const theme = defaultTheme;
  
  const getSizeStyles = () => {
    const sizes = {
      sm: { width: 32, height: 32, iconSize: 16 },
      md: { width: 40, height: 40, iconSize: 20 },
      lg: { width: 48, height: 48, iconSize: 24 },
    };
    
    return sizes[size] || sizes.md;
  };
  
  const getVariantStyles = () => {
    const variants = {
      primary: {
        backgroundColor: theme.colors.primary[500],
        borderColor: theme.colors.primary[500],
      },
      secondary: {
        backgroundColor: theme.colors.secondary[500],
        borderColor: theme.colors.secondary[500],
      },
      accent: {
        backgroundColor: theme.colors.accent[500],
        borderColor: theme.colors.accent[500],
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: theme.colors.border.default,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      },
    };
    
    return variants[variant] || variants.primary;
  };
  
  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();
  
  return (
    <TouchableOpacity
      style={[
        styles.iconButton,
        sizeStyles,
        variantStyles,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      {...props}
    >
      <Icon
        name={icon}
        size={sizeStyles.iconSize}
        variant={variant === 'outline' || variant === 'ghost' ? variant : 'default'}
        neonGlow={neonGlow}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  icon: {
    // プラットフォーム固有のスタイルが必要な場合
  },
  
  touchable: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  
  disabled: {
    opacity: 0.5,
  },
});

// アイコン名の定数エクスポート
export const ICON_NAMES = Object.keys(ICON_MAP);

// 名前付きエクスポート
export { NeonIcon, InteractiveIcon, StatusIcon, RatingStars, IconButton, ICON_NAMES };

// デフォルトエクスポート
export default Icon;