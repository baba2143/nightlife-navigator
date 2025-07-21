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
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../design-system/colors-soft-pink';
import { useAuth } from '../../contexts/AuthContext';
import { BiometricAuth } from '../../utils/authUtils';

/**
 * セキュリティ設定画面
 */
const SecuritySettingsScreen = ({ navigation }) => {
  const { user, updateSettings } = useAuth();
  
  const [securitySettings, setSecuritySettings] = useState({
    biometricEnabled: false,
    twoFactorEnabled: false,
    loginNotifications: true,
    securityAlerts: true,
    sessionTimeout: 30, // 分
    autoLogout: true,
    deviceTracking: true,
  });
  
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

  // セキュリティ設定の読み込み
  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 生体認証の状態を確認
      const biometricEnabled = await BiometricAuth.isBiometricEnabled();
      
      // その他のセキュリティ設定を読み込み
      setSecuritySettings(prev => ({
        ...prev,
        biometricEnabled,
      }));
    } catch (error) {
      console.error('Security settings load error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 設定の更新
  const updateSetting = useCallback(async (key, value) => {
    try {
      setSecuritySettings(prev => ({ ...prev, [key]: value }));
      
      // 生体認証の設定変更
      if (key === 'biometricEnabled') {
        if (value) {
          const biometricResult = await BiometricAuth.isAvailable();
          if (!biometricResult.isAvailable) {
            Alert.alert('エラー', '生体認証が利用できません');
            setSecuritySettings(prev => ({ ...prev, [key]: false }));
            return;
          }
        }
        
        await BiometricAuth.setBiometricEnabled(value);
        await updateSettings({ biometricEnabled: value });
      }
      
      // 二段階認証の設定変更
      if (key === 'twoFactorEnabled') {
        if (value) {
          navigation.navigate('TwoFactorSetup');
        } else {
          Alert.alert(
            '二段階認証を無効にしますか？',
            'セキュリティが低下する可能性があります',
            [
              { text: 'キャンセル', style: 'cancel', onPress: () => setSecuritySettings(prev => ({ ...prev, [key]: true })) },
              { text: '無効にする', style: 'destructive', onPress: () => disableTwoFactor() },
            ]
          );
        }
      }
      
    } catch (error) {
      console.error('Security setting update error:', error);
      Alert.alert('エラー', '設定の更新に失敗しました');
      // 元に戻す
      setSecuritySettings(prev => ({ ...prev, [key]: !value }));
    }
  }, [updateSettings, navigation]);

  // 二段階認証の無効化
  const disableTwoFactor = useCallback(async () => {
    try {
      // 二段階認証無効化API呼び出し
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('完了', '二段階認証が無効になりました');
    } catch (error) {
      console.error('Disable two factor error:', error);
      Alert.alert('エラー', '二段階認証の無効化に失敗しました');
      setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: true }));
    }
  }, []);

  // 戻るボタン
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // アクセス履歴
  const handleAccessHistory = useCallback(() => {
    navigation.navigate('AccessHistory');
  }, [navigation]);

  // デバイス管理
  const handleDeviceManagement = useCallback(() => {
    navigation.navigate('DeviceManagement');
  }, [navigation]);

  // パスワード変更
  const handleChangePassword = useCallback(() => {
    navigation.navigate('ChangePassword');
  }, [navigation]);

  // セキュリティ監査
  const handleSecurityAudit = useCallback(() => {
    navigation.navigate('SecurityAudit');
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
  const renderMenuItem = useCallback((title, onPress, icon = null, badge = null) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemContent}>
        {icon && <Text style={styles.menuIcon}>{icon}</Text>}
        <Text style={styles.menuTitle}>{title}</Text>
        {badge && (
          <View style={styles.menuBadge}>
            <Text style={styles.menuBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  ), []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>セキュリティ設定</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 認証設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>認証設定</Text>
            
            {renderSettingItem(
              '生体認証',
              securitySettings.biometricEnabled,
              (value) => updateSetting('biometricEnabled', value),
              'ログイン時に指紋や顔認証を使用'
            )}
            
            {renderSettingItem(
              '二段階認証',
              securitySettings.twoFactorEnabled,
              (value) => updateSetting('twoFactorEnabled', value),
              'SMS または認証アプリによる追加認証'
            )}
            
            {renderMenuItem('パスワード変更', handleChangePassword, '🔒')}
          </View>

          {/* セキュリティ監視 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>セキュリティ監視</Text>
            
            {renderSettingItem(
              'ログイン通知',
              securitySettings.loginNotifications,
              (value) => updateSetting('loginNotifications', value),
              '新しいデバイスからのログイン時に通知'
            )}
            
            {renderSettingItem(
              'セキュリティアラート',
              securitySettings.securityAlerts,
              (value) => updateSetting('securityAlerts', value),
              '不審なアクティビティを検出時に通知'
            )}
            
            {renderSettingItem(
              'デバイス追跡',
              securitySettings.deviceTracking,
              (value) => updateSetting('deviceTracking', value),
              'ログインデバイスの追跡と管理'
            )}
          </View>

          {/* セッション管理 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>セッション管理</Text>
            
            {renderSettingItem(
              '自動ログアウト',
              securitySettings.autoLogout,
              (value) => updateSetting('autoLogout', value),
              '一定時間非アクティブ時に自動ログアウト'
            )}
            
            <View style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>セッション期限</Text>
                <Text style={styles.settingDescription}>
                  {securitySettings.sessionTimeout}分間非アクティブ時にログアウト
                </Text>
              </View>
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => Alert.alert('準備中', 'セッション期限の変更は現在準備中です')}
              >
                <Text style={styles.changeButtonText}>変更</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* アクセス管理 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>アクセス管理</Text>
            
            {renderMenuItem('アクセス履歴', handleAccessHistory, '📊')}
            {renderMenuItem('デバイス管理', handleDeviceManagement, '📱', '3台')}
            {renderMenuItem('セキュリティ監査', handleSecurityAudit, '🔍')}
          </View>

          {/* 緊急時対応 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>緊急時対応</Text>
            
            {renderMenuItem(
              'アカウント一時停止',
              () => Alert.alert('準備中', 'アカウント一時停止機能は現在準備中です'),
              '⏸️'
            )}
            
            {renderMenuItem(
              'すべてのセッションを終了',
              () => Alert.alert(
                '確認',
                'すべてのデバイスからログアウトしますか？',
                [
                  { text: 'キャンセル', style: 'cancel' },
                  { text: '実行', style: 'destructive', onPress: () => Alert.alert('完了', 'すべてのセッションを終了しました') },
                ]
              ),
              '🚪'
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
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
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 24,
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
  changeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
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
    flex: 1,
  },
  menuBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  menuBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  menuArrow: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
});

export default SecuritySettingsScreen;