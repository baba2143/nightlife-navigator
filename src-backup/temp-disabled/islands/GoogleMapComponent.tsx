import { useEffect, useRef, useState } from "preact/hooks";
import { apply } from "twind";

interface Venue {
  id: number;
  name: string;
  category: string;
  address: string;
  rating: number;
  priceRange: string;
  distance: number;
  description: string;
  tags: string[];
  isOpen: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface GoogleMapComponentProps {
  venues: Venue[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onVenueSelect?: (venue: Venue) => void;
  showCurrentLocation?: boolean;
  apiKey: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function GoogleMapComponent({
  venues,
  center = { lat: 35.6762, lng: 139.6503 }, // 東京駅をデフォルト
  zoom = 13,
  onVenueSelect,
  showCurrentLocation = true,
  apiKey,
}: GoogleMapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Google Maps API を動的にロード
  useEffect(() => {
    if (window.google) {
      initializeMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      initializeMap();
    };
    
    script.onerror = () => {
      setError("Google Maps APIの読み込みに失敗しました");
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [apiKey]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    try {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        styles: [
          // やさしいピンクテーマのマップスタイル
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#fef7f7" }],
          },
          {
            featureType: "landscape",
            elementType: "geometry",
            stylers: [{ color: "#fefbfb" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }],
          },
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
          {
            featureType: "transit",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      setMap(mapInstance);
      setIsLoading(false);

      // 現在地を取得
      if (showCurrentLocation) {
        getCurrentLocation();
      }
    } catch (err) {
      setError("地図の初期化に失敗しました");
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          
          if (map) {
            // 現在地マーカーを追加
            new window.google.maps.Marker({
              position: location,
              map: map,
              title: "現在地",
              icon: {
                url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="10" r="8" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2"/>
                    <circle cx="10" cy="10" r="3" fill="#FFFFFF"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(20, 20),
              },
            });
          }
        },
        (error) => {
          console.warn("位置情報の取得に失敗しました:", error);
        }
      );
    }
  };

  // 店舗マーカーを更新
  useEffect(() => {
    if (!map || !window.google) return;

    // 既存のマーカーをクリア
    markers.forEach(marker => marker.setMap(null));

    const newMarkers: any[] = [];

    venues.forEach((venue) => {
      if (!venue.coordinates) return;

      const marker = new window.google.maps.Marker({
        position: venue.coordinates,
        map: map,
        title: venue.name,
        icon: {
          url: getMarkerIcon(venue.category, venue.isOpen),
          scaledSize: new window.google.maps.Size(32, 32),
        },
      });

      // 情報ウィンドウ
      const infoWindow = new window.google.maps.InfoWindow({
        content: createInfoWindowContent(venue),
      });

      marker.addListener("click", () => {
        // 他の情報ウィンドウを閉じる
        newMarkers.forEach(m => {
          if (m.infoWindow) {
            m.infoWindow.close();
          }
        });
        
        infoWindow.open(map, marker);
        
        if (onVenueSelect) {
          onVenueSelect(venue);
        }
      });

      marker.infoWindow = infoWindow;
      newMarkers.push(marker);
    });

    setMarkers(newMarkers);
  }, [map, venues]);

  const getMarkerIcon = (category: string, isOpen: boolean) => {
    const icons: Record<string, string> = {
      bar: "🍸",
      club: "🎵",
      lounge: "🛋️",
      restaurant: "🍽️",
      karaoke: "🎤",
      pub: "🍺",
    };

    const icon = icons[category] || "🏪";
    const backgroundColor = isOpen ? "#ea5a7b" : "#9CA3AF";

    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="${backgroundColor}" stroke="#FFFFFF" stroke-width="2"/>
        <text x="16" y="20" text-anchor="middle" font-size="12" fill="#FFFFFF">${icon}</text>
      </svg>
    `);
  };

  const createInfoWindowContent = (venue: Venue) => {
    return `
      <div style="max-width: 250px; font-family: Inter, sans-serif;">
        <h3 style="margin: 0 0 8px 0; color: #ea5a7b; font-size: 16px; font-weight: 600;">
          ${venue.name}
        </h3>
        <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
          ${venue.address}
        </p>
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <span style="background: #ea5a7b; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
            ${venue.rating} ★
          </span>
          <span style="background: ${venue.isOpen ? '#10B981' : '#EF4444'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
            ${venue.isOpen ? '営業中' : '営業時間外'}
          </span>
        </div>
        <p style="margin: 0 0 12px 0; color: #333; font-size: 13px; line-height: 1.4;">
          ${venue.description}
        </p>
        <div style="display: flex; gap: 4px; justify-content: space-between;">
          <button onclick="window.open('/venues/${venue.id}', '_blank')" 
                  style="background: #ea5a7b; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">
            詳細を見る
          </button>
          <button onclick="getDirections(${venue.coordinates?.lat}, ${venue.coordinates?.lng})" 
                  style="background: white; color: #ea5a7b; border: 1px solid #ea5a7b; padding: 8px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">
            道順
          </button>
        </div>
      </div>
    `;
  };

  // ルート案内機能
  const getDirections = (lat: number, lng: number) => {
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${lat},${lng}`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  // グローバル関数として設定（情報ウィンドウから呼び出すため）
  useEffect(() => {
    (window as any).getDirections = getDirections;
  }, [userLocation]);

  // 地図の中心を変更する関数
  const panToLocation = (lat: number, lng: number) => {
    if (map) {
      map.panTo({ lat, lng });
      map.setZoom(15);
    }
  };

  // 現在地に移動
  const goToCurrentLocation = () => {
    if (userLocation && map) {
      panToLocation(userLocation.lat, userLocation.lng);
    } else {
      getCurrentLocation();
    }
  };

  // 全ての店舗が見えるように地図を調整
  const fitToVenues = () => {
    if (!map || !venues.length) return;

    const bounds = new window.google.maps.LatLngBounds();
    
    venues.forEach(venue => {
      if (venue.coordinates) {
        bounds.extend(venue.coordinates);
      }
    });

    if (userLocation) {
      bounds.extend(userLocation);
    }

    map.fitBounds(bounds);
  };

  if (error) {
    return (
      <div class={apply`flex items-center justify-center h-full bg-pink-light text-center p-8`}>
        <div>
          <div class="text-4xl mb-4">⚠️</div>
          <h3 class={apply`text-lg font-semibold text-pink-primary mb-2`}>
            地図の読み込みエラー
          </h3>
          <p class={apply`text-text-secondary`}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div class="relative w-full h-full">
      {isLoading && (
        <div class={apply`absolute inset-0 bg-pink-light flex items-center justify-center z-10`}>
          <div class="text-center">
            <div class="text-4xl mb-4">🗺️</div>
            <p class={apply`text-pink-primary font-medium`}>
              地図を読み込み中...
            </p>
          </div>
        </div>
      )}
      
      <div ref={mapRef} class="w-full h-full rounded-lg" />
      
      {/* 地図コントロール */}
      <div class="absolute top-4 right-4 flex flex-col gap-2">
        {showCurrentLocation && (
          <button
            onClick={goToCurrentLocation}
            class={apply`w-10 h-10 bg-white rounded-lg shadow-medium flex items-center justify-center hover:bg-pink-light transition-colors`}
            title="現在地に移動"
          >
            📍
          </button>
        )}
        
        <button
          onClick={fitToVenues}
          class={apply`w-10 h-10 bg-white rounded-lg shadow-medium flex items-center justify-center hover:bg-pink-light transition-colors`}
          title="全ての店舗を表示"
        >
          🎯
        </button>
      </div>

      {/* 凡例 */}
      <div class={apply`absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-medium`}>
        <h4 class={apply`text-sm font-semibold text-pink-primary mb-2`}>
          凡例
        </h4>
        <div class="flex flex-col gap-1 text-xs">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-pink-primary rounded-full"></div>
            <span>営業中</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-gray-400 rounded-full"></div>
            <span>営業時間外</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>現在地</span>
          </div>
        </div>
      </div>
    </div>
  );
}