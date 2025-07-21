import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NotificationService from '../services/NotificationService';

// カラーテーマ
const colors = {
  primary: '#ea5a7b',
  white: '#ffffff',
  error: '#f44336',
  warning: '#ff9800',
  success: '#4caf50',
};

const NotificationBadge = ({ 
  style,
  textStyle,
  showZero = false,
  maxCount = 99,
  dot = false,
  category = null,
  size = 'normal' // 'small', 'normal', 'large'
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    initializeCount();
    setupEventListeners();
    
    return () => {
      cleanupEventListeners();
    };
  }, [category]);

  const initializeCount = async () => {
    try {
      await NotificationService.initialize();
      updateCount();
    } catch (error) {
      console.error('Failed to initialize notification badge:', error);
    }
  };

  const setupEventListeners = () => {
    NotificationService.addEventListener('notificationCountChanged', handleCountChanged);
    NotificationService.addEventListener('notificationCreated', updateCount);
    NotificationService.addEventListener('notificationRead', updateCount);
    NotificationService.addEventListener('notificationDeleted', updateCount);
    NotificationService.addEventListener('allNotificationsRead', updateCount);
    NotificationService.addEventListener('allNotificationsCleared', updateCount);
  };

  const cleanupEventListeners = () => {
    NotificationService.removeEventListener('notificationCountChanged', handleCountChanged);
    NotificationService.removeEventListener('notificationCreated', updateCount);
    NotificationService.removeEventListener('notificationRead', updateCount);
    NotificationService.removeEventListener('notificationDeleted', updateCount);
    NotificationService.removeEventListener('allNotificationsRead', updateCount);
    NotificationService.removeEventListener('allNotificationsCleared', updateCount);
  };

  const updateCount = () => {
    if (category) {
      const categoryCounts = NotificationService.getUnreadCountByCategory();
      setCount(categoryCounts[category] || 0);
    } else {
      const totalCount = NotificationService.getUnreadCount();
      setCount(totalCount);
    }
  };

  const handleCountChanged = (newCount) => {
    if (!category) {
      setCount(newCount);
    }
  };

  const getSizeStyle = () => {
    const sizes = {
      small: {
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        paddingHorizontal: 4,
      },
      normal: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        paddingHorizontal: 6,
      },
      large: {
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        paddingHorizontal: 8,
      },
    };
    return sizes[size] || sizes.normal;
  };

  const getTextSize = () => {
    const textSizes = {
      small: 10,
      normal: 12,
      large: 14,
    };
    return textSizes[size] || textSizes.normal;
  };

  const formatCount = (num) => {
    if (num > maxCount) {
      return `${maxCount}+`;
    }
    return num.toString();
  };

  // カウントが0でshowZeroがfalseの場合は非表示
  if (count === 0 && !showZero) {
    return null;
  }

  // ドット表示モード
  if (dot) {
    return (
      <View style={[
        styles.dotBadge,
        getSizeStyle(),
        { backgroundColor: colors.error },
        style
      ]} />
    );
  }

  // 通常のバッジ表示
  return (
    <View style={[
      styles.badge,
      getSizeStyle(),
      { backgroundColor: colors.error },
      style
    ]}>
      <Text style={[
        styles.badgeText,
        { fontSize: getTextSize(), color: colors.white },
        textStyle
      ]}>
        {formatCount(count)}
      </Text>
    </View>
  );
};

// タブアイコン用のバッジコンポーネント
export const TabNotificationBadge = ({ children, category = null, style }) => {
  return (
    <View style={[styles.tabBadgeContainer, style]}>
      {children}
      <NotificationBadge
        style={styles.tabBadge}
        category={category}
        size="small"
        dot={true}
      />
    </View>
  );
};

// ヘッダー用のバッジコンポーネント
export const HeaderNotificationBadge = ({ children, category = null, style }) => {
  return (
    <View style={[styles.headerBadgeContainer, style]}>
      {children}
      <NotificationBadge
        style={styles.headerBadge}
        category={category}
        size="small"
      />
    </View>
  );
};

// インライン用のバッジコンポーネント
export const InlineNotificationBadge = ({ 
  label, 
  category = null, 
  style, 
  labelStyle,
  showZero = false 
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const initializeCount = async () => {
      try {
        await NotificationService.initialize();
        updateCount();
      } catch (error) {
        console.error('Failed to initialize inline badge:', error);
      }
    };

    const updateCount = () => {
      if (category) {
        const categoryCounts = NotificationService.getUnreadCountByCategory();
        setCount(categoryCounts[category] || 0);
      } else {
        const totalCount = NotificationService.getUnreadCount();
        setCount(totalCount);
      }
    };

    const setupEventListeners = () => {
      NotificationService.addEventListener('notificationCountChanged', updateCount);
      NotificationService.addEventListener('notificationCreated', updateCount);
      NotificationService.addEventListener('notificationRead', updateCount);
      NotificationService.addEventListener('notificationDeleted', updateCount);
      NotificationService.addEventListener('allNotificationsRead', updateCount);
      NotificationService.addEventListener('allNotificationsCleared', updateCount);
    };

    initializeCount();
    setupEventListeners();

    return () => {
      NotificationService.removeEventListener('notificationCountChanged', updateCount);
      NotificationService.removeEventListener('notificationCreated', updateCount);
      NotificationService.removeEventListener('notificationRead', updateCount);
      NotificationService.removeEventListener('notificationDeleted', updateCount);
      NotificationService.removeEventListener('allNotificationsRead', updateCount);
      NotificationService.removeEventListener('allNotificationsCleared', updateCount);
    };
  }, [category]);

  return (
    <View style={[styles.inlineBadgeContainer, style]}>
      <Text style={[styles.inlineLabel, labelStyle]}>{label}</Text>
      {(count > 0 || showZero) && (
        <NotificationBadge
          style={styles.inlineBadge}
          size="small"
          showZero={showZero}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // 基本バッジスタイル
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },

  badgeText: {
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
  },

  dotBadge: {
    position: 'absolute',
  },

  // タブバッジ用コンテナ
  tabBadgeContainer: {
    position: 'relative',
  },

  tabBadge: {
    top: -2,
    right: -2,
  },

  // ヘッダーバッジ用コンテナ
  headerBadgeContainer: {
    position: 'relative',
  },

  headerBadge: {
    top: -4,
    right: -4,
  },

  // インラインバッジ用コンテナ
  inlineBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  inlineLabel: {
    fontSize: 16,
    color: '#333333',
  },

  inlineBadge: {
    position: 'relative',
    top: 0,
    right: 0,
  },
});

export default NotificationBadge;