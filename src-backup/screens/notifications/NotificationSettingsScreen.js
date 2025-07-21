import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
  Animated,
  Platform,
} from 'react-native';
import { Colors } from '../../design-system/colors-soft-pink';
import { useAuth } from '../../contexts/AuthContext';
import * as Notifications from 'expo-notifications';

/**
 * 通知設定画面
 */
const NotificationSettingsScreen = ({ navigation }) => {
  const { user, updateSettings } = useAuth();
  
  const [notificationSettings, setNotificationSettings] = useState({
    // プッシュ通知
    pushEnabled: true,
    
    // 通知カテゴリ
    storeUpdates: true,
    favoriteEvents: true,
    newStores: false,
    promotions: false,
    systemAlerts: true,
    securityAlerts: true,
    
    // メール通知
    emailEnabled: true,
    weeklyDigest: true,
    monthlyReport: false,
    marketingEmails: false,
    
    // 通知タイミング
    quietHours: {
      enabled: true,
      startTime: '22:00',
      endTime: '08:00',
    },
    
    // 通知スタイル
    showPreviews: true,
    soundEnabled: true,
    vibrationEnabled: true,
    badgeEnabled: true,
  });
  
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // 初期化アニメーション
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // 通知権限の確認
  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = useCallback(async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Check notification permission error:', error);
    }
  }, []);

  // 通知権限の要求
  const requestNotificationPermission = useCallback(async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      
      if (status === 'granted') {
        Alert.alert('許可されました', '通知が有効になりました');
      } else {
        Alert.alert('権限が必要です', '設定から通知を許可してください');
      }
    } catch (error) {
      console.error('Request notification permission error:', error);
      Alert.alert('エラー', '通知権限の要求に失敗しました');
    }
  }, []);

  // 設定の更新
  const updateSetting = useCallback(async (key, value) => {
    try {
      if (key === 'pushEnabled' && value && permissionStatus !== 'granted') {
        await requestNotificationPermission();
        return;
      }
      
      setNotificationSettings(prev => ({ ...prev, [key]: value }));
      
      // 設定をサーバーに保存
      await updateSettings({ [`notification_${key}`]: value });
      
    } catch (error) {
      console.error('Notification setting update error:', error);
      Alert.alert('エラー', '設定の更新に失敗しました');
      // 元に戻す
      setNotificationSettings(prev => ({ ...prev, [key]: !value }));
    }
  }, [permissionStatus, requestNotificationPermission, updateSettings]);

  // 静寂時間の設定
  const configureQuietHours = useCallback(() => {
    Alert.alert('準備中', '静寂時間の設定は現在準備中です');
  }, []);

  // 通知テスト
  const testNotification = useCallback(async () => {
    try {
      if (permissionStatus !== 'granted') {
        Alert.alert('権限が必要です', '通知権限を許可してください');
        return;
      }
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'テスト通知',
          body: '通知設定のテストです',
          data: { type: 'test' },
        },
        trigger: null,
      });
      
      Alert.alert('送信完了', 'テスト通知を送信しました');
    } catch (error) {
      console.error('Test notification error:', error);
      Alert.alert('エラー', 'テスト通知の送信に失敗しました');
    }
  }, [permissionStatus]);

  // 戻るボタン
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 設定項目のレンダリング
  const renderSettingItem = useCallback((title, value, onToggle, description = null) => (
    <View style={styles.settingItem}>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.lightGray, true: Colors.primary }}
        thumbColor={value ? Colors.white : Colors.white}
      />
    </View>
  ), []);

  // メニュー項目のレンダリング
  const renderMenuItem = useCallback((title, onPress, icon = null, rightText = null) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemContent}>
        {icon && <Text style={styles.menuIcon}>{icon}</Text>}
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
      <View style={styles.menuRight}>
        {rightText && (
          <Text style={styles.menuRightText}>{rightText}</Text>
        )}
        <Text style={styles.menuArrow}>›</Text>
      </View>
    </TouchableOpacity>
  ), []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>通知設定</Text>
          <TouchableOpacity
            style={styles.testButton}
            onPress={testNotification}
          >
            <Text style={styles.testButtonText}>テスト</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 通知権限状態 */}
          {permissionStatus !== 'granted' && (
            <View style={styles.permissionWarning}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>通知権限が必要です</Text>
                <Text style={styles.warningDescription}>
                  プッシュ通知を受け取るには権限の許可が必要です
                </Text>
              </View>
              <TouchableOpacity
                style={styles.enableButton}
                onPress={requestNotificationPermission}
              >
                <Text style={styles.enableButtonText}>許可</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* プッシュ通知設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>プッシュ通知</Text>
            
            {renderSettingItem(
              'プッシュ通知',
              notificationSettings.pushEnabled && permissionStatus === 'granted',
              (value) => updateSetting('pushEnabled', value),
              'アプリからの通知を受信'
            )}
            
            {renderSettingItem(
              'プレビュー表示',
              notificationSettings.showPreviews,
              (value) => updateSetting('showPreviews', value),
              'ロック画面で通知内容を表示'
            )}
            
            {renderSettingItem(
              'サウンド',
              notificationSettings.soundEnabled,
              (value) => updateSetting('soundEnabled', value),
              '通知音を再生'
            )}
            
            {renderSettingItem(
              'バイブレーション',
              notificationSettings.vibrationEnabled,
              (value) => updateSetting('vibrationEnabled', value),
              '通知時に振動'
            )}
            
            {renderSettingItem(
              'バッジ',
              notificationSettings.badgeEnabled,
              (value) => updateSetting('badgeEnabled', value),
              'アプリアイコンに未読数を表示'
            )}
          </View>

          {/* 通知カテゴリ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>通知カテゴリ</Text>
            
            {renderSettingItem(
              '店舗更新',
              notificationSettings.storeUpdates,
              (value) => updateSetting('storeUpdates', value),
              'お気に入り店舗の営業時間変更など'
            )}
            
            {renderSettingItem(
              'お気に入りイベント',
              notificationSettings.favoriteEvents,
              (value) => updateSetting('favoriteEvents', value),
              'お気に入り店舗のイベント情報'
            )}
            
            {renderSettingItem(
              '新店舗',
              notificationSettings.newStores,
              (value) => updateSetting('newStores', value),
              '近くの新しい店舗情報'
            )}
            
            {renderSettingItem(
              'プロモーション',
              notificationSettings.promotions,
              (value) => updateSetting('promotions', value),
              'お得な情報やキャンペーン'
            )}
            
            {renderSettingItem(
              'システム通知',
              notificationSettings.systemAlerts,
              (value) => updateSetting('systemAlerts', value),
              'アプリの重要なお知らせ'
            )}
            
            {renderSettingItem(
              'セキュリティ通知',
              notificationSettings.securityAlerts,
              (value) => updateSetting('securityAlerts', value),
              'ログインや不審なアクティビティ'
            )}
          </View>

          {/* メール通知 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>メール通知</Text>
            
            {renderSettingItem(
              'メール通知',
              notificationSettings.emailEnabled,
              (value) => updateSetting('emailEnabled', value),
              'メールでの通知を受信'
            )}
            
            {renderSettingItem(
              '週次ダイジェスト',
              notificationSettings.weeklyDigest,
              (value) => updateSetting('weeklyDigest', value),
              '週間のアクティビティまとめ'
            )}
            
            {renderSettingItem(
              '月次レポート',
              notificationSettings.monthlyReport,
              (value) => updateSetting('monthlyReport', value),
              '月間の利用統計レポート'
            )}
            
            {renderSettingItem(
              'マーケティングメール',
              notificationSettings.marketingEmails,
              (value) => updateSetting('marketingEmails', value),
              'プロモーションメールの受信'
            )}
          </View>

          {/* 通知タイミング */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>通知タイミング</Text>
            
            {renderSettingItem(
              '静寂時間',
              notificationSettings.quietHours.enabled,
              (value) => updateSetting('quietHours', { ...notificationSettings.quietHours, enabled: value }),
              '指定した時間帯の通知を停止'
            )}
            
            {renderMenuItem(
              '静寂時間の設定',
              configureQuietHours,
              '🌙',
              `${notificationSettings.quietHours.startTime} - ${notificationSettings.quietHours.endTime}`
            )}
          </View>

          {/* 通知履歴 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>通知履歴</Text>
            
            {renderMenuItem(
              '通知履歴',
              () => navigation.navigate('NotificationHistory'),
              '📋'
            )}
            
            {renderMenuItem(
              '通知をクリア',
              () => Alert.alert('準備中', '通知クリア機能は現在準備中です'),
              '🗑️'
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  testButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primary,
    borderRadius: 16,
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFE69C',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  warningDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  enableButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
  },
  enableButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuRightText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  menuArrow: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
});

export default NotificationSettingsScreen;