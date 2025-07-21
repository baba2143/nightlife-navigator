import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { apply } from "twind";
import GoogleMapComponent from "../islands/GoogleMapComponent.tsx";

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

// サンプルデータ（座標付き）
const sampleVenues: Venue[] = [
  {
    id: 1,
    name: "GENTLE LOUNGE",
    category: "lounge",
    address: "渋谷区渋谷1-2-3",
    rating: 4.8,
    priceRange: "expensive",
    distance: 250,
    description: "やさしいピンクの温かみのあるデザインで、心地よい雰囲気を演出。",
    tags: ["ラウンジ", "やさしい", "ピンク"],
    isOpen: true,
    coordinates: { lat: 35.6598, lng: 139.7006 }, // 渋谷
  },
  {
    id: 2,
    name: "NEON BAR",
    category: "bar",
    address: "新宿区新宿2-3-4",
    rating: 4.5,
    priceRange: "moderate",
    distance: 800,
    description: "ネオンライトが美しい大人のバー。カクテルの種類が豊富。",
    tags: ["バー", "ネオン", "カクテル"],
    isOpen: true,
    coordinates: { lat: 35.6904, lng: 139.6956 }, // 新宿
  },
  {
    id: 3,
    name: "TOKYO DINING",
    category: "restaurant",
    address: "港区六本木3-4-5",
    rating: 4.3,
    priceRange: "luxury",
    distance: 1200,
    description: "高級感あふれるダイニングレストラン。",
    tags: ["レストラン", "高級", "ディナー"],
    isOpen: false,
    coordinates: { lat: 35.6627, lng: 139.7314 }, // 六本木
  },
  {
    id: 4,
    name: "MUSIC CLUB WAVE",
    category: "club",
    address: "新宿区歌舞伎町1-5-6",
    rating: 4.6,
    priceRange: "moderate",
    distance: 900,
    description: "最新の音響システムと照明で楽しむクラブ。",
    tags: ["クラブ", "音楽", "DJ"],
    isOpen: true,
    coordinates: { lat: 35.6948, lng: 139.7026 }, // 歌舞伎町
  },
  {
    id: 5,
    name: "KARAOKE PARADISE",
    category: "karaoke",
    address: "渋谷区道玄坂2-7-8",
    rating: 4.2,
    priceRange: "budget",
    distance: 450,
    description: "最新のカラオケ機器と広々とした個室。",
    tags: ["カラオケ", "個室", "パーティー"],
    isOpen: true,
    coordinates: { lat: 35.6581, lng: 139.6979 }, // 道玄坂
  },
];

export default function MapPage(props: PageProps) {
  const category = props.url.searchParams.get("category") || "all";
  const priceRange = props.url.searchParams.get("priceRange") || "";
  const openOnly = props.url.searchParams.get("openOnly") === "true";

  // フィルター適用
  const filteredVenues = sampleVenues.filter(venue => {
    const matchesCategory = category === "all" || venue.category === category;
    const matchesPriceRange = !priceRange || venue.priceRange === priceRange;
    const matchesOpenStatus = !openOnly || venue.isOpen;
    
    return matchesCategory && matchesPriceRange && matchesOpenStatus;
  });

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      bar: "🍸",
      club: "🎵",
      lounge: "🛋️",
      restaurant: "🍽️",
      karaoke: "🎤",
      pub: "🍺",
    };
    return icons[category] || "🏪";
  };

  const handleVenueSelect = (venue: Venue) => {
    // 店舗詳細ページに遷移
    window.open(`/venues/${venue.id}`, '_blank');
  };

  // Google Maps API Key (環境変数から取得するか、デモ用)
  const googleMapsApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY") || "YOUR_API_KEY_HERE";

  return (
    <>
      <Head>
        <title>地図 - Nightlife Navigator</title>
        <meta name="description" content="周辺の店舗を地図で確認" />
      </Head>
      
      <main class="min-h-screen bg-white pt-16">
        <div class="container mx-auto py-8 px-4">
          <div class="max-w-6xl mx-auto">
            {/* ヘッダー */}
            <div class="mb-8">
              <h1 class={apply`text-3xl font-heading font-bold text-pink-primary mb-4`}>
                地図
              </h1>
              <nav class="flex items-center gap-2 text-sm text-text-secondary">
                <a href="/" class="hover:text-pink-primary">ホーム</a>
                <span>/</span>
                <span>地図</span>
              </nav>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* サイドパネル */}
              <div class="lg:col-span-1">
                <form method="GET" class={apply`card-soft mb-6`}>
                  <h2 class={apply`text-lg font-heading font-semibold text-pink-primary mb-4`}>
                    フィルター
                  </h2>
                  
                  <div class="space-y-4">
                    <div>
                      <label class={apply`block text-sm font-medium text-text-primary mb-2`}>
                        カテゴリ
                      </label>
                      <select 
                        name="category"
                        value={category}
                        class={apply`w-full px-3 py-2 border border-border-medium rounded-md focus:border-pink-primary focus:ring-2 focus:ring-pink-primary focus:ring-opacity-20`}
                      >
                        <option value="all">すべて</option>
                        <option value="bar">🍸 バー</option>
                        <option value="club">🎵 クラブ</option>
                        <option value="lounge">🛋️ ラウンジ</option>
                        <option value="restaurant">🍽️ レストラン</option>
                        <option value="karaoke">🎤 カラオケ</option>
                        <option value="pub">🍺 パブ</option>
                      </select>
                    </div>
                    
                    <div>
                      <label class={apply`block text-sm font-medium text-text-primary mb-2`}>
                        価格帯
                      </label>
                      <select 
                        name="priceRange"
                        value={priceRange}
                        class={apply`w-full px-3 py-2 border border-border-medium rounded-md focus:border-pink-primary focus:ring-2 focus:ring-pink-primary focus:ring-opacity-20`}
                      >
                        <option value="">すべて</option>
                        <option value="budget">¥ (リーズナブル)</option>
                        <option value="moderate">¥¥ (中程度)</option>
                        <option value="expensive">¥¥¥ (高め)</option>
                        <option value="luxury">¥¥¥¥ (高級)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label class="flex items-center">
                        <input 
                          type="checkbox" 
                          name="openOnly" 
                          value="true"
                          checked={openOnly}
                          class="mr-2 text-pink-primary focus:ring-pink-primary" 
                        />
                        <span class={apply`text-sm text-text-primary`}>営業中のみ</span>
                      </label>
                    </div>
                  </div>
                  
                  <button type="submit" class={apply`btn-pink w-full mt-6`}>
                    フィルターを適用
                  </button>
                </form>
                
                {/* 店舗リスト */}
                <div class={apply`card-soft`}>
                  <h3 class={apply`text-lg font-heading font-semibold text-pink-primary mb-4`}>
                    近くの店舗 ({filteredVenues.length}件)
                  </h3>
                  <div class="space-y-3 max-h-96 overflow-y-auto">
                    {filteredVenues.map((venue) => (
                      <div 
                        key={venue.id}
                        class="p-3 border border-border-light rounded-lg hover:bg-pink-light cursor-pointer transition-colors"
                        onClick={() => handleVenueSelect(venue)}
                      >
                        <div class={apply`font-medium text-text-primary mb-1`}>
                          {getCategoryIcon(venue.category)} {venue.name}
                        </div>
                        <div class={apply`text-xs text-text-secondary mb-1`}>
                          {venue.rating} ★ • {venue.distance}m
                        </div>
                        <div class={apply`text-xs ${venue.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                          {venue.isOpen ? '営業中' : '営業時間外'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 地図エリア */}
              <div class="lg:col-span-3">
                <div class={apply`card-soft p-0 h-96 lg:h-[600px] overflow-hidden`}>
                  <GoogleMapComponent
                    venues={filteredVenues}
                    center={{ lat: 35.6762, lng: 139.6503 }}
                    zoom={13}
                    onVenueSelect={handleVenueSelect}
                    showCurrentLocation={true}
                    apiKey={googleMapsApiKey}
                  />
                </div>
                
                {/* 地図下部の統計情報 */}
                <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class={apply`card-soft text-center`}>
                    <div class="text-2xl mb-2">🏪</div>
                    <div class={apply`text-lg font-semibold text-pink-primary`}>
                      {filteredVenues.length}
                    </div>
                    <div class={apply`text-sm text-text-secondary`}>表示中の店舗</div>
                  </div>
                  
                  <div class={apply`card-soft text-center`}>
                    <div class="text-2xl mb-2">🕐</div>
                    <div class={apply`text-lg font-semibold text-pink-primary`}>
                      {filteredVenues.filter(v => v.isOpen).length}
                    </div>
                    <div class={apply`text-sm text-text-secondary`}>営業中</div>
                  </div>
                  
                  <div class={apply`card-soft text-center`}>
                    <div class="text-2xl mb-2">⭐</div>
                    <div class={apply`text-lg font-semibold text-pink-primary`}>
                      {filteredVenues.length > 0 
                        ? (filteredVenues.reduce((sum, v) => sum + v.rating, 0) / filteredVenues.length).toFixed(1)
                        : "0.0"
                      }
                    </div>
                    <div class={apply`text-sm text-text-secondary`}>平均評価</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}