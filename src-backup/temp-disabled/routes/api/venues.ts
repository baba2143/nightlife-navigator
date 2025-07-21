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
  coordinates?: {
    lat: number;
    lng: number;
  };
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
    coordinates: { lat: 35.6598, lng: 139.7006 },
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
    coordinates: { lat: 35.6904, lng: 139.6956 },
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
    coordinates: { lat: 35.6627, lng: 139.7314 },
  },
  {
    id: 4,
    name: "MUSIC CLUB WAVE",
    category: "club",
    address: "新宿区歌舞伎町1-5-6",
    rating: 4.6,
    priceRange: "moderate",
    distance: 900,
    description: "最新の音響システムと照明で楽しむクラブ。国内外のDJによるパフォーマンスが話題。",
    tags: ["クラブ", "音楽", "DJ", "ダンス"],
    isOpen: true,
    phone: "03-4567-8901",
    website: "https://music-club-wave.com",
    hours: "21:00 - 05:00",
    images: ["/venue-4-1.jpg", "/venue-4-2.jpg"],
    coordinates: { lat: 35.6948, lng: 139.7026 },
  },
  {
    id: 5,
    name: "KARAOKE PARADISE",
    category: "karaoke",
    address: "渋谷区道玄坂2-7-8",
    rating: 4.2,
    priceRange: "budget",
    distance: 450,
    description: "最新のカラオケ機器と広々とした個室で、仲間と楽しい時間を過ごせます。",
    tags: ["カラオケ", "個室", "パーティー", "グループ"],
    isOpen: true,
    phone: "03-5678-9012",
    website: "https://karaoke-paradise.com",
    hours: "12:00 - 06:00",
    images: ["/venue-5-1.jpg"],
    coordinates: { lat: 35.6581, lng: 139.6979 },
  },
];

export const handler: Handlers = {
  GET(req) {
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const priceRange = url.searchParams.get("priceRange");
    const isOpen = url.searchParams.get("isOpen");
    const maxDistance = url.searchParams.get("maxDistance");
    const minRating = url.searchParams.get("minRating");
    const search = url.searchParams.get("search");

    let filteredVenues = [...venues];

    // カテゴリフィルター
    if (category && category !== "all") {
      filteredVenues = filteredVenues.filter(v => v.category === category);
    }

    // 価格帯フィルター
    if (priceRange) {
      const ranges = priceRange.split(",");
      filteredVenues = filteredVenues.filter(v => ranges.includes(v.priceRange));
    }

    // 営業状況フィルター
    if (isOpen === "true") {
      filteredVenues = filteredVenues.filter(v => v.isOpen);
    }

    // 距離フィルター
    if (maxDistance) {
      const maxDist = parseInt(maxDistance);
      filteredVenues = filteredVenues.filter(v => v.distance <= maxDist);
    }

    // 評価フィルター
    if (minRating) {
      const minRate = parseFloat(minRating);
      filteredVenues = filteredVenues.filter(v => v.rating >= minRate);
    }

    // 検索フィルター
    if (search) {
      const searchLower = search.toLowerCase();
      filteredVenues = filteredVenues.filter(v =>
        v.name.toLowerCase().includes(searchLower) ||
        v.description.toLowerCase().includes(searchLower) ||
        v.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // ソート
    const sortBy = url.searchParams.get("sortBy") || "rating";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    filteredVenues.sort((a, b) => {
      let valueA: number;
      let valueB: number;

      switch (sortBy) {
        case "distance":
          valueA = a.distance;
          valueB = b.distance;
          break;
        case "rating":
          valueA = a.rating;
          valueB = b.rating;
          break;
        case "name":
          return sortOrder === "asc" 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        default:
          valueA = a.rating;
          valueB = b.rating;
      }

      return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
    });

    return new Response(JSON.stringify({
      venues: filteredVenues,
      total: filteredVenues.length,
      filters: {
        category,
        priceRange,
        isOpen,
        maxDistance,
        minRating,
        search,
        sortBy,
        sortOrder,
      },
    }), {
      headers: { "Content-Type": "application/json" },
    });
  },

  POST: async (req) => {
    try {
      const body = await req.json();
      const { name, category, address, description, tags, phone, website, hours } = body;

      // バリデーション
      if (!name || !category || !address || !description) {
        return new Response(JSON.stringify({
          error: "必須フィールドが不足しています",
          required: ["name", "category", "address", "description"]
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 新しい店舗を作成
      const newVenue: Venue = {
        id: Math.max(...venues.map(v => v.id)) + 1,
        name,
        category,
        address,
        rating: 0,
        priceRange: "moderate",
        distance: Math.floor(Math.random() * 2000),
        description,
        tags: tags || [],
        isOpen: true,
        phone,
        website,
        hours,
      };

      venues.push(newVenue);

      return new Response(JSON.stringify({
        venue: newVenue,
        message: "店舗が正常に追加されました"
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
};