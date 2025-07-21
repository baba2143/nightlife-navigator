import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet
} from 'react-native';
import { BARS } from '../constants/data';
import { colors, typography, spacing, borderRadius } from '../styles';

export default function SearchScreen({ onBack, onBarSelect, favorites, onToggleFavorite }) {
  const [searchText, setSearchText] = useState('');

  const filteredBars = BARS.filter(bar => 
    bar.name.toLowerCase().includes(searchText.toLowerCase()) ||
    bar.genre.toLowerCase().includes(searchText.toLowerCase()) ||
    bar.area.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>店舗検索</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="店名、ジャンル、エリアで検索..."
          placeholderTextColor="#888"
          value={searchText}
          onChangeText={setSearchText}
          autoFocus
        />
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => console.log('検索実行')}
        >
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.searchResultCount}>
          {filteredBars.length}件の店舗が見つかりました
        </Text>

        {filteredBars.map((bar) => {
          const isFavorite = favorites.includes(bar.id);
          
          return (
            <TouchableOpacity 
              key={bar.id}
              style={styles.searchResultCard}
              onPress={() => onBarSelect && onBarSelect(bar)}
            >
              <View style={styles.searchResultImage}>
                <Text style={styles.searchResultIcon}>
                  {bar.genre === 'スナック／パブ' ? '🍺' :
                   bar.genre === 'コンカフェ' ? '☕' :
                   bar.genre === 'クラブ／ラウンジ' ? '🍸' : '🏪'}
                </Text>
                {bar.isOpenNow && (
                  <View style={styles.openBadge}>
                    <Text style={styles.openBadgeText}>営業中</Text>
                  </View>
                )}
              </View>
              <View style={styles.searchResultContent}>
                <View style={styles.searchResultHeader}>
                  <Text style={styles.searchResultName}>{bar.name}</Text>
                  <TouchableOpacity
                    onPress={() => onToggleFavorite && onToggleFavorite(bar.id)}
                    style={styles.favoriteButton}
                  >
                    <Text style={styles.favoriteButtonText}>
                      {isFavorite ? '❤️' : '🤍'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.searchResultGenre}>{bar.genre}</Text>
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultRating}>⭐ {bar.rating}</Text>
                  <Text style={styles.searchResultArea}>{bar.area}</Text>
                  <Text style={styles.searchResultPrice}>{bar.priceRange}</Text>
                </View>
                <Text style={styles.searchResultDistance}>📍 {bar.distance}m</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    backgroundColor: colors.surface,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  headerTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.primary,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8
  },
  backButton: {
    fontSize: typography.sizes.lg,
    color: colors.primary,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.base,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: typography.sizes.base,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 15,
    justifyContent: 'center',
    borderRadius: borderRadius.base,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4
  },
  searchButtonText: {
    fontSize: 20
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 80
  },
  searchResultCount: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: 15,
    textShadowColor: colors.secondary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2
  },
  searchResultCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  searchResultImage: {
    width: 80,
    height: 80,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRightWidth: 1,
    borderRightColor: colors.border
  },
  searchResultIcon: {
    fontSize: 30
  },
  openBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 2
  },
  openBadgeText: {
    color: colors.text,
    fontSize: 8,
    fontWeight: typography.weights.semibold
  },
  searchResultContent: {
    flex: 1,
    padding: 12
  },
  searchResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  searchResultName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
    flex: 1,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3
  },
  searchResultGenre: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    marginBottom: 5,
    fontWeight: typography.weights.semibold,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2
  },
  searchResultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 5
  },
  searchResultRating: {
    fontSize: typography.sizes.sm,
    color: colors.accent,
    textShadowColor: colors.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2
  },
  searchResultArea: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary
  },
  searchResultPrice: {
    fontSize: typography.sizes.sm,
    color: colors.secondary,
    textShadowColor: colors.secondary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2
  },
  searchResultDistance: {
    fontSize: typography.sizes.sm,
    color: colors.textTertiary
  },
  favoriteButton: {
    padding: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.primary
  },
  favoriteButtonText: {
    fontSize: 20
  }
}); 