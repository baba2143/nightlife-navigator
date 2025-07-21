import { Handlers } from "$fresh/server.ts";

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
  preferences: {
    notifications: {
      newVenues: boolean;
      reviews: boolean;
      events: boolean;
      promotions: boolean;
    };
    privacy: {
      showProfile: boolean;
      showActivity: boolean;
      showFavorites: boolean;
    };
  };
}

interface Activity {
  id: number;
  userId: number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const users: User[] = [
  {
    id: 1,
    name: "田中太郎",
    email: "tanaka@example.com",
    bio: "ナイトライフ愛好家。美味しいお酒と音楽を求めて東京の夜を探索中。特にやさしい雰囲気のお店が好みです。",
    joinDate: "2023-06-15T00:00:00Z",
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
        earnedDate: "2023-08-20T00:00:00Z",
      },
      {
        id: "reviewer",
        name: "レビューマスター",
        description: "20件以上のレビューを投稿",
        icon: "⭐",
        earnedDate: "2023-09-15T00:00:00Z",
      },
      {
        id: "socialite",
        name: "ソーシャライト",
        description: "50回以上のチェックイン",
        icon: "🎉",
        earnedDate: "2023-10-30T00:00:00Z",
      },
      {
        id: "gentle_fan",
        name: "やさしいピンクファン",
        description: "やさしいピンク系店舗を5店舗お気に入り",
        icon: "💖",
        earnedDate: "2023-11-12T00:00:00Z",
      },
    ],
    preferences: {
      notifications: {
        newVenues: true,
        reviews: true,
        events: true,
        promotions: false,
      },
      privacy: {
        showProfile: true,
        showActivity: true,
        showFavorites: true,
      },
    },
  },
];

const activities: Activity[] = [
  {
    id: 1,
    userId: 1,
    type: "review",
    title: "GENTLE LOUNGEをレビュー",
    description: "5つ星の評価を投稿しました",
    timestamp: "2024-01-20T08:30:00Z",
    metadata: { venueId: 1, rating: 5 },
  },
  {
    id: 2,
    userId: 1,
    type: "favorite",
    title: "NEON BARをお気に入りに追加",
    description: "雰囲気が最高でした",
    timestamp: "2024-01-19T20:15:00Z",
    metadata: { venueId: 2 },
  },
  {
    id: 3,
    userId: 1,
    type: "checkin",
    title: "TOKYO DININGにチェックイン",
    description: "友人と素敵なディナータイム",
    timestamp: "2024-01-17T19:00:00Z",
    metadata: { venueId: 3 },
  },
  {
    id: 4,
    userId: 1,
    type: "badge",
    title: "新しいバッジを獲得",
    description: "「やさしいピンクファン」バッジを獲得しました",
    timestamp: "2024-01-13T00:00:00Z",
    metadata: { badgeId: "gentle_fan" },
  },
];

export const handler: Handlers = {
  GET(req) {
    const url = new URL(req.url);
    const userId = parseInt(url.searchParams.get("userId") || "1");
    const includeActivity = url.searchParams.get("includeActivity") === "true";

    const user = users.find(u => u.id === userId);

    if (!user) {
      return new Response(JSON.stringify({
        error: "ユーザーが見つかりません",
        userId: userId
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const responseData: any = {
      user,
      message: "ユーザープロフィールを取得しました"
    };

    if (includeActivity) {
      const userActivities = activities
        .filter(a => a.userId === userId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10); // 最新10件

      responseData.recentActivity = userActivities;
    }

    return new Response(JSON.stringify(responseData), {
      headers: { "Content-Type": "application/json" },
    });
  },

  PUT: async (req) => {
    try {
      const url = new URL(req.url);
      const userId = parseInt(url.searchParams.get("userId") || "1");
      
      const userIndex = users.findIndex(u => u.id === userId);

      if (userIndex === -1) {
        return new Response(JSON.stringify({
          error: "ユーザーが見つかりません",
          userId: userId
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const { name, bio, preferences } = body;

      // 更新可能なフィールドのみを更新
      const updatedUser = { ...users[userIndex] };

      if (name !== undefined) {
        updatedUser.name = name;
      }

      if (bio !== undefined) {
        updatedUser.bio = bio;
      }

      if (preferences !== undefined) {
        updatedUser.preferences = {
          ...updatedUser.preferences,
          ...preferences,
        };
      }

      users[userIndex] = updatedUser;

      return new Response(JSON.stringify({
        user: updatedUser,
        message: "プロフィールが更新されました"
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

  POST: async (req) => {
    try {
      const body = await req.json();
      const { action, userId, data } = body;

      if (!action || !userId) {
        return new Response(JSON.stringify({
          error: "actionとuserIdが必要です"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const user = users.find(u => u.id === userId);

      if (!user) {
        return new Response(JSON.stringify({
          error: "ユーザーが見つかりません"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      switch (action) {
        case "add_activity":
          const newActivity: Activity = {
            id: Math.max(...activities.map(a => a.id), 0) + 1,
            userId,
            type: data.type,
            title: data.title,
            description: data.description,
            timestamp: new Date().toISOString(),
            metadata: data.metadata,
          };

          activities.push(newActivity);

          return new Response(JSON.stringify({
            activity: newActivity,
            message: "アクティビティが追加されました"
          }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });

        case "award_badge":
          const { badgeId, badgeName, badgeDescription, badgeIcon } = data;

          // 既に持っているバッジかチェック
          const existingBadge = user.badges.find(b => b.id === badgeId);
          if (existingBadge) {
            return new Response(JSON.stringify({
              error: "このバッジは既に獲得済みです",
              badge: existingBadge
            }), {
              status: 409,
              headers: { "Content-Type": "application/json" },
            });
          }

          const newBadge = {
            id: badgeId,
            name: badgeName,
            description: badgeDescription,
            icon: badgeIcon,
            earnedDate: new Date().toISOString(),
          };

          user.badges.push(newBadge);

          return new Response(JSON.stringify({
            badge: newBadge,
            message: "バッジが授与されました"
          }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });

        case "update_stats":
          if (data.stats) {
            user.stats = {
              ...user.stats,
              ...data.stats,
            };

            return new Response(JSON.stringify({
              stats: user.stats,
              message: "統計情報が更新されました"
            }), {
              headers: { "Content-Type": "application/json" },
            });
          }
          break;

        default:
          return new Response(JSON.stringify({
            error: "無効なアクションです",
            validActions: ["add_activity", "award_badge", "update_stats"]
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
      }

      return new Response(JSON.stringify({
        error: "アクションの実行に失敗しました"
      }), {
        status: 400,
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