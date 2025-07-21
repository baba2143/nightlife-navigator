import { Handlers } from "$fresh/server.ts";

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionLabel?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

const notifications: Notification[] = [
  {
    id: 1,
    userId: 1,
    type: "new_venue",
    title: "新しい店舗が追加されました",
    message: "渋谷に新しいラウンジ「GENTLE LOUNGE」がオープンしました。やさしいピンクデザインで話題になっています。",
    timestamp: "2024-01-20T10:30:00Z",
    isRead: false,
    actionLabel: "詳細を見る",
    actionUrl: "/venues/1",
    metadata: { venueId: 1 },
  },
  {
    id: 2,
    userId: 1,
    type: "review",
    title: "お気に入り店舗に新しいレビュー",
    message: "NEON BARに新しいレビューが投稿されました。評価は5つ星です。",
    timestamp: "2024-01-20T09:15:00Z",
    isRead: false,
    actionLabel: "レビューを見る",
    actionUrl: "/venues/2",
    metadata: { venueId: 2, reviewId: 123 },
  },
  {
    id: 3,
    userId: 1,
    type: "promotion",
    title: "期間限定プロモーション",
    message: "今週末限定でカクテル20%オフ！対象店舗でご利用いただけます。",
    timestamp: "2024-01-20T07:00:00Z",
    isRead: true,
    actionLabel: "詳細を見る",
    actionUrl: "/promotions",
    metadata: { promotionId: 456 },
  },
  {
    id: 4,
    userId: 1,
    type: "event",
    title: "スペシャルイベント開催",
    message: "来週金曜日に音楽イベントが開催されます。人気DJによるパフォーマンスをお楽しみください。",
    timestamp: "2024-01-19T18:30:00Z",
    isRead: true,
    actionLabel: "イベント詳細",
    actionUrl: "/events",
    metadata: { eventId: 789 },
  },
  {
    id: 5,
    userId: 1,
    type: "reminder",
    title: "予約リマインダー",
    message: "明日19:00にTOKYO DININGでの予約があります。お忘れなく！",
    timestamp: "2024-01-19T10:00:00Z",
    isRead: true,
    actionLabel: "予約確認",
    actionUrl: "/reservations",
    metadata: { reservationId: 321 },
  },
];

export const handler: Handlers = {
  GET(req) {
    const url = new URL(req.url);
    const userId = parseInt(url.searchParams.get("userId") || "1");
    const filter = url.searchParams.get("filter") || "all";
    const type = url.searchParams.get("type");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // ユーザーの通知を取得
    let userNotifications = notifications.filter(n => n.userId === userId);

    // フィルター適用
    switch (filter) {
      case "unread":
        userNotifications = userNotifications.filter(n => !n.isRead);
        break;
      case "read":
        userNotifications = userNotifications.filter(n => n.isRead);
        break;
      case "type":
        if (type) {
          userNotifications = userNotifications.filter(n => n.type === type);
        }
        break;
    }

    // 日付でソート（新しい順）
    userNotifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // ページネーション
    const total = userNotifications.length;
    const paginatedNotifications = userNotifications.slice(offset, offset + limit);

    // 統計情報
    const stats = {
      total: notifications.filter(n => n.userId === userId).length,
      unread: notifications.filter(n => n.userId === userId && !n.isRead).length,
      read: notifications.filter(n => n.userId === userId && n.isRead).length,
      today: notifications.filter(n => {
        const today = new Date();
        const notificationDate = new Date(n.timestamp);
        return n.userId === userId &&
               today.toDateString() === notificationDate.toDateString();
      }).length,
      byType: notifications
        .filter(n => n.userId === userId)
        .reduce((acc, n) => {
          acc[n.type] = (acc[n.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
    };

    return new Response(JSON.stringify({
      notifications: paginatedNotifications,
      total,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    }), {
      headers: { "Content-Type": "application/json" },
    });
  },

  POST: async (req) => {
    try {
      const body = await req.json();
      const { userId, type, title, message, actionLabel, actionUrl, metadata } = body;

      if (!userId || !type || !title || !message) {
        return new Response(JSON.stringify({
          error: "必須フィールドが不足しています",
          required: ["userId", "type", "title", "message"]
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 新しい通知を作成
      const newNotification: Notification = {
        id: Math.max(...notifications.map(n => n.id), 0) + 1,
        userId,
        type,
        title,
        message,
        timestamp: new Date().toISOString(),
        isRead: false,
        actionLabel,
        actionUrl,
        metadata,
      };

      notifications.push(newNotification);

      return new Response(JSON.stringify({
        notification: newNotification,
        message: "通知が作成されました"
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: "リクエストの処理中にエラーが発生しました"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  PATCH: async (req) => {
    try {
      const body = await req.json();
      const { action, notificationIds, userId } = body;

      if (!action || !userId) {
        return new Response(JSON.stringify({
          error: "actionとuserIdが必要です"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      let updatedCount = 0;

      switch (action) {
        case "mark_read":
          if (notificationIds && Array.isArray(notificationIds)) {
            // 特定の通知を既読にする
            notifications.forEach(n => {
              if (n.userId === userId && notificationIds.includes(n.id) && !n.isRead) {
                n.isRead = true;
                updatedCount++;
              }
            });
          } else {
            // 全ての未読通知を既読にする
            notifications.forEach(n => {
              if (n.userId === userId && !n.isRead) {
                n.isRead = true;
                updatedCount++;
              }
            });
          }
          break;

        case "mark_unread":
          if (notificationIds && Array.isArray(notificationIds)) {
            notifications.forEach(n => {
              if (n.userId === userId && notificationIds.includes(n.id) && n.isRead) {
                n.isRead = false;
                updatedCount++;
              }
            });
          }
          break;

        default:
          return new Response(JSON.stringify({
            error: "無効なアクションです",
            validActions: ["mark_read", "mark_unread"]
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
      }

      return new Response(JSON.stringify({
        message: `${updatedCount}件の通知が更新されました`,
        updatedCount,
        action
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: "リクエストの処理中にエラーが発生しました"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  DELETE: async (req) => {
    try {
      const url = new URL(req.url);
      const notificationId = parseInt(url.searchParams.get("id") || "0");
      const userId = parseInt(url.searchParams.get("userId") || "0");

      if (!notificationId || !userId) {
        return new Response(JSON.stringify({
          error: "notificationIdとuserIdが必要です"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const notificationIndex = notifications.findIndex(n => 
        n.id === notificationId && n.userId === userId
      );

      if (notificationIndex === -1) {
        return new Response(JSON.stringify({
          error: "通知が見つかりません"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const deletedNotification = notifications.splice(notificationIndex, 1)[0];

      return new Response(JSON.stringify({
        notification: deletedNotification,
        message: "通知が削除されました"
      }), {
        headers: { "Content-Type": "application/json" },
      });
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