/**
 * Notification History Screen
 * Displays notification history and management features
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PushNotificationService from '../../services/PushNotificationService';
import LoggingService from '../../services/LoggingService';
import MonitoringManager from '../../services/MonitoringManager';

const NotificationHistoryScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, received, responded
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotificationHistory();
  }, [filter]);

  /**
   * Load notification history
   */
  const loadNotificationHistory = useCallback(async () => {
    try {
      setLoading(true);
      
      const history = PushNotificationService.getNotificationHistory(100);
      
      // Apply filter
      let filteredHistory = history;
      if (filter !== 'all') {
        filteredHistory = history.filter(notification => notification.type === filter);
      }
      
      setNotifications(filteredHistory);
      
      LoggingService.debug('[NotificationHistoryScreen] Notification history loaded', {
        total: history.length,
        filtered: filteredHistory.length,
        filter,
      });
      
    } catch (error) {
      LoggingService.error('[NotificationHistoryScreen] Failed to load notification history', {
        error: error.message,
      });
      
      Alert.alert(
        'エラー',
        '通知履歴の読み込みに失敗しました。',
        [{ text: 'OK' }]
      );
      
    } finally {
      setLoading(false);
    }
  }, [filter]);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotificationHistory();
    setRefreshing(false);
  }, [loadNotificationHistory]);

  /**
   * Handle notification press
   */
  const handleNotificationPress = useCallback((notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
    
    MonitoringManager.trackUserAction?.('view_notification_detail', 'notification_history', {
      notificationId: notification.id,
      type: notification.type,
    });
  }, []);

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(async () => {
    Alert.alert(
      '通知履歴をクリア',
      'すべての通知履歴を削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await PushNotificationService.clearNotificationHistory();
              setNotifications([]);
              
              MonitoringManager.trackUserAction?.('clear_notification_history', 'notification_history');
              
              Alert.alert(
                '完了',
                '通知履歴をクリアしました。',
                [{ text: 'OK' }]
              );
              
            } catch (error) {
              LoggingService.error('[NotificationHistoryScreen] Failed to clear history', {
                error: error.message,
              });
              
              Alert.alert(
                'エラー',
                '通知履歴のクリアに失敗しました。',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  }, []);

  /**
   * Format notification time
   */
  const formatNotificationTime = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'たった今';
    } else if (diffMins < 60) {
      return `${diffMins}分前`;
    } else if (diffHours < 24) {
      return `${diffHours}時間前`;
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }, []);

  /**
   * Get notification icon
   */
  const getNotificationIcon = useCallback((notification) => {
    const typeIcons = {
      venue_recommendation: '🏪',
      social_interaction: '👥',
      promotional: '🎉',
      system_update: '🔔',
      weekly_digest: '📊',
      default: '📱',
    };

    return typeIcons[notification.categoryIdentifier] || typeIcons.default;
  }, []);

  /**
   * Get notification type color
   */
  const getNotificationTypeColor = useCallback((type) => {
    const colors = {
      received: '#4CAF50',
      responded: '#2196F3',
    };

    return colors[type] || '#757575';
  }, []);

  /**
   * Render filter tabs
   */
  const renderFilterTabs = () => {
    const filters = [
      { key: 'all', label: 'すべて' },
      { key: 'received', label: '受信' },
      { key: 'responded', label: '応答済み' },
    ];

    return (
      <View style={styles.filterContainer}>
        {filters.map((filterItem) => (
          <TouchableOpacity
            key={filterItem.key}
            style={[
              styles.filterTab,
              filter === filterItem.key && styles.activeFilterTab,
            ]}
            onPress={() => setFilter(filterItem.key)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === filterItem.key && styles.activeFilterTabText,
              ]}
            >
              {filterItem.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  /**
   * Render notification item
   */
  const renderNotificationItem = useCallback(({ item: notification }) => {
    return (
      <TouchableOpacity
        style={styles.notificationItem}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationIcon}>
            {getNotificationIcon(notification)}
          </Text>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle} numberOfLines={1}>
              {notification.title || 'タイトルなし'}
            </Text>
            <Text style={styles.notificationTime}>
              {formatNotificationTime(notification.timestamp)}
            </Text>
          </View>
          <View
            style={[
              styles.typeIndicator,
              { backgroundColor: getNotificationTypeColor(notification.type) },
            ]}
          />
        </View>
        
        {notification.body && (
          <Text style={styles.notificationBody} numberOfLines={2}>
            {notification.body}
          </Text>
        )}
        
        {notification.actionIdentifier && (
          <View style={styles.actionContainer}>
            <Text style={styles.actionText}>
              アクション: {notification.actionIdentifier}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [handleNotificationPress, getNotificationIcon, getNotificationTypeColor, formatNotificationTime]);

  /**
   * Render notification detail modal
   */
  const renderNotificationDetailModal = () => {
    if (!selectedNotification) return null;

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDetailModal(false)}
            >
              <Text style={styles.modalCloseText}>閉じる</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>通知詳細</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>タイトル</Text>
              <Text style={styles.detailValue}>
                {selectedNotification.title || 'タイトルなし'}
              </Text>
            </View>
            
            {selectedNotification.body && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>内容</Text>
                <Text style={styles.detailValue}>{selectedNotification.body}</Text>
              </View>
            )}
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>種類</Text>
              <Text style={styles.detailValue}>
                {selectedNotification.type === 'received' ? '受信' : '応答済み'}
              </Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>時刻</Text>
              <Text style={styles.detailValue}>
                {new Date(selectedNotification.timestamp).toLocaleString('ja-JP')}
              </Text>
            </View>
            
            {selectedNotification.categoryIdentifier && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>カテゴリ</Text>
                <Text style={styles.detailValue}>
                  {selectedNotification.categoryIdentifier}
                </Text>
              </View>
            )}
            
            {selectedNotification.actionIdentifier && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>アクション</Text>
                <Text style={styles.detailValue}>
                  {selectedNotification.actionIdentifier}
                </Text>
              </View>
            )}
            
            {selectedNotification.data && Object.keys(selectedNotification.data).length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>追加データ</Text>
                <Text style={styles.detailValue}>
                  {JSON.stringify(selectedNotification.data, null, 2)}
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyTitle}>通知履歴がありません</Text>
        <Text style={styles.emptyDescription}>
          受信した通知がここに表示されます
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>通知履歴</Text>
        
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearAllNotifications}
          disabled={notifications.length === 0}
        >
          <Text style={styles.clearButtonText}>クリア</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      {renderFilterTabs()}

      {/* Notification List */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item, index) => `${item.id || index}`}
        style={styles.notificationList}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#D4AF37"
            colors={['#D4AF37']}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Detail Modal */}
      {renderNotificationDetailModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    width: 60,
  },
  backButtonText: {
    fontSize: 16,
    color: '#D4AF37',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  clearButton: {
    width: 60,
    alignItems: 'flex-end',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#ff6b6b',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#333333',
  },
  activeFilterTab: {
    backgroundColor: '#D4AF37',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cccccc',
  },
  activeFilterTabText: {
    color: '#000000',
  },
  notificationList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#D4AF37',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: '#cccccc',
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
    marginBottom: 8,
  },
  actionContainer: {
    backgroundColor: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 12,
    color: '#D4AF37',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalCloseButton: {
    paddingVertical: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#D4AF37',
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  modalHeaderSpacer: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 22,
  },
});

export default NotificationHistoryScreen;