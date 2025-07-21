import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  Share,
} from 'react-native';
import FavoritesService from '../services/FavoritesService';
import VenueDetails from './VenueDetails';

// カラーテーマ
const colors = {
  primary: '#ea5a7b',
  white: '#ffffff',
  background: '#fafafa',
  backgroundLight: '#fef7f7',
  text: '#333333',
  textSecondary: '#666666',
  border: '#e0e0e0',
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800',
};

// 統計カードコンポーネント
const StatsCard = ({ stats }) => {
  const getCategoryIcon = (category) => {
    const icons = {
      bar: '🍸',
      club: '🎵',
      lounge: '🛋️',
      restaurant: '🍽️',
      karaoke: '🎤',
      pub: '🍺',
    };
    return icons[category] || '🏪';
  };

  const getPriceRangeSymbol = (priceRange) => {
    const symbols = {
      budget: '¥',
      moderate: '¥¥',
      expensive: '¥¥¥',
      luxury: '¥¥¥¥',
    };
    return symbols[priceRange] || '¥';
  };

  return (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>お気に入り統計</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalCount}</Text>
          <Text style={styles.statLabel}>総数</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {stats.averageRating > 0 ? stats.averageRating : '0.0'}
          </Text>
          <Text style={styles.statLabel}>平均評価</Text>
        </View>
        
        {stats.mostFavoritedCategory && (
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {getCategoryIcon(stats.mostFavoritedCategory)}
            </Text>
            <Text style={styles.statLabel}>最多カテゴリ</Text>
          </View>
        )}
        
        {stats.mostFavoritedPriceRange && (
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {getPriceRangeSymbol(stats.mostFavoritedPriceRange)}
            </Text>
            <Text style={styles.statLabel}>最多価格帯</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// フィルター・ソートコンポーネント
const FilterSortControls = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange, 
  sortBy, 
  onSortChange 
}) => {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const getCategoryIcon = (category) => {
    const icons = {
      bar: '🍸',
      club: '🎵',
      lounge: '🛋️',
      restaurant: '🍽️',
      karaoke: '🎤',
      pub: '🍺',
    };
    return icons[category] || '🏪';
  };

  const sortOptions = [
    { id: 'favoriteDate', label: '追加日時順', icon: '📅' },
    { id: 'name', label: '名前順', icon: '🔤' },
    { id: 'rating', label: '評価順', icon: '⭐' },
    { id: 'distance', label: '距離順', icon: '📍' },
    { id: 'category', label: 'カテゴリ順', icon: '📂' },
  ];

  const currentSort = sortOptions.find(option => option.id === sortBy) || sortOptions[0];

  return (
    <View style={styles.controlsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <View style={styles.filtersContainer}>
          {/* カテゴリフィルター */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedCategory && styles.activeFilterButton
            ]}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedCategory && styles.activeFilterButtonText
            ]}>
              {selectedCategory 
                ? `${getCategoryIcon(selectedCategory)} ${selectedCategory}` 
                : 'カテゴリ'
              }
            </Text>
          </TouchableOpacity>

          {/* クリアフィルター */}
          {selectedCategory && (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => onCategoryChange(null)}
            >
              <Text style={styles.clearFilterButtonText}>クリア</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* ソートボタン */}
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setShowSortModal(true)}
      >
        <Text style={styles.sortIcon}>{currentSort.icon}</Text>
        <Text style={styles.sortText}>{currentSort.label}</Text>
        <Text style={styles.sortArrow}>▼</Text>
      </TouchableOpacity>

      {/* カテゴリモーダル */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>カテゴリで絞り込み</Text>
            <ScrollView style={styles.optionsList}>
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  !selectedCategory && styles.selectedOption
                ]}
                onPress={() => {
                  onCategoryChange(null);
                  setShowCategoryModal(false);
                }}
              >
                <Text style={styles.optionText}>すべて</Text>
                {!selectedCategory && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.optionItem,
                    selectedCategory === category && styles.selectedOption
                  ]}
                  onPress={() => {
                    onCategoryChange(category);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.optionIcon}>{getCategoryIcon(category)}</Text>
                  <Text style={styles.optionText}>{category}</Text>
                  {selectedCategory === category && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.closeModalButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ソートモーダル */}
      <Modal
        visible={showSortModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>並び替え</Text>
            <ScrollView style={styles.optionsList}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionItem,
                    sortBy === option.id && styles.selectedOption
                  ]}
                  onPress={() => {
                    onSortChange(option.id);
                    setShowSortModal(false);
                  }}
                >
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                  <Text style={styles.optionText}>{option.label}</Text>
                  {sortBy === option.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowSortModal(false)}
            >
              <Text style={styles.closeModalButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// お気に入り店舗カードコンポーネント
const FavoriteCard = ({ favorite, onPress, onRemove }) => {
  const getCategoryIcon = (category) => {
    const icons = {
      bar: '🍸',
      club: '🎵',
      lounge: '🛋️',
      restaurant: '🍽️',
      karaoke: '🎤',
      pub: '🍺',
    };
    return icons[category] || '🏪';
  };

  const getPriceRangeSymbol = (priceRange) => {
    const symbols = {
      budget: '¥',
      moderate: '¥¥',
      expensive: '¥¥¥',
      luxury: '¥¥¥¥',
    };
    return symbols[priceRange] || '¥';
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleRemove = () => {
    Alert.alert(
      'お気に入りを削除',
      `${favorite.name}をお気に入りから削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除', 
          style: 'destructive',
          onPress: () => onRemove(favorite.id)
        },
      ]
    );
  };

  return (
    <View style={styles.favoriteCard}>
      <TouchableOpacity
        style={styles.favoriteCardContent}
        onPress={() => onPress(favorite)}
      >
        <View style={styles.favoriteImagePlaceholder}>
          <Text style={styles.favoriteImageIcon}>
            {getCategoryIcon(favorite.category)}
          </Text>
        </View>
        
        <View style={styles.favoriteInfo}>
          <Text style={styles.favoriteName}>{favorite.name}</Text>
          <Text style={styles.favoriteCategory}>{favorite.category}</Text>
          
          <View style={styles.favoriteMetrics}>
            <View style={styles.favoriteRating}>
              <Text style={styles.favoriteRatingText}>★ {favorite.rating.toFixed(1)}</Text>
              <Text style={styles.favoriteReviewCount}>({favorite.reviewCount})</Text>
            </View>
            <Text style={styles.favoritePriceRange}>
              {getPriceRangeSymbol(favorite.priceRange)}
            </Text>
          </View>
          
          <Text style={styles.favoriteDistance}>{favorite.distance}m</Text>
          <Text style={styles.favoriteDate}>
            追加日: {formatDate(favorite.favoriteDate)}
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.removeButton}
        onPress={handleRemove}
      >
        <Text style={styles.removeButtonText}>💔</Text>
      </TouchableOpacity>
    </View>
  );
};

// メインお気に入り管理コンポーネント
const FavoritesManager = () => {
  const [favorites, setFavorites] = useState([]);
  const [filteredFavorites, setFilteredFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('favoriteDate');
  const [stats, setStats] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showVenueDetails, setShowVenueDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeFavorites();
    setupEventListeners();
    
    return () => {
      cleanupEventListeners();
    };
  }, []);

  useEffect(() => {
    filterAndSortFavorites();
  }, [favorites, searchQuery, selectedCategory, sortBy]);

  const initializeFavorites = async () => {
    try {
      await FavoritesService.initialize();
      loadFavorites();
    } catch (error) {
      console.error('Failed to initialize favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavorites = () => {
    const favoritesList = FavoritesService.getFavorites();
    const stats = FavoritesService.getFavoriteStats();
    const uniqueCategories = [...new Set(favoritesList.map(fav => fav.category))];
    
    setFavorites(favoritesList);
    setStats(stats);
    setCategories(uniqueCategories);
  };

  const setupEventListeners = () => {
    FavoritesService.addEventListener('favoritesChanged', handleFavoritesChanged);
  };

  const cleanupEventListeners = () => {
    FavoritesService.removeEventListener('favoritesChanged', handleFavoritesChanged);
  };

  const handleFavoritesChanged = () => {
    loadFavorites();
  };

  const filterAndSortFavorites = () => {
    let filtered = favorites;

    // 検索フィルタ
    if (searchQuery.trim() !== '') {
      const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
      filtered = filtered.filter(favorite => {
        const searchableText = [
          favorite.name,
          favorite.description,
          favorite.address,
          favorite.category,
          ...favorite.tags,
        ].join(' ').toLowerCase();

        return searchTerms.some(term => searchableText.includes(term));
      });
    }

    // カテゴリフィルタ
    if (selectedCategory) {
      filtered = filtered.filter(favorite => favorite.category === selectedCategory);
    }

    // ソート
    const sorted = FavoritesService.getFavoritesSortedBy(sortBy);
    filtered = filtered.sort((a, b) => {
      const aIndex = sorted.findIndex(item => item.id === a.id);
      const bIndex = sorted.findIndex(item => item.id === b.id);
      return aIndex - bIndex;
    });

    setFilteredFavorites(filtered);
  };

  const handleRemoveFavorite = async (venueId) => {
    const success = await FavoritesService.removeFavorite(venueId);
    if (success) {
      // Event listener will handle the update
    } else {
      Alert.alert('エラー', 'お気に入りの削除に失敗しました');
    }
  };

  const handleVenuePress = (venue) => {
    setSelectedVenue(venue);
    setShowVenueDetails(true);
  };

  const handleClearAll = () => {
    if (favorites.length === 0) return;

    Alert.alert(
      'すべて削除',
      'お気に入りをすべて削除しますか？この操作は元に戻せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除', 
          style: 'destructive',
          onPress: async () => {
            const success = await FavoritesService.clearAllFavorites();
            if (!success) {
              Alert.alert('エラー', 'お気に入りの削除に失敗しました');
            }
          }
        },
      ]
    );
  };

  const handleExport = async () => {
    try {
      const exportData = await FavoritesService.exportFavorites();
      if (exportData) {
        await Share.share({
          message: exportData,
          title: 'お気に入りデータ',
        });
      } else {
        Alert.alert('エラー', 'データのエクスポートに失敗しました');
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('エラー', 'データの共有に失敗しました');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>お気に入りを読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>❤️ お気に入り</Text>
        {favorites.length > 0 && (
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={handleExport}>
              <Text style={styles.headerButtonText}>📤</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleClearAll}>
              <Text style={styles.headerButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💔</Text>
          <Text style={styles.emptyTitle}>お気に入りがありません</Text>
          <Text style={styles.emptyDescription}>
            気になる店舗を見つけたら、ハートマークをタップしてお気に入りに追加しましょう。
          </Text>
        </View>
      ) : (
        <>
          {/* 統計カード */}
          <StatsCard stats={stats} />

          {/* 検索バー */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="お気に入りを検索..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.clearSearchButtonText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* フィルター・ソート */}
          <FilterSortControls
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {/* 結果表示 */}
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsCount}>
              {filteredFavorites.length}件のお気に入り
            </Text>

            <FlatList
              data={filteredFavorites}
              renderItem={({ item }) => (
                <FavoriteCard
                  favorite={item}
                  onPress={handleVenuePress}
                  onRemove={handleRemoveFavorite}
                />
              )}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.favoritesList}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </>
      )}

      {/* 店舗詳細モーダル */}
      <Modal
        visible={showVenueDetails}
        animationType="slide"
        onRequestClose={() => setShowVenueDetails(false)}
      >
        <VenueDetails
          venue={selectedVenue}
          onClose={() => setShowVenueDetails(false)}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  // ヘッダー
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },

  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerButtonText: {
    fontSize: 18,
  },

  // 空の状態
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },

  emptyIcon: {
    fontSize: 64,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },

  emptyDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // 統計カード
  statsCard: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  statItem: {
    alignItems: 'center',
    gap: 4,
  },

  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },

  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // 検索バー
  searchContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: colors.textSecondary,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },

  clearSearchButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  clearSearchButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // コントロール
  controlsContainer: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  filtersScroll: {
    paddingHorizontal: 16,
  },

  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },

  activeFilterButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  filterButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  activeFilterButtonText: {
    color: colors.white,
  },

  clearFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.error,
  },

  clearFilterButtonText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
  },

  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },

  sortIcon: {
    fontSize: 16,
  },

  sortText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },

  sortArrow: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // モーダル
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  optionsList: {
    maxHeight: 300,
  },

  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  selectedOption: {
    backgroundColor: colors.backgroundLight,
  },

  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },

  optionText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },

  checkmark: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },

  closeModalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    alignItems: 'center',
  },

  closeModalButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // 結果
  resultsContainer: {
    flex: 1,
  },

  resultsCount: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },

  favoritesList: {
    paddingHorizontal: 16,
  },

  separator: {
    height: 12,
  },

  // お気に入りカード
  favoriteCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  favoriteCardContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },

  favoriteImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  favoriteImageIcon: {
    fontSize: 32,
    color: colors.primary,
  },

  favoriteInfo: {
    flex: 1,
    gap: 4,
  },

  favoriteName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },

  favoriteCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },

  favoriteMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  favoriteRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  favoriteRatingText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },

  favoriteReviewCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  favoritePriceRange: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
  },

  favoriteDistance: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  favoriteDate: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  removeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  removeButtonText: {
    fontSize: 20,
  },
});

export default FavoritesManager;