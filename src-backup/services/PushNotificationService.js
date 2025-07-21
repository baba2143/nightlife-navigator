/**
 * Push Notification Service
 * Comprehensive push notification system with Firebase Cloud Messaging integration
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import ConfigService from './ConfigService';
import LoggingService from './LoggingService';
import MonitoringManager from './MonitoringManager';

// Notification behavior configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  constructor() {
    this.initialized = false;
    this.expoPushToken = null;
    this.fcmToken = null;
    this.userId = null;
    this.deviceId = null;
    this.subscriptions = new Map();
    this.notificationQueue = [];
    this.maxQueueSize = 100;
    
    // Permission status
    this.permissionStatus = 'undetermined';
    this.permissionAsked = false;
    
    // Notification history
    this.notificationHistory = [];
    this.maxHistorySize = 500;
    
    // Event listeners
    this.notificationListeners = new Set();
    this.responseListeners = new Set();
    
    // Badge management
    this.badgeCount = 0;
    
    // Notification categories
    this.categories = new Map();
    
    // Scheduled notifications
    this.scheduledNotifications = new Map();
  }

  /**
   * Initialize push notification service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      const config = ConfigService.getConfig();
      
      // Only initialize if push notifications are enabled
      if (!config.features?.pushNotifications) {
        LoggingService.info('[PushNotificationService] Push notifications disabled');
        return;
      }

      // Setup device information
      await this.setupDeviceInfo();
      
      // Load notification history
      await this.loadNotificationHistory();
      
      // Setup notification categories
      this.setupNotificationCategories();
      
      // Setup notification listeners
      this.setupNotificationListeners();
      
      // Request permissions if in production
      if (config.isProduction || config.isStaging) {
        await this.requestPermissions();
      }

      this.initialized = true;
      
      LoggingService.info('[PushNotificationService] Initialized', {
        environment: config.environment,
        platform: Platform.OS,
        deviceId: this.deviceId,
        permissionStatus: this.permissionStatus,
      });

    } catch (error) {
      LoggingService.error('[PushNotificationService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Setup device information
   */
  async setupDeviceInfo() {
    try {
      this.deviceId = await this.getDeviceId();
      
      const deviceInfo = {
        id: this.deviceId,
        isDevice: Device.isDevice,
        platform: Platform.OS,
        platformVersion: Platform.Version,
        brand: Device.brand,
        manufacturer: Device.manufacturer,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
      };

      LoggingService.debug('[PushNotificationService] Device info collected', deviceInfo);
      
    } catch (error) {
      LoggingService.warn('[PushNotificationService] Failed to setup device info', {
        error: error.message,
      });
    }
  }

  /**
   * Setup notification categories for iOS
   */
  setupNotificationCategories() {
    const categories = [
      {
        identifier: 'venue_recommendation',
        actions: [
          {
            identifier: 'view_venue',
            buttonTitle: '詳細を見る',
            options: { opensAppToForeground: true },
          },
          {
            identifier: 'save_for_later',
            buttonTitle: 'あとで見る',
            options: { opensAppToForeground: false },
          },
        ],
        options: { customDismissAction: true },
      },
      {
        identifier: 'social_interaction',
        actions: [
          {
            identifier: 'reply',
            buttonTitle: '返信',
            options: { opensAppToForeground: true },
          },
          {
            identifier: 'ignore',
            buttonTitle: '無視',
            options: { opensAppToForeground: false },
          },
        ],
      },
      {
        identifier: 'promotional',
        actions: [
          {
            identifier: 'view_offer',
            buttonTitle: 'オファーを見る',
            options: { opensAppToForeground: true },
          },
          {
            identifier: 'unsubscribe',
            buttonTitle: '配信停止',
            options: { opensAppToForeground: false },
          },
        ],
      },
    ];

    categories.forEach(category => {
      this.categories.set(category.identifier, category);
    });

    // Set categories for iOS
    if (Platform.OS === 'ios') {
      Notifications.setNotificationCategoryAsync(
        categories.map(cat => ({
          identifier: cat.identifier,
          actions: cat.actions,
          options: cat.options,
        }))
      );
    }
  }

  /**
   * Setup notification event listeners
   */
  setupNotificationListeners() {
    // Listener for incoming notifications when app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      this.handleNotificationReceived.bind(this)
    );

    // Listener for notification responses (user tapped notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse.bind(this)
    );

    LoggingService.debug('[PushNotificationService] Notification listeners setup');
  }

  /**
   * Request notification permissions
   */
  async requestPermissions() {
    try {
      if (!Device.isDevice) {
        LoggingService.warn('[PushNotificationService] Push notifications only work on physical devices');
        return { status: 'denied', reason: 'not_device' };
      }

      // Check current permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      this.permissionStatus = existingStatus;

      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        this.permissionAsked = true;
      }

      this.permissionStatus = finalStatus;

      if (finalStatus === 'granted') {
        // Get push token
        await this.registerForPushNotifications();
        
        LoggingService.info('[PushNotificationService] Permissions granted', {
          status: finalStatus,
          expoPushToken: this.expoPushToken,
        });

        return { status: 'granted', token: this.expoPushToken };
      } else {
        LoggingService.warn('[PushNotificationService] Permissions denied', {
          status: finalStatus,
          permissionAsked: this.permissionAsked,
        });

        return { status: finalStatus, reason: 'permission_denied' };
      }

    } catch (error) {
      LoggingService.error('[PushNotificationService] Failed to request permissions', {
        error: error.message,
        stack: error.stack,
      });
      
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Register for push notifications and get token
   */
  async registerForPushNotifications() {
    try {
      // Get Expo push token
      const expoPushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      this.expoPushToken = expoPushTokenData.data;

      // Store token locally
      await AsyncStorage.setItem('expo_push_token', this.expoPushToken);

      // Register token with server
      await this.registerTokenWithServer(this.expoPushToken);

      LoggingService.info('[PushNotificationService] Push token registered', {
        token: this.expoPushToken,
        userId: this.userId,
      });

      return this.expoPushToken;

    } catch (error) {
      LoggingService.error('[PushNotificationService] Failed to register for push notifications', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Register push token with server
   */
  async registerTokenWithServer(token) {
    try {
      const apiConfig = ConfigService.getApiConfig();
      
      const response = await fetch(`${apiConfig.baseURL}/api/push/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': apiConfig.version,
        },
        body: JSON.stringify({
          token,
          userId: this.userId,
          deviceId: this.deviceId,
          platform: Platform.OS,
          appVersion: ConfigService.get('version'),
          deviceInfo: {
            brand: Device.brand,
            modelName: Device.modelName,
            osVersion: Device.osVersion,
          },
        }),
        timeout: 10000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      LoggingService.debug('[PushNotificationService] Token registered with server', {
        success: result.success,
        tokenId: result.tokenId,
      });

      return result;

    } catch (error) {
      LoggingService.error('[PushNotificationService] Failed to register token with server', {
        error: error.message,
        token,
      });
      throw error;
    }
  }

  /**
   * Handle incoming notification when app is in foreground
   */
  async handleNotificationReceived(notification) {
    try {
      const notificationData = {
        id: notification.request.identifier,
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
        categoryIdentifier: notification.request.content.categoryIdentifier,
        receivedAt: new Date().toISOString(),
        trigger: notification.request.trigger,
      };

      // Add to history
      this.addToHistory(notificationData, 'received');

      // Log notification
      LoggingService.info('[PushNotificationService] Notification received', {
        id: notificationData.id,
        title: notificationData.title,
        category: notificationData.categoryIdentifier,
      });

      // Track analytics
      MonitoringManager.trackUserAction?.('notification_received', 'system', {
        notificationId: notificationData.id,
        category: notificationData.categoryIdentifier,
      });

      // Notify listeners
      this.notificationListeners.forEach(listener => {
        try {
          listener(notificationData, 'received');
        } catch (error) {
          LoggingService.error('[PushNotificationService] Notification listener error', {
            error: error.message,
          });
        }
      });

    } catch (error) {
      LoggingService.error('[PushNotificationService] Failed to handle notification received', {
        error: error.message,
        notification: notification.request.identifier,
      });
    }
  }

  /**
   * Handle notification response (user interaction)
   */
  async handleNotificationResponse(response) {
    try {
      const notificationData = {
        id: response.notification.request.identifier,
        title: response.notification.request.content.title,
        body: response.notification.request.content.body,
        data: response.notification.request.content.data,
        categoryIdentifier: response.notification.request.content.categoryIdentifier,
        actionIdentifier: response.actionIdentifier,
        userText: response.userText,
        respondedAt: new Date().toISOString(),
      };

      // Add to history
      this.addToHistory(notificationData, 'responded');

      // Log response
      LoggingService.info('[PushNotificationService] Notification response', {
        id: notificationData.id,
        action: notificationData.actionIdentifier,
        category: notificationData.categoryIdentifier,
      });

      // Track analytics
      MonitoringManager.trackUserAction?.('notification_responded', 'system', {
        notificationId: notificationData.id,
        action: notificationData.actionIdentifier,
        category: notificationData.categoryIdentifier,
      });

      // Handle specific actions
      await this.handleNotificationAction(notificationData);

      // Notify listeners
      this.responseListeners.forEach(listener => {
        try {
          listener(notificationData, 'responded');
        } catch (error) {
          LoggingService.error('[PushNotificationService] Response listener error', {
            error: error.message,
          });
        }
      });

    } catch (error) {
      LoggingService.error('[PushNotificationService] Failed to handle notification response', {
        error: error.message,
        notification: response.notification.request.identifier,
      });
    }
  }

  /**
   * Handle specific notification actions
   */
  async handleNotificationAction(notificationData) {
    const { actionIdentifier, categoryIdentifier, data } = notificationData;

    try {
      switch (actionIdentifier) {
        case 'view_venue':
          await this.handleViewVenueAction(data);
          break;
          
        case 'save_for_later':
          await this.handleSaveForLaterAction(data);
          break;
          
        case 'reply':
          await this.handleReplyAction(notificationData);
          break;
          
        case 'unsubscribe':
          await this.handleUnsubscribeAction(categoryIdentifier);
          break;
          
        case Notifications.DEFAULT_ACTION_IDENTIFIER:
          await this.handleDefaultAction(notificationData);
          break;
          
        default:
          LoggingService.debug('[PushNotificationService] Unknown action', {
            action: actionIdentifier,
            category: categoryIdentifier,
          });
      }

    } catch (error) {
      LoggingService.error('[PushNotificationService] Failed to handle notification action', {
        error: error.message,
        action: actionIdentifier,
      });
    }
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(notification) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          categoryIdentifier: notification.categoryIdentifier,
          sound: notification.sound || 'default',
          badge: notification.badge,
        },
        trigger: notification.trigger || null,
      });

      LoggingService.info('[PushNotificationService] Local notification sent', {
        id: notificationId,
        title: notification.title,
      });

      return notificationId;

    } catch (error) {
      LoggingService.error('[PushNotificationService] Failed to send local notification', {
        error: error.message,
        notification: notification.title,
      });
      throw error;
    }
  }

  /**
   * Schedule notification
   */
  async scheduleNotification(notification, trigger) {
    try {
      const scheduledId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          categoryIdentifier: notification.categoryIdentifier,
          sound: notification.sound || 'default',
        },
        trigger,
      });

      // Store scheduled notification info
      this.scheduledNotifications.set(scheduledId, {
        id: scheduledId,
        notification,
        trigger,
        scheduledAt: new Date().toISOString(),
      });

      LoggingService.info('[PushNotificationService] Notification scheduled', {
        id: scheduledId,
        title: notification.title,
        trigger,
      });

      return scheduledId;

    } catch (error) {
      LoggingService.error('[PushNotificationService] Failed to schedule notification', {
        error: error.message,
        notification: notification.title,
      });
      throw error;
    }
  }

  /**
   * Cancel scheduled notification
   */
  async cancelScheduledNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      
      this.scheduledNotifications.delete(notificationId);

      LoggingService.info('[PushNotificationService] Scheduled notification cancelled', {
        id: notificationId,
      });

    } catch (error) {
      LoggingService.error('[PushNotificationService] Failed to cancel notification', {
        error: error.message,
        id: notificationId,
      });
      throw error;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllScheduledNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      this.scheduledNotifications.clear();

      LoggingService.info('[PushNotificationService] All scheduled notifications cancelled');

    } catch (error) {
      LoggingService.error('[PushNotificationService] Failed to cancel all notifications', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get scheduled notifications
   */
  async getScheduledNotifications() {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      
      return scheduled.map(notification => ({
        id: notification.identifier,
        content: notification.content,
        trigger: notification.trigger,
      }));

    } catch (error) {
      LoggingService.error('[PushNotificationService] Failed to get scheduled notifications', {
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
      this.badgeCount = count;

      LoggingService.debug('[PushNotificationService] Badge count set', {
        count,
      });

    } catch (error) {
      LoggingService.error('[PushNotificationService] Failed to set badge count', {
        error: error.message,
        count,
      });
    }
  }

  /**
   * Clear badge count
   */
  async clearBadgeCount() {
    await this.setBadgeCount(0);
  }

  /**
   * Subscribe to notification topic
   */
  async subscribeToTopic(topic) {
    try {
      const apiConfig = ConfigService.getApiConfig();
      
      const response = await fetch(`${apiConfig.baseURL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': apiConfig.version,
        },
        body: JSON.stringify({
          token: this.expoPushToken,
          userId: this.userId,
          topic,
        }),
        timeout: 10000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      this.subscriptions.set(topic, {
        topic,
        subscribedAt: new Date().toISOString(),
      });

      LoggingService.info('[PushNotificationService] Subscribed to topic', {
        topic,
        userId: this.userId,
      });

      return true;

    } catch (error) {
      LoggingService.error('[PushNotificationService] Failed to subscribe to topic', {
        error: error.message,
        topic,
      });
      return false;
    }
  }

  /**
   * Unsubscribe from notification topic
   */
  async unsubscribeFromTopic(topic) {
    try {
      const apiConfig = ConfigService.getApiConfig();
      
      const response = await fetch(`${apiConfig.baseURL}/api/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': apiConfig.version,
        },
        body: JSON.stringify({
          token: this.expoPushToken,
          userId: this.userId,
          topic,
        }),
        timeout: 10000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      this.subscriptions.delete(topic);

      LoggingService.info('[PushNotificationService] Unsubscribed from topic', {
        topic,
        userId: this.userId,
      });

      return true;

    } catch (error) {
      LoggingService.error('[PushNotificationService] Failed to unsubscribe from topic', {
        error: error.message,
        topic,
      });
      return false;
    }
  }

  /**
   * Set user context
   */
  setUser(userId, userInfo = {}) {
    this.userId = userId;
    
    // Re-register token with new user context
    if (this.expoPushToken) {
      this.registerTokenWithServer(this.expoPushToken).catch(error => {
        LoggingService.warn('[PushNotificationService] Failed to update user context', {
          error: error.message,
          userId,
        });
      });
    }
  }

  /**
   * Add notification listener
   */
  addNotificationListener(listener) {
    this.notificationListeners.add(listener);
    
    return () => {
      this.notificationListeners.delete(listener);
    };
  }

  /**
   * Add response listener
   */
  addResponseListener(listener) {
    this.responseListeners.add(listener);
    
    return () => {
      this.responseListeners.delete(listener);
    };
  }

  /**
   * Add to notification history
   */
  addToHistory(notification, type) {
    const historyEntry = {
      ...notification,
      type,
      timestamp: new Date().toISOString(),
    };

    this.notificationHistory.unshift(historyEntry);

    // Limit history size
    if (this.notificationHistory.length > this.maxHistorySize) {
      this.notificationHistory = this.notificationHistory.slice(0, this.maxHistorySize);
    }

    // Save to storage
    this.saveNotificationHistory().catch(error => {
      LoggingService.warn('[PushNotificationService] Failed to save notification history', {
        error: error.message,
      });
    });
  }

  /**
   * Get notification history
   */
  getNotificationHistory(limit = 50) {
    return this.notificationHistory.slice(0, limit);
  }

  /**
   * Clear notification history
   */
  async clearNotificationHistory() {
    try {
      this.notificationHistory = [];
      await AsyncStorage.removeItem('notification_history');
      
      LoggingService.info('[PushNotificationService] Notification history cleared');

    } catch (error) {
      LoggingService.error('[PushNotificationService] Failed to clear notification history', {
        error: error.message,
      });
    }
  }

  /**
   * Save notification history to storage
   */
  async saveNotificationHistory() {
    try {
      await AsyncStorage.setItem(
        'notification_history',
        JSON.stringify(this.notificationHistory.slice(0, 100)) // Save only last 100
      );
    } catch (error) {
      LoggingService.warn('[PushNotificationService] Failed to save notification history', {
        error: error.message,
      });
    }
  }

  /**
   * Load notification history from storage
   */
  async loadNotificationHistory() {
    try {
      const historyJson = await AsyncStorage.getItem('notification_history');
      
      if (historyJson) {
        this.notificationHistory = JSON.parse(historyJson);
        
        LoggingService.debug('[PushNotificationService] Notification history loaded', {
          count: this.notificationHistory.length,
        });
      }

    } catch (error) {
      LoggingService.warn('[PushNotificationService] Failed to load notification history', {
        error: error.message,
      });
    }
  }

  /**
   * Get device ID
   */
  async getDeviceId() {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      
      if (!deviceId) {
        deviceId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('device_id', deviceId);
      }
      
      return deviceId;

    } catch (error) {
      LoggingService.warn('[PushNotificationService] Failed to get device ID', {
        error: error.message,
      });
      
      // Fallback to generated ID
      return `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Handle specific notification actions
   */
  async handleViewVenueAction(data) {
    // Implementation would navigate to venue details
    LoggingService.info('[PushNotificationService] View venue action', { data });
  }

  async handleSaveForLaterAction(data) {
    // Implementation would save venue to favorites
    LoggingService.info('[PushNotificationService] Save for later action', { data });
  }

  async handleReplyAction(notificationData) {
    // Implementation would handle reply
    LoggingService.info('[PushNotificationService] Reply action', {
      text: notificationData.userText,
    });
  }

  async handleUnsubscribeAction(categoryIdentifier) {
    // Implementation would unsubscribe from category
    LoggingService.info('[PushNotificationService] Unsubscribe action', {
      category: categoryIdentifier,
    });
  }

  async handleDefaultAction(notificationData) {
    // Implementation would handle default tap action
    LoggingService.info('[PushNotificationService] Default action', {
      id: notificationData.id,
    });
  }

  /**
   * Get notification statistics
   */
  getNotificationStatistics() {
    return {
      initialized: this.initialized,
      permissionStatus: this.permissionStatus,
      permissionAsked: this.permissionAsked,
      hasToken: !!this.expoPushToken,
      deviceId: this.deviceId,
      userId: this.userId,
      subscriptions: this.subscriptions.size,
      historyCount: this.notificationHistory.length,
      scheduledCount: this.scheduledNotifications.size,
      badgeCount: this.badgeCount,
      listeners: {
        notification: this.notificationListeners.size,
        response: this.responseListeners.size,
      },
    };
  }

  /**
   * Export notification data
   */
  async exportNotificationData() {
    try {
      const stats = this.getNotificationStatistics();
      const history = this.getNotificationHistory();
      const scheduled = await this.getScheduledNotifications();
      
      return {
        statistics: stats,
        history,
        scheduled,
        subscriptions: Array.from(this.subscriptions.values()),
        exportedAt: new Date().toISOString(),
      };

    } catch (error) {
      LoggingService.error('[PushNotificationService] Failed to export notification data', {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Remove listeners
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    
    if (this.responseListener) {
      this.responseListener.remove();
    }

    // Clear listeners
    this.notificationListeners.clear();
    this.responseListeners.clear();

    // Clear data
    this.subscriptions.clear();
    this.scheduledNotifications.clear();
    this.categories.clear();

    this.initialized = false;
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;