/**
 * PushNotificationService Tests
 */

import { jest } from '@jest/globals';

// Mock Expo Notifications
const mockNotifications = {
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  setBadgeCountAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  setNotificationCategoryAsync: jest.fn(),
  DEFAULT_ACTION_IDENTIFIER: 'default',
};

jest.mock('expo-notifications', () => mockNotifications);

// Mock Expo Device
const mockDevice = {
  isDevice: true,
  brand: 'Apple',
  manufacturer: 'Apple',
  modelName: 'iPhone 12',
  osName: 'iOS',
  osVersion: '15.0',
};

jest.mock('expo-device', () => mockDevice);

// Mock React Native
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '15.0',
  },
}));

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock Expo Constants
const mockConstants = {
  expoConfig: {
    extra: {
      eas: {
        projectId: 'test-project-id',
      },
    },
  },
};

jest.mock('expo-constants', () => mockConstants);

// Mock ConfigService
const mockConfigService = {
  getConfig: jest.fn(() => ({
    environment: 'test',
    features: {
      pushNotifications: true,
    },
    isProduction: false,
    isStaging: false,
  })),
  getApiConfig: jest.fn(() => ({
    baseURL: 'http://localhost:8000',
    version: 'v1',
  })),
  get: jest.fn((key) => {
    const values = {
      version: '1.0.0',
    };
    return values[key];
  }),
};

jest.mock('../ConfigService', () => mockConfigService);

// Mock LoggingService
const mockLoggingService = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

jest.mock('../LoggingService', () => mockLoggingService);

// Mock MonitoringManager
const mockMonitoringManager = {
  trackUserAction: jest.fn(),
};

jest.mock('../MonitoringManager', () => mockMonitoringManager);

// Mock fetch
global.fetch = jest.fn();

// Import after mocking
import PushNotificationService from '../PushNotificationService';

describe('PushNotificationService', () => {
  beforeEach(() => {
    // Reset service state
    PushNotificationService.initialized = false;
    PushNotificationService.expoPushToken = null;
    PushNotificationService.permissionStatus = 'undetermined';
    PushNotificationService.notificationHistory = [];
    PushNotificationService.subscriptions.clear();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock returns
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    mockNotifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
      data: 'ExponentPushToken[test-token]',
    });
    mockAsyncStorage.getItem.mockResolvedValue(null);
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    PushNotificationService.cleanup();
  });

  describe('initialization', () => {
    it('should initialize successfully when push notifications are enabled', async () => {
      await PushNotificationService.initialize();
      
      expect(PushNotificationService.initialized).toBe(true);
      expect(mockLoggingService.info).toHaveBeenCalledWith(
        '[PushNotificationService] Initialized',
        expect.objectContaining({
          environment: 'test',
          platform: 'ios',
        })
      );
    });

    it('should not initialize when push notifications are disabled', async () => {
      mockConfigService.getConfig.mockReturnValue({
        features: { pushNotifications: false },
      });

      await PushNotificationService.initialize();
      
      expect(PushNotificationService.initialized).toBe(false);
      expect(mockLoggingService.info).toHaveBeenCalledWith(
        '[PushNotificationService] Push notifications disabled'
      );
    });

    it('should not reinitialize if already initialized', async () => {
      PushNotificationService.initialized = true;
      const setupDeviceInfoSpy = jest.spyOn(PushNotificationService, 'setupDeviceInfo');
      
      await PushNotificationService.initialize();
      
      expect(setupDeviceInfoSpy).not.toHaveBeenCalled();
    });

    it('should setup notification listeners during initialization', async () => {
      await PushNotificationService.initialize();
      
      expect(mockNotifications.addNotificationReceivedListener).toHaveBeenCalled();
      expect(mockNotifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
    });
  });

  describe('permission management', () => {
    beforeEach(async () => {
      await PushNotificationService.initialize();
    });

    it('should request permissions successfully', async () => {
      const result = await PushNotificationService.requestPermissions();
      
      expect(result.status).toBe('granted');
      expect(result.token).toBe('ExponentPushToken[test-token]');
      expect(PushNotificationService.permissionStatus).toBe('granted');
    });

    it('should handle permission denial', async () => {
      mockNotifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });
      
      const result = await PushNotificationService.requestPermissions();
      
      expect(result.status).toBe('denied');
      expect(result.reason).toBe('permission_denied');
    });

    it('should handle non-device environment', async () => {
      const originalIsDevice = mockDevice.isDevice;
      mockDevice.isDevice = false;
      
      const result = await PushNotificationService.requestPermissions();
      
      expect(result.status).toBe('denied');
      expect(result.reason).toBe('not_device');
      
      mockDevice.isDevice = originalIsDevice;
    });

    it('should register push token with server', async () => {
      await PushNotificationService.requestPermissions();
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/push/register',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('ExponentPushToken[test-token]'),
        })
      );
    });
  });

  describe('notification handling', () => {
    beforeEach(async () => {
      await PushNotificationService.initialize();
    });

    it('should handle incoming notifications', async () => {
      const mockNotification = {
        request: {
          identifier: 'test-notification-id',
          content: {
            title: 'Test Title',
            body: 'Test Body',
            data: { key: 'value' },
            categoryIdentifier: 'test_category',
          },
          trigger: null,
        },
      };

      await PushNotificationService.handleNotificationReceived(mockNotification);
      
      expect(PushNotificationService.notificationHistory.length).toBe(1);
      expect(PushNotificationService.notificationHistory[0]).toEqual(
        expect.objectContaining({
          id: 'test-notification-id',
          title: 'Test Title',
          body: 'Test Body',
          type: 'received',
        })
      );
    });

    it('should handle notification responses', async () => {
      const mockResponse = {
        notification: {
          request: {
            identifier: 'test-notification-id',
            content: {
              title: 'Test Title',
              body: 'Test Body',
              data: { key: 'value' },
              categoryIdentifier: 'test_category',
            },
          },
        },
        actionIdentifier: 'view_venue',
        userText: null,
      };

      await PushNotificationService.handleNotificationResponse(mockResponse);
      
      expect(PushNotificationService.notificationHistory.length).toBe(1);
      expect(PushNotificationService.notificationHistory[0]).toEqual(
        expect.objectContaining({
          id: 'test-notification-id',
          actionIdentifier: 'view_venue',
          type: 'responded',
        })
      );
    });

    it('should add notification listeners', () => {
      const listener = jest.fn();
      const removeListener = PushNotificationService.addNotificationListener(listener);
      
      expect(PushNotificationService.notificationListeners.has(listener)).toBe(true);
      
      removeListener();
      expect(PushNotificationService.notificationListeners.has(listener)).toBe(false);
    });

    it('should add response listeners', () => {
      const listener = jest.fn();
      const removeListener = PushNotificationService.addResponseListener(listener);
      
      expect(PushNotificationService.responseListeners.has(listener)).toBe(true);
      
      removeListener();
      expect(PushNotificationService.responseListeners.has(listener)).toBe(false);
    });
  });

  describe('local notifications', () => {
    beforeEach(async () => {
      await PushNotificationService.initialize();
    });

    it('should send local notifications', async () => {
      mockNotifications.scheduleNotificationAsync.mockResolvedValue('notification-id-123');
      
      const notification = {
        title: 'Test Notification',
        body: 'Test Body',
        data: { key: 'value' },
      };

      const notificationId = await PushNotificationService.sendLocalNotification(notification);
      
      expect(notificationId).toBe('notification-id-123');
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: expect.objectContaining({
          title: 'Test Notification',
          body: 'Test Body',
          data: { key: 'value' },
        }),
        trigger: null,
      });
    });

    it('should schedule notifications', async () => {
      mockNotifications.scheduleNotificationAsync.mockResolvedValue('scheduled-id-123');
      
      const notification = {
        title: 'Scheduled Notification',
        body: 'This is scheduled',
      };
      
      const trigger = {
        seconds: 60,
      };

      const scheduledId = await PushNotificationService.scheduleNotification(notification, trigger);
      
      expect(scheduledId).toBe('scheduled-id-123');
      expect(PushNotificationService.scheduledNotifications.has('scheduled-id-123')).toBe(true);
    });

    it('should cancel scheduled notifications', async () => {
      const notificationId = 'test-scheduled-id';
      PushNotificationService.scheduledNotifications.set(notificationId, {});
      
      await PushNotificationService.cancelScheduledNotification(notificationId);
      
      expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(notificationId);
      expect(PushNotificationService.scheduledNotifications.has(notificationId)).toBe(false);
    });

    it('should cancel all scheduled notifications', async () => {
      PushNotificationService.scheduledNotifications.set('id1', {});
      PushNotificationService.scheduledNotifications.set('id2', {});
      
      await PushNotificationService.cancelAllScheduledNotifications();
      
      expect(mockNotifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
      expect(PushNotificationService.scheduledNotifications.size).toBe(0);
    });

    it('should get scheduled notifications', async () => {
      const mockScheduled = [
        {
          identifier: 'id1',
          content: { title: 'Title 1' },
          trigger: { seconds: 60 },
        },
        {
          identifier: 'id2',
          content: { title: 'Title 2' },
          trigger: { seconds: 120 },
        },
      ];
      
      mockNotifications.getAllScheduledNotificationsAsync.mockResolvedValue(mockScheduled);
      
      const scheduled = await PushNotificationService.getScheduledNotifications();
      
      expect(scheduled).toHaveLength(2);
      expect(scheduled[0]).toEqual({
        id: 'id1',
        content: { title: 'Title 1' },
        trigger: { seconds: 60 },
      });
    });
  });

  describe('badge management', () => {
    beforeEach(async () => {
      await PushNotificationService.initialize();
    });

    it('should set badge count', async () => {
      await PushNotificationService.setBadgeCount(5);
      
      expect(mockNotifications.setBadgeCountAsync).toHaveBeenCalledWith(5);
      expect(PushNotificationService.badgeCount).toBe(5);
    });

    it('should clear badge count', async () => {
      PushNotificationService.badgeCount = 10;
      
      await PushNotificationService.clearBadgeCount();
      
      expect(mockNotifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
      expect(PushNotificationService.badgeCount).toBe(0);
    });
  });

  describe('topic subscription', () => {
    beforeEach(async () => {
      await PushNotificationService.initialize();
      PushNotificationService.expoPushToken = 'test-token';
    });

    it('should subscribe to topics', async () => {
      const result = await PushNotificationService.subscribeToTopic('venue_recommendations');
      
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/push/subscribe',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('venue_recommendations'),
        })
      );
      expect(PushNotificationService.subscriptions.has('venue_recommendations')).toBe(true);
    });

    it('should unsubscribe from topics', async () => {
      PushNotificationService.subscriptions.set('test_topic', {});
      
      const result = await PushNotificationService.unsubscribeFromTopic('test_topic');
      
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/push/unsubscribe',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test_topic'),
        })
      );
      expect(PushNotificationService.subscriptions.has('test_topic')).toBe(false);
    });

    it('should handle subscription failures', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });
      
      const result = await PushNotificationService.subscribeToTopic('test_topic');
      
      expect(result).toBe(false);
      expect(mockLoggingService.error).toHaveBeenCalled();
    });
  });

  describe('notification history', () => {
    beforeEach(async () => {
      await PushNotificationService.initialize();
    });

    it('should maintain notification history', () => {
      const notification = {
        id: 'test-id',
        title: 'Test',
        body: 'Test body',
      };
      
      PushNotificationService.addToHistory(notification, 'received');
      
      expect(PushNotificationService.notificationHistory).toHaveLength(1);
      expect(PushNotificationService.notificationHistory[0]).toEqual(
        expect.objectContaining({
          id: 'test-id',
          type: 'received',
        })
      );
    });

    it('should limit history size', () => {
      const originalMaxSize = PushNotificationService.maxHistorySize;
      PushNotificationService.maxHistorySize = 2;
      
      PushNotificationService.addToHistory({ id: '1' }, 'received');
      PushNotificationService.addToHistory({ id: '2' }, 'received');
      PushNotificationService.addToHistory({ id: '3' }, 'received');
      
      expect(PushNotificationService.notificationHistory).toHaveLength(2);
      expect(PushNotificationService.notificationHistory[0].id).toBe('3');
      expect(PushNotificationService.notificationHistory[1].id).toBe('2');
      
      PushNotificationService.maxHistorySize = originalMaxSize;
    });

    it('should get notification history', () => {
      PushNotificationService.notificationHistory = [
        { id: '1', timestamp: '2023-01-01' },
        { id: '2', timestamp: '2023-01-02' },
        { id: '3', timestamp: '2023-01-03' },
      ];
      
      const history = PushNotificationService.getNotificationHistory(2);
      
      expect(history).toHaveLength(2);
      expect(history[0].id).toBe('1');
      expect(history[1].id).toBe('2');
    });

    it('should clear notification history', async () => {
      PushNotificationService.notificationHistory = [
        { id: '1' },
        { id: '2' },
      ];
      
      await PushNotificationService.clearNotificationHistory();
      
      expect(PushNotificationService.notificationHistory).toHaveLength(0);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('notification_history');
    });

    it('should save notification history', async () => {
      PushNotificationService.notificationHistory = [{ id: '1' }];
      
      await PushNotificationService.saveNotificationHistory();
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'notification_history',
        expect.stringContaining('{"id":"1"')
      );
    });

    it('should load notification history', async () => {
      const historyData = [{ id: '1', title: 'Test' }];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(historyData));
      
      await PushNotificationService.loadNotificationHistory();
      
      expect(PushNotificationService.notificationHistory).toEqual(historyData);
    });
  });

  describe('user context', () => {
    beforeEach(async () => {
      await PushNotificationService.initialize();
    });

    it('should set user context', () => {
      const registerTokenSpy = jest.spyOn(PushNotificationService, 'registerTokenWithServer')
        .mockResolvedValue({});
      PushNotificationService.expoPushToken = 'test-token';
      
      PushNotificationService.setUser('user123', { name: 'John Doe' });
      
      expect(PushNotificationService.userId).toBe('user123');
      expect(registerTokenSpy).toHaveBeenCalledWith('test-token');
    });
  });

  describe('statistics and export', () => {
    beforeEach(async () => {
      await PushNotificationService.initialize();
    });

    it('should provide notification statistics', () => {
      PushNotificationService.permissionStatus = 'granted';
      PushNotificationService.expoPushToken = 'test-token';
      PushNotificationService.subscriptions.set('topic1', {});
      PushNotificationService.notificationHistory = [{ id: '1' }];
      
      const stats = PushNotificationService.getNotificationStatistics();
      
      expect(stats).toEqual({
        initialized: true,
        permissionStatus: 'granted',
        permissionAsked: false,
        hasToken: true,
        deviceId: expect.any(String),
        userId: null,
        subscriptions: 1,
        historyCount: 1,
        scheduledCount: 0,
        badgeCount: 0,
        listeners: {
          notification: 0,
          response: 0,
        },
      });
    });

    it('should export notification data', async () => {
      PushNotificationService.notificationHistory = [{ id: '1' }];
      PushNotificationService.subscriptions.set('topic1', { topic: 'topic1' });
      
      mockNotifications.getAllScheduledNotificationsAsync.mockResolvedValue([]);
      
      const exported = await PushNotificationService.exportNotificationData();
      
      expect(exported).toEqual({
        statistics: expect.any(Object),
        history: [{ id: '1' }],
        scheduled: [],
        subscriptions: [{ topic: 'topic1' }],
        exportedAt: expect.any(String),
      });
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await PushNotificationService.initialize();
    });

    it('should cleanup resources properly', () => {
      const mockListener = { remove: jest.fn() };
      PushNotificationService.notificationListener = mockListener;
      PushNotificationService.responseListener = mockListener;
      
      PushNotificationService.cleanup();
      
      expect(mockListener.remove).toHaveBeenCalledTimes(2);
      expect(PushNotificationService.notificationListeners.size).toBe(0);
      expect(PushNotificationService.responseListeners.size).toBe(0);
      expect(PushNotificationService.initialized).toBe(false);
    });
  });
});