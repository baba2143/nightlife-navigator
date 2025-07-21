/**
 * 通知・アラート機能コンポーネント
 * Nightlife Navigator固有の通知システム
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Animated, Modal, Alert } from 'react-native';
import { colors } from '../../design-system/colors-soft-pink';
import { spacingSystem } from '../../design-system/spacing-comfortable';
import { borderRadiusSystem } from '../../design-system/borders-rounded';
import { shadowSystem } from '../../design-system/shadows-soft-pink';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Text } from '../ui/Text';
import { Flex } from '../ui/Layout';

// インアプリ通知バナー
const InAppNotificationBanner = ({ notification, onClose, onAction }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  useEffect(() => {
    if (notification) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // 自動非表示
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const getNotificationIcon = (type) => {
    const icons = {
      info: '📢',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      new_venue: '🏪',
      review: '⭐',
      favorite: '❤️',
      event: '🎉',
      promotion: '🎁',
    };
    return icons[type] || '📢';
  };

  const getNotificationColor = (type) => {
    const colors = {
      info: theme.colors.info[500],
      success: theme.colors.success[500],
      warning: theme.colors.warning[500],
      error: theme.colors.error[500],
      new_venue: theme.colors.brand,
      review: theme.colors.warning[500],
      favorite: theme.colors.error[500],
      event: theme.colors.accent[500],
      promotion: theme.colors.secondary[500],
    };
    return colors[type] || theme.colors.info[500];
  };

  if (!notification) return null;

  return (
    <Animated.View
      style={[
        styles.notificationBanner,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          backgroundColor: theme.colors.background.surface,
          borderLeftColor: getNotificationColor(notification.type),
          ...theme.shadows.elevation[3],
        },
      ]}
    >
      <View style={styles.bannerContent}>
        <Text variant="body" style={styles.bannerIcon}>
          {getNotificationIcon(notification.type)}
        </Text>
        <View style={styles.bannerText}>
          <Text variant="bodySmall" style={[styles.bannerTitle, { fontWeight: '600' }]}>
            {notification.title}
          </Text>
          <Text variant="caption" style={styles.bannerMessage}>
            {notification.message}
          </Text>
        </View>
        <View style={styles.bannerActions}>
          {notification.actionLabel && (
            <TouchableOpacity
              style={styles.bannerAction}
              onPress={() => onAction(notification)}
            >
              <Text variant="caption" style={{ color: theme.colors.brand }}>
                {notification.actionLabel}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.bannerClose}
            onPress={handleClose}
          >
            <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
              ×
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// 通知アイテムコンポーネント
const NotificationItem = ({ notification, onPress, onRemove, onMarkAsRead }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const getNotificationIcon = (type) => {
    const icons = {
      info: '📢',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      new_venue: '🏪',
      review: '⭐',
      favorite: '❤️',
      event: '🎉',
      promotion: '🎁',
      reminder: '⏰',
      social: '👥',
    };
    return icons[type] || '📢';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'たった今';
    if (diffInMinutes < 60) return `${diffInMinutes}分前`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}時間前`;
    return `${Math.floor(diffInMinutes / 1440)}日前`;
  };

  const getNotificationColor = (type) => {
    const colors = {
      info: theme.colors.info[500],
      success: theme.colors.success[500],
      warning: theme.colors.warning[500],
      error: theme.colors.error[500],
      new_venue: theme.colors.brand,
      review: theme.colors.warning[500],
      favorite: theme.colors.error[500],
      event: theme.colors.accent[500],
      promotion: theme.colors.secondary[500],
      reminder: theme.colors.info[500],
      social: theme.colors.success[500],
    };
    return colors[type] || theme.colors.info[500];
  };

  return (
    <TouchableOpacity onPress={() => onPress(notification)}>
      <Card
        variant={notification.isRead ? 'default' : 'soft'}
        style={[
          styles.notificationItem,
          {
            borderLeftWidth: notification.isRead ? 0 : 4,
            borderLeftColor: notification.isRead ? 'transparent' : getNotificationColor(notification.type),
          },
        ]}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.notificationIcon}>
              <Text variant="body">
                {getNotificationIcon(notification.type)}
              </Text>
            </View>
            <View style={styles.notificationInfo}>
              <Text variant="bodySmall" style={[styles.notificationTitle, { fontWeight: '600' }]}>
                {notification.title}
              </Text>
              <Text variant="caption" style={styles.notificationTime}>
                {formatTime(notification.timestamp)}
              </Text>
            </View>
            {!notification.isRead && (
              <View style={[styles.unreadDot, { backgroundColor: getNotificationColor(notification.type) }]} />
            )}
          </View>
          
          <Text variant="bodySmall" style={styles.notificationMessage}>
            {notification.message}
          </Text>
          
          {notification.actionLabel && (
            <TouchableOpacity
              style={styles.notificationAction}
              onPress={() => onPress(notification)}
            >
              <Text variant="caption" style={{ color: theme.colors.brand }}>
                {notification.actionLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.notificationActions}>
          {!notification.isRead && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onMarkAsRead(notification.id)}
            >
              <Text variant="caption" style={{ color: theme.colors.text.secondary }}>
                既読
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onRemove(notification.id)}
          >
            <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
              削除
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

// 通知設定モーダル
const NotificationSettingsModal = ({ visible, onClose, settings, onSettingsChange }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const notificationTypes = [
    {
      key: 'newVenues',
      label: '新着店舗',
      description: '新しい店舗が追加されたときに通知',
      icon: '🏪',
    },
    {
      key: 'reviews',
      label: 'レビュー',
      description: 'お気に入り店舗に新しいレビューが投稿されたとき',
      icon: '⭐',
    },
    {
      key: 'events',
      label: 'イベント',
      description: '近くでイベントが開催されるとき',
      icon: '🎉',
    },
    {
      key: 'promotions',
      label: 'プロモーション',
      description: '特別なオファーやキャンペーンがあるとき',
      icon: '🎁',
    },
    {
      key: 'reminders',
      label: 'リマインダー',
      description: '予約のリマインドやチェックイン促進',
      icon: '⏰',
    },
    {
      key: 'social',
      label: 'ソーシャル',
      description: '友達の活動や新しいフォロワー',
      icon: '👥',
    },
  ];

  const handleToggle = (key) => {
    onSettingsChange(key, !settings[key]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text variant="h3" style={{ color: theme.colors.brand }}>
              通知設定
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text variant="h3" style={{ color: theme.colors.text.tertiary }}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingsSection}>
            <Text variant="bodySmall" style={styles.sectionTitle}>
              通知タイプ
            </Text>
            
            {notificationTypes.map((type) => (
              <View key={type.key} style={styles.settingItem}>
                <View style={styles.settingHeader}>
                  <View style={styles.settingIcon}>
                    <Text variant="body">{type.icon}</Text>
                  </View>
                  <View style={styles.settingInfo}>
                    <Text variant="body" style={styles.settingLabel}>
                      {type.label}
                    </Text>
                    <Text variant="caption" style={styles.settingDescription}>
                      {type.description}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.toggle,
                      {
                        backgroundColor: settings[type.key] ? theme.colors.brand : theme.colors.border.medium,
                      },
                    ]}
                    onPress={() => handleToggle(type.key)}
                  >
                    <View
                      style={[
                        styles.toggleKnob,
                        {
                          backgroundColor: theme.colors.white,
                          transform: [{ translateX: settings[type.key] ? 20 : 2 }],
                        },
                      ]}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.settingsSection}>
            <Text variant="bodySmall" style={styles.sectionTitle}>
              通知時間
            </Text>
            <View style={styles.timeSettings}>
              <View style={styles.timeSetting}>
                <Text variant="body">開始時間</Text>
                <Text variant="body" style={{ color: theme.colors.brand }}>
                  {settings.quietHours?.start || '22:00'}
                </Text>
              </View>
              <View style={styles.timeSetting}>
                <Text variant="body">終了時間</Text>
                <Text variant="body" style={{ color: theme.colors.brand }}>
                  {settings.quietHours?.end || '08:00'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.modalActions}>
            <Button
              variant="primary"
              onPress={onClose}
              style={styles.modalActionButton}
            >
              保存
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// 通知統計
const NotificationStats = ({ notifications }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const totalNotifications = notifications.length;
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const todayCount = notifications.filter(n => {
    const notificationDate = new Date(n.timestamp);
    const today = new Date();
    return notificationDate.toDateString() === today.toDateString();
  }).length;

  const typeStats = notifications.reduce((stats, notification) => {
    stats[notification.type] = (stats[notification.type] || 0) + 1;
    return stats;
  }, {});

  const mostCommonType = Object.keys(typeStats).reduce((a, b) =>
    typeStats[a] > typeStats[b] ? a : b
  , '');

  const getTypeLabel = (type) => {
    const labels = {
      info: 'お知らせ',
      success: '成功',
      warning: '警告',
      error: 'エラー',
      new_venue: '新着店舗',
      review: 'レビュー',
      favorite: 'お気に入り',
      event: 'イベント',
      promotion: 'プロモーション',
      reminder: 'リマインダー',
      social: 'ソーシャル',
    };
    return labels[type] || type;
  };

  return (
    <Card variant="soft" style={styles.statsCard}>
      <Text variant="h4" style={[styles.statsTitle, { color: theme.colors.brand }]}>
        通知統計
      </Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text variant="h2" style={[styles.statValue, { color: theme.colors.brand }]}>
            {unreadCount}
          </Text>
          <Text variant="caption" style={styles.statLabel}>
            未読通知
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text variant="h2" style={[styles.statValue, { color: theme.colors.brand }]}>
            {todayCount}
          </Text>
          <Text variant="caption" style={styles.statLabel}>
            今日の通知
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text variant="h2" style={[styles.statValue, { color: theme.colors.brand }]}>
            {totalNotifications}
          </Text>
          <Text variant="caption" style={styles.statLabel}>
            総通知数
          </Text>
        </View>
      </View>

      {mostCommonType && (
        <Text variant="caption" style={styles.statsNote}>
          最も多い通知タイプ: {getTypeLabel(mostCommonType)}
        </Text>
      )}
    </Card>
  );
};

// メイン通知システムコンポーネント
const NotificationSystem = ({ onNotificationAction }) => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    newVenues: true,
    reviews: true,
    events: true,
    promotions: true,
    reminders: true,
    social: false,
    quietHours: {
      start: '22:00',
      end: '08:00',
    },
  });

  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  // サンプル通知データ
  const sampleNotifications = [
    {
      id: 1,
      type: 'new_venue',
      title: '新しい店舗が追加されました',
      message: '渋谷に新しいラウンジ「PINK DREAMS」がオープンしました',
      timestamp: new Date().toISOString(),
      isRead: false,
      actionLabel: '詳細を見る',
    },
    {
      id: 2,
      type: 'review',
      title: 'お気に入り店舗に新しいレビュー',
      message: 'GENTLE LOUNGEに新しいレビューが投稿されました',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isRead: false,
      actionLabel: 'レビューを見る',
    },
    {
      id: 3,
      type: 'event',
      title: '近くでイベント開催',
      message: '今夜、NEON BARでDJイベントが開催されます',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      isRead: true,
      actionLabel: 'イベント詳細',
    },
    {
      id: 4,
      type: 'promotion',
      title: '特別オファー',
      message: 'KARAOKE FRIENDSで30%オフキャンペーン実施中',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      isRead: false,
      actionLabel: 'オファーを見る',
    },
    {
      id: 5,
      type: 'reminder',
      title: '予約リマインダー',
      message: '明日19:00のGENTLE LOUNGEの予約をお忘れなく',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      isRead: true,
    },
  ];

  useEffect(() => {
    setNotifications(sampleNotifications);
    setFilteredNotifications(sampleNotifications);
  }, []);

  useEffect(() => {
    applyFilter();
  }, [notifications, filter]);

  const applyFilter = () => {
    let filtered = [...notifications];
    
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(n => !n.isRead);
        break;
      case 'read':
        filtered = filtered.filter(n => n.isRead);
        break;
      case 'today':
        const today = new Date().toDateString();
        filtered = filtered.filter(n => new Date(n.timestamp).toDateString() === today);
        break;
      default:
        // 'all' - フィルターなし
        break;
    }
    
    setFilteredNotifications(filtered);
  };

  const handleNotificationPress = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    onNotificationAction?.(notification);
  };

  const handleMarkAsRead = (notificationId) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
  };

  const handleRemoveNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClearAll = () => {
    Alert.alert(
      '通知をすべて削除',
      'すべての通知を削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: () => setNotifications([]) },
      ]
    );
  };

  const handleSettingsChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const showNotificationBanner = (notification) => {
    setCurrentBanner(notification);
  };

  const filterOptions = [
    { value: 'all', label: 'すべて' },
    { value: 'unread', label: '未読' },
    { value: 'read', label: '既読' },
    { value: 'today', label: '今日' },
  ];

  const renderNotificationItem = ({ item }) => (
    <NotificationItem
      notification={item}
      onPress={handleNotificationPress}
      onRemove={handleRemoveNotification}
      onMarkAsRead={handleMarkAsRead}
    />
  );

  return (
    <View style={styles.container}>
      {/* インアプリ通知バナー */}
      <InAppNotificationBanner
        notification={currentBanner}
        onClose={() => setCurrentBanner(null)}
        onAction={handleNotificationPress}
      />

      {/* 通知統計 */}
      <NotificationStats notifications={notifications} />

      {/* コントロール */}
      <Card variant="default" style={styles.controlsCard}>
        <View style={styles.controlsHeader}>
          <Text variant="h4" style={{ color: theme.colors.brand }}>
            通知センター
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowSettings(true)}
          >
            <Text variant="body">⚙️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterSection}>
          <Text variant="caption" style={styles.filterLabel}>
            フィルター:
          </Text>
          <View style={styles.filterOptions}>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterOption,
                  {
                    backgroundColor: filter === option.value
                      ? theme.colors.brand
                      : theme.colors.background.surface,
                    borderColor: filter === option.value
                      ? theme.colors.brand
                      : theme.colors.border.medium,
                  },
                ]}
                onPress={() => setFilter(option.value)}
              >
                <Text
                  variant="caption"
                  style={{
                    color: filter === option.value
                      ? theme.colors.white
                      : theme.colors.text.secondary,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.actionSection}>
          <View style={styles.actionInfo}>
            <Text variant="bodySmall" style={{ color: theme.colors.text.secondary }}>
              {filteredNotifications.length}件の通知
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMarkAllAsRead}
            >
              <Text variant="caption" style={{ color: theme.colors.brand }}>
                すべて既読
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleClearAll}
            >
              <Text variant="caption" style={{ color: theme.colors.error[500] }}>
                すべて削除
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* 通知リスト */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.notificationsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="h3" style={{ color: theme.colors.text.secondary }}>
              🔔
            </Text>
            <Text variant="body" style={{ color: theme.colors.text.secondary }}>
              {filter === 'all' ? '通知はありません' : `${filterOptions.find(o => o.value === filter)?.label}の通知はありません`}
            </Text>
          </View>
        }
      />

      {/* 設定モーダル */}
      <NotificationSettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      {/* テスト用ボタン */}
      <View style={styles.testSection}>
        <Button
          variant="outline"
          size="sm"
          onPress={() => showNotificationBanner({
            type: 'new_venue',
            title: 'テスト通知',
            message: 'これはテスト用の通知です',
            actionLabel: '確認',
          })}
        >
          テスト通知を表示
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  
  // インアプリ通知バナー
  notificationBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderLeftWidth: 4,
    borderRadius: 0,
    borderBottomLeftRadius: borderRadiusSystem.component.card.medium,
    borderBottomRightRadius: borderRadiusSystem.component.card.medium,
  },
  
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacingSystem.component.padding.lg,
    gap: spacingSystem.component.gap.md,
  },
  
  bannerIcon: {
    fontSize: 20,
  },
  
  bannerText: {
    flex: 1,
    gap: spacingSystem.component.gap.xs,
  },
  
  bannerTitle: {
    color: colors.text.primary,
  },
  
  bannerMessage: {
    color: colors.text.secondary,
  },
  
  bannerActions: {
    flexDirection: 'row',
    gap: spacingSystem.component.gap.md,
  },
  
  bannerAction: {
    padding: spacingSystem.component.padding.sm,
  },
  
  bannerClose: {
    padding: spacingSystem.component.padding.sm,
  },
  
  // 統計
  statsCard: {
    margin: spacingSystem.layout.container.md,
    padding: spacingSystem.layout.card.padding,
  },
  
  statsTitle: {
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacingSystem.component.margin.md,
  },
  
  statItem: {
    alignItems: 'center',
    gap: spacingSystem.component.gap.sm,
  },
  
  statValue: {
    // Set by variant
  },
  
  statLabel: {
    color: colors.text.secondary,
  },
  
  statsNote: {
    textAlign: 'center',
    color: colors.text.tertiary,
  },
  
  // コントロール
  controlsCard: {
    margin: spacingSystem.layout.container.md,
    padding: spacingSystem.layout.card.padding,
  },
  
  controlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  settingsButton: {
    padding: spacingSystem.component.padding.sm,
  },
  
  filterSection: {
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  filterLabel: {
    marginBottom: spacingSystem.component.margin.sm,
    color: colors.text.secondary,
  },
  
  filterOptions: {
    flexDirection: 'row',
    gap: spacingSystem.component.gap.sm,
  },
  
  filterOption: {
    paddingHorizontal: spacingSystem.component.padding.md,
    paddingVertical: spacingSystem.component.padding.sm,
    borderRadius: borderRadiusSystem.component.badge.small,
    borderWidth: 1,
  },
  
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  actionInfo: {
    // No additional styles needed
  },
  
  actionButtons: {
    flexDirection: 'row',
    gap: spacingSystem.component.gap.lg,
  },
  
  actionButton: {
    padding: spacingSystem.component.padding.sm,
  },
  
  // 通知リスト
  notificationsList: {
    paddingHorizontal: spacingSystem.layout.container.md,
    paddingBottom: spacingSystem.layout.container.xl,
  },
  
  notificationItem: {
    padding: spacingSystem.layout.card.padding,
    marginBottom: spacingSystem.layout.card.margin,
  },
  
  notificationContent: {
    marginBottom: spacingSystem.component.margin.sm,
  },
  
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingSystem.component.gap.md,
    marginBottom: spacingSystem.component.margin.sm,
  },
  
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.pinkLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  notificationInfo: {
    flex: 1,
    gap: spacingSystem.component.gap.xs,
  },
  
  notificationTitle: {
    color: colors.text.primary,
  },
  
  notificationTime: {
    color: colors.text.tertiary,
  },
  
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  notificationMessage: {
    lineHeight: 18,
    color: colors.text.secondary,
    marginBottom: spacingSystem.component.margin.sm,
  },
  
  notificationAction: {
    alignSelf: 'flex-start',
    padding: spacingSystem.component.padding.sm,
  },
  
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacingSystem.component.gap.md,
  },
  
  // 設定モーダル
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  
  modalContent: {
    backgroundColor: colors.background.surface,
    borderTopLeftRadius: borderRadiusSystem.component.modal.large,
    borderTopRightRadius: borderRadiusSystem.component.modal.large,
    padding: spacingSystem.layout.container.lg,
    maxHeight: '80%',
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  settingsSection: {
    marginBottom: spacingSystem.component.margin.xl,
  },
  
  sectionTitle: {
    marginBottom: spacingSystem.component.margin.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  
  settingItem: {
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingSystem.component.gap.md,
  },
  
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.pinkLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  settingInfo: {
    flex: 1,
    gap: spacingSystem.component.gap.xs,
  },
  
  settingLabel: {
    fontWeight: '600',
  },
  
  settingDescription: {
    color: colors.text.secondary,
  },
  
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    position: 'relative',
  },
  
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    position: 'absolute',
  },
  
  timeSettings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacingSystem.component.gap.lg,
  },
  
  timeSetting: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacingSystem.component.padding.md,
    backgroundColor: colors.background.pinkLight,
    borderRadius: borderRadiusSystem.component.card.medium,
  },
  
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  
  modalActionButton: {
    paddingHorizontal: spacingSystem.component.padding.xl,
  },
  
  // 空状態
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacingSystem.layout.container.xl,
    gap: spacingSystem.component.gap.md,
  },
  
  // テストセクション
  testSection: {
    padding: spacingSystem.layout.container.md,
    alignItems: 'center',
  },
});

export default NotificationSystem;