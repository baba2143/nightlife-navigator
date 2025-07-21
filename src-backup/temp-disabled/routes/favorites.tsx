import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
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
  dateAdded: string;
}

const favoriteVenues: Venue[] = [
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
    dateAdded: "2024-01-15",
  },
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
    dateAdded: "2024-01-10",
  },
];

export default function FavoritesPage(props: PageProps) {
  const sortBy = props.url.searchParams.get("sort") || "recent";

  const sortedVenues = [...favoriteVenues].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating;
      case "distance":
        return a.distance - b.distance;
      case "name":
        return a.name.localeCompare(b.name);
      case "recent":
      default:
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    }
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

  const getPriceRangeLabel = (priceRange: string) => {
    const labels: Record<string, string> = {
      budget: "¥",
      moderate: "¥¥",
      expensive: "¥¥¥",
      luxury: "¥¥¥¥",
    };
    return labels[priceRange] || "¥";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
  };

  return (
    <>
      <Head>
        <title>お気に入り - Nightlife Navigator</title>
        <meta name="description" content="お気に入りの店舗を管理" />
      </Head>
      
      <main class="min-h-screen bg-white pt-16">
        <div class="container mx-auto py-8 px-4">
          <div class="max-w-4xl mx-auto">
            {/* ヘッダー */}
            <div class="mb-8">
              <h1 class={apply`text-3xl font-heading font-bold text-pink-primary mb-4`}>
                お気に入り
              </h1>
              <nav class="flex items-center gap-2 text-sm text-text-secondary">
                <a href="/" class="hover:text-pink-primary">ホーム</a>
                <span>/</span>
                <span>お気に入り</span>
              </nav>
            </div>

            {/* 統計情報 */}
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div class={apply`card-soft text-center`}>
                <div class="text-2xl mb-2">❤️</div>
                <div class={apply`text-xl font-semibold text-pink-primary`}>{favoriteVenues.length}</div>
                <div class={apply`text-sm text-text-secondary`}>お気に入り</div>
              </div>
              <div class={apply`card-soft text-center`}>
                <div class="text-2xl mb-2">⭐</div>
                <div class={apply`text-xl font-semibold text-pink-primary`}>
                  {(favoriteVenues.reduce((sum, v) => sum + v.rating, 0) / favoriteVenues.length).toFixed(1)}
                </div>
                <div class={apply`text-sm text-text-secondary`}>平均評価</div>
              </div>
              <div class={apply`card-soft text-center`}>
                <div class="text-2xl mb-2">🏪</div>
                <div class={apply`text-xl font-semibold text-pink-primary`}>
                  {new Set(favoriteVenues.map(v => v.category)).size}
                </div>
                <div class={apply`text-sm text-text-secondary`}>カテゴリ数</div>
              </div>
              <div class={apply`card-soft text-center`}>
                <div class="text-2xl mb-2">🚶</div>
                <div class={apply`text-xl font-semibold text-pink-primary`}>
                  {Math.round(favoriteVenues.reduce((sum, v) => sum + v.distance, 0) / favoriteVenues.length)}m
                </div>
                <div class={apply`text-sm text-text-secondary`}>平均距離</div>
              </div>
            </div>

            {/* フィルターとソート */}
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <p class={apply`text-text-secondary`}>
                  {sortedVenues.length}件のお気に入り店舗
                </p>
              </div>
              <div class="flex gap-3">
                <select
                  class={apply`px-3 py-2 border border-border-medium rounded-md focus:border-pink-primary focus:ring-2 focus:ring-pink-primary focus:ring-opacity-20`}
                  onchange="window.location.href='?sort=' + this.value"
                >
                  <option value="recent" selected={sortBy === "recent"}>最近追加</option>
                  <option value="rating" selected={sortBy === "rating"}>評価順</option>
                  <option value="distance" selected={sortBy === "distance"}>距離順</option>
                  <option value="name" selected={sortBy === "name"}>名前順</option>
                </select>
                <button class={apply`btn-pink-outline`}>
                  🗂️ カテゴリ
                </button>
              </div>
            </div>

            {/* お気に入り一覧 */}
            {sortedVenues.length > 0 ? (
              <div class="space-y-6">
                {sortedVenues.map((venue) => (
                  <div key={venue.id} class={apply`card-soft hover:shadow-pink transition-all duration-200`}>
                    <div class="flex flex-col lg:flex-row gap-6">
                      {/* メイン情報 */}
                      <div class="flex-1">
                        <div class="flex justify-between items-start mb-4">
                          <div class="flex-1">
                            <h2 class={apply`text-xl font-heading font-semibold text-pink-primary mb-2`}>
                              {getCategoryIcon(venue.category)} {venue.name}
                            </h2>
                            <p class={apply`text-sm text-text-secondary mb-2`}>
                              📍 {venue.address}
                            </p>
                            <div class="flex items-center gap-3 mb-3">
                              <div class={apply`badge-pink text-sm`}>
                                {venue.rating} ★
                              </div>
                              <div class={apply`px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm`}>
                                {getPriceRangeLabel(venue.priceRange)}
                              </div>
                              <div class={apply`px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm`}>
                                {venue.distance}m
                              </div>
                              <div class={apply`px-2 py-1 rounded-full text-sm ${venue.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {venue.isOpen ? '営業中' : '営業時間外'}
                              </div>
                            </div>
                          </div>
                          <div class="text-right">
                            <div class={apply`text-xs text-text-tertiary mb-1`}>
                              追加日: {formatDate(venue.dateAdded)}
                            </div>
                            <button class={apply`text-red-500 hover:text-red-600 text-sm`}>
                              削除
                            </button>
                          </div>
                        </div>
                        
                        <p class={apply`text-text-primary mb-4 leading-relaxed`}>
                          {venue.description}
                        </p>
                        
                        <div class="flex flex-wrap gap-2 mb-4">
                          {venue.tags.map((tag, index) => (
                            <span key={index} class={apply`px-2 py-1 border border-pink-primary text-pink-primary bg-transparent rounded-full text-xs`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* アクション */}
                      <div class="lg:w-48 flex lg:flex-col gap-2">
                        <a
                          href={`/venues/${venue.id}`}
                          class={apply`btn-pink text-center flex-1 lg:flex-none`}
                        >
                          詳細を見る
                        </a>
                        <button class={apply`btn-pink-outline flex-1 lg:flex-none`}>
                          🗺️ 道順
                        </button>
                        <button class={apply`btn-pink-outline flex-1 lg:flex-none`}>
                          📞 電話
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div class="text-center py-16">
                <div class="text-6xl mb-6">💔</div>
                <h2 class={apply`text-2xl font-heading font-semibold text-pink-primary mb-4`}>
                  お気に入りがまだありません
                </h2>
                <p class={apply`text-text-secondary mb-8 max-w-md mx-auto`}>
                  気になる店舗を見つけて、お気に入りに追加してみましょう。
                  お気に入りの店舗はここで管理できます。
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="/search" class={apply`btn-pink`}>
                    🔍 店舗を探す
                  </a>
                  <a href="/map" class={apply`btn-pink-outline`}>
                    🗺️ 地図で探す
                  </a>
                </div>
              </div>
            )}

            {/* カテゴリ別統計 */}
            {sortedVenues.length > 0 && (
              <div class={apply`card-soft mt-8`}>
                <h3 class={apply`text-lg font-heading font-semibold text-pink-primary mb-4`}>
                  カテゴリ別統計
                </h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(
                    favoriteVenues.reduce((acc, venue) => {
                      acc[venue.category] = (acc[venue.category] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([category, count]) => (
                    <div key={category} class="text-center">
                      <div class="text-2xl mb-1">{getCategoryIcon(category)}</div>
                      <div class={apply`text-lg font-semibold text-pink-primary`}>{count}</div>
                      <div class={apply`text-sm text-text-secondary`}>{category}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}