import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
  Switch,
} from 'react-native';
import NotificationService from '../services/NotificationService';

// カラーテーマ
const colors = {
  primary: '#ea5a7b',
  white: '#ffffff',
  background: '#fafafa',
  backgroundLight: '#fef7f7',
  text: '#333333',
  textSecondary: '#666666',
  border: '#e0e0e0',
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800',
  info: '#2196f3',
};

// 通知アイテムコンポーネント
const NotificationItem = ({ notification, onPress, onMarkRead, onDelete }) => {
  const getNotificationIcon = (type) => {
    const icons = {
      newVenue: '🏪',
      coupon: '🎫',
      event: '🎉',
      favorite: '❤️',
      review: '⭐',
      system: '⚙️',
    };
    return icons[type] || '📱';
  };

  const getNotificationColor = (category, priority) => {
    if (priority === 'high') return colors.error;
    
    const categoryColors = {
      newVenue: colors.info,
      coupon: colors.warning,
      event: colors.success,
      favorite: colors.primary,
      review: colors.warning,
      system: colors.textSecondary,
    };
    return categoryColors[category] || colors.textSecondary;
  };

  const formatDate = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'たった今';
    if (diffMinutes < 60) return `${diffMinutes}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLongPress = () => {
    Alert.alert(
      '通知オプション',
      notification.title,
      [
        { text: 'キャンセル', style: 'cancel' },
        ...(notification.read ? [] : [{ 
          text: '既読にする', 
          onPress: () => onMarkRead(notification.id) 
        }]),
        { 
          text: '削除', 
          style: 'destructive',
          onPress: () => onDelete(notification.id) 
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.read && styles.unreadNotification
      ]}
      onPress={() => onPress(notification)}
      onLongPress={handleLongPress}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIconContainer}>
          <Text style={[
            styles.notificationIcon,
            { color: getNotificationColor(notification.category, notification.priority) }
          ]}>
            {getNotificationIcon(notification.type)}
          </Text>
          {!notification.read && (
            <View style={styles.unreadDot} />
          )}
        </View>
        
        <View style={styles.notificationContent}>
          <View style={styles.notificationTitleRow}>
            <Text style={[
              styles.notificationTitle,
              !notification.read && styles.unreadTitle
            ]}>
              {notification.title}
            </Text>
            <Text style={styles.notificationTime}>
              {formatDate(notification.createdAt)}
            </Text>
          </View>
          
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {notification.message}
          </Text>
          
          {notification.priority === 'high' && (
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>重要</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// 通知設定コンポーネント
const NotificationSettings = ({ visible, onClose, settings, onUpdateSettings }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleToggle = (key, subKey = null) => {
    if (subKey) {
      setLocalSettings(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          [subKey]: !prev[key][subKey]
        }
      }));
    } else {
      setLocalSettings(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    }
  };

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  const categoryLabels = {
    newVenue: '新店舗',
    coupon: 'クーポン',
    event: 'イベント',
    favorite: 'お気に入り',
    review: 'レビュー',
    system: 'システム',
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.settingsContainer}>
        <View style={styles.settingsHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.settingsCloseButton}>キャンセル</Text>
          </TouchableOpacity>
          <Text style={styles.settingsTitle}>通知設定</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.settingsSaveButton}>保存</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          style={styles.settingsList}
          data={[
            { section: 'general' },
            { section: 'categories' },
            { section: 'quietHours' },
          ]}
          renderItem={({ item }) => {
            if (item.section === 'general') {
              return (
                <View style={styles.settingsSection}>
                  <Text style={styles.sectionTitle}>基本設定</Text>
                  
                  <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>通知を有効化</Text>
                    <Switch
                      value={localSettings.enabled}
                      onValueChange={() => handleToggle('enabled')}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  </View>
                  
                  <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>サウンド</Text>
                    <Switch
                      value={localSettings.sound}
                      onValueChange={() => handleToggle('sound')}
                      disabled={!localSettings.enabled}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  </View>
                  
                  <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>バッジ表示</Text>
                    <Switch
                      value={localSettings.badge}
                      onValueChange={() => handleToggle('badge')}
                      disabled={!localSettings.enabled}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  </View>
                </View>
              );
            }

            if (item.section === 'categories') {
              return (
                <View style={styles.settingsSection}>
                  <Text style={styles.sectionTitle}>カテゴリ別設定</Text>
                  
                  {Object.entries(localSettings.categories).map(([key, value]) => (
                    <View key={key} style={styles.settingRow}>
                      <Text style={styles.settingLabel}>{categoryLabels[key]}</Text>
                      <Switch
                        value={value}
                        onValueChange={() => handleToggle('categories', key)}
                        disabled={!localSettings.enabled}
                        trackColor={{ false: colors.border, true: colors.primary }}
                      />
                    </View>
                  ))}
                </View>
              );
            }

            if (item.section === 'quietHours') {
              return (
                <View style={styles.settingsSection}>
                  <Text style={styles.sectionTitle}>サイレント時間</Text>
                  
                  <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>サイレント時間を有効化</Text>
                    <Switch
                      value={localSettings.quietHours.enabled}
                      onValueChange={() => handleToggle('quietHours', 'enabled')}
                      disabled={!localSettings.enabled}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  </View>
                  
                  <View style={styles.quietHoursInfo}>
                    <Text style={styles.quietHoursText}>
                      {localSettings.quietHours.start} 〜 {localSettings.quietHours.end}
                    </Text>
                    <Text style={styles.quietHoursDescription}>
                      この時間帯は重要度の低い通知が抑制されます
                    </Text>
                  </View>
                </View>
              );
            }

            return null;
          }}
          keyExtractor={(item, index) => `${item.section}_${index}`}
        />
      </View>
    </Modal>
  );
};

// メイン通知センターコンポーネント
const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const categories = [
    { id: null, label: 'すべて', icon: '📱' },
    { id: 'coupon', label: 'クーポン', icon: '🎫' },
    { id: 'event', label: 'イベント', icon: '🎉' },
    { id: 'favorite', label: 'お気に入り', icon: '❤️' },
    { id: 'newVenue', label: '新店舗', icon: '🏪' },
    { id: 'review', label: 'レビュー', icon: '⭐' },
    { id: 'system', label: 'システム', icon: '⚙️' },
  ];

  useEffect(() => {
    initializeNotifications();
    setupEventListeners();
    
    return () => {
      cleanupEventListeners();
    };
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [selectedCategory]);

  const initializeNotifications = async () => {
    try {
      await NotificationService.initialize();
      const currentSettings = NotificationService.getSettings();
      setSettings(currentSettings);
      loadNotifications();
      updateUnreadCount();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupEventListeners = () => {
    NotificationService.addEventListener('notificationCreated', handleNotificationCreated);
    NotificationService.addEventListener('notificationCountChanged', handleCountChanged);
    NotificationService.addEventListener('settingsUpdated', handleSettingsUpdated);
  };

  const cleanupEventListeners = () => {
    NotificationService.removeEventListener('notificationCreated', handleNotificationCreated);
    NotificationService.removeEventListener('notificationCountChanged', handleCountChanged);
    NotificationService.removeEventListener('settingsUpdated', handleSettingsUpdated);
  };

  const loadNotifications = () => {
    const options = {
      category: selectedCategory,
      limit: 50,
    };
    
    const notificationList = NotificationService.getNotifications(options);
    setNotifications(notificationList);
  };

  const updateUnreadCount = () => {
    const count = NotificationService.getUnreadCount();
    setUnreadCount(count);
  };

  const handleNotificationCreated = () => {
    loadNotifications();
    updateUnreadCount();
  };

  const handleCountChanged = (count) => {
    setUnreadCount(count);
  };

  const handleSettingsUpdated = (updatedSettings) => {
    setSettings(updatedSettings);
  };

  const handleNotificationPress = async (notification) => {
    // 未読の場合は既読にする
    if (!notification.read) {
      await NotificationService.markAsRead(notification.id);
      loadNotifications();
      updateUnreadCount();
    }

    // 通知データに応じた画面遷移やアクションを実行
    if (notification.data.venueId) {
      console.log(`Navigate to venue: ${notification.data.venueId}`);
      // 実装例: navigation.navigate('VenueDetails', { venueId: notification.data.venueId });
    }
    
    if (notification.data.couponId) {
      console.log(`Show coupon: ${notification.data.couponId}`);
      // 実装例: navigation.navigate('Coupon', { couponId: notification.data.couponId });
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    const success = await NotificationService.markAsRead(notificationId);
    if (success) {
      loadNotifications();
      updateUnreadCount();
    }
  };

  const handleDelete = async (notificationId) => {
    const success = await NotificationService.deleteNotification(notificationId);
    if (success) {
      loadNotifications();
      updateUnreadCount();
    }
  };

  const handleMarkAllRead = async () => {
    const count = await NotificationService.markAllAsRead();
    if (count > 0) {
      loadNotifications();
      updateUnreadCount();
      Alert.alert('完了', `${count}件の通知を既読にしました`);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      '全削除',
      'すべての通知を削除しますか？この操作は元に戻せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除', 
          style: 'destructive',
          onPress: async () => {
            const count = await NotificationService.clearAllNotifications();
            loadNotifications();
            updateUnreadCount();
            Alert.alert('完了', `${count}件の通知を削除しました`);
          }
        },
      ]
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
    updateUnreadCount();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleUpdateSettings = async (newSettings) => {
    const success = await NotificationService.updateSettings(newSettings);
    if (success) {
      setSettings(newSettings);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>通知を読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>🔔 通知</Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.headerButton} onPress={handleMarkAllRead}>
              <Text style={styles.headerButtonText}>全既読</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowSettings(true)}>
            <Text style={styles.headerButtonText}>⚙️</Text>
          </TouchableOpacity>
          {notifications.length > 0 && (
            <TouchableOpacity style={styles.headerButton} onPress={handleClearAll}>
              <Text style={styles.headerButtonText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* カテゴリフィルター */}
      <View style={styles.categoryFilter}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === item.id && styles.activeCategoryButton
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text style={styles.categoryIcon}>{item.icon}</Text>
              <Text style={[
                styles.categoryLabel,
                selectedCategory === item.id && styles.activeCategoryLabel
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => `category_${item.id || 'all'}`}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* 通知一覧 */}
      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>通知がありません</Text>
          <Text style={styles.emptyDescription}>
            {selectedCategory 
              ? `${categories.find(c => c.id === selectedCategory)?.label}の通知はありません`
              : '新しい通知が届くとここに表示されます'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={handleNotificationPress}
              onMarkRead={handleMarkAsRead}
              onDelete={handleDelete}
            />
          )}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.notificationsList}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* 通知設定モーダル */}
      <NotificationSettings
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  // ヘッダー
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },

  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
  },

  headerButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },

  // カテゴリフィルター
  categoryFilter: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
  },

  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    gap: 6,
  },

  activeCategoryButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  categoryIcon: {
    fontSize: 16,
  },

  categoryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  activeCategoryLabel: {
    color: colors.white,
    fontWeight: '600',
  },

  // 通知一覧
  notificationsList: {
    paddingVertical: 8,
  },

  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },

  notificationItem: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  unreadNotification: {
    backgroundColor: colors.backgroundLight,
  },

  notificationHeader: {
    flexDirection: 'row',
    gap: 12,
  },

  notificationIconContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  notificationIcon: {
    fontSize: 20,
  },

  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  notificationContent: {
    flex: 1,
    gap: 4,
  },

  notificationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  notificationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginRight: 8,
  },

  unreadTitle: {
    fontWeight: 'bold',
  },

  notificationTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  priorityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },

  priorityText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: 'bold',
  },

  // 空の状態
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },

  emptyIcon: {
    fontSize: 64,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },

  emptyDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // 設定モーダル
  settingsContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  settingsCloseButton: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },

  settingsSaveButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },

  settingsList: {
    flex: 1,
  },

  settingsSection: {
    backgroundColor: colors.white,
    marginTop: 16,
    paddingVertical: 8,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.backgroundLight,
  },

  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  settingLabel: {
    fontSize: 16,
    color: colors.text,
  },

  quietHoursInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.backgroundLight,
  },

  quietHoursText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },

  quietHoursDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default NotificationCenter;