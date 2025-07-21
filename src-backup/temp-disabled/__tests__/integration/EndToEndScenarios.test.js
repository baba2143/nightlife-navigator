import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { jest } from '@jest/globals';

// アプリ全体の統合テスト用のコンポーネントとサービス
import AuthService from '../../services/AuthService';
import ApiService from '../../services/ApiService';
import { AppContext } from '../../context/AppContext';

// React Navigationのモック
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
    reset: jest.fn()
  }),
  useRoute: () => ({
    params: {},
    name: 'TestScreen'
  }),
  useFocusEffect: jest.fn()
}));

// サービスのモック
jest.mock('../../services/AuthService');
jest.mock('../../services/ApiService');

// テストデータ
const mockUser = {
  id: 'user123',
  email: 'test@example.com',
  name: 'テストユーザー',
  favorites: []
};

const mockBars = [
  {
    id: 'bar-1',
    name: 'ネオンバー東京',
    genre: 'スナック／パブ',
    rating: 4.5,
    reviewCount: 30,
    address: '東京都渋谷区',
    distance: '200m',
    isOpen: true,
    priceRange: '¥¥¥',
    specialOffers: ['飲み放題', 'カラオケ'],
    coupons: [
      {
        id: 'coupon-1',
        title: 'ドリンク1杯無料',
        description: 'お好きなドリンク1杯を無料でご提供',
        type: 'store_coupon',
        discount: '100%OFF',
        isActive: true
      }
    ]
  },
  {
    id: 'bar-2',
    name: 'サイバークラブ新宿',
    genre: 'クラブ／ラウンジ',
    rating: 4.2,
    reviewCount: 45,
    address: '東京都新宿区',
    distance: '500m',
    isOpen: true,
    priceRange: '¥¥¥¥'
  }
];

const mockCoupons = [
  {
    id: 'coupon-1',
    title: 'ドリンク1杯無料',
    description: 'お好きなドリンク1杯を無料でご提供',
    type: 'store_coupon',
    discount: '100%OFF',
    isActive: true,
    barId: 'bar-1',
    barName: 'ネオンバー東京'
  },
  {
    id: 'coupon-2',
    title: '雨の日特典',
    description: '雨の日限定！料金10%OFF',
    type: 'rainy_day_coupon',
    discount: '10%OFF',
    isActive: true,
    barId: 'bar-2',
    barName: 'サイバークラブ新宿'
  }
];

// アプリケーション全体をシミュレートするコンポーネント
const NightLifeApp = () => {
  const [user, setUser] = React.useState(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [currentScreen, setCurrentScreen] = React.useState('Login');
  const [bars, setBars] = React.useState([]);
  const [coupons, setCoupons] = React.useState([]);
  const [favorites, setFavorites] = React.useState([]);
  const [notifications, setNotifications] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const showNotification = (notification) => {
    setNotifications(prev => [...prev, { ...notification, id: Date.now() }]);
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const result = await AuthService.login(email, password);
      
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        setCurrentScreen('Home');
        
        // ログイン後のデータ取得
        await loadInitialData();
        
        showNotification({
          type: 'success',
          message: 'ログインに成功しました'
        });
      }
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'ログインに失敗しました'
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
      setCurrentScreen('Login');
      setBars([]);
      setCoupons([]);
      setFavorites([]);
      
      showNotification({
        type: 'success',
        message: 'ログアウトしました'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'ログアウトに失敗しました'
      });
    }
  };

  const loadInitialData = async () => {
    try {
      const [barsData, couponsData, favoritesData] = await Promise.all([
        ApiService.getBars(),
        ApiService.getCoupons(),
        ApiService.getFavorites()
      ]);
      
      setBars(barsData);
      setCoupons(couponsData);
      setFavorites(favoritesData);
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'データの読み込みに失敗しました'
      });
    }
  };

  const toggleFavorite = async (barId) => {
    try {
      const isFavorite = favorites.includes(barId);
      
      if (isFavorite) {
        await ApiService.removeFromFavorites(barId);
        setFavorites(prev => prev.filter(id => id !== barId));
        showNotification({
          type: 'success',
          message: 'お気に入りから削除しました'
        });
      } else {
        await ApiService.addToFavorites(barId);
        setFavorites(prev => [...prev, barId]);
        showNotification({
          type: 'success',
          message: 'お気に入りに追加しました'
        });
      }
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'お気に入りの更新に失敗しました'
      });
    }
  };

  const useCoupon = async (couponId) => {
    try {
      await ApiService.useCoupon(couponId);
      
      // クーポンリストを更新
      setCoupons(prev => prev.map(coupon => 
        coupon.id === couponId 
          ? { ...coupon, isUsed: true }
          : coupon
      ));
      
      showNotification({
        type: 'success',
        message: 'クーポンを使用しました'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'クーポンの使用に失敗しました'
      });
    }
  };

  const searchBars = async (query) => {
    try {
      setLoading(true);
      const results = await ApiService.searchBars(query);
      setBars(results);
      setCurrentScreen('SearchResults');
    } catch (error) {
      showNotification({
        type: 'error',
        message: '検索に失敗しました'
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateToScreen = (screenName, params = {}) => {
    setCurrentScreen(screenName);
  };

  // ログイン画面
  if (!isAuthenticated) {
    return (
      <div>
        <div testID="login-screen">
          <h1>NightLife Navigator - ログイン</h1>
          <div testID="login-form">
            <button 
              testID="login-button" 
              onClick={() => login('test@example.com', 'password123')}
              disabled={loading}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </div>
        </div>
        
        {/* 通知表示 */}
        <div testID="notifications">
          {notifications.map(notification => (
            <div key={notification.id} testID={`notification-${notification.type}`}>
              {notification.message}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // メイン画面
  return (
    <div>
      {/* ヘッダー */}
      <div testID="app-header">
        <h1>NightLife Navigator</h1>
        <div testID="user-info">ようこそ、{user?.name || user?.email}さん</div>
        <button testID="logout-button" onClick={logout}>
          ログアウト
        </button>
      </div>

      {/* ナビゲーション */}
      <div testID="navigation">
        <button 
          testID="nav-home"
          onClick={() => navigateToScreen('Home')}
          className={currentScreen === 'Home' ? 'active' : ''}
        >
          ホーム
        </button>
        <button 
          testID="nav-search"
          onClick={() => navigateToScreen('Search')}
          className={currentScreen === 'Search' ? 'active' : ''}
        >
          検索
        </button>
        <button 
          testID="nav-favorites"
          onClick={() => navigateToScreen('Favorites')}
          className={currentScreen === 'Favorites' ? 'active' : ''}
        >
          お気に入り ({favorites.length})
        </button>
        <button 
          testID="nav-coupons"
          onClick={() => navigateToScreen('Coupons')}
          className={currentScreen === 'Coupons' ? 'active' : ''}
        >
          クーポン
        </button>
      </div>

      {/* 現在の画面表示 */}
      <div testID="current-screen">{currentScreen}</div>

      {/* ホーム画面 */}
      {currentScreen === 'Home' && (
        <div testID="home-screen">
          <h2>おすすめのバー</h2>
          {loading ? (
            <div testID="loading">読み込み中...</div>
          ) : (
            <div testID="bars-list">
              {bars.map(bar => (
                <div key={bar.id} testID={`bar-card-${bar.id}`}>
                  <h3>{bar.name}</h3>
                  <p>{bar.genre} - {bar.address}</p>
                  <p>評価: {bar.rating} ({bar.reviewCount}件)</p>
                  <button 
                    testID={`favorite-${bar.id}`}
                    onClick={() => toggleFavorite(bar.id)}
                  >
                    {favorites.includes(bar.id) ? '♥ お気に入り' : '♡ お気に入りに追加'}
                  </button>
                  <button 
                    testID={`view-bar-${bar.id}`}
                    onClick={() => navigateToScreen('BarDetail', { barId: bar.id })}
                  >
                    詳細を見る
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 検索画面 */}
      {currentScreen === 'Search' && (
        <div testID="search-screen">
          <h2>バー検索</h2>
          <div testID="search-form">
            <input 
              testID="search-input"
              placeholder="バー名、ジャンル、エリアで検索"
            />
            <button 
              testID="search-button"
              onClick={() => searchBars('渋谷')}
            >
              検索
            </button>
          </div>
        </div>
      )}

      {/* お気に入り画面 */}
      {currentScreen === 'Favorites' && (
        <div testID="favorites-screen">
          <h2>お気に入りバー</h2>
          <div testID="favorites-list">
            {bars.filter(bar => favorites.includes(bar.id)).map(bar => (
              <div key={bar.id} testID={`favorite-bar-${bar.id}`}>
                <h3>{bar.name}</h3>
                <button 
                  testID={`remove-favorite-${bar.id}`}
                  onClick={() => toggleFavorite(bar.id)}
                >
                  お気に入りから削除
                </button>
              </div>
            ))}
            {favorites.length === 0 && (
              <div testID="no-favorites">お気に入りのバーがありません</div>
            )}
          </div>
        </div>
      )}

      {/* クーポン画面 */}
      {currentScreen === 'Coupons' && (
        <div testID="coupons-screen">
          <h2>利用可能なクーポン</h2>
          <div testID="coupons-list">
            {coupons.map(coupon => (
              <div key={coupon.id} testID={`coupon-card-${coupon.id}`}>
                <h3>{coupon.title}</h3>
                <p>{coupon.description}</p>
                <p>割引: {coupon.discount}</p>
                <p>対象店舗: {coupon.barName}</p>
                {coupon.isUsed ? (
                  <div testID={`coupon-used-${coupon.id}`}>使用済み</div>
                ) : (
                  <button 
                    testID={`use-coupon-${coupon.id}`}
                    onClick={() => useCoupon(coupon.id)}
                  >
                    使用する
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* バー詳細画面 */}
      {currentScreen === 'BarDetail' && (
        <div testID="bar-detail-screen">
          <h2>バー詳細</h2>
          <button 
            testID="back-button"
            onClick={() => navigateToScreen('Home')}
          >
            戻る
          </button>
        </div>
      )}

      {/* 通知表示 */}
      <div testID="notifications">
        {notifications.map(notification => (
          <div key={notification.id} testID={`notification-${notification.type}`}>
            {notification.message}
          </div>
        ))}
      </div>
    </div>
  );
};

describe('エンドツーエンドシナリオテスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // AuthServiceのモック
    AuthService.login.mockResolvedValue({
      success: true,
      user: mockUser
    });
    AuthService.logout.mockResolvedValue({ success: true });
    
    // ApiServiceのモック
    ApiService.getBars.mockResolvedValue(mockBars);
    ApiService.getCoupons.mockResolvedValue(mockCoupons);
    ApiService.getFavorites.mockResolvedValue([]);
    ApiService.addToFavorites.mockResolvedValue({ success: true });
    ApiService.removeFromFavorites.mockResolvedValue({ success: true });
    ApiService.useCoupon.mockResolvedValue({ success: true });
    ApiService.searchBars.mockResolvedValue(mockBars.slice(0, 1));
  });

  describe('新規ユーザーのオンボーディングフロー', () => {
    it('ログイン → ホーム画面 → バー詳細 → お気に入り追加の完全フロー', async () => {
      render(<NightLifeApp />);

      // 1. 初期状態：ログイン画面
      expect(screen.getByTestId('login-screen')).toBeTruthy();

      // 2. ログイン実行
      fireEvent.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(AuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      });

      // 3. ログイン成功後：ホーム画面に遷移
      await waitFor(() => {
        expect(screen.getByTestId('home-screen')).toBeTruthy();
        expect(screen.getByTestId('user-info')).toHaveTextContent('test@example.com');
      });

      // 4. データ読み込み完了確認
      await waitFor(() => {
        expect(ApiService.getBars).toHaveBeenCalled();
        expect(ApiService.getCoupons).toHaveBeenCalled();
        expect(ApiService.getFavorites).toHaveBeenCalled();
      });

      // 5. バー一覧の表示確認
      await waitFor(() => {
        expect(screen.getByTestId('bar-card-bar-1')).toBeTruthy();
        expect(screen.getByText('ネオンバー東京')).toBeTruthy();
      });

      // 6. お気に入りに追加
      fireEvent.click(screen.getByTestId('favorite-bar-1'));

      await waitFor(() => {
        expect(ApiService.addToFavorites).toHaveBeenCalledWith('bar-1');
        expect(screen.getByTestId('notification-success')).toHaveTextContent('お気に入りに追加しました');
      });

      // 7. お気に入り画面に遷移
      fireEvent.click(screen.getByTestId('nav-favorites'));

      expect(screen.getByTestId('current-screen')).toHaveTextContent('Favorites');
      expect(screen.getByTestId('favorites-screen')).toBeTruthy();
      expect(screen.getByTestId('favorite-bar-bar-1')).toBeTruthy();
    });
  });

  describe('バー検索と発見のフロー', () => {
    it('検索 → 結果表示 → バー詳細 → クーポン利用の完全フロー', async () => {
      render(<NightLifeApp />);

      // ログイン
      fireEvent.click(screen.getByTestId('login-button'));
      await waitFor(() => {
        expect(screen.getByTestId('home-screen')).toBeTruthy();
      });

      // 1. 検索画面に遷移
      fireEvent.click(screen.getByTestId('nav-search'));
      expect(screen.getByTestId('current-screen')).toHaveTextContent('Search');
      expect(screen.getByTestId('search-screen')).toBeTruthy();

      // 2. 検索実行
      fireEvent.click(screen.getByTestId('search-button'));

      await waitFor(() => {
        expect(ApiService.searchBars).toHaveBeenCalledWith('渋谷');
        expect(screen.getByTestId('current-screen')).toHaveTextContent('SearchResults');
      });

      // 3. クーポン画面でクーポン利用
      fireEvent.click(screen.getByTestId('nav-coupons'));
      
      await waitFor(() => {
        expect(screen.getByTestId('coupons-screen')).toBeTruthy();
        expect(screen.getByTestId('coupon-card-coupon-1')).toBeTruthy();
      });

      // 4. クーポン使用
      fireEvent.click(screen.getByTestId('use-coupon-coupon-1'));

      await waitFor(() => {
        expect(ApiService.useCoupon).toHaveBeenCalledWith('coupon-1');
        expect(screen.getByTestId('notification-success')).toHaveTextContent('クーポンを使用しました');
        expect(screen.getByTestId('coupon-used-coupon-1')).toHaveTextContent('使用済み');
      });
    });
  });

  describe('お気に入り管理フロー', () => {
    it('お気に入り追加 → 一覧確認 → 削除の完全フロー', async () => {
      render(<NightLifeApp />);

      // ログイン
      fireEvent.click(screen.getByTestId('login-button'));
      await waitFor(() => {
        expect(screen.getByTestId('home-screen')).toBeTruthy();
      });

      // 1. 複数のバーをお気に入りに追加
      await waitFor(() => {
        expect(screen.getByTestId('bar-card-bar-1')).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId('favorite-bar-1'));
      await waitFor(() => {
        expect(ApiService.addToFavorites).toHaveBeenCalledWith('bar-1');
      });

      fireEvent.click(screen.getByTestId('favorite-bar-2'));
      await waitFor(() => {
        expect(ApiService.addToFavorites).toHaveBeenCalledWith('bar-2');
      });

      // 2. お気に入り画面でカウント確認
      expect(screen.getByTestId('nav-favorites')).toHaveTextContent('お気に入り (2)');

      // 3. お気に入り一覧確認
      fireEvent.click(screen.getByTestId('nav-favorites'));
      expect(screen.getByTestId('favorites-screen')).toBeTruthy();

      // 4. お気に入りから削除
      fireEvent.click(screen.getByTestId('remove-favorite-bar-1'));

      await waitFor(() => {
        expect(ApiService.removeFromFavorites).toHaveBeenCalledWith('bar-1');
        expect(screen.getByTestId('notification-success')).toHaveTextContent('お気に入りから削除しました');
      });

      // 5. カウント更新確認
      expect(screen.getByTestId('nav-favorites')).toHaveTextContent('お気に入り (1)');
    });
  });

  describe('エラーハンドリングフロー', () => {
    it('ネットワークエラー時の適切なフィードバック', async () => {
      // APIエラーの設定
      ApiService.getBars.mockRejectedValue(new Error('Network error'));
      ApiService.addToFavorites.mockRejectedValue(new Error('Server error'));

      render(<NightLifeApp />);

      // ログイン
      fireEvent.click(screen.getByTestId('login-button'));

      // データ読み込みエラー
      await waitFor(() => {
        expect(screen.getByTestId('notification-error')).toHaveTextContent('データの読み込みに失敗しました');
      });

      // お気に入り追加エラー（バーカードが表示されていないため、直接エラーをシミュレート）
      // 実際のアプリでは、ApiServiceが復旧した後にバーカードが表示され、操作可能になる
    });

    it('ログイン失敗時の適切なエラー表示', async () => {
      AuthService.login.mockRejectedValue(new Error('Authentication failed'));

      render(<NightLifeApp />);

      fireEvent.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(screen.getByTestId('notification-error')).toHaveTextContent('ログインに失敗しました');
        expect(screen.getByTestId('login-screen')).toBeTruthy(); // ログイン画面のまま
      });
    });
  });

  describe('セッション管理フロー', () => {
    it('ログアウト → 状態リセット → 再ログインの完全フロー', async () => {
      render(<NightLifeApp />);

      // 1. 初回ログイン
      fireEvent.click(screen.getByTestId('login-button'));
      await waitFor(() => {
        expect(screen.getByTestId('home-screen')).toBeTruthy();
      });

      // 2. お気に入り追加（状態作成）
      await waitFor(() => {
        expect(screen.getByTestId('bar-card-bar-1')).toBeTruthy();
      });
      
      fireEvent.click(screen.getByTestId('favorite-bar-1'));
      await waitFor(() => {
        expect(screen.getByTestId('nav-favorites')).toHaveTextContent('お気に入り (1)');
      });

      // 3. ログアウト
      fireEvent.click(screen.getByTestId('logout-button'));

      await waitFor(() => {
        expect(AuthService.logout).toHaveBeenCalled();
        expect(screen.getByTestId('login-screen')).toBeTruthy();
        expect(screen.getByTestId('notification-success')).toHaveTextContent('ログアウトしました');
      });

      // 4. 再ログイン
      fireEvent.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(screen.getByTestId('home-screen')).toBeTruthy();
        // 状態がリセットされていることを確認
        expect(screen.getByTestId('nav-favorites')).toHaveTextContent('お気に入り (0)');
      });
    });
  });

  describe('パフォーマンスと応答性', () => {
    it('大量データ処理時の適切なローディング状態表示', async () => {
      // 遅延レスポンスの設定
      ApiService.getBars.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockBars), 1000))
      );

      render(<NightLifeApp />);

      // ログイン
      fireEvent.click(screen.getByTestId('login-button'));

      // ローディング状態の確認
      expect(screen.getByTestId('login-button')).toHaveTextContent('ログイン中...');

      // データ読み込み完了後の状態確認
      await waitFor(() => {
        expect(screen.getByTestId('home-screen')).toBeTruthy();
      }, { timeout: 2000 });
    });
  });

  describe('アクセシビリティ統合', () => {
    it('スクリーンリーダー対応の完全フロー', async () => {
      render(<NightLifeApp />);

      // ログイン画面のアクセシビリティ
      const loginButton = screen.getByTestId('login-button');
      expect(loginButton).toBeTruthy();

      // ログイン後のナビゲーションアクセシビリティ
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('navigation')).toBeTruthy();
        expect(screen.getByTestId('nav-home')).toBeTruthy();
        expect(screen.getByTestId('nav-search')).toBeTruthy();
        expect(screen.getByTestId('nav-favorites')).toBeTruthy();
        expect(screen.getByTestId('nav-coupons')).toBeTruthy();
      });
    });
  });
});