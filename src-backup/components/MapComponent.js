import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, Alert, Platform, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, Circle, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { GOOGLE_MAPS_CONFIG, MAP_STYLES } from '../config/maps';
import locationService from '../services/LocationService';
import venueMapService from '../services/VenueMapService';
import { Colors } from '../design-system/colors-soft-pink';
import VenueMarker from './map/VenueMarker';
import ClusterMarker from './map/ClusterMarker';

/**
 * インタラクティブな地図コンポーネント
 */
const MapComponent = ({
  venues = [],
  selectedVenue = null,
  onVenueSelect = () => {},
  onMapPress = () => {},
  region = null,
  showUserLocation = true,
  showRadius = false,
  radius = 1000,
  style = {},
  mapStyle = 'standard',
  clustersEnabled = true,
  showControls = true,
  onRegionChange = () => {},
  filterConfig = null,
  themeMode = 'light'
}) => {
  const mapRef = useRef(null);
  const [currentRegion, setCurrentRegion] = useState(
    region || GOOGLE_MAPS_CONFIG.DEFAULT_REGION
  );
  const [userLocation, setUserLocation] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [visibleVenues, setVisibleVenues] = useState([]);
  const [clusters, setClusters] = useState([]);

  // 地図スタイルの設定
  const customMapStyle = useMemo(() => {
    switch (themeMode) {
      case 'dark':
        return MAP_STYLES.NIGHT;
      case 'pink':
        return MAP_STYLES.PINK;
      default:
        return MAP_STYLES.STANDARD;
    }
  }, [themeMode]);

  // 初期化
  useEffect(() => {
    initializeMap();
    return () => {
      locationService.stopWatchingLocation();
    };
  }, []);

  // 地図の初期化
  const initializeMap = useCallback(async () => {
    try {
      if (showUserLocation) {
        const hasPermission = await locationService.requestPermissions();
        if (hasPermission) {
          await updateUserLocation();
          startLocationTracking();
        }
      }
    } catch (error) {
      console.error('地図初期化エラー:', error);
      Alert.alert('エラー', '地図の初期化に失敗しました');
    }
  }, [showUserLocation]);

  // ユーザーの現在地を更新
  const updateUserLocation = useCallback(async () => {
    try {
      const location = await locationService.getCurrentLocation();
      setUserLocation(location);
      
      // 初回のみ現在地に移動
      if (!region && mapRef.current) {
        const newRegion = {
          ...location,
          latitudeDelta: GOOGLE_MAPS_CONFIG.DEFAULT_REGION.latitudeDelta,
          longitudeDelta: GOOGLE_MAPS_CONFIG.DEFAULT_REGION.longitudeDelta,
        };
        setCurrentRegion(newRegion);
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      console.error('現在地取得エラー:', error);
    }
  }, [region]);

  // 位置情報の追跡開始
  const startLocationTracking = useCallback(() => {
    locationService.startWatchingLocation(
      (location) => {
        setUserLocation(location);
      },
      {
        accuracy: 'balanced',
        timeInterval: 10000, // 10秒間隔
        distanceInterval: 50, // 50m移動で更新
      }
    );
  }, []);

  // 店舗データの処理
  useEffect(() => {
    if (venues.length > 0) {
      venueMapService.setVenues(venues);
      venueMapService.setFilterConfig(filterConfig);
      processVenues();
    }
  }, [venues, currentRegion, filterConfig]);

  // 表示する店舗の処理とクラスタリング
  const processVenues = useCallback(() => {
    // 地図領域の境界を設定
    const bounds = {
      northeast: {
        latitude: currentRegion.latitude + currentRegion.latitudeDelta / 2,
        longitude: currentRegion.longitude + currentRegion.longitudeDelta / 2,
      },
      southwest: {
        latitude: currentRegion.latitude - currentRegion.latitudeDelta / 2,
        longitude: currentRegion.longitude - currentRegion.longitudeDelta / 2,
      }
    };

    venueMapService.setSearchBounds(bounds);
    
    if (clustersEnabled) {
      venueMapService.updateClusters(currentRegion);
    }

    const filteredVenues = venueMapService.getFilteredVenues();
    const clusteredData = clustersEnabled ? venueMapService.getClusters() : [];

    setVisibleVenues(filteredVenues);
    setClusters(clusteredData);
  }, [venues, currentRegion, filterConfig, clustersEnabled]);

  // フィルター適用
  const applyFilters = useCallback((venueList, filters) => {
    return venueList.filter(venue => {
      if (filters.genre && filters.genre.length > 0) {
        if (!filters.genre.includes(venue.genre)) return false;
      }
      
      if (filters.priceRange) {
        if (venue.averagePrice < filters.priceRange.min || 
            venue.averagePrice > filters.priceRange.max) return false;
      }
      
      if (filters.rating && venue.rating < filters.rating) return false;
      
      if (filters.distance && userLocation) {
        const distance = locationService.calculateDistance(
          userLocation,
          { latitude: venue.latitude, longitude: venue.longitude }
        );
        if (distance > filters.distance) return false;
      }
      
      if (filters.openNow && !venue.isOpenNow) return false;
      
      return true;
    });
  }, [userLocation]);

  // 店舗が表示領域内にあるかチェック
  const isVenueInRegion = useCallback((venue, region) => {
    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    return (
      venue.latitude >= latitude - latitudeDelta / 2 &&
      venue.latitude <= latitude + latitudeDelta / 2 &&
      venue.longitude >= longitude - longitudeDelta / 2 &&
      venue.longitude <= longitude + longitudeDelta / 2
    );
  }, []);

  // クラスタリング処理
  const createClusters = useCallback((venueList, region) => {
    const clusters = [];
    const clusterRadius = GOOGLE_MAPS_CONFIG.CLUSTERING.RADIUS;
    const processed = new Set();

    venueList.forEach((venue, index) => {
      if (processed.has(index)) return;

      const cluster = {
        id: `cluster_${index}`,
        latitude: venue.latitude,
        longitude: venue.longitude,
        venues: [venue],
      };

      // 周辺の店舗をクラスターに追加
      venueList.forEach((otherVenue, otherIndex) => {
        if (index === otherIndex || processed.has(otherIndex)) return;

        const distance = locationService.calculateDistance(
          { latitude: venue.latitude, longitude: venue.longitude },
          { latitude: otherVenue.latitude, longitude: otherVenue.longitude }
        );

        if (distance <= clusterRadius) {
          cluster.venues.push(otherVenue);
          processed.add(otherIndex);
        }
      });

      processed.add(index);

      // クラスター中心を計算
      if (cluster.venues.length > 1) {
        const avgLat = cluster.venues.reduce((sum, v) => sum + v.latitude, 0) / cluster.venues.length;
        const avgLng = cluster.venues.reduce((sum, v) => sum + v.longitude, 0) / cluster.venues.length;
        cluster.latitude = avgLat;
        cluster.longitude = avgLng;
      }

      clusters.push(cluster);
    });

    return clusters;
  }, []);

  // 地図の領域変更ハンドラ
  const handleRegionChange = useCallback((newRegion) => {
    setCurrentRegion(newRegion);
    onRegionChange(newRegion);
  }, [onRegionChange]);

  // 店舗マーカーのタップハンドラ
  const handleMarkerPress = useCallback((venue) => {
    onVenueSelect(venue);
    
    // 選択された店舗に地図を移動
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: venue.latitude,
        longitude: venue.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  }, [onVenueSelect]);

  // クラスターマーカーのタップハンドラ
  const handleClusterPress = useCallback((cluster) => {
    if (mapRef.current) {
      // クラスター内の全店舗を含む領域を計算
      const bounds = calculateBounds(cluster.venues);
      mapRef.current.fitToCoordinates(
        cluster.venues.map(venue => ({
          latitude: venue.latitude,
          longitude: venue.longitude
        })),
        {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        }
      );
    }
  }, []);

  // 境界計算
  const calculateBounds = useCallback((venues) => {
    if (venues.length === 0) return null;
    
    let minLat = venues[0].latitude;
    let maxLat = venues[0].latitude;
    let minLng = venues[0].longitude;
    let maxLng = venues[0].longitude;
    
    venues.forEach(venue => {
      minLat = Math.min(minLat, venue.latitude);
      maxLat = Math.max(maxLat, venue.latitude);
      minLng = Math.min(minLng, venue.longitude);
      maxLng = Math.max(maxLng, venue.longitude);
    });
    
    return { minLat, maxLat, minLng, maxLng };
  }, []);

  // 現在地に移動
  const moveToUserLocation = useCallback(async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location && mapRef.current) {
        const newRegion = {
          ...location,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      Alert.alert('エラー', '現在地を取得できませんでした');
    }
  }, []);

  // 店舗に移動
  const moveToVenue = useCallback((venue) => {
    if (mapRef.current && venue.latitude && venue.longitude) {
      const newRegion = {
        latitude: venue.latitude,
        longitude: venue.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  }, []);

  // 全店舗を表示
  const fitToVenues = useCallback(() => {
    if (mapRef.current && visibleVenues.length > 0) {
      mapRef.current.fitToCoordinates(
        visibleVenues.map(venue => ({
          latitude: venue.latitude,
          longitude: venue.longitude
        })),
        {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true,
        }
      );
    }
  }, [visibleVenues]);

  // マーカーアイコンの取得
  const getMarkerIcon = useCallback((venue, isSelected = false) => {
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
  }, []);

  // クラスターマーカーのレンダリング
  const renderClusterMarker = useCallback((cluster) => {
    const size = cluster.venues.length;
    let clusterStyle;
    
    if (size < 10) {
      clusterStyle = styles.clusterSmall;
    } else if (size < 25) {
      clusterStyle = styles.clusterMedium;
    } else {
      clusterStyle = styles.clusterLarge;
    }

    return (
      <Marker
        key={cluster.id}
        coordinate={{
          latitude: cluster.latitude,
          longitude: cluster.longitude
        }}
        onPress={() => handleClusterPress(cluster)}
      >
        <View style={[styles.clusterMarker, clusterStyle]}>
          <Text style={styles.clusterText}>{size}</Text>
        </View>
      </Marker>
    );
  }, [handleClusterPress]);

  // 店舗マーカーのレンダリング
  const renderVenueMarker = useCallback((venue) => {
    const isSelected = selectedVenue && selectedVenue.id === venue.id;
    const markerIcon = getMarkerIcon(venue, isSelected);

    return (
      <Marker
        key={venue.id}
        coordinate={{
          latitude: venue.latitude,
          longitude: venue.longitude
        }}
        onPress={() => handleMarkerPress(venue)}
        image={markerIcon.url}
      >
        <Callout>
          <View style={styles.calloutContainer}>
            <Text style={styles.calloutTitle}>{venue.name}</Text>
            <Text style={styles.calloutSubtitle}>{venue.genre}</Text>
            <Text style={styles.calloutRating}>⭐ {venue.rating?.toFixed(1) || 'N/A'}</Text>
          </View>
        </Callout>
      </Marker>
    );
  }, [selectedVenue, getMarkerIcon, handleMarkerPress]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        region={currentRegion}
        onRegionChangeComplete={handleRegionChange}
        onMapReady={() => setMapReady(true)}
        onPress={onMapPress}
        showsUserLocation={showUserLocation && !!userLocation}
        showsMyLocationButton={false}
        showsCompass={GOOGLE_MAPS_CONFIG.CONTROLS.COMPASS}
        showsScale={GOOGLE_MAPS_CONFIG.CONTROLS.SCALE}
        rotateEnabled={GOOGLE_MAPS_CONFIG.CONTROLS.ROTATE}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
        customMapStyle={customMapStyle}
        minZoomLevel={GOOGLE_MAPS_CONFIG.ZOOM_LEVELS.MIN}
        maxZoomLevel={GOOGLE_MAPS_CONFIG.ZOOM_LEVELS.MAX}
      >
        {/* 検索半径の表示 */}
        {showRadius && userLocation && (
          <Circle
            center={userLocation}
            radius={radius}
            strokeColor={Colors.primary}
            fillColor={`${Colors.primary}20`}
            strokeWidth={2}
          />
        )}

        {/* クラスターマーカー */}
        {clusters.length > 0 && 
          clusters.map(cluster => 
            cluster.venues.length > 1 ? (
              <ClusterMarker
                key={cluster.id}
                cluster={cluster}
                onPress={handleClusterPress}
                onCalloutPress={handleClusterPress}
              />
            ) : null
          )
        }

        {/* 店舗マーカー */}
        {clusters.length === 0 && 
          visibleVenues.map(venue => (
            <VenueMarker
              key={venue.id}
              venue={venue}
              isSelected={selectedVenue && selectedVenue.id === venue.id}
              onPress={handleMarkerPress}
              onCalloutPress={onVenueSelect}
              showDistance={showUserLocation && userLocation}
              distance={venue.distance}
            />
          ))
        }

        {/* 単独店舗マーカー（クラスター外） */}
        {clusters.length > 0 && 
          clusters
            .filter(cluster => cluster.venues.length === 1)
            .map(cluster => (
              <VenueMarker
                key={cluster.venues[0].id}
                venue={cluster.venues[0]}
                isSelected={selectedVenue && selectedVenue.id === cluster.venues[0].id}
                onPress={handleMarkerPress}
                onCalloutPress={onVenueSelect}
                showDistance={showUserLocation && userLocation}
                distance={cluster.venues[0].distance}
              />
            ))
        }
      </MapView>

      {/* 地図コントロール */}
      {showControls && (
        <MapControls
          onUserLocationPress={moveToUserLocation}
          onFitToVenuesPress={fitToVenues}
          userLocation={userLocation}
          venuesCount={visibleVenues.length}
        />
      )}
    </View>
  );
};

// 地図コントロールコンポーネント
const MapControls = ({ onUserLocationPress, onFitToVenuesPress, userLocation, venuesCount }) => (
  <View style={styles.controlsContainer}>
    {userLocation && (
      <TouchableOpacity style={styles.controlButton} onPress={onUserLocationPress}>
        <Text style={styles.controlButtonText}>📍</Text>
      </TouchableOpacity>
    )}
    {venuesCount > 0 && (
      <TouchableOpacity style={styles.controlButton} onPress={onFitToVenuesPress}>
        <Text style={styles.controlButtonText}>🗺️</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    top: 50,
    right: 15,
    flexDirection: 'column',
  },
  controlButton: {
    backgroundColor: Colors.white,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  controlButtonText: {
    fontSize: 20,
  },
  calloutContainer: {
    width: 200,
    padding: 10,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  calloutSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  calloutRating: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  clusterMarker: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  clusterSmall: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
  },
  clusterMedium: {
    backgroundColor: Colors.secondary,
    width: 50,
    height: 50,
  },
  clusterLarge: {
    backgroundColor: Colors.accent,
    width: 60,
    height: 60,
  },
  clusterText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default React.memo(MapComponent);