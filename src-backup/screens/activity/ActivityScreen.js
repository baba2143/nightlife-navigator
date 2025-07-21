import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../design-system/colors-soft-pink';
import { useAuth } from '../../contexts/AuthContext';

/**
 * 利用履歴・アクティビティ画面
 */
const ActivityScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, visits, favorites, reviews
  const [fadeAnim] = useState(new Animated.Value(0));

  // 初期化アニメーション
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // アクティビティの読み込み
  useEffect(() => {
    loadActivities();
  }, [filter]);

  const loadActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // モック実装 - 実際のAPIエンドポイントに置き換える
      const response = await mockActivitiesAPI(filter);
      
      if (response.success) {
        setActivities(response.data);
      }
    } catch (error) {
      console.error('Activities load error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  // 引っ張って更新
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadActivities();
    setIsRefreshing(false);
  }, [loadActivities]);

  // フィルターの変更
  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
  }, []);

  // アクティビティタイプのアイコン
  const getActivityIcon = useCallback((type) => {
    switch (type) {
      case 'visit':
        return '🏪';
      case 'favorite':
        return '💖';
      case 'review':
        return '⭐';
      case 'signup':
        return '🎉';
      case 'profile_update':
        return '👤';
      default:
        return '📱';
    }
  }, []);

  // アクティビティの詳細テキスト
  const getActivityDescription = useCallback((activity) => {
    switch (activity.type) {
      case 'visit':
        return `${activity.storeName}を訪問しました`;
      case 'favorite':
        return `${activity.storeName}をお気に入りに追加しました`;
      case 'review':
        return `${activity.storeName}にレビューを投稿しました`;
      case 'signup':
        return 'アカウントを作成しました';
      case 'profile_update':
        return 'プロフィールを更新しました';
      default:
        return activity.description || 'アクティビティが発生しました';
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
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }, []);

  // フィルターボタンのレンダリング
  const renderFilterButton = useCallback((filterType, label) => (
    <TouchableOpacity
      key={filterType}
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive
      ]}
      onPress={() => handleFilterChange(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterType && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  ), [filter, handleFilterChange]);

  // アクティビティアイテムのレンダリング
  const renderActivityItem = useCallback(({ item }) => (
    <View style={styles.activityCard}>
      <View style={styles.activityIcon}>
        <Text style={styles.activityIconText}>
          {getActivityIcon(item.type)}
        </Text>
      </View>
      
      <View style={styles.activityContent}>
        <Text style={styles.activityDescription}>
          {getActivityDescription(item)}
        </Text>
        <Text style={styles.activityTime}>
          {formatTime(item.timestamp)}
        </Text>
        
        {item.details && (
          <Text style={styles.activityDetails}>
            {item.details}
          </Text>
        )}
      </View>
    </View>
  ), [getActivityIcon, getActivityDescription, formatTime]);

  // 空の状態のレンダリング
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📱</Text>
      <Text style={styles.emptyTitle}>アクティビティがありません</Text>
      <Text style={styles.emptyDescription}>
        アプリを使用するとここにアクティビティが表示されます
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
          <Text style={styles.title}>アクティビティ</Text>
          <Text style={styles.subtitle}>
            あなたの利用履歴
          </Text>
        </View>

        {/* フィルター */}
        <View style={styles.filterContainer}>
          {renderFilterButton('all', 'すべて')}
          {renderFilterButton('visits', '訪問')}
          {renderFilterButton('favorites', 'お気に入り')}
          {renderFilterButton('reviews', 'レビュー')}
        </View>

        {/* アクティビティリスト */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        ) : (
          <FlatList
            data={activities}
            renderItem={renderActivityItem}
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
const mockActivitiesAPI = async (filter) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const allActivities = [
    {
      id: '1',
      type: 'visit',
      storeName: 'バー モクテル',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1時間前
      details: '2時間滞在',
    },
    {
      id: '2',
      type: 'favorite',
      storeName: 'クラブ ナイトフィーバー',
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2時間前
    },
    {
      id: '3',
      type: 'review',
      storeName: 'ラウンジ セレニティ',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1日前
      details: '★★★★★ 素晴らしい雰囲気でした！',
    },
    {
      id: '4',
      type: 'visit',
      storeName: 'バー ミッドナイト',
      timestamp: new Date(Date.now() - 172800000).toISOString(), // 2日前
      details: '3時間滞在',
    },
    {
      id: '5',
      type: 'profile_update',
      timestamp: new Date(Date.now() - 259200000).toISOString(), // 3日前
    },
    {
      id: '6',
      type: 'favorite',
      storeName: 'スポーツバー チャンピオン',
      timestamp: new Date(Date.now() - 604800000).toISOString(), // 1週間前
    },
  ];
  
  let filteredActivities = allActivities;
  
  if (filter !== 'all') {
    const typeMap = {
      visits: 'visit',
      favorites: 'favorite',
      reviews: 'review',
    };
    
    filteredActivities = allActivities.filter(activity => 
      activity.type === typeMap[filter]
    );
  }
  
  return {
    success: true,
    data: filteredActivities,
    total: filteredActivities.length,
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  filterButtonTextActive: {
    color: Colors.white,
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
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightPink,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 14,
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

export default ActivityScreen;