import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

class MapService {
  constructor() {
    this.initialized = false;
    this.currentLocation = null;
    this.listeners = [];
    this.storageKeys = {
      lastLocation: '@nightlife_navigator:last_location',
      settings: '@nightlife_navigator:location_settings',
    };
    this.settings = {
      enableLocation: true,
      trackingAccuracy: 'high', // 'low', 'balanced', 'high', 'highest'
      autoCenter: true,
      showUserLocation: true,
      locationUpdateInterval: 10000, // 10秒
    };
    this.watchLocationId = null;
    this.isWatching = false;
  }

  static getInstance() {
    if (!MapService.instance) {
      MapService.instance = new MapService();
    }
    return MapService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await this.loadSettings();
      await this.loadLastLocation();
      
      if (this.settings.enableLocation) {
        await this.requestLocationPermissions();
        await this.getCurrentLocation();
      }

      this.initialized = true;
      console.log('MapService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MapService:', error);
      throw error;
    }
  }

  async loadSettings() {
    try {
      const stored = await AsyncStorage.getItem(this.storageKeys.settings);
      if (stored) {
        const savedSettings = JSON.parse(stored);
        this.settings = { ...this.settings, ...savedSettings };
      }
    } catch (error) {
      console.error('Failed to load location settings:', error);
    }
  }

  async saveSettings() {
    try {
      await AsyncStorage.setItem(
        this.storageKeys.settings,
        JSON.stringify(this.settings)
      );
    } catch (error) {
      console.error('Failed to save location settings:', error);
    }
  }

  async loadLastLocation() {
    try {
      const stored = await AsyncStorage.getItem(this.storageKeys.lastLocation);
      if (stored) {
        const locationData = JSON.parse(stored);
        this.currentLocation = {
          ...locationData,
          timestamp: new Date(locationData.timestamp),
        };
      }
    } catch (error) {
      console.error('Failed to load last location:', error);
    }
  }

  async saveLastLocation() {
    try {
      if (this.currentLocation) {
        const locationData = {
          ...this.currentLocation,
          timestamp: this.currentLocation.timestamp.toISOString(),
        };
        await AsyncStorage.setItem(
          this.storageKeys.lastLocation,
          JSON.stringify(locationData)
        );
      }
    } catch (error) {
      console.error('Failed to save last location:', error);
    }
  }

  // 位置情報権限の要求
  async requestLocationPermissions() {
    try {
      // まず位置情報サービスが有効かチェック
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        throw new Error('位置情報サービスが無効になっています。設定から有効にしてください。');
      }

      // 権限の確認と要求
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        status = newStatus;
      }

      if (status !== 'granted') {
        throw new Error('位置情報の権限が許可されていません。設定から位置情報を許可してください。');
      }

      return { success: true };
    } catch (error) {
      console.error('Location permission error:', error);
      return { success: false, error: error.message };
    }
  }

  // 現在位置を取得
  async getCurrentLocation() {
    try {
      if (!this.settings.enableLocation) {
        throw new Error('位置情報が無効になっています');
      }

      const accuracy = this.getLocationAccuracy();
      
      const location = await Location.getCurrentPositionAsync({
        accuracy,
        maximumAge: 60000, // 1分間はキャッシュを使用
        timeout: 15000, // 15秒でタイムアウト
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        heading: location.coords.heading,
        speed: location.coords.speed,
        timestamp: new Date(location.timestamp),
      };

      await this.saveLastLocation();
      this.emit('locationUpdated', this.currentLocation);

      return { success: true, location: this.currentLocation };
    } catch (error) {
      console.error('Failed to get current location:', error);
      return { success: false, error: error.message };
    }
  }

  // 位置情報の監視を開始
  async startWatchingLocation() {
    try {
      if (this.isWatching) {
        console.log('Location watching already started');
        return { success: true };
      }

      if (!this.settings.enableLocation) {
        throw new Error('位置情報が無効になっています');
      }

      const accuracy = this.getLocationAccuracy();
      
      this.watchLocationId = await Location.watchPositionAsync(
        {
          accuracy,
          timeInterval: this.settings.locationUpdateInterval,
          distanceInterval: 10, // 10m移動したら更新
        },
        (location) => {
          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            altitude: location.coords.altitude,
            heading: location.coords.heading,
            speed: location.coords.speed,
            timestamp: new Date(location.timestamp),
          };

          this.saveLastLocation();
          this.emit('locationUpdated', this.currentLocation);
        }
      );

      this.isWatching = true;
      this.emit('watchingStarted');
      
      return { success: true };
    } catch (error) {
      console.error('Failed to start watching location:', error);
      return { success: false, error: error.message };
    }
  }

  // 位置情報の監視を停止
  async stopWatchingLocation() {
    try {
      if (!this.isWatching || !this.watchLocationId) {
        console.log('Location watching not active');
        return { success: true };
      }

      await this.watchLocationId.remove();
      this.watchLocationId = null;
      this.isWatching = false;
      
      this.emit('watchingStopped');
      return { success: true };
    } catch (error) {
      console.error('Failed to stop watching location:', error);
      return { success: false, error: error.message };
    }
  }

  // 位置情報の精度設定を取得
  getLocationAccuracy() {
    const accuracyMap = {
      low: Location.Accuracy.Low,
      balanced: Location.Accuracy.Balanced,
      high: Location.Accuracy.High,
      highest: Location.Accuracy.Highest,
    };
    return accuracyMap[this.settings.trackingAccuracy] || Location.Accuracy.High;
  }

  // 2点間の距離を計算（メートル単位）
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // 地球の半径（メートル）
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance);
  }

  // 度をラジアンに変換
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // 住所を座標に変換（ジオコーディング）
  async geocodeAddress(address) {
    try {
      const results = await Location.geocodeAsync(address);
      
      if (results.length === 0) {
        throw new Error('住所が見つかりませんでした');
      }

      const result = results[0];
      return {
        success: true,
        location: {
          latitude: result.latitude,
          longitude: result.longitude,
          address: address,
        }
      };
    } catch (error) {
      console.error('Geocoding failed:', error);
      return { success: false, error: error.message };
    }
  }

  // 座標を住所に変換（逆ジオコーディング）
  async reverseGeocode(latitude, longitude) {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results.length === 0) {
        throw new Error('住所が取得できませんでした');
      }

      const result = results[0];
      const address = [
        result.name,
        result.street,
        result.district,
        result.city,
        result.region,
        result.country,
      ].filter(Boolean).join(', ');

      return {
        success: true,
        address,
        details: result,
      };
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return { success: false, error: error.message };
    }
  }

  // 現在位置周辺の店舗を検索
  async searchNearbyVenues(radius = 1000, category = null) {
    try {
      if (!this.currentLocation) {
        await this.getCurrentLocation();
      }

      if (!this.currentLocation) {
        throw new Error('現在位置を取得できません');
      }

      // モック店舗データ（実際の実装では外部APIを使用）
      const mockVenues = [
        {
          id: 'venue_1',
          name: '渋谷 VISION',
          category: 'club',
          latitude: 35.6581,
          longitude: 139.7006,
          address: '東京都渋谷区道玄坂2-10-7',
          rating: 4.2,
          priceRange: 3,
        },
        {
          id: 'venue_2',
          name: '六本木 バーン',
          category: 'bar',
          latitude: 35.6627,
          longitude: 139.7315,
          address: '東京都港区六本木7-14-10',
          rating: 4.5,
          priceRange: 4,
        },
        {
          id: 'venue_3',
          name: '新宿 ラウンジ アジュール',
          category: 'lounge',
          latitude: 35.6938,
          longitude: 139.7034,
          address: '東京都新宿区歌舞伎町1-1-1',
          rating: 4.0,
          priceRange: 3,
        },
        {
          id: 'venue_4',
          name: '銀座 クラブ エル',
          category: 'club',
          latitude: 35.6724,
          longitude: 139.7656,
          address: '東京都中央区銀座8-5-6',
          rating: 4.3,
          priceRange: 5,
        },
        {
          id: 'venue_5',
          name: '恵比寿 カクテル バー',
          category: 'bar',
          latitude: 35.6467,
          longitude: 139.7101,
          address: '東京都渋谷区恵比寿1-20-8',
          rating: 4.1,
          priceRange: 3,
        }
      ];

      // 距離でフィルタリング
      const nearbyVenues = mockVenues
        .map(venue => ({
          ...venue,
          distance: this.calculateDistance(
            this.currentLocation.latitude,
            this.currentLocation.longitude,
            venue.latitude,
            venue.longitude
          )
        }))
        .filter(venue => venue.distance <= radius)
        .filter(venue => !category || venue.category === category)
        .sort((a, b) => a.distance - b.distance);

      return {
        success: true,
        venues: nearbyVenues,
        center: this.currentLocation,
        radius,
      };
    } catch (error) {
      console.error('Failed to search nearby venues:', error);
      return { success: false, error: error.message };
    }
  }

  // 設定を更新
  async updateSettings(newSettings) {
    try {
      const oldSettings = { ...this.settings };
      this.settings = { ...this.settings, ...newSettings };
      await this.saveSettings();

      // 位置情報が無効になった場合は監視を停止
      if (!this.settings.enableLocation && this.isWatching) {
        await this.stopWatchingLocation();
      }

      // 位置情報が有効になった場合は権限を確認
      if (this.settings.enableLocation && !oldSettings.enableLocation) {
        await this.requestLocationPermissions();
      }

      this.emit('settingsUpdated', this.settings);
      return { success: true };
    } catch (error) {
      console.error('Failed to update location settings:', error);
      return { success: false, error: error.message };
    }
  }

  // 現在位置を取得
  getCurrentLocation() {
    return this.currentLocation;
  }

  // 設定を取得
  getSettings() {
    return { ...this.settings };
  }

  // 監視中かどうか
  isWatchingLocation() {
    return this.isWatching;
  }

  // マップ領域を計算
  calculateMapRegion(venues, padding = 0.01) {
    if (!venues || venues.length === 0) {
      // デフォルトは東京都心
      return {
        latitude: 35.6762,
        longitude: 139.6503,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }

    const lats = venues.map(venue => venue.latitude);
    const lngs = venues.map(venue => venue.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latDelta = (maxLat - minLat) + padding;
    const lngDelta = (maxLng - minLng) + padding;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  }

  // イベントシステム
  addEventListener(eventType, callback) {
    this.listeners.push({ eventType, callback });
  }

  removeEventListener(eventType, callback) {
    this.listeners = this.listeners.filter(
      listener => listener.eventType !== eventType || listener.callback !== callback
    );
  }

  emit(eventType, data) {
    this.listeners
      .filter(listener => listener.eventType === eventType)
      .forEach(listener => {
        try {
          listener.callback(data);
        } catch (error) {
          console.error(`Error in map event listener for ${eventType}:`, error);
        }
      });
  }

  async cleanup() {
    try {
      await this.stopWatchingLocation();
      this.listeners = [];
      this.currentLocation = null;
      this.initialized = false;
      console.log('MapService cleaned up');
    } catch (error) {
      console.error('Failed to cleanup MapService:', error);
    }
  }
}

export default MapService.getInstance();