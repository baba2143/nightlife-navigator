import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl
} from 'react-native';
import notificationService from '../services/NotificationService';
import { useNotifications } from '../context/AppContext';

export default function NotificationsScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markNotificationRead, 
    deleteNotification, 
    clearAllNotifications 
  } = useNotifications();

  useEffect(() => {
    // 通知サービスとContextを同期
    const serviceNotifications = notificationService.getNotifications();
    if (serviceNotifications.length !== notifications.length) {
      // 必要に応じて同期処理
    }
  }, [notifications]);

  const onRefresh = () => {
    setRefreshing(true);
    // 通知サービスから最新の通知を取得
    const serviceNotifications = notificationService.getNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification) => {
    // 通知を既読にする
    markNotificationRead(notification.id);
    notificationService.markAsRead(notification.id);

    // 通知タイプに応じて適切な画面に遷移
    if (notification.data?.couponId) {
      // クーポン詳細画面に遷移
      navigation.navigate('Coupons');
    }
  };

  const handleDeleteNotification = (notificationId) => {
    Alert.alert(
      '通知を削除',
      'この通知を削除しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            deleteNotification(notificationId);
            notificationService.deleteNotification(notificationId);
          }
        }
      ]
    );
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    // Contextの通知も既読にする
    notifications.forEach(notification => {
      if (!notification.isRead) {
        markNotificationRead(notification.id);
      }
    });
  };

  const handleClearAll = () => {
    Alert.alert(
      'すべての通知を削除',
      'すべての通知を削除しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            clearAllNotifications();
            notificationService.clearAllNotifications();
          }
        }
      ]
    );
  };

  const getNotificationIcon = (type) => {
    const icons = {
      coupon: '🎫',
      rainy_day_coupon: '🌧️',
      time_sale: '⏰',
      birthday_coupon: '🎂',
      default: '📢'
    };
    return icons[type] || icons.default;
  };

  const getNotificationColor = (type) => {
    const colors = {
      coupon: '#4CAF50',
      rainy_day_coupon: '#2196F3',
      time_sale: '#FF9800',
      birthday_coupon: '#E91E63',
      default: '#9C27B0'
    };
    return colors[type] || colors.default;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return '今';
    if (diffInMinutes < 60) return `${diffInMinutes}分前`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}時間前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}日前`;
    
    return date.toLocaleDateString('ja-JP');
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIcon}>
          <Text style={styles.iconText}>{getNotificationIcon(item.type)}</Text>
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationBody}>{item.body}</Text>
          <Text style={styles.notificationTime}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(item.id)}
        >
          <Text style={styles.deleteButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      {!item.isRead && (
        <View style={[
          styles.unreadIndicator,
          { backgroundColor: getNotificationColor(item.type) }
        ]} />
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📢</Text>
      <Text style={styles.emptyStateTitle}>通知はありません</Text>
      <Text style={styles.emptyStateText}>
        新しいクーポンやお得な情報が配信されると、ここに表示されます
      </Text>
    </View>
  );



  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>通知</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {notifications.length > 0 && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.actionButtonText}>すべて既読</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearAll}
          >
            <Text style={styles.actionButtonText}>すべて削除</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        style={styles.notificationList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D4AF37"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37'
  },
  unreadBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 15,
    gap: 10
  },
  actionButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#444'
  },
  actionButtonText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '600'
  },
  notificationList: {
    flex: 1
  },
  notificationItem: {
    backgroundColor: '#2a2a2a',
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#333'
  },
  unreadNotification: {
    borderColor: '#D4AF37',
    borderWidth: 2
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  iconText: {
    fontSize: 20
  },
  notificationContent: {
    flex: 1
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  notificationBody: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    lineHeight: 20
  },
  notificationTime: {
    fontSize: 12,
    color: '#888'
  },
  deleteButton: {
    padding: 5
  },
  deleteButtonText: {
    color: '#FF6B6B',
    fontSize: 16
  },
  unreadIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 20
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 10
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24
  }
}); 