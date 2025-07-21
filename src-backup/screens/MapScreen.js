import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Alert,
  StatusBar,
} from 'react-native';
import { Colors } from '../design-system/colors-soft-pink';
import MapComponent from '../components/MapComponent';
import MapFilter from '../components/map/MapFilter';
import MapSearch from '../components/map/MapSearch';
import NavigationPanel from '../components/map/NavigationPanel';
import RouteOverlay from '../components/map/RouteOverlay';
import venueMapService from '../services/VenueMapService';
import routeService from '../services/RouteService';
import locationService from '../services/LocationService';

/**
 * 地図画面
 * 統合された地図機能を提供
 */
export default function MapScreen({ navigation, route: routeParams }) {
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [filterConfig, setFilterConfig] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [showNavigation, setShowNavigation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapRef = useRef(null);

  // 初期化
  useEffect(() => {
    initializeMap();
    loadVenues();
    
    return () => {
      // クリーンアップ
      venueMapService.reset();
      routeService.cleanup();
    };
  }, []);

  // 地図の初期化
  const initializeMap = useCallback(async () => {
    try {
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);
      
      const initialRegion = {
        ...location,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setMapRegion(initialRegion);
    } catch (error) {
      console.error('地図初期化エラー:', error);
      // デフォルトで東京駅周辺を表示
      setMapRegion({
        latitude: 35.6762,
        longitude: 139.6503,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, []);

  // 店舗データの読み込み
  const loadVenues = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // サンプル店舗データ（実際のAPIから取得）
      const sampleVenues = [
        {
          id: '1',
          name: 'Bar TOKYO',
          latitude: 35.6762,
          longitude: 139.6503,
          genre: 'bar',
          rating: 4.5,
          priceLevel: 3,
          address: '東京都千代田区丸の内1-1-1',
          imageUrl: null,
          isOpenNow: true,
          features: ['wifi', 'smoking', 'credit_card'],
          businessHours: {
            0: { open: { hours: 18, minutes: 0 }, close: { hours: 2, minutes: 0 } },
            1: { open: { hours: 18, minutes: 0 }, close: { hours: 2, minutes: 0 } },
            2: { open: { hours: 18, minutes: 0 }, close: { hours: 2, minutes: 0 } },
            3: { open: { hours: 18, minutes: 0 }, close: { hours: 2, minutes: 0 } },
            4: { open: { hours: 18, minutes: 0 }, close: { hours: 2, minutes: 0 } },
            5: { open: { hours: 18, minutes: 0 }, close: { hours: 3, minutes: 0 } },
            6: { open: { hours: 18, minutes: 0 }, close: { hours: 3, minutes: 0 } },
          }
        },
        {
          id: '2',
          name: 'Club Shibuya',
          latitude: 35.6598,
          longitude: 139.7006,
          genre: 'club',
          rating: 4.2,
          priceLevel: 4,
          address: '東京都渋谷区道玄坂2-1-1',
          imageUrl: null,
          isOpenNow: true,
          features: ['dance_floor', 'live_music', 'credit_card'],
          businessHours: {
            0: { closed: true },
            1: { closed: true },
            2: { closed: true },
            3: { closed: true },
            4: { open: { hours: 22, minutes: 0 }, close: { hours: 5, minutes: 0 } },
            5: { open: { hours: 22, minutes: 0 }, close: { hours: 5, minutes: 0 } },
            6: { open: { hours: 22, minutes: 0 }, close: { hours: 5, minutes: 0 } },
          }
        },
        {
          id: '3',
          name: 'Lounge Roppongi',
          latitude: 35.6627,
          longitude: 139.7311,
          genre: 'lounge',
          rating: 4.7,
          priceLevel: 4,
          address: '東京都港区六本木6-1-1',
          imageUrl: null,
          isOpenNow: false,
          features: ['terrace', 'private_room', 'wifi', 'credit_card'],
          businessHours: {
            0: { open: { hours: 19, minutes: 0 }, close: { hours: 3, minutes: 0 } },
            1: { open: { hours: 19, minutes: 0 }, close: { hours: 3, minutes: 0 } },
            2: { open: { hours: 19, minutes: 0 }, close: { hours: 3, minutes: 0 } },
            3: { open: { hours: 19, minutes: 0 }, close: { hours: 3, minutes: 0 } },
            4: { open: { hours: 19, minutes: 0 }, close: { hours: 4, minutes: 0 } },
            5: { open: { hours: 19, minutes: 0 }, close: { hours: 4, minutes: 0 } },
            6: { open: { hours: 19, minutes: 0 }, close: { hours: 2, minutes: 0 } },
          }
        },
        {
          id: '4',
          name: 'Restaurant Ginza',
          latitude: 35.6762,
          longitude: 139.7651,
          genre: 'restaurant',
          rating: 4.3,
          priceLevel: 3,
          address: '東京都中央区銀座4-1-1',
          imageUrl: null,
          isOpenNow: true,
          features: ['reservation', 'private_room', 'credit_card'],
          businessHours: {
            0: { closed: true },
            1: { open: { hours: 18, minutes: 0 }, close: { hours: 23, minutes: 0 } },
            2: { open: { hours: 18, minutes: 0 }, close: { hours: 23, minutes: 0 } },
            3: { open: { hours: 18, minutes: 0 }, close: { hours: 23, minutes: 0 } },
            4: { open: { hours: 18, minutes: 0 }, close: { hours: 23, minutes: 0 } },
            5: { open: { hours: 18, minutes: 0 }, close: { hours: 24, minutes: 0 } },
            6: { open: { hours: 18, minutes: 0 }, close: { hours: 24, minutes: 0 } },
          }
        }
      ];

      // 現在地からの距離を計算
      if (currentLocation) {
        const venuesWithDistance = sampleVenues.map(venue => ({
          ...venue,
          distance: locationService.calculateDistance(currentLocation, {
            latitude: venue.latitude,
            longitude: venue.longitude
          })
        }));
        setVenues(venuesWithDistance);
      } else {
        setVenues(sampleVenues);
      }
    } catch (error) {
      console.error('店舗データ読み込みエラー:', error);
      setError('店舗データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation]);

  // 店舗選択ハンドラ
  const handleVenueSelect = useCallback((venue) => {
    setSelectedVenue(venue);
  }, []);

  // 地図プレスハンドラ
  const handleMapPress = useCallback(() => {
    setSelectedVenue(null);
    setActiveRoute(null);
    setShowNavigation(false);
  }, []);

  // 地図領域変更ハンドラ
  const handleRegionChange = useCallback((region) => {
    setMapRegion(region);
  }, []);

  // フィルター適用ハンドラ
  const handleApplyFilters = useCallback((filters) => {
    setFilterConfig(filters);
  }, []);

  // 場所選択ハンドラ（検索）
  const handleLocationSelect = useCallback((location) => {
    const newRegion = {
      ...location.coordinates,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setMapRegion(newRegion);
  }, []);

  // ルート検索
  const handleGetDirections = useCallback(async (venue) => {
    try {
      if (!currentLocation) {
        Alert.alert('エラー', '現在地を取得できません');
        return;
      }

      setIsLoading(true);
      
      const destination = {
        latitude: venue.latitude,
        longitude: venue.longitude,
      };

      const route = await routeService.getDirections(currentLocation, destination);
      
      setActiveRoute(route);
      setShowNavigation(true);
    } catch (error) {
      console.error('ルート検索エラー:', error);
      Alert.alert('エラー', 'ルート検索に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation]);

  // ナビゲーション開始ハンドラ
  const handleStartNavigation = useCallback(() => {
    console.log('ナビゲーション開始');
  }, []);

  // ナビゲーション停止ハンドラ
  const handleStopNavigation = useCallback(() => {
    setActiveRoute(null);
    setShowNavigation(false);
  }, []);

  // 現在地に移動
  const handleMoveToCurrentLocation = useCallback(async () => {
    try {
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);
      
      const newRegion = {
        ...location,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(newRegion);
    } catch (error) {
      Alert.alert('エラー', '現在地を取得できませんでした');
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* 地図コンポーネント */}
      <MapComponent
        ref={mapRef}
        venues={venues}
        selectedVenue={selectedVenue}
        onVenueSelect={handleVenueSelect}
        onMapPress={handleMapPress}
        region={mapRegion}
        onRegionChange={handleRegionChange}
        filterConfig={filterConfig}
        showUserLocation={true}
        clustersEnabled={true}
        themeMode="light"
        style={styles.map}
      />

      {/* ルートオーバーレイ */}
      {activeRoute && (
        <RouteOverlay
          route={activeRoute}
          strokeColor={Colors.primary}
          strokeWidth={4}
        />
      )}

      {/* ヘッダーコントロール */}
      <View style={styles.headerControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowSearch(true)}
        >
          <Text style={styles.controlButtonText}>🔍</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowFilter(true)}
        >
          <Text style={styles.controlButtonText}>⚙️</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleMoveToCurrentLocation}
        >
          <Text style={styles.controlButtonText}>📍</Text>
        </TouchableOpacity>
      </View>

      {/* 店舗情報パネル */}
      {selectedVenue && !showNavigation && (
        <View style={styles.venuePanel}>
          <View style={styles.venuePanelContent}>
            <Text style={styles.venueTitle}>{selectedVenue.name}</Text>
            <Text style={styles.venueGenre}>{selectedVenue.genre}</Text>
            <View style={styles.venueStats}>
              <Text style={styles.venueRating}>
                ⭐ {selectedVenue.rating?.toFixed(1)}
              </Text>
              <Text style={styles.venuePrice}>
                {'¥'.repeat(selectedVenue.priceLevel)}
              </Text>
              {selectedVenue.distance && (
                <Text style={styles.venueDistance}>
                  📍 {selectedVenue.distance < 1000 
                    ? `${Math.round(selectedVenue.distance)}m`
                    : `${(selectedVenue.distance / 1000).toFixed(1)}km`
                  }
                </Text>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.directionsButton}
            onPress={() => handleGetDirections(selectedVenue)}
          >
            <Text style={styles.directionsButtonText}>ルート</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ナビゲーションパネル */}
      {showNavigation && activeRoute && (
        <NavigationPanel
          route={activeRoute}
          onClose={() => setShowNavigation(false)}
          onStartNavigation={handleStartNavigation}
          onStopNavigation={handleStopNavigation}
          expanded={true}
        />
      )}

      {/* フィルターモーダル */}
      <MapFilter
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={filterConfig || {}}
      />

      {/* 検索モーダル */}
      <MapSearch
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onLocationSelect={handleLocationSelect}
      />

      {/* ローディング表示 */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      )}

      {/* エラー表示 */}
      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => {
              setError(null);
              loadVenues();
            }}
          >
            <Text style={styles.errorButtonText}>再試行</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  map: {
    flex: 1,
  },
  headerControls: {
    position: 'absolute',
    top: 60,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.white,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  controlButtonText: {
    fontSize: 20,
  },
  venuePanel: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  venuePanelContent: {
    flex: 1,
  },
  venueTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  venueGenre: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  venueStats: {
    flexDirection: 'row',
    gap: 12,
  },
  venueRating: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  venuePrice: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  venueDistance: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  directionsButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  directionsButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  errorOverlay: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: Colors.error,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    color: Colors.white,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorButton: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorButtonText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
}); 