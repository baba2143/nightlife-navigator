import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Share,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../design-system/colors-soft-pink';
import { useAuth } from '../../contexts/AuthContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * アカウント管理画面
 */
const AccountManagementScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  
  const [accountStats, setAccountStats] = useState({
    memberSince: null,
    totalVisits: 0,
    totalReviews: 0,
    totalFavorites: 0,
    storageUsed: 0,
    lastBackup: null,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // 初期化アニメーション
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // アカウント統計の読み込み
  useEffect(() => {
    loadAccountStats();
  }, []);

  const loadAccountStats = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // モック実装 - 実際のAPIエンドポイントに置き換える
      const response = await mockAccountStatsAPI();
      
      if (response.success) {
        setAccountStats(response.data);
      }
    } catch (error) {
      console.error('Account stats load error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 戻るボタン
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // データのエクスポート
  const exportData = useCallback(async () => {
    try {
      setIsExporting(true);
      
      // データをエクスポート
      const exportData = await generateExportData();
      
      // ファイルとして保存
      const fileName = `account_data_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));
      
      // 共有
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('完了', 'データをエクスポートしました');
      }
      
    } catch (error) {
      console.error('Export data error:', error);
      Alert.alert('エラー', 'データのエクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  }, []);

  // エクスポートデータの生成
  const generateExportData = useCallback(async () => {
    // 実際の実装では各種データを収集
    return {
      exportInfo: {
        exportDate: new Date().toISOString(),
        userId: user.id,
        version: '1.0.0',
      },
      profile: {
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt,
      },
      statistics: accountStats,
      // 他のデータも含める
    };
  }, [user, accountStats]);

  // アカウントの一時停止
  const suspendAccount = useCallback(() => {
    Alert.alert(
      'アカウント一時停止',
      'アカウントを一時停止しますか？再開するまでログインできなくなります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '一時停止', 
          style: 'destructive',
          onPress: async () => {
            try {
              // アカウント一時停止API呼び出し
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              Alert.alert('完了', 'アカウントを一時停止しました', [
                { text: 'OK', onPress: logout }
              ]);
            } catch (error) {
              console.error('Suspend account error:', error);
              Alert.alert('エラー', 'アカウントの一時停止に失敗しました');
            }
          }
        },
      ]
    );
  }, [logout]);

  // アカウントの削除
  const deleteAccount = useCallback(() => {
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert('完了', 'アカウントが削除されました', [
        { text: 'OK', onPress: logout }
      ]);
    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert('エラー', 'アカウントの削除に失敗しました');
    }
  }, [logout]);

  // アカウントの復元
  const restoreAccount = useCallback(() => {
    Alert.alert('準備中', 'アカウント復元機能は現在準備中です');
  }, []);

  // データのバックアップ
  const backupData = useCallback(async () => {
    try {
      // バックアップAPI呼び出し
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAccountStats(prev => ({
        ...prev,
        lastBackup: new Date().toISOString(),
      }));
      
      Alert.alert('完了', 'データをバックアップしました');
    } catch (error) {
      console.error('Backup data error:', error);
      Alert.alert('エラー', 'データのバックアップに失敗しました');
    }
  }, []);

  // 統計項目のレンダリング
  const renderStatItem = useCallback((title, value, unit = '') => (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}{unit}</Text>
      <Text style={styles.statLabel}>{title}</Text>
    </View>
  ), []);

  // メニュー項目のレンダリング
  const renderMenuItem = useCallback((title, onPress, icon = null, textStyle = null, loading = false) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress}
      disabled={loading}
    >
      <View style={styles.menuItemContent}>
        {icon && <Text style={styles.menuIcon}>{icon}</Text>}
        <Text style={[styles.menuTitle, textStyle]}>{title}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <Text style={styles.menuArrow}>›</Text>
      )}
    </TouchableOpacity>
  ), []);

  // 日付のフォーマット
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '未設定';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // ストレージ使用量のフォーマット
  const formatStorage = useCallback((bytes) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }, []);

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
          <Text style={styles.title}>アカウント管理</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* アカウント情報 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>アカウント情報</Text>
            
            <View style={styles.accountInfo}>
              <View style={styles.accountHeader}>
                <Text style={styles.accountName}>{user.displayName}</Text>
                <Text style={styles.accountEmail}>{user.email}</Text>
                <Text style={styles.memberSince}>
                  {formatDate(accountStats.memberSince)}から利用
                </Text>
              </View>
            </View>
          </View>

          {/* 利用統計 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>利用統計</Text>
            
            <View style={styles.statsContainer}>
              {renderStatItem('総訪問数', accountStats.totalVisits, '回')}
              {renderStatItem('レビュー数', accountStats.totalReviews, '件')}
              {renderStatItem('お気に入り', accountStats.totalFavorites, '店舗')}
              {renderStatItem('データ使用量', formatStorage(accountStats.storageUsed))}
            </View>
          </View>

          {/* データ管理 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>データ管理</Text>
            
            {renderMenuItem(
              'データをエクスポート', 
              exportData, 
              '📤', 
              null, 
              isExporting
            )}
            
            {renderMenuItem('データをバックアップ', backupData, '💾')}
            
            {renderMenuItem('データを復元', restoreAccount, '🔄')}
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>最終バックアップ</Text>
              <Text style={styles.infoValue}>
                {formatDate(accountStats.lastBackup)}
              </Text>
            </View>
          </View>

          {/* アカウント設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>アカウント設定</Text>
            
            {renderMenuItem(
              'プロフィール編集', 
              () => navigation.navigate('ProfileEdit'), 
              '👤'
            )}
            
            {renderMenuItem(
              'セキュリティ設定', 
              () => navigation.navigate('SecuritySettings'), 
              '🔒'
            )}
            
            {renderMenuItem(
              'プライバシー設定', 
              () => navigation.navigate('PrivacySettings'), 
              '🛡️'
            )}
            
            {renderMenuItem(
              '通知設定', 
              () => navigation.navigate('NotificationSettings'), 
              '🔔'
            )}
          </View>

          {/* アカウント操作 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>アカウント操作</Text>
            
            {renderMenuItem(
              'アカウントを一時停止', 
              suspendAccount, 
              '⏸️', 
              styles.warningText
            )}
            
            {renderMenuItem(
              'アカウントを削除', 
              deleteAccount, 
              '🗑️', 
              styles.dangerText
            )}
          </View>

          {/* サポート */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>サポート</Text>
            
            {renderMenuItem(
              'ヘルプセンター', 
              () => navigation.navigate('HelpCenter'), 
              '❓'
            )}
            
            {renderMenuItem(
              'お問い合わせ', 
              () => navigation.navigate('Contact'), 
              '📞'
            )}
            
            {renderMenuItem(
              'フィードバック', 
              () => navigation.navigate('Feedback'), 
              '💬'
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

// モックAPI関数
const mockAccountStatsAPI = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    data: {
      memberSince: '2023-01-15T00:00:00Z',
      totalVisits: 47,
      totalReviews: 12,
      totalFavorites: 8,
      storageUsed: 2560000, // 2.56 MB
      lastBackup: '2024-01-10T15:30:00Z',
    },
  };
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
  accountInfo: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  accountHeader: {
    alignItems: 'center',
  },
  accountName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  memberSince: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
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
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  warningText: {
    color: Colors.warning,
  },
  dangerText: {
    color: Colors.error,
  },
});

export default AccountManagementScreen;