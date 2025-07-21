import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
  Alert,
  RefreshControl,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../design-system/colors-soft-pink';
import { useAuth } from '../../contexts/AuthContext';

/**
 * お気に入り店舗画面
 */
const FavoritesScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  const [favorites, setFavorites] = useState([]);
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

  // お気に入り店舗の読み込み
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // モック実装 - 実際のAPIエンドポイントに置き換える
      const response = await mockFavoritesAPI();
      
      if (response.success) {
        setFavorites(response.data);
      } else {
        Alert.alert('エラー', 'お気に入り店舗の読み込みに失敗しました');
      }
    } catch (error) {
      console.error('Favorites load error:', error);
      Alert.alert('エラー', 'お気に入り店舗の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 引っ張って更新
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadFavorites();
    setIsRefreshing(false);
  }, [loadFavorites]);

  // お気に入りから削除
  const removeFavorite = useCallback(async (storeId) => {
    try {
      // モック実装 - 実際のAPIエンドポイントに置き換える
      const response = await mockRemoveFavoriteAPI(storeId);
      
      if (response.success) {
        setFavorites(prev => prev.filter(item => item.id !== storeId));
      } else {
        Alert.alert('エラー', 'お気に入りから削除できませんでした');
      }
    } catch (error) {
      console.error('Remove favorite error:', error);
      Alert.alert('エラー', 'お気に入りから削除できませんでした');
    }
  }, []);

  // 削除確認
  const confirmRemoveFavorite = useCallback((store) => {
    Alert.alert(
      'お気に入りから削除',
      `${store.name}をお気に入りから削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: () => removeFavorite(store.id) },
      ]
    );
  }, [removeFavorite]);

  // 店舗詳細へ遷移
  const navigateToStore = useCallback((store) => {
    navigation.navigate('StoreDetail', { storeId: store.id });
  }, [navigation]);

  // 空の状態のレンダリング
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💖</Text>
      <Text style={styles.emptyTitle}>お気に入り店舗がありません</Text>
      <Text style={styles.emptyDescription}>
        気になる店舗を見つけたら、お気に入りに追加してここで確認できます
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate('Map')}
      >
        <Text style={styles.exploreButtonText}>店舗を探す</Text>
      </TouchableOpacity>
    </View>
  ), [navigation]);

  // お気に入り店舗のレンダリング
  const renderFavoriteItem = useCallback(({ item }) => (
    <View style={styles.favoriteCard}>
      <TouchableOpacity
        style={styles.favoriteContent}
        onPress={() => navigateToStore(item)}
      >
        {/* 店舗画像 */}
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.storeImage}
          defaultSource={require('../../assets/placeholder-store.png')}
        />
        
        {/* 店舗情報 */}
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{item.name}</Text>
          <Text style={styles.storeCategory}>{item.category}</Text>
          <View style={styles.storeDetails}>
            <Text style={styles.storeRating}>⭐ {item.rating}</Text>
            <Text style={styles.storeDistance}>{item.distance}m</Text>
          </View>
          <Text style={styles.storeAddress}>{item.address}</Text>
          <Text style={styles.addedDate}>
            {new Date(item.addedAt).toLocaleDateString('ja-JP')}に追加
          </Text>
        </View>
      </TouchableOpacity>
      
      {/* お気に入り削除ボタン */}
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => confirmRemoveFavorite(item)}
      >
        <Text style={styles.favoriteButtonText}>💖</Text>
      </TouchableOpacity>
    </View>
  ), [navigateToStore, confirmRemoveFavorite]);

  // キーエクストラクター
  const keyExtractor = useCallback((item) => item.id.toString(), []);

  // ローディング状態
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
          <Text style={styles.title}>お気に入り店舗</Text>
          <Text style={styles.subtitle}>
            {favorites.length}件の店舗
          </Text>
        </View>

        {/* お気に入り店舗リスト */}
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
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
      </Animated.View>
    </SafeAreaView>
  );
};

// モックAPI関数
const mockFavoritesAPI = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    data: [
      {
        id: '1',
        name: 'バー モクテル',
        category: 'バー',
        imageUrl: 'https://example.com/bar1.jpg',
        rating: 4.5,
        distance: 120,
        address: '東京都渋谷区道玄坂1-2-3',
        addedAt: '2024-01-15T12:00:00Z',
      },
      {
        id: '2',
        name: 'クラブ ナイトフィーバー',
        category: 'クラブ',
        imageUrl: 'https://example.com/club1.jpg',
        rating: 4.2,
        distance: 200,
        address: '東京都渋谷区宇田川町4-5-6',
        addedAt: '2024-01-10T18:30:00Z',
      },
      {
        id: '3',
        name: 'ラウンジ セレニティ',
        category: 'ラウンジ',
        imageUrl: 'https://example.com/lounge1.jpg',
        rating: 4.7,
        distance: 80,
        address: '東京都渋谷区神南1-7-8',
        addedAt: '2024-01-08T20:15:00Z',
      },
    ],
  };
};

const mockRemoveFavoriteAPI = async (storeId) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    message: 'お気に入りから削除しました',
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
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  favoriteCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
  },
  storeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
    marginRight: 16,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  storeCategory: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  storeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  storeRating: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginRight: 12,
  },
  storeDistance: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  storeAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  addedDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  favoriteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    paddingHorizontal: 16,
  },
  favoriteButtonText: {
    fontSize: 24,
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
    marginBottom: 32,
  },
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 24,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default FavoritesScreen;