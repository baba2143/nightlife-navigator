// 基本的な型定義
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'owner' | 'admin';
  status: 'active' | 'suspended' | 'banned';
  createdAt: string;
  lastLogin?: string;
}

export interface Bar {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  genre: string;
  priceRange: 'low' | 'medium' | 'high';
  rating: number;
  reviewCount: number;
  image: string;
  latitude: number;
  longitude: number;
  features: string[];
  hours: {
    [key: string]: string;
  };
  status: 'active' | 'pending' | 'suspended';
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  barId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  reply?: {
    id: string;
    ownerId: string;
    ownerName: string;
    comment: string;
    createdAt: string;
  };
}

export interface Coupon {
  id: string;
  barId: string;
  barName: string;
  title: string;
  description: string;
  type: 'store' | 'rainy' | 'time_sale' | 'first_time' | 'birthday' | 'repeater';
  discount: {
    type: 'percentage' | 'fixed' | 'free';
    value: number;
  };
  conditions: string[];
  validFrom: string;
  validTo: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'coupon' | 'system' | 'promotion';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  startDate: string;
  endDate: string;
  trialEndDate?: string;
  autoRenew: boolean;
  price: number;
  currency: string;
  isTrial: boolean;
  grantedBy?: string;
  grantedAt?: string;
  isAdminGranted?: boolean;
  reason?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number; // 日数
  trialDays: number;
  features: string[];
  maxCoupons: number;
  maxNotifications: number;
}

export interface Admin {
  id: string;
  username: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: string[];
  lastLogin?: string;
  createdAt: string;
}

export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'support';

export interface AdminAction {
  id: string;
  adminId: string;
  action: string;
  targetType: 'user' | 'bar' | 'review' | 'coupon' | 'subscription';
  targetId: string;
  details: any;
  createdAt: string;
}

// アプリケーション状態
export interface AppState {
  user: User | null;
  userMode: 'user' | 'owner';
  currentScreen: string;
  bars: Bar[];
  favorites: string[];
  coupons: Coupon[];
  notifications: Notification[];
  reviews: Review[];
  subscriptions: Subscription[];
  selectedBar: Bar | null;
  loading: boolean;
  error: string | null;
}

// アクション型
export type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_USER_MODE'; payload: 'user' | 'owner' }
  | { type: 'SET_CURRENT_SCREEN'; payload: string }
  | { type: 'SET_BARS'; payload: Bar[] }
  | { type: 'ADD_BAR'; payload: Bar }
  | { type: 'UPDATE_BAR'; payload: Bar }
  | { type: 'SET_FAVORITES'; payload: string[] }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'SET_COUPONS'; payload: Coupon[] }
  | { type: 'ADD_COUPON'; payload: Coupon }
  | { type: 'UPDATE_COUPON'; payload: Coupon }
  | { type: 'USE_COUPON'; payload: { couponId: string; userId: string } }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'SET_REVIEWS'; payload: Review[] }
  | { type: 'ADD_REVIEW'; payload: Review }
  | { type: 'SET_SUBSCRIPTIONS'; payload: Subscription[] }
  | { type: 'SET_SELECTED_BAR'; payload: Bar | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// API レスポンス型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// フィルター・ソート型
export interface BarFilters {
  genre?: string;
  priceRange?: string;
  rating?: number;
  features?: string[];
  search?: string;
}

export interface CouponFilters {
  type?: string;
  barId?: string;
  isActive?: boolean;
  search?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// フォーム型
export interface LoginForm {
  username: string;
  password: string;
}

export interface BarRegistrationForm {
  name: string;
  description: string;
  address: string;
  phone: string;
  genre: string;
  priceRange: string;
  features: string[];
  hours: { [key: string]: string };
}

export interface ReviewForm {
  rating: number;
  comment: string;
  images?: string[];
}

export interface CouponForm {
  title: string;
  description: string;
  type: string;
  discountType: string;
  discountValue: number;
  conditions: string[];
  validFrom: string;
  validTo: string;
  usageLimit: number;
}

// ナビゲーション型
export interface NavigationProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
    setParams: (params: any) => void;
  };
  route: {
    params?: any;
  };
}

// コンポーネント Props 型
export interface BarCardProps {
  bar: Bar;
  isFavorite: boolean;
  onPress: (bar: Bar) => void;
  onToggleFavorite: (barId: string) => void;
}

export interface CouponCardProps {
  coupon: Coupon;
  onPress: (coupon: Coupon) => void;
  onUse: (coupon: Coupon) => void;
}

export interface TabNavigationProps {
  currentTab: string;
  onTabPress: (tab: string) => void;
}

// サービス型
export interface AuthService {
  login: (credentials: LoginForm) => Promise<ApiResponse<User>>;
  logout: () => Promise<ApiResponse<void>>;
  getCurrentUser: () => User | null;
  isAuthenticated: () => boolean;
}

export interface BarService {
  getBars: (filters?: BarFilters) => Promise<ApiResponse<Bar[]>>;
  getBar: (id: string) => Promise<ApiResponse<Bar>>;
  createBar: (data: BarRegistrationForm) => Promise<ApiResponse<Bar>>;
  updateBar: (id: string, data: Partial<Bar>) => Promise<ApiResponse<Bar>>;
  deleteBar: (id: string) => Promise<ApiResponse<void>>;
}

export interface CouponService {
  getCoupons: (filters?: CouponFilters) => Promise<ApiResponse<Coupon[]>>;
  createCoupon: (data: CouponForm) => Promise<ApiResponse<Coupon>>;
  updateCoupon: (id: string, data: Partial<Coupon>) => Promise<ApiResponse<Coupon>>;
  deleteCoupon: (id: string) => Promise<ApiResponse<void>>;
  useCoupon: (couponId: string, userId: string) => Promise<ApiResponse<void>>;
}

export interface NotificationService {
  getNotifications: (userId: string) => Promise<ApiResponse<Notification[]>>;
  markAsRead: (notificationId: string) => Promise<ApiResponse<void>>;
  deleteNotification: (notificationId: string) => Promise<ApiResponse<void>>;
  sendNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<ApiResponse<Notification>>;
}

export interface BillingService {
  getPlans: () => Promise<ApiResponse<SubscriptionPlan[]>>;
  purchasePlan: (planId: string, userId: string) => Promise<ApiResponse<Subscription>>;
  cancelSubscription: (subscriptionId: string) => Promise<ApiResponse<void>>;
  getSubscription: (userId: string) => Promise<ApiResponse<Subscription | null>>;
  hasFeatureAccess: (userId: string, feature: string) => Promise<ApiResponse<boolean>>;
}

export interface AdminService {
  login: (credentials: LoginForm) => Promise<ApiResponse<Admin>>;
  logout: () => Promise<ApiResponse<void>>;
  getCurrentAdmin: () => Admin | null;
  hasPermission: (permission: string) => boolean;
  getUsers: (filters?: any) => Promise<ApiResponse<User[]>>;
  updateUserStatus: (userId: string, status: string) => Promise<ApiResponse<void>>;
  getBars: (filters?: any) => Promise<ApiResponse<Bar[]>>;
  approveBar: (barId: string) => Promise<ApiResponse<void>>;
  rejectBar: (barId: string, reason: string) => Promise<ApiResponse<void>>;
  grantSubscription: (userId: string, planId: string, duration: number, reason: string) => Promise<ApiResponse<Subscription>>;
  revokeSubscription: (subscriptionId: string, reason: string) => Promise<ApiResponse<void>>;
} 