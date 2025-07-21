import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_CONFIG } from '../config/auth';

/**
 * アクティビティ管理サービス
 */
class ActivityService {
  constructor() {
    this.baseURL = AUTH_CONFIG.API.BASE_URL;
    this.storageKey = 'user_activities';
  }

  /**
   * アクティビティを記録
   */
  async recordActivity(activityData) {
    try {
      const activity = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        userId: activityData.userId,
        type: activityData.type,
        ...activityData,
      };

      // ローカルストレージに保存
      await this.saveActivityToLocal(activity);
      
      // サーバーに送信（実際の実装では）
      // await this.sendActivityToServer(activity);
      
      return {
        success: true,
        data: activity,
      };
    } catch (error) {
      console.error('Record activity error:', error);
      return {
        success: false,
        error: 'アクティビティの記録に失敗しました',
      };
    }
  }

  /**
   * アクティビティ一覧を取得
   */
  async getActivities(filter = 'all', limit = 50) {
    try {
      // ローカルストレージから取得
      const localActivities = await this.getActivitiesFromLocal();
      
      // サーバーから取得（実際の実装では）
      // const serverActivities = await this.getActivitiesFromServer(filter, limit);
      
      let activities = localActivities;
      
      // フィルター適用
      if (filter !== 'all') {
        const typeMap = {
          visits: 'visit',
          favorites: 'favorite',
          reviews: 'review',
          profile: 'profile_update',
        };
        
        activities = activities.filter(activity => 
          activity.type === typeMap[filter]
        );
      }
      
      // 制限数適用
      activities = activities.slice(0, limit);
      
      return {
        success: true,
        data: activities,
        total: activities.length,
      };
    } catch (error) {
      console.error('Get activities error:', error);
      return {
        success: false,
        error: 'アクティビティの取得に失敗しました',
      };
    }
  }

  /**
   * 店舗訪問を記録
   */
  async recordVisit(storeId, storeName, duration = null) {
    return await this.recordActivity({
      type: 'visit',
      storeId,
      storeName,
      duration,
      details: duration ? `${Math.round(duration / 60)}分滞在` : undefined,
    });
  }

  /**
   * お気に入り追加を記録
   */
  async recordFavorite(storeId, storeName) {
    return await this.recordActivity({
      type: 'favorite',
      storeId,
      storeName,
    });
  }

  /**
   * レビュー投稿を記録
   */
  async recordReview(storeId, storeName, rating, reviewText) {
    return await this.recordActivity({
      type: 'review',
      storeId,
      storeName,
      rating,
      reviewText,
      details: `★${rating} ${reviewText.substring(0, 50)}${reviewText.length > 50 ? '...' : ''}`,
    });
  }

  /**
   * プロフィール更新を記録
   */
  async recordProfileUpdate(updateType = 'general') {
    return await this.recordActivity({
      type: 'profile_update',
      updateType,
    });
  }

  /**
   * アカウント作成を記録
   */
  async recordSignup() {
    return await this.recordActivity({
      type: 'signup',
    });
  }

  /**
   * アクティビティ統計を取得
   */
  async getActivityStats() {
    try {
      const activities = await this.getActivitiesFromLocal();
      
      const stats = {
        totalActivities: activities.length,
        thisWeek: 0,
        thisMonth: 0,
        typeStats: {},
        recentActivity: null,
      };
      
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      activities.forEach(activity => {
        const activityDate = new Date(activity.timestamp);
        
        // 週間統計
        if (activityDate > weekAgo) {
          stats.thisWeek++;
        }
        
        // 月間統計
        if (activityDate > monthAgo) {
          stats.thisMonth++;
        }
        
        // タイプ別統計
        stats.typeStats[activity.type] = (stats.typeStats[activity.type] || 0) + 1;
      });
      
      // 最新のアクティビティ
      if (activities.length > 0) {
        stats.recentActivity = activities[0];
      }
      
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('Get activity stats error:', error);
      return {
        success: false,
        error: '統計情報の取得に失敗しました',
      };
    }
  }

  /**
   * 特定期間のアクティビティを取得
   */
  async getActivitiesByDateRange(startDate, endDate) {
    try {
      const activities = await this.getActivitiesFromLocal();
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const filteredActivities = activities.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        return activityDate >= start && activityDate <= end;
      });
      
      return {
        success: true,
        data: filteredActivities,
        dateRange: { startDate, endDate },
        total: filteredActivities.length,
      };
    } catch (error) {
      console.error('Get activities by date range error:', error);
      return {
        success: false,
        error: '期間指定アクティビティの取得に失敗しました',
      };
    }
  }

  /**
   * アクティビティを削除
   */
  async deleteActivity(activityId) {
    try {
      const activities = await this.getActivitiesFromLocal();
      const filteredActivities = activities.filter(activity => activity.id !== activityId);
      
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(filteredActivities));
      
      return {
        success: true,
        message: 'アクティビティを削除しました',
      };
    } catch (error) {
      console.error('Delete activity error:', error);
      return {
        success: false,
        error: 'アクティビティの削除に失敗しました',
      };
    }
  }

  /**
   * すべてのアクティビティを削除
   */
  async clearAllActivities() {
    try {
      await AsyncStorage.removeItem(this.storageKey);
      
      return {
        success: true,
        message: 'すべてのアクティビティを削除しました',
      };
    } catch (error) {
      console.error('Clear all activities error:', error);
      return {
        success: false,
        error: 'アクティビティの削除に失敗しました',
      };
    }
  }

  /**
   * アクティビティをエクスポート
   */
  async exportActivities() {
    try {
      const activities = await this.getActivitiesFromLocal();
      
      const exportData = {
        exportDate: new Date().toISOString(),
        totalCount: activities.length,
        activities: activities.map(activity => ({
          id: activity.id,
          type: activity.type,
          timestamp: activity.timestamp,
          storeName: activity.storeName,
          details: activity.details,
        })),
      };
      
      return {
        success: true,
        data: exportData,
      };
    } catch (error) {
      console.error('Export activities error:', error);
      return {
        success: false,
        error: 'アクティビティのエクスポートに失敗しました',
      };
    }
  }

  /**
   * ローカルストレージからアクティビティを取得
   */
  async getActivitiesFromLocal() {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      
      if (stored) {
        const activities = JSON.parse(stored);
        // 新しい順にソート
        return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      
      return [];
    } catch (error) {
      console.error('Get activities from local error:', error);
      return [];
    }
  }

  /**
   * ローカルストレージにアクティビティを保存
   */
  async saveActivityToLocal(activity) {
    try {
      const activities = await this.getActivitiesFromLocal();
      activities.unshift(activity);
      
      // 最大100件まで保存
      const limitedActivities = activities.slice(0, 100);
      
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(limitedActivities));
      
      return true;
    } catch (error) {
      console.error('Save activity to local error:', error);
      return false;
    }
  }

  /**
   * サーバーにアクティビティを送信（実際の実装用）
   */
  async sendActivityToServer(activity) {
    try {
      // 実際の実装では API エンドポイントに送信
      // const response = await fetch(`${this.baseURL}/activities`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${accessToken}`,
      //   },
      //   body: JSON.stringify(activity),
      // });
      
      // const result = await response.json();
      // return result;
      
      return { success: true };
    } catch (error) {
      console.error('Send activity to server error:', error);
      return { success: false };
    }
  }

  /**
   * サーバーからアクティビティを取得（実際の実装用）
   */
  async getActivitiesFromServer(filter, limit) {
    try {
      // 実際の実装では API エンドポイントから取得
      // const response = await fetch(`${this.baseURL}/activities?filter=${filter}&limit=${limit}`, {
      //   headers: {
      //     'Authorization': `Bearer ${accessToken}`,
      //   },
      // });
      
      // const result = await response.json();
      // return result.data;
      
      return [];
    } catch (error) {
      console.error('Get activities from server error:', error);
      return [];
    }
  }
}

// シングルトンインスタンス
const activityService = new ActivityService();

export default activityService;