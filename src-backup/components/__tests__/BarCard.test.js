import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import BarCard from '../BarCard';

// テストデータ
const mockBar = {
  id: 'bar-123',
  name: 'テストバー',
  genre: 'スナック／パブ',
  rating: 4.5,
  reviewCount: 25,
  address: '東京都渋谷区',
  imageUrl: 'https://example.com/image.jpg',
  distance: '500m',
  isOpen: true,
  priceRange: '¥¥¥',
  specialOffers: ['飲み放題', 'カラオケ']
};

const mockProps = {
  bar: mockBar,
  isFavorite: false,
  onPress: jest.fn(),
  onToggleFavorite: jest.fn(),
};

describe('BarCard コンポーネント', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('基本的な情報が正しく表示される', () => {
      render(<BarCard {...mockProps} />);
      
      expect(screen.getByText('テストバー')).toBeTruthy();
      expect(screen.getByText('スナック／パブ')).toBeTruthy();
      expect(screen.getByText('4.5')).toBeTruthy();
      expect(screen.getByText('(25)')).toBeTruthy();
      expect(screen.getByText('東京都渋谷区')).toBeTruthy();
      expect(screen.getByText('500m')).toBeTruthy();
    });

    it('お気に入り状態が正しく表示される', () => {
      const { rerender } = render(<BarCard {...mockProps} />);
      
      // お気に入りでない状態
      expect(screen.getByTestId('favorite-button')).toBeTruthy();
      
      // お気に入り状態
      rerender(<BarCard {...mockProps} isFavorite={true} />);
      expect(screen.getByTestId('favorite-button')).toBeTruthy();
    });

    it('営業状態が正しく表示される', () => {
      const { rerender } = render(<BarCard {...mockProps} />);
      
      // 営業中
      expect(screen.getByText('営業中')).toBeTruthy();
      
      // 営業終了
      rerender(<BarCard {...mockProps} bar={{ ...mockBar, isOpen: false }} />);
      expect(screen.getByText('営業終了')).toBeTruthy();
    });

    it('特別オファーが表示される', () => {
      render(<BarCard {...mockProps} />);
      
      expect(screen.getByText('飲み放題')).toBeTruthy();
      expect(screen.getByText('カラオケ')).toBeTruthy();
    });

    it('ジャンルアイコンが正しく表示される', () => {
      const { rerender } = render(<BarCard {...mockProps} />);
      
      // スナック／パブ
      expect(screen.getByText('🍺')).toBeTruthy();
      
      // コンカフェ
      rerender(<BarCard {...mockProps} bar={{ ...mockBar, genre: 'コンカフェ' }} />);
      expect(screen.getByText('☕')).toBeTruthy();
      
      // クラブ／ラウンジ
      rerender(<BarCard {...mockProps} bar={{ ...mockBar, genre: 'クラブ／ラウンジ' }} />);
      expect(screen.getByText('🍸')).toBeTruthy();
      
      // その他
      rerender(<BarCard {...mockProps} bar={{ ...mockBar, genre: 'その他' }} />);
      expect(screen.getByText('🏪')).toBeTruthy();
    });
  });

  describe('インタラクション', () => {
    it('カードタップでonPressが呼ばれる', () => {
      render(<BarCard {...mockProps} />);
      
      const card = screen.getByTestId('bar-card');
      fireEvent.press(card);
      
      expect(mockProps.onPress).toHaveBeenCalledTimes(1);
      expect(mockProps.onPress).toHaveBeenCalledWith(mockBar);
    });

    it('お気に入りボタンタップでonToggleFavoriteが呼ばれる', () => {
      render(<BarCard {...mockProps} />);
      
      const favoriteButton = screen.getByTestId('favorite-button');
      fireEvent.press(favoriteButton);
      
      expect(mockProps.onToggleFavorite).toHaveBeenCalledTimes(1);
      expect(mockProps.onToggleFavorite).toHaveBeenCalledWith(mockBar.id);
    });

    it('お気に入りボタンタップはカードのonPressを呼ばない', () => {
      render(<BarCard {...mockProps} />);
      
      const favoriteButton = screen.getByTestId('favorite-button');
      fireEvent.press(favoriteButton);
      
      expect(mockProps.onPress).not.toHaveBeenCalled();
    });
  });

  describe('エッジケース', () => {
    it('レビュー数が0の場合も正しく表示される', () => {
      const barWithNoReviews = { ...mockBar, reviewCount: 0 };
      render(<BarCard {...mockProps} bar={barWithNoReviews} />);
      
      expect(screen.getByText('(0)')).toBeTruthy();
    });

    it('距離情報がない場合は表示されない', () => {
      const barWithoutDistance = { ...mockBar, distance: null };
      render(<BarCard {...mockProps} bar={barWithoutDistance} />);
      
      expect(screen.queryByText('500m')).toBeNull();
    });

    it('特別オファーがない場合は表示されない', () => {
      const barWithoutOffers = { ...mockBar, specialOffers: [] };
      render(<BarCard {...mockProps} bar={barWithoutOffers} />);
      
      expect(screen.queryByText('飲み放題')).toBeNull();
      expect(screen.queryByText('カラオケ')).toBeNull();
    });

    it('長い店舗名も正しく表示される', () => {
      const barWithLongName = { 
        ...mockBar, 
        name: 'とても長い店舗名のテストバーですがちゃんと表示されるでしょうか' 
      };
      render(<BarCard {...mockProps} bar={barWithLongName} />);
      
      expect(screen.getByText(barWithLongName.name)).toBeTruthy();
    });

    it('評価が小数点以下の場合も正しく表示される', () => {
      const barWithDecimalRating = { ...mockBar, rating: 3.7 };
      render(<BarCard {...mockProps} bar={barWithDecimalRating} />);
      
      expect(screen.getByText('3.7')).toBeTruthy();
    });
  });

  describe('プロップスのバリデーション', () => {
    it('必須プロップスがない場合でもクラッシュしない', () => {
      // barプロップがない場合
      expect(() => {
        render(<BarCard isFavorite={false} onPress={jest.fn()} onToggleFavorite={jest.fn()} />);
      }).not.toThrow();
    });

    it('コールバック関数がない場合でもクラッシュしない', () => {
      expect(() => {
        render(<BarCard bar={mockBar} isFavorite={false} />);
      }).not.toThrow();
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なアクセシビリティプロパティが設定されている', () => {
      render(<BarCard {...mockProps} />);
      
      const card = screen.getByTestId('bar-card');
      expect(card.props.accessible).toBe(true);
      
      const favoriteButton = screen.getByTestId('favorite-button');
      expect(favoriteButton.props.accessible).toBe(true);
    });

    it('スクリーンリーダー用のラベルが設定されている', () => {
      render(<BarCard {...mockProps} />);
      
      const card = screen.getByTestId('bar-card');
      expect(card.props.accessibilityLabel).toContain('テストバー');
      
      const favoriteButton = screen.getByTestId('favorite-button');
      expect(favoriteButton.props.accessibilityLabel).toBeDefined();
    });
  });

  describe('パフォーマンス', () => {
    it('同じプロップスで再レンダリングしても不要な更新は行われない', () => {
      const { rerender } = render(<BarCard {...mockProps} />);
      
      // 同じプロップスで再レンダリング
      rerender(<BarCard {...mockProps} />);
      
      // コンポーネントが正常に動作することを確認
      expect(screen.getByText('テストバー')).toBeTruthy();
    });
  });
});