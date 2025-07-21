import { AUTH_CONFIG } from '../config/auth';
import { TokenManager } from '../utils/authUtils';

/**
 * お気に入り店舗関連APIサービス
 */
class FavoritesService {
  constructor() {
    this.baseURL = AUTH_CONFIG.API.BASE_URL;
  }

  /**
   * お気に入り店舗一覧を取得
   */
  async getFavorites() {
    try {
      // モック実装 - 実際のAPIエンドポイントに置き換える
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockFavorites = [
        {
          id: '1',
          name: 'バー モクテル',
          category: 'バー',
          imageUrl: 'https://example.com/bar1.jpg',
          rating: 4.5,
          distance: 120,
          address: '東京都渋谷区道玄坂1-2-3',
          phone: '03-1234-5678',
          openingHours: '18:00-02:00',
          addedAt: '2024-01-15T12:00:00Z',
          description: '落ち着いた雰囲気のバー。豊富なカクテルメニューが自慢。',
        },
        {
          id: '2',
          name: 'クラブ ナイトフィーバー',
          category: 'クラブ',
          imageUrl: 'https://example.com/club1.jpg',
          rating: 4.2,
          distance: 200,
          address: '東京都渋谷区宇田川町4-5-6',
          phone: '03-2345-6789',
          openingHours: '20:00-05:00',
          addedAt: '2024-01-10T18:30:00Z',
          description: '最新のサウンドシステムで楽しむダンスクラブ。',
        },
        {
          id: '3',
          name: 'ラウンジ セレニティ',
          category: 'ラウンジ',
          imageUrl: 'https://example.com/lounge1.jpg',
          rating: 4.7,
          distance: 80,
          address: '東京都渋谷区神南1-7-8',
          phone: '03-3456-7890',
          openingHours: '17:00-01:00',
          addedAt: '2024-01-08T20:15:00Z',
          description: '大人の空間で楽しむプレミアムラウンジ。',
        },
      ];
      
      return {
        success: true,
        data: mockFavorites,
        total: mockFavorites.length,
      };
    } catch (error) {
      console.error('Get favorites error:', error);
      return {
        success: false,
        error: 'お気に入り店舗の取得に失敗しました',
      };
    }
  }

  /**
   * 店舗をお気に入りに追加
   */
  async addFavorite(storeId) {
    try {
      // モック実装 - 実際のAPIエンドポイントに置き換える
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 既にお気に入りかチェック（実際の実装では不要）
      const existingFavorites = await this.getFavorites();
      const isAlreadyFavorite = existingFavorites.data.some(fav => fav.id === storeId);
      
      if (isAlreadyFavorite) {
        return {
          success: false,
          error: '既にお気に入りに追加されています',
        };
      }
      
      return {
        success: true,
        message: 'お気に入りに追加しました',
        data: {
          id: storeId,
          addedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Add favorite error:', error);
      return {
        success: false,
        error: 'お気に入りの追加に失敗しました',
      };
    }
  }

  /**
   * お気に入りから削除
   */
  async removeFavorite(storeId) {
    try {
      // モック実装 - 実際のAPIエンドポイントに置き換える
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        message: 'お気に入りから削除しました',
      };
    } catch (error) {
      console.error('Remove favorite error:', error);
      return {
        success: false,
        error: 'お気に入りの削除に失敗しました',
      };
    }
  }

  /**
   * 店舗がお気に入りかチェック
   */
  async isFavorite(storeId) {
    try {
      const favorites = await this.getFavorites();
      
      if (favorites.success) {
        const isFavorite = favorites.data.some(fav => fav.id === storeId);
        return {
          success: true,
          isFavorite,
        };
      }
      
      return {
        success: false,
        isFavorite: false,
      };
    } catch (error) {
      console.error('Check favorite error:', error);
      return {
        success: false,
        isFavorite: false,
      };
    }
  }

  /**
   * お気に入り店舗の統計情報を取得
   */
  async getFavoriteStats() {
    try {
      const favorites = await this.getFavorites();
      
      if (favorites.success) {
        const stats = {
          totalCount: favorites.data.length,
          categoryStats: {},
          averageRating: 0,
          recentlyAdded: [],
        };
        
        // カテゴリ別統計
        favorites.data.forEach(fav => {
          stats.categoryStats[fav.category] = (stats.categoryStats[fav.category] || 0) + 1;
        });
        
        // 平均評価
        if (favorites.data.length > 0) {
          stats.averageRating = favorites.data.reduce((sum, fav) => sum + fav.rating, 0) / favorites.data.length;
        }
        
        // 最近追加された店舗（直近7日間）
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        stats.recentlyAdded = favorites.data.filter(fav => 
          new Date(fav.addedAt) > sevenDaysAgo
        ).sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
        
        return {
          success: true,
          data: stats,
        };
      }
      
      return {
        success: false,
        error: '統計情報の取得に失敗しました',
      };
    } catch (error) {
      console.error('Get favorite stats error:', error);
      return {
        success: false,
        error: '統計情報の取得に失敗しました',
      };
    }
  }

  /**
   * お気に入り店舗をカテゴリ別に取得
   */
  async getFavoritesByCategory(category) {
    try {
      const favorites = await this.getFavorites();
      
      if (favorites.success) {
        const filteredFavorites = favorites.data.filter(fav => 
          fav.category === category
        );
        
        return {
          success: true,
          data: filteredFavorites,
          category,
          total: filteredFavorites.length,
        };
      }
      
      return {
        success: false,
        error: 'カテゴリ別お気に入り店舗の取得に失敗しました',
      };
    } catch (error) {
      console.error('Get favorites by category error:', error);
      return {
        success: false,
        error: 'カテゴリ別お気に入り店舗の取得に失敗しました',
      };
    }
  }

  /**
   * 近くのお気に入り店舗を取得
   */
  async getNearbyFavorites(userLocation, radius = 1000) {
    try {
      const favorites = await this.getFavorites();
      
      if (favorites.success) {
        // 実際の実装では位置情報を使用して計算
        const nearbyFavorites = favorites.data.filter(fav => 
          fav.distance <= radius
        ).sort((a, b) => a.distance - b.distance);
        
        return {
          success: true,
          data: nearbyFavorites,
          userLocation,
          radius,
          total: nearbyFavorites.length,
        };
      }
      
      return {
        success: false,
        error: '近くのお気に入り店舗の取得に失敗しました',
      };
    } catch (error) {
      console.error('Get nearby favorites error:', error);
      return {
        success: false,
        error: '近くのお気に入り店舗の取得に失敗しました',
      };
    }
  }

  /**
   * お気に入り店舗をエクスポート
   */
  async exportFavorites() {
    try {
      const favorites = await this.getFavorites();
      
      if (favorites.success) {
        const exportData = {
          exportDate: new Date().toISOString(),
          totalCount: favorites.data.length,
          favorites: favorites.data.map(fav => ({
            name: fav.name,
            category: fav.category,
            address: fav.address,
            rating: fav.rating,
            addedAt: fav.addedAt,
          })),
        };
        
        return {
          success: true,
          data: exportData,
        };
      }
      
      return {
        success: false,
        error: 'お気に入り店舗のエクスポートに失敗しました',
      };
    } catch (error) {
      console.error('Export favorites error:', error);
      return {
        success: false,
        error: 'お気に入り店舗のエクスポートに失敗しました',
      };
    }
  }

  /**
   * お気に入り店舗をインポート
   */
  async importFavorites(importData) {
    try {
      // モック実装 - 実際のAPIエンドポイントに置き換える
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!importData || !importData.favorites) {
        return {
          success: false,
          error: 'インポートデータが無効です',
        };
      }
      
      const importedCount = importData.favorites.length;
      
      return {
        success: true,
        message: `${importedCount}件のお気に入り店舗をインポートしました`,
        data: {
          importedCount,
          importDate: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Import favorites error:', error);
      return {
        success: false,
        error: 'お気に入り店舗のインポートに失敗しました',
      };
    }
  }
}

// シングルトンインスタンス
const favoritesService = new FavoritesService();

export default favoritesService;