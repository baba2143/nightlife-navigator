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
}

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
  },
];

export default function SearchPage(props: PageProps) {
  const query = props.url.searchParams.get("q") || "";
  const category = props.url.searchParams.get("category") || "all";

  const filteredVenues = sampleVenues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(query.toLowerCase()) ||
                         venue.description.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "all" || venue.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: "all", label: "すべて", icon: "🏪" },
    { id: "bar", label: "バー", icon: "🍸" },
    { id: "club", label: "クラブ", icon: "🎵" },
    { id: "lounge", label: "ラウンジ", icon: "🛋️" },
    { id: "restaurant", label: "レストラン", icon: "🍽️" },
    { id: "karaoke", label: "カラオケ", icon: "🎤" },
    { id: "pub", label: "パブ", icon: "🍺" },
  ];

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

  return (
    <>
      <Head>
        <title>店舗検索 - Nightlife Navigator</title>
        <meta name="description" content="夜の店舗を検索しよう" />
      </Head>
      
      <main class="min-h-screen bg-white pt-16">
        <div class="container mx-auto py-8 px-4">
          <div class="max-w-4xl mx-auto">
            {/* ヘッダー */}
            <div class="mb-8">
              <h1 class={apply`text-3xl font-heading font-bold text-pink-primary mb-4`}>
                店舗検索
              </h1>
              <nav class="flex items-center gap-2 text-sm text-text-secondary">
                <a href="/" class="hover:text-pink-primary">ホーム</a>
                <span>/</span>
                <span>検索</span>
              </nav>
            </div>

            {/* 検索フォーム */}
            <form method="GET" class="mb-8">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="md:col-span-2">
                  <input
                    type="text"
                    name="q"
                    placeholder="店舗名で検索..."
                    value={query}
                    class={apply`w-full px-4 py-3 rounded-lg border border-border-medium focus:border-pink-primary focus:ring-2 focus:ring-pink-primary focus:ring-opacity-20`}
                  />
                </div>
                <div>
                  <select
                    name="category"
                    class={apply`w-full px-4 py-3 rounded-lg border border-border-medium focus:border-pink-primary focus:ring-2 focus:ring-pink-primary focus:ring-opacity-20`}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} selected={category === cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div class="mt-4">
                <button
                  type="submit"
                  class={apply`btn-pink px-6 py-3`}
                >
                  🔍 検索
                </button>
              </div>
            </form>

            {/* 検索結果 */}
            <div class="mb-6">
              <p class={apply`text-text-secondary`}>
                {filteredVenues.length}件の店舗が見つかりました
              </p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredVenues.map((venue) => (
                <div key={venue.id} class={apply`card-soft hover:shadow-pink transition-all duration-200`}>
                  <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                      <h2 class={apply`text-xl font-heading font-semibold text-pink-primary mb-2`}>
                        {getCategoryIcon(venue.category)} {venue.name}
                      </h2>
                      <p class={apply`text-sm text-text-secondary mb-2`}>
                        {venue.address}
                      </p>
                    </div>
                    <div class={apply`badge-pink text-sm`}>
                      {venue.rating} ★
                    </div>
                  </div>
                  
                  <p class={apply`text-text-primary mb-4 leading-relaxed`}>
                    {venue.description}
                  </p>
                  
                  <div class="flex flex-wrap gap-2 mb-4">
                    <span class={apply`px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm`}>
                      {getPriceRangeLabel(venue.priceRange)}
                    </span>
                    <span class={apply`px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm`}>
                      {venue.distance}m
                    </span>
                    <span class={apply`px-3 py-1 rounded-full text-sm ${venue.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {venue.isOpen ? '営業中' : '営業時間外'}
                    </span>
                  </div>
                  
                  <div class="flex flex-wrap gap-2 mb-4">
                    {venue.tags.map((tag, index) => (
                      <span key={index} class={apply`px-2 py-1 border border-pink-primary text-pink-primary bg-transparent rounded-full text-xs`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div class="flex gap-3">
                    <a
                      href={`/venues/${venue.id}`}
                      class={apply`btn-pink-outline flex-1 text-center`}
                    >
                      詳細を見る
                    </a>
                    <button class={apply`btn-pink px-4`}>
                      ❤️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredVenues.length === 0 && (
              <div class="text-center py-12">
                <div class="text-6xl mb-4">🔍</div>
                <h2 class={apply`text-xl font-heading font-semibold text-pink-primary mb-2`}>
                  検索結果が見つかりませんでした
                </h2>
                <p class={apply`text-text-secondary`}>
                  別のキーワードや条件で検索してみてください
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}