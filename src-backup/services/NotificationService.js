import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import { config } from '../config';

// 通知の設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.notifications = [];
    this.isInitialized = false;
    this.expoPushToken = null;
  }

  // 通知サービスを初期化
  async initialize() {
    try {
      // Expo Push Tokenを取得
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Expo Push Tokenを取得
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: config.EXPO_PROJECT_ID || 'your-project-id-here'
      });
      
      this.expoPushToken = token.data;
      console.log('Expo Push Token:', this.expoPushToken);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return false;
    }
  }

  // 通知権限を要求
  async requestPermissions() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  // クーポン配信通知を送信
  async sendCouponNotification(coupon, bar, targetUsers = [], onNotificationAdd = null) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const notification = {
        id: `coupon_${coupon.id}_${Date.now()}`,
        type: 'coupon',
        title: '🎫 新しいクーポンが配信されました！',
        body: `${bar.name}から「${coupon.title}」が配信されました`,
        data: {
          couponId: coupon.id,
          barId: bar.id,
          barName: bar.name,
          couponTitle: coupon.title,
          couponType: coupon.type
        },
        timestamp: new Date().toISOString(),
        isRead: false
      };

      // 本番環境ではプッシュ通知を送信
      if (config.ENV === 'production') {
        await this.sendPushNotification(notification, targetUsers);
      } else {
        // 開発環境ではローカル通知として表示
        await this.scheduleLocalNotification(notification);
      }

      // 通知履歴に保存
      this.notifications.unshift(notification);

      // Contextに通知を追加
      if (onNotificationAdd) {
        onNotificationAdd(notification);
      }

      console.log('Coupon notification sent:', notification);
      return notification;
    } catch (error) {
      console.error('Failed to send coupon notification:', error);
      return null;
    }
  }

  // プッシュ通知を送信
  async sendPushNotification(notification, targetUsers) {
    try {
      // 実際の実装では、サーバーサイドでプッシュ通知を送信
      // ここではExpo Push APIを使用した例を示す
      const message = {
        to: targetUsers.length > 0 ? targetUsers : this.expoPushToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data,
        channelId: 'coupons'
      };

      // 本番環境ではサーバーサイドで送信
      console.log('Push notification message:', message);
      
      // 開発用：ローカル通知としてスケジュール
      await this.scheduleLocalNotification(notification);
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  // ローカル通知をスケジュール
  async scheduleLocalNotification(notification) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: 'default'
        },
        trigger: null, // 即座に送信
      });
    } catch (error) {
      console.error('Failed to schedule local notification:', error);
      // フォールバック：Alertで表示
      this.showLocalNotification(notification);
    }
  }

  // ローカル通知を表示（デモ用）
  showLocalNotification(notification) {
    Alert.alert(
      notification.title,
      notification.body,
      [
        {
          text: '詳細を見る',
          onPress: () => {
            // クーポン詳細画面に遷移
            console.log('Navigate to coupon detail:', notification.data);
          }
        },
        {
          text: '閉じる',
          style: 'cancel'
        }
      ]
    );
  }

  // お気に入り店舗のクーポン配信通知
  async sendFavoriteBarCouponNotification(coupon, bar, favoriteUsers, onNotificationAdd = null) {
    try {
      const notifications = [];
      
      for (const userId of favoriteUsers) {
        const notification = await this.sendCouponNotification(coupon, bar, [userId], onNotificationAdd);
        if (notification) {
          notifications.push(notification);
        }
      }

      console.log(`Sent coupon notifications to ${notifications.length} favorite users`);
      return notifications;
    } catch (error) {
      console.error('Failed to send favorite bar coupon notifications:', error);
      return [];
    }
  }

  // 雨の日クーポン通知
  async sendRainyDayCouponNotification(coupon, bar, users) {
    try {
      const notification = {
        id: `rainy_${coupon.id}_${Date.now()}`,
        type: 'rainy_day_coupon',
        title: '🌧️ 雨の日限定クーポン！',
        body: `${bar.name}の雨の日限定クーポン「${coupon.title}」が利用可能です`,
        data: {
          couponId: coupon.id,
          barId: bar.id,
          barName: bar.name,
          couponTitle: coupon.title,
          couponType: coupon.type
        },
        timestamp: new Date().toISOString(),
        isRead: false
      };

      if (config.ENV === 'production') {
        await this.sendPushNotification(notification, users);
      } else {
        await this.scheduleLocalNotification(notification);
      }

      this.notifications.unshift(notification);
      return notification;
    } catch (error) {
      console.error('Failed to send rainy day coupon notification:', error);
      return null;
    }
  }

  // タイムセール通知
  async sendTimeSaleNotification(coupon, bar, users) {
    try {
      const notification = {
        id: `timesale_${coupon.id}_${Date.now()}`,
        type: 'time_sale',
        title: '⏰ タイムセール開始！',
        body: `${bar.name}のタイムセール「${coupon.title}」が開始されました`,
        data: {
          couponId: coupon.id,
          barId: bar.id,
          barName: bar.name,
          couponTitle: coupon.title,
          couponType: coupon.type
        },
        timestamp: new Date().toISOString(),
        isRead: false
      };

      if (config.ENV === 'production') {
        await this.sendPushNotification(notification, users);
      } else {
        await this.scheduleLocalNotification(notification);
      }

      this.notifications.unshift(notification);
      return notification;
    } catch (error) {
      console.error('Failed to send time sale notification:', error);
      return null;
    }
  }

  // 誕生日特典通知
  async sendBirthdayCouponNotification(coupon, bar, user) {
    try {
      const notification = {
        id: `birthday_${coupon.id}_${Date.now()}`,
        type: 'birthday_coupon',
        title: '🎂 誕生日特典クーポン！',
        body: `${bar.name}から誕生日特典「${coupon.title}」が配信されました`,
        data: {
          couponId: coupon.id,
          barId: bar.id,
          barName: bar.name,
          couponTitle: coupon.title,
          couponType: coupon.type
        },
        timestamp: new Date().toISOString(),
        isRead: false
      };

      if (config.ENV === 'production') {
        await this.sendPushNotification(notification, [user.id]);
      } else {
        await this.scheduleLocalNotification(notification);
      }

      this.notifications.unshift(notification);
      return notification;
    } catch (error) {
      console.error('Failed to send birthday coupon notification:', error);
      return null;
    }
  }

  // 通知履歴を取得
  getNotifications() {
    return this.notifications;
  }

  // 未読通知数を取得
  getUnreadCount() {
    return this.notifications.filter(n => !n.isRead).length;
  }

  // 通知を既読にする
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  // すべての通知を既読にする
  markAllAsRead() {
    this.notifications.forEach(n => n.isRead = true);
  }

  // 通知を削除
  deleteNotification(notificationId) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
  }

  // すべての通知を削除
  clearAllNotifications() {
    this.notifications = [];
  }

  // 通知設定を取得
  getNotificationSettings() {
    return {
      pushEnabled: this.isInitialized,
      soundEnabled: true,
      vibrationEnabled: true,
      channels: {
        general: true,
        coupons: true,
        promotions: true
      }
    };
  }

  // 通知設定を更新
  updateNotificationSettings(settings) {
    // 実際の実装では設定を保存
    console.log('Notification settings updated:', settings);
  }

  // Expo Push Tokenを取得
  getExpoPushToken() {
    return this.expoPushToken;
  }
}

export default new NotificationService(); 