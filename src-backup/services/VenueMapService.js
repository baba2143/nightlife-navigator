import locationService from './LocationService';
import { GOOGLE_MAPS_CONFIG } from '../config/maps';

/**
 * 地図上での店舗管理サービス
 * 店舗の表示、フィルタリング、クラスタリングを管理
 */
class VenueMapService {
  constructor() {
    this.venues = [];
    this.filteredVenues = [];
    this.clusters = [];
    this.filterConfig = null;
    this.searchBounds = null;
  }

  /**
   * 店舗データを設定
   * @param {Array} venues - 店舗配列
   */
  setVenues(venues) {
    this.venues = venues.map(venue => ({
      ...venue,
      // 必要なプロパティのデフォルト値を設定
      latitude: venue.latitude || 0,
      longitude: venue.longitude || 0,
      rating: venue.rating || 0,
      priceLevel: venue.priceLevel || 1,
      genre: venue.genre || 'other',
      isOpenNow: venue.isOpenNow !== undefined ? venue.isOpenNow : true,
      distance: venue.distance || null,
    }));
    
    this.applyFilters();
  }

  /**
   * 店舗データを取得
   * @returns {Array} 店舗配列
   */
  getVenues() {
    return this.venues;
  }

  /**
   * フィルタリングされた店舗を取得
   * @returns {Array} フィルタリングされた店舗配列
   */
  getFilteredVenues() {
    return this.filteredVenues;
  }

  /**
   * クラスターを取得
   * @returns {Array} クラスター配列
   */
  getClusters() {
    return this.clusters;
  }

  /**
   * フィルター設定を適用
   * @param {Object} filterConfig - フィルター設定
   */
  setFilterConfig(filterConfig) {
    this.filterConfig = filterConfig;
    this.applyFilters();
  }

  /**
   * 検索範囲を設定
   * @param {Object} bounds - 検索範囲
   */
  setSearchBounds(bounds) {
    this.searchBounds = bounds;
    this.applyFilters();
  }

  /**
   * フィルターを適用
   */
  applyFilters() {
    let filtered = [...this.venues];

    // 検索範囲でフィルタリング
    if (this.searchBounds) {
      filtered = this.filterByBounds(filtered, this.searchBounds);
    }

    // その他のフィルターを適用
    if (this.filterConfig) {
      filtered = this.applyCustomFilters(filtered, this.filterConfig);
    }

    this.filteredVenues = filtered;
    this.updateClusters();
  }

  /**
   * 境界範囲で店舗をフィルタリング
   * @param {Array} venues - 店舗配列
   * @param {Object} bounds - 境界範囲
   * @returns {Array} フィルタリングされた店舗配列
   */
  filterByBounds(venues, bounds) {
    const { northeast, southwest } = bounds;
    
    return venues.filter(venue => {
      return venue.latitude >= southwest.latitude &&
             venue.latitude <= northeast.latitude &&
             venue.longitude >= southwest.longitude &&
             venue.longitude <= northeast.longitude;
    });
  }

  /**
   * カスタムフィルターを適用
   * @param {Array} venues - 店舗配列
   * @param {Object} filters - フィルター設定
   * @returns {Array} フィルタリングされた店舗配列
   */
  applyCustomFilters(venues, filters) {
    return venues.filter(venue => {
      // ジャンルフィルター
      if (filters.genres && filters.genres.length > 0) {
        if (!filters.genres.includes(venue.genre)) {
          return false;
        }
      }

      // 評価フィルター
      if (filters.minRating && venue.rating < filters.minRating) {
        return false;
      }

      // 価格帯フィルター
      if (filters.priceRange) {
        if (venue.priceLevel < filters.priceRange.min || 
            venue.priceLevel > filters.priceRange.max) {
          return false;
        }
      }

      // 距離フィルター
      if (filters.maxDistance && venue.distance && venue.distance > filters.maxDistance) {
        return false;
      }

      // 営業状況フィルター
      if (filters.openNow && !venue.isOpenNow) {
        return false;
      }

      // 検索キーワードフィルター
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        const searchText = `${venue.name} ${venue.description || ''} ${venue.address || ''}`.toLowerCase();
        if (!searchText.includes(keyword)) {
          return false;
        }
      }

      // 特徴フィルター
      if (filters.features && filters.features.length > 0) {
        const venueFeatures = venue.features || [];
        const hasFeature = filters.features.some(feature => 
          venueFeatures.includes(feature)
        );
        if (!hasFeature) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * クラスターを更新
   * @param {Object} mapRegion - 地図の表示領域
   */
  updateClusters(mapRegion = null) {
    if (!GOOGLE_MAPS_CONFIG.CLUSTERING.ENABLED || 
        this.filteredVenues.length < GOOGLE_MAPS_CONFIG.CLUSTERING.MIN_CLUSTER_SIZE) {
      this.clusters = [];
      return;
    }

    this.clusters = this.createClusters(this.filteredVenues, mapRegion);
  }

  /**
   * クラスターを生成
   * @param {Array} venues - 店舗配列
   * @param {Object} mapRegion - 地図領域
   * @returns {Array} クラスター配列
   */
  createClusters(venues, mapRegion) {
    const clusters = [];
    const processed = new Set();
    const clusterRadius = this.calculateClusterRadius(mapRegion);

    venues.forEach((venue, index) => {
      if (processed.has(index)) return;

      const cluster = {
        id: `cluster_${Date.now()}_${index}`,
        latitude: venue.latitude,
        longitude: venue.longitude,
        venues: [venue],
      };

      // 周辺の店舗をクラスターに追加
      venues.forEach((otherVenue, otherIndex) => {
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
        const { centerLat, centerLng } = this.calculateClusterCenter(cluster.venues);
        cluster.latitude = centerLat;
        cluster.longitude = centerLng;
      }

      clusters.push(cluster);
    });

    return clusters;
  }

  /**
   * クラスター半径を計算
   * @param {Object} mapRegion - 地図領域
   * @returns {number} クラスター半径（メートル）
   */
  calculateClusterRadius(mapRegion) {
    if (!mapRegion) {
      return GOOGLE_MAPS_CONFIG.CLUSTERING.RADIUS;
    }

    // 地図のズームレベルに基づいてクラスター半径を調整
    const latitudeDelta = mapRegion.latitudeDelta;
    const baseRadius = GOOGLE_MAPS_CONFIG.CLUSTERING.RADIUS;
    
    if (latitudeDelta > 0.1) {
      return baseRadius * 3; // 広域表示時は大きなクラスター
    } else if (latitudeDelta > 0.05) {
      return baseRadius * 2;
    } else if (latitudeDelta > 0.01) {
      return baseRadius;
    } else {
      return baseRadius * 0.5; // 詳細表示時は小さなクラスター
    }
  }

  /**
   * クラスター中心を計算
   * @param {Array} venues - クラスター内の店舗
   * @returns {Object} 中心座標
   */
  calculateClusterCenter(venues) {
    const totalLat = venues.reduce((sum, venue) => sum + venue.latitude, 0);
    const totalLng = venues.reduce((sum, venue) => sum + venue.longitude, 0);
    
    return {
      centerLat: totalLat / venues.length,
      centerLng: totalLng / venues.length,
    };
  }

  /**
   * 指定位置から最寄りの店舗を検索
   * @param {Object} location - 位置座標
   * @param {number} limit - 結果数の上限
   * @returns {Array} 最寄りの店舗配列
   */
  findNearestVenues(location, limit = 10) {
    return this.filteredVenues
      .map(venue => ({
        ...venue,
        distance: locationService.calculateDistance(location, {
          latitude: venue.latitude,
          longitude: venue.longitude
        })
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  }

  /**
   * 指定半径内の店舗を検索
   * @param {Object} center - 中心座標
   * @param {number} radius - 半径（メートル）
   * @returns {Array} 範囲内の店舗配列
   */
  findVenuesWithinRadius(center, radius) {
    return locationService.filterVenuesWithinRadius(
      this.filteredVenues,
      center,
      radius
    );
  }

  /**
   * ジャンル別の店舗数を取得
   * @returns {Object} ジャンル別カウント
   */
  getGenreStats() {
    const genreCount = {};
    this.filteredVenues.forEach(venue => {
      const genre = venue.genre || 'other';
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });
    return genreCount;
  }

  /**
   * 価格帯別の店舗数を取得
   * @returns {Object} 価格帯別カウント
   */
  getPriceStats() {
    const priceCount = {};
    this.filteredVenues.forEach(venue => {
      const price = venue.priceLevel || 1;
      priceCount[price] = (priceCount[price] || 0) + 1;
    });
    return priceCount;
  }

  /**
   * 評価分布を取得
   * @returns {Object} 評価分布
   */
  getRatingStats() {
    const ratings = this.filteredVenues
      .map(venue => venue.rating)
      .filter(rating => rating && rating > 0);

    if (ratings.length === 0) return null;

    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    const average = sum / ratings.length;
    const min = Math.min(...ratings);
    const max = Math.max(...ratings);

    return {
      average: Number(average.toFixed(1)),
      min,
      max,
      count: ratings.length,
    };
  }

  /**
   * 指定されたIDの店舗を取得
   * @param {string} venueId - 店舗ID
   * @returns {Object|null} 店舗データ
   */
  getVenueById(venueId) {
    return this.venues.find(venue => venue.id === venueId) || null;
  }

  /**
   * 店舗の現在位置からの距離を更新
   * @param {Object} userLocation - ユーザーの現在地
   */
  async updateDistances(userLocation = null) {
    const location = userLocation || await locationService.getCurrentLocation();
    if (!location) return;

    this.venues = this.venues.map(venue => ({
      ...venue,
      distance: locationService.calculateDistance(location, {
        latitude: venue.latitude,
        longitude: venue.longitude
      })
    }));

    this.applyFilters();
  }

  /**
   * フィルター設定をリセット
   */
  clearFilters() {
    this.filterConfig = null;
    this.searchBounds = null;
    this.applyFilters();
  }

  /**
   * サービスをリセット
   */
  reset() {
    this.venues = [];
    this.filteredVenues = [];
    this.clusters = [];
    this.filterConfig = null;
    this.searchBounds = null;
  }
}

// シングルトンインスタンス
const venueMapService = new VenueMapService();

export default venueMapService;