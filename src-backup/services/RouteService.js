import { GOOGLE_MAPS_CONFIG } from '../config/maps';
import locationService from './LocationService';

/**
 * ルート案内サービス
 * Google Directions APIを使用してルート検索と案内を提供
 */
class RouteService {
  constructor() {
    this.currentRoute = null;
    this.routeCache = new Map();
    this.isNavigating = false;
    this.navigationCallbacks = [];
  }

  /**
   * 2点間のルートを取得
   * @param {Object} origin - 出発地点 {latitude, longitude}
   * @param {Object} destination - 目的地 {latitude, longitude}
   * @param {Object} options - ルート検索オプション
   * @returns {Promise<Object>} ルート情報
   */
  async getDirections(origin, destination, options = {}) {
    try {
      const cacheKey = this.generateCacheKey(origin, destination, options);
      
      // キャッシュをチェック
      if (this.routeCache.has(cacheKey)) {
        const cached = this.routeCache.get(cacheKey);
        if (Date.now() - cached.timestamp < GOOGLE_MAPS_CONFIG.CACHE.DIRECTIONS_CACHE_TTL) {
          return cached.data;
        }
      }

      const directionsData = await this.fetchDirections(origin, destination, options);
      
      // キャッシュに保存
      this.routeCache.set(cacheKey, {
        data: directionsData,
        timestamp: Date.now()
      });

      // キャッシュサイズ制限
      if (this.routeCache.size > GOOGLE_MAPS_CONFIG.CACHE.MAX_CACHE_SIZE) {
        const firstKey = this.routeCache.keys().next().value;
        this.routeCache.delete(firstKey);
      }

      return directionsData;
    } catch (error) {
      console.error('ルート検索エラー:', error);
      throw new Error(GOOGLE_MAPS_CONFIG.ERROR_MESSAGES.DIRECTIONS_NOT_FOUND);
    }
  }

  /**
   * Google Directions APIにリクエスト
   * @param {Object} origin - 出発地点
   * @param {Object} destination - 目的地
   * @param {Object} options - オプション
   * @returns {Promise<Object>} API応答
   */
  async fetchDirections(origin, destination, options = {}) {
    const apiKey = GOOGLE_MAPS_CONFIG.API_KEY;
    if (!apiKey) {
      throw new Error(GOOGLE_MAPS_CONFIG.ERROR_MESSAGES.API_KEY_MISSING);
    }

    const params = new URLSearchParams({
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      mode: options.travelMode || GOOGLE_MAPS_CONFIG.DIRECTIONS_CONFIG.TRAVEL_MODE,
      units: GOOGLE_MAPS_CONFIG.DIRECTIONS_CONFIG.UNIT_SYSTEM,
      language: GOOGLE_MAPS_CONFIG.DIRECTIONS_CONFIG.LANGUAGE,
      region: GOOGLE_MAPS_CONFIG.DIRECTIONS_CONFIG.REGION,
      key: apiKey,
    });

    // 回避設定
    if (GOOGLE_MAPS_CONFIG.DIRECTIONS_CONFIG.AVOID_HIGHWAYS) {
      params.append('avoid', 'highways');
    }
    if (GOOGLE_MAPS_CONFIG.DIRECTIONS_CONFIG.AVOID_TOLLS) {
      params.append('avoid', 'tolls');
    }
    if (GOOGLE_MAPS_CONFIG.DIRECTIONS_CONFIG.AVOID_FERRIES) {
      params.append('avoid', 'ferries');
    }

    // 経由地
    if (options.waypoints && options.waypoints.length > 0) {
      const waypointsStr = options.waypoints
        .map(wp => `${wp.latitude},${wp.longitude}`)
        .join('|');
      params.append('waypoints', waypointsStr);
    }

    // 出発時刻・到着時刻
    if (options.departureTime) {
      params.append('departure_time', options.departureTime);
    }
    if (options.arrivalTime) {
      params.append('arrival_time', options.arrivalTime);
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?${params}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Directions API Error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    return this.processDirectionsResponse(data);
  }

  /**
   * Directions APIの応答を処理
   * @param {Object} data - API応答
   * @returns {Object} 処理済みルート情報
   */
  processDirectionsResponse(data) {
    const route = data.routes[0];
    if (!route) {
      throw new Error('ルートが見つかりません');
    }

    const leg = route.legs[0];
    const steps = leg.steps.map(step => ({
      instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // HTMLタグを除去
      distance: step.distance,
      duration: step.duration,
      startLocation: step.start_location,
      endLocation: step.end_location,
      polyline: step.polyline.points,
      travelMode: step.travel_mode,
      maneuver: step.maneuver,
    }));

    return {
      summary: route.summary,
      distance: leg.distance,
      duration: leg.duration,
      startAddress: leg.start_address,
      endAddress: leg.end_address,
      steps,
      polyline: route.overview_polyline.points,
      bounds: route.bounds,
      warnings: route.warnings || [],
      copyrights: route.copyrights,
    };
  }

  /**
   * ナビゲーションを開始
   * @param {Object} route - ルート情報
   * @param {Function} onProgress - 進行状況コールバック
   */
  async startNavigation(route, onProgress = () => {}) {
    try {
      this.currentRoute = route;
      this.isNavigating = true;
      this.navigationCallbacks.push(onProgress);

      // 現在地の監視を開始
      await locationService.startWatchingLocation(
        (location) => {
          this.updateNavigationProgress(location);
        },
        {
          accuracy: 'high',
          timeInterval: 5000, // 5秒間隔
          distanceInterval: 10, // 10m移動で更新
        }
      );

      console.log('ナビゲーションを開始しました');
    } catch (error) {
      console.error('ナビゲーション開始エラー:', error);
      throw error;
    }
  }

  /**
   * ナビゲーション進行状況を更新
   * @param {Object} currentLocation - 現在地
   */
  updateNavigationProgress(currentLocation) {
    if (!this.isNavigating || !this.currentRoute) return;

    const progress = this.calculateProgress(currentLocation);
    
    // コールバックを実行
    this.navigationCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('ナビゲーションコールバックエラー:', error);
      }
    });
  }

  /**
   * ナビゲーション進行状況を計算
   * @param {Object} currentLocation - 現在地
   * @returns {Object} 進行状況
   */
  calculateProgress(currentLocation) {
    const route = this.currentRoute;
    const steps = route.steps;
    
    // 現在の最寄りステップを見つける
    let closestStepIndex = 0;
    let closestDistance = Infinity;
    
    steps.forEach((step, index) => {
      const stepLocation = {
        latitude: step.startLocation.lat,
        longitude: step.startLocation.lng,
      };
      
      const distance = locationService.calculateDistance(currentLocation, stepLocation);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestStepIndex = index;
      }
    });

    const currentStep = steps[closestStepIndex];
    const nextStep = steps[closestStepIndex + 1];
    
    // 目的地までの残り距離と時間を計算
    const remainingSteps = steps.slice(closestStepIndex);
    const remainingDistance = remainingSteps.reduce(
      (total, step) => total + step.distance.value, 0
    );
    const remainingDuration = remainingSteps.reduce(
      (total, step) => total + step.duration.value, 0
    );

    // 進行率を計算
    const totalDistance = route.distance.value;
    const progressPercentage = ((totalDistance - remainingDistance) / totalDistance) * 100;

    return {
      currentLocation,
      currentStep,
      nextStep,
      stepIndex: closestStepIndex,
      totalSteps: steps.length,
      remainingDistance: {
        value: remainingDistance,
        text: this.formatDistance(remainingDistance),
      },
      remainingDuration: {
        value: remainingDuration,
        text: this.formatDuration(remainingDuration),
      },
      progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
      isOffRoute: closestDistance > 100, // 100m以上離れている場合はルート外
    };
  }

  /**
   * ナビゲーションを停止
   */
  async stopNavigation() {
    try {
      this.isNavigating = false;
      this.currentRoute = null;
      this.navigationCallbacks = [];
      
      await locationService.stopWatchingLocation();
      
      console.log('ナビゲーションを停止しました');
    } catch (error) {
      console.error('ナビゲーション停止エラー:', error);
    }
  }

  /**
   * 複数の目的地への最適ルートを計算
   * @param {Object} origin - 出発地点
   * @param {Array} destinations - 目的地配列
   * @param {Object} options - オプション
   * @returns {Promise<Object>} 最適ルート
   */
  async getOptimizedRoute(origin, destinations, options = {}) {
    try {
      if (destinations.length === 1) {
        return await this.getDirections(origin, destinations[0], options);
      }

      // 複数の目的地がある場合、最適化されたルートを計算
      const routes = [];
      
      for (let i = 0; i < destinations.length; i++) {
        const route = await this.getDirections(origin, destinations[i], options);
        routes.push({
          destination: destinations[i],
          route,
          totalDistance: route.distance.value,
          totalDuration: route.duration.value,
        });
      }

      // 距離または時間で最適ルートを選択
      const sortBy = options.optimizeFor || 'distance';
      routes.sort((a, b) => {
        if (sortBy === 'duration') {
          return a.totalDuration - b.totalDuration;
        }
        return a.totalDistance - b.totalDistance;
      });

      return routes[0].route;
    } catch (error) {
      console.error('最適ルート計算エラー:', error);
      throw error;
    }
  }

  /**
   * 現在地から最寄りの店舗へのルートを取得
   * @param {Array} venues - 店舗配列
   * @param {Object} options - オプション
   * @returns {Promise<Object>} 最寄り店舗へのルート
   */
  async getRouteToNearestVenue(venues, options = {}) {
    try {
      const currentLocation = await locationService.getCurrentLocation();
      if (!currentLocation) {
        throw new Error('現在地を取得できません');
      }

      const nearestVenue = await locationService.findNearestVenue(venues);
      if (!nearestVenue) {
        throw new Error('最寄りの店舗が見つかりません');
      }

      const destination = {
        latitude: nearestVenue.latitude,
        longitude: nearestVenue.longitude,
      };

      const route = await this.getDirections(currentLocation, destination, options);
      
      return {
        venue: nearestVenue,
        route,
      };
    } catch (error) {
      console.error('最寄り店舗ルート検索エラー:', error);
      throw error;
    }
  }

  /**
   * キャッシュキーを生成
   * @param {Object} origin - 出発地点
   * @param {Object} destination - 目的地
   * @param {Object} options - オプション
   * @returns {string} キャッシュキー
   */
  generateCacheKey(origin, destination, options) {
    const key = `${origin.latitude},${origin.longitude}-${destination.latitude},${destination.longitude}`;
    const optionsKey = JSON.stringify(options);
    return `${key}-${optionsKey}`;
  }

  /**
   * 距離をフォーマット
   * @param {number} meters - メートル
   * @returns {string} フォーマット済み距離
   */
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  /**
   * 時間をフォーマット
   * @param {number} seconds - 秒
   * @returns {string} フォーマット済み時間
   */
  formatDuration(seconds) {
    if (seconds < 60) {
      return `${seconds}秒`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}分`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.round((seconds % 3600) / 60);
      return `${hours}時間${minutes}分`;
    }
  }

  /**
   * 現在のルートを取得
   * @returns {Object|null} 現在のルート
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * ナビゲーション状態を取得
   * @returns {boolean} ナビゲーション中かどうか
   */
  isNavigationActive() {
    return this.isNavigating;
  }

  /**
   * キャッシュをクリア
   */
  clearCache() {
    this.routeCache.clear();
    console.log('ルートキャッシュをクリアしました');
  }

  /**
   * サービスのクリーンアップ
   */
  async cleanup() {
    await this.stopNavigation();
    this.clearCache();
  }
}

// シングルトンインスタンス
const routeService = new RouteService();

export default routeService;