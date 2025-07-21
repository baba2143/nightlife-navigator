import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import CouponCard from '../CouponCard';

// テストデータ
const mockCoupon = {
  id: 'coupon-123',
  title: 'ドリンク1杯無料',
  description: 'お好きなドリンク1杯を無料でご提供',
  type: 'store_coupon',
  discount: '100%OFF',
  discountAmount: 800,
  conditions: ['1人1回限り', 'アルコール類は対象外'],
  validFrom: '2024-01-01',
  validTo: '2024-12-31',
  usageLimit: 100,
  usedCount: 25,
  isActive: true,
  barName: 'テストバー',
  expiryDays: 30
};

const mockProps = {
  coupon: mockCoupon,
  onPress: jest.fn(),
  onUse: jest.fn(),
  showBarName: true,
  isUsed: false,
};

describe('CouponCard コンポーネント', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('基本的なクーポン情報が正しく表示される', () => {
      render(<CouponCard {...mockProps} />);
      
      expect(screen.getByText('ドリンク1杯無料')).toBeTruthy();
      expect(screen.getByText('お好きなドリンク1杯を無料でご提供')).toBeTruthy();
      expect(screen.getByText('100%OFF')).toBeTruthy();
      expect(screen.getByText('テストバー')).toBeTruthy();
    });

    it('クーポンタイプに応じたアイコンが表示される', () => {
      const { rerender } = render(<CouponCard {...mockProps} />);
      
      // 店舗クーポン
      expect(screen.getByText('🎫')).toBeTruthy();
      
      // 雨の日クーポン
      rerender(<CouponCard {...mockProps} coupon={{ ...mockCoupon, type: 'rainy_day_coupon' }} />);
      expect(screen.getByText('☔')).toBeTruthy();
      
      // 時間限定クーポン
      rerender(<CouponCard {...mockProps} coupon={{ ...mockCoupon, type: 'time_limited_coupon' }} />);
      expect(screen.getByText('⏰')).toBeTruthy();
      
      // 誕生日クーポン
      rerender(<CouponCard {...mockProps} coupon={{ ...mockCoupon, type: 'birthday_coupon' }} />);
      expect(screen.getByText('🎂')).toBeTruthy();
      
      // リピータークーポン
      rerender(<CouponCard {...mockProps} coupon={{ ...mockCoupon, type: 'repeater_coupon' }} />);
      expect(screen.getByText('🔄')).toBeTruthy();
    });

    it('利用条件が表示される', () => {
      render(<CouponCard {...mockProps} />);
      
      expect(screen.getByText('1人1回限り')).toBeTruthy();
      expect(screen.getByText('アルコール類は対象外')).toBeTruthy();
    });

    it('有効期限が表示される', () => {
      render(<CouponCard {...mockProps} />);
      
      // 有効期限の日付が表示されることを確認
      expect(screen.getByText(/2024-12-31/)).toBeTruthy();
    });

    it('使用状況が表示される', () => {
      render(<CouponCard {...mockProps} />);
      
      // 使用状況 (25/100) が表示されることを確認
      expect(screen.getByText('25/100 使用済み')).toBeTruthy();
    });
  });

  describe('クーポンの状態', () => {
    it('アクティブなクーポンは使用可能状態で表示される', () => {
      render(<CouponCard {...mockProps} />);
      
      const useButton = screen.getByText('使用する');
      expect(useButton).toBeTruthy();
      expect(screen.queryByText('無効')).toBeNull();
    });

    it('非アクティブなクーポンは無効状態で表示される', () => {
      const inactiveCoupon = { ...mockCoupon, isActive: false };
      render(<CouponCard {...mockProps} coupon={inactiveCoupon} />);
      
      expect(screen.getByText('無効')).toBeTruthy();
      expect(screen.queryByText('使用する')).toBeNull();
    });

    it('使用済みクーポンは適切に表示される', () => {
      render(<CouponCard {...mockProps} isUsed={true} />);
      
      expect(screen.getByText('使用済み')).toBeTruthy();
      expect(screen.queryByText('使用する')).toBeNull();
    });

    it('期限切れクーポンは適切に表示される', () => {
      const expiredCoupon = { 
        ...mockCoupon, 
        validTo: '2020-12-31',
        expiryDays: -365 
      };
      render(<CouponCard {...mockProps} coupon={expiredCoupon} />);
      
      expect(screen.getByText('期限切れ')).toBeTruthy();
      expect(screen.queryByText('使用する')).toBeNull();
    });

    it('使用上限に達したクーポンは適切に表示される', () => {
      const maxUsedCoupon = { 
        ...mockCoupon, 
        usedCount: 100,
        usageLimit: 100 
      };
      render(<CouponCard {...mockProps} coupon={maxUsedCoupon} />);
      
      expect(screen.getByText('使用上限に達しました')).toBeTruthy();
      expect(screen.queryByText('使用する')).toBeNull();
    });
  });

  describe('インタラクション', () => {
    it('カードタップでonPressが呼ばれる', () => {
      render(<CouponCard {...mockProps} />);
      
      const card = screen.getByTestId('coupon-card');
      fireEvent.press(card);
      
      expect(mockProps.onPress).toHaveBeenCalledTimes(1);
      expect(mockProps.onPress).toHaveBeenCalledWith(mockCoupon);
    });

    it('使用ボタンタップでonUseが呼ばれる', () => {
      render(<CouponCard {...mockProps} />);
      
      const useButton = screen.getByText('使用する');
      fireEvent.press(useButton);
      
      expect(mockProps.onUse).toHaveBeenCalledTimes(1);
      expect(mockProps.onUse).toHaveBeenCalledWith(mockCoupon.id);
    });

    it('使用ボタンタップはカードのonPressを呼ばない', () => {
      render(<CouponCard {...mockProps} />);
      
      const useButton = screen.getByText('使用する');
      fireEvent.press(useButton);
      
      expect(mockProps.onPress).not.toHaveBeenCalled();
    });

    it('非アクティブなクーポンは使用ボタンが無効', () => {
      const inactiveCoupon = { ...mockCoupon, isActive: false };
      render(<CouponCard {...mockProps} coupon={inactiveCoupon} />);
      
      expect(screen.queryByText('使用する')).toBeNull();
    });
  });

  describe('表示オプション', () => {
    it('showBarNameがfalseの場合、店舗名は表示されない', () => {
      render(<CouponCard {...mockProps} showBarName={false} />);
      
      expect(screen.queryByText('テストバー')).toBeNull();
    });

    it('showBarNameがtrueの場合、店舗名が表示される', () => {
      render(<CouponCard {...mockProps} showBarName={true} />);
      
      expect(screen.getByText('テストバー')).toBeTruthy();
    });
  });

  describe('エッジケース', () => {
    it('条件がない場合でもクラッシュしない', () => {
      const couponWithoutConditions = { ...mockCoupon, conditions: [] };
      
      expect(() => {
        render(<CouponCard {...mockProps} coupon={couponWithoutConditions} />);
      }).not.toThrow();
    });

    it('使用上限がない場合でもクラッシュしない', () => {
      const couponWithoutLimit = { 
        ...mockCoupon, 
        usageLimit: null,
        usedCount: 25 
      };
      
      expect(() => {
        render(<CouponCard {...mockProps} coupon={couponWithoutLimit} />);
      }).not.toThrow();
    });

    it('割引情報がない場合でもクラッシュしない', () => {
      const couponWithoutDiscount = { 
        ...mockCoupon, 
        discount: null,
        discountAmount: null 
      };
      
      expect(() => {
        render(<CouponCard {...mockProps} coupon={couponWithoutDiscount} />);
      }).not.toThrow();
    });

    it('長いタイトルも正しく表示される', () => {
      const couponWithLongTitle = { 
        ...mockCoupon, 
        title: 'とても長いクーポンタイトルですがちゃんと表示されるでしょうか？さらに長くして表示をテストします' 
      };
      
      render(<CouponCard {...mockProps} coupon={couponWithLongTitle} />);
      expect(screen.getByText(couponWithLongTitle.title)).toBeTruthy();
    });
  });

  describe('プロップスのバリデーション', () => {
    it('必須プロップスがない場合でもクラッシュしない', () => {
      expect(() => {
        render(<CouponCard onPress={jest.fn()} onUse={jest.fn()} />);
      }).not.toThrow();
    });

    it('コールバック関数がない場合でもクラッシュしない', () => {
      expect(() => {
        render(<CouponCard coupon={mockCoupon} />);
      }).not.toThrow();
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なアクセシビリティプロパティが設定されている', () => {
      render(<CouponCard {...mockProps} />);
      
      const card = screen.getByTestId('coupon-card');
      expect(card.props.accessible).toBe(true);
      
      const useButton = screen.getByText('使用する');
      expect(useButton.props.accessible).toBe(true);
    });

    it('スクリーンリーダー用のラベルが設定されている', () => {
      render(<CouponCard {...mockProps} />);
      
      const card = screen.getByTestId('coupon-card');
      expect(card.props.accessibilityLabel).toContain('ドリンク1杯無料');
      
      const useButton = screen.getByText('使用する');
      expect(useButton.props.accessibilityLabel).toBeDefined();
    });

    it('クーポンの状態がアクセシビリティラベルに含まれる', () => {
      const { rerender } = render(<CouponCard {...mockProps} />);
      
      // アクティブな状態
      let card = screen.getByTestId('coupon-card');
      expect(card.props.accessibilityLabel).toContain('利用可能');
      
      // 使用済み状態
      rerender(<CouponCard {...mockProps} isUsed={true} />);
      card = screen.getByTestId('coupon-card');
      expect(card.props.accessibilityLabel).toContain('使用済み');
    });
  });

  describe('視覚的フィードバック', () => {
    it('利用可能なクーポンは適切なスタイルが適用される', () => {
      render(<CouponCard {...mockProps} />);
      
      const card = screen.getByTestId('coupon-card');
      expect(card.props.style).toBeDefined();
    });

    it('使用済みクーポンは異なるスタイルが適用される', () => {
      render(<CouponCard {...mockProps} isUsed={true} />);
      
      const card = screen.getByTestId('coupon-card');
      expect(card.props.style).toBeDefined();
    });
  });
});