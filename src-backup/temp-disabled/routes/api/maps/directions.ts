import { Handlers } from "$fresh/server.ts";

interface DirectionsRequest {
  origin: {
    lat: number;
    lng: number;
  };
  destination: {
    lat: number;
    lng: number;
  };
  mode?: "driving" | "walking" | "transit" | "bicycling";
}

interface DirectionsResponse {
  routes: Route[];
  status: string;
}

interface Route {
  legs: Leg[];
  overview_polyline: {
    points: string;
  };
  summary: string;
  duration: {
    text: string;
    value: number;
  };
  distance: {
    text: string;
    value: number;
  };
}

interface Leg {
  steps: Step[];
  duration: {
    text: string;
    value: number;
  };
  distance: {
    text: string;
    value: number;
  };
  start_address: string;
  end_address: string;
}

interface Step {
  html_instructions: string;
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  start_location: {
    lat: number;
    lng: number;
  };
  end_location: {
    lat: number;
    lng: number;
  };
  travel_mode: string;
}

export const handler: Handlers = {
  async POST(req) {
    try {
      const body: DirectionsRequest = await req.json();
      const { origin, destination, mode = "walking" } = body;

      if (!origin || !destination) {
        return new Response(JSON.stringify({
          error: "起点と終点の座標が必要です",
          required: ["origin", "destination"]
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const googleMapsApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
      
      if (!googleMapsApiKey) {
        return new Response(JSON.stringify({
          error: "Google Maps API キーが設定されていません"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Google Directions API を呼び出し
      const directionsUrl = new URL("https://maps.googleapis.com/maps/api/directions/json");
      directionsUrl.searchParams.set("origin", `${origin.lat},${origin.lng}`);
      directionsUrl.searchParams.set("destination", `${destination.lat},${destination.lng}`);
      directionsUrl.searchParams.set("mode", mode);
      directionsUrl.searchParams.set("language", "ja");
      directionsUrl.searchParams.set("region", "JP");
      directionsUrl.searchParams.set("key", googleMapsApiKey);

      const response = await fetch(directionsUrl.toString());
      
      if (!response.ok) {
        throw new Error(`Google Directions API error: ${response.status}`);
      }

      const directionsData: DirectionsResponse = await response.json();

      if (directionsData.status !== "OK") {
        return new Response(JSON.stringify({
          error: "ルート検索に失敗しました",
          status: directionsData.status,
          message: getStatusMessage(directionsData.status)
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // レスポンスデータを整形
      const formattedResponse = {
        routes: directionsData.routes.map(route => ({
          ...route,
          legs: route.legs.map(leg => ({
            ...leg,
            steps: leg.steps.map(step => ({
              ...step,
              html_instructions: cleanHtmlInstructions(step.html_instructions),
            })),
          })),
        })),
        status: directionsData.status,
      };

      return new Response(JSON.stringify(formattedResponse), {
        headers: { "Content-Type": "application/json" },
      });

    } catch (error) {
      console.error("Directions API error:", error);
      
      return new Response(JSON.stringify({
        error: "ルート検索中にエラーが発生しました",
        message: error.message
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  // 簡易的なルート情報を生成（API無しでのデモ用）
  async GET(req) {
    try {
      const url = new URL(req.url);
      const originLat = parseFloat(url.searchParams.get("originLat") || "0");
      const originLng = parseFloat(url.searchParams.get("originLng") || "0");
      const destLat = parseFloat(url.searchParams.get("destLat") || "0");
      const destLng = parseFloat(url.searchParams.get("destLng") || "0");
      const mode = url.searchParams.get("mode") || "walking";

      if (!originLat || !originLng || !destLat || !destLng) {
        return new Response(JSON.stringify({
          error: "座標パラメータが不足しています"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 簡易的な距離と時間の計算
      const distance = calculateDistance(originLat, originLng, destLat, destLng);
      const { duration, speed } = getEstimatedDuration(distance, mode);

      const mockRoute: Route = {
        legs: [{
          steps: [
            {
              html_instructions: "出発地点から目的地に向かいます",
              distance: { text: `${distance.toFixed(1)}km`, value: Math.round(distance * 1000) },
              duration: { text: duration, value: getDurationInSeconds(duration) },
              start_location: { lat: originLat, lng: originLng },
              end_location: { lat: destLat, lng: destLng },
              travel_mode: mode.toUpperCase(),
            }
          ],
          duration: { text: duration, value: getDurationInSeconds(duration) },
          distance: { text: `${distance.toFixed(1)}km`, value: Math.round(distance * 1000) },
          start_address: `${originLat}, ${originLng}`,
          end_address: `${destLat}, ${destLng}`,
        }],
        overview_polyline: {
          points: "demo_polyline_data"
        },
        summary: `${mode} ルート`,
        duration: { text: duration, value: getDurationInSeconds(duration) },
        distance: { text: `${distance.toFixed(1)}km`, value: Math.round(distance * 1000) },
      };

      return new Response(JSON.stringify({
        routes: [mockRoute],
        status: "OK",
        isDemo: true,
        message: "これはデモ用の簡易ルート情報です"
      }), {
        headers: { "Content-Type": "application/json" },
      });

    } catch (error) {
      return new Response(JSON.stringify({
        error: "ルート計算中にエラーが発生しました"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};

// Haversine式による距離計算
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 地球の半径（km）
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// 移動方法に基づく推定時間
function getEstimatedDuration(distance: number, mode: string): { duration: string; speed: number } {
  const speeds = {
    walking: 5,    // km/h
    bicycling: 15, // km/h
    driving: 30,   // km/h (市街地)
    transit: 20,   // km/h (公共交通機関)
  };

  const speed = speeds[mode as keyof typeof speeds] || speeds.walking;
  const hours = distance / speed;
  const minutes = Math.round(hours * 60);

  let duration: string;
  if (minutes < 60) {
    duration = `${minutes}分`;
  } else {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    duration = m > 0 ? `${h}時間${m}分` : `${h}時間`;
  }

  return { duration, speed };
}

function getDurationInSeconds(duration: string): number {
  const hoursMatch = duration.match(/(\d+)時間/);
  const minutesMatch = duration.match(/(\d+)分/);
  
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
  
  return (hours * 60 + minutes) * 60;
}

// HTMLタグを除去してクリーンな指示文に変換
function cleanHtmlInstructions(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

// Google Directions API のステータスメッセージを日本語に変換
function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    "NOT_FOUND": "起点または終点が見つかりませんでした",
    "ZERO_RESULTS": "指定された地点間のルートが見つかりませんでした",
    "MAX_WAYPOINTS_EXCEEDED": "経由地点が多すぎます",
    "INVALID_REQUEST": "リクエストが無効です",
    "OVER_QUERY_LIMIT": "APIの利用制限を超えました",
    "REQUEST_DENIED": "リクエストが拒否されました",
    "UNKNOWN_ERROR": "サーバーエラーが発生しました",
  };
  
  return messages[status] || "不明なエラーが発生しました";
}