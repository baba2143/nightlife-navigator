/**
 * 地図機能の設定ファイル
 */

// Google Maps API設定
export const GOOGLE_MAPS_CONFIG = {
  // API キー（環境変数から取得）
  API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY,
  
  // デフォルトの地図設定
  DEFAULT_REGION: {
    latitude: 35.6762, // 東京駅
    longitude: 139.6503,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  
  // 地図スタイル設定
  MAP_STYLE: 'standard', // standard, satellite, hybrid, terrain
  
  // マーカー設定
  MARKER_CONFIG: {
    DEFAULT_SIZE: 40,
    SELECTED_SIZE: 50,
    CLUSTER_SIZE: 60,
  },
  
  // 検索半径設定（メートル）
  SEARCH_RADIUS: {
    NEARBY: 1000,     // 1km
    LOCAL: 5000,      // 5km
    CITY: 20000,      // 20km
    REGION: 50000,    // 50km
  },
  
  // 地図の最小・最大ズームレベル
  ZOOM_LEVELS: {
    MIN: 8,   // 広域表示
    MAX: 20,  // 詳細表示
    DEFAULT: 14,
  },
  
  // アニメーション設定
  ANIMATION: {
    DURATION: 1000,
    EASING: 'easeInOutQuad',
  },
  
  // カスタムマーカーアイコン
  MARKER_ICONS: {
    BAR: {
      url: '/icons/bar-marker.png',
      size: { width: 40, height: 40 },
      anchor: { x: 20, y: 40 },
    },
    CLUB: {
      url: '/icons/club-marker.png',
      size: { width: 40, height: 40 },
      anchor: { x: 20, y: 40 },
    },
    LOUNGE: {
      url: '/icons/lounge-marker.png',
      size: { width: 40, height: 40 },
      anchor: { x: 20, y: 40 },
    },
    RESTAURANT: {
      url: '/icons/restaurant-marker.png',
      size: { width: 40, height: 40 },
      anchor: { x: 20, y: 40 },
    },
    SELECTED: {
      url: '/icons/selected-marker.png',
      size: { width: 50, height: 50 },
      anchor: { x: 25, y: 50 },
    },
    USER_LOCATION: {
      url: '/icons/user-location.png',
      size: { width: 30, height: 30 },
      anchor: { x: 15, y: 15 },
    },
  },
  
  // 地図テーマ設定（ダーク/ライトモード対応）
  THEMES: {
    LIGHT: {
      styles: [
        {
          featureType: 'all',
          stylers: [{ saturation: -10 }]
        },
        {
          featureType: 'poi',
          stylers: [{ visibility: 'simplified' }]
        }
      ]
    },
    DARK: {
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry',
          stylers: [{ color: '#242f3e' }]
        },
        {
          featureType: 'all',
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#242f3e' }]
        },
        {
          featureType: 'all',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#746855' }]
        }
      ]
    },
    NIGHTLIFE: {
      // ナイトライフ向けのカスタムテーマ
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry',
          stylers: [{ color: '#1a1a2e' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#16213e' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#38414e' }]
        },
        {
          featureType: 'poi.business',
          stylers: [{ visibility: 'on' }]
        }
      ]
    }
  },
  
  // クラスタリング設定
  CLUSTERING: {
    ENABLED: true,
    MAX_ZOOM: 15,
    RADIUS: 60,
    MIN_CLUSTER_SIZE: 2,
    STYLES: [
      {
        width: 40,
        height: 40,
        className: 'cluster-small'
      },
      {
        width: 50,
        height: 50,
        className: 'cluster-medium'
      },
      {
        width: 60,
        height: 60,
        className: 'cluster-large'
      }
    ]
  },
  
  // 地図コントロール設定
  CONTROLS: {
    ZOOM: true,
    FULLSCREEN: true,
    MAP_TYPE: true,
    STREET_VIEW: false,
    SCALE: true,
    ROTATE: true,
    COMPASS: true,
  },
  
  // Places API設定
  PLACES_CONFIG: {
    TYPES: ['establishment'],
    RADIUS: 5000,
    LANGUAGE: 'ja',
    FIELDS: [
      'place_id',
      'name',
      'geometry',
      'formatted_address',
      'rating',
      'price_level',
      'opening_hours',
      'photos',
      'types'
    ]
  },
  
  // Directions API設定
  DIRECTIONS_CONFIG: {
    TRAVEL_MODE: 'WALKING', // WALKING, DRIVING, TRANSIT, BICYCLING
    UNIT_SYSTEM: 'METRIC',
    LANGUAGE: 'ja',
    REGION: 'JP',
    AVOID_HIGHWAYS: false,
    AVOID_TOLLS: false,
    AVOID_FERRIES: false,
  },
  
  // ジオコーディング設定
  GEOCODING_CONFIG: {
    LANGUAGE: 'ja',
    REGION: 'JP',
    COMPONENT_RESTRICTIONS: {
      country: 'JP'
    }
  },
  
  // エラーメッセージ
  ERROR_MESSAGES: {
    API_KEY_MISSING: 'Google Maps APIキーが設定されていません',
    LOCATION_PERMISSION_DENIED: '位置情報の取得が拒否されました',
    LOCATION_UNAVAILABLE: '位置情報を取得できません',
    LOCATION_TIMEOUT: '位置情報の取得がタイムアウトしました',
    DIRECTIONS_NOT_FOUND: 'ルートが見つかりません',
    PLACES_SEARCH_FAILED: '店舗検索に失敗しました',
    GEOCODING_FAILED: '住所の変換に失敗しました',
  },
  
  // パフォーマンス設定
  PERFORMANCE: {
    DEBOUNCE_DELAY: 300,    // 検索のデバウンス時間（ms）
    MAX_MARKERS: 100,       // 同時表示する最大マーカー数
    VIEWPORT_PADDING: 50,   // ビューポートのパディング（px）
    LOAD_TIMEOUT: 10000,    // 地図読み込みタイムアウト（ms）
  },
  
  // キャッシュ設定
  CACHE: {
    PLACES_CACHE_TTL: 300000,     // 5分（ms）
    DIRECTIONS_CACHE_TTL: 600000, // 10分（ms）
    GEOCODING_CACHE_TTL: 3600000, // 1時間（ms）
    MAX_CACHE_SIZE: 100,          // 最大キャッシュ数
  },
  
  // 営業エリア設定（東京中心）
  SERVICE_AREAS: [
    {
      name: '渋谷',
      center: { latitude: 35.6598, longitude: 139.7006 },
      radius: 2000
    },
    {
      name: '新宿',
      center: { latitude: 35.6896, longitude: 139.6917 },
      radius: 2000
    },
    {
      name: '六本木',
      center: { latitude: 35.6627, longitude: 139.7311 },
      radius: 1500
    },
    {
      name: '銀座',
      center: { latitude: 35.6762, longitude: 139.7651 },
      radius: 1000
    },
    {
      name: '池袋',
      center: { latitude: 35.7295, longitude: 139.7110 },
      radius: 1500
    }
  ]
};

// マップスタイルのプリセット
export const MAP_STYLES = {
  // 標準スタイル
  STANDARD: [],
  
  // ナイトモードスタイル
  NIGHT: [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#1a1a2e' }]
    },
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#ea5a7b' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#16213e' }]
    }
  ],
  
  // ピンクテーマスタイル
  PINK: [
    {
      featureType: 'poi.business',
      elementType: 'geometry',
      stylers: [{ color: '#fce7f3' }]
    },
    {
      featureType: 'poi.business',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#ea5a7b' }]
    }
  ]
};

// 地図ユーティリティ関数
export const MapUtils = {
  // 2点間の距離を計算（メートル）
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // 地球の半径（メートル）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  },
  
  // 境界ボックスの計算
  calculateBounds: (locations) => {
    if (!locations || locations.length === 0) return null;
    
    let minLat = locations[0].latitude;
    let maxLat = locations[0].latitude;
    let minLng = locations[0].longitude;
    let maxLng = locations[0].longitude;
    
    locations.forEach(location => {
      minLat = Math.min(minLat, location.latitude);
      maxLat = Math.max(maxLat, location.latitude);
      minLng = Math.min(minLng, location.longitude);
      maxLng = Math.max(maxLng, location.longitude);
    });
    
    return {
      southwest: { latitude: minLat, longitude: minLng },
      northeast: { latitude: maxLat, longitude: maxLng }
    };
  },
  
  // ズームレベルから半径を計算
  zoomToRadius: (zoom) => {
    return 40075000 * Math.cos(35.6762 * Math.PI / 180) / Math.pow(2, zoom + 8);
  },
  
  // 半径からズームレベルを計算
  radiusToZoom: (radius) => {
    return Math.log2(40075000 * Math.cos(35.6762 * Math.PI / 180) / radius) - 8;
  }
};

export default GOOGLE_MAPS_CONFIG;