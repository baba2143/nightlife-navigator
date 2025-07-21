/**
 * 地図統合コンポーネント
 * Nightlife Navigator固有の地図表示機能
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Modal, Alert } from 'react-native';
import { colors } from '../../design-system/colors-soft-pink';
import { spacingSystem } from '../../design-system/spacing-comfortable';
import { borderRadiusSystem } from '../../design-system/borders-rounded';
import { shadowSystem } from '../../design-system/shadows-soft-pink';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Text } from '../ui/Text';
import { Flex } from '../ui/Layout';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 地図マーカーコンポーネント
const VenueMarker = ({ venue, isSelected, onPress }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const getCategoryColor = (category) => {
    const categoryColors = {
      bar: theme.colors.secondary[600],
      club: theme.colors.accent[600],
      lounge: theme.colors.brand,
      restaurant: theme.colors.success[600],
      karaoke: theme.colors.warning[600],
      pub: theme.colors.error[500],
    };
    return categoryColors[category] || theme.colors.brand;
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

  return (
    <TouchableOpacity
      style={[
        styles.marker,
        {
          backgroundColor: getCategoryColor(venue.category),
          borderColor: isSelected ? theme.colors.white : 'transparent',
          borderWidth: isSelected ? 3 : 0,
          ...theme.shadows.elevation[isSelected ? 3 : 2],
        },
      ]}
      onPress={() => onPress(venue)}
    >
      <Text style={styles.markerText}>
        {getCategoryIcon(venue.category)}
      </Text>
      {isSelected && (
        <View style={[styles.markerLabel, { backgroundColor: getCategoryColor(venue.category) }]}>
          <Text variant="caption" style={styles.markerLabelText}>
            {venue.name}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// 地図コントロールボタン
const MapControls = ({ 
  onZoomIn, 
  onZoomOut, 
  onLocationCenter, 
  onLayerToggle, 
  showTraffic,
  style 
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  return (
    <View style={[styles.mapControls, style]}>
      <TouchableOpacity
        style={[styles.controlButton, { backgroundColor: theme.colors.background.surface }]}
        onPress={onZoomIn}
      >
        <Text variant="h3" style={{ color: theme.colors.text.primary }}>+</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.controlButton, { backgroundColor: theme.colors.background.surface }]}
        onPress={onZoomOut}
      >
        <Text variant="h3" style={{ color: theme.colors.text.primary }}>−</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.controlButton, { backgroundColor: theme.colors.background.surface }]}
        onPress={onLocationCenter}
      >
        <Text variant="body" style={{ color: theme.colors.brand }}>📍</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.controlButton,
          {
            backgroundColor: showTraffic ? theme.colors.brand : theme.colors.background.surface,
          },
        ]}
        onPress={onLayerToggle}
      >
        <Text variant="body" style={{ color: showTraffic ? theme.colors.white : theme.colors.text.primary }}>
          🚗
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// 地図底部の店舗情報カード
const VenueInfoCard = ({ venue, onClose, onViewDetails, onGetDirections }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  if (!venue) return null;

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
    <Card variant="elevated" style={styles.venueInfoCard}>
      <View style={styles.venueInfoHeader}>
        <View style={styles.venueInfoMain}>
          <Text variant="h4" style={{ color: theme.colors.brand }}>
            {getCategoryIcon(venue.category)} {venue.name}
          </Text>
          <Text variant="bodySmall" color="textSecondary">
            {venue.address}
          </Text>
          <View style={styles.venueInfoMetrics}>
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
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text variant="body" style={{ color: theme.colors.text.tertiary }}>×</Text>
        </TouchableOpacity>
      </View>

      <Text variant="bodySmall" style={styles.venueInfoDescription}>
        {venue.description}
      </Text>

      <View style={styles.venueInfoActions}>
        <Button
          variant="primary"
          size="sm"
          onPress={() => onViewDetails(venue)}
          style={styles.actionButton}
        >
          詳細を見る
        </Button>
        <Button
          variant="outline"
          size="sm"
          onPress={() => onGetDirections(venue)}
          style={styles.actionButton}
        >
          道順を見る
        </Button>
      </View>
    </Card>
  );
};

// 地図フィルターコンポーネント
const MapFilters = ({ filters, onFilterChange, visible, onClose }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const categories = [
    { id: 'all', label: 'すべて', icon: '🏪' },
    { id: 'bar', label: 'バー', icon: '🍸' },
    { id: 'club', label: 'クラブ', icon: '🎵' },
    { id: 'lounge', label: 'ラウンジ', icon: '🛋️' },
    { id: 'restaurant', label: 'レストラン', icon: '🍽️' },
    { id: 'karaoke', label: 'カラオケ', icon: '🎤' },
    { id: 'pub', label: 'パブ', icon: '🍺' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text variant="h3" style={{ color: theme.colors.brand }}>
              地図フィルター
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text variant="h3" style={{ color: theme.colors.text.tertiary }}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text variant="bodySmall" style={styles.filterTitle}>
              表示する店舗カテゴリ
            </Text>
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    {
                      backgroundColor: filters.category === category.id
                        ? theme.colors.brand
                        : theme.colors.background.surface,
                      borderColor: filters.category === category.id
                        ? theme.colors.brand
                        : theme.colors.border.medium,
                    },
                  ]}
                  onPress={() => onFilterChange('category', category.id)}
                >
                  <Text variant="body" style={styles.categoryIcon}>
                    {category.icon}
                  </Text>
                  <Text
                    variant="caption"
                    style={{
                      color: filters.category === category.id
                        ? theme.colors.white
                        : theme.colors.text.primary,
                    }}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalActions}>
            <Button
              variant="outline"
              onPress={() => onFilterChange('category', 'all')}
              style={styles.modalActionButton}
            >
              リセット
            </Button>
            <Button
              variant="primary"
              onPress={onClose}
              style={styles.modalActionButton}
            >
              適用
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// メイン地図コンポーネント
const VenueMap = ({ venues = [], selectedVenue, onVenueSelect, onVenueDetails }) => {
  const [mapRegion, setMapRegion] = useState({
    latitude: 35.6762,
    longitude: 139.6503,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [showTraffic, setShowTraffic] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
  });
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);

  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  // サンプル店舗データ（座標付き）
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
      coordinate: { latitude: 35.6762, longitude: 139.6503 },
      isOpen: true,
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
      coordinate: { latitude: 35.6900, longitude: 139.7000 },
      isOpen: true,
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
      coordinate: { latitude: 35.6650, longitude: 139.7310 },
      isOpen: false,
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
      coordinate: { latitude: 35.6950, longitude: 139.7050 },
      isOpen: true,
    },
  ];

  const displayVenues = venues.length > 0 ? venues : sampleVenues;

  const filteredVenues = displayVenues.filter(venue => {
    if (filters.category === 'all') return true;
    return venue.category === filters.category;
  });

  const handleZoomIn = () => {
    setMapRegion(prev => ({
      ...prev,
      latitudeDelta: prev.latitudeDelta * 0.5,
      longitudeDelta: prev.longitudeDelta * 0.5,
    }));
  };

  const handleZoomOut = () => {
    setMapRegion(prev => ({
      ...prev,
      latitudeDelta: prev.latitudeDelta * 2,
      longitudeDelta: prev.longitudeDelta * 2,
    }));
  };

  const handleLocationCenter = () => {
    // 現在位置を取得してマップを中心に移動
    setMapRegion({
      latitude: 35.6762,
      longitude: 139.6503,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const handleLayerToggle = () => {
    setShowTraffic(!showTraffic);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleGetDirections = (venue) => {
    Alert.alert(
      '道順を表示',
      `${venue.name}への道順を表示しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'はい', onPress: () => {
          // 実際の実装では地図アプリを開く
          console.log('Getting directions to', venue.name);
        }},
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* 地図エリア（疑似実装） */}
      <View style={styles.mapContainer}>
        <View style={[styles.mapPlaceholder, { backgroundColor: theme.colors.background.pinkLight }]}>
          <Text variant="body" style={{ color: theme.colors.text.secondary }}>
            地図エリア
          </Text>
          <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
            実際の実装では地図ライブラリを使用
          </Text>
          
          {/* 店舗マーカー */}
          {filteredVenues.map(venue => (
            <VenueMarker
              key={venue.id}
              venue={venue}
              isSelected={selectedVenue?.id === venue.id}
              onPress={onVenueSelect}
            />
          ))}
        </View>
        
        {/* 地図コントロール */}
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onLocationCenter={handleLocationCenter}
          onLayerToggle={handleLayerToggle}
          showTraffic={showTraffic}
          style={styles.mapControlsPosition}
        />
        
        {/* フィルターボタン */}
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: theme.colors.brand }]}
          onPress={() => setShowFilters(true)}
        >
          <Text variant="body" style={{ color: theme.colors.white }}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* 選択された店舗の情報カード */}
      {selectedVenue && (
        <VenueInfoCard
          venue={selectedVenue}
          onClose={() => onVenueSelect(null)}
          onViewDetails={onVenueDetails}
          onGetDirections={handleGetDirections}
        />
      )}

      {/* フィルターモーダル */}
      <MapFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        visible={showFilters}
        onClose={() => setShowFilters(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  
  marker: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  
  markerText: {
    fontSize: 20,
  },
  
  markerLabel: {
    position: 'absolute',
    top: -35,
    left: '50%',
    transform: [{ translateX: -50 }],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  
  markerLabelText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  
  mapControls: {
    position: 'absolute',
    right: spacingSystem.layout.container.md,
    top: spacingSystem.layout.container.lg,
    gap: spacingSystem.component.gap.sm,
  },
  
  mapControlsPosition: {
    // Applied in component
  },
  
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadiusSystem.component.button.medium,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadowSystem.elevation[2],
  },
  
  filterButton: {
    position: 'absolute',
    left: spacingSystem.layout.container.md,
    top: spacingSystem.layout.container.lg,
    width: 48,
    height: 48,
    borderRadius: borderRadiusSystem.component.button.medium,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadowSystem.elevation[2],
  },
  
  venueInfoCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    margin: spacingSystem.layout.container.md,
    padding: spacingSystem.layout.card.padding,
  },
  
  venueInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacingSystem.component.margin.sm,
  },
  
  venueInfoMain: {
    flex: 1,
  },
  
  venueInfoMetrics: {
    flexDirection: 'row',
    gap: spacingSystem.component.gap.sm,
    marginTop: spacingSystem.component.margin.sm,
  },
  
  closeButton: {
    padding: spacingSystem.component.padding.sm,
    marginLeft: spacingSystem.component.margin.md,
  },
  
  venueInfoDescription: {
    marginBottom: spacingSystem.component.margin.md,
    lineHeight: 18,
  },
  
  venueInfoActions: {
    flexDirection: 'row',
    gap: spacingSystem.component.gap.md,
  },
  
  actionButton: {
    flex: 1,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  
  modalContent: {
    backgroundColor: colors.background.surface,
    borderTopLeftRadius: borderRadiusSystem.component.modal.large,
    borderTopRightRadius: borderRadiusSystem.component.modal.large,
    padding: spacingSystem.layout.container.lg,
    maxHeight: screenHeight * 0.8,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  filterSection: {
    marginBottom: spacingSystem.component.margin.xl,
  },
  
  filterTitle: {
    marginBottom: spacingSystem.component.margin.md,
    fontWeight: '600',
    color: colors.text.primary,
  },
  
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacingSystem.component.gap.md,
  },
  
  categoryItem: {
    width: (screenWidth - spacingSystem.layout.container.lg * 2 - spacingSystem.component.gap.md * 2) / 3,
    aspectRatio: 1,
    borderRadius: borderRadiusSystem.component.card.medium,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacingSystem.component.gap.xs,
  },
  
  categoryIcon: {
    fontSize: 24,
  },
  
  modalActions: {
    flexDirection: 'row',
    gap: spacingSystem.component.gap.md,
  },
  
  modalActionButton: {
    flex: 1,
  },
});

export default VenueMap;