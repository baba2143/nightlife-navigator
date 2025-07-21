import { Alert } from 'react-native';
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS } from '../constants/subscriptions';

class AdminBillingService {
  constructor() {
    // 全ユーザーの課金情報を管理（実際のアプリではデータベースを使用）
    this.subscriptions = new Map();
    this.grantHistory = [];
  }

  // 管理者によるプラン付与
  async grantPlanByAdmin(planId, userId, adminId, duration = null, reason = '') {
    try {
      const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planId);
      if (!plan) {
        throw new Error('プランが見つかりません');
      }

      // 既存のプランをキャンセル
      await this.cancelSubscription(userId);

      // 管理者によるプラン付与
      const subscription = {
        id: `admin_grant_${Date.now()}`,
        userId,
        planId,
        plan: plan,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startDate: new Date().toISOString(),
        endDate: duration 
          ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // デフォルト30日
        autoRenew: false,
        price: 0, // 無償付与
        currency: 'JPY',
        grantedBy: adminId,
        grantedAt: new Date().toISOString(),
        isAdminGranted: true,
        reason: reason,
        isTrial: false
      };

      this.subscriptions.set(userId, subscription);

      // 付与履歴を記録
      this.grantHistory.push({
        id: `history_${Date.now()}`,
        userId,
        planId,
        planName: plan.name,
        adminId,
        grantedAt: new Date().toISOString(),
        reason: reason,
        duration: duration || 30
      });
      
      console.log(`管理者プラン付与: ${plan.name} (${userId}) by ${adminId}`);
      
      return { success: true, subscription };
    } catch (error) {
      console.error('管理者プラン付与エラー:', error);
      return { success: false, error: error.message };
    }
  }

  // 管理者によるプラン取り消し
  async revokePlanByAdmin(userId, adminId, reason = '') {
    try {
      const subscription = this.subscriptions.get(userId);
      if (!subscription) {
        throw new Error('プランが見つかりません');
      }

      if (!subscription.isAdminGranted) {
        throw new Error('管理者付与のプランのみ取り消し可能です');
      }

      // プランをキャンセル
      subscription.status = SUBSCRIPTION_STATUS.CANCELLED;
      subscription.revokedBy = adminId;
      subscription.revokedAt = new Date().toISOString();
      subscription.revokeReason = reason;

      this.subscriptions.set(userId, subscription);
      
      console.log(`管理者プラン取り消し: (${userId}) by ${adminId}`);
      
      return { success: true };
    } catch (error) {
      console.error('管理者プラン取り消しエラー:', error);
      return { success: false, error: error.message };
    }
  }

  // 管理者によるプラン延長
  async extendPlanByAdmin(userId, adminId, additionalDays, reason = '') {
    try {
      const subscription = this.subscriptions.get(userId);
      if (!subscription) {
        throw new Error('プランが見つかりません');
      }

      if (!subscription.isAdminGranted) {
        throw new Error('管理者付与のプランのみ延長可能です');
      }

      if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {
        throw new Error('アクティブなプランのみ延長可能です');
      }

      // プランを延長
      const currentEndDate = new Date(subscription.endDate);
      const newEndDate = new Date(currentEndDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);
      
      subscription.endDate = newEndDate.toISOString();
      subscription.extendedBy = adminId;
      subscription.extendedAt = new Date().toISOString();
      subscription.extensionReason = reason;
      subscription.extensionDays = additionalDays;

      this.subscriptions.set(userId, subscription);
      
      console.log(`管理者プラン延長: ${additionalDays}日 (${userId}) by ${adminId}`);
      
      return { success: true, subscription };
    } catch (error) {
      console.error('管理者プラン延長エラー:', error);
      return { success: false, error: error.message };
    }
  }

  // 管理者によるプラン変更
  async changePlanByAdmin(userId, adminId, newPlanId, reason = '') {
    try {
      const newPlan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === newPlanId);
      if (!newPlan) {
        throw new Error('プランが見つかりません');
      }

      const subscription = this.subscriptions.get(userId);
      if (!subscription) {
        throw new Error('プランが見つかりません');
      }

      if (!subscription.isAdminGranted) {
        throw new Error('管理者付与のプランのみ変更可能です');
      }

      // プランを変更
      const oldPlanId = subscription.planId;
      subscription.planId = newPlanId;
      subscription.plan = newPlan;
      subscription.changedBy = adminId;
      subscription.changedAt = new Date().toISOString();
      subscription.changeReason = reason;
      subscription.previousPlanId = oldPlanId;

      this.subscriptions.set(userId, subscription);
      
      console.log(`管理者プラン変更: ${oldPlanId} → ${newPlanId} (${userId}) by ${adminId}`);
      
      return { success: true, subscription };
    } catch (error) {
      console.error('管理者プラン変更エラー:', error);
      return { success: false, error: error.message };
    }
  }

  // 管理者付与プランの一覧取得
  getAdminGrantedSubscriptions() {
    const adminGranted = [];
    for (const [userId, subscription] of this.subscriptions) {
      if (subscription.isAdminGranted) {
        adminGranted.push({
          ...subscription,
          userId
        });
      }
    }
    return adminGranted.sort((a, b) => new Date(b.grantedAt) - new Date(a.grantedAt));
  }

  // 特定の管理者が付与したプランの取得
  getSubscriptionsByAdmin(adminId) {
    const adminGranted = [];
    for (const [userId, subscription] of this.subscriptions) {
      if (subscription.isAdminGranted && subscription.grantedBy === adminId) {
        adminGranted.push({
          ...subscription,
          userId
        });
      }
    }
    return adminGranted.sort((a, b) => new Date(b.grantedAt) - new Date(a.grantedAt));
  }

  // プラン付与履歴の取得
  getGrantHistory(adminId = null) {
    if (adminId) {
      return this.grantHistory
        .filter(history => history.adminId === adminId)
        .sort((a, b) => new Date(b.grantedAt) - new Date(a.grantedAt));
    }
    return this.grantHistory.sort((a, b) => new Date(b.grantedAt) - new Date(a.grantedAt));
  }

  // 特定ユーザーの課金情報取得
  getUserSubscription(userId) {
    return this.subscriptions.get(userId) || null;
  }

  // 全ユーザーの課金情報取得
  getAllSubscriptions() {
    const allSubscriptions = [];
    for (const [userId, subscription] of this.subscriptions) {
      allSubscriptions.push({
        ...subscription,
        userId
      });
    }
    return allSubscriptions.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }

  // 課金統計情報の取得
  getBillingStatistics() {
    const stats = {
      totalGranted: 0,
      activeGrants: 0,
      expiredGrants: 0,
      cancelledGrants: 0,
      totalRevenue: 0,
      planDistribution: {},
      monthlyGrants: {}
    };

    for (const [userId, subscription] of this.subscriptions) {
      if (subscription.isAdminGranted) {
        stats.totalGranted++;
        
        if (subscription.status === SUBSCRIPTION_STATUS.ACTIVE) {
          stats.activeGrants++;
        } else if (subscription.status === SUBSCRIPTION_STATUS.EXPIRED) {
          stats.expiredGrants++;
        } else if (subscription.status === SUBSCRIPTION_STATUS.CANCELLED) {
          stats.cancelledGrants++;
        }

        // プラン分布
        const planName = subscription.plan?.name || 'Unknown';
        stats.planDistribution[planName] = (stats.planDistribution[planName] || 0) + 1;

        // 月別付与数
        const grantMonth = new Date(subscription.grantedAt).toISOString().substring(0, 7);
        stats.monthlyGrants[grantMonth] = (stats.monthlyGrants[grantMonth] || 0) + 1;
      }
    }

    return stats;
  }

  // 期限切れプランの自動更新
  async checkExpiredSubscriptions() {
    const expiredSubscriptions = [];
    const now = new Date();

    for (const [userId, subscription] of this.subscriptions) {
      if (subscription.isAdminGranted && 
          subscription.status === SUBSCRIPTION_STATUS.ACTIVE &&
          new Date(subscription.endDate) < now) {
        
        subscription.status = SUBSCRIPTION_STATUS.EXPIRED;
        this.subscriptions.set(userId, subscription);
        
        expiredSubscriptions.push({
          userId,
          subscription
        });
      }
    }

    return expiredSubscriptions;
  }

  // プラン付与の検証
  validateGrantRequest(planId, userId, duration) {
    const errors = [];

    // プランの存在確認
    const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planId);
    if (!plan) {
      errors.push('無効なプランIDです');
    }

    // ユーザーIDの検証
    if (!userId || userId.trim() === '') {
      errors.push('ユーザーIDは必須です');
    }

    // 期間の検証
    if (duration && (duration < 1 || duration > 365)) {
      errors.push('期間は1日〜365日の間で指定してください');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 課金情報のエクスポート（CSV形式）
  exportBillingData() {
    const data = [];
    
    for (const [userId, subscription] of this.subscriptions) {
      if (subscription.isAdminGranted) {
        data.push({
          userId,
          planName: subscription.plan?.name || 'Unknown',
          status: subscription.status,
          grantedAt: subscription.grantedAt,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          grantedBy: subscription.grantedBy,
          reason: subscription.reason || ''
        });
      }
    }

    return data;
  }

  // デモデータの初期化
  initializeDemoData() {
    // デモ用の管理者付与プラン
    const demoSubscriptions = [
      {
        userId: 'owner1',
        planId: 'premium_plan',
        plan: SUBSCRIPTION_PLANS.PREMIUM,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        grantedBy: 'admin1',
        grantedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        isAdminGranted: true,
        reason: '新規店舗サポート'
      },
      {
        userId: 'owner2',
        planId: 'business_plan',
        plan: SUBSCRIPTION_PLANS.BUSINESS,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        grantedBy: 'admin1',
        grantedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        isAdminGranted: true,
        reason: 'VIP店舗サポート'
      },
      {
        userId: 'owner3',
        planId: 'premium_plan',
        plan: SUBSCRIPTION_PLANS.PREMIUM,
        status: SUBSCRIPTION_STATUS.EXPIRED,
        startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        grantedBy: 'admin2',
        grantedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        isAdminGranted: true,
        reason: '期間限定サポート'
      }
    ];

    demoSubscriptions.forEach((sub, index) => {
      this.subscriptions.set(sub.userId, {
        ...sub,
        id: `demo_grant_${index + 1}`,
        autoRenew: false,
        price: 0,
        currency: 'JPY',
        isTrial: false
      });

      this.grantHistory.push({
        id: `demo_history_${index + 1}`,
        userId: sub.userId,
        planId: sub.planId,
        planName: sub.plan.name,
        adminId: sub.grantedBy,
        grantedAt: sub.grantedAt,
        reason: sub.reason,
        duration: 30
      });
    });
  }

  // プランのキャンセル（内部メソッド）
  async cancelSubscription(userId) {
    const subscription = this.subscriptions.get(userId);
    if (subscription) {
      subscription.status = SUBSCRIPTION_STATUS.CANCELLED;
      this.subscriptions.set(userId, subscription);
    }
  }
}

// シングルトンインスタンス
const adminBillingService = new AdminBillingService();

// デモデータを初期化
adminBillingService.initializeDemoData();

export default adminBillingService; 