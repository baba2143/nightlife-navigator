import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import VenueSearchService from '../services/VenueSearchService';
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
};

// フィルターコンポーネント
const SearchFilters = ({ filters, onFilterChange, categories, priceRanges }) => {
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showPriceFilter, setShowPriceFilter] = useState(false);

  return (
    <View style={styles.filtersContainer}>
      {/* カテゴリフィルター */}
      <TouchableOpacity
        style={[
          styles.filterButton,
          filters.categories?.length > 0 && styles.activeFilterButton
        ]}
        onPress={() => setShowCategoryFilter(true)}
      >
        <Text style={[
          styles.filterButtonText,
          filters.categories?.length > 0 && styles.activeFilterButtonText
        ]}>
          {filters.categories?.length > 0 
            ? `カテゴリ (${filters.categories.length})` 
            : 'カテゴリ'
          }
        </Text>
      </TouchableOpacity>

      {/* 価格帯フィルター */}
      <TouchableOpacity
        style={[
          styles.filterButton,
          filters.priceRanges?.length > 0 && styles.activeFilterButton
        ]}
        onPress={() => setShowPriceFilter(true)}
      >
        <Text style={[
          styles.filterButtonText,
          filters.priceRanges?.length > 0 && styles.activeFilterButtonText
        ]}>
          {filters.priceRanges?.length > 0 
            ? `価格帯 (${filters.priceRanges.length})` 
            : '価格帯'
          }
        </Text>
      </TouchableOpacity>

      {/* 評価フィルター */}
      <TouchableOpacity
        style={[
          styles.filterButton,
          filters.minRating && styles.activeFilterButton
        ]}
        onPress={() => {
          const newRating = filters.minRating === 4.0 ? undefined : 4.0;
          onFilterChange({ ...filters, minRating: newRating });
        }}
      >
        <Text style={[
          styles.filterButtonText,
          filters.minRating && styles.activeFilterButtonText
        ]}>
          評価4.0以上
        </Text>
      </TouchableOpacity>

      {/* 営業中フィルター */}
      <TouchableOpacity
        style={[
          styles.filterButton,
          filters.openNow && styles.activeFilterButton
        ]}
        onPress={() => {
          onFilterChange({ ...filters, openNow: !filters.openNow });
        }}
      >
        <Text style={[
          styles.filterButtonText,
          filters.openNow && styles.activeFilterButtonText
        ]}>
          営業中
        </Text>
      </TouchableOpacity>

      {/* カテゴリ選択モーダル */}
      <Modal
        visible={showCategoryFilter}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryFilter(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>カテゴリを選択</Text>
            <ScrollView style={styles.optionsList}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.optionItem,
                    filters.categories?.includes(category.id) && styles.selectedOption
                  ]}
                  onPress={() => {
                    const currentCategories = filters.categories || [];
                    const newCategories = currentCategories.includes(category.id)
                      ? currentCategories.filter(c => c !== category.id)
                      : [...currentCategories, category.id];
                    onFilterChange({ ...filters, categories: newCategories });
                  }}
                >
                  <Text style={styles.optionIcon}>{category.icon}</Text>
                  <Text style={styles.optionText}>{category.name}</Text>
                  {filters.categories?.includes(category.id) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowCategoryFilter(false)}
            >
              <Text style={styles.closeModalButtonText}>完了</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 価格帯選択モーダル */}
      <Modal
        visible={showPriceFilter}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPriceFilter(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>価格帯を選択</Text>
            <ScrollView style={styles.optionsList}>
              {priceRanges.map((priceRange) => (
                <TouchableOpacity
                  key={priceRange.id}
                  style={[
                    styles.optionItem,
                    filters.priceRanges?.includes(priceRange.id) && styles.selectedOption
                  ]}
                  onPress={() => {
                    const currentPriceRanges = filters.priceRanges || [];
                    const newPriceRanges = currentPriceRanges.includes(priceRange.id)
                      ? currentPriceRanges.filter(p => p !== priceRange.id)
                      : [...currentPriceRanges, priceRange.id];
                    onFilterChange({ ...filters, priceRanges: newPriceRanges });
                  }}
                >
                  <Text style={styles.optionText}>
                    {priceRange.symbol} {priceRange.name}
                  </Text>
                  <Text style={styles.priceRangeDetail}>
                    ({priceRange.min.toLocaleString()}〜{priceRange.max.toLocaleString()}円)
                  </Text>
                  {filters.priceRanges?.includes(priceRange.id) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowPriceFilter(false)}
            >
              <Text style={styles.closeModalButtonText}>完了</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ソート選択コンポーネント
const SortOptions = ({ sortBy, onSortChange }) => {
  const [showSortModal, setShowSortModal] = useState(false);

  const sortOptions = [
    { id: 'relevance', label: '関連度順', icon: '🎯' },
    { id: 'rating', label: '評価順', icon: '⭐' },
    { id: 'distance', label: '距離順', icon: '📍' },
    { id: 'name', label: '名前順', icon: '🔤' },
    { id: 'price_low', label: '価格安い順', icon: '💰' },
    { id: 'price_high', label: '価格高い順', icon: '💎' },
  ];

  const currentSortOption = sortOptions.find(option => option.id === sortBy) || sortOptions[0];

  return (
    <View style={styles.sortContainer}>
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setShowSortModal(true)}
      >
        <Text style={styles.sortIcon}>{currentSortOption.icon}</Text>
        <Text style={styles.sortText}>{currentSortOption.label}</Text>
        <Text style={styles.sortArrow}>▼</Text>
      </TouchableOpacity>

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

// 店舗カードコンポーネント
const VenueCard = ({ venue, onPress }) => {
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
    <TouchableOpacity style={styles.venueCard} onPress={() => onPress(venue)}>
      <View style={styles.venueImagePlaceholder}>
        <Text style={styles.venueImageIcon}>{getCategoryIcon(venue.category)}</Text>
      </View>
      
      <View style={styles.venueInfo}>
        <Text style={styles.venueName}>{venue.name}</Text>
        <Text style={styles.venueCategory}>{venue.category}</Text>
        
        <View style={styles.venueMetrics}>
          <View style={styles.venueRating}>
            <Text style={styles.venueRatingText}>★ {venue.rating.toFixed(1)}</Text>
            <Text style={styles.venueReviewCount}>({venue.reviewCount})</Text>
          </View>
          <Text style={styles.venuePriceRange}>
            {getPriceRangeSymbol(venue.priceRange)}
          </Text>
        </View>
        
        <Text style={styles.venueDistance}>{venue.distance}m</Text>
        <Text style={styles.venueDescription} numberOfLines={2}>
          {venue.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// メイン検索コンポーネント
const VenueSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('relevance');
  const [categories, setCategories] = useState([]);
  const [priceRanges, setPriceRanges] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showVenueDetails, setShowVenueDetails] = useState(false);

  useEffect(() => {
    initializeSearch();
  }, []);

  const initializeSearch = async () => {
    try {
      await VenueSearchService.initialize();
      setCategories(VenueSearchService.getVenueCategories());
      setPriceRanges(VenueSearchService.getPriceRanges());
      // 初期検索（空のクエリで全件取得）
      performSearch('');
    } catch (error) {
      console.error('Failed to initialize search:', error);
    }
  };

  const performSearch = async (query = searchQuery) => {
    setIsLoading(true);
    try {
      const result = await VenueSearchService.searchVenues(query, filters, {
        sortBy,
        limit: 20,
      });
      setSearchResults(result.results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchQueryChange = (query) => {
    setSearchQuery(query);
    // デバウンス処理のための遅延検索
    setTimeout(() => {
      if (query === searchQuery) {
        performSearch(query);
      }
    }, 300);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    performSearch();
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    performSearch();
  };

  const handleVenuePress = (venue) => {
    setSelectedVenue(venue);
    setShowVenueDetails(true);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    performSearch('');
  };

  const hasActiveFilters = () => {
    return Object.keys(filters).some(key => {
      const value = filters[key];
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    });
  };

  return (
    <View style={styles.container}>
      {/* 検索バー */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="店舗名、エリア、特徴で検索..."
            value={searchQuery}
            onChangeText={handleSearchQueryChange}
            returnKeyType="search"
            onSubmitEditing={() => performSearch()}
          />
          {(searchQuery || hasActiveFilters()) && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* フィルターとソート */}
      <View style={styles.controlsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
        >
          <SearchFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            categories={categories}
            priceRanges={priceRanges}
          />
        </ScrollView>
        
        <SortOptions sortBy={sortBy} onSortChange={handleSortChange} />
      </View>

      {/* 検索結果 */}
      <View style={styles.resultsContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>検索中...</Text>
          </View>
        ) : (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {searchResults.length}件の店舗が見つかりました
              </Text>
            </View>
            
            <FlatList
              data={searchResults}
              renderItem={({ item }) => (
                <VenueCard venue={item} onPress={handleVenuePress} />
              )}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.resultsList}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </>
        )}
      </View>

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

  // 検索ヘッダー
  searchHeader: {
    backgroundColor: colors.white,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  searchInputContainer: {
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

  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  clearButtonText: {
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

  sortContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
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

  priceRangeDetail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
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

  // 検索結果
  resultsContainer: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },

  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },

  resultsCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  resultsList: {
    paddingHorizontal: 16,
  },

  separator: {
    height: 12,
  },

  // 店舗カード
  venueCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  venueImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  venueImageIcon: {
    fontSize: 32,
    color: colors.primary,
  },

  venueInfo: {
    flex: 1,
    gap: 4,
  },

  venueName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },

  venueCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },

  venueMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  venueRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  venueRatingText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },

  venueReviewCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  venuePriceRange: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
  },

  venueDistance: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  venueDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});

export default VenueSearch;