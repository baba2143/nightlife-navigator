import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { apply } from "twind";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionLabel?: string;
  actionUrl?: string;
}

const notifications: Notification[] = [
  {
    id: 1,
    type: "new_venue",
    title: "新しい店舗が追加されました",
    message: "渋谷に新しいラウンジ「GENTLE LOUNGE」がオープンしました。やさしいピンクデザインで話題になっています。",
    timestamp: "2分前",
    isRead: false,
    actionLabel: "詳細を見る",
    actionUrl: "/venues/1",
  },
  {
    id: 2,
    type: "review",
    title: "お気に入り店舗に新しいレビュー",
    message: "NEON BARに新しいレビューが投稿されました。評価は5つ星です。",
    timestamp: "1時間前",
    isRead: false,
    actionLabel: "レビューを見る",
    actionUrl: "/venues/2",
  },
  {
    id: 3,
    type: "promotion",
    title: "期間限定プロモーション",
    message: "今週末限定でカクテル20%オフ！対象店舗でご利用いただけます。",
    timestamp: "3時間前",
    isRead: true,
    actionLabel: "詳細を見る",
    actionUrl: "/promotions",
  },
  {
    id: 4,
    type: "event",
    title: "スペシャルイベント開催",
    message: "来週金曜日に音楽イベントが開催されます。人気DJによるパフォーマンスをお楽しみください。",
    timestamp: "6時間前",
    isRead: true,
    actionLabel: "イベント詳細",
    actionUrl: "/events",
  },
  {
    id: 5,
    type: "reminder",
    title: "予約リマインダー",
    message: "明日19:00にTOKYO DININGでの予約があります。お忘れなく！",
    timestamp: "1日前",
    isRead: true,
    actionLabel: "予約確認",
    actionUrl: "/reservations",
  },
];

export default function NotificationsPage(props: PageProps) {
  const filter = props.url.searchParams.get("filter") || "all";
  
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case "unread":
        return !notification.isRead;
      case "read":
        return notification.isRead;
      case "type":
        const type = props.url.searchParams.get("type");
        return type ? notification.type === type : true;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      new_venue: "🏪",
      review: "⭐",
      event: "🎉",
      promotion: "🎁",
      reminder: "⏰",
    };
    return icons[type] || "📢";
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      new_venue: "新店舗",
      review: "レビュー",
      event: "イベント",
      promotion: "プロモーション",
      reminder: "リマインダー",
    };
    return labels[type] || type;
  };

  return (
    <>
      <Head>
        <title>通知 - Nightlife Navigator</title>
        <meta name="description" content="最新の通知を確認" />
      </Head>
      
      <main class="min-h-screen bg-white pt-16">
        <div class="container mx-auto py-8 px-4">
          <div class="max-w-4xl mx-auto">
            {/* ヘッダー */}
            <div class="mb-8">
              <h1 class={apply`text-3xl font-heading font-bold text-pink-primary mb-4`}>
                通知
              </h1>
              <nav class="flex items-center gap-2 text-sm text-text-secondary">
                <a href="/" class="hover:text-pink-primary">ホーム</a>
                <span>/</span>
                <span>通知</span>
              </nav>
            </div>

            {/* 統計情報 */}
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div class={apply`card-soft text-center`}>
                <div class="text-2xl mb-2">📬</div>
                <div class={apply`text-xl font-semibold text-pink-primary`}>{notifications.length}</div>
                <div class={apply`text-sm text-text-secondary`}>総通知数</div>
              </div>
              <div class={apply`card-soft text-center`}>
                <div class="text-2xl mb-2">🔔</div>
                <div class={apply`text-xl font-semibold text-pink-primary`}>{unreadCount}</div>
                <div class={apply`text-sm text-text-secondary`}>未読通知</div>
              </div>
              <div class={apply`card-soft text-center`}>
                <div class="text-2xl mb-2">✅</div>
                <div class={apply`text-xl font-semibold text-pink-primary`}>{notifications.length - unreadCount}</div>
                <div class={apply`text-sm text-text-secondary`}>既読通知</div>
              </div>
              <div class={apply`card-soft text-center`}>
                <div class="text-2xl mb-2">🆕</div>
                <div class={apply`text-xl font-semibold text-pink-primary`}>
                  {notifications.filter(n => n.timestamp.includes('分前') || n.timestamp.includes('時間前')).length}
                </div>
                <div class={apply`text-sm text-text-secondary`}>今日の通知</div>
              </div>
            </div>

            {/* フィルターとアクション */}
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div class="flex flex-wrap gap-2">
                <a
                  href="/notifications"
                  class={apply`px-3 py-2 rounded-lg text-sm transition-colors ${filter === 'all' ? 'bg-pink-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-pink-light'}`}
                >
                  すべて ({notifications.length})
                </a>
                <a
                  href="/notifications?filter=unread"
                  class={apply`px-3 py-2 rounded-lg text-sm transition-colors ${filter === 'unread' ? 'bg-pink-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-pink-light'}`}
                >
                  未読 ({unreadCount})
                </a>
                <a
                  href="/notifications?filter=read"
                  class={apply`px-3 py-2 rounded-lg text-sm transition-colors ${filter === 'read' ? 'bg-pink-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-pink-light'}`}
                >
                  既読 ({notifications.length - unreadCount})
                </a>
              </div>
              <div class="flex gap-2">
                <button class={apply`btn-pink-outline text-sm`}>
                  すべて既読にする
                </button>
                <button class={apply`btn-pink-outline text-sm`}>
                  ⚙️ 設定
                </button>
              </div>
            </div>

            {/* 通知一覧 */}
            {filteredNotifications.length > 0 ? (
              <div class="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    class={apply`card-soft cursor-pointer transition-all duration-200 hover:shadow-pink ${
                      !notification.isRead ? 'border-l-4 border-pink-primary bg-pink-light bg-opacity-30' : ''
                    }`}
                  >
                    <div class="flex items-start gap-4">
                      {/* アイコン */}
                      <div class="flex-shrink-0">
                        <div class="text-2xl">{getNotificationIcon(notification.type)}</div>
                      </div>
                      
                      {/* コンテンツ */}
                      <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between mb-2">
                          <h3 class={apply`font-semibold text-text-primary`}>
                            {notification.title}
                          </h3>
                          <div class="flex items-center gap-2 flex-shrink-0 ml-4">
                            <span class={apply`px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs`}>
                              {getTypeLabel(notification.type)}
                            </span>
                            {!notification.isRead && (
                              <div class="w-2 h-2 bg-pink-primary rounded-full"></div>
                            )}
                          </div>
                        </div>
                        
                        <p class={apply`text-text-secondary mb-3 leading-relaxed`}>
                          {notification.message}
                        </p>
                        
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-4">
                            <span class={apply`text-xs text-text-tertiary`}>
                              {notification.timestamp}
                            </span>
                            {notification.actionLabel && notification.actionUrl && (
                              <a
                                href={notification.actionUrl}
                                class={apply`text-sm text-pink-primary hover:text-pink-primary-dark font-medium`}
                              >
                                {notification.actionLabel} →
                              </a>
                            )}
                          </div>
                          
                          <div class="flex items-center gap-2">
                            {!notification.isRead && (
                              <button class={apply`text-xs text-pink-primary hover:text-pink-primary-dark`}>
                                既読にする
                              </button>
                            )}
                            <button class={apply`text-xs text-text-tertiary hover:text-text-secondary`}>
                              削除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div class="text-center py-16">
                <div class="text-6xl mb-6">📭</div>
                <h2 class={apply`text-2xl font-heading font-semibold text-pink-primary mb-4`}>
                  通知がありません
                </h2>
                <p class={apply`text-text-secondary mb-8 max-w-md mx-auto`}>
                  {filter === 'unread' && '未読の通知はありません。'}
                  {filter === 'read' && '既読の通知はありません。'}
                  {filter === 'all' && '通知はまだありません。新しい店舗やイベントの情報が届くとここに表示されます。'}
                </p>
                <a href="/" class={apply`btn-pink`}>
                  ホームに戻る
                </a>
              </div>
            )}

            {/* 通知設定 */}
            <div class={apply`card-soft mt-8`}>
              <h3 class={apply`text-lg font-heading font-semibold text-pink-primary mb-4`}>
                通知設定
              </h3>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <div class={apply`font-medium text-text-primary`}>新店舗の通知</div>
                    <div class={apply`text-sm text-text-secondary`}>新しい店舗が追加されたときに通知</div>
                  </div>
                  <input type="checkbox" checked class="toggle-pink" />
                </div>
                
                <div class="flex items-center justify-between">
                  <div>
                    <div class={apply`font-medium text-text-primary`}>レビュー通知</div>
                    <div class={apply`text-sm text-text-secondary`}>お気に入り店舗に新しいレビューが投稿されたときに通知</div>
                  </div>
                  <input type="checkbox" checked class="toggle-pink" />
                </div>
                
                <div class="flex items-center justify-between">
                  <div>
                    <div class={apply`font-medium text-text-primary`}>イベント通知</div>
                    <div class={apply`text-sm text-text-secondary`}>スペシャルイベントの情報を通知</div>
                  </div>
                  <input type="checkbox" checked class="toggle-pink" />
                </div>
                
                <div class="flex items-center justify-between">
                  <div>
                    <div class={apply`font-medium text-text-primary`}>プロモーション通知</div>
                    <div class={apply`text-sm text-text-secondary`}>お得なプロモーション情報を通知</div>
                  </div>
                  <input type="checkbox" class="toggle-pink" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}