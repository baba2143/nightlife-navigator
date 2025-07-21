import { Handlers } from "$fresh/server.ts";

interface PlacesSearchRequest {
  query?: string;
  location?: {
    lat: number;
    lng: number;
  };
  radius?: number;
  type?: string;
  keyword?: string;
}

interface Place {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  price_level?: number;
  types: string[];
  opening_hours?: {
    open_now: boolean;
    periods?: any[];
  };
  photos?: {
    photo_reference: string;
    height: number;
    width: number;
  }[];
  business_status?: string;
}

interface PlacesResponse {
  results: Place[];
  status: string;
  next_page_token?: string;
}

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const query = url.searchParams.get("query") || "";
      const lat = parseFloat(url.searchParams.get("lat") || "35.6762");
      const lng = parseFloat(url.searchParams.get("lng") || "139.6503");
      const radius = parseInt(url.searchParams.get("radius") || "5000");
      const type = url.searchParams.get("type") || "night_club|bar|restaurant";
      const keyword = url.searchParams.get("keyword") || "nightlife";

      const googleMapsApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
      
      if (!googleMapsApiKey) {
        // API Key がない場合はモックデータを返す
        return getMockPlacesData(lat, lng, query, type);
      }

      let placesUrl: URL;
      
      if (query) {
        // テキスト検索
        placesUrl = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
        placesUrl.searchParams.set("query", `${query} nightlife tokyo`);
        placesUrl.searchParams.set("location", `${lat},${lng}`);
        placesUrl.searchParams.set("radius", radius.toString());
      } else {
        // 近隣検索
        placesUrl = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
        placesUrl.searchParams.set("location", `${lat},${lng}`);
        placesUrl.searchParams.set("radius", radius.toString());
        placesUrl.searchParams.set("type", type);
        placesUrl.searchParams.set("keyword", keyword);
      }

      placesUrl.searchParams.set("language", "ja");
      placesUrl.searchParams.set("region", "JP");
      placesUrl.searchParams.set("key", googleMapsApiKey);

      const response = await fetch(placesUrl.toString());
      
      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const placesData: PlacesResponse = await response.json();

      if (placesData.status !== "OK" && placesData.status !== "ZERO_RESULTS") {
        return new Response(JSON.stringify({
          error: "場所検索に失敗しました",
          status: placesData.status,
          message: getPlacesStatusMessage(placesData.status)
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 結果をNightlife Navigator形式に変換
      const venues = placesData.results.map(place => ({
        id: place.place_id,
        name: place.name,
        category: mapPlaceTypeToCategory(place.types),
        address: place.formatted_address,
        rating: place.rating || 0,
        priceRange: mapPriceLevelToRange(place.price_level),
        distance: calculateDistance(
          lat, lng,
          place.geometry.location.lat,
          place.geometry.location.lng
        ),
        description: `${place.name} - ${place.formatted_address}`,
        tags: place.types.slice(0, 3),
        isOpen: place.opening_hours?.open_now || false,
        coordinates: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
        photos: place.photos?.map(photo => ({
          reference: photo.photo_reference,
          width: photo.width,
          height: photo.height,
        })) || [],
        businessStatus: place.business_status,
      }));

      return new Response(JSON.stringify({
        venues,
        total: venues.length,
        status: placesData.status,
        nextPageToken: placesData.next_page_token,
      }), {
        headers: { "Content-Type": "application/json" },
      });

    } catch (error) {
      console.error("Places API error:", error);
      
      return new Response(JSON.stringify({
        error: "場所検索中にエラーが発生しました",
        message: error.message
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async POST(req) {
    try {
      const body: PlacesSearchRequest = await req.json();
      const { query, location, radius = 5000, type, keyword } = body;

      if (!location) {
        return new Response(JSON.stringify({
          error: "位置情報が必要です",
          required: ["location"]
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // GET リクエストと同じロジックを使用
      const searchParams = new URLSearchParams();
      if (query) searchParams.set("query", query);
      searchParams.set("lat", location.lat.toString());
      searchParams.set("lng", location.lng.toString());
      searchParams.set("radius", radius.toString());
      if (type) searchParams.set("type", type);
      if (keyword) searchParams.set("keyword", keyword);

      const getUrl = new URL(`${req.url}?${searchParams.toString()}`);
      const getRequest = new Request(getUrl.toString(), { method: "GET" });
      
      return await handler.GET!(getRequest, { params: {} });

    } catch (error) {
      return new Response(JSON.stringify({
        error: "リクエストの処理中にエラーが発生しました"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};

// モックデータ生成（API Key がない場合）
function getMockPlacesData(lat: number, lng: number, query: string, type: string) {
  const mockVenues = [
    {
      id: "mock_1",
      name: "GENTLE LOUNGE",
      category: "lounge",
      address: "渋谷区渋谷1-2-3",
      rating: 4.8,
      priceRange: "expensive",
      distance: 250,
      description: "やさしいピンクの温かみのあるデザインで、心地よい雰囲気を演出。",
      tags: ["ラウンジ", "やさしい", "ピンク"],
      isOpen: true,
      coordinates: { lat: 35.6598, lng: 139.7006 },
      photos: [],
      businessStatus: "OPERATIONAL",
    },
    {
      id: "mock_2",
      name: "NEON BAR",
      category: "bar",
      address: "新宿区新宿2-3-4",
      rating: 4.5,
      priceRange: "moderate",
      distance: 800,
      description: "ネオンライトが美しい大人のバー。カクテルの種類が豊富。",
      tags: ["バー", "ネオン", "カクテル"],
      isOpen: true,
      coordinates: { lat: 35.6904, lng: 139.6956 },
      photos: [],
      businessStatus: "OPERATIONAL",
    },
    {
      id: "mock_3",
      name: "TOKYO DINING",
      category: "restaurant",
      address: "港区六本木3-4-5",
      rating: 4.3,
      priceRange: "luxury",
      distance: 1200,
      description: "高級感あふれるダイニングレストラン。",
      tags: ["レストラン", "高級", "ディナー"],
      isOpen: false,
      coordinates: { lat: 35.6627, lng: 139.7314 },
      photos: [],
      businessStatus: "OPERATIONAL",
    },
  ];

  // クエリでフィルタリング
  const filteredVenues = query 
    ? mockVenues.filter(venue => 
        venue.name.toLowerCase().includes(query.toLowerCase()) ||
        venue.description.toLowerCase().includes(query.toLowerCase())
      )
    : mockVenues;

  return new Response(JSON.stringify({
    venues: filteredVenues,
    total: filteredVenues.length,
    status: "OK",
    isDemo: true,
    message: "これはデモ用のモックデータです。Google Places API キーを設定すると実際の店舗データを取得できます。"
  }), {
    headers: { "Content-Type": "application/json" },
  });
}

// Google Places の type を Nightlife Navigator のカテゴリにマッピング
function mapPlaceTypeToCategory(types: string[]): string {
  const typeMapping: Record<string, string> = {
    "night_club": "club",
    "bar": "bar",
    "restaurant": "restaurant",
    "cafe": "cafe",
    "meal_takeaway": "restaurant",
    "lodging": "hotel",
    "tourist_attraction": "attraction",
  };

  for (const type of types) {
    if (typeMapping[type]) {
      return typeMapping[type];
    }
  }

  // デフォルトはbar
  return "bar";
}

// Google Places の price_level を価格帯にマッピング
function mapPriceLevelToRange(priceLevel?: number): string {
  const mapping: Record<number, string> = {
    0: "budget",
    1: "budget",
    2: "moderate",
    3: "expensive",
    4: "luxury",
  };

  return priceLevel !== undefined ? mapping[priceLevel] || "moderate" : "moderate";
}

// 距離計算（Haversine式）
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // 地球の半径（メートル）
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Google Places API のステータスメッセージを日本語に変換
function getPlacesStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    "ZERO_RESULTS": "検索条件に一致する場所が見つかりませんでした",
    "OVER_QUERY_LIMIT": "APIの利用制限を超えました",
    "REQUEST_DENIED": "リクエストが拒否されました",
    "INVALID_REQUEST": "リクエストが無効です",
    "UNKNOWN_ERROR": "サーバーエラーが発生しました",
  };
  
  return messages[status] || "不明なエラーが発生しました";
}