/**
 * 店舗検索コンポーネント
 * Nightlife Navigator固有の店舗検索機能
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { colors } from '../../design-system/colors-soft-pink';
import { spacingSystem } from '../../design-system/spacing-comfortable';
import { borderRadiusSystem } from '../../design-system/borders-rounded';
import { shadowSystem } from '../../design-system/shadows-soft-pink';
import { SearchBar } from '../ui/SearchBar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Text } from '../ui/Text';
import { Flex } from '../ui/Layout';

// 店舗検索フィルター
const VenueSearchFilters = ({ 
  filters, 
  onFilterChange, 
  onClearFilters 
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const categories = [
    { id: 'bar', label: 'バー', icon: '🍸' },
    { id: 'club', label: 'クラブ', icon: '🎵' },
    { id: 'lounge', label: 'ラウンジ', icon: '🛋️' },
    { id: 'restaurant', label: 'レストラン', icon: '🍽️' },
    { id: 'karaoke', label: 'カラオケ', icon: '🎤' },
    { id: 'pub', label: 'パブ', icon: '🍺' },
  ];

  const priceRanges = [
    { id: 'budget', label: '¥', value: 1000 },
    { id: 'moderate', label: '¥¥', value: 3000 },
    { id: 'expensive', label: '¥¥¥', value: 5000 },
    { id: 'luxury', label: '¥¥¥¥', value: 10000 },
  ];

  const distances = [
    { id: '500m', label: '500m以内', value: 500 },
    { id: '1km', label: '1km以内', value: 1000 },
    { id: '3km', label: '3km以内', value: 3000 },
    { id: '5km', label: '5km以内', value: 5000 },
  ];

  const ratings = [
    { id: '4plus', label: '4.0+', value: 4.0 },
    { id: '4.5plus', label: '4.5+', value: 4.5 },
    { id: '5', label: '5.0', value: 5.0 },
  ];

  return (
    <Card variant="soft" style={styles.filtersCard}>
      <View style={styles.filtersHeader}>
        <Text variant="h4" style={{ color: theme.colors.brand }}>
          フィルター
        </Text>
        <Button
          variant="ghost"
          size="sm"
          onPress={onClearFilters}
          style={styles.clearButton}
        >
          クリア
        </Button>
      </View>

      {/* カテゴリフィルター */}
      <View style={styles.filterSection}>
        <Text variant="bodySmall" style={styles.filterTitle}>
          カテゴリ
        </Text>
        <Flex direction="row" wrap="wrap" gap="sm">
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filters.categories?.includes(category.id)
                    ? theme.colors.brand
                    : theme.colors.background.surface,
                  borderColor: filters.categories?.includes(category.id)
                    ? theme.colors.brand
                    : theme.colors.border.medium,
                },
              ]}
              onPress={() => onFilterChange('categories', category.id)}
            >
              <Text variant="caption" style={styles.filterChipText}>
                {category.icon} {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Flex>
      </View>

      {/* 価格帯フィルター */}
      <View style={styles.filterSection}>
        <Text variant="bodySmall" style={styles.filterTitle}>
          価格帯
        </Text>
        <Flex direction="row" gap="sm">
          {priceRanges.map((range) => (
            <TouchableOpacity
              key={range.id}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filters.priceRange === range.id
                    ? theme.colors.brand
                    : theme.colors.background.surface,
                  borderColor: filters.priceRange === range.id
                    ? theme.colors.brand
                    : theme.colors.border.medium,
                },
              ]}
              onPress={() => onFilterChange('priceRange', range.id)}
            >
              <Text variant="caption" style={styles.filterChipText}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Flex>
      </View>

      {/* 距離フィルター */}
      <View style={styles.filterSection}>
        <Text variant="bodySmall" style={styles.filterTitle}>
          距離
        </Text>
        <Flex direction="row" gap="sm">
          {distances.map((distance) => (
            <TouchableOpacity
              key={distance.id}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filters.distance === distance.id
                    ? theme.colors.brand
                    : theme.colors.background.surface,
                  borderColor: filters.distance === distance.id
                    ? theme.colors.brand
                    : theme.colors.border.medium,
                },
              ]}
              onPress={() => onFilterChange('distance', distance.id)}
            >
              <Text variant="caption" style={styles.filterChipText}>
                {distance.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Flex>
      </View>

      {/* 評価フィルター */}
      <View style={styles.filterSection}>
        <Text variant="bodySmall" style={styles.filterTitle}>
          評価
        </Text>
        <Flex direction="row" gap="sm">
          {ratings.map((rating) => (
            <TouchableOpacity
              key={rating.id}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filters.rating === rating.id
                    ? theme.colors.brand
                    : theme.colors.background.surface,
                  borderColor: filters.rating === rating.id
                    ? theme.colors.brand
                    : theme.colors.border.medium,
                },
              ]}
              onPress={() => onFilterChange('rating', rating.id)}
            >
              <Text variant="caption" style={styles.filterChipText}>
                ★ {rating.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Flex>
      </View>
    </Card>
  );
};

// 店舗検索結果アイテム
const VenueSearchItem = ({ venue, onPress, onFavorite }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

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

  const getPriceRangeLabel = (priceRange) => {
    const labels = {
      budget: '¥',
      moderate: '¥¥',
      expensive: '¥¥¥',
      luxury: '¥¥¥¥',
    };
    return labels[priceRange] || '¥';
  };

  return (
    <TouchableOpacity onPress={() => onPress(venue)}>
      <Card variant="elevated" style={styles.venueCard}>
        <View style={styles.venueHeader}>
          <View style={styles.venueMainInfo}>
            <Text variant="h4" style={{ color: theme.colors.brand }}>
              {getCategoryIcon(venue.category)} {venue.name}
            </Text>
            <Text variant="bodySmall" color="textSecondary">
              {venue.address}
            </Text>
            <View style={styles.venueMetrics}>
              <Badge variant="soft" size="sm">
                {venue.rating} ★
              </Badge>
              <Badge variant="outline" size="sm">
                {getPriceRangeLabel(venue.priceRange)}
              </Badge>
              <Badge variant="outline" size="sm">
                {venue.distance}m
              </Badge>
            </View>
          </View>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => onFavorite(venue)}
          >
            <Text variant="h3" style={{ color: venue.isFavorite ? theme.colors.error[500] : theme.colors.text.tertiary }}>
              {venue.isFavorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text variant="body" style={styles.venueDescription}>
          {venue.description}
        </Text>

        <View style={styles.venueFooter}>
          <View style={styles.venueTags}>
            {venue.tags?.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" size="sm">
                {tag}
              </Badge>
            ))}
          </View>
          <View style={styles.venueStatus}>
            <Text variant="caption" style={{ 
              color: venue.isOpen ? theme.colors.success[600] : theme.colors.error[500] 
            }}>
              {venue.isOpen ? '営業中' : '営業時間外'}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

// メイン検索コンポーネント
const VenueSearch = ({ onVenueSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [filters, setFilters] = useState({
    categories: [],
    priceRange: null,
    distance: null,
    rating: null,
  });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  // サンプルデータ
  const sampleVenues = [
    {
      id: 1,
      name: "GENTLE LOUNGE",
      category: "lounge",
      address: "渋谷区渋谷1-2-3",
      rating: 4.8,
      priceRange: "expensive",
      distance: 250,
      description: "やさしいピンクの温かみのあるデザインで、心地よい雰囲気を演出。",
      tags: ["ラウンジ", "やさしい", "ピンク"],
      isOpen: true,
      isFavorite: false,
    },
    {
      id: 2,
      name: "NEON BAR",
      category: "bar",
      address: "新宿区新宿2-3-4",
      rating: 4.5,
      priceRange: "moderate",
      distance: 800,
      description: "ネオンライトが美しい大人のバー。カクテルの種類が豊富。",
      tags: ["バー", "ネオン", "カクテル"],
      isOpen: true,
      isFavorite: true,
    },
    {
      id: 3,
      name: "CLUB TOKYO",
      category: "club",
      address: "港区六本木3-4-5",
      rating: 4.2,
      priceRange: "luxury",
      distance: 1200,
      description: "東京最大級のクラブ。最新の音響設備と照明で最高の夜を。",
      tags: ["クラブ", "ダンス", "音楽"],
      isOpen: false,
      isFavorite: false,
    },
    {
      id: 4,
      name: "KARAOKE FRIENDS",
      category: "karaoke",
      address: "新宿区歌舞伎町1-5-6",
      rating: 4.0,
      priceRange: "budget",
      distance: 600,
      description: "友達との楽しい時間を過ごせるアットホームなカラオケ。",
      tags: ["カラオケ", "友達", "楽しい"],
      isOpen: true,
      isFavorite: false,
    },
  ];

  useEffect(() => {
    setVenues(sampleVenues);
    setFilteredVenues(sampleVenues);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters, venues]);

  const applyFilters = () => {
    let filtered = venues;

    // テキスト検索
    if (searchQuery.trim()) {
      filtered = filtered.filter(venue =>
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // カテゴリフィルター
    if (filters.categories.length > 0) {
      filtered = filtered.filter(venue =>
        filters.categories.includes(venue.category)
      );
    }

    // 価格帯フィルター
    if (filters.priceRange) {
      filtered = filtered.filter(venue =>
        venue.priceRange === filters.priceRange
      );
    }

    // 距離フィルター
    if (filters.distance) {
      const maxDistance = {
        '500m': 500,
        '1km': 1000,
        '3km': 3000,
        '5km': 5000,
      }[filters.distance];

      filtered = filtered.filter(venue =>
        venue.distance <= maxDistance
      );
    }

    // 評価フィルター
    if (filters.rating) {
      const minRating = {
        '4plus': 4.0,
        '4.5plus': 4.5,
        '5': 5.0,
      }[filters.rating];

      filtered = filtered.filter(venue =>
        venue.rating >= minRating
      );
    }

    setFilteredVenues(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      if (filterType === 'categories') {
        const categories = [...(prev.categories || [])];
        const index = categories.indexOf(value);
        if (index > -1) {
          categories.splice(index, 1);
        } else {
          categories.push(value);
        }
        newFilters.categories = categories;
      } else {
        newFilters[filterType] = prev[filterType] === value ? null : value;
      }
      
      return newFilters;
    });
  };

  const handleClearFilters = () => {
    setFilters({
      categories: [],
      priceRange: null,
      distance: null,
      rating: null,
    });
  };

  const handleFavorite = (venue) => {
    setVenues(prev => prev.map(v => 
      v.id === venue.id ? { ...v, isFavorite: !v.isFavorite } : v
    ));
  };

  const renderVenueItem = ({ item }) => (
    <VenueSearchItem
      venue={item}
      onPress={onVenueSelect}
      onFavorite={handleFavorite}
    />
  );

  return (
    <View style={styles.container}>
      {/* 検索バー */}
      <View style={styles.searchSection}>
        <SearchBar
          placeholder="店舗名、カテゴリ、タグで検索..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
        />
        <Button
          variant={showFilters ? "primary" : "outline"}
          size="md"
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterToggle}
        >
          フィルター
        </Button>
      </View>

      {/* フィルター */}
      {showFilters && (
        <VenueSearchFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      )}

      {/* 検索結果 */}
      <View style={styles.resultsSection}>
        <Text variant="bodySmall" style={styles.resultsCount}>
          {filteredVenues.length}件の結果
        </Text>
        
        <FlatList
          data={filteredVenues}
          renderItem={renderVenueItem}
          keyExtractor={item => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="body" style={{ color: theme.colors.text.secondary }}>
                検索条件に一致する店舗が見つかりませんでした
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: spacingSystem.layout.container.md,
    paddingVertical: spacingSystem.layout.container.sm,
    gap: spacingSystem.component.gap.md,
    alignItems: 'center',
  },
  
  searchBar: {
    flex: 1,
  },
  
  filterToggle: {
    minWidth: 80,
  },
  
  filtersCard: {
    marginHorizontal: spacingSystem.layout.container.md,
    marginBottom: spacingSystem.layout.container.sm,
    padding: spacingSystem.layout.card.padding,
  },
  
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  clearButton: {
    paddingHorizontal: spacingSystem.component.padding.sm,
  },
  
  filterSection: {
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  filterTitle: {
    marginBottom: spacingSystem.component.margin.sm,
    fontWeight: '600',
    color: colors.text.primary,
  },
  
  filterChip: {
    paddingHorizontal: spacingSystem.component.padding.md,
    paddingVertical: spacingSystem.component.padding.sm,
    borderRadius: borderRadiusSystem.component.badge.small,
    borderWidth: 1,
  },
  
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  resultsSection: {
    flex: 1,
    paddingHorizontal: spacingSystem.layout.container.md,
  },
  
  resultsCount: {
    marginBottom: spacingSystem.component.margin.md,
    color: colors.text.secondary,
  },
  
  resultsList: {
    paddingBottom: spacingSystem.layout.container.lg,
  },
  
  venueCard: {
    padding: spacingSystem.layout.card.padding,
    marginBottom: spacingSystem.layout.card.margin,
  },
  
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacingSystem.component.margin.md,
  },
  
  venueMainInfo: {
    flex: 1,
  },
  
  venueMetrics: {
    flexDirection: 'row',
    gap: spacingSystem.component.gap.sm,
    marginTop: spacingSystem.component.margin.sm,
  },
  
  favoriteButton: {
    padding: spacingSystem.component.padding.sm,
    borderRadius: borderRadiusSystem.component.button.small,
    backgroundColor: colors.background.pinkLight,
    marginLeft: spacingSystem.component.margin.md,
  },
  
  venueDescription: {
    marginBottom: spacingSystem.component.margin.lg,
    lineHeight: 20,
  },
  
  venueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  venueTags: {
    flexDirection: 'row',
    gap: spacingSystem.component.gap.sm,
    flex: 1,
  },
  
  venueStatus: {
    alignItems: 'flex-end',
  },
  
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacingSystem.layout.container.xl,
  },
});

export default VenueSearch;