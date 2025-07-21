import { Alert } from 'react-native';
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS, FEATURE_REQUIREMENTS } from '../constants/subscriptions';

class BillingService {
  constructor() {
    this.currentSubscription = {
      id: '',
      planId: 'basic_plan',
      status: SUBSCRIPTION_STATUS.NONE,
      startDate: null,
      endDate: null,
      autoRenew: false,
      price: 0,
      currency: 'JPY'
    };
    this.isInitialized = false;
  }

  // 課金サービスを初期化
  async initialize() {
    try {
      // 実際のアプリではExpo In-App PurchasesやStripeを使用
      console.log('Billing service initialized');
      this.isInitialized = true;
      
      // デモ用：ローカルストレージから課金情報を読み込み
      await this.loadSubscriptionData();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize billing service:', error);
      return false;
    }
  }

  // 課金情報を読み込み
  async loadSubscriptionData() {
    try {
      // 実際のアプリではAsyncStorageやサーバーから取得
      const savedSubscription = await this.getSavedSubscription();
      if (savedSubscription) {
        this.currentSubscription = savedSubscription;
      }
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    }
  }

  // 保存された課金情報を取得（デモ用）
  async getSavedSubscription() {
    // 実際のアプリではAsyncStorageから取得
    return null;
  }

  // 課金情報を保存（デモ用）
  async saveSubscriptionData(subscription) {
    // 実際のアプリではAsyncStorageに保存
    console.log('Subscription data saved:', subscription);
  }

  // 利用可能なプランを取得
  getAvailablePlans() {
    return Object.values(SUBSCRIPTION_PLANS);
  }

  // 現在のプランを取得
  getCurrentPlan() {
    return SUBSCRIPTION_PLANS[this.getPlanKey(this.currentSubscription.planId)];
  }

  // プランIDからプランキーを取得
  getPlanKey(planId) {
    const planKeys = Object.keys(SUBSCRIPTION_PLANS);
    return planKeys.find(key => SUBSCRIPTION_PLANS[key].id === planId) || 'BASIC';
  }

  // 現在の課金状態を取得
  getCurrentSubscription() {
    return this.currentSubscription;
  }

  // 課金状態を更新
  async updateSubscription(subscription) {
    this.currentSubscription = { ...this.currentSubscription, ...subscription };
    await this.saveSubscriptionData(this.currentSubscription);
  }

  // プランの購入処理
  async purchasePlan(planId) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planId);
      if (!plan) {
        throw new Error('Invalid plan ID');
      }

      // 実際のアプリでは課金処理を実行
      // const purchase = await InAppPurchases.purchaseItemAsync(planId);
      
      // デモ用：成功したと仮定
      const newSubscription = {
        id: `sub_${Date.now()}`,
        planId: planId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30日後
        autoRenew: true,
        price: plan.price,
        currency: plan.currency
      };

      await this.updateSubscription(newSubscription);

      Alert.alert(
        '購入完了',
        `${plan.name}の購入が完了しました！`,
        [{ text: 'OK' }]
      );

      return newSubscription;
    } catch (error) {
      console.error('Purchase failed:', error);
      Alert.alert(
        '購入エラー',
        '購入処理中にエラーが発生しました。',
        [{ text: 'OK' }]
      );
      return null;
    }
  }

  // プランのキャンセル
  async cancelSubscription() {
    try {
      // 実際のアプリでは課金キャンセル処理を実行
      // await InAppPurchases.cancelSubscriptionAsync(this.currentSubscription.id);
      
      const updatedSubscription = {
        ...this.currentSubscription,
        status: SUBSCRIPTION_STATUS.CANCELLED,
        autoRenew: false
      };

      await this.updateSubscription(updatedSubscription);

      Alert.alert(
        'キャンセル完了',
        'サブスクリプションをキャンセルしました。',
        [{ text: 'OK' }]
      );

      return updatedSubscription;
    } catch (error) {
      console.error('Cancel failed:', error);
      Alert.alert(
        'キャンセルエラー',
        'キャンセル処理中にエラーが発生しました。',
        [{ text: 'OK' }]
      );
      return null;
    }
  }

  // 機能の利用権限をチェック
  hasFeatureAccess(featureKey) {
    const feature = FEATURE_REQUIREMENTS[featureKey];
    if (!feature) {
      return true; // 要件が定義されていない機能は利用可能
    }

    const currentPlan = this.getCurrentPlan();
    const requiredPlan = SUBSCRIPTION_PLANS[this.getPlanKey(feature.requiredPlan)];

    // プランの価格で権限を判定（実際のアプリではより詳細な権限管理）
    return currentPlan.price >= requiredPlan.price && 
           this.currentSubscription.status === SUBSCRIPTION_STATUS.ACTIVE;
  }

  // クーポン管理機能の利用権限
  canUseCouponManagement() {
    return this.hasFeatureAccess('COUPON_MANAGEMENT');
  }

  // プッシュ通知機能の利用権限
  canUsePushNotifications() {
    return this.hasFeatureAccess('PUSH_NOTIFICATIONS');
  }

  // 詳細分析機能の利用権限
  canUseAdvancedAnalytics() {
    return this.hasFeatureAccess('ADVANCED_ANALYTICS');
  }

  // マーケティング機能の利用権限
  canUseMarketingTools() {
    return this.hasFeatureAccess('MARKETING_TOOLS');
  }

  // 課金が必要な機能にアクセスしようとした時の処理
  showUpgradePrompt(featureKey) {
    const feature = FEATURE_REQUIREMENTS[featureKey];
    if (!feature) return;

    const requiredPlan = SUBSCRIPTION_PLANS[this.getPlanKey(feature.requiredPlan)];
    
    Alert.alert(
      '機能の利用には課金が必要です',
      `${feature.featureName}を利用するには${requiredPlan.name}（${requiredPlan.price}円/月）の購入が必要です。`,
      [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: 'プランを確認',
          onPress: () => {
            // プラン選択画面に遷移
            console.log('Navigate to plan selection');
          }
        }
      ]
    );
  }

  // 課金状態の確認
  isSubscriptionActive() {
    return this.currentSubscription.status === SUBSCRIPTION_STATUS.ACTIVE;
  }

  // 課金期限の確認
  isSubscriptionExpired() {
    if (!this.currentSubscription.endDate) return true;
    return new Date() > new Date(this.currentSubscription.endDate);
  }

  // 課金情報の更新（定期的に実行）
  async refreshSubscriptionStatus() {
    try {
      // 実際のアプリではサーバーから最新の課金情報を取得
      if (this.isSubscriptionExpired()) {
        await this.updateSubscription({
          ...this.currentSubscription,
          status: SUBSCRIPTION_STATUS.EXPIRED
        });
      }
    } catch (error) {
      console.error('Failed to refresh subscription status:', error);
    }
  }

  // 課金履歴を取得
  getSubscriptionHistory() {
    // 実際のアプリではデータベースから取得
    return [this.currentSubscription];
  }

  // 無料トライアルの開始
  async startFreeTrial(planId) {
    try {
      const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planId);
      if (!plan) {
        throw new Error('Invalid plan ID');
      }

      const trialSubscription = {
        id: `trial_${Date.now()}`,
        planId: planId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7日間
        autoRenew: false,
        price: 0,
        currency: 'JPY',
        isTrial: true
      };

      await this.updateSubscription(trialSubscription);

      Alert.alert(
        'トライアル開始',
        `${plan.name}の7日間無料トライアルを開始しました！`,
        [{ text: 'OK' }]
      );

      return trialSubscription;
    } catch (error) {
      console.error('Trial start failed:', error);
      return null;
    }
  }
}

// シングルトンインスタンス
const billingService = new BillingService();

export default billingService; 