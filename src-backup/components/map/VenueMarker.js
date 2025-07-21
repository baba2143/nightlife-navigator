import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { Colors } from '../../design-system/colors-soft-pink';
import { GOOGLE_MAPS_CONFIG } from '../../config/maps';

/**
 * 店舗マーカーコンポーネント
 * 地図上に店舗を表示するためのマーカー
 */
const VenueMarker = ({
  venue,
  isSelected = false,
  onPress = () => {},
  onCalloutPress = () => {},
  showRating = true,
  showDistance = false,
  distance = null,
  customIcon = null,
  size = 'medium'
}) => {
  const [imageError, setImageError] = useState(false);

  // マーカーサイズの設定
  const markerSize = useMemo(() => {
    switch (size) {
      case 'small':
        return { width: 30, height: 30 };
      case 'large':
        return { width: 50, height: 50 };
      default:
        return { width: 40, height: 40 };
    }
  }, [size]);

  // マーカーアイコンの取得
  const getMarkerIcon = useCallback(() => {
    if (customIcon) {
      return customIcon;
    }

    if (isSelected) {
      return GOOGLE_MAPS_CONFIG.MARKER_ICONS.SELECTED;
    }

    switch (venue.genre) {
      case 'bar':
        return GOOGLE_MAPS_CONFIG.MARKER_ICONS.BAR;
      case 'club':
        return GOOGLE_MAPS_CONFIG.MARKER_ICONS.CLUB;
      case 'lounge':
        return GOOGLE_MAPS_CONFIG.MARKER_ICONS.LOUNGE;
      case 'restaurant':
        return GOOGLE_MAPS_CONFIG.MARKER_ICONS.RESTAURANT;
      default:
        return GOOGLE_MAPS_CONFIG.MARKER_ICONS.BAR;
    }
  }, [venue.genre, isSelected, customIcon]);

  // マーカーカラーの取得
  const getMarkerColor = useCallback(() => {
    if (isSelected) {
      return Colors.accent;
    }

    switch (venue.genre) {
      case 'bar':
        return Colors.primary;
      case 'club':
        return Colors.secondary;
      case 'lounge':
        return Colors.tertiary;
      case 'restaurant':
        return Colors.quaternary;
      default:
        return Colors.primary;
    }
  }, [venue.genre, isSelected]);

  // 営業状況の取得
  const getOpenStatus = useCallback(() => {
    if (!venue.businessHours) return null;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const todayHours = venue.businessHours[currentDay];
    if (!todayHours || todayHours.closed) {
      return { isOpen: false, status: '本日休業' };
    }

    const openTime = todayHours.open.hours * 60 + todayHours.open.minutes;
    const closeTime = todayHours.close.hours * 60 + todayHours.close.minutes;

    // 24時間営業の場合
    if (openTime === closeTime) {
      return { isOpen: true, status: '24時間営業' };
    }

    // 日をまたぐ営業時間の場合
    if (closeTime < openTime) {
      const isOpen = currentTime >= openTime || currentTime <= closeTime;
      return {
        isOpen,
        status: isOpen ? '営業中' : '営業終了'
      };
    }

    // 通常の営業時間の場合
    const isOpen = currentTime >= openTime && currentTime <= closeTime;
    return {
      isOpen,
      status: isOpen ? '営業中' : '営業終了'
    };
  }, [venue.businessHours]);

  // 距離の表示フォーマット
  const formatDistance = useCallback((dist) => {
    if (!dist) return '';
    
    if (dist < 1000) {
      return `${Math.round(dist)}m`;
    }
    return `${(dist / 1000).toFixed(1)}km`;
  }, []);

  // 評価の表示フォーマット
  const formatRating = useCallback((rating) => {
    if (!rating) return 'N/A';
    return rating.toFixed(1);
  }, []);

  // 価格レベルの表示
  const getPriceLevel = useCallback(() => {
    if (!venue.priceLevel) return '';
    
    return '¥'.repeat(venue.priceLevel);
  }, [venue.priceLevel]);

  // マーカープレスハンドラ
  const handleMarkerPress = useCallback(() => {
    onPress(venue);
  }, [venue, onPress]);

  // コールアウトプレスハンドラ
  const handleCalloutPress = useCallback(() => {
    onCalloutPress(venue);
  }, [venue, onCalloutPress]);

  const markerIcon = getMarkerIcon();
  const markerColor = getMarkerColor();
  const openStatus = getOpenStatus();

  return (
    <Marker
      coordinate={{
        latitude: venue.latitude,
        longitude: venue.longitude
      }}
      onPress={handleMarkerPress}
      image={!imageError ? markerIcon?.url : undefined}
      pinColor={imageError ? markerColor : undefined}
      style={isSelected ? styles.selectedMarker : undefined}
    >
      {/* カスタムマーカー（画像エラー時のフォールバック） */}
      {imageError && (
        <View style={[
          styles.customMarker,
          { backgroundColor: markerColor },
          markerSize,
          isSelected && styles.selectedCustomMarker
        ]}>
          <Text style={styles.markerText}>
            {venue.genre === 'bar' ? '🍺' :
             venue.genre === 'club' ? '🎵' :
             venue.genre === 'lounge' ? '🥂' :
             venue.genre === 'restaurant' ? '🍽️' : '🏪'}
          </Text>
        </View>
      )}

      {/* コールアウト（吹き出し） */}
      <Callout tooltip={true} onPress={handleCalloutPress}>
        <View style={styles.calloutContainer}>
          {/* 店舗画像 */}
          {venue.imageUrl && (
            <Image
              source={{ uri: venue.imageUrl }}
              style={styles.calloutImage}
              onError={() => setImageError(true)}
            />
          )}

          {/* 店舗情報 */}
          <View style={styles.calloutContent}>
            {/* 店舗名 */}
            <Text style={styles.calloutTitle} numberOfLines={2}>
              {venue.name}
            </Text>

            {/* ジャンル */}
            <Text style={styles.calloutGenre}>
              {venue.genre}
            </Text>

            {/* 評価と価格レベル */}
            <View style={styles.calloutMetrics}>
              {showRating && venue.rating && (
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingText}>
                    ⭐ {formatRating(venue.rating)}
                  </Text>
                </View>
              )}
              
              {venue.priceLevel && (
                <Text style={styles.priceLevel}>
                  {getPriceLevel()}
                </Text>
              )}
            </View>

            {/* 営業状況 */}
            {openStatus && (
              <View style={[
                styles.statusContainer,
                { backgroundColor: openStatus.isOpen ? Colors.success : Colors.error }
              ]}>
                <Text style={styles.statusText}>
                  {openStatus.status}
                </Text>
              </View>
            )}

            {/* 距離 */}
            {showDistance && distance && (
              <Text style={styles.distanceText}>
                📍 {formatDistance(distance)}
              </Text>
            )}

            {/* 住所 */}
            {venue.address && (
              <Text style={styles.addressText} numberOfLines={2}>
                {venue.address}
              </Text>
            )}

            {/* 特徴・タグ */}
            {venue.tags && venue.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {venue.tags.slice(0, 3).map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 詳細を見るボタン */}
            <TouchableOpacity style={styles.detailButton} onPress={handleCalloutPress}>
              <Text style={styles.detailButtonText}>詳細を見る</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  selectedMarker: {
    zIndex: 1000,
  },
  customMarker: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedCustomMarker: {
    borderColor: Colors.accent,
    borderWidth: 3,
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  markerText: {
    fontSize: 16,
  },
  calloutContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 0,
    minWidth: 250,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  calloutImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: Colors.lightGray,
  },
  calloutContent: {
    padding: 12,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  calloutGenre: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  calloutMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingContainer: {
    marginRight: 12,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  priceLevel: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  statusContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '500',
  },
  distanceText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  addressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: Colors.lightPink,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  detailButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
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

export default React.memo(VenueMarker);