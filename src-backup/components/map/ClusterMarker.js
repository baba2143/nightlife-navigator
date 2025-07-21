import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { Colors } from '../../design-system/colors-soft-pink';
import { GOOGLE_MAPS_CONFIG } from '../../config/maps';

/**
 * クラスターマーカーコンポーネント
 * 複数の店舗をまとめて表示するマーカー
 */
const ClusterMarker = ({
  cluster,
  onPress = () => {},
  onCalloutPress = () => {},
  showVenueList = true
}) => {
  // クラスターサイズに基づくスタイル
  const clusterStyle = useMemo(() => {
    const size = cluster.venues.length;
    
    if (size < 5) {
      return {
        backgroundColor: Colors.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
      };
    } else if (size < 15) {
      return {
        backgroundColor: Colors.secondary,
        width: 50,
        height: 50,
        borderRadius: 25,
      };
    } else if (size < 30) {
      return {
        backgroundColor: Colors.accent,
        width: 60,
        height: 60,
        borderRadius: 30,
      };
    } else {
      return {
        backgroundColor: Colors.error,
        width: 70,
        height: 70,
        borderRadius: 35,
      };
    }
  }, [cluster.venues.length]);

  // テキストサイズの計算
  const textSize = useMemo(() => {
    const size = cluster.venues.length;
    
    if (size < 10) return 14;
    if (size < 100) return 16;
    return 18;
  }, [cluster.venues.length]);

  // ジャンル別の店舗数を計算
  const venuesByGenre = useMemo(() => {
    const genreCount = {};
    cluster.venues.forEach(venue => {
      const genre = venue.genre || 'other';
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });
    
    return Object.entries(genreCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 4); // 上位4ジャンルまで表示
  }, [cluster.venues]);

  // 平均評価の計算
  const averageRating = useMemo(() => {
    const validRatings = cluster.venues
      .map(venue => venue.rating)
      .filter(rating => rating && rating > 0);
    
    if (validRatings.length === 0) return null;
    
    const sum = validRatings.reduce((acc, rating) => acc + rating, 0);
    return sum / validRatings.length;
  }, [cluster.venues]);

  // 価格帯の分布
  const priceDistribution = useMemo(() => {
    const priceCount = {};
    cluster.venues.forEach(venue => {
      if (venue.priceLevel) {
        priceCount[venue.priceLevel] = (priceCount[venue.priceLevel] || 0) + 1;
      }
    });
    
    return Object.entries(priceCount)
      .sort(([a], [b]) => Number(a) - Number(b));
  }, [cluster.venues]);

  // クラスターマーカーのプレスハンドラ
  const handleMarkerPress = useCallback(() => {
    onPress(cluster);
  }, [cluster, onPress]);

  // コールアウトプレスハンドラ
  const handleCalloutPress = useCallback(() => {
    onCalloutPress(cluster);
  }, [cluster, onCalloutPress]);

  // ジャンルアイコンの取得
  const getGenreIcon = useCallback((genre) => {
    switch (genre) {
      case 'bar':
        return '🍺';
      case 'club':
        return '🎵';
      case 'lounge':
        return '🥂';
      case 'restaurant':
        return '🍽️';
      default:
        return '🏪';
    }
  }, []);

  // ジャンル名の日本語変換
  const getGenreLabel = useCallback((genre) => {
    switch (genre) {
      case 'bar':
        return 'バー';
      case 'club':
        return 'クラブ';
      case 'lounge':
        return 'ラウンジ';
      case 'restaurant':
        return 'レストラン';
      default:
        return 'その他';
    }
  }, []);

  // 価格レベルの表示
  const formatPriceLevel = useCallback((level) => {
    return '¥'.repeat(Number(level));
  }, []);

  return (
    <Marker
      coordinate={{
        latitude: cluster.latitude,
        longitude: cluster.longitude
      }}
      onPress={handleMarkerPress}
      style={styles.markerContainer}
    >
      {/* クラスターマーカー */}
      <View style={[styles.clusterMarker, clusterStyle]}>
        <Text style={[styles.clusterText, { fontSize: textSize }]}>
          {cluster.venues.length}
        </Text>
      </View>

      {/* コールアウト（吹き出し） */}
      <Callout tooltip={true} onPress={handleCalloutPress}>
        <View style={styles.calloutContainer}>
          {/* ヘッダー */}
          <View style={styles.calloutHeader}>
            <Text style={styles.calloutTitle}>
              {cluster.venues.length}店舗のエリア
            </Text>
            {averageRating && (
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingText}>
                  ⭐ {averageRating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          {/* ジャンル分布 */}
          <View style={styles.genreSection}>
            <Text style={styles.sectionTitle}>ジャンル構成</Text>
            <View style={styles.genreList}>
              {venuesByGenre.map(([genre, count]) => (
                <View key={genre} style={styles.genreItem}>
                  <Text style={styles.genreIcon}>
                    {getGenreIcon(genre)}
                  </Text>
                  <Text style={styles.genreLabel}>
                    {getGenreLabel(genre)}
                  </Text>
                  <Text style={styles.genreCount}>
                    {count}店
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 価格帯分布 */}
          {priceDistribution.length > 0 && (
            <View style={styles.priceSection}>
              <Text style={styles.sectionTitle}>価格帯</Text>
              <View style={styles.priceList}>
                {priceDistribution.map(([level, count]) => (
                  <View key={level} style={styles.priceItem}>
                    <Text style={styles.priceLevel}>
                      {formatPriceLevel(level)}
                    </Text>
                    <Text style={styles.priceCount}>
                      {count}店
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 店舗リスト（簡易版） */}
          {showVenueList && cluster.venues.length <= 5 && (
            <View style={styles.venueSection}>
              <Text style={styles.sectionTitle}>店舗一覧</Text>
              {cluster.venues.slice(0, 5).map((venue, index) => (
                <View key={venue.id || index} style={styles.venueItem}>
                  <Text style={styles.venueName} numberOfLines={1}>
                    {venue.name}
                  </Text>
                  <View style={styles.venueInfo}>
                    <Text style={styles.venueGenre}>
                      {getGenreLabel(venue.genre)}
                    </Text>
                    {venue.rating && (
                      <Text style={styles.venueRating}>
                        ⭐ {venue.rating.toFixed(1)}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 詳細表示ボタン */}
          <TouchableOpacity style={styles.detailButton} onPress={handleCalloutPress}>
            <Text style={styles.detailButtonText}>
              エリアを拡大表示
            </Text>
          </TouchableOpacity>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    zIndex: 100,
  },
  clusterMarker: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  clusterText: {
    color: Colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  calloutContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 0,
    minWidth: 280,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  calloutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  calloutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  ratingContainer: {
    backgroundColor: Colors.lightPink,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  genreSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  genreList: {
    gap: 6,
  },
  genreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  genreIcon: {
    fontSize: 16,
    width: 24,
  },
  genreLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    marginLeft: 8,
  },
  genreCount: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  priceSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  priceList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightPink,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceLevel: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: 'bold',
    marginRight: 4,
  },
  priceCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  venueSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  venueItem: {
    marginBottom: 8,
  },
  venueName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  venueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  venueGenre: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  venueRating: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
  detailButton: {
    backgroundColor: Colors.primary,
    margin: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default React.memo(ClusterMarker);