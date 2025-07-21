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
 * デバイス管理画面
 */
const DeviceManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  const [devices, setDevices] = useState([]);
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

  // デバイス一覧の読み込み
  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // モック実装 - 実際のAPIエンドポイントに置き換える
      const response = await mockDevicesAPI();
      
      if (response.success) {
        setDevices(response.data);
      } else {
        Alert.alert('エラー', 'デバイス一覧の読み込みに失敗しました');
      }
    } catch (error) {
      console.error('Devices load error:', error);
      Alert.alert('エラー', 'デバイス一覧の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 引っ張って更新
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadDevices();
    setIsRefreshing(false);
  }, [loadDevices]);

  // 戻るボタン
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // デバイスの詳細表示
  const showDeviceDetails = useCallback((device) => {
    Alert.alert(
      'デバイス詳細',
      `デバイス: ${device.name}\nOS: ${device.os}\nブラウザ: ${device.browser || 'N/A'}\n最終アクセス: ${new Date(device.lastAccess).toLocaleString('ja-JP')}\n場所: ${device.location}\nIPアドレス: ${device.ipAddress}`,
      [{ text: 'OK' }]
    );
  }, []);

  // デバイスの削除
  const removeDevice = useCallback(async (device) => {
    Alert.alert(
      'デバイスを削除',
      `${device.name}を削除しますか？\n\nこのデバイスは再度ログインするまでアクセスできなくなります。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              // デバイス削除API呼び出し
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              setDevices(prev => prev.filter(d => d.id !== device.id));
              Alert.alert('完了', 'デバイスを削除しました');
            } catch (error) {
              console.error('Remove device error:', error);
              Alert.alert('エラー', 'デバイスの削除に失敗しました');
            }
          }
        },
      ]
    );
  }, []);

  // デバイス名の変更
  const renameDevice = useCallback((device) => {
    Alert.prompt(
      'デバイス名の変更',
      `新しいデバイス名を入力してください`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '変更',
          onPress: async (newName) => {
            if (newName && newName.trim()) {
              try {
                // デバイス名変更API呼び出し
                await new Promise(resolve => setTimeout(resolve, 500));
                
                setDevices(prev => prev.map(d => 
                  d.id === device.id ? { ...d, name: newName.trim() } : d
                ));
                Alert.alert('完了', 'デバイス名を変更しました');
              } catch (error) {
                console.error('Rename device error:', error);
                Alert.alert('エラー', 'デバイス名の変更に失敗しました');
              }
            }
          }
        },
      ],
      'plain-text',
      device.name
    );
  }, []);

  // 全デバイスからログアウト
  const logoutAllDevices = useCallback(() => {
    Alert.alert(
      '全デバイスからログアウト',
      '現在のデバイスを除く全てのデバイスからログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            try {
              // 全デバイスログアウトAPI呼び出し
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // 現在のデバイス以外を削除
              setDevices(prev => prev.filter(d => d.isCurrent));
              Alert.alert('完了', '全デバイスからログアウトしました');
            } catch (error) {
              console.error('Logout all devices error:', error);
              Alert.alert('エラー', 'ログアウトに失敗しました');
            }
          }
        },
      ]
    );
  }, []);

  // デバイスタイプのアイコン
  const getDeviceIcon = useCallback((type) => {
    switch (type) {
      case 'mobile':
        return '📱';
      case 'tablet':
        return '💻';
      case 'desktop':
        return '🖥️';
      case 'tv':
        return '📺';
      default:
        return '🔍';
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

  // デバイスアイテムのレンダリング
  const renderDeviceItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={[
        styles.deviceCard,
        item.isCurrent && styles.currentDeviceCard
      ]}
      onPress={() => showDeviceDetails(item)}
    >
      <View style={styles.deviceHeader}>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceIcon}>
            {getDeviceIcon(item.type)}
          </Text>
          <View style={styles.deviceNameContainer}>
            <Text style={styles.deviceName}>{item.name}</Text>
            {item.isCurrent && (
              <Text style={styles.currentDeviceText}>このデバイス</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => {
            Alert.alert(
              'デバイス操作',
              `${item.name}に対する操作を選択してください`,
              [
                { text: 'キャンセル', style: 'cancel' },
                { text: '詳細表示', onPress: () => showDeviceDetails(item) },
                { text: '名前変更', onPress: () => renameDevice(item) },
                ...(item.isCurrent ? [] : [{ text: '削除', style: 'destructive', onPress: () => removeDevice(item) }]),
              ]
            );
          }}
        >
          <Text style={styles.moreButtonText}>⋮</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.deviceDetails}>
        <Text style={styles.deviceOs}>{item.os}</Text>
        <Text style={styles.deviceLocation}>{item.location}</Text>
        <Text style={styles.deviceLastAccess}>
          最終アクセス: {formatTime(item.lastAccess)}
        </Text>
      </View>
      
      <View style={styles.deviceStatus}>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: item.isActive ? Colors.success : Colors.lightGray }
        ]} />
        <Text style={styles.statusText}>
          {item.isActive ? 'アクティブ' : '非アクティブ'}
        </Text>
      </View>
    </TouchableOpacity>
  ), [showDeviceDetails, renameDevice, removeDevice, getDeviceIcon, formatTime]);

  // 空の状態のレンダリング
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📱</Text>
      <Text style={styles.emptyTitle}>デバイスがありません</Text>
      <Text style={styles.emptyDescription}>
        ログインしたデバイスはここに表示されます
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
          <Text style={styles.title}>デバイス管理</Text>
          <TouchableOpacity
            style={styles.logoutAllButton}
            onPress={logoutAllDevices}
          >
            <Text style={styles.logoutAllButtonText}>全ログアウト</Text>
          </TouchableOpacity>
        </View>

        {/* 統計情報 */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{devices.length}</Text>
            <Text style={styles.statLabel}>総デバイス数</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {devices.filter(device => device.isActive).length}
            </Text>
            <Text style={styles.statLabel}>アクティブ</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {devices.filter(device => device.type === 'mobile').length}
            </Text>
            <Text style={styles.statLabel}>モバイル</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {devices.filter(device => device.type === 'desktop').length}
            </Text>
            <Text style={styles.statLabel}>デスクトップ</Text>
          </View>
        </View>

        {/* デバイス一覧 */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        ) : (
          <FlatList
            data={devices}
            renderItem={renderDeviceItem}
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
const mockDevicesAPI = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    data: [
      {
        id: '1',
        name: 'iPhone 13 Pro',
        type: 'mobile',
        os: 'iOS 17.0',
        browser: 'Safari',
        location: '東京都渋谷区',
        ipAddress: '192.168.1.100',
        lastAccess: new Date(Date.now() - 1800000).toISOString(), // 30分前
        isActive: true,
        isCurrent: true,
      },
      {
        id: '2',
        name: 'MacBook Pro',
        type: 'desktop',
        os: 'macOS 14.0',
        browser: 'Chrome',
        location: '東京都新宿区',
        ipAddress: '192.168.1.101',
        lastAccess: new Date(Date.now() - 3600000).toISOString(), // 1時間前
        isActive: false,
        isCurrent: false,
      },
      {
        id: '3',
        name: 'iPad Air',
        type: 'tablet',
        os: 'iPadOS 17.0',
        browser: 'Safari',
        location: '東京都品川区',
        ipAddress: '192.168.1.102',
        lastAccess: new Date(Date.now() - 172800000).toISOString(), // 2日前
        isActive: false,
        isCurrent: false,
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
  logoutAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.error,
    borderRadius: 16,
  },
  logoutAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
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
  deviceCard: {
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
  currentDeviceCard: {
    borderColor: Colors.primary,
    backgroundColor: '#F0F8FF',
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  deviceNameContainer: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  currentDeviceText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButtonText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  deviceDetails: {
    marginBottom: 12,
  },
  deviceOs: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  deviceLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  deviceLastAccess: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: Colors.textSecondary,
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

export default DeviceManagementScreen;