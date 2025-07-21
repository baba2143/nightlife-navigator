/**
 * お気に入り機能コンポーネント
 * Nightlife Navigator固有のお気に入り管理機能
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Share } from 'react-native';
import { colors } from '../../design-system/colors-soft-pink';
import { spacingSystem } from '../../design-system/spacing-comfortable';
import { borderRadiusSystem } from '../../design-system/borders-rounded';
import { shadowSystem } from '../../design-system/shadows-soft-pink';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Text } from '../ui/Text';
import { Flex } from '../ui/Layout';
import { SearchBar } from '../ui/SearchBar';

// お気に入りアイテムコンポーネント
const FavoriteItem = ({ venue, onRemove, onViewDetails, onShare }) => {
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleRemove = () => {
    Alert.alert(
      'お気に入りから削除',
      `${venue.name}をお気に入りから削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: () => onRemove(venue.id) },
      ]
    );
  };

  return (
    <TouchableOpacity onPress={() => onViewDetails(venue)}>
      <Card variant="elevated" style={styles.favoriteItem}>
        <View style={styles.favoriteHeader}>
          <View style={styles.favoriteMainInfo}>
            <Text variant="h4" style={{ color: theme.colors.brand }}>
              {getCategoryIcon(venue.category)} {venue.name}
            </Text>
            <Text variant="bodySmall" color="textSecondary">
              {venue.address}
            </Text>
            <View style={styles.favoriteMetrics}>
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
            style={styles.favoriteHeart}
            onPress={handleRemove}
          >
            <Text variant="h3" style={{ color: theme.colors.error[500] }}>
              ❤️
            </Text>
          </TouchableOpacity>
        </View>

        <Text variant="bodySmall" style={styles.favoriteDescription}>
          {venue.description}
        </Text>

        <View style={styles.favoriteFooter}>
          <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
            {formatDate(venue.favoriteDate)}に追加
          </Text>
          <View style={styles.favoriteActions}>
            <TouchableOpacity
              style={styles.favoriteAction}
              onPress={() => onShare(venue)}
            >
              <Text variant="caption" style={{ color: theme.colors.brand }}>
                共有
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.favoriteAction}
              onPress={() => onViewDetails(venue)}
            >
              <Text variant="caption" style={{ color: theme.colors.brand }}>
                詳細
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

// お気に入りカテゴリフィルター
const FavoriteFilters = ({ categories, selectedCategory, onCategorySelect }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const allCategories = [
    { id: 'all', label: 'すべて', icon: '🏪', count: categories.reduce((sum, cat) => sum + cat.count, 0) },
    ...categories,
  ];

  return (
    <View style={styles.filterContainer}>
      <FlatList
        data={allCategories}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedCategory === item.id
                  ? theme.colors.brand
                  : theme.colors.background.surface,
                borderColor: selectedCategory === item.id
                  ? theme.colors.brand
                  : theme.colors.border.medium,
              },
            ]}
            onPress={() => onCategorySelect(item.id)}
          >
            <Text variant="body" style={styles.filterIcon}>
              {item.icon}
            </Text>
            <Text
              variant="caption"
              style={[
                styles.filterLabel,
                {
                  color: selectedCategory === item.id
                    ? theme.colors.white
                    : theme.colors.text.secondary,
                },
              ]}
            >
              {item.label}
            </Text>
            <Badge
              variant={selectedCategory === item.id ? 'primary' : 'outline'}
              size="sm"
              style={styles.filterCount}
            >
              {item.count}
            </Badge>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
      />
    </View>
  );
};

// お気に入りソート
const FavoriteSorter = ({ sortBy, onSortChange }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const sortOptions = [
    { value: 'recent', label: '最近追加' },
    { value: 'name', label: '名前順' },
    { value: 'rating', label: '評価順' },
    { value: 'distance', label: '距離順' },
  ];

  return (
    <View style={styles.sorterContainer}>
      <Text variant="caption" style={styles.sorterLabel}>
        並び替え:
      </Text>
      <View style={styles.sorterOptions}>
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.sorterOption,
              {
                backgroundColor: sortBy === option.value
                  ? theme.colors.brand
                  : theme.colors.background.surface,
                borderColor: sortBy === option.value
                  ? theme.colors.brand
                  : theme.colors.border.medium,
              },
            ]}
            onPress={() => onSortChange(option.value)}
          >
            <Text
              variant="caption"
              style={{
                color: sortBy === option.value
                  ? theme.colors.white
                  : theme.colors.text.secondary,
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// お気に入り統計
const FavoriteStats = ({ favorites }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const totalFavorites = favorites.length;
  const averageRating = totalFavorites > 0
    ? favorites.reduce((sum, venue) => sum + venue.rating, 0) / totalFavorites
    : 0;

  const categoryStats = favorites.reduce((stats, venue) => {
    const category = venue.category;
    stats[category] = (stats[category] || 0) + 1;
    return stats;
  }, {});

  const mostFavoriteCategory = Object.keys(categoryStats).reduce((a, b) =>
    categoryStats[a] > categoryStats[b] ? a : b
  , '');

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

  const getCategoryLabel = (category) => {
    const labels = {
      bar: 'バー',
      club: 'クラブ',
      lounge: 'ラウンジ',
      restaurant: 'レストラン',
      karaoke: 'カラオケ',
      pub: 'パブ',
    };
    return labels[category] || category;
  };

  return (
    <Card variant="soft" style={styles.statsCard}>
      <Text variant="h4" style={[styles.statsTitle, { color: theme.colors.brand }]}>
        お気に入り統計
      </Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text variant="h2" style={[styles.statValue, { color: theme.colors.brand }]}>
            {totalFavorites}
          </Text>
          <Text variant="caption" style={styles.statLabel}>
            お気に入り店舗数
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text variant="h2" style={[styles.statValue, { color: theme.colors.brand }]}>
            {averageRating.toFixed(1)}
          </Text>
          <Text variant="caption" style={styles.statLabel}>
            平均評価
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text variant="h2" style={[styles.statValue, { color: theme.colors.brand }]}>
            {getCategoryIcon(mostFavoriteCategory)}
          </Text>
          <Text variant="caption" style={styles.statLabel}>
            {getCategoryLabel(mostFavoriteCategory)}が最多
          </Text>
        </View>
      </View>
    </Card>
  );
};

// メインお気に入り管理コンポーネント
const FavoriteManager = ({ onVenueSelect }) => {
  const [favorites, setFavorites] = useState([]);
  const [filteredFavorites, setFilteredFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [loading, setLoading] = useState(false);

  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  // サンプルお気に入りデータ
  const sampleFavorites = [
    {
      id: 1,
      name: "GENTLE LOUNGE",
      category: "lounge",
      address: "渋谷区渋谷1-2-3",
      rating: 4.8,
      priceRange: "expensive",
      distance: 250,
      description: "やさしいピンクの温かみのあるデザインで、心地よい雰囲気を演出。",
      favoriteDate: "2024-01-15T19:30:00Z",
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
      favoriteDate: "2024-01-10T20:15:00Z",
    },
    {
      id: 3,
      name: "KARAOKE FRIENDS",
      category: "karaoke",
      address: "新宿区歌舞伎町1-5-6",
      rating: 4.0,
      priceRange: "budget",
      distance: 600,
      description: "友達との楽しい時間を過ごせるアットホームなカラオケ。",
      favoriteDate: "2024-01-05T21:00:00Z",
    },
    {
      id: 4,
      name: "TOKYO DINING",
      category: "restaurant",
      address: "港区六本木3-4-5",
      rating: 4.3,
      priceRange: "expensive",
      distance: 1200,
      description: "高級感あふれるダイニングレストラン。",
      favoriteDate: "2024-01-01T18:00:00Z",
    },
  ];

  useEffect(() => {
    setFavorites(sampleFavorites);
    setFilteredFavorites(sampleFavorites);
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [favorites, searchQuery, selectedCategory, sortBy]);

  const applyFiltersAndSort = () => {
    let filtered = [...favorites];

    // テキスト検索
    if (searchQuery.trim()) {
      filtered = filtered.filter(venue =>
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // カテゴリフィルター
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(venue => venue.category === selectedCategory);
    }

    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.favoriteDate) - new Date(a.favoriteDate);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return b.rating - a.rating;
        case 'distance':
          return a.distance - b.distance;
        default:
          return 0;
      }
    });

    setFilteredFavorites(filtered);
  };

  const getCategories = () => {
    const categoryCount = favorites.reduce((count, venue) => {
      count[venue.category] = (count[venue.category] || 0) + 1;
      return count;
    }, {});

    const categoryLabels = {
      bar: 'バー',
      club: 'クラブ',
      lounge: 'ラウンジ',
      restaurant: 'レストラン',
      karaoke: 'カラオケ',
      pub: 'パブ',
    };

    const categoryIcons = {
      bar: '🍸',
      club: '🎵',
      lounge: '🛋️',
      restaurant: '🍽️',
      karaoke: '🎤',
      pub: '🍺',
    };

    return Object.keys(categoryCount).map(category => ({
      id: category,
      label: categoryLabels[category] || category,
      icon: categoryIcons[category] || '🏪',
      count: categoryCount[category],
    }));
  };

  const handleRemoveFavorite = (venueId) => {
    setFavorites(prev => prev.filter(venue => venue.id !== venueId));
  };

  const handleShareFavorite = async (venue) => {
    try {
      await Share.share({
        message: `${venue.name}をチェック！\n${venue.description}\n評価: ${venue.rating}★`,
        title: venue.name,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleViewDetails = (venue) => {
    onVenueSelect?.(venue);
  };

  const handleClearAllFavorites = () => {
    Alert.alert(
      'すべてのお気に入りを削除',
      'お気に入りをすべて削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: () => setFavorites([]) },
      ]
    );
  };

  const renderFavoriteItem = ({ item }) => (
    <FavoriteItem
      venue={item}
      onRemove={handleRemoveFavorite}
      onViewDetails={handleViewDetails}
      onShare={handleShareFavorite}
    />
  );

  return (
    <View style={styles.container}>
      {/* 統計 */}
      <FavoriteStats favorites={favorites} />

      {/* 検索バー */}
      <View style={styles.searchSection}>
        <SearchBar
          placeholder="お気に入りを検索..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* フィルター */}
      <FavoriteFilters
        categories={getCategories()}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      {/* ソート */}
      <FavoriteSorter
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* アクションボタン */}
      <View style={styles.actionsSection}>
        <Text variant="bodySmall" style={{ color: theme.colors.text.secondary }}>
          {filteredFavorites.length}件のお気に入り
        </Text>
        {favorites.length > 0 && (
          <TouchableOpacity onPress={handleClearAllFavorites}>
            <Text variant="caption" style={{ color: theme.colors.error[500] }}>
              すべて削除
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* お気に入りリスト */}
      <FlatList
        data={filteredFavorites}
        renderItem={renderFavoriteItem}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.favoritesList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="h3" style={{ color: theme.colors.text.secondary }}>
              💔
            </Text>
            <Text variant="body" style={{ color: theme.colors.text.secondary }}>
              {searchQuery || selectedCategory !== 'all'
                ? '検索条件に一致するお気に入りがありません'
                : 'まだお気に入りがありません'}
            </Text>
            <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
              店舗詳細からハートをタップしてお気に入りに追加
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  
  // 統計
  statsCard: {
    margin: spacingSystem.layout.container.md,
    padding: spacingSystem.layout.card.padding,
  },
  
  statsTitle: {
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  statItem: {
    alignItems: 'center',
    gap: spacingSystem.component.gap.sm,
  },
  
  statValue: {
    // Set by variant
  },
  
  statLabel: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
  
  // 検索
  searchSection: {
    paddingHorizontal: spacingSystem.layout.container.md,
    marginBottom: spacingSystem.component.margin.md,
  },
  
  searchBar: {
    // No additional styles needed
  },
  
  // フィルター
  filterContainer: {
    paddingHorizontal: spacingSystem.layout.container.md,
    marginBottom: spacingSystem.component.margin.md,
  },
  
  filterList: {
    gap: spacingSystem.component.gap.sm,
  },
  
  filterChip: {
    paddingHorizontal: spacingSystem.component.padding.md,
    paddingVertical: spacingSystem.component.padding.sm,
    borderRadius: borderRadiusSystem.component.badge.small,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingSystem.component.gap.xs,
  },
  
  filterIcon: {
    fontSize: 16,
  },
  
  filterLabel: {
    fontSize: 12,
  },
  
  filterCount: {
    marginLeft: spacingSystem.component.margin.xs,
  },
  
  // ソート
  sorterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacingSystem.layout.container.md,
    marginBottom: spacingSystem.component.margin.md,
    gap: spacingSystem.component.gap.md,
  },
  
  sorterLabel: {
    color: colors.text.secondary,
  },
  
  sorterOptions: {
    flexDirection: 'row',
    gap: spacingSystem.component.gap.sm,
  },
  
  sorterOption: {
    paddingHorizontal: spacingSystem.component.padding.md,
    paddingVertical: spacingSystem.component.padding.sm,
    borderRadius: borderRadiusSystem.component.badge.small,
    borderWidth: 1,
  },
  
  // アクション
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacingSystem.layout.container.md,
    marginBottom: spacingSystem.component.margin.md,
  },
  
  // お気に入りリスト
  favoritesList: {
    paddingHorizontal: spacingSystem.layout.container.md,
    paddingBottom: spacingSystem.layout.container.xl,
  },
  
  favoriteItem: {
    padding: spacingSystem.layout.card.padding,
    marginBottom: spacingSystem.layout.card.margin,
  },
  
  favoriteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacingSystem.component.margin.sm,
  },
  
  favoriteMainInfo: {
    flex: 1,
  },
  
  favoriteMetrics: {
    flexDirection: 'row',
    gap: spacingSystem.component.gap.sm,
    marginTop: spacingSystem.component.margin.sm,
  },
  
  favoriteHeart: {
    padding: spacingSystem.component.padding.sm,
    marginLeft: spacingSystem.component.margin.md,
  },
  
  favoriteDescription: {
    lineHeight: 18,
    marginBottom: spacingSystem.component.margin.md,
  },
  
  favoriteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  favoriteActions: {
    flexDirection: 'row',
    gap: spacingSystem.component.gap.lg,
  },
  
  favoriteAction: {
    padding: spacingSystem.component.padding.sm,
  },
  
  // 空状態
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacingSystem.layout.container.xl,
    gap: spacingSystem.component.gap.md,
  },
});

export default FavoriteManager;