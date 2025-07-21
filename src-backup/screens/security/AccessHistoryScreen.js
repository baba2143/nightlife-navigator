import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../design-system/colors-soft-pink';
import { useAuth } from '../../contexts/AuthContext';

/**
 * アクセス履歴画面
 */
const AccessHistoryScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  const [accessHistory, setAccessHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // 初期化アニメーション
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // アクセス履歴の読み込み
  useEffect(() => {
    loadAccessHistory();
  }, []);

  const loadAccessHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // モック実装 - 実際のAPIエンドポイントに置き換える
      const response = await mockAccessHistoryAPI();
      
      if (response.success) {
        setAccessHistory(response.data);
      } else {
        Alert.alert('エラー', 'アクセス履歴の読み込みに失敗しました');
      }
    } catch (error) {
      console.error('Access history load error:', error);
      Alert.alert('エラー', 'アクセス履歴の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 引っ張って更新
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadAccessHistory();
    setIsRefreshing(false);
  }, [loadAccessHistory]);

  // 戻るボタン
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // アクセス履歴の詳細表示
  const showAccessDetails = useCallback((access) => {
    Alert.alert(
      'アクセス詳細',
      `デバイス: ${access.device}\n場所: ${access.location}\nIPアドレス: ${access.ipAddress}\n日時: ${new Date(access.timestamp).toLocaleString('ja-JP')}`,
      [{ text: 'OK' }]
    );
  }, []);

  // 怪しいアクセスの報告
  const reportSuspiciousAccess = useCallback((access) => {
    Alert.alert(
      '怪しいアクセスの報告',
      `このアクセスを怪しいアクセスとして報告しますか？\n\n${access.device}\n${new Date(access.timestamp).toLocaleString('ja-JP')}`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '報告',
          style: 'destructive',
          onPress: () => {
            // 怪しいアクセスの報告処理
            Alert.alert('完了', '怪しいアクセスとして報告しました。セキュリティチームが確認します。');
          }
        },
      ]
    );
  }, []);

  // アクセス状態のアイコン
  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      case 'blocked':
        return '🚫';
      case 'suspicious':
        return '⚠️';
      default:
        return '🔍';
    }
  }, []);

  // アクセス状態のテキスト
  const getStatusText = useCallback((status) => {
    switch (status) {
      case 'success':
        return 'ログイン成功';
      case 'failed':
        return 'ログイン失敗';
      case 'blocked':
        return 'ブロック済み';
      case 'suspicious':
        return '要注意';
      default:
        return '不明';
    }
  }, []);

  // 時間のフォーマット
  const formatTime = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) {
      return `${minutes}分前`;
    } else if (hours < 24) {
      return `${hours}時間前`;
    } else if (days < 7) {
      return `${days}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }, []);

  // アクセス履歴アイテムのレンダリング
  const renderAccessItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={[
        styles.accessCard,
        item.status === 'suspicious' && styles.suspiciousCard,
        item.status === 'failed' && styles.failedCard
      ]}
      onPress={() => showAccessDetails(item)}
    >
      <View style={styles.accessHeader}>
        <View style={styles.statusContainer}>
          <Text style={styles.statusIcon}>
            {getStatusIcon(item.status)}
          </Text>
          <Text style={[
            styles.statusText,
            item.status === 'suspicious' && styles.suspiciousText,
            item.status === 'failed' && styles.failedText
          ]}>
            {getStatusText(item.status)}
          </Text>
        </View>
        <Text style={styles.timeText}>{formatTime(item.timestamp)}</Text>
      </View>
      
      <View style={styles.accessContent}>
        <Text style={styles.deviceText}>{item.device}</Text>
        <Text style={styles.locationText}>{item.location}</Text>
        <Text style={styles.ipText}>IP: {item.ipAddress}</Text>
      </View>
      
      {item.status === 'suspicious' && (
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => reportSuspiciousAccess(item)}
        >
          <Text style={styles.reportButtonText}>報告</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  ), [showAccessDetails, reportSuspiciousAccess, getStatusIcon, getStatusText, formatTime]);

  // 空の状態のレンダリング
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📊</Text>
      <Text style={styles.emptyTitle}>アクセス履歴がありません</Text>
      <Text style={styles.emptyDescription}>
        ログイン履歴はここに表示されます
      </Text>
    </View>
  ), []);

  // キーエクストラクター
  const keyExtractor = useCallback((item) => item.id.toString(), []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>アクセス履歴</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 統計情報 */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{accessHistory.length}</Text>
            <Text style={styles.statLabel}>総アクセス数</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {accessHistory.filter(item => item.status === 'success').length}
            </Text>
            <Text style={styles.statLabel}>成功</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {accessHistory.filter(item => item.status === 'failed').length}
            </Text>
            <Text style={styles.statLabel}>失敗</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {accessHistory.filter(item => item.status === 'suspicious').length}
            </Text>
            <Text style={styles.statLabel}>要注意</Text>
          </View>
        </View>

        {/* アクセス履歴リスト */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        ) : (
          <FlatList
            data={accessHistory}
            renderItem={renderAccessItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

// モックAPI関数
const mockAccessHistoryAPI = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    data: [
      {
        id: '1',
        device: 'iPhone 13 Pro',
        location: '東京都渋谷区',
        ipAddress: '192.168.1.100',
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30分前
        status: 'success',
      },
      {
        id: '2',
        device: 'MacBook Pro',
        location: '東京都新宿区',
        ipAddress: '192.168.1.101',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1時間前
        status: 'success',
      },
      {
        id: '3',
        device: 'Unknown Device',
        location: '大阪府大阪市',
        ipAddress: '203.0.113.123',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2時間前
        status: 'suspicious',
      },
      {
        id: '4',
        device: 'Android Phone',
        location: '神奈川県横浜市',
        ipAddress: '192.168.1.102',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1日前
        status: 'failed',
      },
      {
        id: '5',
        device: 'iPad Air',
        location: '東京都品川区',
        ipAddress: '192.168.1.103',
        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2日前
        status: 'success',
      },
    ],
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
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
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  accessCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  suspiciousCard: {
    borderColor: Colors.warning,
    backgroundColor: '#FFF9E6',
  },
  failedCard: {
    borderColor: Colors.error,
    backgroundColor: '#FFF0F0',
  },
  accessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  suspiciousText: {
    color: Colors.warning,
  },
  failedText: {
    color: Colors.error,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  accessContent: {
    marginBottom: 8,
  },
  deviceText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  ipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  reportButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.error,
    borderRadius: 16,
  },
  reportButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default AccessHistoryScreen;