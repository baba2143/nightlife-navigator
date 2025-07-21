import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BarCard from '../components/BarCard';
import { useFavorites } from '../context/AppContext';
import { colors, typography } from '../styles';

export default function HomeScreen({
  bars,
  onBarPress,
  onModeSwitch,
  userMode,
  onNavigateToMap,
  onNavigateToFavorites,
  onNavigateToSearch,
  onNavigateToCoupons,
  onNavigateToNotifications,
  onNavigateToSubscription,
  onNavigateToAdminLogin,
  onToggleFavorite,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const { isFavorite } = useFavorites();

  const filteredBars = bars.filter(
    (bar) =>
      bar.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bar.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = () => {
    if (onNavigateToSearch) {
      onNavigateToSearch();
    }
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>
            NightLife Navigator
          </Text>
          <TouchableOpacity
            style={styles.modeSwitchButton}
            onPress={onModeSwitch}
          >
            <Text style={styles.modeSwitchText}>
              {userMode === 'user' ? '👤' : '🏪'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          {userMode === 'user' ? 'ユーザーモード' : 'オーナーモード'}
        </Text>
      </View>

      {/* 検索バー */}
      <View style={styles.searchContainer}>
        <TouchableOpacity style={styles.searchBar} onPress={handleSearch}>
          <Text style={styles.searchPlaceholder}>
            🔍 バーを検索...
          </Text>
        </TouchableOpacity>
      </View>

      {/* クイックアクション（画面切り替えボタン） */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={onNavigateToMap}
        >
          <Text style={styles.quickActionIcon}>🗺️</Text>
          <Text style={styles.quickActionText}>地図</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={onNavigateToFavorites}
        >
          <Text style={styles.quickActionIcon}>❤️</Text>
          <Text style={styles.quickActionText}>お気に入り</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={onNavigateToCoupons}
        >
          <Text style={styles.quickActionIcon}>🎫</Text>
          <Text style={styles.quickActionText}>クーポン</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={onNavigateToNotifications}
        >
          <Text style={styles.quickActionIcon}>📢</Text>
          <Text style={styles.quickActionText}>通知</Text>
        </TouchableOpacity>

        {userMode === 'owner' && (
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={onNavigateToSubscription}
          >
            <Text style={styles.quickActionIcon}>💳</Text>
            <Text style={styles.quickActionText}>課金</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={onNavigateToAdminLogin}
        >
          <Text style={styles.quickActionIcon}>⚙️</Text>
          <Text style={styles.quickActionText}>管理</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={handleSearch}
        >
          <Text style={styles.quickActionIcon}>🔍</Text>
          <Text style={styles.quickActionText}>検索</Text>
        </TouchableOpacity>
      </View>

      {/* おすすめバー */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            🌟 おすすめバー
          </Text>
          <TouchableOpacity onPress={handleSearch}>
            <Text style={styles.viewAllLink}>
              すべて見る →
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.barsScrollView}
        >
          {filteredBars.slice(0, 5).map((bar) => (
            <View key={bar.id} style={styles.barCardContainer}>
              <BarCard
                bar={bar}
                onPress={() => onBarPress(bar)}
                onToggleFavorite={() => onToggleFavorite(bar.id)}
                isFavorite={isFavorite(bar.id)}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 新着バー */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            🆕 新着バー
          </Text>
          <TouchableOpacity onPress={handleSearch}>
            <Text style={styles.viewAllLink}>
              すべて見る →
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.barsScrollView}
        >
          {filteredBars.slice(5, 10).map((bar) => (
            <View key={bar.id} style={styles.barCardContainer}>
              <BarCard
                bar={bar}
                onPress={() => onBarPress(bar)}
                onToggleFavorite={() => onToggleFavorite(bar.id)}
                isFavorite={isFavorite(bar.id)}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 高評価バー */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            ⭐ 高評価バー
          </Text>
          <TouchableOpacity onPress={handleSearch}>
            <Text style={styles.viewAllLink}>
              すべて見る →
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.barsScrollView}
        >
          {filteredBars
            .filter((bar) => bar.rating >= 4.5)
            .slice(0, 5)
            .map((bar) => (
              <View key={bar.id} style={styles.barCardContainer}>
                <BarCard
                  bar={bar}
                  onPress={() => onBarPress(bar)}
                  onToggleFavorite={() => onToggleFavorite(bar.id)}
                  isFavorite={isFavorite(bar.id)}
                />
              </View>
            ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 80,
  },
  header: {
    backgroundColor: colors.surface,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.secondary,
  },
  modeSwitchButton: {
    padding: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  modeSwitchText: {
    fontSize: typography.sizes.lg,
    color: colors.secondary,
  },
  headerSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
  },
  searchContainer: {
    padding: 20,
    paddingTop: 15,
  },
  searchBar: {
    backgroundColor: colors.surfaceLight,
    padding: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchPlaceholder: {
    color: colors.textTertiary,
    fontSize: typography.sizes.base,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  quickActionButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 80,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  quickActionText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    fontWeight: typography.weights.semibold,
  },
  section: {
    marginBottom: 25,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.secondary,
  },
  viewAllLink: {
    fontSize: typography.sizes.base,
    color: colors.secondary,
    fontWeight: typography.weights.semibold,
  },
  barsScrollView: {
    paddingLeft: 0,
  },
  barCardContainer: {
    marginRight: 15,
  },
}); 