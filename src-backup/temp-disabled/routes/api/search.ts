import { Handlers } from "$fresh/server.ts";
import { getDatabase, initDatabase } from "../../utils/database.ts";

interface SearchFilters {
  category?: string;
  priceRange?: string;
  minRating?: number;
  maxDistance?: number;
  latitude?: number;
  longitude?: number;
  tags?: string[];
  sortBy?: 'relevance' | 'rating' | 'distance' | 'name' | 'newest';
  sortOrder?: 'asc' | 'desc';
  isOpen?: boolean;
}

interface SearchResult {
  id: number;
  name: string;
  category: string;
  address: string;
  phone?: string;
  website?: string;
  description: string;
  priceRange: string;
  latitude?: number;
  longitude?: number;
  hours?: string;
  isOpen: boolean;
  rating: number;
  reviewCount: number;
  distance?: number;
  tags: string[];
  images: string[];
  relevanceScore: number;
}

// 距離計算（ハーサイン公式）
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // 地球の半径（km）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// 関連度スコア計算
function calculateRelevanceScore(venue: any, query: string, tags: string[]): number {
  let score = 0;
  const queryLower = query.toLowerCase();
  
  // 名前での一致
  if (venue.name.toLowerCase().includes(queryLower)) {
    score += 10;
    if (venue.name.toLowerCase().startsWith(queryLower)) {
      score += 5; // 先頭一致にボーナス
    }
  }
  
  // 説明での一致
  if (venue.description && venue.description.toLowerCase().includes(queryLower)) {
    score += 3;
  }
  
  // カテゴリでの一致
  if (venue.category.toLowerCase().includes(queryLower)) {
    score += 7;
  }
  
  // タグでの一致
  tags.forEach(tag => {
    if (tag.toLowerCase().includes(queryLower)) {
      score += 5;
    }
  });
  
  // 評価によるボーナス
  score += venue.rating * 0.5;
  
  // レビュー数によるボーナス
  score += Math.min(venue.review_count * 0.1, 2);
  
  return score;
}

export const handler: Handlers = {
  async GET(req) {
    try {
      // データベース初期化
      await initDatabase();
      const db = getDatabase();
      
      const url = new URL(req.url);
      const query = url.searchParams.get('q') || '';
      const category = url.searchParams.get('category');
      const priceRange = url.searchParams.get('priceRange');
      const minRating = url.searchParams.get('minRating');
      const maxDistance = url.searchParams.get('maxDistance');
      const latitude = url.searchParams.get('latitude');
      const longitude = url.searchParams.get('longitude');
      const tagsParam = url.searchParams.get('tags');
      const sortBy = url.searchParams.get('sortBy') || 'relevance';
      const sortOrder = url.searchParams.get('sortOrder') || 'desc';
      const isOpen = url.searchParams.get('isOpen');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      // フィルターの構築
      const filters: SearchFilters = {
        category,
        priceRange,
        minRating: minRating ? parseFloat(minRating) : undefined,
        maxDistance: maxDistance ? parseFloat(maxDistance) : undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        tags: tagsParam ? tagsParam.split(',').map(t => t.trim()) : undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        isOpen: isOpen === 'true' ? true : isOpen === 'false' ? false : undefined,
      };

      // SQL クエリの構築
      let baseQuery = `
        SELECT DISTINCT
          v.id, v.name, v.category, v.address, v.phone, v.website, 
          v.description, v.price_range, v.latitude, v.longitude, 
          v.hours, v.is_open, v.rating, v.review_count,
          GROUP_CONCAT(vt.tag) as tags
        FROM venues v
        LEFT JOIN venue_tags vt ON v.id = vt.venue_id
      `;

      const whereConditions: string[] = [];
      const params: any[] = [];

      // テキスト検索
      if (query.trim()) {
        whereConditions.push(`(
          v.name LIKE ? OR 
          v.description LIKE ? OR 
          v.category LIKE ? OR
          v.address LIKE ? OR
          EXISTS (
            SELECT 1 FROM venue_tags vt2 
            WHERE vt2.venue_id = v.id AND vt2.tag LIKE ?
          )
        )`);
        const queryPattern = `%${query.trim()}%`;
        params.push(queryPattern, queryPattern, queryPattern, queryPattern, queryPattern);
      }

      // カテゴリフィルター
      if (filters.category) {
        whereConditions.push('v.category = ?');
        params.push(filters.category);
      }

      // 価格帯フィルター
      if (filters.priceRange) {
        whereConditions.push('v.price_range = ?');
        params.push(filters.priceRange);
      }

      // 評価フィルター
      if (filters.minRating !== undefined) {
        whereConditions.push('v.rating >= ?');
        params.push(filters.minRating);
      }

      // 営業状況フィルター
      if (filters.isOpen !== undefined) {
        whereConditions.push('v.is_open = ?');
        params.push(filters.isOpen ? 1 : 0);
      }

      // タグフィルター
      if (filters.tags && filters.tags.length > 0) {
        const tagConditions = filters.tags.map(() => 'vt.tag LIKE ?').join(' OR ');
        whereConditions.push(`(${tagConditions})`);
        filters.tags.forEach(tag => params.push(`%${tag}%`));
      }

      // WHERE句を追加
      if (whereConditions.length > 0) {
        baseQuery += ' WHERE ' + whereConditions.join(' AND ');
      }

      // GROUP BY句を追加
      baseQuery += ' GROUP BY v.id';

      // 検索結果を取得
      const venues = db.prepare(baseQuery).all(...params) as any[];

      // 結果の後処理
      let results: SearchResult[] = venues.map(venue => {
        const tags = venue.tags ? venue.tags.split(',') : [];
        const venueData = {
          id: venue.id,
          name: venue.name,
          category: venue.category,
          address: venue.address,
          phone: venue.phone,
          website: venue.website,
          description: venue.description,
          priceRange: venue.price_range,
          latitude: venue.latitude,
          longitude: venue.longitude,
          hours: venue.hours,
          isOpen: Boolean(venue.is_open),
          rating: venue.rating,
          reviewCount: venue.review_count,
          tags,
          images: [], // 実装時に画像を取得
          relevanceScore: 0,
          distance: undefined,
        };

        // 距離計算
        if (filters.latitude && filters.longitude && venue.latitude && venue.longitude) {
          venueData.distance = calculateDistance(
            filters.latitude,
            filters.longitude,
            venue.latitude,
            venue.longitude
          );
        }

        // 関連度スコア計算
        if (query.trim()) {
          venueData.relevanceScore = calculateRelevanceScore(venue, query, tags);
        }

        return venueData;
      });

      // 距離フィルター
      if (filters.maxDistance !== undefined && filters.latitude && filters.longitude) {
        results = results.filter(venue => 
          venue.distance !== undefined && venue.distance <= filters.maxDistance!
        );
      }

      // ソート処理
      results.sort((a, b) => {
        let compareValue = 0;
        
        switch (filters.sortBy) {
          case 'relevance':
            compareValue = b.relevanceScore - a.relevanceScore;
            break;
          case 'rating':
            compareValue = b.rating - a.rating;
            break;
          case 'distance':
            if (a.distance !== undefined && b.distance !== undefined) {
              compareValue = a.distance - b.distance;
            }
            break;
          case 'name':
            compareValue = a.name.localeCompare(b.name, 'ja');
            break;
          case 'newest':
            compareValue = b.id - a.id; // IDが大きいほど新しいと仮定
            break;
          default:
            compareValue = 0;
        }

        return filters.sortOrder === 'asc' ? compareValue : -compareValue;
      });

      // ページネーション
      const total = results.length;
      const paginatedResults = results.slice(offset, offset + limit);

      // 画像を取得（実装を簡単にするため、各店舗の最初の画像のみ）
      for (const venue of paginatedResults) {
        const imageRows = db.prepare(`
          SELECT file_path FROM images 
          WHERE venue_id = ? AND category = 'venue' 
          ORDER BY created_at ASC LIMIT 3
        `).all(venue.id) as any[];
        
        venue.images = imageRows.map(row => row.file_path);
      }

      // 検索統計
      const categories = db.prepare(`
        SELECT category, COUNT(*) as count
        FROM venues
        GROUP BY category
        ORDER BY count DESC
      `).all() as any[];

      const priceRanges = db.prepare(`
        SELECT price_range, COUNT(*) as count
        FROM venues
        WHERE price_range IS NOT NULL
        GROUP BY price_range
        ORDER BY 
          CASE price_range
            WHEN 'budget' THEN 1
            WHEN 'moderate' THEN 2
            WHEN 'expensive' THEN 3
            WHEN 'luxury' THEN 4
          END
      `).all() as any[];

      const popularTags = db.prepare(`
        SELECT tag, COUNT(*) as count
        FROM venue_tags
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 20
      `).all() as any[];

      return new Response(JSON.stringify({
        success: true,
        results: paginatedResults,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
          pages: Math.ceil(total / limit),
          currentPage: Math.floor(offset / limit) + 1,
        },
        filters: filters,
        query,
        stats: {
          categories,
          priceRanges,
          popularTags,
          resultCount: total,
        },
      }), {
        headers: { "Content-Type": "application/json" },
      });

    } catch (error) {
      console.error("Search error:", error);
      
      return new Response(JSON.stringify({
        success: false,
        error: "検索中にエラーが発生しました",
        details: error.message,
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async POST(req) {
    // 高度な検索（複雑なフィルターや保存された検索など）
    try {
      await initDatabase();
      
      const body = await req.json();
      const { 
        query, 
        filters = {}, 
        saveSearch = false, 
        searchName 
      } = body;

      // 保存された検索の処理
      if (saveSearch && searchName) {
        // TODO: 検索条件をデータベースに保存
        console.log(`Saving search: ${searchName}`, { query, filters });
      }

      // GETリクエストと同じロジックを使用
      const searchParams = new URLSearchParams();
      searchParams.set('q', query || '');
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });

      const searchUrl = new URL(`${req.url}?${searchParams}`);
      const getRequest = new Request(searchUrl, { method: 'GET' });
      
      return await this.GET!(getRequest);

    } catch (error) {
      console.error("Advanced search error:", error);
      
      return new Response(JSON.stringify({
        success: false,
        error: "高度な検索中にエラーが発生しました",
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};