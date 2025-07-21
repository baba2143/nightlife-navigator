import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { jest } from '@jest/globals';

// React Navigationのモック
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  createNavigationContainerRef: () => ({
    current: {
      navigate: jest.fn(),
      goBack: jest.fn(),
      reset: jest.fn(),
      getRootState: jest.fn()
    }
  }),
  useFocusEffect: jest.fn(),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn()
  }),
  useRoute: () => ({
    params: {},
    name: 'TestScreen'
  })
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children
  }),
  CardStyleInterpolators: {
    forHorizontalIOS: {}
  }
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children
  })
}));

// サービスのモック
jest.mock('../../services/AuthService');
jest.mock('../../services/ApiService');
jest.mock('../../context/AppContext');

import { useNavigation, useRoute } from '@react-navigation/native';
import AuthService from '../../services/AuthService';
import ApiService from '../../services/ApiService';

// テスト用のナビゲーションコンポーネント
const TestNavigationComponent = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [currentScreen, setCurrentScreen] = React.useState('Home');

  const navigateToScreen = (screenName, params = {}) => {
    setCurrentScreen(screenName);
    navigation.navigate(screenName, params);
  };

  return (
    <div>
      <div testID="current-screen">{currentScreen}</div>
      <button testID="home-button" onClick={() => navigateToScreen('Home')}>
        ホーム
      </button>
      <button testID="search-button" onClick={() => navigateToScreen('Search')}>
        検索
      </button>
      <button testID="favorites-button" onClick={() => navigateToScreen('Favorites')}>
        お気に入り
      </button>
      <button testID="coupons-button" onClick={() => navigateToScreen('Coupons')}>
        クーポン
      </button>
      <button testID="bar-detail-button" onClick={() => navigateToScreen('BarDetail', { barId: 'bar-123' })}>
        バー詳細
      </button>
    </div>
  );
};

// 認証フロー統合コンポーネント
const AuthNavigationFlow = () => {
  const navigation = useNavigation();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [currentScreen, setCurrentScreen] = React.useState('Login');

  const handleLogin = async () => {
    try {
      const result = await AuthService.login('test@example.com', 'password');
      if (result.success) {
        setIsAuthenticated(true);
        setCurrentScreen('Home');
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      setIsAuthenticated(false);
      setCurrentScreen('Login');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div>
      <div testID="auth-screen">{currentScreen}</div>
      <div testID="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      
      {!isAuthenticated ? (
        <button testID="login-button" onClick={handleLogin}>
          ログイン
        </button>
      ) : (
        <div>
          <button testID="logout-button" onClick={handleLogout}>
            ログアウト
          </button>
          <TestNavigationComponent />
        </div>
      )}
    </div>
  );
};

// ディープリンク処理コンポーネント
const DeepLinkHandler = () => {
  const navigation = useNavigation();
  const [lastDeepLink, setLastDeepLink] = React.useState(null);

  const handleDeepLink = (url) => {
    setLastDeepLink(url);
    
    // URLパースのシミュレーション
    if (url.includes('/bar/')) {
      const barId = url.split('/bar/')[1];
      navigation.navigate('BarDetail', { barId });
    } else if (url.includes('/coupon/')) {
      const couponId = url.split('/coupon/')[1];
      navigation.navigate('CouponDetail', { couponId });
    } else if (url.includes('/search')) {
      navigation.navigate('Search');
    }
  };

  return (
    <div>
      <div testID="last-deep-link">{lastDeepLink}</div>
      <button 
        testID="deep-link-bar" 
        onClick={() => handleDeepLink('myapp://bar/bar-123')}
      >
        バーへのディープリンク
      </button>
      <button 
        testID="deep-link-coupon" 
        onClick={() => handleDeepLink('myapp://coupon/coupon-456')}
      >
        クーポンへのディープリンク
      </button>
      <button 
        testID="deep-link-search" 
        onClick={() => handleDeepLink('myapp://search')}
      >
        検索へのディープリンク
      </button>
    </div>
  );
};

// 画面遷移履歴管理コンポーネント
const NavigationHistory = () => {
  const navigation = useNavigation();
  const [history, setHistory] = React.useState(['Home']);

  const navigateWithHistory = (screenName) => {
    setHistory(prev => [...prev, screenName]);
    navigation.navigate(screenName);
  };

  const goBackWithHistory = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      navigation.goBack();
    }
  };

  return (
    <div>
      <div testID="navigation-history">{history.join(' > ')}</div>
      <div testID="can-go-back">{history.length > 1 ? 'true' : 'false'}</div>
      
      <button testID="nav-to-search" onClick={() => navigateWithHistory('Search')}>
        検索画面へ
      </button>
      <button testID="nav-to-bar-detail" onClick={() => navigateWithHistory('BarDetail')}>
        バー詳細へ
      </button>
      <button testID="nav-back" onClick={goBackWithHistory}>
        戻る
      </button>
    </div>
  );
};

describe('ナビゲーション統合テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // AuthServiceのモック
    AuthService.login.mockResolvedValue({
      success: true,
      user: { id: 'user123', email: 'test@example.com' }
    });
    AuthService.logout.mockResolvedValue({ success: true });
    AuthService.getAuthState.mockReturnValue({
      isAuthenticated: false,
      user: null
    });
    
    // ApiServiceのモック
    ApiService.getBarDetails.mockResolvedValue({
      id: 'bar-123',
      name: 'テストバー'
    });
  });

  describe('基本的なナビゲーション', () => {
    it('タブ間のナビゲーションが正常に動作する', () => {
      const mockNavigate = jest.fn();
      useNavigation.mockReturnValue({
        navigate: mockNavigate,
        goBack: jest.fn(),
        setOptions: jest.fn()
      });

      render(<TestNavigationComponent />);

      // 初期画面の確認
      expect(screen.getByTestId('current-screen')).toHaveTextContent('Home');

      // 検索画面への遷移
      fireEvent.click(screen.getByTestId('search-button'));
      expect(mockNavigate).toHaveBeenCalledWith('Search');

      // お気に入り画面への遷移
      fireEvent.click(screen.getByTestId('favorites-button'));
      expect(mockNavigate).toHaveBeenCalledWith('Favorites');

      // クーポン画面への遷移
      fireEvent.click(screen.getByTestId('coupons-button'));
      expect(mockNavigate).toHaveBeenCalledWith('Coupons');
    });

    it('パラメータ付きの画面遷移が正常に動作する', () => {
      const mockNavigate = jest.fn();
      useNavigation.mockReturnValue({
        navigate: mockNavigate,
        goBack: jest.fn(),
        setOptions: jest.fn()
      });

      render(<TestNavigationComponent />);

      // パラメータ付きでバー詳細画面に遷移
      fireEvent.click(screen.getByTestId('bar-detail-button'));
      expect(mockNavigate).toHaveBeenCalledWith('BarDetail', { barId: 'bar-123' });
    });
  });

  describe('認証フローとナビゲーションの統合', () => {
    it('ログイン後のナビゲーション遷移が正常に動作する', async () => {
      const mockNavigate = jest.fn();
      useNavigation.mockReturnValue({
        navigate: mockNavigate,
        goBack: jest.fn(),
        setOptions: jest.fn()
      });

      render(<AuthNavigationFlow />);

      // 初期状態：未認証
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('auth-screen')).toHaveTextContent('Login');

      // ログイン実行
      fireEvent.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(AuthService.login).toHaveBeenCalledWith('test@example.com', 'password');
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('auth-screen')).toHaveTextContent('Home');
        expect(mockNavigate).toHaveBeenCalledWith('Home');
      });
    });

    it('ログアウト後のナビゲーションリセットが動作する', async () => {
      const mockNavigate = jest.fn();
      useNavigation.mockReturnValue({
        navigate: mockNavigate,
        goBack: jest.fn(),
        setOptions: jest.fn()
      });

      // 認証済み状態でレンダリング
      render(<AuthNavigationFlow />);

      // ログイン実行
      fireEvent.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // ログアウト実行
      fireEvent.click(screen.getByTestId('logout-button'));

      await waitFor(() => {
        expect(AuthService.logout).toHaveBeenCalled();
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('auth-screen')).toHaveTextContent('Login');
        expect(mockNavigate).toHaveBeenCalledWith('Login');
      });
    });
  });

  describe('ディープリンクの統合', () => {
    it('バーへのディープリンクが正しく処理される', () => {
      const mockNavigate = jest.fn();
      useNavigation.mockReturnValue({
        navigate: mockNavigate,
        goBack: jest.fn(),
        setOptions: jest.fn()
      });

      render(<DeepLinkHandler />);

      fireEvent.click(screen.getByTestId('deep-link-bar'));

      expect(screen.getByTestId('last-deep-link')).toHaveTextContent('myapp://bar/bar-123');
      expect(mockNavigate).toHaveBeenCalledWith('BarDetail', { barId: 'bar-123' });
    });

    it('クーポンへのディープリンクが正しく処理される', () => {
      const mockNavigate = jest.fn();
      useNavigation.mockReturnValue({
        navigate: mockNavigate,
        goBack: jest.fn(),
        setOptions: jest.fn()
      });

      render(<DeepLinkHandler />);

      fireEvent.click(screen.getByTestId('deep-link-coupon'));

      expect(screen.getByTestId('last-deep-link')).toHaveTextContent('myapp://coupon/coupon-456');
      expect(mockNavigate).toHaveBeenCalledWith('CouponDetail', { couponId: 'coupon-456' });
    });

    it('検索へのディープリンクが正しく処理される', () => {
      const mockNavigate = jest.fn();
      useNavigation.mockReturnValue({
        navigate: mockNavigate,
        goBack: jest.fn(),
        setOptions: jest.fn()
      });

      render(<DeepLinkHandler />);

      fireEvent.click(screen.getByTestId('deep-link-search'));

      expect(screen.getByTestId('last-deep-link')).toHaveTextContent('myapp://search');
      expect(mockNavigate).toHaveBeenCalledWith('Search');
    });
  });

  describe('ナビゲーション履歴の管理', () => {
    it('画面遷移履歴が正しく記録される', () => {
      const mockNavigate = jest.fn();
      const mockGoBack = jest.fn();
      useNavigation.mockReturnValue({
        navigate: mockNavigate,
        goBack: mockGoBack,
        setOptions: jest.fn()
      });

      render(<NavigationHistory />);

      // 初期状態
      expect(screen.getByTestId('navigation-history')).toHaveTextContent('Home');
      expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');

      // 検索画面に遷移
      fireEvent.click(screen.getByTestId('nav-to-search'));
      expect(screen.getByTestId('navigation-history')).toHaveTextContent('Home > Search');
      expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
      expect(mockNavigate).toHaveBeenCalledWith('Search');

      // バー詳細画面に遷移
      fireEvent.click(screen.getByTestId('nav-to-bar-detail'));
      expect(screen.getByTestId('navigation-history')).toHaveTextContent('Home > Search > BarDetail');
      expect(mockNavigate).toHaveBeenCalledWith('BarDetail');

      // 戻る操作
      fireEvent.click(screen.getByTestId('nav-back'));
      expect(screen.getByTestId('navigation-history')).toHaveTextContent('Home > Search');
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('画面間のデータ受け渡し', () => {
    it('検索結果からバー詳細への遷移でパラメータが正しく渡される', () => {
      const mockNavigate = jest.fn();
      useNavigation.mockReturnValue({
        navigate: mockNavigate,
        goBack: jest.fn(),
        setOptions: jest.fn()
      });

      const SearchResultComponent = () => {
        const navigation = useNavigation();
        
        const searchResults = [
          { id: 'bar-1', name: 'テストバー1' },
          { id: 'bar-2', name: 'テストバー2' }
        ];

        return (
          <div>
            {searchResults.map(bar => (
              <button
                key={bar.id}
                testID={`bar-result-${bar.id}`}
                onClick={() => navigation.navigate('BarDetail', {
                  barId: bar.id,
                  barName: bar.name,
                  fromScreen: 'Search'
                })}
              >
                {bar.name}
              </button>
            ))}
          </div>
        );
      };

      render(<SearchResultComponent />);

      fireEvent.click(screen.getByTestId('bar-result-bar-1'));

      expect(mockNavigate).toHaveBeenCalledWith('BarDetail', {
        barId: 'bar-1',
        barName: 'テストバー1',
        fromScreen: 'Search'
      });
    });
  });

  describe('ナビゲーションガードの統合', () => {
    it('未認証ユーザーが保護された画面にアクセスできない', () => {
      const mockNavigate = jest.fn();
      useNavigation.mockReturnValue({
        navigate: mockNavigate,
        goBack: jest.fn(),
        setOptions: jest.fn()
      });

      const ProtectedNavigationComponent = () => {
        const navigation = useNavigation();
        const [isAuthenticated] = React.useState(false);

        const navigateToProtected = (screenName) => {
          if (!isAuthenticated) {
            navigation.navigate('Login', { returnTo: screenName });
          } else {
            navigation.navigate(screenName);
          }
        };

        return (
          <div>
            <button 
              testID="protected-favorites" 
              onClick={() => navigateToProtected('Favorites')}
            >
              お気に入り（要認証）
            </button>
            <button 
              testID="protected-coupons" 
              onClick={() => navigateToProtected('Coupons')}
            >
              クーポン（要認証）
            </button>
          </div>
        );
      };

      render(<ProtectedNavigationComponent />);

      fireEvent.click(screen.getByTestId('protected-favorites'));
      expect(mockNavigate).toHaveBeenCalledWith('Login', { returnTo: 'Favorites' });

      fireEvent.click(screen.getByTestId('protected-coupons'));
      expect(mockNavigate).toHaveBeenCalledWith('Login', { returnTo: 'Coupons' });
    });
  });

  describe('モーダルナビゲーションの統合', () => {
    it('モーダルの開閉が正しく管理される', () => {
      const ModalNavigationComponent = () => {
        const [isModalVisible, setIsModalVisible] = React.useState(false);
        const [modalType, setModalType] = React.useState(null);

        const openModal = (type) => {
          setModalType(type);
          setIsModalVisible(true);
        };

        const closeModal = () => {
          setIsModalVisible(false);
          setModalType(null);
        };

        return (
          <div>
            <div testID="modal-status">{isModalVisible ? 'visible' : 'hidden'}</div>
            <div testID="modal-type">{modalType || 'none'}</div>
            
            <button testID="open-filter-modal" onClick={() => openModal('filter')}>
              フィルターモーダル
            </button>
            <button testID="open-review-modal" onClick={() => openModal('review')}>
              レビューモーダル
            </button>
            <button testID="close-modal" onClick={closeModal}>
              モーダルを閉じる
            </button>
          </div>
        );
      };

      render(<ModalNavigationComponent />);

      // 初期状態
      expect(screen.getByTestId('modal-status')).toHaveTextContent('hidden');
      expect(screen.getByTestId('modal-type')).toHaveTextContent('none');

      // フィルターモーダルを開く
      fireEvent.click(screen.getByTestId('open-filter-modal'));
      expect(screen.getByTestId('modal-status')).toHaveTextContent('visible');
      expect(screen.getByTestId('modal-type')).toHaveTextContent('filter');

      // モーダルを閉じる
      fireEvent.click(screen.getByTestId('close-modal'));
      expect(screen.getByTestId('modal-status')).toHaveTextContent('hidden');
      expect(screen.getByTestId('modal-type')).toHaveTextContent('none');

      // レビューモーダルを開く
      fireEvent.click(screen.getByTestId('open-review-modal'));
      expect(screen.getByTestId('modal-status')).toHaveTextContent('visible');
      expect(screen.getByTestId('modal-type')).toHaveTextContent('review');
    });
  });
});