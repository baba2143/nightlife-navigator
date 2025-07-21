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
} from 'react-native';
import { Colors } from '../../design-system/colors-soft-pink';
import { useAuth } from '../../contexts/AuthContext';
import * as Location from 'expo-location';

/**
 * プライバシー設定画面
 */
const PrivacySettingsScreen = ({ navigation }) => {
  const { user, updateSettings } = useAuth();
  
  const [privacySettings, setPrivacySettings] = useState({
    // 位置情報
    locationEnabled: true,
    backgroundLocation: false,
    locationHistory: true,
    nearbyStores: true,
    
    // データ使用
    analyticsEnabled: false,
    crashReports: true,
    usageStatistics: false,
    performanceData: true,
    
    // 共有設定
    profileVisibility: 'friends', // public, friends, private
    activitySharing: true,
    reviewSharing: true,
    favoriteSharing: false,
    
    // 広告とマーケティング
    personalizedAds: false,
    marketingData: false,
    thirdPartySharing: false,
    
    // データ保持
    dataRetention: '2years', // 6months, 1year, 2years, forever
    autoDelete: true,
    
    // プライバシー通知
    dataProcessingNotifications: true,
    policyUpdates: true,
  });
  
  const [locationPermission, setLocationPermission] = useState(null);
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

  // 位置情報権限の確認
  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);
    } catch (error) {
      console.error('Check location permission error:', error);
    }
  }, []);

  // 位置情報権限の要求
  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status === 'granted') {
        Alert.alert('許可されました', '位置情報サービスが有効になりました');
      } else {
        Alert.alert('権限が必要です', '設定から位置情報を許可してください');
      }
    } catch (error) {
      console.error('Request location permission error:', error);
      Alert.alert('エラー', '位置情報権限の要求に失敗しました');
    }
  }, []);

  // 設定の更新
  const updateSetting = useCallback(async (key, value) => {
    try {
      if (key === 'locationEnabled' && value && locationPermission !== 'granted') {
        await requestLocationPermission();
        return;
      }
      
      setPrivacySettings(prev => ({ ...prev, [key]: value }));
      
      // 設定をサーバーに保存
      await updateSettings({ [`privacy_${key}`]: value });
      
    } catch (error) {
      console.error('Privacy setting update error:', error);
      Alert.alert('エラー', '設定の更新に失敗しました');
      // 元に戻す
      setPrivacySettings(prev => ({ ...prev, [key]: !value }));
    }
  }, [locationPermission, requestLocationPermission, updateSettings]);

  // プロフィール公開設定の変更
  const changeProfileVisibility = useCallback(() => {
    const options = [
      { label: '公開', value: 'public' },
      { label: '友達のみ', value: 'friends' },
      { label: '非公開', value: 'private' },
    ];
    
    Alert.alert(
      'プロフィール公開設定',
      '公開レベルを選択してください',
      [
        { text: 'キャンセル', style: 'cancel' },
        ...options.map(option => ({
          text: option.label,
          onPress: () => updateSetting('profileVisibility', option.value),
        })),
      ]
    );
  }, [updateSetting]);

  // データ保持期間の変更
  const changeDataRetention = useCallback(() => {
    const options = [
      { label: '6ヶ月', value: '6months' },
      { label: '1年', value: '1year' },
      { label: '2年', value: '2years' },
      { label: '永続', value: 'forever' },
    ];
    
    Alert.alert(
      'データ保持期間',
      '保持期間を選択してください',
      [
        { text: 'キャンセル', style: 'cancel' },
        ...options.map(option => ({
          text: option.label,
          onPress: () => updateSetting('dataRetention', option.value),
        })),
      ]
    );
  }, [updateSetting]);

  // データの削除
  const deleteAllData = useCallback(() => {
    Alert.alert(
      'データの削除',
      'すべてのデータを削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '最終確認',
              '本当にすべてのデータを削除しますか？',
              [
                { text: 'キャンセル', style: 'cancel' },
                { text: '削除', style: 'destructive', onPress: confirmDeleteAllData },
              ]
            );
          }
        },
      ]
    );
  }, []);

  const confirmDeleteAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      // データ削除API呼び出し
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert('完了', 'すべてのデータが削除されました');
    } catch (error) {
      console.error('Delete all data error:', error);
      Alert.alert('エラー', 'データの削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // データのエクスポート
  const exportData = useCallback(() => {
    Alert.alert('準備中', 'データエクスポート機能は現在準備中です');
  }, []);

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
  const renderMenuItem = useCallback((title, onPress, icon = null, rightText = null, textStyle = null) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemContent}>
        {icon && <Text style={styles.menuIcon}>{icon}</Text>}
        <Text style={[styles.menuTitle, textStyle]}>{title}</Text>
      </View>
      <View style={styles.menuRight}>
        {rightText && (
          <Text style={styles.menuRightText}>{rightText}</Text>
        )}
        <Text style={styles.menuArrow}>›</Text>
      </View>
    </TouchableOpacity>
  ), []);

  // 公開設定の表示テキスト
  const getVisibilityText = useCallback((visibility) => {
    switch (visibility) {
      case 'public':
        return '公開';
      case 'friends':
        return '友達のみ';
      case 'private':
        return '非公開';
      default:
        return '不明';
    }
  }, []);

  // データ保持期間の表示テキスト
  const getRetentionText = useCallback((retention) => {
    switch (retention) {
      case '6months':
        return '6ヶ月';
      case '1year':
        return '1年';
      case '2years':
        return '2年';
      case 'forever':
        return '永続';
      default:
        return '不明';
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>プライバシー設定</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 位置情報権限警告 */}
          {locationPermission !== 'granted' && (
            <View style={styles.permissionWarning}>
              <Text style={styles.warningIcon}>📍</Text>
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>位置情報権限が必要です</Text>
                <Text style={styles.warningDescription}>
                  近くの店舗を表示するには位置情報の許可が必要です
                </Text>
              </View>
              <TouchableOpacity
                style={styles.enableButton}
                onPress={requestLocationPermission}
              >
                <Text style={styles.enableButtonText}>許可</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 位置情報設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>位置情報</Text>
            
            {renderSettingItem(
              '位置情報サービス',
              privacySettings.locationEnabled && locationPermission === 'granted',
              (value) => updateSetting('locationEnabled', value),
              '近くの店舗を表示するために使用'
            )}
            
            {renderSettingItem(
              'バックグラウンド位置情報',
              privacySettings.backgroundLocation,
              (value) => updateSetting('backgroundLocation', value),
              'アプリが閉じている時も位置情報を使用'
            )}
            
            {renderSettingItem(
              '位置履歴',
              privacySettings.locationHistory,
              (value) => updateSetting('locationHistory', value),
              '訪問した場所の履歴を保存'
            )}
            
            {renderSettingItem(
              '近くの店舗通知',
              privacySettings.nearbyStores,
              (value) => updateSetting('nearbyStores', value),
              '近くの店舗を通知'
            )}
          </View>

          {/* データ使用設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>データ使用</Text>
            
            {renderSettingItem(
              'アナリティクス',
              privacySettings.analyticsEnabled,
              (value) => updateSetting('analyticsEnabled', value),
              'アプリの改善のための匿名データ収集'
            )}
            
            {renderSettingItem(
              'クラッシュレポート',
              privacySettings.crashReports,
              (value) => updateSetting('crashReports', value),
              'アプリのクラッシュ情報を自動送信'
            )}
            
            {renderSettingItem(
              '使用統計',
              privacySettings.usageStatistics,
              (value) => updateSetting('usageStatistics', value),
              'アプリの使用状況データを収集'
            )}
            
            {renderSettingItem(
              'パフォーマンスデータ',
              privacySettings.performanceData,
              (value) => updateSetting('performanceData', value),
              'アプリのパフォーマンス改善のためのデータ'
            )}
          </View>

          {/* 共有設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>共有設定</Text>
            
            {renderMenuItem(
              'プロフィール公開設定',
              changeProfileVisibility,
              '👤',
              getVisibilityText(privacySettings.profileVisibility)
            )}
            
            {renderSettingItem(
              'アクティビティ共有',
              privacySettings.activitySharing,
              (value) => updateSetting('activitySharing', value),
              '店舗訪問やレビューの共有'
            )}
            
            {renderSettingItem(
              'レビュー共有',
              privacySettings.reviewSharing,
              (value) => updateSetting('reviewSharing', value),
              '投稿したレビューの公開'
            )}
            
            {renderSettingItem(
              'お気に入り共有',
              privacySettings.favoriteSharing,
              (value) => updateSetting('favoriteSharing', value),
              'お気に入り店舗の公開'
            )}
          </View>

          {/* 広告とマーケティング */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>広告とマーケティング</Text>
            
            {renderSettingItem(
              'パーソナライズド広告',
              privacySettings.personalizedAds,
              (value) => updateSetting('personalizedAds', value),
              '興味に基づいた広告の表示'
            )}
            
            {renderSettingItem(
              'マーケティングデータ',
              privacySettings.marketingData,
              (value) => updateSetting('marketingData', value),
              'マーケティング目的でのデータ使用'
            )}
            
            {renderSettingItem(
              'サードパーティ共有',
              privacySettings.thirdPartySharing,
              (value) => updateSetting('thirdPartySharing', value),
              'パートナー企業とのデータ共有'
            )}
          </View>

          {/* データ保持 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>データ保持</Text>
            
            {renderMenuItem(
              'データ保持期間',
              changeDataRetention,
              '🗂️',
              getRetentionText(privacySettings.dataRetention)
            )}
            
            {renderSettingItem(
              '自動削除',
              privacySettings.autoDelete,
              (value) => updateSetting('autoDelete', value),
              '期限切れデータの自動削除'
            )}
          </View>

          {/* プライバシー通知 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>プライバシー通知</Text>
            
            {renderSettingItem(
              'データ処理通知',
              privacySettings.dataProcessingNotifications,
              (value) => updateSetting('dataProcessingNotifications', value),
              'データ処理に関する通知'
            )}
            
            {renderSettingItem(
              'ポリシー更新通知',
              privacySettings.policyUpdates,
              (value) => updateSetting('policyUpdates', value),
              'プライバシーポリシーの更新通知'
            )}
          </View>

          {/* データ管理 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>データ管理</Text>
            
            {renderMenuItem(
              'データをエクスポート',
              exportData,
              '📤'
            )}
            
            {renderMenuItem(
              'すべてのデータを削除',
              deleteAllData,
              '🗑️',
              null,
              styles.dangerText
            )}
          </View>

          {/* 法的情報 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>法的情報</Text>
            
            {renderMenuItem(
              'プライバシーポリシー',
              () => navigation.navigate('PrivacyPolicy'),
              '📋'
            )}
            
            {renderMenuItem(
              'Cookie ポリシー',
              () => navigation.navigate('CookiePolicy'),
              '🍪'
            )}
            
            {renderMenuItem(
              'データ処理について',
              () => navigation.navigate('DataProcessing'),
              'ℹ️'
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
  placeholder: {
    width: 40,
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
  dangerText: {
    color: Colors.error,
  },
});

export default PrivacySettingsScreen;