import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { apply } from "twind";
import ImageGallery from "../../islands/ImageGallery.tsx";

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
  phone?: string;
  website?: string;
  hours?: string;
  images?: string[];
}

const sampleVenues: Record<number, Venue> = {
  1: {
    id: 1,
    name: "GENTLE LOUNGE",
    category: "lounge",
    address: "渋谷区渋谷1-2-3",
    rating: 4.8,
    priceRange: "expensive",
    distance: 250,
    description: "やさしいピンクの温かみのあるデザインで、心地よい雰囲気を演出。最高品質のカクテルと音楽で、特別な夜をお過ごしください。",
    tags: ["ラウンジ", "やさしい", "ピンク", "カクテル"],
    isOpen: true,
    phone: "03-1234-5678",
    website: "https://gentle-lounge.com",
    hours: "18:00 - 02:00",
    images: ["/venue-1-1.jpg", "/venue-1-2.jpg", "/venue-1-3.jpg"],
  },
  2: {
    id: 2,
    name: "NEON BAR",
    category: "bar",
    address: "新宿区新宿2-3-4",
    rating: 4.5,
    priceRange: "moderate",
    distance: 800,
    description: "ネオンライトが美しい大人のバー。カクテルの種類が豊富で、熟練のバーテンダーが最高の一杯をお作りします。",
    tags: ["バー", "ネオン", "カクテル", "大人"],
    isOpen: true,
    phone: "03-2345-6789",
    website: "https://neon-bar.com",
    hours: "17:00 - 01:00",
    images: ["/venue-2-1.jpg", "/venue-2-2.jpg"],
  },
  3: {
    id: 3,
    name: "TOKYO DINING",
    category: "restaurant",
    address: "港区六本木3-4-5",
    rating: 4.3,
    priceRange: "luxury",
    distance: 1200,
    description: "高級感あふれるダイニングレストラン。シェフが厳選した食材を使用した創作料理をお楽しみください。",
    tags: ["レストラン", "高級", "ディナー", "創作料理"],
    isOpen: false,
    phone: "03-3456-7890",
    website: "https://tokyo-dining.com",
    hours: "18:00 - 23:00",
    images: ["/venue-3-1.jpg"],
  },
};

export default function VenueDetailPage(props: PageProps) {
  const id = parseInt(props.params.id);
  const venue = sampleVenues[id];

  if (!venue) {
    return (
      <>
        <Head>
          <title>店舗が見つかりません - Nightlife Navigator</title>
        </Head>
        <main class="min-h-screen bg-white flex items-center justify-center">
          <div class="text-center">
            <div class="text-6xl mb-4">🏪</div>
            <h1 class={apply`text-2xl font-heading font-bold text-pink-primary mb-2`}>
              店舗が見つかりません
            </h1>
            <p class={apply`text-text-secondary mb-6`}>
              指定された店舗は存在しないか、削除された可能性があります。
            </p>
            <a href="/search" class={apply`btn-pink`}>
              検索に戻る
            </a>
          </div>
        </main>
      </>
    );
  }

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
        <title>{venue.name} - Nightlife Navigator</title>
        <meta name="description" content={venue.description} />
      </Head>
      
      <main class="min-h-screen bg-white pt-16">
        <div class="container mx-auto py-8 px-4">
          <div class="max-w-4xl mx-auto">
            {/* ナビゲーション */}
            <nav class="flex items-center gap-2 text-sm text-text-secondary mb-8">
              <a href="/" class="hover:text-pink-primary">ホーム</a>
              <span>/</span>
              <a href="/search" class="hover:text-pink-primary">検索</a>
              <span>/</span>
              <span>{venue.name}</span>
            </nav>

            {/* ヘッダー */}
            <div class="mb-8">
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <h1 class={apply`text-3xl font-heading font-bold text-pink-primary mb-2`}>
                    {getCategoryIcon(venue.category)} {venue.name}
                  </h1>
                  <p class={apply`text-text-secondary mb-2`}>
                    📍 {venue.address}
                  </p>
                  <div class="flex items-center gap-4">
                    <div class={apply`badge-pink`}>
                      {venue.rating} ★
                    </div>
                    <div class={apply`px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm`}>
                      {getPriceRangeLabel(venue.priceRange)}
                    </div>
                    <div class={apply`px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm`}>
                      {venue.distance}m
                    </div>
                    <div class={apply`px-3 py-1 rounded-full text-sm ${venue.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {venue.isOpen ? '営業中' : '営業時間外'}
                    </div>
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <div class="flex gap-3 mb-6">
                <button class={apply`btn-pink flex items-center gap-2`}>
                  ❤️ お気に入りに追加
                </button>
                <button class={apply`btn-pink-outline flex items-center gap-2`}>
                  🗺️ 道順を見る
                </button>
                <button class={apply`btn-pink-outline flex items-center gap-2`}>
                  📞 電話をかける
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* メインコンテンツ */}
              <div class="lg:col-span-2 space-y-8">
                {/* 説明 */}
                <div class={apply`card-soft`}>
                  <h2 class={apply`text-xl font-heading font-semibold text-pink-primary mb-4`}>
                    店舗について
                  </h2>
                  <p class={apply`text-text-primary leading-relaxed`}>
                    {venue.description}
                  </p>
                </div>

                {/* タグ */}
                <div class={apply`card-soft`}>
                  <h3 class={apply`text-lg font-heading font-semibold text-pink-primary mb-4`}>
                    タグ
                  </h3>
                  <div class="flex flex-wrap gap-2">
                    {venue.tags.map((tag, index) => (
                      <span key={index} class={apply`px-3 py-1 border border-pink-primary text-pink-primary bg-transparent rounded-full text-sm`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 画像ギャラリー */}
                <div class={apply`card-soft mb-6`}>
                  <h3 class={apply`text-lg font-heading font-semibold text-pink-primary mb-4`}>
                    店舗画像
                  </h3>
                  <ImageGallery
                    category="venue"
                    venueId={venue.id}
                    layout="grid"
                    size="medium"
                    maxImages={6}
                    onImageSelect={(image) => {
                      console.log('Selected image:', image);
                    }}
                  />
                  <div class="mt-4 text-center">
                    <a 
                      href={`/venue-manager?venueId=${venue.id}`}
                      class={apply`btn-pink-outline text-sm`}
                    >
                      すべての画像を見る
                    </a>
                  </div>
                </div>

                {/* レビューセクション */}
                <div class={apply`card-soft`}>
                  <h3 class={apply`text-lg font-heading font-semibold text-pink-primary mb-4`}>
                    レビュー
                  </h3>
                  <div class="space-y-4">
                    <div class={apply`border-l-4 border-pink-primary pl-4`}>
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                          <div class={apply`w-8 h-8 bg-pink-light rounded-full flex items-center justify-center text-pink-primary font-semibold`}>
                            田
                          </div>
                          <span class={apply`font-semibold text-text-primary`}>田中太郎</span>
                        </div>
                        <div class={apply`badge-pink text-xs`}>5.0 ★</div>
                      </div>
                      <p class={apply`text-text-secondary text-sm`}>
                        雰囲気が最高で、スタッフの対応も素晴らしかったです。また来たいと思います。
                      </p>
                    </div>
                    
                    <div class={apply`border-l-4 border-pink-primary pl-4`}>
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                          <div class={apply`w-8 h-8 bg-pink-light rounded-full flex items-center justify-center text-pink-primary font-semibold`}>
                            佐
                          </div>
                          <span class={apply`font-semibold text-text-primary`}>佐藤花子</span>
                        </div>
                        <div class={apply`badge-pink text-xs`}>4.5 ★</div>
                      </div>
                      <p class={apply`text-text-secondary text-sm`}>
                        カクテルの種類が豊富で、どれも美味しかったです。デザインもおしゃれで素敵でした。
                      </p>
                    </div>
                  </div>
                  
                  <div class="mt-6">
                    <button class={apply`btn-pink-outline w-full`}>
                      レビューを書く
                    </button>
                  </div>
                </div>
              </div>

              {/* サイドバー */}
              <div class="space-y-6">
                {/* 基本情報 */}
                <div class={apply`card-soft`}>
                  <h3 class={apply`text-lg font-heading font-semibold text-pink-primary mb-4`}>
                    基本情報
                  </h3>
                  <div class="space-y-3">
                    <div>
                      <div class={apply`text-sm font-medium text-text-primary`}>営業時間</div>
                      <div class={apply`text-sm text-text-secondary`}>{venue.hours}</div>
                    </div>
                    <div>
                      <div class={apply`text-sm font-medium text-text-primary`}>電話番号</div>
                      <div class={apply`text-sm text-text-secondary`}>{venue.phone}</div>
                    </div>
                    <div>
                      <div class={apply`text-sm font-medium text-text-primary`}>ウェブサイト</div>
                      <a href={venue.website} class={apply`text-sm text-pink-primary hover:text-pink-primary-dark`}>
                        {venue.website}
                      </a>
                    </div>
                    <div>
                      <div class={apply`text-sm font-medium text-text-primary`}>カテゴリ</div>
                      <div class={apply`text-sm text-text-secondary`}>{venue.category}</div>
                    </div>
                  </div>
                </div>

                {/* 地図プレースホルダー */}
                <div class={apply`card-soft`}>
                  <h3 class={apply`text-lg font-heading font-semibold text-pink-primary mb-4`}>
                    アクセス
                  </h3>
                  <div class="bg-pink-light rounded-lg h-48 flex items-center justify-center">
                    <div class="text-center">
                      <div class="text-3xl mb-2">🗺️</div>
                      <p class={apply`text-text-secondary text-sm`}>
                        地図を表示
                      </p>
                    </div>
                  </div>
                </div>

                {/* 類似店舗 */}
                <div class={apply`card-soft`}>
                  <h3 class={apply`text-lg font-heading font-semibold text-pink-primary mb-4`}>
                    類似の店舗
                  </h3>
                  <div class="space-y-3">
                    <a href="/venues/2" class="block hover:bg-pink-light p-2 rounded transition-colors">
                      <div class={apply`font-medium text-text-primary text-sm`}>NEON BAR</div>
                      <div class={apply`text-xs text-text-secondary`}>4.5 ★ • バー</div>
                    </a>
                    <a href="/venues/3" class="block hover:bg-pink-light p-2 rounded transition-colors">
                      <div class={apply`font-medium text-text-primary text-sm`}>TOKYO DINING</div>
                      <div class={apply`text-xs text-text-secondary`}>4.3 ★ • レストラン</div>
                    </a>
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