import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class NotificationService {
  constructor() {
    this.initialized = false;
    this.notifications = new Map();
    this.settings = {
      enabled: true,
      sound: true,
      badge: true,
      banner: true,
      categories: {
        newVenue: true,
        coupon: true,
        favorite: true,
        event: true,
        review: true,
        system: true,
      },
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
      },
    };
    this.listeners = [];
    this.storageKeys = {
      notifications: '@nightlife_navigator:notifications',
      settings: '@nightlife_navigator:notification_settings',
    };
    this.maxStoredNotifications = 100;
    this.scheduleIds = new Map();
  }

  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await this.loadNotifications();
      await this.loadSettings();
      await this.initializeMockNotifications();
      
      this.initialized = true;
      console.log('NotificationService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NotificationService:', error);
      throw error;
    }
  }

  async loadNotifications() {
    try {
      const stored = await AsyncStorage.getItem(this.storageKeys.notifications);
      const notificationsList = stored ? JSON.parse(stored) : [];

      this.notifications.clear();
      notificationsList.forEach(notification => {
        this.notifications.set(notification.id, {
          ...notification,
          createdAt: new Date(notification.createdAt),
          scheduledAt: notification.scheduledAt ? new Date(notification.scheduledAt) : null,
        });
      });

      console.log(`Loaded ${this.notifications.size} notifications`);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      this.notifications.clear();
    }
  }

  async loadSettings() {
    try {
      const stored = await AsyncStorage.getItem(this.storageKeys.settings);
      if (stored) {
        const savedSettings = JSON.parse(stored);
        this.settings = { ...this.settings, ...savedSettings };
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }

  async saveNotifications() {
    try {
      const notificationsList = Array.from(this.notifications.values()).map(notification => ({
        ...notification,
        createdAt: notification.createdAt.toISOString(),
        scheduledAt: notification.scheduledAt ? notification.scheduledAt.toISOString() : null,
      }));

      await AsyncStorage.setItem(
        this.storageKeys.notifications,
        JSON.stringify(notificationsList)
      );
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  async saveSettings() {
    try {
      await AsyncStorage.setItem(
        this.storageKeys.settings,
        JSON.stringify(this.settings)
      );
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  async initializeMockNotifications() {
    if (this.notifications.size === 0) {
      const mockNotifications = [
        {
          id: 'notif_1',
          type: 'newVenue',
          title: '新店舗追加',
          message: '渋谷に新しいクラブ「NEON」がオープンしました！',
          data: {
            venueId: 'venue_new_1',
            venueName: 'NEON',
            category: 'club',
            area: '渋谷',
          },
          read: false,
          category: 'newVenue',
          priority: 'normal',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2日前
          scheduledAt: null,
        },
        {
          id: 'notif_2',
          type: 'coupon',
          title: '限定クーポン',
          message: 'お気に入りの「六本木 バーン」で50%オフクーポンが利用可能です！',
          data: {
            venueId: 'venue_2',
            venueName: '六本木 バーン',
            couponId: 'coupon_123',
            discount: 50,
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          read: false,
          category: 'coupon',
          priority: 'high',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6時間前
          scheduledAt: null,
        },
        {
          id: 'notif_3',
          type: 'event',
          title: '特別イベント',
          message: '今夜「新宿 ラウンジ アジュール」でスペシャルDJイベント開催！',
          data: {
            venueId: 'venue_3',
            venueName: '新宿 ラウンジ アジュール',
            eventId: 'event_456',
            eventName: 'Special DJ Night',
            eventDate: new Date().toISOString(),
          },
          read: true,
          category: 'event',
          priority: 'normal',
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12時間前
          scheduledAt: null,
        },
        {
          id: 'notif_4',
          type: 'favorite',
          title: 'お気に入り店舗情報',
          message: 'お気に入りの店舗で新しいメニューが追加されました',
          data: {
            venueId: 'venue_1',
            venueName: '渋谷 VISION',
            updateType: 'menu',
          },
          read: true,
          category: 'favorite',
          priority: 'low',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1日前
          scheduledAt: null,
        },
      ];

      for (const notification of mockNotifications) {
        this.notifications.set(notification.id, notification);
      }

      await this.saveNotifications();
      console.log('Mock notifications initialized');
    }
  }

  // 新しい通知を作成
  async createNotification(notificationData) {
    try {
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: notificationData.type || 'system',
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        read: false,
        category: notificationData.category || 'system',
        priority: notificationData.priority || 'normal',
        createdAt: new Date(),
        scheduledAt: notificationData.scheduledAt ? new Date(notificationData.scheduledAt) : null,
        ...notificationData,
      };

      // カテゴリが無効化されている場合はスキップ
      if (!this.settings.categories[notification.category]) {
        console.log(`Notification category ${notification.category} is disabled, skipping`);
        return null;
      }

      // サイレント時間中かチェック
      if (this.isQuietHours() && notification.priority !== 'high') {
        console.log('Notification created during quiet hours, storing silently');
        notification.silentDelivery = true;
      }

      this.notifications.set(notification.id, notification);
      
      // ストレージ制限を適用
      await this.enforceStorageLimit();
      await this.saveNotifications();

      // イベント発火
      this.emit('notificationCreated', notification);
      this.emit('notificationCountChanged', this.getUnreadCount());

      // 即座に表示するかスケジューリング
      if (!notification.scheduledAt) {
        this.displayNotification(notification);
      } else {
        this.scheduleNotification(notification);
      }

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }

  // 通知を表示（実際のプッシュ通知はモックアップ）
  displayNotification(notification) {
    if (!this.settings.enabled) return;
    
    console.log('📱 Notification displayed:', {
      title: notification.title,
      message: notification.message,
      category: notification.category,
      priority: notification.priority,
    });

    // 実際の実装ではExpo Notificationsを使用
    // await Notifications.presentNotificationAsync({
    //   title: notification.title,
    //   body: notification.message,
    //   data: notification.data,
    // });
  }

  // 通知をスケジューリング
  scheduleNotification(notification) {
    const scheduleTime = notification.scheduledAt.getTime() - Date.now();
    
    if (scheduleTime > 0) {
      const timeoutId = setTimeout(() => {
        this.displayNotification(notification);
        this.scheduleIds.delete(notification.id);
      }, scheduleTime);
      
      this.scheduleIds.set(notification.id, timeoutId);
      console.log(`Notification scheduled for ${notification.scheduledAt}`);
    }
  }

  // 通知を既読にする
  async markAsRead(notificationId) {
    try {
      const notification = this.notifications.get(notificationId);
      if (!notification) return false;

      notification.read = true;
      notification.readAt = new Date();
      
      await this.saveNotifications();
      this.emit('notificationRead', notification);
      this.emit('notificationCountChanged', this.getUnreadCount());

      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  // すべての通知を既読にする
  async markAllAsRead() {
    try {
      let markedCount = 0;
      
      for (const notification of this.notifications.values()) {
        if (!notification.read) {
          notification.read = true;
          notification.readAt = new Date();
          markedCount++;
        }
      }

      if (markedCount > 0) {
        await this.saveNotifications();
        this.emit('allNotificationsRead', { count: markedCount });
        this.emit('notificationCountChanged', 0);
      }

      return markedCount;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return 0;
    }
  }

  // 通知を削除
  async deleteNotification(notificationId) {
    try {
      const notification = this.notifications.get(notificationId);
      if (!notification) return false;

      // スケジューリングされている場合はキャンセル
      if (this.scheduleIds.has(notificationId)) {
        clearTimeout(this.scheduleIds.get(notificationId));
        this.scheduleIds.delete(notificationId);
      }

      this.notifications.delete(notificationId);
      await this.saveNotifications();

      this.emit('notificationDeleted', notification);
      this.emit('notificationCountChanged', this.getUnreadCount());

      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  }

  // 全通知を削除
  async clearAllNotifications() {
    try {
      const count = this.notifications.size;
      
      // 全スケジュールをキャンセル
      for (const timeoutId of this.scheduleIds.values()) {
        clearTimeout(timeoutId);
      }
      this.scheduleIds.clear();

      this.notifications.clear();
      await this.saveNotifications();

      this.emit('allNotificationsCleared', { count });
      this.emit('notificationCountChanged', 0);

      return count;
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      return 0;
    }
  }

  // 通知一覧を取得
  getNotifications(options = {}) {
    const {
      limit = 50,
      offset = 0,
      category = null,
      read = null,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    let notifications = Array.from(this.notifications.values());

    // フィルタリング
    if (category) {
      notifications = notifications.filter(n => n.category === category);
    }
    
    if (read !== null) {
      notifications = notifications.filter(n => n.read === read);
    }

    // ソート
    notifications.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });

    // ページネーション
    return notifications.slice(offset, offset + limit);
  }

  // 未読通知数を取得
  getUnreadCount() {
    return Array.from(this.notifications.values()).filter(n => !n.read).length;
  }

  // カテゴリ別未読数を取得
  getUnreadCountByCategory() {
    const counts = {};
    
    for (const notification of this.notifications.values()) {
      if (!notification.read) {
        counts[notification.category] = (counts[notification.category] || 0) + 1;
      }
    }
    
    return counts;
  }

  // 設定を更新
  async updateSettings(newSettings) {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await this.saveSettings();
      
      this.emit('settingsUpdated', this.settings);
      return true;
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      return false;
    }
  }

  // 設定を取得
  getSettings() {
    return { ...this.settings };
  }

  // サイレント時間かチェック
  isQuietHours() {
    if (!this.settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const startTime = this.settings.quietHours.start;
    const endTime = this.settings.quietHours.end;

    if (startTime < endTime) {
      // 同じ日内の時間範囲
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // 日をまたぐ時間範囲
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // ストレージ制限を適用
  async enforceStorageLimit() {
    const notifications = Array.from(this.notifications.values())
      .sort((a, b) => b.createdAt - a.createdAt);
    
    if (notifications.length > this.maxStoredNotifications) {
      const toRemove = notifications.slice(this.maxStoredNotifications);
      
      for (const notification of toRemove) {
        this.notifications.delete(notification.id);
        
        if (this.scheduleIds.has(notification.id)) {
          clearTimeout(this.scheduleIds.get(notification.id));
          this.scheduleIds.delete(notification.id);
        }
      }
      
      console.log(`Removed ${toRemove.length} old notifications to enforce storage limit`);
    }
  }

  // 便利メソッド群
  async createCouponNotification(venueId, venueName, couponData) {
    return await this.createNotification({
      type: 'coupon',
      category: 'coupon',
      priority: 'high',
      title: '限定クーポン',
      message: `${venueName}で${couponData.discount}%オフクーポンが利用可能です！`,
      data: {
        venueId,
        venueName,
        couponId: couponData.id,
        discount: couponData.discount,
        expiryDate: couponData.expiryDate,
      },
    });
  }

  async createEventNotification(venueId, venueName, eventData) {
    return await this.createNotification({
      type: 'event',
      category: 'event',
      priority: 'normal',
      title: '特別イベント',
      message: `${venueName}で「${eventData.name}」が開催されます！`,
      data: {
        venueId,
        venueName,
        eventId: eventData.id,
        eventName: eventData.name,
        eventDate: eventData.date,
      },
    });
  }

  async createNewVenueNotification(venueData) {
    return await this.createNotification({
      type: 'newVenue',
      category: 'newVenue',
      priority: 'normal',
      title: '新店舗追加',
      message: `${venueData.area}に新しい${venueData.category}「${venueData.name}」がオープンしました！`,
      data: {
        venueId: venueData.id,
        venueName: venueData.name,
        category: venueData.category,
        area: venueData.area,
      },
    });
  }

  async createFavoriteUpdateNotification(venueId, venueName, updateType) {
    const messages = {
      menu: '新しいメニューが追加されました',
      hours: '営業時間が変更されました',
      event: '新しいイベントが予定されています',
      review: '新しいレビューが投稿されました',
    };

    return await this.createNotification({
      type: 'favorite',
      category: 'favorite',
      priority: 'low',
      title: 'お気に入り店舗情報',
      message: `お気に入りの${venueName}で${messages[updateType] || '更新があります'}`,
      data: {
        venueId,
        venueName,
        updateType,
      },
    });
  }

  // イベントシステム
  addEventListener(eventType, callback) {
    this.listeners.push({ eventType, callback });
  }

  removeEventListener(eventType, callback) {
    this.listeners = this.listeners.filter(
      listener => listener.eventType !== eventType || listener.callback !== callback
    );
  }

  emit(eventType, data) {
    this.listeners
      .filter(listener => listener.eventType === eventType)
      .forEach(listener => {
        try {
          listener.callback(data);
        } catch (error) {
          console.error(`Error in notification event listener for ${eventType}:`, error);
        }
      });
  }

  async cleanup() {
    try {
      // 全スケジュールをキャンセル
      for (const timeoutId of this.scheduleIds.values()) {
        clearTimeout(timeoutId);
      }
      this.scheduleIds.clear();

      this.listeners = [];
      this.notifications.clear();
      this.initialized = false;
      
      console.log('NotificationService cleaned up');
    } catch (error) {
      console.error('Failed to cleanup NotificationService:', error);
    }
  }
}

export default NotificationService.getInstance();