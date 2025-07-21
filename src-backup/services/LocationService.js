import * as Location from 'expo-location';
import { GOOGLE_MAPS_CONFIG } from '../config/maps';

/**
 * 位置情報サービス
 * ユーザーの現在地取得、住所変換、距離計算などを管理
 */
class LocationService {
  constructor() {
    this.currentLocation = null;
    this.watchId = null;
    this.isWatching = false;
    this.permissionStatus = null;
    this.locationCache = new Map();
    this.geocodingCache = new Map();
  }

  /**
   * 位置情報の権限を確認・要求
   * @returns {Promise<boolean>} 権限が許可されたかどうか
   */
  async requestPermissions() {
    try {
      // 位置情報サービスが有効かチェック
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        throw new Error('位置情報サービスが無効になっています');
      }

      // 現在の権限ステータスを確認
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      
      if (currentStatus === 'granted') {
        this.permissionStatus = 'granted';
        return true;
      }

      // 権限を要求
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.permissionStatus = status;

      if (status === 'granted') {
        // バックグラウンド位置情報の権限も要求（必要に応じて）
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        console.log('Background permission:', backgroundStatus);
        return true;
      }

      return false;
    } catch (error) {
      console.error('位置情報権限エラー:', error);
      throw new Error(GOOGLE_MAPS_CONFIG.ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
    }
  }

  /**
   * 現在地を取得
   * @param {Object} options - 取得オプション
   * @returns {Promise<Object>} 位置情報
   */
  async getCurrentLocation(options = {}) {
    try {
      // 権限チェック
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error(GOOGLE_MAPS_CONFIG.ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
      }

      const defaultOptions = {
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
        maximumAge: 60000, // 1分間のキャッシュ
      };

      const locationOptions = { ...defaultOptions, ...options };

      const location = await Location.getCurrentPositionAsync(locationOptions);
      
      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      return this.currentLocation;
    } catch (error) {
      console.error('現在地取得エラー:', error);
      
      // エラーの種類に応じて適切なメッセージを返す
      if (error.code === 'E_LOCATION_TIMEOUT') {
        throw new Error(GOOGLE_MAPS_CONFIG.ERROR_MESSAGES.LOCATION_TIMEOUT);
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        throw new Error(GOOGLE_MAPS_CONFIG.ERROR_MESSAGES.LOCATION_UNAVAILABLE);
      } else {
        throw new Error(error.message || '位置情報の取得に失敗しました');
      }
    }
  }

  /**
   * 位置情報の監視を開始
   * @param {Function} callback - 位置更新時のコールバック
   * @param {Object} options - 監視オプション
   * @returns {Promise<void>}
   */
  async startWatchingLocation(callback, options = {}) {
    try {
      if (this.isWatching) {
        await this.stopWatchingLocation();
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error(GOOGLE_MAPS_CONFIG.ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
      }

      const defaultOptions = {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,      // 5秒間隔
        distanceInterval: 10,    // 10m移動で更新
      };

      const watchOptions = { ...defaultOptions, ...options };

      this.watchId = await Location.watchPositionAsync(watchOptions, (location) => {
        this.currentLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
        };

        if (callback) {
          callback(this.currentLocation);
        }
      });

      this.isWatching = true;
      console.log('位置情報の監視を開始しました');
    } catch (error) {
      console.error('位置監視開始エラー:', error);
      throw error;
    }
  }

  /**
   * 位置情報の監視を停止
   * @returns {Promise<void>}
   */
  async stopWatchingLocation() {
    try {
      if (this.watchId) {
        await this.watchId.remove();
        this.watchId = null;
      }
      this.isWatching = false;
      console.log('位置情報の監視を停止しました');
    } catch (error) {
      console.error('位置監視停止エラー:', error);
    }
  }

  /**
   * 住所から座標を取得（ジオコーディング）
   * @param {string} address - 住所
   * @returns {Promise<Object>} 座標情報
   */
  async geocodeAddress(address) {
    try {
      // キャッシュをチェック
      if (this.geocodingCache.has(address)) {
        const cached = this.geocodingCache.get(address);
        if (Date.now() - cached.timestamp < GOOGLE_MAPS_CONFIG.CACHE.GEOCODING_CACHE_TTL) {
          return cached.data;
        }
      }

      const results = await Location.geocodeAsync(address);
      
      if (results.length === 0) {
        throw new Error(GOOGLE_MAPS_CONFIG.ERROR_MESSAGES.GEOCODING_FAILED);
      }

      const result = results[0];
      const coordinates = {
        latitude: result.latitude,
        longitude: result.longitude,
        accuracy: result.accuracy || null,
      };

      // キャッシュに保存
      this.geocodingCache.set(address, {
        data: coordinates,
        timestamp: Date.now()
      });

      // キャッシュサイズ制限
      if (this.geocodingCache.size > GOOGLE_MAPS_CONFIG.CACHE.MAX_CACHE_SIZE) {
        const firstKey = this.geocodingCache.keys().next().value;
        this.geocodingCache.delete(firstKey);
      }

      return coordinates;
    } catch (error) {
      console.error('ジオコーディングエラー:', error);
      throw new Error(GOOGLE_MAPS_CONFIG.ERROR_MESSAGES.GEOCODING_FAILED);
    }
  }

  /**
   * 座標から住所を取得（逆ジオコーディング）
   * @param {number} latitude - 緯度
   * @param {number} longitude - 経度
   * @returns {Promise<Object>} 住所情報
   */
  async reverseGeocode(latitude, longitude) {
    try {
      const cacheKey = `${latitude},${longitude}`;
      
      // キャッシュをチェック
      if (this.geocodingCache.has(cacheKey)) {
        const cached = this.geocodingCache.get(cacheKey);
        if (Date.now() - cached.timestamp < GOOGLE_MAPS_CONFIG.CACHE.GEOCODING_CACHE_TTL) {
          return cached.data;
        }
      }

      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (results.length === 0) {
        throw new Error(GOOGLE_MAPS_CONFIG.ERROR_MESSAGES.GEOCODING_FAILED);
      }

      const result = results[0];
      const address = {
        formattedAddress: [
          result.streetNumber,
          result.street,
          result.district,
          result.city,
          result.region,
          result.postalCode
        ].filter(Boolean).join(' '),
        country: result.country,
        region: result.region,
        city: result.city,
        district: result.district,
        street: result.street,
        streetNumber: result.streetNumber,
        postalCode: result.postalCode,
      };

      // キャッシュに保存
      this.geocodingCache.set(cacheKey, {
        data: address,
        timestamp: Date.now()
      });

      return address;
    } catch (error) {
      console.error('逆ジオコーディングエラー:', error);
      throw new Error(GOOGLE_MAPS_CONFIG.ERROR_MESSAGES.GEOCODING_FAILED);
    }
  }

  /**
   * 2点間の距離を計算
   * @param {Object} point1 - 地点1 {latitude, longitude}
   * @param {Object} point2 - 地点2 {latitude, longitude}
   * @returns {number} 距離（メートル）
   */
  calculateDistance(point1, point2) {
    const R = 6371e3; // 地球の半径（メートル）
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * 指定半径内の店舗をフィルタリング
   * @param {Array} venues - 店舗リスト
   * @param {Object} center - 中心点 {latitude, longitude}
   * @param {number} radius - 半径（メートル）
   * @returns {Array} フィルタリングされた店舗リスト
   */
  filterVenuesWithinRadius(venues, center, radius) {
    return venues.filter(venue => {
      if (!venue.latitude || !venue.longitude) return false;
      
      const distance = this.calculateDistance(
        center,
        { latitude: venue.latitude, longitude: venue.longitude }
      );
      
      return distance <= radius;
    }).map(venue => ({
      ...venue,
      distance: this.calculateDistance(
        center,
        { latitude: venue.latitude, longitude: venue.longitude }
      )
    })).sort((a, b) => a.distance - b.distance);
  }

  /**
   * 現在地に最も近い店舗を取得
   * @param {Array} venues - 店舗リスト
   * @returns {Object|null} 最寄りの店舗
   */
  async findNearestVenue(venues) {
    try {
      const currentLocation = await this.getCurrentLocation();
      if (!currentLocation) return null;

      let nearestVenue = null;
      let shortestDistance = Infinity;

      venues.forEach(venue => {
        if (venue.latitude && venue.longitude) {
          const distance = this.calculateDistance(
            currentLocation,
            { latitude: venue.latitude, longitude: venue.longitude }
          );

          if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestVenue = { ...venue, distance };
          }
        }
      });

      return nearestVenue;
    } catch (error) {
      console.error('最寄り店舗検索エラー:', error);
      return null;
    }
  }

  /**
   * 現在地からの方角を計算
   * @param {Object} destination - 目的地 {latitude, longitude}
   * @returns {Promise<string>} 方角（北、北東、東、南東、南、南西、西、北西）
   */
  async calculateDirection(destination) {
    try {
      const currentLocation = await this.getCurrentLocation();
      if (!currentLocation) return null;

      const lat1 = currentLocation.latitude * Math.PI / 180;
      const lat2 = destination.latitude * Math.PI / 180;
      const deltaLng = (destination.longitude - currentLocation.longitude) * Math.PI / 180;

      const y = Math.sin(deltaLng) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

      let bearing = Math.atan2(y, x) * 180 / Math.PI;
      bearing = (bearing + 360) % 360;

      const directions = ['北', '北東', '東', '南東', '南', '南西', '西', '北西'];
      const index = Math.round(bearing / 45) % 8;

      return directions[index];
    } catch (error) {
      console.error('方角計算エラー:', error);
      return null;
    }
  }

  /**
   * 営業エリア内かどうかをチェック
   * @param {Object} location - チェックする位置 {latitude, longitude}
   * @returns {boolean} 営業エリア内かどうか
   */
  isWithinServiceArea(location) {
    return GOOGLE_MAPS_CONFIG.SERVICE_AREAS.some(area => {
      const distance = this.calculateDistance(location, area.center);
      return distance <= area.radius;
    });
  }

  /**
   * 最寄りの営業エリアを取得
   * @param {Object} location - 位置 {latitude, longitude}
   * @returns {Object|null} 最寄りの営業エリア
   */
  getNearestServiceArea(location) {
    let nearestArea = null;
    let shortestDistance = Infinity;

    GOOGLE_MAPS_CONFIG.SERVICE_AREAS.forEach(area => {
      const distance = this.calculateDistance(location, area.center);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestArea = { ...area, distance };
      }
    });

    return nearestArea;
  }

  /**
   * 位置情報のキャッシュをクリア
   */
  clearCache() {
    this.locationCache.clear();
    this.geocodingCache.clear();
    console.log('位置情報キャッシュをクリアしました');
  }

  /**
   * 現在の位置情報を取得
   * @returns {Object|null} 現在の位置情報
   */
  getCurrentPosition() {
    return this.currentLocation;
  }

  /**
   * 位置情報の監視状態を取得
   * @returns {boolean} 監視中かどうか
   */
  isWatchingLocation() {
    return this.isWatching;
  }

  /**
   * 権限ステータスを取得
   * @returns {string|null} 権限ステータス
   */
  getPermissionStatus() {
    return this.permissionStatus;
  }

  /**
   * サービスのクリーンアップ
   */
  async cleanup() {
    await this.stopWatchingLocation();
    this.clearCache();
    this.currentLocation = null;
    this.permissionStatus = null;
  }
}

// シングルトンインスタンス
const locationService = new LocationService();

export default locationService;