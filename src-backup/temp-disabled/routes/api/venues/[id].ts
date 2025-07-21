import { Handlers } from "$fresh/server.ts";

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

const venues: Venue[] = [
  {
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
  {
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
  {
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
];

export const handler: Handlers = {
  GET(req, ctx) {
    const id = parseInt(ctx.params.id);
    const venue = venues.find(v => v.id === id);

    if (!venue) {
      return new Response(JSON.stringify({
        error: "店舗が見つかりません",
        id: id
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      venue,
      message: "店舗詳細を取得しました"
    }), {
      headers: { "Content-Type": "application/json" },
    });
  },

  PUT: async (req, ctx) => {
    try {
      const id = parseInt(ctx.params.id);
      const venueIndex = venues.findIndex(v => v.id === id);

      if (venueIndex === -1) {
        return new Response(JSON.stringify({
          error: "店舗が見つかりません",
          id: id
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const updatedVenue = { ...venues[venueIndex], ...body, id };
      venues[venueIndex] = updatedVenue;

      return new Response(JSON.stringify({
        venue: updatedVenue,
        message: "店舗情報が更新されました"
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

  DELETE(req, ctx) {
    const id = parseInt(ctx.params.id);
    const venueIndex = venues.findIndex(v => v.id === id);

    if (venueIndex === -1) {
      return new Response(JSON.stringify({
        error: "店舗が見つかりません",
        id: id
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const deletedVenue = venues.splice(venueIndex, 1)[0];

    return new Response(JSON.stringify({
      venue: deletedVenue,
      message: "店舗が削除されました"
    }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};