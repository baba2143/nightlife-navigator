import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { BARS, COUPONS, USER_COUPONS } from '../constants/data';
import notificationService from '../services/NotificationService';
import billingService from '../services/BillingService';

// 初期状態
const initialState = {
  // ユーザー関連
  userMode: 'user', // 'user' or 'owner'
  currentScreen: 'home',
  selectedBar: null,
  
  // お気に入り
  favorites: [],
  
  // クーポン関連
  coupons: COUPONS,
  userCoupons: USER_COUPONS,
  
  // 通知関連
  notifications: [],
  unreadCount: 0,
  
  // 店舗関連
  bars: BARS,
  myBars: [
    {
      id: 1,
      name: 'Moon Light',
      genre: 'スナック／パブ',
      rating: 4.8,
      reviewCount: 156,
      status: 'approved'
    }
  ],
  myCoupons: [
    {
      id: 'coupon_1',
      barId: 1,
      title: 'ドリンク1杯サービス',
      description: 'お酒以外のドリンク1杯をサービス',
      type: 'store_coupon',
      discount: '100%OFF',
      discountAmount: 800,
      conditions: ['お酒以外のドリンクに限る', '1人1回限り'],
      validFrom: '2024-01-01',
      validTo: '2024-12-31',
      usageLimit: 100,
      usedCount: 15,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ],
  
  // レビュー関連
  reviews: [
    {
      id: 'r1',
      barId: 1,
      userName: 'ナイトライフ愛好家',
      rating: 5,
      comment: 'ママさんが最高！常連さんも優しくて、初めてでも楽しめました。',
      createdAt: '2024-01-16T22:30:00Z',
      ownerReply: null
    }
  ],
  
  // UI状態
  loading: false,
  error: null,
  
  // 課金関連
  subscription: null,
  billingLoading: false
};

// アクションタイプ
export const ACTIONS = {
  // ユーザー関連
  SET_USER_MODE: 'SET_USER_MODE',
  SET_CURRENT_SCREEN: 'SET_CURRENT_SCREEN',
  SET_SELECTED_BAR: 'SET_SELECTED_BAR',
  
  // お気に入り関連
  TOGGLE_FAVORITE: 'TOGGLE_FAVORITE',
  SET_FAVORITES: 'SET_FAVORITES',
  
  // クーポン関連
  ADD_COUPON: 'ADD_COUPON',
  UPDATE_COUPON: 'UPDATE_COUPON',
  DELETE_COUPON: 'DELETE_COUPON',
  USE_COUPON: 'USE_COUPON',
  
  // 通知関連
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_NOTIFICATION_READ: 'MARK_NOTIFICATION_READ',
  DELETE_NOTIFICATION: 'DELETE_NOTIFICATION',
  CLEAR_ALL_NOTIFICATIONS: 'CLEAR_ALL_NOTIFICATIONS',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  
  // 店舗関連
  ADD_BAR: 'ADD_BAR',
  UPDATE_BAR: 'UPDATE_BAR',
  DELETE_BAR: 'DELETE_BAR',
  
  // レビュー関連
  ADD_REVIEW: 'ADD_REVIEW',
  UPDATE_REVIEW: 'UPDATE_REVIEW',
  ADD_REVIEW_REPLY: 'ADD_REVIEW_REPLY',
  
  // UI関連
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // 課金関連
  SET_SUBSCRIPTION: 'SET_SUBSCRIPTION',
  SET_BILLING_LOADING: 'SET_BILLING_LOADING',
  UPDATE_SUBSCRIPTION: 'UPDATE_SUBSCRIPTION'
};

// リデューサー
function appReducer(state, action) {
  switch (action.type) {
    // ユーザー関連
    case ACTIONS.SET_USER_MODE:
      return {
        ...state,
        userMode: action.payload,
        currentScreen: 'home'
      };
    
    case ACTIONS.SET_CURRENT_SCREEN:
      return {
        ...state,
        currentScreen: action.payload
      };
    
    case ACTIONS.SET_SELECTED_BAR:
      return {
        ...state,
        selectedBar: action.payload
      };
    
    // お気に入り関連
    case ACTIONS.TOGGLE_FAVORITE:
      const barId = action.payload;
      const newFavorites = state.favorites.includes(barId)
        ? state.favorites.filter(id => id !== barId)
        : [...state.favorites, barId];
      
      return {
        ...state,
        favorites: newFavorites
      };
    
    case ACTIONS.SET_FAVORITES:
      return {
        ...state,
        favorites: action.payload
      };
    
    // クーポン関連
    case ACTIONS.ADD_COUPON:
      return {
        ...state,
        coupons: [action.payload, ...state.coupons],
        myCoupons: [action.payload, ...state.myCoupons]
      };
    
    case ACTIONS.UPDATE_COUPON:
      const updatedCoupons = state.coupons.map(coupon =>
        coupon.id === action.payload.id ? { ...coupon, ...action.payload } : coupon
      );
      const updatedMyCoupons = state.myCoupons.map(coupon =>
        coupon.id === action.payload.id ? { ...coupon, ...action.payload } : coupon
      );
      
      return {
        ...state,
        coupons: updatedCoupons,
        myCoupons: updatedMyCoupons
      };
    
    case ACTIONS.DELETE_COUPON:
      return {
        ...state,
        coupons: state.coupons.filter(coupon => coupon.id !== action.payload),
        myCoupons: state.myCoupons.filter(coupon => coupon.id !== action.payload)
      };
    
    case ACTIONS.USE_COUPON:
      const { couponId, userId } = action.payload;
      const newUserCoupon = {
        id: `user_coupon_${Date.now()}`,
        couponId,
        userId,
        barId: state.coupons.find(c => c.id === couponId)?.barId,
        usedAt: new Date().toISOString(),
        isUsed: true
      };
      
      return {
        ...state,
        userCoupons: [...state.userCoupons, newUserCoupon]
      };
    
    // 通知関連
    case ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    
    case ACTIONS.MARK_NOTIFICATION_READ:
      const updatedNotifications = state.notifications.map(notification =>
        notification.id === action.payload
          ? { ...notification, isRead: true }
          : notification
      );
      
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    
    case ACTIONS.DELETE_NOTIFICATION:
      const filteredNotifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
      
      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount: filteredNotifications.filter(n => !n.isRead).length
      };
    
    case ACTIONS.CLEAR_ALL_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
        unreadCount: 0
      };
    
    case ACTIONS.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.isRead).length
      };
    
    // 店舗関連
    case ACTIONS.ADD_BAR:
      return {
        ...state,
        bars: [action.payload, ...state.bars],
        myBars: [action.payload, ...state.myBars]
      };
    
    case ACTIONS.UPDATE_BAR:
      const updatedBars = state.bars.map(bar =>
        bar.id === action.payload.id ? { ...bar, ...action.payload } : bar
      );
      const updatedMyBars = state.myBars.map(bar =>
        bar.id === action.payload.id ? { ...bar, ...action.payload } : bar
      );
      
      return {
        ...state,
        bars: updatedBars,
        myBars: updatedMyBars
      };
    
    case ACTIONS.DELETE_BAR:
      return {
        ...state,
        bars: state.bars.filter(bar => bar.id !== action.payload),
        myBars: state.myBars.filter(bar => bar.id !== action.payload)
      };
    
    // レビュー関連
    case ACTIONS.ADD_REVIEW:
      return {
        ...state,
        reviews: [action.payload, ...state.reviews]
      };
    
    case ACTIONS.UPDATE_REVIEW:
      return {
        ...state,
        reviews: state.reviews.map(review =>
          review.id === action.payload.id ? { ...review, ...action.payload } : review
        )
      };
    
    case ACTIONS.ADD_REVIEW_REPLY:
      return {
        ...state,
        reviews: state.reviews.map(review =>
          review.id === action.payload.reviewId
            ? { ...review, ownerReply: action.payload.reply }
            : review
        )
      };
    
    // UI関連
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };
    
    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    // 課金関連
    case ACTIONS.SET_SUBSCRIPTION:
      return {
        ...state,
        subscription: action.payload
      };
    
    case ACTIONS.SET_BILLING_LOADING:
      return {
        ...state,
        billingLoading: action.payload
      };
    
    case ACTIONS.UPDATE_SUBSCRIPTION:
      return {
        ...state,
        subscription: { ...state.subscription, ...action.payload }
      };
    
    default:
      return state;
  }
}

// Context作成
const AppContext = createContext();

// Provider コンポーネント
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 通知サービスと課金サービスの初期化
  useEffect(() => {
    notificationService.initialize();
    billingService.initialize();
    loadNotifications();
    loadSubscriptionData();
  }, []);

  // 通知の読み込み
  const loadNotifications = () => {
    const notifications = notificationService.getNotifications();
    dispatch({ type: ACTIONS.SET_NOTIFICATIONS, payload: notifications });
  };

  // 課金情報の読み込み
  const loadSubscriptionData = () => {
    const subscription = billingService.getCurrentSubscription();
    dispatch({ type: ACTIONS.SET_SUBSCRIPTION, payload: subscription });
  };

  // アクション関数
  const actions = {
    // ユーザー関連
    setUserMode: (mode) => dispatch({ type: ACTIONS.SET_USER_MODE, payload: mode }),
    setCurrentScreen: (screen) => dispatch({ type: ACTIONS.SET_CURRENT_SCREEN, payload: screen }),
    setSelectedBar: (bar) => dispatch({ type: ACTIONS.SET_SELECTED_BAR, payload: bar }),
    
    // お気に入り関連
    toggleFavorite: (barId) => dispatch({ type: ACTIONS.TOGGLE_FAVORITE, payload: barId }),
    setFavorites: (favorites) => dispatch({ type: ACTIONS.SET_FAVORITES, payload: favorites }),
    
    // クーポン関連
    addCoupon: (coupon) => dispatch({ type: ACTIONS.ADD_COUPON, payload: coupon }),
    updateCoupon: (coupon) => dispatch({ type: ACTIONS.UPDATE_COUPON, payload: coupon }),
    deleteCoupon: (couponId) => dispatch({ type: ACTIONS.DELETE_COUPON, payload: couponId }),
    useCoupon: (couponId, userId) => dispatch({ type: ACTIONS.USE_COUPON, payload: { couponId, userId } }),
    
    // 通知関連
    addNotification: (notification) => dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: notification }),
    markNotificationRead: (notificationId) => dispatch({ type: ACTIONS.MARK_NOTIFICATION_READ, payload: notificationId }),
    deleteNotification: (notificationId) => dispatch({ type: ACTIONS.DELETE_NOTIFICATION, payload: notificationId }),
    clearAllNotifications: () => dispatch({ type: ACTIONS.CLEAR_ALL_NOTIFICATIONS }),
    
    // 店舗関連
    addBar: (bar) => dispatch({ type: ACTIONS.ADD_BAR, payload: bar }),
    updateBar: (bar) => dispatch({ type: ACTIONS.UPDATE_BAR, payload: bar }),
    deleteBar: (barId) => dispatch({ type: ACTIONS.DELETE_BAR, payload: barId }),
    
    // レビュー関連
    addReview: (review) => dispatch({ type: ACTIONS.ADD_REVIEW, payload: review }),
    updateReview: (review) => dispatch({ type: ACTIONS.UPDATE_REVIEW, payload: review }),
    addReviewReply: (reviewId, reply) => dispatch({ type: ACTIONS.ADD_REVIEW_REPLY, payload: { reviewId, reply } }),
    
    // UI関連
    setLoading: (loading) => dispatch({ type: ACTIONS.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ACTIONS.SET_ERROR, payload: error }),
    clearError: () => dispatch({ type: ACTIONS.CLEAR_ERROR }),
    
    // 課金関連
    setSubscription: (subscription) => dispatch({ type: ACTIONS.SET_SUBSCRIPTION, payload: subscription }),
    setBillingLoading: (loading) => dispatch({ type: ACTIONS.SET_BILLING_LOADING, payload: loading }),
    updateSubscription: (subscription) => dispatch({ type: ACTIONS.UPDATE_SUBSCRIPTION, payload: subscription })
  };

  // セレクター関数
  const selectors = {
    // お気に入り関連
    isFavorite: (barId) => state.favorites.includes(barId),
    getFavoriteBars: () => state.bars.filter(bar => state.favorites.includes(bar.id)),
    
    // クーポン関連
    getCouponsByBar: (barId) => state.coupons.filter(coupon => coupon.barId === barId),
    getUserCoupons: () => state.userCoupons,
    getUsedCoupons: () => state.userCoupons.filter(uc => uc.isUsed),
    getAvailableCoupons: () => state.userCoupons.filter(uc => !uc.isUsed),
    
    // 通知関連
    getUnreadNotifications: () => state.notifications.filter(n => !n.isRead),
    getNotificationsByType: (type) => state.notifications.filter(n => n.type === type),
    
    // 店舗関連
    getBarById: (barId) => state.bars.find(bar => bar.id === barId),
    getMyBars: () => state.myBars,
    getApprovedBars: () => state.myBars.filter(bar => bar.status === 'approved'),
    
    // レビュー関連
    getReviewsByBar: (barId) => state.reviews.filter(review => review.barId === barId),
    getPendingReplies: () => state.reviews.filter(review => !review.ownerReply),
    
    // 統計関連
    getAverageRating: (barId) => {
      const barReviews = state.reviews.filter(review => review.barId === barId);
      return barReviews.length > 0 
        ? barReviews.reduce((sum, review) => sum + review.rating, 0) / barReviews.length 
        : 0;
    },
    getTotalReviews: (barId) => state.reviews.filter(review => review.barId === barId).length,
    
    // 課金関連
    getCurrentSubscription: () => state.subscription,
    canUseFeature: (featureKey) => billingService.hasFeatureAccess(featureKey),
    canUseCouponManagement: () => billingService.canUseCouponManagement(),
    canUsePushNotifications: () => billingService.canUsePushNotifications(),
    isSubscriptionActive: () => billingService.isSubscriptionActive()
  };

  const value = {
    state,
    actions,
    selectors
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// カスタムフック
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// 特定の状態のみを取得するカスタムフック
export function useUserMode() {
  const { state, actions } = useApp();
  return { userMode: state.userMode, setUserMode: actions.setUserMode };
}

export function useFavorites() {
  const { state, actions, selectors } = useApp();
  return {
    favorites: state.favorites,
    toggleFavorite: actions.toggleFavorite,
    isFavorite: selectors.isFavorite,
    getFavoriteBars: selectors.getFavoriteBars
  };
}

export function useCoupons() {
  const { state, actions, selectors } = useApp();
  return {
    coupons: state.coupons,
    userCoupons: state.userCoupons,
    addCoupon: actions.addCoupon,
    updateCoupon: actions.updateCoupon,
    deleteCoupon: actions.deleteCoupon,
    useCoupon: actions.useCoupon,
    getCouponsByBar: selectors.getCouponsByBar,
    getUserCoupons: selectors.getUserCoupons,
    getUsedCoupons: selectors.getUsedCoupons,
    getAvailableCoupons: selectors.getAvailableCoupons
  };
}

export function useNotifications() {
  const { state, actions, selectors } = useApp();
  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    addNotification: actions.addNotification,
    markNotificationRead: actions.markNotificationRead,
    deleteNotification: actions.deleteNotification,
    clearAllNotifications: actions.clearAllNotifications,
    getUnreadNotifications: selectors.getUnreadNotifications,
    getNotificationsByType: selectors.getNotificationsByType
  };
}

export function useBars() {
  const { state, actions, selectors } = useApp();
  return {
    bars: state.bars,
    myBars: state.myBars,
    addBar: actions.addBar,
    updateBar: actions.updateBar,
    deleteBar: actions.deleteBar,
    getBarById: selectors.getBarById,
    getMyBars: selectors.getMyBars,
    getApprovedBars: selectors.getApprovedBars
  };
}

export function useReviews() {
  const { state, actions, selectors } = useApp();
  return {
    reviews: state.reviews,
    addReview: actions.addReview,
    updateReview: actions.updateReview,
    addReviewReply: actions.addReviewReply,
    getReviewsByBar: selectors.getReviewsByBar,
    getPendingReplies: selectors.getPendingReplies
  };
}

export function useBilling() {
  const { state, actions, selectors } = useApp();
  return {
    subscription: state.subscription,
    billingLoading: state.billingLoading,
    setSubscription: actions.setSubscription,
    setBillingLoading: actions.setBillingLoading,
    updateSubscription: actions.updateSubscription,
    getCurrentSubscription: selectors.getCurrentSubscription,
    canUseFeature: selectors.canUseFeature,
    canUseCouponManagement: selectors.canUseCouponManagement,
    canUsePushNotifications: selectors.canUsePushNotifications,
    isSubscriptionActive: selectors.isSubscriptionActive
  };
} 