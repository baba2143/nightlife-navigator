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
import { BiometricAuth } from '../../utils/authUtils';

/**
 * 設定画面
 */
const SettingsScreen = ({ navigation }) => {
  const { user, logout, updateSettings } = useAuth();
  
  const [settings, setSettings] = useState({
    biometricEnabled: false,
    notifications: true,
    locationServices: true,
    dataAnalytics: false,
    marketingEmails: false,
    pushNotifications: true,
    emailNotifications: true,
    theme: 'light',
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

  // 設定の読み込み
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 生体認証の設定状態を確認
      const biometricEnabled = await BiometricAuth.isBiometricEnabled();
      
      // 他の設定を読み込み（実際の実装では AsyncStorage などから）
      setSettings(prev => ({
        ...prev,
        biometricEnabled,
      }));
    } catch (error) {
      console.error('Settings load error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 設定の更新
  const updateSetting = useCallback(async (key, value) => {
    try {
      setSettings(prev => ({ ...prev, [key]: value }));
      
      // 生体認証の設定変更
      if (key === 'biometricEnabled') {
        if (value) {
          const biometricResult = await BiometricAuth.isAvailable();
          if (!biometricResult.isAvailable) {
            Alert.alert('エラー', '生体認証が利用できません');
            setSettings(prev => ({ ...prev, [key]: false }));
            return;
          }
        }
        
        await BiometricAuth.setBiometricEnabled(value);
        await updateSettings({ biometricEnabled: value });
      }
      
      // その他の設定更新処理
      // 実際の実装では AsyncStorage やサーバーAPI に保存
      
    } catch (error) {
      console.error('Settings update error:', error);
      Alert.alert('エラー', '設定の更新に失敗しました');
      // 元に戻す
      setSettings(prev => ({ ...prev, [key]: !value }));
    }
  }, [updateSettings]);

  // 戻るボタン
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // アカウント削除
  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'アカウント削除',
      'アカウントを削除すると、すべてのデータが失われます。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '最終確認',
              '本当にアカウントを削除しますか？',
              [
                { text: 'キャンセル', style: 'cancel' },
                { text: '削除', style: 'destructive', onPress: confirmDeleteAccount },
              ]
            );
          }
        },
      ]
    );
  }, []);

  const confirmDeleteAccount = useCallback(async () => {
    try {
      // アカウント削除API呼び出し
      // await deleteAccount();
      
      Alert.alert('完了', 'アカウントが削除されました', [
        { text: 'OK', onPress: logout }
      ]);
    } catch (error) {
      console.error('Account deletion error:', error);
      Alert.alert('エラー', 'アカウントの削除に失敗しました');
    }
  }, [logout]);

  // プライバシーポリシー
  const handlePrivacyPolicy = useCallback(() => {
    // 実際の実装では WebView で表示
    Alert.alert('プライバシーポリシー', '実際の実装では WebView で表示されます');
  }, []);

  // 利用規約
  const handleTermsOfService = useCallback(() => {
    // 実際の実装では WebView で表示
    Alert.alert('利用規約', '実際の実装では WebView で表示されます');
  }, []);

  // お問い合わせ
  const handleContact = useCallback(() => {
    Alert.alert('お問い合わせ', '実際の実装では問い合わせフォームが表示されます');
  }, []);

  // パスワード変更
  const handleChangePassword = useCallback(() => {
    navigation.navigate('ChangePassword');
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
  const renderMenuItem = useCallback((title, onPress, icon = null, textStyle = null) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemContent}>
        {icon && <Text style={styles.menuIcon}>{icon}</Text>}
        <Text style={[styles.menuTitle, textStyle]}>{title}</Text>
      </View>
      <Text style={styles.menuArrow}>›</Text>
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
          <Text style={styles.title}>設定</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* アカウント情報 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>アカウント</Text>
            
            {renderMenuItem('プロフィール編集', () => navigation.navigate('ProfileEdit'), '👤')}
            {renderMenuItem('パスワード変更', handleChangePassword, '🔒')}
            {renderMenuItem('メールアドレス変更', () => Alert.alert('準備中', 'メールアドレス変更は現在準備中です'), '📧')}
          </View>

          {/* セキュリティ設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>セキュリティ</Text>
            
            {renderSettingItem(
              '生体認証',
              settings.biometricEnabled,
              (value) => updateSetting('biometricEnabled', value),
              'ログイン時に生体認証を使用'
            )}
          </View>

          {/* 通知設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>通知</Text>
            
            {renderSettingItem(
              'プッシュ通知',
              settings.pushNotifications,
              (value) => updateSetting('pushNotifications', value),
              'アプリからの通知を受信'
            )}
            
            {renderSettingItem(
              'メール通知',
              settings.emailNotifications,
              (value) => updateSetting('emailNotifications', value),
              'メールでの通知を受信'
            )}
            
            {renderSettingItem(
              'マーケティングメール',
              settings.marketingEmails,
              (value) => updateSetting('marketingEmails', value),
              'プロモーションメールの受信'
            )}
          </View>

          {/* プライバシー設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>プライバシー</Text>
            
            {renderSettingItem(
              '位置情報サービス',
              settings.locationServices,
              (value) => updateSetting('locationServices', value),
              '近くの店舗を表示するために使用'
            )}
            
            {renderSettingItem(
              'データ分析',
              settings.dataAnalytics,
              (value) => updateSetting('dataAnalytics', value),
              'アプリの改善のための匿名データ収集'
            )}
          </View>

          {/* サポート・情報 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>サポート・情報</Text>
            
            {renderMenuItem('お問い合わせ', handleContact, '📞')}
            {renderMenuItem('プライバシーポリシー', handlePrivacyPolicy, '📋')}
            {renderMenuItem('利用規約', handleTermsOfService, '📄')}
            {renderMenuItem('バージョン情報', () => Alert.alert('バージョン', 'v1.0.0'), 'ℹ️')}
          </View>

          {/* アカウント管理 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>アカウント管理</Text>
            
            {renderMenuItem(
              'アカウント削除',
              handleDeleteAccount,
              '🗑️',
              styles.dangerText
            )}
          </View>

          {/* ログアウト */}
          <View style={styles.logoutContainer}>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutButtonText}>ログアウト</Text>
            </TouchableOpacity>
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
  menuArrow: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  dangerText: {
    color: Colors.error,
  },
  logoutContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  logoutButton: {
    height: 52,
    backgroundColor: Colors.error,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default SettingsScreen;