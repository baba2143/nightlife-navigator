import { useState, useEffect } from "preact/hooks";
import { apply } from "twind";

interface DirectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  origin: { lat: number; lng: number; name?: string } | null;
  destination: { lat: number; lng: number; name?: string } | null;
  mode?: "walking" | "driving" | "transit" | "bicycling";
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

export default function DirectionsModal({
  isOpen,
  onClose,
  origin,
  destination,
  mode = "walking"
}: DirectionsModalProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState(mode);

  useEffect(() => {
    if (isOpen && origin && destination) {
      fetchDirections();
    }
  }, [isOpen, origin, destination, travelMode]);

  const fetchDirections = async () => {
    if (!origin || !destination) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/maps/directions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin,
          destination,
          mode: travelMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "ルート検索に失敗しました");
      }

      setRoutes(data.routes || []);
      setSelectedRoute(data.routes?.[0] || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ルート検索中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const getTravelModeIcon = (mode: string) => {
    const icons: Record<string, string> = {
      walking: "🚶",
      driving: "🚗",
      transit: "🚇",
      bicycling: "🚴",
    };
    return icons[mode] || "🚶";
  };

  const getStepIcon = (travelMode: string) => {
    const icons: Record<string, string> = {
      WALKING: "🚶",
      DRIVING: "🚗",
      TRANSIT: "🚇",
      BICYCLING: "🚴",
    };
    return icons[travelMode] || "➡️";
  };

  const openInGoogleMaps = () => {
    if (!origin || !destination) return;

    const url = `https://www.google.com/maps/dir/${origin.lat},${origin.lng}/${destination.lat},${destination.lng}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div class={apply`p-6 border-b border-border-light`}>
          <div class="flex justify-between items-start">
            <div>
              <h2 class={apply`text-xl font-heading font-semibold text-pink-primary mb-2`}>
                ルート案内
              </h2>
              <div class="text-sm text-text-secondary">
                <p>{origin?.name || "現在地"} → {destination?.name || "目的地"}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              class={apply`text-text-tertiary hover:text-text-primary text-2xl leading-none`}
            >
              ×
            </button>
          </div>

          {/* 移動方法選択 */}
          <div class="flex gap-2 mt-4">
            {[
              { mode: "walking", label: "徒歩", icon: "🚶" },
              { mode: "driving", label: "車", icon: "🚗" },
              { mode: "transit", label: "電車", icon: "🚇" },
              { mode: "bicycling", label: "自転車", icon: "🚴" },
            ].map((option) => (
              <button
                key={option.mode}
                onClick={() => setTravelMode(option.mode as any)}
                class={apply`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  travelMode === option.mode
                    ? 'bg-pink-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-pink-light'
                }`}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* コンテンツ */}
        <div class="flex-1 overflow-y-auto">
          {loading && (
            <div class="flex items-center justify-center p-8">
              <div class="text-center">
                <div class="text-4xl mb-4">🗺️</div>
                <p class={apply`text-pink-primary font-medium`}>
                  ルートを検索中...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div class="p-6 text-center">
              <div class="text-4xl mb-4">⚠️</div>
              <h3 class={apply`text-lg font-semibold text-pink-primary mb-2`}>
                エラーが発生しました
              </h3>
              <p class={apply`text-text-secondary mb-4`}>
                {error}
              </p>
              <button
                onClick={fetchDirections}
                class={apply`btn-pink`}
              >
                再試行
              </button>
            </div>
          )}

          {!loading && !error && selectedRoute && (
            <div class="p-6">
              {/* ルート概要 */}
              <div class={apply`card-soft mb-6`}>
                <div class="flex items-center justify-between mb-4">
                  <h3 class={apply`text-lg font-semibold text-pink-primary`}>
                    {getTravelModeIcon(travelMode)} {selectedRoute.summary || "推奨ルート"}
                  </h3>
                  <button
                    onClick={openInGoogleMaps}
                    class={apply`btn-pink-outline text-sm`}
                  >
                    Google Maps で開く
                  </button>
                </div>
                
                <div class="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div class={apply`text-2xl font-bold text-pink-primary`}>
                      {selectedRoute.distance.text}
                    </div>
                    <div class={apply`text-sm text-text-secondary`}>距離</div>
                  </div>
                  <div>
                    <div class={apply`text-2xl font-bold text-pink-primary`}>
                      {selectedRoute.duration.text}
                    </div>
                    <div class={apply`text-sm text-text-secondary`}>所要時間</div>
                  </div>
                </div>
              </div>

              {/* ステップバイステップ案内 */}
              <div>
                <h4 class={apply`text-lg font-semibold text-pink-primary mb-4`}>
                  詳細ルート
                </h4>
                
                {selectedRoute.legs.map((leg, legIndex) => (
                  <div key={legIndex} class="mb-6">
                    <div class="space-y-3">
                      {leg.steps.map((step, stepIndex) => (
                        <div key={stepIndex} class="flex gap-3">
                          <div class="flex-shrink-0 w-8 h-8 bg-pink-light rounded-full flex items-center justify-center text-sm">
                            {getStepIcon(step.travel_mode)}
                          </div>
                          <div class="flex-1">
                            <p class={apply`text-text-primary mb-1`}>
                              {step.html_instructions}
                            </p>
                            <div class="flex gap-4 text-xs text-text-secondary">
                              <span>{step.distance.text}</span>
                              <span>{step.duration.text}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 代替ルート */}
              {routes.length > 1 && (
                <div class="mt-6">
                  <h4 class={apply`text-lg font-semibold text-pink-primary mb-4`}>
                    代替ルート
                  </h4>
                  <div class="space-y-2">
                    {routes.slice(1).map((route, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedRoute(route)}
                        class={apply`w-full text-left p-3 border border-border-light rounded-lg hover:bg-pink-light transition-colors`}
                      >
                        <div class="flex justify-between items-center">
                          <span class={apply`font-medium text-text-primary`}>
                            ルート {index + 2}
                          </span>
                          <div class="flex gap-4 text-sm text-text-secondary">
                            <span>{route.distance.text}</span>
                            <span>{route.duration.text}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}