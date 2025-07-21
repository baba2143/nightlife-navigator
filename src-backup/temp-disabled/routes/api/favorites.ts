import { Handlers } from "$fresh/server.ts";

interface Favorite {
  id: number;
  userId: number;
  venueId: number;
  dateAdded: string;
}

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

const favorites: Favorite[] = [
  {
    id: 1,
    userId: 1,
    venueId: 2,
    dateAdded: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    userId: 1,
    venueId: 1,
    dateAdded: "2024-01-10T14:20:00Z",
  },
];

const venues: Venue[] = [
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
];

export const handler: Handlers = {
  GET(req) {
    const url = new URL(req.url);
    const userId = parseInt(url.searchParams.get("userId") || "1");
    const sortBy = url.searchParams.get("sortBy") || "recent";

    // ユーザーのお気に入りを取得
    let userFavorites = favorites.filter(f => f.userId === userId);

    // 店舗情報を結合
    const favoritesWithVenues = userFavorites.map(favorite => {
      const venue = venues.find(v => v.id === favorite.venueId);
      return {
        ...favorite,
        venue,
      };
    }).filter(f => f.venue); // 店舗が見つからないものは除外

    // ソート
    switch (sortBy) {
      case "rating":
        favoritesWithVenues.sort((a, b) => (b.venue?.rating || 0) - (a.venue?.rating || 0));
        break;
      case "distance":
        favoritesWithVenues.sort((a, b) => (a.venue?.distance || 0) - (b.venue?.distance || 0));
        break;
      case "name":
        favoritesWithVenues.sort((a, b) => (a.venue?.name || "").localeCompare(b.venue?.name || ""));
        break;
      case "recent":
      default:
        favoritesWithVenues.sort((a, b) => 
          new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
        );
    }

    return new Response(JSON.stringify({
      favorites: favoritesWithVenues,
      total: favoritesWithVenues.length,
      stats: {
        totalFavorites: favoritesWithVenues.length,
        averageRating: favoritesWithVenues.length > 0 
          ? favoritesWithVenues.reduce((sum, f) => sum + (f.venue?.rating || 0), 0) / favoritesWithVenues.length
          : 0,
        categories: favoritesWithVenues.reduce((acc, f) => {
          const category = f.venue?.category || "unknown";
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
    }), {
      headers: { "Content-Type": "application/json" },
    });
  },

  POST: async (req) => {
    try {
      const body = await req.json();
      const { userId, venueId } = body;

      if (!userId || !venueId) {
        return new Response(JSON.stringify({
          error: "userIdとvenueIdが必要です"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 既にお気に入りに追加されているかチェック
      const existingFavorite = favorites.find(f => 
        f.userId === userId && f.venueId === venueId
      );

      if (existingFavorite) {
        return new Response(JSON.stringify({
          error: "既にお気に入りに追加されています",
          favorite: existingFavorite
        }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 店舗が存在するかチェック
      const venue = venues.find(v => v.id === venueId);
      if (!venue) {
        return new Response(JSON.stringify({
          error: "指定された店舗が見つかりません"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 新しいお気に入りを追加
      const newFavorite: Favorite = {
        id: Math.max(...favorites.map(f => f.id), 0) + 1,
        userId,
        venueId,
        dateAdded: new Date().toISOString(),
      };

      favorites.push(newFavorite);

      return new Response(JSON.stringify({
        favorite: {
          ...newFavorite,
          venue,
        },
        message: "お気に入りに追加されました"
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

  DELETE: async (req) => {
    try {
      const url = new URL(req.url);
      const userId = parseInt(url.searchParams.get("userId") || "0");
      const venueId = parseInt(url.searchParams.get("venueId") || "0");

      if (!userId || !venueId) {
        return new Response(JSON.stringify({
          error: "userIdとvenueIdが必要です"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const favoriteIndex = favorites.findIndex(f => 
        f.userId === userId && f.venueId === venueId
      );

      if (favoriteIndex === -1) {
        return new Response(JSON.stringify({
          error: "お気に入りが見つかりません"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const deletedFavorite = favorites.splice(favoriteIndex, 1)[0];

      return new Response(JSON.stringify({
        favorite: deletedFavorite,
        message: "お気に入りから削除されました"
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