/**
 * Notification Permission Screen
 * Handles notification permission requests and settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PushNotificationService from '../../services/PushNotificationService';
import LoggingService from '../../services/LoggingService';
import MonitoringManager from '../../services/MonitoringManager';

const NotificationPermissionScreen = ({ navigation }) => {
  const [permissionStatus, setPermissionStatus] = useState('undetermined');
  const [settings, setSettings] = useState({
    venueRecommendations: true,
    socialInteractions: true,
    promotional: false,
    systemUpdates: true,
    weeklyDigest: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    loadPermissionStatus();
    loadNotificationSettings();
    loadStatistics();
  }, []);

  /**
   * Load current permission status
   */
  const loadPermissionStatus = async () => {
    try {
      const stats = PushNotificationService.getNotificationStatistics();
      setPermissionStatus(stats.permissionStatus);
      
    } catch (error) {
      LoggingService.error('[NotificationPermissionScreen] Failed to load permission status', {
        error: error.message,
      });
    }
  };

  /**
   * Load notification settings
   */
  const loadNotificationSettings = async () => {
    try {
      // Load settings from storage or server
      // For now, using default settings
      
    } catch (error) {
      LoggingService.error('[NotificationPermissionScreen] Failed to load settings', {
        error: error.message,
      });
    }
  };

  /**
   * Load notification statistics
   */
  const loadStatistics = async () => {
    try {
      const stats = PushNotificationService.getNotificationStatistics();
      setStatistics(stats);
      
    } catch (error) {
      LoggingService.error('[NotificationPermissionScreen] Failed to load statistics', {
        error: error.message,
      });
    }
  };

  /**
   * Request notification permissions
   */
  const requestPermissions = async () => {
    try {
      setIsLoading(true);
      
      MonitoringManager.trackUserAction?.('request_notification_permission', 'notification_settings');
      
      const result = await PushNotificationService.requestPermissions();
      
      setPermissionStatus(result.status);
      
      if (result.status === 'granted') {
        Alert.alert(
          '通知が有効になりました',
          'お気に入りの店舗やイベント情報をお知らせします。',
          [{ text: 'OK' }]
        );
        
        // Subscribe to default topics
        await subscribeToDefaultTopics();
        
      } else if (result.status === 'denied') {
        Alert.alert(
          '通知の許可が必要です',
          '設定アプリから通知を有効にしてください。',
          [
            { text: 'キャンセル', style: 'cancel' },
            { text: '設定を開く', onPress: openAppSettings },
          ]
        );
      }
      
    } catch (error) {
      LoggingService.error('[NotificationPermissionScreen] Failed to request permissions', {
        error: error.message,
      });
      
      Alert.alert(
        'エラー',
        '通知の設定中にエラーが発生しました。',
        [{ text: 'OK' }]
      );
      
    } finally {
      setIsLoading(false);
      await loadStatistics();
    }
  };

  /**
   * Subscribe to default notification topics
   */
  const subscribeToDefaultTopics = async () => {
    const defaultTopics = [
      'venue_recommendations',
      'system_updates',
    ];

    for (const topic of defaultTopics) {
      try {
        await PushNotificationService.subscribeToTopic(topic);
      } catch (error) {
        LoggingService.warn('[NotificationPermissionScreen] Failed to subscribe to topic', {
          topic,
          error: error.message,
        });
      }
    }
  };

  /**
   * Open app settings
   */
  const openAppSettings = () => {
    // Implementation would open app settings
    MonitoringManager.trackUserAction?.('open_app_settings', 'notification_settings');
  };

  /**
   * Update notification setting
   */
  const updateSetting = async (key, value) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      
      MonitoringManager.trackUserAction?.('update_notification_setting', 'notification_settings', {
        setting: key,
        value,
      });
      
      // Update topic subscriptions based on settings
      await updateTopicSubscriptions(key, value);
      
    } catch (error) {
      LoggingService.error('[NotificationPermissionScreen] Failed to update setting', {
        setting: key,
        value,
        error: error.message,
      });
    }
  };

  /**
   * Update topic subscriptions
   */
  const updateTopicSubscriptions = async (settingKey, enabled) => {
    const topicMapping = {
      venueRecommendations: 'venue_recommendations',
      socialInteractions: 'social_interactions',
      promotional: 'promotional',
      systemUpdates: 'system_updates',
      weeklyDigest: 'weekly_digest',
    };

    const topic = topicMapping[settingKey];
    if (!topic) return;

    try {
      if (enabled) {
        await PushNotificationService.subscribeToTopic(topic);
      } else {
        await PushNotificationService.unsubscribeFromTopic(topic);
      }
      
    } catch (error) {
      LoggingService.error('[NotificationPermissionScreen] Failed to update topic subscription', {
        topic,
        enabled,
        error: error.message,
      });
    }
  };

  /**
   * Test notification
   */
  const sendTestNotification = async () => {
    try {
      MonitoringManager.trackUserAction?.('send_test_notification', 'notification_settings');
      
      await PushNotificationService.sendLocalNotification({
        title: 'テスト通知',
        body: '通知設定が正常に動作しています。',
        categoryIdentifier: 'test',
        data: { type: 'test' },
      });
      
      Alert.alert(
        'テスト通知を送信しました',
        'しばらくしてから通知が表示されます。',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      LoggingService.error('[NotificationPermissionScreen] Failed to send test notification', {
        error: error.message,
      });
      
      Alert.alert(
        'エラー',
        'テスト通知の送信に失敗しました。',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * View notification history
   */
  const viewNotificationHistory = () => {
    MonitoringManager.trackUserAction?.('view_notification_history', 'notification_settings');
    navigation.navigate('NotificationHistory');
  };

  /**
   * Render permission status
   */
  const renderPermissionStatus = () => {
    const statusConfig = {
      granted: {
        color: '#4CAF50',
        text: '許可済み',
        icon: '✓',
      },
      denied: {
        color: '#F44336',
        text: '拒否',
        icon: '✗',
      },
      undetermined: {
        color: '#FF9800',
        text: '未設定',
        icon: '?',
      },
    };

    const config = statusConfig[permissionStatus] || statusConfig.undetermined;

    return (
      <View style={[styles.statusContainer, { backgroundColor: config.color }]}>
        <Text style={styles.statusIcon}>{config.icon}</Text>
        <Text style={styles.statusText}>通知: {config.text}</Text>
      </View>
    );
  };

  /**
   * Render settings section
   */
  const renderSettingsSection = () => {
    const settingsConfig = [
      {
        key: 'venueRecommendations',
        title: '店舗のおすすめ',
        description: 'あなたの好みに合った店舗をご提案します',
      },
      {
        key: 'socialInteractions',
        title: '友達からの通知',
        description: 'フォローやメッセージなどの通知',
      },
      {
        key: 'promotional',
        title: 'プロモーション',
        description: '特別オファーやイベント情報',
      },
      {
        key: 'systemUpdates',
        title: 'システム更新',
        description: 'アプリの重要なお知らせ',
      },
      {
        key: 'weeklyDigest',
        title: '週次レポート',
        description: '週間の活動サマリー',
      },
    ];

    return (
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>通知設定</Text>
        
        {settingsConfig.map((setting) => (
          <View key={setting.key} style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{setting.title}</Text>
              <Text style={styles.settingDescription}>{setting.description}</Text>
            </View>
            <Switch
              value={settings[setting.key]}
              onValueChange={(value) => updateSetting(setting.key, value)}
              disabled={permissionStatus !== 'granted'}
              trackColor={{ false: '#767577', true: '#D4AF37' }}
              thumbColor={settings[setting.key] ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>
        ))}
      </View>
    );
  };

  /**
   * Render statistics section
   */
  const renderStatistics = () => {
    if (!statistics) return null;

    return (
      <View style={styles.statisticsSection}>
        <Text style={styles.sectionTitle}>通知統計</Text>
        
        <View style={styles.statGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statistics.historyCount}</Text>
            <Text style={styles.statLabel}>受信した通知</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statistics.subscriptions}</Text>
            <Text style={styles.statLabel}>購読中のトピック</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statistics.scheduledCount}</Text>
            <Text style={styles.statLabel}>予定された通知</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statistics.badgeCount}</Text>
            <Text style={styles.statLabel}>未読バッジ</Text>
          </View>
        </View>
      </View>
    );
  };

  /**
   * Render action buttons
   */
  const renderActionButtons = () => {
    return (
      <View style={styles.actionSection}>
        {permissionStatus !== 'granted' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={requestPermissions}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? '設定中...' : '通知を有効にする'}
            </Text>
          </TouchableOpacity>
        )}
        
        {permissionStatus === 'granted' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={sendTestNotification}
            >
              <Text style={styles.secondaryButtonText}>テスト通知を送信</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={viewNotificationHistory}
            >
              <Text style={styles.secondaryButtonText}>通知履歴を表示</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/images/notification-icon.png')}
            style={styles.headerIcon}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>通知設定</Text>
          <Text style={styles.headerSubtitle}>
            お気に入りの店舗や友達からの最新情報を受け取りましょう
          </Text>
        </View>

        {/* Permission Status */}
        {renderPermissionStatus()}

        {/* Settings */}
        {renderSettingsSection()}

        {/* Statistics */}
        {renderStatistics()}

        {/* Action Buttons */}
        {renderActionButtons()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  headerIcon: {
    width: 80,
    height: 80,
    marginBottom: 16,
    tintColor: '#D4AF37',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 22,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  statusIcon: {
    fontSize: 20,
    color: '#ffffff',
    marginRight: 8,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  settingsSection: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
  statisticsSection: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#cccccc',
    textAlign: 'center',
  },
  actionSection: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#D4AF37',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  secondaryButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default NotificationPermissionScreen;