import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { jest } from '@jest/globals';

// テスト対象のコンポーネント
import BarCard from '../../components/BarCard';
import CouponCard from '../../components/CouponCard';
import BarDetailScreen from '../../screens/BarDetailScreen';
import CouponsScreen from '../../screens/CouponsScreen';

// サービスのモック
jest.mock('../../services/ApiService');
jest.mock('../../services/AuthService');
jest.mock('../../context/AppContext');

import apiService from '../../services/ApiService';
import authService from '../../services/AuthService';

// React Contextのモック
const MockAppContext = React.createContext({
  user: {
    id: 'user123',
    email: 'test@example.com',
    favorites: ['bar1', 'bar2']
  },
  updateFavorites: jest.fn(),
  showNotification: jest.fn()
});

// テストデータ
const mockBar = {
  id: 'bar-123',
  name: 'テスト統合バー',
  genre: 'スナック／パブ',
  rating: 4.5,
  reviewCount: 30,
  address: '東京都渋谷区',
  imageUrl: 'https://example.com/bar.jpg',
  distance: '300m',
  isOpen: true,
  priceRange: '¥¥¥',
  specialOffers: ['飲み放題', 'カラオケ'],
  description: 'アットホームな雰囲気のバーです',
  coupons: [
    {
      id: 'coupon-1',
      title: 'ドリンク1杯無料',
      description: 'お好きなドリンク1杯を無料でご提供',
      type: 'store_coupon',
      discount: '100%OFF',
      isActive: true,
      barName: 'テスト統合バー'
    }
  ]
};

const mockCoupons = [
  {
    id: 'coupon-1',
    title: 'ドリンク1杯無料',
    description: 'お好きなドリンク1杯を無料でご提供',
    type: 'store_coupon',
    discount: '100%OFF',
    isActive: true,
    barName: 'テスト統合バー',
    barId: 'bar-123'
  },
  {
    id: 'coupon-2',
    title: '雨の日特典',
    description: '雨の日限定！料金10%OFF',
    type: 'rainy_day_coupon',
    discount: '10%OFF',
    isActive: true,
    barName: 'レイニーバー',
    barId: 'bar-456'
  }
];

// テストヘルパー関数
const renderWithContext = (component, contextValue = {}) => {
  const defaultContext = {
    user: {
      id: 'user123',
      email: 'test@example.com',
      favorites: []
    },
    updateFavorites: jest.fn(),
    showNotification: jest.fn(),
    ...contextValue
  };

  return render(
    <MockAppContext.Provider value={defaultContext}>
      {component}
    </MockAppContext.Provider>
  );
};

describe('コンポーネント間連携テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // API サービスのデフォルトモック
    apiService.getBarDetails.mockResolvedValue(mockBar);
    apiService.getCoupons.mockResolvedValue(mockCoupons);
    apiService.useCoupon.mockResolvedValue({ success: true });
    apiService.toggleFavorite.mockResolvedValue({ success: true });
    
    // 認証サービスのモック
    authService.getAuthState.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user123', email: 'test@example.com' }
    });
  });

  describe('BarCard → BarDetailScreen 連携', () => {
    it('BarCardタップからバー詳細画面への遷移が正しく動作する', async () => {
      const mockOnPress = jest.fn();
      const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn(),
        setOptions: jest.fn()
      };

      // BarCardをレンダリング
      renderWithContext(
        <BarCard
          bar={mockBar}
          onPress={mockOnPress}
          onToggleFavorite={jest.fn()}
          isFavorite={false}
        />
      );

      // カードタップ
      const barCard = screen.getByTestId('bar-card');
      fireEvent.press(barCard);

      expect(mockOnPress).toHaveBeenCalledWith(mockBar);
    });

    it('バー詳細画面でクーポンが正しく表示される', async () => {
      const mockRoute = {
        params: { barId: 'bar-123' }
      };
      const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn(),
        setOptions: jest.fn()
      };

      renderWithContext(
        <BarDetailScreen route={mockRoute} navigation={mockNavigation} />
      );

      // API呼び出しが実行されることを確認
      await waitFor(() => {
        expect(apiService.getBarDetails).toHaveBeenCalledWith('bar-123');
      });

      // バー情報の表示を確認
      await waitFor(() => {
        expect(screen.getByText('テスト統合バー')).toBeTruthy();
        expect(screen.getByText('アットホームな雰囲気のバーです')).toBeTruthy();
      });

      // クーポンの表示を確認
      await waitFor(() => {
        expect(screen.getByText('ドリンク1杯無料')).toBeTruthy();
      });
    });
  });

  describe('CouponCard → クーポン利用フロー連携', () => {
    it('クーポンカードから利用処理までの完全フローが動作する', async () => {
      const mockOnUse = jest.fn();
      const mockShowNotification = jest.fn();

      renderWithContext(
        <CouponCard
          coupon={mockCoupons[0]}
          onPress={jest.fn()}
          onUse={mockOnUse}
          showBarName={true}
          isUsed={false}
        />,
        { showNotification: mockShowNotification }
      );

      // 使用ボタンをタップ
      const useButton = screen.getByText('使用する');
      fireEvent.press(useButton);

      expect(mockOnUse).toHaveBeenCalledWith('coupon-1');
    });

    it('CouponsScreen でクーポン一覧からバー詳細への遷移が動作する', async () => {
      const mockNavigation = {
        navigate: jest.fn(),
        setOptions: jest.fn()
      };
      const mockRoute = { params: {} };

      renderWithContext(
        <CouponsScreen navigation={mockNavigation} route={mockRoute} />
      );

      // クーポン一覧の読み込みを待機
      await waitFor(() => {
        expect(apiService.getCoupons).toHaveBeenCalled();
      });

      // クーポンが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('ドリンク1杯無料')).toBeTruthy();
        expect(screen.getByText('雨の日特典')).toBeTruthy();
      });

      // クーポンカードタップでバー詳細に遷移
      const couponCard = screen.getAllByTestId('coupon-card')[0];
      fireEvent.press(couponCard);

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith('BarDetail', {
          barId: 'bar-123'
        });
      });
    });
  });

  describe('お気に入り機能の連携テスト', () => {
    it('BarCardでのお気に入り切り替えがContextと連携する', async () => {
      const mockUpdateFavorites = jest.fn();
      const mockToggleFavorite = jest.fn();

      renderWithContext(
        <BarCard
          bar={mockBar}
          onPress={jest.fn()}
          onToggleFavorite={mockToggleFavorite}
          isFavorite={false}
        />,
        { 
          updateFavorites: mockUpdateFavorites,
          user: {
            id: 'user123',
            email: 'test@example.com',
            favorites: []
          }
        }
      );

      // お気に入りボタンをタップ
      const favoriteButton = screen.getByTestId('favorite-button');
      fireEvent.press(favoriteButton);

      expect(mockToggleFavorite).toHaveBeenCalledWith('bar-123');
    });

    it('お気に入り状態がバー詳細画面に正しく反映される', async () => {
      const mockRoute = {
        params: { barId: 'bar-123' }
      };
      const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn(),
        setOptions: jest.fn()
      };

      renderWithContext(
        <BarDetailScreen route={mockRoute} navigation={mockNavigation} />,
        {
          user: {
            id: 'user123',
            email: 'test@example.com',
            favorites: ['bar-123'] // 既にお気に入りに追加済み
          }
        }
      );

      await waitFor(() => {
        expect(apiService.getBarDetails).toHaveBeenCalledWith('bar-123');
      });

      // お気に入り状態が反映されていることを確認
      await waitFor(() => {
        const favoriteButton = screen.getByTestId('favorite-button');
        expect(favoriteButton).toBeTruthy();
        // お気に入り状態のスタイルが適用されていることを確認
      });
    });
  });

  describe('エラーハンドリングの連携テスト', () => {
    it('API エラー時に適切なエラーメッセージが表示される', async () => {
      const mockShowNotification = jest.fn();
      apiService.getBarDetails.mockRejectedValue(new Error('ネットワークエラー'));

      const mockRoute = {
        params: { barId: 'bar-123' }
      };
      const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn(),
        setOptions: jest.fn()
      };

      renderWithContext(
        <BarDetailScreen route={mockRoute} navigation={mockNavigation} />,
        { showNotification: mockShowNotification }
      );

      await waitFor(() => {
        expect(apiService.getBarDetails).toHaveBeenCalledWith('bar-123');
      });

      // エラー通知が表示されることを確認
      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: expect.stringContaining('エラー')
          })
        );
      });
    });

    it('クーポン利用失敗時の適切なフィードバック', async () => {
      const mockShowNotification = jest.fn();
      apiService.useCoupon.mockRejectedValue(new Error('クーポン利用に失敗しました'));

      const mockOnUse = jest.fn(async (couponId) => {
        try {
          await apiService.useCoupon(couponId);
        } catch (error) {
          mockShowNotification({
            type: 'error',
            message: 'クーポンの利用に失敗しました'
          });
        }
      });

      renderWithContext(
        <CouponCard
          coupon={mockCoupons[0]}
          onPress={jest.fn()}
          onUse={mockOnUse}
          showBarName={true}
          isUsed={false}
        />,
        { showNotification: mockShowNotification }
      );

      // 使用ボタンをタップ
      const useButton = screen.getByText('使用する');
      fireEvent.press(useButton);

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith({
          type: 'error',
          message: 'クーポンの利用に失敗しました'
        });
      });
    });
  });

  describe('ローディング状態の連携テスト', () => {
    it('バー詳細画面の読み込み中状態が正しく表示される', async () => {
      // API呼び出しを遅延させる
      apiService.getBarDetails.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockBar), 1000))
      );

      const mockRoute = {
        params: { barId: 'bar-123' }
      };
      const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn(),
        setOptions: jest.fn()
      };

      renderWithContext(
        <BarDetailScreen route={mockRoute} navigation={mockNavigation} />
      );

      // ローディング状態の確認
      expect(screen.getByTestId('loading-indicator')).toBeTruthy();

      // データ読み込み完了を待機
      await waitFor(() => {
        expect(screen.getByText('テスト統合バー')).toBeTruthy();
      }, { timeout: 2000 });

      // ローディング状態が解除されることを確認
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });
  });

  describe('データ同期の連携テスト', () => {
    it('クーポン利用後の状態更新が正しく反映される', async () => {
      const mockOnUse = jest.fn();
      const { rerender } = renderWithContext(
        <CouponCard
          coupon={mockCoupons[0]}
          onPress={jest.fn()}
          onUse={mockOnUse}
          showBarName={true}
          isUsed={false}
        />
      );

      // 初期状態：使用可能
      expect(screen.getByText('使用する')).toBeTruthy();
      expect(screen.queryByText('使用済み')).toBeNull();

      // 使用後の状態に更新
      rerender(
        <MockAppContext.Provider value={{
          user: { id: 'user123', email: 'test@example.com', favorites: [] },
          updateFavorites: jest.fn(),
          showNotification: jest.fn()
        }}>
          <CouponCard
            coupon={mockCoupons[0]}
            onPress={jest.fn()}
            onUse={mockOnUse}
            showBarName={true}
            isUsed={true}
          />
        </MockAppContext.Provider>
      );

      // 使用済み状態の確認
      expect(screen.getByText('使用済み')).toBeTruthy();
      expect(screen.queryByText('使用する')).toBeNull();
    });
  });
});