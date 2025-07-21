import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { apply } from "twind";
import ProfileImageUploader from "../islands/ProfileImageUploader.tsx";

interface User {
  id: number;
  name: string;
  email: string;
  bio: string;
  joinDate: string;
  avatar?: string;
  stats: {
    visitedVenues: number;
    totalReviews: number;
    averageRating: number;
    helpfulVotes: number;
    favoriteVenues: number;
    totalCheckins: number;
  };
  badges: {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedDate: string;
  }[];
  recentActivity: {
    type: string;
    title: string;
    description: string;
    timestamp: string;
  }[];
}

const user: User = {
  id: 1,
  name: "田中太郎",
  email: "tanaka@example.com",
  bio: "ナイトライフ愛好家。美味しいお酒と音楽を求めて東京の夜を探索中。特にやさしい雰囲気のお店が好みです。",
  joinDate: "2023-06-15",
  stats: {
    visitedVenues: 45,
    totalReviews: 32,
    averageRating: 4.2,
    helpfulVotes: 128,
    favoriteVenues: 12,
    totalCheckins: 87,
  },
  badges: [
    {
      id: "explorer",
      name: "ナイト探検家",
      description: "10店舗以上を訪問",
      icon: "🗺️",
      earnedDate: "2023-08-20",
    },
    {
      id: "reviewer",
      name: "レビューマスター",
      description: "20件以上のレビューを投稿",
      icon: "⭐",
      earnedDate: "2023-09-15",
    },
    {
      id: "socialite",
      name: "ソーシャライト",
      description: "50回以上のチェックイン",
      icon: "🎉",
      earnedDate: "2023-10-30",
    },
    {
      id: "gentle_fan",
      name: "やさしいピンクファン",
      description: "やさしいピンク系店舗を5店舗お気に入り",
      icon: "💖",
      earnedDate: "2023-11-12",
    },
  ],
  recentActivity: [
    {
      type: "review",
      title: "GENTLE LOUNGEをレビュー",
      description: "5つ星の評価を投稿しました",
      timestamp: "2時間前",
    },
    {
      type: "favorite",
      title: "NEON BARをお気に入りに追加",
      description: "雰囲気が最高でした",
      timestamp: "1日前",
    },
    {
      type: "checkin",
      title: "TOKYO DININGにチェックイン",
      description: "友人と素敵なディナータイム",
      timestamp: "3日前",
    },
    {
      type: "badge",
      title: "新しいバッジを獲得",
      description: "「やさしいピンクファン」バッジを獲得しました",
      timestamp: "1週間前",
    },
  ],
};

export default function ProfilePage(props: PageProps) {
  const tab = props.url.searchParams.get("tab") || "overview";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      review: "⭐",
      favorite: "❤️",
      checkin: "📍",
      badge: "🏆",
      visit: "🏪",
    };
    return icons[type] || "📝";
  };

  return (
    <>
      <Head>
        <title>プロフィール - Nightlife Navigator</title>
        <meta name="description" content="ユーザープロフィールと統計" />
      </Head>
      
      <main class="min-h-screen bg-white pt-16">
        <div class="container mx-auto py-8 px-4">
          <div class="max-w-4xl mx-auto">
            {/* ヘッダー */}
            <div class="mb-8">
              <nav class="flex items-center gap-2 text-sm text-text-secondary mb-4">
                <a href="/" class="hover:text-pink-primary">ホーム</a>
                <span>/</span>
                <span>プロフィール</span>
              </nav>
            </div>

            {/* プロフィールヘッダー */}
            <div class={apply`card-soft mb-8`}>
              <div class="flex flex-col md:flex-row items-start md:items-center gap-6">
                <ProfileImageUploader
                  currentImageUrl=""
                  userId={user.id}
                  size="large"
                  editable={true}
                  onImageUpdate={(url) => console.log('Profile image updated:', url)}
                  onImageRemove={() => console.log('Profile image removed')}
                />
                
                <div class="flex-1">
                  <h1 class={apply`text-2xl font-heading font-bold text-pink-primary mb-2`}>
                    {user.name}
                  </h1>
                  <p class={apply`text-text-secondary mb-3`}>
                    {user.email}
                  </p>
                  <p class={apply`text-text-primary leading-relaxed mb-4`}>
                    {user.bio}
                  </p>
                  <div class="flex items-center gap-4 text-sm text-text-secondary">
                    <span>📅 {formatDate(user.joinDate)}から利用開始</span>
                    <span>🏆 {user.badges.length}個のバッジを獲得</span>
                  </div>
                </div>
                
                <div class="flex flex-col gap-2">
                  <button class={apply`btn-pink-outline`}>
                    ✏️ 編集
                  </button>
                  <button class={apply`btn-pink-outline`}>
                    ⚙️ 設定
                  </button>
                </div>
              </div>
            </div>

            {/* タブナビゲーション */}
            <div class="flex gap-1 mb-8 overflow-x-auto">
              {[
                { id: "overview", label: "概要", icon: "📊" },
                { id: "stats", label: "統計", icon: "📈" },
                { id: "badges", label: "バッジ", icon: "🏆" },
                { id: "activity", label: "アクティビティ", icon: "📝" },
              ].map((tabItem) => (
                <a
                  key={tabItem.id}
                  href={`/profile?tab=${tabItem.id}`}
                  class={apply`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    tab === tabItem.id
                      ? 'bg-pink-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-pink-light'
                  }`}
                >
                  {tabItem.icon} {tabItem.label}
                </a>
              ))}
            </div>

            {/* タブコンテンツ */}
            {tab === "overview" && (
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 統計概要 */}
                <div class="lg:col-span-2">
                  <div class={apply`card-soft mb-6`}>
                    <h2 class={apply`text-xl font-heading font-semibold text-pink-primary mb-6`}>
                      統計概要
                    </h2>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div class="text-center">
                        <div class={apply`text-2xl font-bold text-pink-primary`}>
                          {user.stats.visitedVenues}
                        </div>
                        <div class={apply`text-sm text-text-secondary`}>訪問店舗</div>
                      </div>
                      <div class="text-center">
                        <div class={apply`text-2xl font-bold text-pink-primary`}>
                          {user.stats.totalReviews}
                        </div>
                        <div class={apply`text-sm text-text-secondary`}>レビュー</div>
                      </div>
                      <div class="text-center">
                        <div class={apply`text-2xl font-bold text-pink-primary`}>
                          {user.stats.averageRating.toFixed(1)}
                        </div>
                        <div class={apply`text-sm text-text-secondary`}>平均評価</div>
                      </div>
                      <div class="text-center">
                        <div class={apply`text-2xl font-bold text-pink-primary`}>
                          {user.stats.helpfulVotes}
                        </div>
                        <div class={apply`text-sm text-text-secondary`}>いいね</div>
                      </div>
                      <div class="text-center">
                        <div class={apply`text-2xl font-bold text-pink-primary`}>
                          {user.stats.favoriteVenues}
                        </div>
                        <div class={apply`text-sm text-text-secondary`}>お気に入り</div>
                      </div>
                      <div class="text-center">
                        <div class={apply`text-2xl font-bold text-pink-primary`}>
                          {user.stats.totalCheckins}
                        </div>
                        <div class={apply`text-sm text-text-secondary`}>チェックイン</div>
                      </div>
                    </div>
                  </div>

                  {/* 最近のアクティビティ */}
                  <div class={apply`card-soft`}>
                    <h3 class={apply`text-lg font-heading font-semibold text-pink-primary mb-4`}>
                      最近のアクティビティ
                    </h3>
                    <div class="space-y-4">
                      {user.recentActivity.slice(0, 5).map((activity, index) => (
                        <div key={index} class="flex items-start gap-3">
                          <div class="text-xl">{getActivityIcon(activity.type)}</div>
                          <div class="flex-1">
                            <div class={apply`font-medium text-text-primary`}>
                              {activity.title}
                            </div>
                            <div class={apply`text-sm text-text-secondary`}>
                              {activity.description}
                            </div>
                            <div class={apply`text-xs text-text-tertiary mt-1`}>
                              {activity.timestamp}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* サイドバー */}
                <div class="space-y-6">
                  {/* 最新バッジ */}
                  <div class={apply`card-soft`}>
                    <h3 class={apply`text-lg font-heading font-semibold text-pink-primary mb-4`}>
                      最新バッジ
                    </h3>
                    <div class="space-y-3">
                      {user.badges.slice(0, 3).map((badge) => (
                        <div key={badge.id} class="flex items-center gap-3">
                          <div class="text-2xl">{badge.icon}</div>
                          <div class="flex-1">
                            <div class={apply`font-medium text-text-primary text-sm`}>
                              {badge.name}
                            </div>
                            <div class={apply`text-xs text-text-secondary`}>
                              {formatDate(badge.earnedDate)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <a href="/profile?tab=badges" class={apply`btn-pink-outline w-full mt-4 text-center block`}>
                      すべてのバッジを見る
                    </a>
                  </div>

                  {/* クイックアクション */}
                  <div class={apply`card-soft`}>
                    <h3 class={apply`text-lg font-heading font-semibold text-pink-primary mb-4`}>
                      クイックアクション
                    </h3>
                    <div class="space-y-2">
                      <a href="/search" class={apply`btn-pink-outline w-full text-center block`}>
                        🔍 店舗を探す
                      </a>
                      <a href="/favorites" class={apply`btn-pink-outline w-full text-center block`}>
                        ❤️ お気に入り
                      </a>
                      <a href="/notifications" class={apply`btn-pink-outline w-full text-center block`}>
                        🔔 通知
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "stats" && (
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class={apply`card-soft`}>
                  <h2 class={apply`text-xl font-heading font-semibold text-pink-primary mb-6`}>
                    詳細統計
                  </h2>
                  <div class="space-y-6">
                    <div>
                      <div class={apply`text-lg font-semibold text-pink-primary mb-2`}>
                        {user.stats.visitedVenues}
                      </div>
                      <div class={apply`text-sm text-text-secondary mb-2`}>訪問店舗数</div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-pink-primary h-2 rounded-full" style={`width: ${Math.min(100, (user.stats.visitedVenues / 100) * 100)}%`}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div class={apply`text-lg font-semibold text-pink-primary mb-2`}>
                        {user.stats.totalReviews}
                      </div>
                      <div class={apply`text-sm text-text-secondary mb-2`}>投稿レビュー数</div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-pink-primary h-2 rounded-full" style={`width: ${Math.min(100, (user.stats.totalReviews / 50) * 100)}%`}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div class={apply`text-lg font-semibold text-pink-primary mb-2`}>
                        {user.stats.helpfulVotes}
                      </div>
                      <div class={apply`text-sm text-text-secondary mb-2`}>獲得いいね数</div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-pink-primary h-2 rounded-full" style={`width: ${Math.min(100, (user.stats.helpfulVotes / 200) * 100)}%`}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class={apply`card-soft`}>
                  <h3 class={apply`text-xl font-heading font-semibold text-pink-primary mb-6`}>
                    カテゴリ別訪問
                  </h3>
                  <div class="space-y-4">
                    {[
                      { category: "バー", count: 18, icon: "🍸" },
                      { category: "ラウンジ", count: 12, icon: "🛋️" },
                      { category: "レストラン", count: 8, icon: "🍽️" },
                      { category: "クラブ", count: 5, icon: "🎵" },
                      { category: "カラオケ", count: 2, icon: "🎤" },
                    ].map((item) => (
                      <div key={item.category} class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="text-lg">{item.icon}</span>
                          <span class={apply`text-text-primary`}>{item.category}</span>
                        </div>
                        <span class={apply`font-semibold text-pink-primary`}>{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "badges" && (
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {user.badges.map((badge) => (
                  <div key={badge.id} class={apply`card-soft text-center hover:shadow-pink transition-all duration-200`}>
                    <div class="text-4xl mb-3">{badge.icon}</div>
                    <h3 class={apply`text-lg font-heading font-semibold text-pink-primary mb-2`}>
                      {badge.name}
                    </h3>
                    <p class={apply`text-sm text-text-secondary mb-3`}>
                      {badge.description}
                    </p>
                    <div class={apply`text-xs text-text-tertiary`}>
                      {formatDate(badge.earnedDate)}に獲得
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "activity" && (
              <div class="space-y-4">
                {user.recentActivity.map((activity, index) => (
                  <div key={index} class={apply`card-soft`}>
                    <div class="flex items-start gap-4">
                      <div class="text-2xl">{getActivityIcon(activity.type)}</div>
                      <div class="flex-1">
                        <h3 class={apply`font-semibold text-text-primary mb-1`}>
                          {activity.title}
                        </h3>
                        <p class={apply`text-text-secondary mb-2`}>
                          {activity.description}
                        </p>
                        <div class={apply`text-sm text-text-tertiary`}>
                          {activity.timestamp}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}